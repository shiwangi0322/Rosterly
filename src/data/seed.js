import { addDays, format, parseISO } from 'date-fns'

export const DEMO_TODAY = new Date(2026, 10, 6)
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const STORAGE_KEY = 'rosterly-app-v1'

export const SHIFT_TEMPLATES = {
  morning: { start: '08:00', end: '16:00', type: 'morning', label: 'Morning' },
  evening: { start: '14:00', end: '22:00', type: 'evening', label: 'Evening' },
  general: { start: '10:00', end: '18:00', type: 'general', label: 'General' },
  special: { start: '12:00', end: '20:00', type: 'special', label: 'Special' },
}

export const defaultRules = {
  workingDays: [1, 2, 3, 4, 5, 6],
  weeklyHours: 48,
  maxShiftHours: 9,
  minRestHours: 11,
  breakMinutes: 30,
  weeklyOffRequired: true,
  overtimeAllowed: true,
  overtimeAfterHours: 48,
}

export const defaultSettings = {
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
  adminName: 'Admin',
  adminEmail: 'admin@datastraw.com',
  adminRole: 'Administrator',
}

export const seedHolidays = [
  { date: '2026-11-08', name: 'Diwali' },
  { date: '2026-11-09', name: 'Diwali (Day 2)' },
  { date: '2026-11-24', name: 'Guru Nanak Jayanti' },
  { date: '2026-12-25', name: 'Christmas' },
]

export const seedPods = [
  { id: 'POD-1', name: 'Alpha Pod', short: 'Alpha', leadId: 'RS-1001', description: 'Core marketplace brands with high inbound volume.', brandIds: ['BR-001', 'BR-003', 'BR-006'] },
  { id: 'POD-2', name: 'Beta Pod', short: 'Beta', leadId: 'RS-1009', description: 'Fashion and home-service accounts with evening peaks.', brandIds: ['BR-002', 'BR-004', 'BR-007'] },
  { id: 'POD-3', name: 'Gamma Pod', short: 'Gamma', leadId: 'RS-1017', description: 'D2C beauty and eyewear with retention focus.', brandIds: ['BR-005', 'BR-008', 'BR-010'] },
  { id: 'POD-4', name: 'Delta Pod', short: 'Delta', leadId: 'RS-1025', description: 'Wellness and lifestyle brands with NDR follow-ups.', brandIds: ['BR-009', 'BR-011', 'BR-012'] },
]

export const seedProcesses = [
  {
    id: 'PR-CS',
    code: 'CS',
    name: 'Customer Support',
    description: 'Inbound queries, order tracking and ticket resolution across chat and email.',
    requiredStaff: 12,
    brandIds: ['BR-001', 'BR-002', 'BR-003', 'BR-004', 'BR-005', 'BR-006'],
    shiftTypes: ['morning', 'general'],
    defaultStart: '09:00',
    defaultEnd: '18:00',
  },
  {
    id: 'PR-ACC',
    code: 'ACC',
    name: 'Abandoned Cart Conversion',
    description: 'Recover unpaid checkouts with timed outreach during evening peaks.',
    requiredStaff: 8,
    brandIds: ['BR-001', 'BR-002', 'BR-006', 'BR-007', 'BR-010'],
    shiftTypes: ['evening', 'special'],
    defaultStart: '14:00',
    defaultEnd: '22:00',
  },
  {
    id: 'PR-RET',
    code: 'RET',
    name: 'Retention',
    description: 'Win-back campaigns, subscription saves and loyalty follow-ups.',
    requiredStaff: 6,
    brandIds: ['BR-005', 'BR-008', 'BR-009', 'BR-010', 'BR-011'],
    shiftTypes: ['general'],
    defaultStart: '10:00',
    defaultEnd: '18:00',
  },
  {
    id: 'PR-NDR',
    code: 'NDR',
    name: 'Non-Delivery Report',
    description: 'RTO prevention, address confirmation and reattempt coordination.',
    requiredStaff: 6,
    brandIds: ['BR-003', 'BR-004', 'BR-007', 'BR-011', 'BR-012'],
    shiftTypes: ['morning', 'evening'],
    defaultStart: '08:00',
    defaultEnd: '16:00',
  },
]

