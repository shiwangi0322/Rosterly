import { prisma } from '../config/prisma.js'
import { HttpError, pageParams, pageResult } from '../utils/http.js'
import { asDate } from '../utils/dates.js'
import { employeeInclude, mapEmployee } from '../services/mappers.js'
import { logActivity } from '../services/context.js'

async function processIds(codes) {
  const rows = await prisma.process.findMany({ where: { code: { in: codes } } })
  if (rows.length !== new Set(codes).size) throw new HttpError(400, 'One or more process codes do not exist.')
  return rows
}

async function assertPodAndBrands(podId, brandIds) {
  const pod = await prisma.pod.findUnique({ where: { id: podId } })
  if (!pod) throw new HttpError(400, 'Pod does not exist.')
  const brands = await prisma.brand.findMany({ where: { id: { in: brandIds } } })
  if (brands.length !== new Set(brandIds).size) throw new HttpError(400, 'One or more brands do not exist.')
}

function joins(employeeId, brandIds, processes) {
  return {
    brands: { create: [...new Set(brandIds)].map((brandId) => ({ brandId })) },
    processes: { create: processes.map((process) => ({ processId: process.id })) },
  }
}

export async function listEmployees(req, res) {
  const { page, limit, skip, order, search } = pageParams(req.query)
  const sortFields = { name: 'name', joined: 'joined', id: 'id', status: 'status' }
  const sort = sortFields[req.query.sort] || 'name'
  const where = {
    ...(req.query.status ? { status: String(req.query.status) } : {}),
    ...(req.query.podId ? { podId: String(req.query.podId) } : {}),
    ...(req.query.brandId ? { brands: { some: { brandId: String(req.query.brandId) } } } : {}),
    ...(search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }, { id: { contains: search, mode: 'insensitive' } }] }
      : {}),
  }
  const [total, rows] = await prisma.$transaction([
    prisma.employee.count({ where }),
    prisma.employee.findMany({ where, include: employeeInclude, orderBy: { [sort]: order }, skip, take: limit }),
  ])
  res.json(pageResult(rows.map(mapEmployee), total, page, limit))
}

export async function getEmployee(req, res) {
  const row = await prisma.employee.findUnique({ where: { id: req.params.id }, include: employeeInclude })
  if (!row) throw new HttpError(404, 'Employee not found.')
  res.json(mapEmployee(row))
}

export async function createEmployee(req, res) {
  const body = req.body
  const id = body.id || `RS-${Date.now().toString(36).toUpperCase()}`
  await assertPodAndBrands(body.podId, body.brandIds)
  const processes = await processIds(body.processCodes)
  const row = await prisma.employee.create({
    data: {
      id,
      name: body.name,
      email: body.email.toLowerCase(),
      phone: body.phone,
      role: body.role,
      weeklyOff: body.weeklyOff,
      status: body.status,
      availabilityStart: body.availabilityStart,
      availabilityEnd: body.availabilityEnd,
      joined: asDate(body.joined),
      podId: body.podId,
      ...joins(id, body.brandIds, processes),
    },
    include: employeeInclude,
  })
  await logActivity(req.admin.name, 'employee.created', `${row.name} added.`)
  res.status(201).json(mapEmployee(row))
}

export async function updateEmployee(req, res) {
  const existing = await prisma.employee.findUnique({ where: { id: req.params.id }, include: employeeInclude })
  if (!existing) throw new HttpError(404, 'Employee not found.')
  const body = { ...mapEmployee(existing), ...req.body }
  await assertPodAndBrands(body.podId, body.brandIds)
  const processes = await processIds(body.processCodes)
  const row = await prisma.$transaction(async (tx) => {
    await tx.employeeBrand.deleteMany({ where: { employeeId: existing.id } })
    await tx.employeeProcess.deleteMany({ where: { employeeId: existing.id } })
    return tx.employee.update({
      where: { id: existing.id },
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        phone: body.phone,
        role: body.role,
        weeklyOff: body.weeklyOff,
        status: body.status,
        availabilityStart: body.availabilityStart,
        availabilityEnd: body.availabilityEnd,
        joined: asDate(body.joined),
        podId: body.podId,
        ...joins(existing.id, body.brandIds, processes),
      },
      include: employeeInclude,
    })
  })
  await logActivity(req.admin.name, 'employee.updated', `${row.name} updated.`)
  res.json(mapEmployee(row))
}

export async function deleteEmployee(req, res) {
  const existing = await prisma.employee.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { shifts: true, leaves: true } } },
  })
  if (!existing) throw new HttpError(404, 'Employee not found.')
  if (existing._count.shifts || existing._count.leaves) {
    throw new HttpError(409, 'This employee has shifts or leave history. Mark them inactive instead of deleting.')
  }
  await prisma.employee.delete({ where: { id: existing.id } })
  await logActivity(req.admin.name, 'employee.deleted', `${existing.name} removed.`)
  res.status(204).end()
}
