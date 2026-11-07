import { prisma } from '../config/prisma.js'
import { asDate } from '../utils/dates.js'
import { HttpError } from '../utils/http.js'
import { loadContext, logActivity } from '../services/context.js'
import { detectConflicts, generateRoster, validateShift } from '../services/scheduling.js'
import { mapShift, shiftInclude } from '../services/mappers.js'

export async function generate(req, res) {
  if (req.body.to < req.body.from) throw new HttpError(400, 'End date must be on or after the start date.')
  const ctx = await loadContext()
  const brands = req.body.brandIds?.length ? ctx.brands.filter((b) => req.body.brandIds.includes(b.id)) : ctx.brands
  const plan = generateRoster({ ...ctx, brands, from: req.body.from, to: req.body.to })

  const saved = await prisma.$transaction(async (tx) => {
    const existing = await tx.shift.findMany({ include: shiftInclude })
    const live = existing.map(mapShift)
    const rows = []
    for (const draft of plan.created) {
      const error = validateShift(draft, live, ctx, null)
      if (error) {
        const failure = new HttpError(409, 'Roster generation was rolled back because a shift failed a final check.', {
          reason: error,
          draft,
        })
        throw failure
      }
      const process = ctx.processes.find((p) => p.code === draft.processCode)
      const row = await tx.shift.create({
        data: {
          id: draft.id,
          employeeId: draft.employeeId,
          brandId: draft.brandId,
          processId: process.id,
          date: asDate(draft.date),
          startTime: draft.start,
          endTime: draft.end,
          breakMinutes: draft.breakMinutes,
          type: draft.type,
          status: 'scheduled',
          notes: draft.notes,
        },
        include: shiftInclude,
      })
      live.push(mapShift(row))
      rows.push(mapShift(row))
    }
    return rows
  })

  const after = await loadContext()
  const conflicts = detectConflicts({ ...after, from: req.body.from, to: req.body.to }).filter((c) =>
    saved.some((s) => c.shiftIds?.includes(s.id) || (c.brandId && c.date >= req.body.from && c.date <= req.body.to && c.type !== 'missing' && c.type !== 'understaffing')),
  )

  await logActivity(req.admin.name, 'roster.generated', `${saved.length} shifts created, ${plan.unresolved.length} gaps left.`)
  if (plan.unresolved.length) {
    await prisma.notification.create({
      data: {
        title: 'Coverage still open',
        body: `${plan.unresolved.length} brand-day gaps could not be filled from ${req.body.from} to ${req.body.to}.`,
        kind: 'coverage',
      },
    })
  }

  res.status(201).json({
    created: saved,
    unresolved: plan.unresolved,
    rejections: plan.rejections,
    conflicts,
  })
}

export async function listConflicts(req, res) {
  const ctx = await loadContext()
  const from = req.query.from ? String(req.query.from) : undefined
  const to = req.query.to ? String(req.query.to) : undefined
  const dismissed = new Set((await prisma.dismissedConflict.findMany()).map((d) => d.id))
  let items = detectConflicts({ ...ctx, from, to })
  if (req.query.type) items = items.filter((c) => c.type === req.query.type)
  if (req.query.severity) items = items.filter((c) => c.severity === req.query.severity)
  items = items.filter((c) => !dismissed.has(c.id))
  res.json({ data: items, total: items.length })
}

export async function dismissConflict(req, res) {
  await prisma.dismissedConflict.upsert({
    where: { id: req.params.id },
    create: { id: req.params.id },
    update: {},
  })
  res.status(204).end()
}
