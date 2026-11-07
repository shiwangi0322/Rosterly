const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const TOKEN_KEY = 'rosterly-token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function errorText(error) {
  if (error?.details?.length) return error.details.map((item) => item.message).join(' ')
  return error?.message || 'Request failed'
}

export async function api(path, { method = 'GET', body, token = getToken(), auth = true } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401 && auth && token) {
      setToken('')
      window.dispatchEvent(new Event('rosterly-unauthorized'))
    }
    const error = new Error(data.error || 'Request failed')
    error.status = response.status
    error.details = data.details
    throw error
  }
  return data
}

export async function apiList(path) {
  const first = await api(path)
  if (Array.isArray(first)) return first
  const limit = 100
  const rows = [...(first.data || [])]
  const total = first.total ?? rows.length
  let page = first.page || 1
  while (rows.length < total) {
    page += 1
    const joiner = path.includes('?') ? '&' : '?'
    const next = await api(`${path}${joiner}page=${page}&limit=${limit}`)
    const chunk = next.data || []
    if (!chunk.length) break
    rows.push(...chunk)
  }
  return rows
}

export async function loginRequest(email, password) {
  const data = await api('/auth/login', { method: 'POST', body: { email, password }, auth: false })
  setToken(data.token)
  return data
}

export async function signupRequest(name, email, password) {
  const data = await api('/auth/signup', { method: 'POST', body: { name, email, password }, auth: false })
  setToken(data.token)
  return data
}

const hhmm = (value) => String(value || '').slice(0, 5)

export function employeeBody(row) {
  return {
    ...(row.id ? { id: row.id } : {}),
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    podId: row.podId,
    brandIds: row.brandIds,
    processCodes: row.processCodes,
    weeklyOff: Number(row.weeklyOff),
    status: row.status,
    availabilityStart: hhmm(row.availabilityStart),
    availabilityEnd: hhmm(row.availabilityEnd),
    joined: row.joined,
  }
}

export function brandBody(row) {
  return {
    ...(row.id ? { id: row.id } : {}),
    name: row.name,
    category: row.category,
    podId: row.podId,
    minCoverage: Number(row.minCoverage),
    singleResource: Boolean(row.singleResource),
    processCodes: row.processCodes,
  }
}

export function processBody(row) {
  return {
    ...(row.id ? { id: row.id } : {}),
    code: row.code,
    name: row.name,
    description: row.description,
    requiredStaff: Number(row.requiredStaff),
    brandIds: row.brandIds,
    shiftTypes: row.shiftTypes?.length ? row.shiftTypes : ['general'],
    defaultStart: hhmm(row.defaultStart),
    defaultEnd: hhmm(row.defaultEnd),
  }
}

export function podBody(row) {
  return {
    ...(row.id ? { id: row.id } : {}),
    name: row.name,
    short: row.short,
    description: row.description,
    leadId: row.leadId || null,
  }
}

export function shiftBody(row) {
  return {
    ...(row.id ? { id: row.id } : {}),
    employeeId: row.employeeId,
    brandId: row.brandId,
    processCode: row.processCode,
    date: row.date,
    start: hhmm(row.start),
    end: hhmm(row.end),
    breakMinutes: Number(row.breakMinutes),
    type: row.type,
    notes: row.notes || '',
    status: row.status || 'scheduled',
  }
}

export function rulesBody(row) {
  return {
    workingDays: [...row.workingDays].map(Number).sort((a, b) => a - b),
    weeklyHours: Math.round(Number(row.weeklyHours)),
    maxShiftHours: Math.round(Number(row.maxShiftHours)),
    minRestHours: Math.round(Number(row.minRestHours)),
    breakMinutes: Math.round(Number(row.breakMinutes)),
    weeklyOffRequired: Boolean(row.weeklyOffRequired),
    overtimeAllowed: Boolean(row.overtimeAllowed),
    overtimeAfterHours: Math.round(Number(row.overtimeAfterHours)),
  }
}

export function settingsBody(row) {
  return {
    orgName: row.orgName,
    orgEmail: row.orgEmail,
    timezone: row.timezone,
    weekStartsOn: Number(row.weekStartsOn),
    defaultShiftStart: hhmm(row.defaultShiftStart),
    defaultShiftEnd: hhmm(row.defaultShiftEnd),
    defaultBreak: Number(row.defaultBreak),
    defaultShiftType: row.defaultShiftType,
    notifyEmail: Boolean(row.notifyEmail),
    notifyInApp: Boolean(row.notifyInApp),
    notifyCoverage: Boolean(row.notifyCoverage),
    notifyLeave: Boolean(row.notifyLeave),
    adminName: row.adminName,
    adminEmail: row.adminEmail,
    adminRole: row.adminRole,
  }
}
