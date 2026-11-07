import { createInitialState, seedEmployees, seedBrands, seedPods, seedProcesses, seedLeaves, seedHolidays, defaultRules, defaultSettings } from '../src/data/seed.js'
import { generateRoster, validateShift, detectConflicts } from '../src/utils/rosterUtils.js'

const fail = (msg) => { console.error('FAIL:', msg); process.exitCode = 1 }
const pass = (msg) => console.log('PASS:', msg)

const emp = seedEmployees
const brands = seedBrands
pass(`employees ${emp.length} (>=32)`)
if (emp.length < 32) fail('Need 32+ employees')
pass(`brands ${brands.length}`)
if (brands.length !== 12) fail('Need 12 brands')
pass(`pods ${seedPods.length}`)
if (seedPods.length !== 4) fail('Need 4 pods')
pass(`processes ${seedProcesses.length}`)
if (seedProcesses.length !== 4) fail('Need 4 processes')

const single = brands.filter((b) => b.singleResource).length
const pct = Math.round((single / brands.length) * 100)
pass(`single-resource brands ${single}/${brands.length} (${pct}%)`)
if (pct < 75) fail('Expected ~80% single-resource brands')

const multiCounts = brands.filter((b) => !b.singleResource).map((b) => ({
  name: b.name,
  n: emp.filter((e) => e.brandIds.includes(b.id)).length,
}))
multiCounts.forEach((b) => {
  if (b.n < 2 || b.n > 8) fail(`${b.name} has ${b.n} people (expected several assigned)`)
})
pass(`multi-resource assignments: ${multiCounts.map((b) => `${b.name}=${b.n}`).join(', ')}`)

const overlapping = emp.filter((e) => e.processCodes.length > 1).length
pass(`employees with overlapping processes ${overlapping}`)
if (overlapping < 8) fail('Need multiple overlapping process assignments')

const offs = new Set(emp.map((e) => e.weeklyOff))
if (offs.size < 5) fail('Weekly offs should be distributed')
pass(`weekly off days used: ${[...offs].sort().join(',')}`)

const types = new Set(seedLeaves.map((l) => l.type))
const statuses = new Set(seedLeaves.map((l) => l.status))
if (!types.has('compoff') || !types.has('sick') || !types.has('casual') || !types.has('planned')) fail('Missing leave types')
if (!statuses.has('approved') || !statuses.has('pending') || !statuses.has('rejected')) fail('Missing leave statuses')
pass(`leaves ${seedLeaves.length} types=${[...types].join(',')} statuses=${[...statuses].join(',')}`)
pass(`holidays ${seedHolidays.length}`)
if (emp.filter((e) => e.status === 'Inactive').length < 1) fail('Need an inactive employee')
pass('inactive employee present')

const ctx = { employees: emp, leaves: seedLeaves, holidays: seedHolidays, rules: defaultRules, settings: defaultSettings }
const base = createInitialState()

const onLeave = emp.find((e) => e.id === 'RS-1010')
const leaveMsg = validateShift({
  employeeId: onLeave.id, date: '2026-11-06', start: '10:00', end: '18:00', breakMinutes: 30,
  brandId: onLeave.brandIds[0], processCode: onLeave.processCodes[0], type: 'general',
}, [], ctx)
if (!/unavailable/i.test(leaveMsg)) fail(`leave should block: ${leaveMsg}`)
else pass(`approved leave blocked: ${leaveMsg}`)

const offEmp = emp.find((e) => e.weeklyOff === 5)
const friday = '2026-11-06'
const offMsg = validateShift({
  employeeId: offEmp.id, date: friday, start: '10:00', end: '18:00', breakMinutes: 30,
  brandId: offEmp.brandIds[0], processCode: offEmp.processCodes[0], type: 'general',
}, [], ctx)
if (!/weekly off|unavailable/i.test(offMsg)) fail(`weekly off should block ${offEmp.name}: ${offMsg}`)
else pass(`weekly off blocked: ${offMsg}`)

const active = emp.find((e) => e.status === 'Active' && e.id === 'RS-1002')
const existing = { id: 'SH-x', employeeId: active.id, date: '2026-11-10', start: '10:00', end: '18:00', breakMinutes: 30, brandId: active.brandIds[0], processCode: active.processCodes[0], type: 'general' }
const overlapMsg = validateShift({ ...existing, id: 'SH-y', start: '12:00', end: '20:00' }, [existing], ctx)
if (!/overlap/i.test(overlapMsg)) fail(`overlap should block: ${overlapMsg}`)
else pass(`existing overlapping shift blocked: ${overlapMsg}`)

const inactive = emp.find((e) => e.status === 'Inactive')
const inactMsg = validateShift({
  employeeId: inactive.id, date: '2026-11-10', start: '10:00', end: '18:00', breakMinutes: 30,
  brandId: inactive.brandIds[0], processCode: inactive.processCodes[0], type: 'general',
}, [], ctx)
if (!/inactive/i.test(inactMsg)) fail(`inactive should block: ${inactMsg}`)
else pass(`inactive blocked: ${inactMsg}`)

