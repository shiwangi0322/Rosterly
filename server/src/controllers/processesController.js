import { prisma } from '../config/prisma.js'
import { HttpError, pageParams, pageResult } from '../utils/http.js'
import { mapProcess, processInclude } from '../services/mappers.js'
import { logActivity } from '../services/context.js'

async function brandLinks(brandIds) {
  const brands = await prisma.brand.findMany({ where: { id: { in: brandIds } } })
  if (brands.length !== new Set(brandIds).size) throw new HttpError(400, 'One or more brands do not exist.')
  return brands
}

export async function listProcesses(req, res) {
  const { page, limit, skip, order, search } = pageParams(req.query)
  const where = search
    ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }] }
    : {}
  const [total, rows] = await prisma.$transaction([
    prisma.process.count({ where }),
    prisma.process.findMany({ where, include: processInclude, orderBy: { name: order }, skip, take: limit }),
  ])
  res.json(pageResult(rows.map(mapProcess), total, page, limit))
}

export async function getProcess(req, res) {
  const row = await prisma.process.findUnique({ where: { id: req.params.id }, include: processInclude })
  if (!row) throw new HttpError(404, 'Process not found.')
  res.json(mapProcess(row))
}

export async function createProcess(req, res) {
  const body = req.body
  const brands = await brandLinks(body.brandIds)
  const id = body.id || `PR-${body.code.toUpperCase()}`
  const row = await prisma.process.create({
    data: {
      id,
      code: body.code.toUpperCase(),
      name: body.name,
      description: body.description,
      requiredStaff: body.requiredStaff,
      shiftTypes: body.shiftTypes,
      defaultStart: body.defaultStart,
      defaultEnd: body.defaultEnd,
      brands: { create: brands.map((brand) => ({ brandId: brand.id })) },
    },
    include: processInclude,
  })
  await logActivity(req.admin.name, 'process.created', `${row.name} added.`)
  res.status(201).json(mapProcess(row))
}

export async function updateProcess(req, res) {
  const existing = await prisma.process.findUnique({ where: { id: req.params.id } })
  if (!existing) throw new HttpError(404, 'Process not found.')
  const body = req.body
  const brands = await brandLinks(body.brandIds)
  const row = await prisma.$transaction(async (tx) => {
    await tx.brandProcess.deleteMany({ where: { processId: existing.id } })
    return tx.process.update({
      where: { id: existing.id },
      data: {
        code: body.code.toUpperCase(),
        name: body.name,
        description: body.description,
        requiredStaff: body.requiredStaff,
        shiftTypes: body.shiftTypes,
        defaultStart: body.defaultStart,
        defaultEnd: body.defaultEnd,
        brands: { create: brands.map((brand) => ({ brandId: brand.id })) },
      },
      include: processInclude,
    })
  })
  await logActivity(req.admin.name, 'process.updated', `${row.name} updated.`)
  res.json(mapProcess(row))
}

export async function deleteProcess(req, res) {
  const existing = await prisma.process.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { shifts: true, employees: true } } },
  })
  if (!existing) throw new HttpError(404, 'Process not found.')
  if (existing._count.shifts || existing._count.employees) {
    throw new HttpError(409, 'Employees or shifts still use this process.')
  }
  await prisma.process.delete({ where: { id: existing.id } })
  await logActivity(req.admin.name, 'process.deleted', `${existing.name} removed.`)
  res.status(204).end()
}
