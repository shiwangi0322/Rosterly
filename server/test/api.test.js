import test from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'

const app = createApp()
let token = ''

test.before(async () => {
  const login = await request(app).post('/api/auth/login').send({
    email: process.env.ADMIN_EMAIL || 'admin@datastraw.com',
    password: process.env.ADMIN_PASSWORD,
  })
  assert.equal(login.status, 200)
  token = login.body.token
})

test.after(async () => {
  await prisma.$disconnect()
})

const auth = () => ({ Authorization: `Bearer ${token}` })

test('rejects a missing token', async () => {
  const res = await request(app).get('/api/employees')
  assert.equal(res.status, 401)
  assert.match(res.body.error, /Sign in/)
})

test('rejects a bad password', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: 'admin@datastraw.com', password: 'wrong-password' })
  assert.equal(res.status, 401)
})

test('returns the signed-in admin without a password', async () => {
  const res = await request(app).get('/api/auth/me').set(auth())
  assert.equal(res.status, 200)
  assert.equal(res.body.email, 'admin@datastraw.com')
  assert.equal(res.body.passwordHash, undefined)
})

test('lists seeded employees, brands, pods and processes', async () => {
  const employees = await request(app).get('/api/employees?limit=50').set(auth())
  assert.equal(employees.status, 200)
  assert.equal(employees.body.total, 32)
  const brands = await request(app).get('/api/brands?limit=50').set(auth())
  assert.equal(brands.body.total, 12)
  const multi = brands.body.data.filter((b) => !b.singleResource)
  assert.equal(multi.length, 2)
  multi.forEach((b) => assert.ok(b.employeeIds.length >= 2 && b.employeeIds.length <= 3))
  const pods = await request(app).get('/api/pods?limit=20').set(auth())
  assert.equal(pods.body.total, 4)
  const processes = await request(app).get('/api/processes?limit=20').set(auth())
  assert.equal(processes.body.total, 4)
  const priya = employees.body.data.find((e) => e.id === 'RS-1002')
  assert.deepEqual(priya.brandIds, ['BR-001'])
  assert.ok(priya.processCodes.includes('CS'))
})

test('returns a validation error for a bad employee payload', async () => {
  const res = await request(app).post('/api/employees').set(auth()).send({ name: 'A' })
  assert.equal(res.status, 400)
  assert.equal(res.body.error, 'Validation failed')
  assert.ok(res.body.details.length > 0)
})

test('blocks an overlapping shift and keeps the database unchanged', async () => {
  const listed = await request(app).get('/api/shifts?employeeId=RS-1001&limit=1').set(auth())
  const existing = listed.body.data[0]
  assert.ok(existing)
  const before = await prisma.shift.count()
  const res = await request(app).post('/api/shifts').set(auth()).send({
    employeeId: existing.employeeId,
    brandId: existing.brandId,
    processCode: existing.processCode,
    date: existing.date,
    start: existing.start,
    end: existing.end,
    breakMinutes: existing.breakMinutes,
    type: existing.type,
  })
  assert.equal(res.status, 409)
  assert.match(res.body.error, /overlapping/)
  assert.equal(await prisma.shift.count(), before)
})

test('blocks a shift during approved leave', async () => {
  const res = await request(app).post('/api/shifts').set(auth()).send({
    employeeId: 'RS-1002',
    brandId: 'BR-001',
    processCode: 'CS',
    date: '2026-11-12',
    start: '10:00',
    end: '18:00',
    breakMinutes: 30,
    type: 'general',
  })
  assert.equal(res.status, 409)
  assert.match(res.body.error, /unavailable/i)
})

test('approves leave and cancels shifts inside the leave window', async () => {
  const created = await request(app).post('/api/leaves').set(auth()).send({
    employeeId: 'RS-1004',
    type: 'casual',
    from: '2027-03-02',
    to: '2027-03-02',
    reason: 'API test leave',
  })
  assert.equal(created.status, 201)
  assert.equal(created.body.status, 'pending')
  const shift = await request(app).post('/api/shifts').set(auth()).send({
    employeeId: 'RS-1004',
    brandId: 'BR-003',
    processCode: 'CS',
    date: '2027-03-02',
    start: '10:00',
    end: '18:00',
    breakMinutes: 30,
    type: 'general',
  })
  assert.equal(shift.status, 201, shift.body.error)
  const approved = await request(app).post(`/api/leaves/${created.body.id}/approve`).set(auth()).send({})
  assert.equal(approved.status, 200)
  assert.equal(approved.body.status, 'approved')
  assert.ok(approved.body.cancelledShiftIds.includes(shift.body.id))
  const stored = await prisma.shift.findUnique({ where: { id: shift.body.id } })
  assert.equal(stored.status, 'cancelled')
  const history = await prisma.leaveRequest.findUnique({ where: { id: created.body.id } })
  assert.equal(history.status, 'approved')
})

test('generates only valid shifts and reports gaps', async () => {
  const res = await request(app).post('/api/roster/generate').set(auth()).send({
    from: '2027-04-05',
    to: '2027-04-06',
    brandIds: ['BR-012'],
  })
  assert.equal(res.status, 201, JSON.stringify(res.body.error || res.body))
  assert.ok(Array.isArray(res.body.created))
  assert.ok(Array.isArray(res.body.unresolved))
  assert.ok(Array.isArray(res.body.rejections))
  for (const shift of res.body.created) {
    const row = await prisma.shift.findUnique({ where: { id: shift.id } })
    assert.equal(row.status, 'scheduled')
    assert.equal(shift.date >= '2027-04-05' && shift.date <= '2027-04-06', true)
  }
  const inactive = res.body.created.find((s) => s.employeeId === 'RS-1030')
  assert.equal(inactive, undefined)
  await prisma.shift.deleteMany({ where: { id: { in: res.body.created.map((s) => s.id) } } })
})

test('search and reports read persisted rows', async () => {
  const search = await request(app).get('/api/employees?search=Priya').set(auth())
  assert.equal(search.body.data.length, 1)
  assert.equal(search.body.data[0].id, 'RS-1002')
  const report = await request(app).get('/api/reports?from=2026-10-27&to=2026-11-16').set(auth())
  assert.equal(report.status, 200)
  assert.equal(report.body.employees, 32)
  assert.ok(report.body.shiftCount > 0)
  const conflicts = await request(app).get('/api/conflicts?from=2026-11-02&to=2026-11-07').set(auth())
  assert.equal(conflicts.status, 200)
  assert.ok(conflicts.body.total >= 0)
})