const nikeOnly = emp.find((e) => e.brandIds.includes('BR-001') && e.processCodes.includes('CS'))
const brandMsg = validateShift({
  employeeId: nikeOnly.id, date: '2026-11-10', start: '10:00', end: '18:00', breakMinutes: 30,
  brandId: 'BR-012', processCode: 'CS', type: 'general',
}, [], ctx)
if (!/not assigned to this brand/i.test(brandMsg)) fail(`wrong brand should block: ${brandMsg}`)
else pass(`wrong brand blocked: ${brandMsg}`)

const procMsg = validateShift({
  employeeId: nikeOnly.id, date: '2026-11-10', start: '10:00', end: '18:00', breakMinutes: 30,
  brandId: nikeOnly.brandIds[0], processCode: 'NDR', type: 'morning',
}, [], ctx)
if (!/not assigned to this process/i.test(procMsg)) fail(`wrong process should block: ${procMsg}`)
else pass(`wrong process blocked: ${procMsg}`)

const hoursShifts = Array.from({ length: 5 }, (_, i) => ({
  id: `H-${i}`,
  employeeId: active.id,
  date: `2026-11-${String(9 + i).padStart(2, '0')}`,
  start: '08:00',
  end: '16:30',
  breakMinutes: 0,
  brandId: active.brandIds[0],
  processCode: active.processCodes[0],
  type: 'morning',
}))
const noOt = { ...ctx, rules: { ...defaultRules, overtimeAllowed: false, weeklyHours: 48 } }
const hoursMsg = validateShift({
  employeeId: active.id, date: '2026-11-14', start: '08:00', end: '16:30', breakMinutes: 0,
  brandId: active.brandIds[0], processCode: active.processCodes[0], type: 'morning',
}, hoursShifts, noOt)
if (!/cap|exceed|take/i.test(hoursMsg)) fail(`weekly hours should block: ${hoursMsg}`)
else pass(`weekly hours blocked: ${hoursMsg}`)

const restMsg = validateShift({
  employeeId: active.id, date: '2026-11-11', start: '08:00', end: '16:00', breakMinutes: 30,
  brandId: active.brandIds[0], processCode: active.processCodes[0], type: 'morning',
}, [{ id: 'R1', employeeId: active.id, date: '2026-11-10', start: '14:00', end: '22:00', breakMinutes: 30, brandId: active.brandIds[0], processCode: active.processCodes[0], type: 'evening' }], ctx)
if (!/rest/i.test(restMsg)) fail(`rest should block: ${restMsg}`)
else pass(`min rest blocked: ${restMsg}`)

const isolated = emp.find((e) => e.brandIds.length === 1 && e.status === 'Active' && e.weeklyOff !== 2)
const gen = generateRoster({
  from: '2026-11-10',
  to: '2026-11-10',
  employees: emp.map((e) => (e.id === isolated.id ? { ...e, status: 'Inactive' } : e.status === 'Active' && e.brandIds.includes(isolated.brandIds[0]) ? { ...e, brandIds: e.brandIds.filter((id) => id !== isolated.brandIds[0]) } : e)),
  brands: brands.filter((b) => b.id === isolated.brandIds[0]).map((b) => ({ ...b, minCoverage: 2 })),
  processes: seedProcesses,
  leaves: seedLeaves,
  holidays: seedHolidays,
  shifts: [],
  rules: defaultRules,
  settings: defaultSettings,
})
if (!gen.unresolved.length) fail('insufficient staffing should list unresolved coverage')
if (gen.created.some((s) => s.employeeId === isolated.id)) fail('inactive employee was rostered')
pass(`insufficient staffing reported: ${gen.unresolved[0]?.title}`)

const leaveDay = generateRoster({
  from: '2026-11-06',
  to: '2026-11-06',
  employees: emp,
  brands,
  processes: seedProcesses,
  leaves: seedLeaves,
  holidays: seedHolidays,
  shifts: [],
  rules: defaultRules,
  settings: defaultSettings,
})
if (leaveDay.created.some((s) => s.employeeId === 'RS-1010')) fail('generated a shift for Meera Reddy on approved leave')
pass(`generate roster skipped leave (${leaveDay.created.length} valid fills, ${leaveDay.unresolved.length} gaps)`)

const existingDay = generateRoster({
  from: '2026-11-10',
  to: '2026-11-10',
  employees: emp,
  brands: brands.filter((b) => b.id === active.brandIds[0]),
  processes: seedProcesses,
  leaves: [],
  holidays: [],
  shifts: [existing],
  rules: defaultRules,
  settings: defaultSettings,
})
if (existingDay.created.some((s) => s.employeeId === active.id)) fail('generated a second shift on a day already rostered')
pass('generate roster skipped employee who already had a shift')

const conflicts = detectConflicts({
  employees: emp,
  brands,
  shifts: base.shifts,
  leaves: seedLeaves,
  holidays: seedHolidays,
  rules: defaultRules,
  from: '2026-10-27',
  to: '2026-11-16',
})
pass(`detectConflicts returned ${conflicts.length} items from seed range`)
if (!conflicts.some((c) => c.type === 'understaffing' || c.type === 'missing')) {
  fail('expected at least one coverage conflict in the seeded range')
} else pass('coverage conflicts present')

if (process.exitCode) {
  console.error('\nVerification finished with failures.')
  process.exit(1)
}
console.log('\nAll assignment and scheduling checks passed.')
