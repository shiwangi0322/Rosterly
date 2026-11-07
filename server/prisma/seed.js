import 'dotenv/config'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import { buildSeedShifts } from '../src/services/scheduling.js'

const prisma = new PrismaClient()

const rules = {
  workingDays: [1, 2, 3, 4, 5, 6],
  weeklyHours: 48,
  maxShiftHours: 9,
  minRestHours: 11,
  breakMinutes: 30,
  weeklyOffRequired: true,
  overtimeAllowed: true,
  overtimeAfterHours: 48,
}

const settings = {
  orgName: 'Datastraw Technologies',
  orgEmail: 'ops@datastraw.com',
  timezone: 'Asia/Kolkata',
  weekStartsOn: 1,
  defaultShiftStart: '09:00',
  defaultShiftEnd: '18:00',
  defaultBreak: 30,
  defaultShiftType: 'general',
  notifyEmail: true,
  notifyInApp: true,
  notifyCoverage: true,
  notifyLeave: true,
  adminName: process.env.ADMIN_NAME || 'Admin',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@datastraw.com',
  adminRole: 'Administrator',
}

const pods = [
  { id: 'POD-1', name: 'Alpha Pod', short: 'Alpha', leadId: 'RS-1001', description: 'Core marketplace brands with high inbound volume.' },
  { id: 'POD-2', name: 'Beta Pod', short: 'Beta', leadId: 'RS-1009', description: 'Fashion and home-service accounts with evening peaks.' },
  { id: 'POD-3', name: 'Gamma Pod', short: 'Gamma', leadId: 'RS-1017', description: 'D2C beauty and eyewear with retention focus.' },
  { id: 'POD-4', name: 'Delta Pod', short: 'Delta', leadId: 'RS-1025', description: 'Wellness and lifestyle brands with NDR follow-ups.' },
]

const processes = [
  { id: 'PR-CS', code: 'CS', name: 'Customer Support', description: 'Inbound queries, order tracking and ticket resolution across chat and email.', requiredStaff: 12, brandIds: ['BR-001', 'BR-002', 'BR-003', 'BR-004', 'BR-005', 'BR-006'], shiftTypes: ['morning', 'general'], defaultStart: '09:00', defaultEnd: '18:00' },
  { id: 'PR-ACC', code: 'ACC', name: 'Abandoned Cart Conversion', description: 'Recover unpaid checkouts with timed outreach during evening peaks.', requiredStaff: 8, brandIds: ['BR-001', 'BR-002', 'BR-006', 'BR-007', 'BR-010'], shiftTypes: ['evening', 'special'], defaultStart: '14:00', defaultEnd: '22:00' },
  { id: 'PR-RET', code: 'RET', name: 'Retention', description: 'Win-back campaigns, subscription saves and loyalty follow-ups.', requiredStaff: 6, brandIds: ['BR-005', 'BR-008', 'BR-009', 'BR-010', 'BR-011'], shiftTypes: ['general'], defaultStart: '10:00', defaultEnd: '18:00' },
  { id: 'PR-NDR', code: 'NDR', name: 'Non-Delivery Report', description: 'RTO prevention, address confirmation and reattempt coordination.', requiredStaff: 6, brandIds: ['BR-003', 'BR-004', 'BR-007', 'BR-011', 'BR-012'], shiftTypes: ['morning', 'evening'], defaultStart: '08:00', defaultEnd: '16:00' },
]

