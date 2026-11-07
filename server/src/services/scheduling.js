import { addDays, eachDayOfInterval, format, parseISO, startOfWeek, endOfWeek } from 'date-fns'

export const SHIFT_TEMPLATES = {
  morning: { start: '08:00', end: '16:00', type: 'morning' },
  evening: { start: '14:00', end: '22:00', type: 'evening' },
  general: { start: '10:00', end: '18:00', type: 'general' },
  special: { start: '12:00', end: '20:00', type: 'special' },
}

export const LEAVE_LABELS = {
  casual: 'Casual Leave',
  sick: 'Sick Leave',
  planned: 'Planned Leave',
  compoff: 'Comp-Off',
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

export const mins = (t) => {
  const [h, m] = String(t).split(':').map(Number)
  return h * 60 + m
}

export const shiftHours = (s) => Math.max(0, (mins(s.end) - mins(s.start) - Number(s.breakMinutes || 0)) / 60)

export const overlaps = (a, b) => mins(a.start) < mins(b.end) && mins(b.start) < mins(a.end)

export const holidayName = (iso, holidays = []) => holidays.find((h) => h.date === iso)?.name

export const approvedLeaveOn = (employeeId, iso, leaves = []) =>
  leaves.find((l) => l.employeeId === employeeId && l.status === 'approved' && iso >= l.from && iso <= l.to)

export function dayState(employee, iso, { leaves = [], holidays = [] } = {}) {
  const leave = approvedLeaveOn(employee.id, iso, leaves)
  if (leave) return { k: 'leave', l: LEAVE_LABELS[leave.type] || leave.type }
  const hol = holidayName(iso, holidays)
  if (hol) return { k: 'holiday', l: hol }
  if (parseISO(iso).getDay() === employee.weeklyOff) return { k: 'off', l: 'Weekly off' }
  return null
}

export const coverage = (shifts, brandId, date) =>
  new Set(shifts.filter((s) => s.brandId === brandId && s.date === date && s.status !== 'cancelled').map((s) => s.employeeId)).size

export function weekHours(employeeId, iso, shifts) {
  const day = parseISO(iso)
  const start = format(startOfWeek(day, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const end = format(endOfWeek(day, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  return shifts
    .filter((s) => s.status !== 'cancelled' && s.employeeId === employeeId && s.date >= start && s.date <= end)
    .reduce((n, s) => n + shiftHours(s), 0)
}

export function lastShiftBefore(employeeId, iso, start, shifts) {
  const prev = shifts
    .filter((s) => s.status !== 'cancelled' && s.employeeId === employeeId && (s.date < iso || (s.date === iso && mins(s.end) <= mins(start))))
    .sort((a, b) => (a.date === b.date ? mins(b.end) - mins(a.end) : b.date.localeCompare(a.date)))[0]
  if (!prev) return true
  const prevEnd = parseISO(`${prev.date}T${prev.end}:00`)
  const nextStart = parseISO(`${iso}T${start}:00`)
  return (nextStart - prevEnd) / 36e5
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
  const brand = ctx.brands?.find((b) => b.id === f.brandId)
  if (brand && !brand.processCodes.includes(f.processCode)) return `${brand.name} does not run process ${f.processCode}.`
  const st = dayState(emp, f.date, { leaves, holidays })
  if (st?.k === 'leave' || st?.k === 'holiday') return `${emp.name} is unavailable: ${st.l}.`
  if (st?.k === 'off' && rules.weeklyOffRequired !== false) return `${emp.name} is unavailable: ${st.l}.`
  if (mins(f.start) < mins(emp.availabilityStart) || mins(f.end) > mins(emp.availabilityEnd)) {
    return `${emp.name} is only available ${emp.availabilityStart} – ${emp.availabilityEnd}.`
  }
  const duration = shiftHours(f)
  if (duration > rules.maxShiftHours) return `Shift is ${duration.toFixed(1)}h; maximum allowed is ${rules.maxShiftHours}h.`
  const active = shifts.filter((s) => s.status !== 'cancelled')
  if (active.some((s) => s.id !== editingId && s.employeeId === f.employeeId && s.date === f.date && overlaps(s, f))) {
    return `${emp.name} already has an overlapping shift on this date.`
  }
  const others = active.filter((s) => s.id !== editingId)
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
  const brk = Number(f.breakMinutes ?? settings?.defaultBreak ?? 0)
  if (brk < 0) return 'Break cannot be negative.'
  return ''
}

function assignmentBlocker(emp, brand, iso, shifts, ctx) {
  if (!emp.brandIds.includes(brand.id)) return null
  if (emp.status !== 'Active') return `${emp.name} is inactive.`
  const processCode = emp.processCodes.find((c) => brand.processCodes.includes(c))
  if (!processCode) return `${emp.name} is not trained on a process this brand runs.`
  const st = dayState(emp, iso, ctx)
  if (st?.k === 'leave' || st?.k === 'holiday') return `${emp.name} is unavailable: ${st.l}.`
  if (st?.k === 'off' && ctx.rules.weeklyOffRequired !== false) return `${emp.name} is on weekly off (${WEEKDAYS[emp.weeklyOff]}).`
  if (shifts.some((s) => s.status !== 'cancelled' && s.employeeId === emp.id && s.date === iso)) {
    return `${emp.name} already has a shift on ${iso}.`
  }
  if (weekHours(emp.id, iso, shifts) >= ctx.rules.weeklyHours) {
    return `${emp.name} is already at ${ctx.rules.weeklyHours}h this week.`
  }
  return ''
}

export function generateRoster({ from, to, employees, brands, processes, leaves, holidays, shifts, rules, settings }) {
  const created = []
  const unresolved = []
  const rejections = []
  const all = shifts.map((s) => ({ ...s }))
  const days = eachDayOfInterval({ start: parseISO(from), end: parseISO(to) })
  const ctx = { employees, brands, leaves, holidays, rules, settings }

  days.forEach((day) => {
    const iso = format(day, 'yyyy-MM-dd')
    const dow = day.getDay()
    if (holidayName(iso, holidays)) return
    if (!rules.workingDays.includes(dow)) return

    brands.forEach((brand) => {
      let have = coverage(all, brand.id, iso)
      let need = brand.minCoverage - have
      if (need <= 0) return

      const ranked = []
      employees.forEach((emp) => {
        const blocker = assignmentBlocker(emp, brand, iso, all, ctx)
        if (blocker === null) return
        if (blocker) {
          rejections.push({ employeeId: emp.id, employeeName: emp.name, brandId: brand.id, date: iso, reason: blocker })
          return
        }
        const processCode = emp.processCodes.find((c) => brand.processCodes.includes(c))
        ranked.push({ emp, processCode, load: weekHours(emp.id, iso, all) })
      })
      ranked.sort((a, b) => a.load - b.load)

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
          status: 'scheduled',
          notes: 'Auto-generated',
        }
        const err = validateShift(draft, all, ctx, null)
        if (err) {
          rejections.push({ employeeId: emp.id, employeeName: emp.name, brandId: brand.id, date: iso, reason: err })
          return
        }
        all.push(draft)
        created.push(draft)
        need -= 1
      })

      if (need > 0) {
        unresolved.push({
          type: 'understaffing',
          severity: have === 0 && brand.minCoverage - need === 0 ? 'critical' : 'high',
          date: iso,
          brandId: brand.id,
          title: `${brand.name} short by ${need} on ${iso}`,
          detail: `Required ${brand.minCoverage}, assigned ${brand.minCoverage - need}.`,
        })
      }
    })
  })

  return { created, unresolved, rejections }
}

export function detectConflicts({ employees, brands, shifts, leaves, holidays, rules, from, to }) {
  const items = []
  const active = shifts.filter((s) => s.status !== 'cancelled')
  const start = from || active[0]?.date
  const end = to || active[active.length - 1]?.date
  if (!start || !end) return []
  const days = eachDayOfInterval({ start: parseISO(start), end: parseISO(end) })

  employees.forEach((emp) => {
    const byDate = {}
    active.filter((s) => s.employeeId === emp.id).forEach((s) => {
      byDate[s.date] = byDate[s.date] || []
      byDate[s.date].push(s)
    })
    Object.entries(byDate).forEach(([date, list]) => {
      list.forEach((a, i) => {
        list.slice(i + 1).forEach((b) => {
          if (!overlaps(a, b)) return
          items.push({
            id: `overlap|${a.id}|${b.id}`,
            type: 'overlap',
            severity: 'critical',
            date,
            employeeId: emp.id,
            brandId: a.brandId,
            shiftIds: [a.id, b.id],
            title: `Overlapping shifts for ${emp.name}`,
            detail: `${a.start}–${a.end} collides with ${b.start}–${b.end} on ${date}.`,
          })
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
          title: `${emp.name} is rostered while on ${LEAVE_LABELS[leave.type] || leave.type}`,
          detail: `Approved leave ${leave.from} to ${leave.to}.`,
        })
      }
      if (parseISO(date).getDay() === emp.weeklyOff && list.length && rules.weeklyOffRequired !== false) {
        items.push({
          id: `off|${emp.id}|${date}`,
          type: 'weeklyOff',
          severity: 'high',
          date,
          employeeId: emp.id,
          shiftIds: list.map((s) => s.id),
          title: `${emp.name} scheduled on weekly off`,
          detail: `Weekly off is ${WEEKDAYS[emp.weeklyOff]}.`,
        })
      }
    })
  })

  const weekBuckets = {}
  active.forEach((s) => {
    const ws = format(startOfWeek(parseISO(s.date), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const key = `${s.employeeId}|${ws}`
    weekBuckets[key] = (weekBuckets[key] || 0) + shiftHours(s)
  })
  employees.forEach((emp) => {
    const list = active
      .filter((s) => s.employeeId === emp.id)
      .sort((a, b) => (a.date === b.date ? mins(a.start) - mins(b.start) : a.date.localeCompare(b.date)))
    list.forEach((cur, i) => {
      if (!i) return
      const rest = lastShiftBefore(emp.id, cur.date, cur.start, list.slice(0, i))
      if (rest !== true && rest < rules.minRestHours) {
        items.push({
          id: `rest|${list[i - 1].id}|${cur.id}`,
          type: 'rest',
          severity: 'high',
          date: cur.date,
          employeeId: emp.id,
          shiftIds: [list[i - 1].id, cur.id],
          title: `${emp.name} has only ${rest.toFixed(1)}h rest before ${cur.date}`,
          detail: `Minimum rest is ${rules.minRestHours}h.`,
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
      detail: `Weekly target is ${rules.weeklyHours}h.`,
    })
  })

  days.forEach((day) => {
    const iso = format(day, 'yyyy-MM-dd')
    if (holidayName(iso, holidays)) return
    if (!rules.workingDays.includes(day.getDay())) return
    brands.forEach((brand) => {
      const c = coverage(active, brand.id, iso)
      if (c >= brand.minCoverage) return
      items.push({
        id: `cover|${brand.id}|${iso}`,
        type: c === 0 ? 'missing' : 'understaffing',
        severity: c === 0 ? 'critical' : 'high',
        date: iso,
        brandId: brand.id,
        shiftIds: [],
        title: `${brand.name} ${c === 0 ? 'has no coverage' : `has ${c}/${brand.minCoverage}`} on ${iso}`,
        detail: `Minimum staffing is ${brand.minCoverage}.`,
      })
    })
  })

  const order = { critical: 0, high: 1, medium: 2 }
  return items.sort((a, b) => order[a.severity] - order[b.severity] || a.date.localeCompare(b.date))
}

export function buildSeedShifts({ employees, brands, holidays, leaves, rules }) {
  const out = []
  const hol = Object.fromEntries(holidays.map((h) => [h.date, h.name]))
  const start = parseISO('2026-10-27')
  for (let n = 0; n < 21; n += 1) {
    const dt = addDays(start, n)
    const iso = format(dt, 'yyyy-MM-dd')
    const dow = dt.getDay()
    if (hol[iso] || !rules.workingDays.includes(dow)) continue
    employees.forEach((emp, i) => {
      if (emp.status !== 'Active') return
      if (emp.weeklyOff === dow) return
      if (leaves.some((l) => l.employeeId === emp.id && l.status === 'approved' && iso >= l.from && iso <= l.to)) return
      if ((n + i) % 9 === 0) return
      const brandId = emp.brandIds[(n + i) % emp.brandIds.length]
      const brand = brands.find((b) => b.id === brandId)
      const processCode = emp.processCodes.find((c) => brand?.processCodes.includes(c)) || emp.processCodes[0]
      let type = processCode === 'ACC' ? 'evening' : processCode === 'NDR' ? 'morning' : i % 5 === 0 ? 'special' : 'general'
      let tpl = SHIFT_TEMPLATES[type]
      if (mins(tpl.start) < mins(emp.availabilityStart) || mins(tpl.end) > mins(emp.availabilityEnd)) {
        const fallback = Object.values(SHIFT_TEMPLATES).find(
          (item) => mins(item.start) >= mins(emp.availabilityStart) && mins(item.end) <= mins(emp.availabilityEnd),
        )
        if (!fallback) return
        tpl = fallback
        type = fallback.type
      }
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
        status: 'scheduled',
        notes: '',
      })
    })
  }
  return out
}
