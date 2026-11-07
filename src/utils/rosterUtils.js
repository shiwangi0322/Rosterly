import { addDays, eachDayOfInterval, format, parseISO, startOfWeek, endOfWeek } from 'date-fns'
import { SHIFT_TEMPLATES } from '../data/seed'

export const TYPES = {
  morning: { l: 'Morning', bg: '#E6F0FC', bd: '#5B8FD6' },
  evening: { l: 'Evening', bg: '#FFF0D8', bd: '#F59A18' },
  general: { l: 'General', bg: '#E6F4EE', bd: '#3FA277' },
  special: { l: 'Special', bg: '#F3EEE6', bd: '#8A6A45' },
  conflict: { l: 'Conflict', bg: '#FCE9E8', bd: '#E05252' },
  off: { l: 'Weekly Off', bg: '#F1F3F5', bd: '#A0A9B4' },
  leave: { l: 'Leave', bg: '#FCE9E8', bd: '#E05252' },
  holiday: { l: 'Holiday', bg: '#FFF5DF', bd: '#F59A18' },
}

export const LEAVE_LABELS = {
  casual: 'Casual Leave',
  sick: 'Sick Leave',
  planned: 'Planned Leave',
  compoff: 'Comp-Off',
}

export const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()

export const fmt12 = (t) => {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

export const mins = (t) => {
  const [h, m] = String(t).split(':').map(Number)
  return h * 60 + m
}

export const hoursBetween = (start, end, brk = 0) => Math.max(0, (mins(end) - mins(start) - Number(brk || 0)) / 60)

export const shiftHours = (s) => hoursBetween(s.start, s.end, s.breakMinutes)

export const overlaps = (a, b) => mins(a.start) < mins(b.end) && mins(b.start) < mins(a.end)

export const holidayName = (iso, holidays = []) => holidays.find((h) => h.date === iso)?.name

export const approvedLeaveOn = (employeeId, iso, leaves = []) =>
  leaves.find((l) => l.employeeId === employeeId && l.status === 'approved' && iso >= l.from && iso <= l.to)

export function dayState(employee, iso, { leaves = [], holidays = [] } = {}) {
  const leave = approvedLeaveOn(employee.id, iso, leaves)
  if (leave) return { k: 'leave', l: LEAVE_LABELS[leave.type] || leave.type }
  const hol = holidayName(iso, holidays)
  if (hol) return { k: 'holiday', l: hol }
  const date = parseISO(iso)
  if (date.getDay() === employee.weeklyOff) return { k: 'off', l: 'Weekly off' }
  return null
}

export const coverage = (shifts, brandId, date) =>
  new Set(shifts.filter((s) => s.brandId === brandId && s.date === date).map((s) => s.employeeId)).size

export function weekHours(employeeId, iso, shifts) {
  const day = parseISO(iso)
  const start = startOfWeek(day, { weekStartsOn: 1 })
  const end = endOfWeek(day, { weekStartsOn: 1 })
  return shifts
    .filter((s) => s.employeeId === employeeId && s.date >= format(start, 'yyyy-MM-dd') && s.date <= format(end, 'yyyy-MM-dd'))
    .reduce((n, s) => n + shiftHours(s), 0)
}

export function lastShiftBefore(employeeId, iso, start, shifts) {
  const prev = shifts
    .filter((s) => s.employeeId === employeeId && (s.date < iso || (s.date === iso && mins(s.end) <= mins(start))))
    .sort((a, b) => (a.date === b.date ? mins(b.end) - mins(a.end) : b.date.localeCompare(a.date)))[0]
  if (!prev) return true
  const prevEnd = parseISO(`${prev.date}T${prev.end}:00`)
  const nextStart = parseISO(`${iso}T${start}:00`)
  return (nextStart - prevEnd) / 36e5
}

export function exportCSV(rows, name) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  a.download = name
  a.click()
}