const brands = [
  { id: 'BR-001', name: 'Nike', category: 'Sportswear', podId: 'POD-1', minCoverage: 2, singleResource: false, processCodes: ['CS', 'ACC'] },
  { id: 'BR-002', name: 'Zara', category: 'Fashion', podId: 'POD-2', minCoverage: 2, singleResource: false, processCodes: ['CS', 'ACC'] },
  { id: 'BR-003', name: 'Puma', category: 'Sportswear', podId: 'POD-1', minCoverage: 1, singleResource: true, processCodes: ['CS', 'NDR'] },
  { id: 'BR-004', name: 'Urban Company', category: 'Services', podId: 'POD-2', minCoverage: 1, singleResource: true, processCodes: ['CS', 'NDR'] },
  { id: 'BR-005', name: 'Mamaearth', category: 'D2C Beauty', podId: 'POD-3', minCoverage: 1, singleResource: true, processCodes: ['CS', 'RET'] },
  { id: 'BR-006', name: 'boAt', category: 'Electronics', podId: 'POD-1', minCoverage: 1, singleResource: true, processCodes: ['CS', 'ACC'] },
  { id: 'BR-007', name: 'Noise', category: 'Electronics', podId: 'POD-2', minCoverage: 1, singleResource: true, processCodes: ['ACC', 'NDR'] },
  { id: 'BR-008', name: 'Lenskart', category: 'Eyewear', podId: 'POD-3', minCoverage: 1, singleResource: true, processCodes: ['RET'] },
  { id: 'BR-009', name: 'Minimalist', category: 'D2C Beauty', podId: 'POD-4', minCoverage: 1, singleResource: true, processCodes: ['RET'] },
  { id: 'BR-010', name: 'Sugar Cosmetics', category: 'Beauty', podId: 'POD-3', minCoverage: 1, singleResource: true, processCodes: ['ACC', 'RET'] },
  { id: 'BR-011', name: 'Wakefit', category: 'Home', podId: 'POD-4', minCoverage: 1, singleResource: true, processCodes: ['RET', 'NDR'] },
  { id: 'BR-012', name: 'Bewakoof', category: 'Fashion', podId: 'POD-4', minCoverage: 1, singleResource: true, processCodes: ['NDR'] },
]

const people = [
  ['Rahul Sharma', 'RS-1001', 'POD-1', ['BR-001'], ['CS', 'ACC'], 0, 'Team Lead'],
  ['Priya Mehta', 'RS-1002', 'POD-1', ['BR-001'], ['CS'], 0, 'Specialist'],
  ['Aman Verma', 'RS-1003', 'POD-1', ['BR-001'], ['ACC'], 1, 'Agent'],
  ['Sneha Iyer', 'RS-1004', 'POD-1', ['BR-003'], ['CS', 'NDR'], 0, 'Agent'],
  ['Vikram Nair', 'RS-1005', 'POD-1', ['BR-006'], ['CS', 'ACC'], 2, 'Agent'],
  ['Anjali Singh', 'RS-1006', 'POD-1', ['BR-003'], ['NDR'], 3, 'Agent'],
  ['Rohit Patel', 'RS-1007', 'POD-1', ['BR-006'], ['ACC'], 0, 'Agent'],
  ['Kavya Gupta', 'RS-1008', 'POD-1', ['BR-003'], ['CS', 'NDR'], 4, 'Specialist'],
  ['Arjun Joshi', 'RS-1009', 'POD-2', ['BR-002'], ['CS', 'ACC'], 0, 'Team Lead'],
  ['Meera Reddy', 'RS-1010', 'POD-2', ['BR-002'], ['CS'], 1, 'Specialist'],
  ['Siddharth Khanna', 'RS-1011', 'POD-2', ['BR-002'], ['ACC'], 2, 'Agent'],
  ['Pooja Bose', 'RS-1012', 'POD-2', ['BR-004'], ['CS', 'NDR'], 0, 'Agent'],
  ['Nikhil Sharma', 'RS-1013', 'POD-2', ['BR-007'], ['ACC', 'NDR'], 3, 'Agent'],
  ['Divya Mehta', 'RS-1014', 'POD-2', ['BR-004'], ['NDR'], 4, 'Agent'],
  ['Harsh Verma', 'RS-1015', 'POD-2', ['BR-007'], ['ACC'], 0, 'Agent'],
  ['Ritu Iyer', 'RS-1016', 'POD-2', ['BR-004'], ['CS', 'NDR'], 5, 'Specialist'],
  ['Yash Nair', 'RS-1017', 'POD-3', ['BR-005'], ['CS', 'RET'], 0, 'Team Lead'],
  ['Tanvi Singh', 'RS-1018', 'POD-3', ['BR-008'], ['RET'], 1, 'Agent'],
  ['Manish Patel', 'RS-1019', 'POD-3', ['BR-010'], ['ACC', 'RET'], 2, 'Agent'],
  ['Shruti Gupta', 'RS-1020', 'POD-3', ['BR-005'], ['CS'], 3, 'Agent'],
  ['Gaurav Joshi', 'RS-1021', 'POD-3', ['BR-008'], ['RET'], 0, 'Agent'],
  ['Nisha Reddy', 'RS-1022', 'POD-3', ['BR-010'], ['RET'], 4, 'Agent'],
  ['Varun Khanna', 'RS-1023', 'POD-3', ['BR-005', 'BR-010'], ['CS', 'ACC'], 5, 'Specialist'],
  ['Aditi Bose', 'RS-1024', 'POD-3', ['BR-008'], ['RET'], 6, 'Agent'],
  ['Kunal Sharma', 'RS-1025', 'POD-4', ['BR-009'], ['RET'], 0, 'Team Lead'],
  ['Swati Mehta', 'RS-1026', 'POD-4', ['BR-011'], ['RET', 'NDR'], 1, 'Agent'],
  ['Deepak Verma', 'RS-1027', 'POD-4', ['BR-012'], ['NDR'], 2, 'Agent'],
  ['Isha Iyer', 'RS-1028', 'POD-4', ['BR-009'], ['RET'], 3, 'Agent'],
  ['Sahil Nair', 'RS-1029', 'POD-4', ['BR-011'], ['NDR'], 4, 'Agent'],
  ['Pallavi Singh', 'RS-1030', 'POD-4', ['BR-012'], ['NDR'], 5, 'Inactive'],
  ['Mohit Patel', 'RS-1031', 'POD-4', ['BR-009', 'BR-011'], ['RET', 'NDR'], 6, 'Specialist'],
  ['Simran Gupta', 'RS-1032', 'POD-4', ['BR-012'], ['NDR'], 0, 'Agent'],
]

