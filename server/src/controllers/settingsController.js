import { prisma } from '../config/prisma.js'
import { mapSettings } from '../services/mappers.js'
import { HttpError, pageParams, pageResult } from '../utils/http.js'
import { logActivity } from '../services/context.js'

export async function getSettings(req, res) {
  const row = await prisma.organizationSettings.findUnique({ where: { id: 'default' } })
  if (!row) throw new HttpError(404, 'Organization settings are not set.')
  res.json(mapSettings(row))
}

export async function updateSettings(req, res) {
  const row = await prisma.organizationSettings.update({ where: { id: 'default' }, data: req.body })
  await logActivity(req.admin.name, 'settings.updated', 'Organization settings updated.')
  res.json(mapSettings(row))
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
