import { useState } from 'react'
import { addDays, addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns'
import { ChevronLeft, ChevronRight, Download, Plus, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import RosterCalendar from '../components/schedule/RosterCalendar'
import ShiftModal from '../components/schedule/ShiftModal'
import GenerateRosterModal from '../components/schedule/GenerateRosterModal'
import PageHeader from '../components/common/PageHeader'
import { useApp } from '../context/AppContext'
import { TYPES, coverage, exportCSV, fmt12 } from '../utils/rosterUtils'
import { DEMO_TODAY } from '../data/seed'

const W = { weekStartsOn: 1 }
const Sel = ({ v, set, ph, items }) => (
  <select aria-label={ph} className="input !w-auto min-w-[8.5rem] shrink-0" value={v} onChange={(e) => set(e.target.value)}>
    <option value="">{ph}</option>
    {items.map(([a, b]) => <option key={a} value={a}>{b}</option>)}
  </select>
)

export default function Schedule() {
  const { employees, brands, processes, pods, shifts, saveShift, removeShifts } = useApp()
  const [view, setView] = useState('week')
  const [cur, setCur] = useState(DEMO_TODAY)
  const [q, setQ] = useState('')
  const [brand, setBrand] = useState('')
  const [proc, setProc] = useState('')
  const [pod, setPod] = useState('')
  const [modal, setModal] = useState(null)
  const [gen, setGen] = useState(false)

  const days = view === 'day'
    ? [cur]
    : view === 'week'
      ? eachDayOfInterval({ start: startOfWeek(cur, W), end: endOfWeek(cur, W) })
      : eachDayOfInterval({ start: startOfMonth(cur), end: endOfMonth(cur) })

  const move = (n) => setCur(view === 'month' ? (n > 0 ? addMonths(cur, 1) : subMonths(cur, 1)) : addDays(cur, n * (view === 'week' ? 7 : 1)))
  const label = view === 'day'
    ? format(cur, 'EEE, MMM d yyyy')
    : view === 'week'
      ? `${format(days[0], 'MMM d')} – ${format(days[6], 'MMM d, yyyy')}`
      : format(cur, 'MMMM yyyy')

  const rows = employees.filter((e) =>
    e.status === 'Active'
    && (!pod || e.podId === pod)
    && (!brand || e.brandIds.includes(brand))
    && (!proc || e.processCodes.includes(proc))
    && e.name.toLowerCase().includes(q.toLowerCase()),
  )
  const visible = shifts.filter((s) => (!brand || s.brandId === brand) && (!proc || s.processCode === proc))
  const rangeShifts = visible.filter((s) => days.some((d) => format(d, 'yyyy-MM-dd') === s.date) && rows.some((e) => e.id === s.employeeId))
  const gaps = days.reduce((n, d) => {
    const iso = format(d, 'yyyy-MM-dd')
    return n + brands.filter((b) => (!brand || b.id === brand) && coverage(visible, b.id, iso) < b.minCoverage).length
  }, 0)

  const save = async (f) => {
    try {
      await saveShift(f)
      setModal(null)
      const next = f.id ? shifts.map((s) => (s.id === f.id ? f : s)) : [...shifts, f]
      const b = brands.find((x) => x.id === f.brandId)
      const c = coverage(next, f.brandId, f.date)
      if (b && c < b.minCoverage) toast(`Saved. ${b.name} has ${c} of ${b.minCoverage} required on ${f.date}.`, { icon: '⚠️', duration: 6000 })
      else toast.success(f.id ? 'Shift updated' : 'Shift added')
    } catch { /* toast from the API */ }
  }

  const del = async (id) => {
    try {
      await removeShifts([id])
      setModal(null)
    } catch { /* toast from the API */ }
  }

  const exp = () => {
    const inView = visible.filter((s) => days.some((d) => format(d, 'yyyy-MM-dd') === s.date) && rows.some((e) => e.id === s.employeeId))
    exportCSV(
      [
        ['Employee', 'ID', 'Date', 'Start', 'End', 'Break', 'Brand', 'Process', 'Type'],
        ...inView.map((s) => {
          const e = employees.find((x) => x.id === s.employeeId)
          return [e?.name, e?.id, s.date, fmt12(s.start), fmt12(s.end), s.breakMinutes, brands.find((b) => b.id === s.brandId)?.name, s.processCode, s.type]
        }),
      ],
      `rosterly-${format(days[0], 'yyyy-MM-dd')}.csv`,
    )
    toast.success('CSV exported')
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Schedule"
        subtitle="Employee-wise roster with coverage checks, leave blocks and conflict highlighting."
        actions={(
          <>
            <button type="button" className="btn-ghost" onClick={exp}><Download size={15} /> Export CSV</button>
            <button type="button" className="btn-ghost" onClick={() => setGen(true)}><Sparkles size={15} /> Generate Roster</button>
            <button type="button" className="btn-primary" onClick={() => setModal({ date: format(cur, 'yyyy-MM-dd') })}>
              <Plus size={15} /> Add Shift
            </button>
          </>
        )}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card px-4 py-3"><div className="text-xs text-muted">Employees in view</div><div className="text-lg font-semibold text-navy">{rows.length}</div></div>
        <div className="card px-4 py-3"><div className="text-xs text-muted">Shifts in range</div><div className="text-lg font-semibold text-navy">{rangeShifts.length}</div></div>
        <div className="card px-4 py-3"><div className="text-xs text-muted">Coverage gaps</div><div className={`text-lg font-semibold ${gaps ? 'text-danger' : 'text-ok'}`}>{gaps}</div></div>
        <div className="card px-4 py-3"><div className="text-xs text-muted">View</div><div className="text-lg font-semibold capitalize text-navy">{view}</div></div>
      </div>
      <div className="card">
        <div className="filter-bar border-b border-line p-3">
          <div className="flex rounded-lg border border-line p-0.5">
            {['month', 'week', 'day'].map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} className={`rounded-md px-3 py-1.5 text-sm capitalize ${view === v ? 'bg-navy text-white' : 'text-muted hover:text-navy'}`}>
                {v}
              </button>
            ))}
          </div>
          <button type="button" className="btn-ghost px-2" aria-label="Previous" onClick={() => move(-1)}><ChevronLeft size={16} /></button>
          <button type="button" className="btn-ghost px-2" aria-label="Next" onClick={() => move(1)}><ChevronRight size={16} /></button>
          <button type="button" className="btn-ghost" onClick={() => setCur(DEMO_TODAY)}>Today</button>
          <span className="min-w-[170px] text-sm font-semibold text-navy">{label}</span>
          <input className="input ml-auto !w-44 shrink-0" placeholder="Search employee" value={q} onChange={(e) => setQ(e.target.value)} />
          <Sel v={brand} set={setBrand} ph="All brands" items={brands.map((b) => [b.id, b.name])} />
          <Sel v={proc} set={setProc} ph="All processes" items={processes.map((p) => [p.code, p.name])} />
          <Sel v={pod} set={setPod} ph="All pods" items={pods.map((p) => [p.id, p.name])} />
        </div>
        <RosterCalendar
          days={days}
          rows={rows}
          shifts={visible}
          compact={view === 'month'}
          onShift={(s) => setModal(s)}
          onCell={(e, d) => setModal({ employeeId: e.id, date: d, brandId: e.brandIds[0], processCode: e.processCodes[0] })}
        />
        <div className="flex flex-wrap gap-4 border-t border-line px-4 py-2.5 text-xs text-muted">
          {['morning', 'evening', 'general', 'special', 'off', 'leave', 'holiday', 'conflict'].map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <i className="h-3 w-3 rounded border-l-[3px]" style={{ background: TYPES[k].bg, borderColor: TYPES[k].bd }} />
              {TYPES[k].l}
            </span>
          ))}
        </div>
      </div>
      {modal && <ShiftModal shift={modal} onSave={save} onDelete={del} onClose={() => setModal(null)} />}
      {gen && <GenerateRosterModal onClose={() => setGen(false)} />}
    </div>
  )
}