function employees() {
  return people.map(([name, id, podId, brandIds, processCodes, weeklyOff, role], i) => {
    const limited = i % 11 === 0
    const joined = new Date(Date.UTC(2024, 0, 8 + i * 17))
    return {
      id,
      name,
      email: `${name.split(' ')[0].toLowerCase()}@datastraw.com`,
      phone: `98765${String(10010 + i).slice(-5)}`,
      role: role === 'Inactive' ? 'Agent' : role,
      podId,
      brandIds,
      processCodes,
      weeklyOff,
      status: role === 'Inactive' ? 'Inactive' : 'Active',
      availabilityStart: limited ? '10:00' : '08:00',
      availabilityEnd: limited ? '19:00' : '22:00',
      joined,
    }
  })
}

const leaves = [
  { id: 'LV-01', employeeId: 'RS-1002', from: '2026-11-12', to: '2026-11-13', type: 'casual', status: 'approved', reason: 'Family function in Jaipur', createdAt: '2026-11-01' },
  { id: 'LV-02', employeeId: 'RS-1005', from: '2026-11-16', to: '2026-11-16', type: 'sick', status: 'approved', reason: 'Fever and rest advised', createdAt: '2026-11-16' },
  { id: 'LV-03', employeeId: 'RS-1010', from: '2026-11-05', to: '2026-11-06', type: 'planned', status: 'approved', reason: 'Out of station', createdAt: '2026-10-20' },
  { id: 'LV-04', employeeId: 'RS-1015', from: '2026-11-18', to: '2026-11-19', type: 'compoff', status: 'approved', reason: 'Comp-off for Diwali weekend coverage', createdAt: '2026-11-10' },
  { id: 'LV-05', employeeId: 'RS-1020', from: '2026-11-20', to: '2026-11-22', type: 'planned', status: 'approved', reason: 'Wedding in family', createdAt: '2026-10-28' },
  { id: 'LV-06', employeeId: 'RS-1008', from: '2026-11-10', to: '2026-11-10', type: 'casual', status: 'pending', reason: 'Personal errand', createdAt: '2026-11-06' },
  { id: 'LV-07', employeeId: 'RS-1019', from: '2026-11-14', to: '2026-11-15', type: 'planned', status: 'pending', reason: 'Travel to hometown', createdAt: '2026-11-04' },
  { id: 'LV-08', employeeId: 'RS-1027', from: '2026-11-07', to: '2026-11-07', type: 'sick', status: 'pending', reason: 'Migraine', createdAt: '2026-11-06' },
  { id: 'LV-09', employeeId: 'RS-1012', from: '2026-11-03', to: '2026-11-03', type: 'casual', status: 'rejected', reason: 'Short notice casual leave', createdAt: '2026-11-02' },
  { id: 'LV-10', employeeId: 'RS-1026', from: '2026-11-11', to: '2026-11-11', type: 'compoff', status: 'pending', reason: 'Comp-off for Sunday NDR drive', createdAt: '2026-11-05' },
]

