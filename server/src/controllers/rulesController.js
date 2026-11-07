import { prisma } from '../config/prisma.js'
import { mapHoliday, mapRules } from '../services/mappers.js'
import { asDate } from '../utils/dates.js'
import { HttpError } from '../utils/http.js'
import { logActivity } from '../services/context.js'

export async function getRules(req, res) {
  const row = await prisma.workingRule.findUnique({ where: { id: 'default' } })
  if (!row) throw new HttpError(404, 'Working rules are not set.')
  res.json(mapRules(row))
}

export async function updateRules(req, res) {
  const row = await prisma.workingRule.upsert({
    where: { id: 'default' },
    create: { id: 'default', ...req.body },
    update: req.body,
  })
  await logActivity(req.admin.name, 'rules.updated', 'Working rules updated.')
  res.json(mapRules(row))
}

export async function listHolidays(req, res) {
  const rows = await prisma.holiday.findMany({ orderBy: { date: 'asc' } })
  res.json(rows.map(mapHoliday))
}

export async function createHoliday(req, res) {
  const row = await prisma.holiday.create({ data: { date: asDate(req.body.date), name: req.body.name } })
  await logActivity(req.admin.name, 'holiday.created', `${req.body.name} on ${req.body.date}.`)
  res.status(201).json(mapHoliday(row))
}

export async function updateHoliday(req, res) {
  const row = await prisma.holiday.update({
    where: { id: req.params.id },
    data: { date: asDate(req.body.date), name: req.body.name },
  })
  res.json(mapHoliday(row))
}

export async function deleteHoliday(req, res) {
  await prisma.holiday.delete({ where: { id: req.params.id } })
  res.status(204).end()
}
