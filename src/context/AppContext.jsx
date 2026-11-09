import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  api,
  apiList,
  brandBody,
  employeeBody,
  errorText,
  getToken,
  loginRequest,
  signupRequest,
  podBody,
  processBody,
  rulesBody,
  setToken,
  settingsBody,
  shiftBody,
} from '../api/client'

const AppContext = createContext(null)

const EMPTY_RULES = {
  workingDays: [1, 2, 3, 4, 5, 6],
  weeklyHours: 48,
  maxShiftHours: 9,
  minRestHours: 11,
  breakMinutes: 30,
  weeklyOffRequired: true,
  overtimeAllowed: true,
  overtimeAfterHours: 48,
}

const EMPTY_SETTINGS = {
  orgName: '',
  orgEmail: '',
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
  adminName: '',
  adminEmail: '',
  adminRole: 'Administrator',
}

function decorateConflict(item) {
  const resolveAction = item.type === 'overlap' || item.type === 'rest'
    ? 'removeLaterShift'
    : item.type === 'leave' || item.type === 'weeklyOff'
      ? 'removeShifts'
      : item.type === 'hours'
        ? 'trimHours'
        : item.type === 'missing' || item.type === 'understaffing'
          ? 'fillCoverage'
          : ''
  return {
    ...item,
    type: item.type === 'rest' ? 'hours' : item.type,
    resolveAction,
    suggestion: item.detail,
  }
}

async function readWorkspace() {
  const [employees, brands, processes, pods, shifts, leaves, holidays, rules, settings, activities, notifications] = await Promise.all([
    apiList('/employees?limit=100&sort=name'),
    apiList('/brands?limit=100&sort=name'),
    apiList('/processes?limit=100'),
    apiList('/pods?limit=100'),
    apiList('/shifts?limit=100&order=asc'),
    apiList('/leaves?limit=100&order=desc'),
    api('/holidays'),
    api('/rules'),
    api('/settings'),
    apiList('/activity?limit=100&order=desc'),
    apiList('/notifications?limit=100'),
  ])
  const activeShifts = shifts.filter((shift) => shift.status !== 'cancelled')
  const dates = activeShifts.map((shift) => shift.date).sort()
  const from = dates[0] || '2026-10-27'
  const to = dates[dates.length - 1] || '2026-12-31'
  const conflictRes = await api(`/conflicts?from=${from}&to=${to}`)
  return {
    employees,
    brands,
    processes,
    pods,
    shifts: activeShifts,
    leaves,
    holidays,
    rules,
    settings,
    activities: activities.map((row) => ({
      id: row.id,
      at: row.at,
      text: row.detail,
      actor: row.actor,
      action: row.action,
    })),
    notifications,
    conflicts: (conflictRes.data || []).map(decorateConflict),
    dismissedConflicts: [],
  }
}