export function validateShift(f, shifts, ctx, editingId) {
  const { employees, leaves, holidays, rules, settings } = ctx
  if (!f.employeeId || !f.date || !f.brandId || !f.processCode || !f.start || !f.end) {
    return 'Fill in employee, date, brand, process and times.'
  }
  if (mins(f.end) <= mins(f.start)) return 'End time must be after start time.'
  const emp = employees.find((e) => e.id === f.employeeId)
  if (!emp) return 'Employee not found.'
  if (emp.status !== 'Active') return `${emp.name} is inactive and cannot be scheduled.`
  if (!emp.brandIds.includes(f.brandId)) return `${emp.name} is not assigned to this brand.`
  if (!emp.processCodes.includes(f.processCode)) return `${emp.name} is not assigned to this process.`
  const st = dayState(emp, f.date, { leaves, holidays })
  if (st?.k === 'leave' || st?.k === 'holiday') return `${emp.name} is unavailable: ${st.l}.`
  if (st?.k === 'off' && rules.weeklyOffRequired !== false) return `${emp.name} is unavailable: ${st.l}.`
  if (mins(f.start) < mins(emp.availabilityStart) || mins(f.end) > mins(emp.availabilityEnd)) {
    return `${emp.name} is only available ${fmt12(emp.availabilityStart)} – ${fmt12(emp.availabilityEnd)}.`
  }
  const duration = shiftHours(f)
  if (duration > rules.maxShiftHours) return `Shift is ${duration.toFixed(1)}h; maximum allowed is ${rules.maxShiftHours}h.`
  if (shifts.some((s) => s.id !== editingId && s.employeeId === f.employeeId && s.date === f.date && overlaps(s, f))) {
    return `${emp.name} already has an overlapping shift on this date.`
  }
  const others = shifts.filter((s) => s.id !== editingId)
  const weekly = weekHours(f.employeeId, f.date, others) + duration
  if (!rules.overtimeAllowed && weekly > rules.weeklyHours) {
    return `This would take ${emp.name} to ${weekly.toFixed(1)}h this week (cap ${rules.weeklyHours}h).`
  }
  if (weekly > rules.weeklyHours + 12) {
    return `${emp.name} would exceed a hard cap of ${rules.weeklyHours + 12} weekly hours.`
  }
  const rest = lastShiftBefore(f.employeeId, f.date, f.start, others)
  if (rest !== true && rest < rules.minRestHours) {
    return `Only ${rest.toFixed(1)}h rest before this shift; minimum is ${rules.minRestHours}h.`
  }
  const brk = Number(f.breakMinutes ?? settings.defaultBreak)
  if (brk < 0) return 'Break cannot be negative.'
  return ''
}

function eligibleForBrand(emp, brand, iso, shifts, ctx) {
  const { leaves, holidays, rules } = ctx
  if (emp.status !== 'Active') return false
  if (!emp.brandIds.includes(brand.id)) return false
  const processCode = emp.processCodes.find((c) => brand.processCodes.includes(c))
  if (!processCode) return false
  if (dayState(emp, iso, { leaves, holidays })) return false
  if (shifts.some((s) => s.employeeId === emp.id && s.date === iso)) return false
  if (weekHours(emp.id, iso, shifts) >= rules.weeklyHours) return false
  return { processCode }
}