const holidays = [
  { date: '2026-11-08', name: 'Diwali' },
  { date: '2026-11-09', name: 'Diwali (Day 2)' },
  { date: '2026-11-24', name: 'Guru Nanak Jayanti' },
  { date: '2026-12-25', name: 'Christmas' },
]

const day = (iso) => new Date(`${iso}T00:00:00.000Z`)

async function main() {
  const existing = await prisma.employee.count()
  if (existing && process.env.SEED_FORCE !== '1') {
    console.log(`Database already has ${existing} employees. Refusing to replace data. Set SEED_FORCE=1 to reseed.`)
    return
  }
  if (existing && process.env.SEED_FORCE === '1') {
    await prisma.$transaction([
      prisma.dismissedConflict.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.activityLog.deleteMany(),
      prisma.shift.deleteMany(),
      prisma.leaveRequest.deleteMany(),
      prisma.holiday.deleteMany(),
      prisma.employeeBrand.deleteMany(),
      prisma.employeeProcess.deleteMany(),
      prisma.brandProcess.deleteMany(),
      prisma.employee.deleteMany(),
      prisma.brand.deleteMany(),
      prisma.process.deleteMany(),
      prisma.pod.deleteMany(),
      prisma.workingRule.deleteMany(),
      prisma.organizationSettings.deleteMany(),
      prisma.admin.deleteMany(),
    ])
  }

  const password = process.env.ADMIN_PASSWORD
  if (!password) throw new Error('Set ADMIN_PASSWORD before seeding.')
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@datastraw.com').toLowerCase()
  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: process.env.ADMIN_NAME || 'Admin',
      role: 'Administrator',
      passwordHash: await bcrypt.hash(password, 10),
    },
    update: {
      name: process.env.ADMIN_NAME || 'Admin',
      role: 'Administrator',
      passwordHash: await bcrypt.hash(password, 10),
    },
  })

  await prisma.workingRule.upsert({
    where: { id: 'default' },
    create: { id: 'default', ...rules },
    update: rules,
  })
  await prisma.organizationSettings.upsert({
    where: { id: 'default' },
    create: { id: 'default', ...settings },
    update: settings,
  })

  for (const pod of pods) {
    await prisma.pod.create({ data: { id: pod.id, name: pod.name, short: pod.short, description: pod.description } })
  }
  for (const process of processes) {
    await prisma.process.create({
      data: {
        id: process.id,
        code: process.code,
        name: process.name,
        description: process.description,
        requiredStaff: process.requiredStaff,
        shiftTypes: process.shiftTypes,
        defaultStart: process.defaultStart,
        defaultEnd: process.defaultEnd,
      },
    })
  }
  for (const brand of brands) {
    await prisma.brand.create({
      data: {
        id: brand.id,
        name: brand.name,
        category: brand.category,
        podId: brand.podId,
        minCoverage: brand.minCoverage,
        singleResource: brand.singleResource,
        processes: { create: brand.processCodes.map((code) => ({ processId: processes.find((p) => p.code === code).id })) },
      },
    })
  }

  const staff = employees()
  for (const emp of staff) {
    await prisma.employee.create({
      data: {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        role: emp.role,
        weeklyOff: emp.weeklyOff,
        status: emp.status,
        availabilityStart: emp.availabilityStart,
        availabilityEnd: emp.availabilityEnd,
        joined: emp.joined,
        podId: emp.podId,
        brands: { create: emp.brandIds.map((brandId) => ({ brandId })) },
        processes: { create: emp.processCodes.map((code) => ({ processId: processes.find((p) => p.code === code).id })) },
      },
    })
  }
  for (const pod of pods) {
    await prisma.pod.update({ where: { id: pod.id }, data: { leadId: pod.leadId } })
  }
  for (const holiday of holidays) {
    await prisma.holiday.create({ data: { date: day(holiday.date), name: holiday.name } })
  }
  for (const leave of leaves) {
    await prisma.leaveRequest.create({
      data: {
        id: leave.id,
        employeeId: leave.employeeId,
        type: leave.type,
        status: leave.status,
        startDate: day(leave.from),
        endDate: day(leave.to),
        reason: leave.reason,
        appliedOn: day(leave.createdAt),
        decidedAt: leave.status === 'pending' ? null : new Date(`${leave.createdAt}T10:00:00.000Z`),
        decidedBy: leave.status === 'pending' ? null : admin.email,
      },
    })
  }

  const shapedEmployees = staff.map((e) => ({ ...e, joined: e.joined.toISOString().slice(0, 10) }))
  const shifts = buildSeedShifts({
    employees: shapedEmployees,
    brands,
    holidays,
    leaves,
    rules,
  })
  const processByCode = Object.fromEntries(processes.map((p) => [p.code, p.id]))
  for (const shift of shifts) {
    await prisma.shift.create({
      data: {
        id: shift.id,
        employeeId: shift.employeeId,
        brandId: shift.brandId,
        processId: processByCode[shift.processCode],
        date: day(shift.date),
        startTime: shift.start,
        endTime: shift.end,
        breakMinutes: shift.breakMinutes,
        type: shift.type,
        status: 'scheduled',
        notes: shift.notes,
      },
    })
  }

  await prisma.activityLog.createMany({
    data: [
      { at: new Date('2026-11-06T09:12:00+05:30'), actor: admin.name, action: 'leave.approved', detail: 'Priya Mehta approved for casual leave on 12–13 Nov.' },
      { at: new Date('2026-11-06T08:40:00+05:30'), actor: 'System', action: 'coverage.flagged', detail: 'Nike coverage flagged below minimum for Friday evening.' },
      { at: new Date('2026-11-05T18:20:00+05:30'), actor: admin.name, action: 'roster.published', detail: 'Week roster published for Alpha and Beta pods.' },
      { at: new Date('2026-11-05T14:05:00+05:30'), actor: admin.name, action: 'leave.approved', detail: 'Meera Reddy planned leave approved for 5–6 Nov.' },
      { at: new Date('2026-11-04T11:30:00+05:30'), actor: admin.name, action: 'rules.updated', detail: 'Working rules updated: 48h week, 11h minimum rest.' },
    ],
  })
  await prisma.notification.createMany({
    data: [
      { title: 'Leave waiting', body: 'Kavya Gupta requested casual leave on 10 Nov.', kind: 'leave' },
      { title: 'Comp-off waiting', body: 'Swati Mehta requested a comp-off for 11 Nov.', kind: 'leave' },
      { title: 'Holiday ahead', body: 'Diwali is a non-working day on 8 and 9 Nov.', kind: 'holiday' },
    ],
  })

  const nike = await prisma.employeeBrand.count({ where: { brandId: 'BR-001' } })
  const zara = await prisma.employeeBrand.count({ where: { brandId: 'BR-002' } })
  console.log(`Seeded ${staff.length} employees, ${brands.length} brands, ${pods.length} pods, ${processes.length} processes, ${shifts.length} shifts.`)
  console.log(`Nike assignees: ${nike}. Zara assignees: ${zara}. Admin: ${admin.email}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
