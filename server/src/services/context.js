import { prisma } from '../config/prisma.js'
import { mapBrand, mapEmployee, mapHoliday, mapLeave, mapProcess, mapRules, mapSettings, mapShift, employeeInclude, brandInclude, processInclude, shiftInclude } from './mappers.js'

export async function loadContext() {
  const [employees, brands, processes, shifts, leaves, holidays, rules, settings] = await Promise.all([
    prisma.employee.findMany({ include: employeeInclude, orderBy: { id: 'asc' } }),
    prisma.brand.findMany({ include: brandInclude, orderBy: { id: 'asc' } }),
    prisma.process.findMany({ include: processInclude, orderBy: { code: 'asc' } }),
    prisma.shift.findMany({ include: shiftInclude, orderBy: [{ date: 'asc' }, { startTime: 'asc' }] }),
    prisma.leaveRequest.findMany({ orderBy: { appliedOn: 'desc' } }),
    prisma.holiday.findMany({ orderBy: { date: 'asc' } }),
    prisma.workingRule.findUnique({ where: { id: 'default' } }),
    prisma.organizationSettings.findUnique({ where: { id: 'default' } }),
  ])
  if (!rules || !settings) {
    const error = new Error('Working rules and organization settings must be seeded first.')
    error.status = 500
    throw error
  }
  return {
    employees: employees.map(mapEmployee),
    brands: brands.map(mapBrand),
    processes: processes.map(mapProcess),
    shifts: shifts.map(mapShift),
    leaves: leaves.map(mapLeave),
    holidays: holidays.map(mapHoliday),
    rules: mapRules(rules),
    settings: mapSettings(settings),
  }
}

export async function logActivity(actor, action, detail) {
  await prisma.activityLog.create({
    data: { at: new Date(), actor: actor || 'System', action, detail },
  })
}
