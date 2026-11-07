import { toIsoDate } from '../utils/dates.js'

export const employeeInclude = {
  brands: { select: { brandId: true } },
  processes: { select: { process: { select: { code: true } } } },
}

export const brandInclude = {
  processes: { select: { process: { select: { code: true } } } },
  employees: { select: { employeeId: true } },
}

export const processInclude = {
  brands: { select: { brandId: true } },
}

export const shiftInclude = {
  process: { select: { code: true } },
}

export function mapEmployee(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    podId: row.podId,
    brandIds: row.brands.map((b) => b.brandId),
    processCodes: row.processes.map((p) => p.process.code),
    weeklyOff: row.weeklyOff,
    status: row.status,
    availabilityStart: row.availabilityStart,
    availabilityEnd: row.availabilityEnd,
    joined: toIsoDate(row.joined),
  }
}

export function mapBrand(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    podId: row.podId,
    minCoverage: row.minCoverage,
    singleResource: row.singleResource,
    processCodes: row.processes.map((p) => p.process.code),
    employeeIds: row.employees.map((e) => e.employeeId),
  }
}

export function mapProcess(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    requiredStaff: row.requiredStaff,
    brandIds: row.brands.map((b) => b.brandId),
    shiftTypes: row.shiftTypes,
    defaultStart: row.defaultStart,
    defaultEnd: row.defaultEnd,
  }
}

export function mapPod(row) {
  return {
    id: row.id,
    name: row.name,
    short: row.short,
    leadId: row.leadId,
    description: row.description,
    brandIds: row.brands?.map((b) => b.id) || [],
    memberIds: row.employees?.map((e) => e.id) || [],
  }
}

export function mapShift(row) {
  return {
    id: row.id,
    employeeId: row.employeeId,
    brandId: row.brandId,
    processCode: row.process?.code || row.processCode,
    date: toIsoDate(row.date),
    start: row.startTime,
    end: row.endTime,
    breakMinutes: row.breakMinutes,
    type: row.type,
    status: row.status,
    notes: row.notes,
  }
}

export function mapLeave(row) {
  return {
    id: row.id,
    employeeId: row.employeeId,
    type: row.type,
    status: row.status,
    from: toIsoDate(row.startDate),
    to: toIsoDate(row.endDate),
    reason: row.reason,
    createdAt: toIsoDate(row.appliedOn),
    decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
    decidedBy: row.decidedBy,
  }
}

export function mapHoliday(row) {
  return { id: row.id, date: toIsoDate(row.date), name: row.name }
}

export function mapRules(row) {
  return {
    workingDays: row.workingDays,
    weeklyHours: row.weeklyHours,
    maxShiftHours: row.maxShiftHours,
    minRestHours: row.minRestHours,
    breakMinutes: row.breakMinutes,
    weeklyOffRequired: row.weeklyOffRequired,
    overtimeAllowed: row.overtimeAllowed,
    overtimeAfterHours: row.overtimeAfterHours,
  }
}

export function mapSettings(row) {
  return {
    orgName: row.orgName,
    orgEmail: row.orgEmail,
    timezone: row.timezone,
    weekStartsOn: row.weekStartsOn,
    defaultShiftStart: row.defaultShiftStart,
    defaultShiftEnd: row.defaultShiftEnd,
    defaultBreak: row.defaultBreak,
    defaultShiftType: row.defaultShiftType,
    notifyEmail: row.notifyEmail,
    notifyInApp: row.notifyInApp,
    notifyCoverage: row.notifyCoverage,
    notifyLeave: row.notifyLeave,
    adminName: row.adminName,
    adminEmail: row.adminEmail,
    adminRole: row.adminRole,
  }
}
