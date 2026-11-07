import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import PageHeader from '../components/common/PageHeader'
import Field from '../components/common/Field'
import { useApp } from '../context/AppContext'
import { DAYS } from '../data/seed'

export default function Rules() {
  const { rules, saveRules, employees, conflicts } = useApp()
  const [f, setF] = useState(rules)
  useEffect(() => { setF(rules) }, [rules])

  const toggleDay = (d) => {
    const workingDays = f.workingDays.includes(d) ? f.workingDays.filter((x) => x !== d) : [...f.workingDays, d].sort()
    setF({ ...f, workingDays })
  }

  const save = async (e) => {
    e.preventDefault()
    if (!f.workingDays.length) return toast.error('Select at least one working day.')
    if (f.weeklyHours < 1 || f.maxShiftHours < 1) return toast.error('Hours must be greater than zero.')
    if (f.minRestHours < 0) return toast.error('Rest period cannot be negative.')
    try {
      await saveRules({
        ...f,
        weeklyHours: Number(f.weeklyHours),
        maxShiftHours: Number(f.maxShiftHours),
        minRestHours: Number(f.minRestHours),
        breakMinutes: Number(f.breakMinutes),
        overtimeAfterHours: Number(f.overtimeAfterHours),
      })
    } catch { /* toast from the API */ }
  }

  const offCounts = DAYS.map((d, i) => ({ d, n: employees.filter((e) => e.weeklyOff === i && e.status === 'Active').length }))
  const hoursConflicts = conflicts.filter((c) => c.type === 'hours' || c.type === 'weeklyOff').length

  return (
    <div className="space-y-4">
      <PageHeader title="Working Rules" subtitle="These rules are enforced when adding shifts and generating a roster." />
      <div className="grid min-w-0 gap-4 xl:grid-cols-5">
        <form onSubmit={save} className="card min-w-0 space-y-5 p-5 xl:col-span-3">
          <div>
            <div className="mb-2 text-sm font-medium text-navy">Working days</div>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d, i) => (
                <label key={d} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${f.workingDays.includes(i) ? 'border-amber bg-lorange text-navy' : 'border-line text-muted'}`}>
                  <input type="checkbox" className="sr-only" checked={f.workingDays.includes(i)} onChange={() => toggleDay(i)} />
                  {d}
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Weekly working hours">
              <input type="number" min="1" className="input" value={f.weeklyHours} onChange={(e) => setF({ ...f, weeklyHours: e.target.value })} />
            </Field>
            <Field label="Maximum shift duration (hours)">
              <input type="number" min="1" step="0.5" className="input" value={f.maxShiftHours} onChange={(e) => setF({ ...f, maxShiftHours: e.target.value })} />
            </Field>
            <Field label="Minimum rest period (hours)">
              <input type="number" min="0" step="0.5" className="input" value={f.minRestHours} onChange={(e) => setF({ ...f, minRestHours: e.target.value })} />
            </Field>
            <Field label="Break duration (minutes)">
              <select className="input" value={f.breakMinutes} onChange={(e) => setF({ ...f, breakMinutes: e.target.value })}>
                {[0, 15, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min</option>)}
              </select>
            </Field>
            <Field label="Overtime after (hours)">
              <input type="number" min="1" className="input" value={f.overtimeAfterHours} onChange={(e) => setF({ ...f, overtimeAfterHours: e.target.value })} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.weeklyOffRequired} onChange={(e) => setF({ ...f, weeklyOffRequired: e.target.checked })} />
            Require a weekly off — employees cannot be scheduled on their off day
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.overtimeAllowed} onChange={(e) => setF({ ...f, overtimeAllowed: e.target.checked })} />
            Allow overtime beyond weekly hours (hard cap remains weekly hours + 12)
          </label>
          <div className="flex justify-end">
            <button className="btn-primary" type="submit">Save and apply rules</button>
          </div>
        </form>
        <div className="min-w-0 space-y-4 xl:col-span-2">
          <div className="card p-5">
            <h2 className="font-semibold text-navy">How this applies</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink">
              <li>{employees.filter((e) => e.status === 'Active').length} active employees are validated against these caps.</li>
              <li>Maximum shift is {f.maxShiftHours}h with a {f.breakMinutes} min break.</li>
              <li>Minimum rest between shifts is {f.minRestHours}h.</li>
              <li>{hoursConflicts} open hour/off alerts currently reference these rules.</li>
            </ul>
            <Link to="/conflicts" className="mt-3 inline-block text-xs font-medium text-blue2">View related alerts</Link>
          </div>
          <div className="card p-5">
            <h2 className="font-semibold text-navy">Weekly off distribution</h2>
            <div className="mt-3 space-y-2">
              {offCounts.map((row) => (
                <div key={row.d} className="text-sm">
                  <div className="mb-1 flex justify-between"><span>{row.d}</span><span className="text-muted">{row.n}</span></div>
                  <div className="h-1.5 rounded bg-line"><div className="h-1.5 rounded bg-navy" style={{ width: `${Math.min(100, row.n * 12)}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
