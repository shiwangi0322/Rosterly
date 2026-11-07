import { prisma } from '../config/prisma.js'
import { HttpError, pageParams, pageResult } from '../utils/http.js'
import { asDate } from '../utils/dates.js'
import { mapShift, shiftInclude } from '../services/mappers.js'
import { loadContext, logActivity } from '../services/context.js'
import { validateShift } from '../services/scheduling.js'

async function assertValid(draft, editingId) {
  const ctx = await loadContext()
  const error = validateShift(draft, ctx.shifts, ctx, editingId)
  if (error) throw new HttpError(409, error)
  const process = ctx.processes.find((p) => p.code === draft.processCode)
  if (!process) throw new HttpError(400, 'Process does not exist.')
  return process
}

function dataFrom(body, process) {
  return {
    employeeId: body.employeeId,
    brandId: body.brandId,
    processId: process.id,
    date: asDate(body.date),
    startTime: body.start,
    endTime: body.end,
    breakMinutes: body.breakMinutes,
    type: body.type,
    status: body.status || 'scheduled',
    notes: body.notes || '',
  }
}

export async function listShifts(req, res) {
  const { page, limit, skip, order } = pageParams(req.query)
  const where = {
    ...(req.query.employeeId ? { employeeId: String(req.query.employeeId) } : {}),
    ...(req.query.brandId ? { brandId: String(req.query.brandId) } : {}),
    ...(req.query.status ? { status: String(req.query.status) } : {}),
    ...(req.query.from || req.query.to
      ? {
          date: {
            ...(req.query.from ? { gte: asDate(String(req.query.from)) } : {}),
            ...(req.query.to ? { lte: asDate(String(req.query.to)) } : {}),
          },
        }
      : {}),
  }
  const [total, rows] = await prisma.$transaction([
    prisma.shift.count({ where }),
    prisma.shift.findMany({
      where,
      include: shiftInclude,
      orderBy: [{ date: order }, { startTime: 'asc' }],
      skip,
      take: limit,
    }),
  ])
  res.json(pageResult(rows.map(mapShift), total, page, limit))
}

export async function getShift(req, res) {
  const row = await prisma.shift.findUnique({ where: { id: req.params.id }, include: shiftInclude })
  if (!row) throw new HttpError(404, 'Shift not found.')
  res.json(mapShift(row))
}

export async function createShift(req, res) {
  const process = await assertValid(req.body, null)
  const id = req.body.id || `SH-${Date.now().toString(36)}`
  const row = await prisma.shift.create({ data: { id, ...dataFrom(req.body, process) }, include: shiftInclude })
  await logActivity(req.admin.name, 'shift.created', `Shift ${row.id} on ${req.body.date}.`)
  res.status(201).json(mapShift(row))
}

export async function updateShift(req, res) {
  const existing = await prisma.shift.findUnique({ where: { id: req.params.id } })
  if (!existing) throw new HttpError(404, 'Shift not found.')
  const process = await assertValid({ ...req.body, id: existing.id }, existing.id)
  const row = await prisma.shift.update({
    where: { id: existing.id },
    data: dataFrom(req.body, process),
    include: shiftInclude,
  })
  await logActivity(req.admin.name, 'shift.updated', `Shift ${row.id} updated.`)
  res.json(mapShift(row))
}

export async function deleteShift(req, res) {
  const existing = await prisma.shift.findUnique({ where: { id: req.params.id } })
  if (!existing) throw new HttpError(404, 'Shift not found.')
  await prisma.shift.update({
    where: { id: existing.id },
    data: { status: 'cancelled', notes: existing.notes ? `${existing.notes} Cancelled.` : 'Cancelled.' },
  })
  await logActivity(req.admin.name, 'shift.cancelled', `Shift ${existing.id} cancelled.`)
  res.status(204).end()
}