export function AppProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [booting, setBooting] = useState(true)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [state, setState] = useState({
    employees: [],
    brands: [],
    processes: [],
    pods: [],
    shifts: [],
    leaves: [],
    holidays: [],
    rules: EMPTY_RULES,
    settings: EMPTY_SETTINGS,
    activities: [],
    notifications: [],
    conflicts: [],
    dismissedConflicts: [],
  })

  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const next = await readWorkspace()
      setState(next)
      return next
    } catch (error) {
      setLoadError(errorText(error))
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let live = true
    const boot = async () => {
      if (!getToken()) {
        if (live) setBooting(false)
        return
      }
      try {
        const me = await api('/auth/me')
        if (!live) return
        setAdmin(me)
        refresh().catch(() => {})
      } catch (error) {
        if (!live) return
        if (error.status === 401) {
          setToken('')
          setAdmin(null)
        } else {
          setLoadError(errorText(error))
        }
      } finally {
        if (live) setBooting(false)
      }
    }
    boot()
    const onLost = () => {
      setAdmin(null)
      setLoadError('')
    }
    window.addEventListener('rosterly-unauthorized', onLost)
    return () => {
      live = false
      window.removeEventListener('rosterly-unauthorized', onLost)
    }
  }, [refresh])

  const run = useCallback(async (work, success) => {
    setBusy(true)
    try {
      const result = await work()
      await refresh()
      if (success) toast.success(success)
      return result
    } catch (error) {
      toast.error(errorText(error))
      throw error
    } finally {
      setBusy(false)
    }
  }, [refresh])

  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password)
    setAdmin(data.admin)
    setBooting(false)
    refresh().catch(() => {})
    return data.admin
  }, [refresh])

  const signup = useCallback(async (name, email, password) => {
    const data = await signupRequest(name, email, password)
    setAdmin(data.admin)
    setBooting(false)
    refresh().catch(() => {})
    return data.admin
  }, [refresh])

  const logout = useCallback(() => {
    setToken('')
    setAdmin(null)
    setLoadError('')
  }, [])

  const saveEmployee = useCallback((row) => run(async () => {
    if (row.id && state.employees.some((employee) => employee.id === row.id)) {
      return api(`/employees/${row.id}`, { method: 'PUT', body: employeeBody(row) })
    }
    return api('/employees', { method: 'POST', body: employeeBody(row) })
  }, row.id && state.employees.some((employee) => employee.id === row.id) ? 'Employee updated' : 'Employee added'), [run, state.employees])

  const removeEmployee = useCallback((id) => run(
    () => api(`/employees/${id}`, { method: 'DELETE' }),
    'Employee removed',
  ), [run])

  const saveBrand = useCallback((row) => run(async () => {
    const exists = row.id && state.brands.some((brand) => brand.id === row.id)
    if (exists) return api(`/brands/${row.id}`, { method: 'PUT', body: brandBody(row) })
    return api('/brands', { method: 'POST', body: brandBody(row) })
  }, row.id && state.brands.some((brand) => brand.id === row.id) ? 'Brand updated' : 'Brand added'), [run, state.brands])

  const removeBrand = useCallback((id) => run(async () => {
    const linked = state.employees.filter((employee) => employee.brandIds.includes(id))
    for (const employee of linked) {
      const brandIds = employee.brandIds.filter((brandId) => brandId !== id)
      if (!brandIds.length) throw new Error(`${employee.name} must keep at least one brand.`)
      await api(`/employees/${employee.id}`, { method: 'PUT', body: employeeBody({ ...employee, brandIds }) })
    }
    await api(`/brands/${id}`, { method: 'DELETE' })
  }, 'Brand deleted'), [run, state.employees])

  const saveProcess = useCallback((row) => run(async () => {
    const exists = row.id && state.processes.some((process) => process.id === row.id)
    if (exists) return api(`/processes/${row.id}`, { method: 'PUT', body: processBody(row) })
    return api('/processes', { method: 'POST', body: processBody(row) })
  }, row.id && state.processes.some((process) => process.id === row.id) ? 'Process updated' : 'Process added'), [run, state.processes])

  const removeProcess = useCallback((row) => run(async () => {
    const linked = state.employees.filter((employee) => employee.processCodes.includes(row.code))
    for (const employee of linked) {
      const processCodes = employee.processCodes.filter((code) => code !== row.code)
      if (!processCodes.length) throw new Error(`${employee.name} must keep at least one process.`)
      await api(`/employees/${employee.id}`, { method: 'PUT', body: employeeBody({ ...employee, processCodes }) })
    }
    await api(`/processes/${row.id}`, { method: 'DELETE' })
  }, 'Process deleted'), [run, state.employees])

  const savePod = useCallback((row) => run(async () => {
    const exists = row.id && state.pods.some((pod) => pod.id === row.id)
    const saved = exists
      ? await api(`/pods/${row.id}`, { method: 'PUT', body: podBody(row) })
      : await api('/pods', { method: 'POST', body: podBody(row) })
    const selected = new Set(row.brandIds || [])
    for (const brand of state.brands) {
      if (selected.has(brand.id) && brand.podId !== saved.id) {
        await api(`/brands/${brand.id}`, { method: 'PUT', body: brandBody({ ...brand, podId: saved.id }) })
      }
    }
    return saved
  }, row.id && state.pods.some((pod) => pod.id === row.id) ? 'Pod updated' : 'Pod added'), [run, state.pods, state.brands])

  const removePod = useCallback((id) => run(async () => {
    const fallback = state.pods.find((pod) => pod.id !== id)
    if (!fallback) throw new Error('At least one pod has to remain.')
    const moving = state.employees.filter((employee) => employee.podId === id)
    for (const employee of moving) {
      await api(`/employees/${employee.id}`, { method: 'PUT', body: employeeBody({ ...employee, podId: fallback.id }) })
    }
    const movingBrands = state.brands.filter((brand) => brand.podId === id)
    for (const brand of movingBrands) {
      await api(`/brands/${brand.id}`, { method: 'PUT', body: brandBody({ ...brand, podId: fallback.id }) })
    }
    await api(`/pods/${id}`, { method: 'DELETE' })
  }, 'Pod deleted'), [run, state.pods, state.employees, state.brands])

  const saveShift = useCallback((row) => run(async () => {
    const exists = row.id && state.shifts.some((shift) => shift.id === row.id)
    if (exists) return api(`/shifts/${row.id}`, { method: 'PUT', body: shiftBody(row) })
    return api('/shifts', { method: 'POST', body: shiftBody(row) })
  }), [run, state.shifts])

  const removeShifts = useCallback((ids) => run(async () => {
    for (const id of ids) await api(`/shifts/${id}`, { method: 'DELETE' })
  }, ids.length > 1 ? 'Conflicting shifts removed' : 'Shift deleted'), [run])

  const applyLeave = useCallback((row) => run(
    () => api('/leaves', { method: 'POST', body: row }),
    'Leave request submitted',
  ), [run])

  const decideLeave = useCallback((id, status) => {
    const path = status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'cancel'
    return run(() => api(`/leaves/${id}/${path}`, { method: 'POST', body: {} }))
  }, [run])

  const saveRules = useCallback((row) => run(
    () => api('/rules', { method: 'PUT', body: rulesBody(row) }),
    'Working rules saved',
  ), [run])

  const saveSettings = useCallback(({ settings, holidays, rules }) => run(async () => {
    const updated = await api('/settings', { method: 'PUT', body: settingsBody(settings) })
    if (updated.admin) setAdmin(updated.admin)
    if (updated.token) setToken(updated.token)
    if (rules) await api('/rules', { method: 'PUT', body: rulesBody(rules) })
    const current = await api('/holidays')
    const kept = new Set()
    for (const holiday of holidays) {
      const match = current.find((item) => item.id === holiday.id) || current.find((item) => item.date === holiday.date)
      if (match) {
        kept.add(match.id)
        if (match.name !== holiday.name || match.date !== holiday.date) {
          await api(`/holidays/${match.id}`, { method: 'PUT', body: { date: holiday.date, name: holiday.name } })
        }
      } else {
        const created = await api('/holidays', { method: 'POST', body: { date: holiday.date, name: holiday.name } })
        kept.add(created.id)
      }
    }
    for (const holiday of current) {
      if (!kept.has(holiday.id)) await api(`/holidays/${holiday.id}`, { method: 'DELETE' })
    }
  }, 'Settings saved'), [run])

  const generateRosterRange = useCallback((body) => run(
    () => api('/roster/generate', { method: 'POST', body }),
  ), [run])

  const dismissConflict = useCallback((id) => run(
    () => api(`/conflicts/${encodeURIComponent(id)}/dismiss`, { method: 'POST' }),
    'Alert dismissed',
  ), [run])

  const markNotification = useCallback((id, read) => run(
    () => api(`/notifications/${id}`, { method: 'PATCH', body: { read } }),
  ), [run])

  const reloadWorkspace = useCallback(() => run(async () => {}, 'Workspace reloaded from the database'), [run])

  const value = useMemo(() => ({
    ...state,
    admin,
    booting,
    loading,
    busy,
    loadError,
    refresh,
    login,
    signup,
    logout,
    saveEmployee,
    removeEmployee,
    saveBrand,
    removeBrand,
    saveProcess,
    removeProcess,
    savePod,
    removePod,
    saveShift,
    removeShifts,
    applyLeave,
    decideLeave,
    saveRules,
    saveSettings,
    generateRosterRange,
    dismissConflict,
    markNotification,
    reloadWorkspace,
    log: () => {},
    setCollection: () => {},
    patch: () => {},
    resetDemo: reloadWorkspace,
  }), [
    state, admin, booting, loading, busy, loadError, refresh, login, signup, logout,
    saveEmployee, removeEmployee, saveBrand, removeBrand, saveProcess, removeProcess,
    savePod, removePod, saveShift, removeShifts, applyLeave, decideLeave, saveRules,
    saveSettings, generateRosterRange, dismissConflict, markNotification, reloadWorkspace,
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
