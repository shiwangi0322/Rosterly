import { z } from 'zod'

const time = z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:mm')
const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
const id = z.string().min(1).max(40)

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
})

export const employeeSchema = z.object({
  id: id.optional(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8).max(20),
  role: z.string().min(2),
  podId: id,
  brandIds: z.array(id).min(1),
  processCodes: z.array(z.string().min(1)).min(1),
  weeklyOff: z.number().int().min(0).max(6),
  status: z.enum(['Active', 'Inactive']),
  availabilityStart: time,
  availabilityEnd: time,
  joined: iso,
})

export const brandSchema = z.object({
  id: id.optional(),
  name: z.string().min(2),
  category: z.string().min(2),
  podId: id,
  minCoverage: z.number().int().min(1).max(20),
  singleResource: z.boolean(),
  processCodes: z.array(z.string().min(1)).min(1),
})

export const processSchema = z.object({
  id: id.optional(),
  code: z.string().min(2).max(8),
  name: z.string().min(2),
  description: z.string().min(4),
  requiredStaff: z.number().int().min(1),
  brandIds: z.array(id).min(1),
  shiftTypes: z.array(z.enum(['morning', 'evening', 'general', 'special'])).min(1),
  defaultStart: time,
  defaultEnd: time,
})

export const podSchema = z.object({
  id: id.optional(),
  name: z.string().min(2),
  short: z.string().min(2),
  description: z.string().min(4),
  leadId: id.nullable().optional(),
})

export const shiftSchema = z.object({
  id: id.optional(),
  employeeId: id,
  brandId: id,
  processCode: z.string().min(1),
  date: iso,
  start: time,
  end: time,
  breakMinutes: z.number().int().min(0).max(180),
  type: z.enum(['morning', 'evening', 'general', 'special']),
  notes: z.string().max(500).optional().default(''),
  status: z.enum(['scheduled', 'cancelled']).optional(),
})

export const leaveSchema = z.object({
  employeeId: id,
  type: z.enum(['casual', 'sick', 'planned', 'compoff']),
  from: iso,
  to: iso,
  reason: z.string().min(3).max(500),
})

export const decisionSchema = z.object({
  note: z.string().max(300).optional(),
})

export const rulesSchema = z.object({
  workingDays: z.array(z.number().int().min(0).max(6)).min(1),
  weeklyHours: z.number().int().min(1).max(80),
  maxShiftHours: z.number().int().min(1).max(16),
  minRestHours: z.number().int().min(0).max(24),
  breakMinutes: z.number().int().min(0).max(180),
  weeklyOffRequired: z.boolean(),
  overtimeAllowed: z.boolean(),
  overtimeAfterHours: z.number().int().min(1).max(80),
})

export const holidaySchema = z.object({
  date: iso,
  name: z.string().min(2),
})

export const settingsSchema = z.object({
  orgName: z.string().min(2),
  orgEmail: z.string().email(),
  timezone: z.string().min(2),
  weekStartsOn: z.number().int().min(0).max(6),
  defaultShiftStart: time,
  defaultShiftEnd: time,
  defaultBreak: z.number().int().min(0).max(180),
  defaultShiftType: z.enum(['morning', 'evening', 'general', 'special']),
  notifyEmail: z.boolean(),
  notifyInApp: z.boolean(),
  notifyCoverage: z.boolean(),
  notifyLeave: z.boolean(),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminRole: z.string().min(2),
})

export const generateSchema = z.object({
  from: iso,
  to: iso,
  brandIds: z.array(id).optional(),
})

export const notificationSchema = z.object({
  read: z.boolean(),
})
