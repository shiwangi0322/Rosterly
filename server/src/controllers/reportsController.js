import { loadContext } from '../services/context.js'
import { coverage, shiftHours } from '../services/scheduling.js'

export async function summary(req, res) {
  const ctx = await loadContext()
  const from = req.query.from ? String(req.query.from) : '2026-10-27'
  const to = req.query.to ? String(req.query.to) : '2026-11-16'
  const shifts = ctx.shifts.filter((s) => s.status !== 'cancelled' && s.date >= from && s.date <= to)
  const byEmployee = ctx.employees.map((emp) => {
    const mine = shifts.filter((s) => s.employeeId === emp.id)
    return {
      employeeId: emp.id,
      name: emp.name,
      podId: emp.podId,
      shifts: mine.length,
      hours: Number(mine.reduce((n, s) => n + shiftHours(s), 0).toFixed(1)),
    }
  })
  const byBrand = ctx.brands.map((brand) => ({
    brandId: brand.id,
    name: brand.name,
    shifts: shifts.filter((s) => s.brandId === brand.id).length,
    assignedEmployees: brand.employeeIds.length,
    singleResource: brand.singleResource,
  }))
  const dates = [...new Set(shifts.map((s) => s.date))].sort()
  const staffing = []
  dates.forEach((date) => {
    ctx.brands.forEach((brand) => {
      const have = coverage(shifts, brand.id, date)
      if (have >= brand.minCoverage) return
      staffing.push({ date, brandId: brand.id, name: brand.name, have, need: brand.minCoverage })
    })
  })
  const leaves = {
    pending: ctx.leaves.filter((l) => l.status === 'pending').length,
    approved: ctx.leaves.filter((l) => l.status === 'approved').length,
    rejected: ctx.leaves.filter((l) => l.status === 'rejected').length,
    cancelled: ctx.leaves.filter((l) => l.status === 'cancelled').length,
    compoff: ctx.leaves.filter((l) => l.type === 'compoff').length,
  }
  res.json({
    from,
    to,
    employees: ctx.employees.length,
    activeEmployees: ctx.employees.filter((e) => e.status === 'Active').length,
    brands: ctx.brands.length,
    singleResourceBrands: ctx.brands.filter((b) => b.singleResource).length,
    processes: ctx.processes.length,
    pods: new Set(ctx.employees.map((e) => e.podId)).size,
    shiftCount: shifts.length,
    hours: Number(shifts.reduce((n, s) => n + shiftHours(s), 0).toFixed(1)),
    byEmployee,
    byBrand,
    staffingGaps: staffing,
    leaves,
  })
}
