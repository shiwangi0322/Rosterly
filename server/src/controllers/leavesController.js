import { prisma } from '../config/prisma.js'
import { HttpError, pageParams, pageResult } from '../utils/http.js'
import { asDate, toIsoDate } from '../utils/dates.js'
import { mapLeave } from '../services/mappers.js'
import { logActivity } from '../services/context.js'

export async function listLeaves(req, res) {
  const { page, limit, skip, order } = pageParams(req.query)
  const where = {
    ...(req.query.employeeId ? { employeeId: String(req.query.employeeId) } : {}),
    ...(req.query.status ? { status: String(req.query.status) } : {}),
    ...(req.query.type ? { type: String(req.query.type) } : {}),
  }
  const [total, rows] = await prisma.$transaction([
    prisma.leaveRequest.count({ where }),
    prisma.leaveRequest.findMany({ where, orderBy: { appliedOn: order }, skip, take: limit }),
  ])
  res.json(pageResult(rows.map(mapLeave), total, page, limit))
}

export async function getLeave(req, res) {
  const row = await prisma.leaveRequest.findUnique({ where: { id: req.params.id } })
  if (!row) throw new HttpError(404, 'Leave request not found.')
  res.json(mapLeave(row))
}

export async function applyLeave(req, res) {
  if (req.body.to < req.body.from) throw new HttpError(400, 'End date must be on or after the start date.')
  const employee = await prisma.employee.findUnique({ where: { id: req.body.employeeId } })
  if (!employee) throw new HttpError(400, 'Employee does not exist.')
  const id = `LV-${Date.now().toString(36).toUpperCase()}`
  const row = await prisma.leaveRequest.create({
    data: {
      id,
      employeeId: employee.id,
      type: req.body.type,
      status: 'pending',
      startDate: asDate(req.body.from),
      endDate: asDate(req.body.to),
      reason: req.body.reason,
      appliedOn: asDate(new Date().toISOString().slice(0, 10)),
    },
  })
  await logActivity(req.admin.name, 'leave.applied', `${employee.name} applied for ${req.body.type} leave.`)
  res.status(201).json(mapLeave(row))
}

async function decide(req, status) {
  const existing = await prisma.leaveRequest.findUnique({ where: { id: req.params.id }, include: { employee: true } })
  if (!existing) throw new HttpError(404, 'Leave request not found.')
  if (existing.status === 'cancelled') throw new HttpError(409, 'A cancelled request cannot be decided again.')
  if (status !== 'cancelled' && existing.status !== 'pending') {
    throw new HttpError(409, `This request is already ${existing.status}.`)
  }
  const result = await prisma.$transaction(async (tx) => {
    const leave = await tx.leaveRequest.update({
      where: { id: existing.id },
      data: { status, decidedAt: new Date(), decidedBy: req.admin.email },
    })
    let cancelledShifts = []
    if (status === 'approved') {
      const overlapping = await tx.shift.findMany({
        where: {
          employeeId: existing.employeeId,
          status: 'scheduled',
          date: { gte: existing.startDate, lte: existing.endDate },
        },
      })
      if (overlapping.length) {
        await tx.shift.updateMany({
          where: { id: { in: overlapping.map((s) => s.id) } },
          data: { status: 'cancelled', notes: `Cancelled because leave ${existing.id} was approved.` },
        })
        cancelledShifts = overlapping.map((s) => s.id)
      }
    }
    return { leave, cancelledShifts }
  })
  await logActivity(req.admin.name, `leave.${status}`, `${existing.employee.name} leave ${existing.id} ${status}.`)
  if (status === 'approved') {
    await prisma.notification.create({
      data: {
        title: 'Leave approved',
        body: `${existing.employee.name}: ${toIsoDate(existing.startDate)} to ${toIsoDate(existing.endDate)}.`,
        kind: 'leave',
      },
    })
  }
  return { ...mapLeave(result.leave), cancelledShiftIds: result.cancelledShifts }
}

export async function approveLeave(req, res) {
  res.json(await decide(req, 'approved'))
}

export async function rejectLeave(req, res) {
  res.json(await decide(req, 'rejected'))
}

export async function cancelLeave(req, res) {
  res.json(await decide(req, 'cancelled'))
}
