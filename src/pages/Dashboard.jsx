import { Users, UserCheck, Tag, CalendarCheck, Plane, ShieldCheck } from 'lucide-react'
import { format, parseISO, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns'
import { Link } from 'react-router-dom'
import StatCard from '../components/common/StatCard'
import PageHeader from '../components/common/PageHeader'
import Badge from '../components/common/Badge'
import MiniBars from '../components/common/MiniBars'
import { useApp } from '../context/AppContext'
import { coverage, LEAVE_LABELS, fmt12 } from '../utils/rosterUtils'
import Avatar from '../components/common/Avatar'
import { DEMO_TODAY } from '../data/seed'

export default function Dashboard() {
  const { employees, brands, shifts, leaves, conflicts, activities, settings, admin, processes, loading } = useApp()
  const today = DEMO_TODAY
  const iso = format(today, 'yyyy-MM-dd')
  const active = employees.filter((e) => e.status === 'Active')
  const onLeave = employees.filter((e) => leaves.some((l) => l.employeeId === e.id && l.status === 'approved' && iso >= l.from && iso <= l.to))
  const todayShifts = shifts.filter((s) => s.date === iso)
  const weekDays = eachDayOfInterval({ start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) })
  const week = weekDays.map((d) => ({
    day: format(d, 'EEE'),
    count: shifts.filter((x) => x.date === format(d, 'yyyy-MM-dd')).length,
  }))
  const brandStaff = brands.map((b) => ({ name: b.name, staffed: coverage(shifts, b.id, iso), min: b.minCoverage }))
  const covered = brandStaff.filter((b) => b.staffed >= b.min).length
  const upcoming = leaves
    .filter((l) => l.status === 'approved' && l.to >= iso)
    .sort((a, b) => a.from.localeCompare(b.from))
    .slice(0, 6)
  const pending = leaves.filter((l) => l.status === 'pending').length
  const critical = conflicts.filter((c) => c.severity === 'critical').slice(0, 5)
  const hour = today.getHours()
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const brandChart = brandStaff.map((b) => ({ day: b.name.replace('Urban Company', 'Urban Co.'), count: b.staffed }))
  return (
    <div className="space-y-5">
      <PageHeader
        title={`${hello}, ${admin?.name || settings.adminName}`}
        subtitle={loading ? 'Loading your roster and coverage…' : `${settings.orgName} · ${format(today, 'EEEE, d MMMM yyyy')}. Pending leave: ${pending}.`}
        actions={(
          <>
            <Link to="/conflicts" className="btn-ghost">Review alerts</Link>
            <Link to="/schedule" className="btn-primary">Open schedule</Link>
          </>
        )}
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Users} label="Total employees" value={loading ? '—' : employees.length} />
        <StatCard icon={UserCheck} label="Active employees" value={loading ? '—' : active.length} tone="bg-[#E6F4EE] text-ok" />
        <StatCard icon={Tag} label="Total brands" value={loading ? '—' : brands.length} />
        <StatCard icon={CalendarCheck} label="Scheduled today" value={loading ? '—' : todayShifts.length} />
        <StatCard icon={Plane} label="On leave today" value={loading ? '—' : onLeave.length} tone="bg-[#E6F0FC] text-blue2" />
        <StatCard icon={ShieldCheck} label="Coverage status" value={loading ? '—' : `${covered}/${brands.length}`} hint={loading ? 'Loading coverage' : 'Brands at minimum today'} tone={covered === brands.length ? 'bg-[#E6F4EE] text-ok' : 'bg-[#FCE9E8] text-danger'} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-semibold text-navy">Weekly staffing</h2>
            <span className="text-xs text-muted">{loading ? 'Loading shifts…' : `${week.reduce((n, d) => n + d.count, 0)} shifts this week`}</span>
          </div>
          <MiniBars data={week} />
        </div>
        <div className="card p-4">
          <h2 className="mb-3 font-semibold text-navy">Brand-wise staffing today</h2>
          <div className="max-h-56 space-y-2.5 overflow-auto pr-1">
            {loading && <p className="py-8 text-center text-sm text-muted">Loading coverage…</p>}
            {!loading && brandStaff.map((b) => {
              const p = Math.min(100, Math.round((b.staffed / b.min) * 100))
              return (
                <div key={b.name} className="text-sm">
                  <div className="mb-1 flex justify-between gap-2">
                    <span className="truncate">{b.name}</span>
                    <span className={p < 100 ? 'text-danger' : 'text-muted'}>{b.staffed}/{b.min}</span>
                  </div>
                  <div className="h-1.5 rounded bg-line">
                    <div className={`h-1.5 rounded ${p < 100 ? 'bg-danger' : 'bg-amber'}`} style={{ width: `${p}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-navy">Today’s roster snapshot</h2>
          <Link to="/schedule" className="text-xs font-medium text-blue2">Full calendar</Link>
        </div>
        <div className="table-wrap border-0 shadow-none">
          <table className="data-table">
            <thead>
              <tr>{['Employee', 'Time', 'Brand', 'Process'].map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {todayShifts.slice(0, 8).map((s) => {
                const emp = employees.find((e) => e.id === s.employeeId)
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-2 font-medium text-navy">
                        <Avatar id={emp?.id} name={emp?.name} />
                        {emp?.name}
                      </div>
                    </td>
                    <td>{fmt12(s.start)} – {fmt12(s.end)}</td>
                    <td>{brands.find((b) => b.id === s.brandId)?.name}</td>
                    <td>{processes.find((p) => p.code === s.processCode)?.name}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!todayShifts.length && <p className="p-6 text-sm text-muted">{loading ? 'Loading today’s roster…' : 'No shifts scheduled for today.'}</p>}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-navy">Upcoming leaves</h2>
            <Link to="/leaves" className="text-xs font-medium text-blue2">View all</Link>
          </div>
          <div className="space-y-3">
            {upcoming.map((l) => {
              const emp = employees.find((e) => e.id === l.employeeId)
              return (
                <div key={l.id} className="flex items-start justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Avatar id={emp?.id} name={emp?.name} />
                    <div>
                      <div className="font-medium text-navy">{emp?.name}</div>
                      <div className="text-xs text-muted">{l.from === l.to ? l.from : `${l.from} → ${l.to}`}</div>
                    </div>
                  </div>
                  <Badge tone="warn">{LEAVE_LABELS[l.type]}</Badge>
                </div>
              )
            })}
            {!upcoming.length && <p className="text-sm text-muted">No upcoming approved leave.</p>}
          </div>
        </div>
        <div className="card p-4">
          <h2 className="mb-3 font-semibold text-navy">Recent activity</h2>
          <div className="space-y-3">
            {activities.slice(0, 6).map((a) => (
              <div key={a.id} className="text-sm">
                <div className="text-ink">{a.text}</div>
                <div className="text-[11px] text-muted">{format(parseISO(a.at), 'dd MMM, HH:mm')}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-navy">Critical alerts</h2>
            <Link to="/conflicts" className="text-xs font-medium text-blue2">Manage</Link>
          </div>
          <div className="space-y-3">
            {critical.map((c) => (
              <div key={c.id} className="rounded-lg bg-[#FCE9E8] px-3 py-2 text-sm text-danger">
                <div className="font-medium">{c.title}</div>
                <div className="text-xs opacity-80">{c.detail}</div>
              </div>
            ))}
            {!critical.length && <p className="text-sm text-muted">No critical conflicts right now.</p>}
          </div>
          <div className="mt-4 border-t border-line pt-3">
            <p className="text-xs text-muted">Headcount vs coverage (today)</p>
            <MiniBars data={brandChart.slice(0, 6)} color="#F59A18" />
          </div>
        </div>
      </div>
    </div>
  )
}
