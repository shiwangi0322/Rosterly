import { useMemo, useState } from 'react'
import { addMonths, eachDayOfInterval, endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { Check, ChevronLeft, ChevronRight, Plus, X, Plane, Clock, CheckCircle2, Heart } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../components/common/PageHeader'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import Field from '../components/common/Field'
import StatCard from '../components/common/StatCard'
import EmptyState from '../components/common/EmptyState'
import { useApp } from '../context/AppContext'
import { LEAVE_LABELS } from '../utils/rosterUtils'
import Avatar from '../components/common/Avatar'
import { DEMO_TODAY } from '../data/seed'

const TONE = { approved: 'ok', pending: 'warn', rejected: 'danger' }

function LeaveForm({ onSave, onClose }) {
  const { employees } = useApp()
  const [f, setF] = useState({ employeeId: employees.find((e) => e.status === 'Active')?.id || '', from: format(DEMO_TODAY, 'yyyy-MM-dd'), to: format(DEMO_TODAY, 'yyyy-MM-dd'), type: 'casual', reason: '' })
  const [err, setErr] = useState('')
  const submit = (e) => {
    e.preventDefault()
    if (!f.employeeId || !f.from || !f.to) return setErr('Employee and dates are required.')
    if (f.to < f.from) return setErr('End date must be on or after start date.')
    onSave(f)
  }
  return (
    <Modal title="Apply for leave" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Employee" className="col-span-2">
            <select className="input" value={f.employeeId} onChange={(e) => setF({ ...f, employeeId: e.target.value })}>
              {employees.filter((e) => e.status === 'Active').map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </Field>
          <Field label="From"><input type="date" className="input" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></Field>
          <Field label="To"><input type="date" className="input" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></Field>
          <Field label="Type" className="col-span-2">
            <select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
              {Object.entries(LEAVE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Reason"><textarea className="input min-h-[72px]" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
        {err && <p className="text-sm text-danger">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" type="submit">Submit request</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Leaves() {
  const { leaves, employees, holidays, applyLeave, decideLeave } = useApp()
  const [cur, setCur] = useState(startOfMonth(DEMO_TODAY))
  const [tab, setTab] = useState('all')
  const [form, setForm] = useState(false)
  const days = eachDayOfInterval({ start: startOfMonth(cur), end: endOfMonth(cur) })
  const startPad = (startOfMonth(cur).getDay() + 6) % 7

  const filtered = useMemo(() => leaves.filter((l) => tab === 'all' || l.status === tab || l.type === tab), [leaves, tab])

  const apply = async (f) => {
    if ((f.reason || '').trim().length < 3) return toast.error('Add a short reason.')
    try {
      await applyLeave({ employeeId: f.employeeId, type: f.type, from: f.from, to: f.to, reason: f.reason.trim() })
      setForm(false)
    } catch { /* toast from the API */ }
  }

  const setStatus = async (leave, status) => {
    try {
      const result = await decideLeave(leave.id, status)
      if (status === 'approved' && result?.cancelledShiftIds?.length) toast.success(`Approved. ${result.cancelledShiftIds.length} conflicting shift(s) were cancelled.`)
      else toast.success(status === 'approved' ? 'Leave approved' : 'Leave rejected')
    } catch { /* toast from the API */ }
  }

  const leaveOnDay = (iso) => leaves.filter((l) => l.status === 'approved' && iso >= l.from && iso <= l.to)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Leave Management"
        subtitle="Approve requests, track comp-offs and keep the roster in sync with availability."
        actions={<button type="button" className="btn-primary" onClick={() => setForm(true)}><Plus size={15} /> Apply for leave</button>}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Clock} label="Pending" value={leaves.filter((l) => l.status === 'pending').length} tone="bg-lorange text-amber" />
        <StatCard icon={CheckCircle2} label="Approved" value={leaves.filter((l) => l.status === 'approved').length} tone="bg-[#E6F4EE] text-ok" />
        <StatCard icon={Heart} label="Sick leave" value={leaves.filter((l) => l.type === 'sick').length} />
        <StatCard icon={Plane} label="Comp-off" value={leaves.filter((l) => l.type === 'compoff').length} />
      </div>
      <div className="grid min-w-0 gap-4 xl:grid-cols-5">
        <div className="card min-w-0 p-4 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-navy">{format(cur, 'MMMM yyyy')}</h2>
            <div className="flex gap-1">
              <button type="button" className="btn-ghost px-2" onClick={() => setCur(subMonths(cur, 1))} aria-label="Previous month"><ChevronLeft size={16} /></button>
              <button type="button" className="btn-ghost px-2" onClick={() => setCur(addMonths(cur, 1))} aria-label="Next month"><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="py-1">{d}</div>)}
            {Array.from({ length: startPad }).map((_, i) => <div key={`p${i}`} />)}
            {days.map((d) => {
              const iso = format(d, 'yyyy-MM-dd')
              const hol = holidays.find((h) => h.date === iso)
              const on = leaveOnDay(iso)
              return (
                <div key={iso} title={hol?.name || on.map((l) => employees.find((e) => e.id === l.employeeId)?.name).join(', ')} className={`min-h-[52px] rounded-lg p-1 ${hol ? 'bg-lorange' : on.length ? 'bg-[#FCE9E8]' : 'bg-cream'}`}>
                  <div className="text-xs font-medium text-navy">{format(d, 'd')}</div>
                  {hol && <div className="truncate text-[9px] text-[#9A6208]">{hol.name}</div>}
                  {on.slice(0, 2).map((l) => (
                    <div key={l.id} className="truncate text-[9px] text-danger">{employees.find((e) => e.id === l.employeeId)?.name.split(' ')[0]}</div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
        <div className="min-w-0 xl:col-span-3">
          <div className="mb-3 flex flex-wrap gap-1 rounded-lg border border-line bg-white p-1">
            {[['all', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['compoff', 'Comp-off']].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setTab(k)} className={`rounded-md px-3 py-1.5 text-sm ${tab === k ? 'bg-navy text-white' : 'text-muted hover:text-navy'}`}>{l}</button>
            ))}
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr>{['Employee', 'Type', 'Dates', 'Reason', 'Status', ''].map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map((l) => {
                  const emp = employees.find((e) => e.id === l.employeeId)
                  return (
                    <tr key={l.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar id={emp?.id} name={emp?.name} />
                          <div>
                            <div className="font-medium text-navy">{emp?.name}</div>
                            <div className="text-xs text-muted">{emp?.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>{LEAVE_LABELS[l.type]}</td>
                      <td className="whitespace-nowrap">{l.from === l.to ? l.from : `${l.from} → ${l.to}`}</td>
                      <td className="max-w-[220px] truncate">{l.reason}</td>
                      <td><Badge tone={TONE[l.status]}>{l.status}</Badge></td>
                      <td>
                        {l.status === 'pending' && (
                          <div className="flex gap-1">
                            <button type="button" className="btn-ghost px-2 text-ok" onClick={() => setStatus(l, 'approved')}><Check size={14} /> Approve</button>
                            <button type="button" className="btn-ghost px-2 text-danger" onClick={() => setStatus(l, 'rejected')}><X size={14} /> Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!filtered.length && <EmptyState title="No leave records" text="Nothing in this filter. Apply for leave or switch tabs." />}
          </div>
        </div>
      </div>
      {form && <LeaveForm onSave={apply} onClose={() => setForm(false)} />}
    </div>
  )
}
