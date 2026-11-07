import { prisma } from '../config/prisma.js'
import { HttpError, pageParams, pageResult } from '../utils/http.js'
import { mapPod } from '../services/mappers.js'
import { logActivity } from '../services/context.js'

const include = { brands: { select: { id: true } }, employees: { select: { id: true } } }

export async function listPods(req, res) {
  const { page, limit, skip, order, search } = pageParams(req.query)
  const where = search ? { name: { contains: search, mode: 'insensitive' } } : {}
  const [total, rows] = await prisma.$transaction([
    prisma.pod.count({ where }),
    prisma.pod.findMany({ where, include, orderBy: { name: order }, skip, take: limit }),
  ])
  res.json(pageResult(rows.map(mapPod), total, page, limit))
}

export async function getPod(req, res) {
  const row = await prisma.pod.findUnique({ where: { id: req.params.id }, include })
  if (!row) throw new HttpError(404, 'Pod not found.')
  res.json(mapPod(row))
}

export async function createPod(req, res) {
  const body = req.body
  if (body.leadId) {
    const lead = await prisma.employee.findUnique({ where: { id: body.leadId } })
    if (!lead) throw new HttpError(400, 'Lead employee does not exist.')
  }
  const id = body.id || `POD-${Date.now().toString(36).toUpperCase()}`
  const row = await prisma.pod.create({
    data: { id, name: body.name, short: body.short, description: body.description, leadId: body.leadId || null },
    include,
  })
  await logActivity(req.admin.name, 'pod.created', `${row.name} added.`)
  res.status(201).json(mapPod(row))
}

export async function updatePod(req, res) {
  const existing = await prisma.pod.findUnique({ where: { id: req.params.id } })
  if (!existing) throw new HttpError(404, 'Pod not found.')
  if (req.body.leadId) {
    const lead = await prisma.employee.findUnique({ where: { id: req.body.leadId } })
    if (!lead) throw new HttpError(400, 'Lead employee does not exist.')
  }
  const row = await prisma.pod.update({
    where: { id: existing.id },
    data: {
      name: req.body.name,
      short: req.body.short,
      description: req.body.description,
      leadId: req.body.leadId || null,
    },
    include,
  })
  await logActivity(req.admin.name, 'pod.updated', `${row.name} updated.`)
  res.json(mapPod(row))
}

export async function deletePod(req, res) {
  const existing = await prisma.pod.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { employees: true, brands: true } } },
  })
  if (!existing) throw new HttpError(404, 'Pod not found.')
  if (existing._count.employees || existing._count.brands) {
    throw new HttpError(409, 'Move employees and brands out of this pod before deleting it.')
  }
  await prisma.pod.delete({ where: { id: existing.id } })
  await logActivity(req.admin.name, 'pod.deleted', `${existing.name} removed.`)
  res.status(204).end()
}
