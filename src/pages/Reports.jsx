import { useEffect, useMemo, useState } from 'react'
import { Download, CalendarCheck, Clock, ShieldCheck, Plane } from 'lucide-react'
import { addDays, endOfMonth, format, startOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import toast from 'react-hot-toast'
import PageHeader from '../components/common/PageHeader'
import StatCard from '../components/common/StatCard'
import MiniBars from '../components/common/MiniBars'
import EmptyState from '../components/common/EmptyState'
import { useApp } from '../context/AppContext'
import { api, errorText } from '../api/client'
import { coverage, exportCSV, shiftHours, LEAVE_LABELS } from '../utils/rosterUtils'
import Avatar from '../components/common/Avatar'
import { DEMO_TODAY } from '../data/seed'

const COLORS = ['#142D50', '#F59A18', '#3FA277', '#28466A']

export default function Reports() {
  const { employees, brands, shifts, leaves, rules } = useApp()
  const [range, setRange] = useState('week')
  const [report, setReport] = useState(null)
  const [reportError, setReportError] = useState('')

  const { from, to } = useMemo(() => {
    if (range === 'month') return { from: startOfMonth(DEMO_TODAY), to: endOfMonth(DEMO_TODAY) }
    return { from: startOfWeek(DEMO_TODAY, { weekStartsOn: 1 }), to: endOfWeek(DEMO_TODAY, { weekStartsOn: 1 }) }
  }, [range])
  const fromIso = format(from, 'yyyy-MM-dd')
  const toIso = format(to, 'yyyy-MM-dd')
  useEffect(() => {
    let live = true
    setReportError('')
    api(`/reports?from=${fromIso}&to=${toIso}`)
      .then((data) => { if (live) setReport(data) })
      .catch((error) => { if (live) { setReport(null); setReportError(errorText(error)) } })
    return () => { live = false }
  }, [fromIso, toIso])
  const inRange = shifts.filter((s) => s.date >= fromIso && s.date <= toIso && s.status !== 'cancelled')

  const utilization = employees.filter((e) => e.status === 'Active').map((e) => {
    const hrs = inRange.filter((s) => s.employeeId === e.id).reduce((n, s) => n + shiftHours(s), 0)
    const cap = range === 'month' ? rules.weeklyHours * 4 : rules.weeklyHours
    return { id: e.id, name: e.name, hours: +hrs.toFixed(1), cap, pct: Math.round((hrs / cap) * 100) }
  }).sort((a, b) => b.hours - a.hours)

  const brandCov = brands.map((b) => {
    let days = 0
    let met = 0
    for (let d = from; d <= to; d = addDays(d, 1)) {
      days += 1
      if (coverage(inRange, b.id, format(d, 'yyyy-MM-dd')) >= b.minCoverage) met += 1
    }
    return { name: b.name, coverage: Math.round((met / days) * 100) }
  })

  const dist = ['morning', 'evening', 'general', 'special'].map((t) => ({
    name: t[0].toUpperCase() + t.slice(1),
    value: inRange.filter((s) => s.type === t).length,
  }))
  const distTotal = dist.reduce((n, d) => n + d.value, 0) || 1

  const leaveRows = leaves.filter((l) => l.from <= toIso && l.to >= fromIso)
  const overtime = utilization.filter((u) => u.hours > (range === 'month' ? rules.overtimeAfterHours * 4 : rules.overtimeAfterHours))

  const exp = (kind) => {
    if (kind === 'util') {
      exportCSV([['Employee', 'Hours', 'Capacity', 'Utilization %'], ...utilization.map((u) => [u.name, u.hours, u.cap, u.pct])], `rosterly-utilization-${fromIso}.csv`)
    } else if (kind === 'brand') {
      exportCSV([['Brand', 'Coverage %'], ...brandCov.map((b) => [b.name, b.coverage])], `rosterly-coverage-${fromIso}.csv`)
    } else if (kind === 'leave') {
      exportCSV([['Employee', 'Type', 'From', 'To', 'Status'], ...leaveRows.map((l) => [employees.find((e) => e.id === l.employeeId)?.name, LEAVE_LABELS[l.type], l.from, l.to, l.status])], `rosterly-leave-${fromIso}.csv`)
    } else {
      exportCSV([['Employee', 'Hours', 'Overtime after'], ...overtime.map((u) => [u.name, u.hours, range === 'month' ? rules.overtimeAfterHours * 4 : rules.overtimeAfterHours])], `rosterly-overtime-${fromIso}.csv`)
    }
    toast.success('CSV exported')
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        subtitle={`Summary for ${format(from, 'd MMM')} – ${format(to, 'd MMM yyyy')}.`}
        actions={(
          <>
            <div className="flex rounded-lg border border-line p-0.5">
              {['week', 'month'].map((v) => (
                <button key={v} type="button" onClick={() => setRange(v)} className={`rounded-md px-3 py-1.5 text-sm capitalize ${range === v ? 'bg-navy text-white' : 'text-muted'}`}>{v}</button>
              ))}
            </div>
            <button type="button" className="btn-ghost" onClick={() => exp('util')}><Download size={15} /> Utilization CSV</button>
          </>
        )}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {reportError && <p className="text-sm text-danger md:col-span-4">{reportError}</p>}
        <StatCard icon={CalendarCheck} label="Shifts in range" value={report?.shiftCount ?? inRange.length} />
        <StatCard icon={Clock} label="Hours worked" value={report ? Number(report.hours).toFixed(0) : utilization.reduce((n, u) => n + u.hours, 0).toFixed(0)} />
        <StatCard icon={ShieldCheck} label="Avg brand coverage" value={`${Math.round(brandCov.reduce((n, b) => n + b.coverage, 0) / Math.max(1, brandCov.length))}%`} tone="bg-[#E6F4EE] text-ok" />
        <StatCard icon={Plane} label="Leave records" value={leaveRows.length} />
      </div>
      <div className="card p-4">
        <h2 className="mb-1 font-semibold text-navy">Hours by top employees</h2>
        <MiniBars data={utilization.slice(0, 8).map((u) => ({ day: u.name.split(' ')[0], count: u.hours }))} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 font-semibold text-navy">Employee utilization (hours)</h2>
          <div className="max-h-72 space-y-2 overflow-auto pr-1">
            {utilization.slice(0, 12).map((u) => (
              <div key={u.id} className="text-sm">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar id={u.id} name={u.name} size="sm" />
                    <span className="truncate">{u.name}</span>
                  </span>
                  <span className="shrink-0 text-muted">{u.hours}h · {u.pct}%</span>
                </div>
                <div className="h-2 rounded bg-line">
                  <div className={`h-2 rounded ${u.pct > 100 ? 'bg-danger' : 'bg-navy'}`} style={{ width: `${Math.min(100, u.pct)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-navy">Brand coverage %</h2>
            <button type="button" className="btn-ghost" onClick={() => exp('brand')}><Download size={14} /> CSV</button>
          </div>
          <div className="max-h-72 space-y-2 overflow-auto pr-1">
            {brandCov.map((b) => (
              <div key={b.name} className="text-sm">
                <div className="mb-1 flex justify-between gap-2">
                  <span className="truncate">{b.name}</span>
                  <span className="shrink-0 text-muted">{b.coverage}%</span>
                </div>
                <div className="h-2 rounded bg-line">
                  <div className="h-2 rounded bg-amber" style={{ width: `${b.coverage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <h2 className="mb-3 font-semibold text-navy">Shift distribution</h2>
          <ul className="space-y-3">
            {dist.map((d, i) => {
              const pct = Math.round((d.value / distTotal) * 100)
              return (
                <li key={d.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />
                      {d.name}
                    </span>
                    <span className="text-muted">{d.value} shifts · {pct}%</span>
                  </div>
                  <div className="h-2 rounded bg-line">
                    <div className="h-2 rounded" style={{ width: `${pct}%`, background: COLORS[i] }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-navy">Leave in range</h2>
            <button type="button" className="btn-ghost" onClick={() => exp('leave')}><Download size={14} /> CSV</button>
          </div>
          <div className="max-h-64 overflow-auto text-sm">
            {leaveRows.map((l) => {
              const emp = employees.find((e) => e.id === l.employeeId)
              return (
                <div key={l.id} className="flex items-center justify-between gap-2 border-b border-line py-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar id={emp?.id} name={emp?.name} size="sm" />
                    <span className="truncate">{emp?.name}</span>
                  </span>
                  <span className="shrink-0 text-muted">{LEAVE_LABELS[l.type]} · {l.status}</span>
                </div>
              )
            })}
            {!leaveRows.length && <p className="text-muted">No leave in this period.</p>}
          </div>
        </div>
      </div>
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-navy">Overtime</h2>
          <button type="button" className="btn-ghost" onClick={() => exp('ot')}><Download size={14} /> CSV</button>
        </div>
        <div className="table-wrap border-0 shadow-none">
          <table className="data-table">
            <thead><tr>{['Employee', 'Hours', 'Utilization', 'Flag'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {overtime.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Avatar id={u.id} name={u.name} size="sm" />
                      {u.name}
                    </div>
                  </td>
                  <td>{u.hours}h</td>
                  <td>{u.pct}%</td>
                  <td className="text-danger">Overtime</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!overtime.length && <EmptyState title="No overtime in this period" text="Everyone is within the configured weekly / monthly cap." />}
        </div>
      </div>
      <div className="card p-4">
        <h2 className="mb-3 font-semibold text-navy">Weekly / monthly utilization</h2>
        <div className="table-wrap border-0 shadow-none">
          <table className="data-table">
            <thead><tr>{['Employee', 'Hours', 'Capacity', 'Utilization'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {utilization.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Avatar id={u.id} name={u.name} size="sm" />
                      {u.name}
                    </div>
                  </td>
                  <td>{u.hours}h</td>
                  <td>{u.cap}h</td>
                  <td className={u.pct > 100 ? 'text-danger' : ''}>{u.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