export function generateRoster({ from, to, employees, brands, processes, leaves, holidays, shifts, rules, settings }) {
  const created = []
  const unresolved = []
  const all = [...shifts]
  const days = eachDayOfInterval({ start: parseISO(from), end: parseISO(to) })
  const ctx = { employees, leaves, holidays, rules, settings }

  days.forEach((day) => {
    const iso = format(day, 'yyyy-MM-dd')
    const dow = day.getDay()
    if (holidayName(iso, holidays)) return
    if (!rules.workingDays.includes(dow)) return

    brands.forEach((brand) => {
      let have = coverage(all, brand.id, iso)
      let need = brand.minCoverage - have
      if (need <= 0) return

      const ranked = employees
        .map((emp) => {
          const match = eligibleForBrand(emp, brand, iso, all, ctx)
          if (!match) return null
          return { emp, processCode: match.processCode, load: weekHours(emp.id, iso, all) }
        })
        .filter(Boolean)
        .sort((a, b) => a.load - b.load)

      ranked.forEach(({ emp, processCode }) => {
        if (need <= 0) return
        const process = processes.find((p) => p.code === processCode)
        const type = (process?.shiftTypes || ['general']).find((t) => {
          const tpl = SHIFT_TEMPLATES[t]
          return mins(tpl.start) >= mins(emp.availabilityStart) && mins(tpl.end) <= mins(emp.availabilityEnd)
        }) || process?.shiftTypes?.[0] || 'general'
        const tpl = SHIFT_TEMPLATES[type] || SHIFT_TEMPLATES.general
        const draft = {
          id: uid('SH'),
          employeeId: emp.id,
          date: iso,
          start: tpl.start,
          end: tpl.end,
          breakMinutes: rules.breakMinutes,
          brandId: brand.id,
          processCode,
          type,
          notes: 'Auto-generated',
        }
        const err = validateShift(draft, all, ctx, null)
        if (err) return
        all.push(draft)
        created.push(draft)
        need -= 1
      })

      if (need > 0) {
        unresolved.push({
          id: uid('CF'),
          type: 'understaffing',
          severity: have === 0 ? 'critical' : 'high',
          date: iso,
          brandId: brand.id,
          title: `${brand.name} short by ${need} on ${iso}`,
          detail: `Required ${brand.minCoverage}, assigned ${brand.minCoverage - need}. Eligible staff were on leave, weekly off, or already at hour/rest limits.`,
        })
      }
    })
  })

  return { created, unresolved }
}

