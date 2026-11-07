import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import PageHeader from '../components/common/PageHeader'
import Badge from '../components/common/Badge'
import StatCard from '../components/common/StatCard'
import EmptyState from '../components/common/EmptyState'
import { AlertTriangle, ShieldAlert, Clock, CheckCircle2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { coverage, shiftHours } from '../utils/rosterUtils'
import Avatar from '../components/common/Avatar'
import { DEMO_TODAY } from '../data/seed'

const FILTERS = [
  ['all', 'All'],
  ['overlap', 'Overlaps'],
  ['understaffing', 'Understaffing'],
  ['missing', 'Missing coverage'],
  ['leave', 'On leave'],
  ['weeklyOff', 'Weekly off'],
  ['hours', 'Excess hours'],
]

export default function Conflicts() {
  const { conflicts, shifts, employees, brands, dismissConflict, removeShifts, generateRosterRange } = useApp()
  const navigate = useNavigate()
  const [type, setType] = useState('all')
  const rows = useMemo(() => conflicts.filter((c) => type === 'all' || c.type === type), [conflicts, type])

  const dismiss = async (id) => {
    try { await dismissConflict(id) } catch { /* toast from the API */ }
  }

  const resolve = async (c) => {
    try {
      if (c.resolveAction === 'removeShifts' || c.resolveAction === 'removeLaterShift') {
        let ids = c.shiftIds || []
        if (c.resolveAction === 'removeLaterShift' && ids.length >= 2) {
          const [a, b] = ids.map((id) => shifts.find((s) => s.id === id)).filter(Boolean)
          const drop = !a || !b ? ids[1] : (a.start >= b.start ? a.id : b.id)
          ids = [drop]
        }
        if (!ids.length) return toast.error('No shift found to update.')
        await removeShifts(ids)
        return
      }
      if (c.resolveAction === 'trimHours') {
        const weekShifts = shifts.filter((s) => s.employeeId === c.employeeId && s.date >= c.date).sort((a, b) => b.date.localeCompare(a.date) || shiftHours(b) - shiftHours(a))
        if (!weekShifts[0]) return toast.error('No shift found to trim.')
        await removeShifts([weekShifts[0].id])
        return
      }
      if (c.resolveAction === 'fillCoverage' && c.brandId && c.date) {
        const data = await generateRosterRange({ from: c.date, to: c.date, brandIds: [c.brandId] })
        if (data.created?.length) toast.success(`Assigned ${data.created.length} shift(s)`)
        else toast.error(data.unresolved?.[0]?.detail || 'No eligible employee is free to fill this gap.')
        return
      }
      navigate('/schedule')
    } catch { /* toast from the API */ }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Conflicts & Alerts"
        subtitle={`${conflicts.filter((c) => c.severity === 'critical').length} critical · ${conflicts.length} open. Suggested fixes apply immediately.`}
        actions={<Link to="/schedule" className="btn-primary">Open schedule</Link>}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={ShieldAlert} label="Critical" value={conflicts.filter((c) => c.severity === 'critical').length} tone="bg-[#FCE9E8] text-danger" />
        <StatCard icon={AlertTriangle} label="High" value={conflicts.filter((c) => c.severity === 'high').length} tone="bg-lorange text-amber" />
        <StatCard icon={Clock} label="Medium" value={conflicts.filter((c) => c.severity === 'medium').length} />
        <StatCard icon={CheckCircle2} label="Open total" value={conflicts.length} tone="bg-[#E6F4EE] text-ok" />
      </div>
      <div className="flex flex-wrap gap-1">
        {FILTERS.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setType(k)} className={`rounded-full px-3 py-1.5 text-sm ${type === k ? 'bg-navy text-white' : 'bg-white text-muted ring-1 ring-line hover:text-navy'}`}>
            {l}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {rows.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="flex flex-wrap items-start gap-3">
              <Badge tone={c.severity}>{c.severity}</Badge>
              {c.employeeId && <Avatar id={c.employeeId} name={employees.find((e) => e.id === c.employeeId)?.name} />}
              <div className="min-w-0 flex-1">
                <div className="font-medium text-navy">{c.title}</div>
                <p className="mt-1 text-sm text-muted">{c.detail}</p>
                {c.suggestion && <p className="mt-1 text-sm text-ink"><span className="font-medium">Suggested: </span>{c.suggestion}</p>}
                {c.brandId && (
                  <p className="mt-1 text-xs text-faint">
                    Coverage {coverage(shifts, c.brandId, c.date)} / {brands.find((b) => b.id === c.brandId)?.minCoverage}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-primary" onClick={() => resolve(c)}>Resolve</button>
                <button type="button" className="btn-ghost" onClick={() => dismiss(c.id)}>Dismiss</button>
              </div>
            </div>
          </div>
        ))}
        {!rows.length && (
          <div className="card">
            <EmptyState title="No alerts in this category" text="Unresolved issues in other filters still appear under All." />
          </div>
        )}
      </div>
      <div className="card p-4">
        <h2 className="mb-3 font-semibold text-navy">Brand coverage today ({format(DEMO_TODAY, 'd MMM')})</h2>
        <div className="table-wrap border-0 shadow-none">
          <table className="data-table">
            <thead>
              <tr>{['Brand', 'Staffed', 'Minimum', 'Status'].map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {brands.map((b) => {
                const iso = format(DEMO_TODAY, 'yyyy-MM-dd')
                const staffed = coverage(shifts, b.id, iso)
                const ok = staffed >= b.minCoverage
                return (
                  <tr key={b.id}>
                    <td>{b.name}</td>
                    <td>{staffed}</td>
                    <td>{b.minCoverage}</td>
                    <td className={ok ? 'text-ok' : 'text-danger'}>{ok ? 'Met' : 'Below minimum'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
