import { prisma } from '../config/prisma.js'
import { signToken } from '../middleware/auth.js'
import { mapSettings } from '../services/mappers.js'
import { HttpError, pageParams, pageResult } from '../utils/http.js'
import { logActivity } from '../services/context.js'

export async function getSettings(req, res) {
  const row = await prisma.organizationSettings.findUnique({ where: { id: 'default' } })
  if (!row) throw new HttpError(404, 'Organization settings are not set.')
  res.json(mapSettings(row))
}

export async function updateSettings(req, res) {
  const adminEmail = req.body.adminEmail.trim().toLowerCase()
  const adminName = req.body.adminName.trim()
  const organizationData = { ...req.body }
  delete organizationData.adminEmail
  delete organizationData.adminName

  const [admin, row] = await prisma.$transaction(async (tx) => {
    const updatedAdmin = await tx.admin.update({
      where: { id: req.admin.sub },
      data: { email: adminEmail, name: adminName },
    })
    const updatedSettings = await tx.organizationSettings.update({
      where: { id: 'default' },
      data: {
        ...organizationData,
        adminEmail: updatedAdmin.email,
        adminName: updatedAdmin.name,
        adminRole: updatedAdmin.role,
      },
    })
    return [updatedAdmin, updatedSettings]
  })

  await logActivity(admin.name, 'settings.updated', 'Organization settings updated.')
  res.json({
    ...mapSettings(row),
    admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    token: signToken(admin),
  })
}

export async function listActivity(req, res) {
  const { page, limit, skip, order, search } = pageParams(req.query)
  const where = search ? { detail: { contains: search, mode: 'insensitive' } } : {}
  const [total, rows] = await prisma.$transaction([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({ where, orderBy: { at: order === 'asc' ? 'asc' : 'desc' }, skip, take: limit }),
  ])
  res.json(pageResult(rows, total, page, limit))
}

export async function listNotifications(req, res) {
  const { page, limit, skip } = pageParams(req.query)
  const where = req.query.unread === 'true' ? { read: false } : {}
  const [total, rows] = await prisma.$transaction([
    prisma.notification.count({ where }),
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
  ])
  res.json(pageResult(rows, total, page, limit))
}

export async function updateNotification(req, res) {
  const row = await prisma.notification.update({ where: { id: req.params.id }, data: { read: req.body.read } })
  res.json(row)
}