export function detectConflicts({ employees, brands, shifts, leaves, holidays, rules, from, to }) {
  const items = []
  const start = from || (shifts[0]?.date ?? format(new Date(), 'yyyy-MM-dd'))
  const end = to || (shifts[shifts.length - 1]?.date ?? start)
  const days = eachDayOfInterval({ start: parseISO(start), end: parseISO(end) })

  employees.forEach((emp) => {
    const byDate = {}
    shifts.filter((s) => s.employeeId === emp.id).forEach((s) => {
      byDate[s.date] = byDate[s.date] || []
      byDate[s.date].push(s)
    })
    Object.entries(byDate).forEach(([date, list]) => {
      list.forEach((a, i) => {
        list.slice(i + 1).forEach((b) => {
          if (overlaps(a, b)) {
            items.push({
              id: `overlap|${a.id}|${b.id}`,
              type: 'overlap',
              severity: 'critical',
              date,
              employeeId: emp.id,
              shiftIds: [a.id, b.id],
              title: `Overlapping shifts for ${emp.name}`,
              detail: `${fmt12(a.start)}–${fmt12(a.end)} collides with ${fmt12(b.start)}–${fmt12(b.end)} on ${date}.`,
              suggestion: 'Keep one shift and delete or move the other to a free slot.',
              resolveAction: 'removeLaterShift',
            })
          }
        })
      })
      const leave = approvedLeaveOn(emp.id, date, leaves)
      if (leave && list.length) {
        items.push({
          id: `leave|${emp.id}|${date}`,
          type: 'leave',
          severity: 'critical',
          date,
          employeeId: emp.id,
          shiftIds: list.map((s) => s.id),
          title: `${emp.name} is rostered while on ${LEAVE_LABELS[leave.type]}`,
          detail: `Approved leave ${leave.from} to ${leave.to}, but ${list.length} shift(s) exist on ${date}.`,
          suggestion: 'Remove the shifts so availability stays accurate.',
          resolveAction: 'removeShifts',
        })
      }
      if (parseISO(date).getDay() === emp.weeklyOff && list.length) {
        items.push({
          id: `off|${emp.id}|${date}`,
          type: 'weeklyOff',
          severity: 'high',
          date,
          employeeId: emp.id,
          shiftIds: list.map((s) => s.id),
          title: `${emp.name} scheduled on weekly off`,
          detail: `Weekly off is ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][emp.weeklyOff]}.`,
          suggestion: 'Move coverage to another employee or change the weekly off.',
          resolveAction: 'removeShifts',
        })
      }
    })
  })

  const weekBuckets = {}
  shifts.forEach((s) => {
    const ws = format(startOfWeek(parseISO(s.date), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const key = `${s.employeeId}|${ws}`
    weekBuckets[key] = (weekBuckets[key] || 0) + shiftHours(s)
  })
  employees.forEach((emp) => {
    const list = shifts
      .filter((s) => s.employeeId === emp.id)
      .sort((a, b) => (a.date === b.date ? mins(a.start) - mins(b.start) : a.date.localeCompare(b.date)))
    list.forEach((cur, i) => {
      if (!i) return
      const rest = lastShiftBefore(emp.id, cur.date, cur.start, list.slice(0, i))
      if (rest !== true && rest < rules.minRestHours) {
        items.push({
          id: `rest|${list[i - 1].id}|${cur.id}`,
          type: 'hours',
          severity: 'high',
          date: cur.date,
          employeeId: emp.id,
          shiftIds: [list[i - 1].id, cur.id],
          title: `${emp.name} has only ${rest.toFixed(1)}h rest before ${cur.date}`,
          detail: `Minimum rest is ${rules.minRestHours}h. Previous shift ended at ${fmt12(list[i - 1].end)} on ${list[i - 1].date}.`,
          suggestion: 'Move one shift or assign coverage to another trained employee.',
          resolveAction: 'removeLaterShift',
        })
      }
    })
  })

  Object.entries(weekBuckets).forEach(([key, hrs]) => {
    if (hrs <= rules.weeklyHours + (rules.overtimeAllowed ? 8 : 0)) return
    const [employeeId, weekStart] = key.split('|')
    const emp = employees.find((e) => e.id === employeeId)
    items.push({
      id: `hours|${key}`,
      type: 'hours',
      severity: 'medium',
      date: weekStart,
      employeeId,
      shiftIds: [],
      title: `${emp?.name || employeeId} at ${hrs.toFixed(1)}h for week of ${weekStart}`,
      detail: `Weekly cap is ${rules.weeklyHours}h${rules.overtimeAllowed ? ` with overtime after ${rules.overtimeAfterHours}h` : ''}.`,
      suggestion: 'Drop a shift or split coverage across the pod.',
      resolveAction: 'trimHours',
    })
  })

  days.forEach((day) => {
    const iso = format(day, 'yyyy-MM-dd')
    if (holidayName(iso, holidays)) return
    if (!rules.workingDays.includes(day.getDay())) return
    brands.forEach((brand) => {
      const c = coverage(shifts, brand.id, iso)
      if (c >= brand.minCoverage) return
      items.push({
        id: `cover|${brand.id}|${iso}`,
        type: c === 0 ? 'missing' : 'understaffing',
        severity: c === 0 ? 'critical' : 'high',
        date: iso,
        brandId: brand.id,
        shiftIds: [],
        title: `${brand.name} ${c === 0 ? 'has no coverage' : `has ${c}/${brand.minCoverage}`} on ${iso}`,
        detail: `Minimum staffing is ${brand.minCoverage}. Generate roster or add a shift for an eligible employee.`,
        suggestion: 'Open Schedule and generate roster for this date, or assign a trained backup.',
        resolveAction: 'fillCoverage',
      })
    })
  })

  const order = { critical: 0, high: 1, medium: 2 }
  return items.sort((a, b) => order[a.severity] - order[b.severity] || a.date.localeCompare(b.date))
}

export function isoRange(days) {
  return days.map((d) => format(d, 'yyyy-MM-dd'))
}

export function leaveDays(from, to) {
  return differenceSafe(from, to)
}

function differenceSafe(from, to) {
  try {
    return eachDayOfInterval({ start: parseISO(from), end: parseISO(to) }).length
  } catch {
    return 0
  }
}

export { addDays }
