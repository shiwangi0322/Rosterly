import { prisma } from '../config/prisma.js'
import { HttpError, pageParams, pageResult } from '../utils/http.js'
import { brandInclude, mapBrand } from '../services/mappers.js'
import { logActivity } from '../services/context.js'

async function linkProcesses(codes) {
  const rows = await prisma.process.findMany({ where: { code: { in: codes } } })
  if (rows.length !== new Set(codes).size) throw new HttpError(400, 'One or more process codes do not exist.')
  return rows
}

export async function listBrands(req, res) {
  const { page, limit, skip, order, search } = pageParams(req.query)
  const where = {
    ...(req.query.podId ? { podId: String(req.query.podId) } : {}),
    ...(req.query.singleResource === 'true' ? { singleResource: true } : {}),
    ...(req.query.singleResource === 'false' ? { singleResource: false } : {}),
    ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { category: { contains: search, mode: 'insensitive' } }] } : {}),
  }
  const [total, rows] = await prisma.$transaction([
    prisma.brand.count({ where }),
    prisma.brand.findMany({ where, include: brandInclude, orderBy: { name: order }, skip, take: limit }),
  ])
  res.json(pageResult(rows.map(mapBrand), total, page, limit))
}

export async function getBrand(req, res) {
  const row = await prisma.brand.findUnique({ where: { id: req.params.id }, include: brandInclude })
  if (!row) throw new HttpError(404, 'Brand not found.')
  res.json(mapBrand(row))
}

export async function createBrand(req, res) {
  const body = req.body
  const pod = await prisma.pod.findUnique({ where: { id: body.podId } })
  if (!pod) throw new HttpError(400, 'Pod does not exist.')
  const processes = await linkProcesses(body.processCodes)
  const id = body.id || `BR-${Date.now().toString(36).toUpperCase()}`
  const row = await prisma.brand.create({
    data: {
      id,
      name: body.name,
      category: body.category,
      podId: body.podId,
      minCoverage: body.minCoverage,
      singleResource: body.singleResource,
      processes: { create: processes.map((process) => ({ processId: process.id })) },
    },
    include: brandInclude,
  })
  await logActivity(req.admin.name, 'brand.created', `${row.name} added.`)
  res.status(201).json(mapBrand(row))
}

export async function updateBrand(req, res) {
  const existing = await prisma.brand.findUnique({ where: { id: req.params.id } })
  if (!existing) throw new HttpError(404, 'Brand not found.')
  const body = req.body
  const pod = await prisma.pod.findUnique({ where: { id: body.podId } })
  if (!pod) throw new HttpError(400, 'Pod does not exist.')
  const processes = await linkProcesses(body.processCodes)
  const row = await prisma.$transaction(async (tx) => {
    await tx.brandProcess.deleteMany({ where: { brandId: existing.id } })
    return tx.brand.update({
      where: { id: existing.id },
      data: {
        name: body.name,
        category: body.category,
        podId: body.podId,
        minCoverage: body.minCoverage,
        singleResource: body.singleResource,
        processes: { create: processes.map((process) => ({ processId: process.id })) },
      },
      include: brandInclude,
    })
  })
  await logActivity(req.admin.name, 'brand.updated', `${row.name} updated.`)
  res.json(mapBrand(row))
}

export async function deleteBrand(req, res) {
  const existing = await prisma.brand.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { shifts: true, employees: true } } },
  })
  if (!existing) throw new HttpError(404, 'Brand not found.')
  if (existing._count.shifts || existing._count.employees) {
    throw new HttpError(409, 'Unassign employees and keep shift history before deleting this brand.')
  }
  await prisma.brand.delete({ where: { id: existing.id } })
  await logActivity(req.admin.name, 'brand.deleted', `${existing.name} removed.`)
  res.status(204).end()
}