export const seedBrands = [
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

const PEOPLE = [
  ['Rahul Sharma', 'RS-1001', 'POD-1', ['BR-001'], ['CS', 'ACC'], 0, 'Team Lead'],
  ['Priya Mehta', 'RS-1002', 'POD-1', ['BR-001'], ['CS'], 0, 'Specialist'],
  ['Aman Verma', 'RS-1003', 'POD-1', ['BR-001'], ['ACC'], 1, 'Agent'],
  ['Sneha Iyer', 'RS-1004', 'POD-1', ['BR-003'], ['CS', 'NDR'], 0, 'Agent'],
  ['Vikram Nair', 'RS-1005', 'POD-1', ['BR-006'], ['CS', 'ACC'], 2, 'Agent'],
  ['Anjali Singh', 'RS-1006', 'POD-1', ['BR-003'], ['NDR'], 3, 'Agent'],
  ['Rohit Patel', 'RS-1007', 'POD-1', ['BR-006'], ['ACC'], 0, 'Agent'],
  ['Kavya Gupta', 'RS-1008', 'POD-1', ['BR-001', 'BR-003'], ['CS', 'NDR'], 4, 'Specialist'],
  ['Arjun Joshi', 'RS-1009', 'POD-2', ['BR-002'], ['CS', 'ACC'], 0, 'Team Lead'],
  ['Meera Reddy', 'RS-1010', 'POD-2', ['BR-002'], ['CS'], 1, 'Specialist'],
  ['Siddharth Khanna', 'RS-1011', 'POD-2', ['BR-002'], ['ACC'], 2, 'Agent'],
  ['Pooja Bose', 'RS-1012', 'POD-2', ['BR-004'], ['CS', 'NDR'], 0, 'Agent'],
  ['Nikhil Sharma', 'RS-1013', 'POD-2', ['BR-007'], ['ACC', 'NDR'], 3, 'Agent'],
  ['Divya Mehta', 'RS-1014', 'POD-2', ['BR-004'], ['NDR'], 4, 'Agent'],
  ['Harsh Verma', 'RS-1015', 'POD-2', ['BR-007'], ['ACC'], 0, 'Agent'],
  ['Ritu Iyer', 'RS-1016', 'POD-2', ['BR-002', 'BR-004'], ['CS', 'NDR'], 5, 'Specialist'],
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

export const seedEmployees = PEOPLE.map(([name, id, podId, brandIds, processCodes, weeklyOff, role], i) => {
  const first = name.split(' ')[0].toLowerCase()
  const limited = i % 11 === 0
  return {
    id,
    name,
    email: `${first}@datastraw.com`,
    phone: `98765${String(10010 + i).slice(-5)}`,
    role: role === 'Inactive' ? 'Agent' : role,
    podId,
    brandIds,
    processCodes,
    weeklyOff,
    status: role === 'Inactive' ? 'Inactive' : 'Active',
    availabilityStart: limited ? '10:00' : '08:00',
    availabilityEnd: limited ? '19:00' : '22:00',
    joined: format(addDays(new Date(2024, 0, 8), i * 17), 'yyyy-MM-dd'),
  }
})

export const seedLeaves = [
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

export const seedActivities = [
  { id: 'AC-1', at: '2026-11-06T09:12:00', text: 'Priya Mehta approved for casual leave on 12–13 Nov.' },
  { id: 'AC-2', at: '2026-11-06T08:40:00', text: 'Nike coverage flagged below minimum for Friday evening.' },
  { id: 'AC-3', at: '2026-11-05T18:20:00', text: 'Week roster published for Alpha and Beta pods.' },
  { id: 'AC-4', at: '2026-11-05T14:05:00', text: 'Meera Reddy planned leave approved for 5–6 Nov.' },
  { id: 'AC-5', at: '2026-11-04T11:30:00', text: 'Working rules updated: 48h week, 11h minimum rest.' },
]

function holidayLookup(holidays) {
  return Object.fromEntries(holidays.map((h) => [h.date, h.name]))
}

function onLeave(employeeId, iso, leaves) {
  return leaves.some((l) => l.employeeId === employeeId && l.status === 'approved' && iso >= l.from && iso <= l.to)
}

export function seedShifts({ employees, brands, holidays, leaves, rules }) {
  const out = []
  const hol = holidayLookup(holidays)
  const start = parseISO('2026-10-27')
  for (let n = 0; n < 21; n += 1) {
    const dt = addDays(start, n)
    const iso = format(dt, 'yyyy-MM-dd')
    const dow = dt.getDay()
    if (hol[iso] || !rules.workingDays.includes(dow)) continue
    employees.forEach((emp, i) => {
      if (emp.status !== 'Active') return
      if (emp.weeklyOff === dow) return
      if (onLeave(emp.id, iso, leaves)) return
      if ((n + i) % 9 === 0) return
      const brandId = emp.brandIds[(n + i) % emp.brandIds.length]
      const brand = brands.find((b) => b.id === brandId)
      const processCode = emp.processCodes.find((c) => brand?.processCodes.includes(c)) || emp.processCodes[0]
      const type = processCode === 'ACC' ? 'evening' : processCode === 'NDR' ? 'morning' : i % 5 === 0 ? 'special' : 'general'
      const tpl = SHIFT_TEMPLATES[type]
      const prev = [...out].reverse().find((s) => s.employeeId === emp.id)
      if (prev) {
        const rest = (parseISO(`${iso}T${tpl.start}:00`) - parseISO(`${prev.date}T${prev.end}:00`)) / 36e5
        if (rest < rules.minRestHours) return
      }
      out.push({
        id: `SH-${n}-${i}`,
        employeeId: emp.id,
        date: iso,
        start: tpl.start,
        end: tpl.end,
        breakMinutes: rules.breakMinutes,
        brandId,
        processCode,
        type,
        notes: '',
      })
    })
  }
  return out
}

export function createInitialState() {
  const shifts = seedShifts({
    employees: seedEmployees,
    brands: seedBrands,
    holidays: seedHolidays,
    leaves: seedLeaves,
    rules: defaultRules,
  })
  return {
    employees: seedEmployees,
    brands: seedBrands,
    processes: seedProcesses,
    pods: seedPods,
    leaves: seedLeaves,
    holidays: seedHolidays,
    shifts,
    rules: defaultRules,
    settings: defaultSettings,
    activities: seedActivities,
    dismissedConflicts: [],
  }
}
