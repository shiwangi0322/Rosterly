import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import PageHeader from '../components/common/PageHeader'
import Field from '../components/common/Field'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { useApp } from '../context/AppContext'

export default function Settings() {
  const { settings, holidays, rules, saveSettings, resetDemo, logout, employees, brands, shifts, leaves } = useApp()
  const [f, setF] = useState(settings)
  const [hol, setHol] = useState(holidays)
  const [breakMinutes, setBreakMinutes] = useState(rules.breakMinutes)
  const [reset, setReset] = useState(false)

  useEffect(() => {
    setF(settings)
    setHol(holidays)
    setBreakMinutes(rules.breakMinutes)
  }, [settings, holidays, rules])

  const save = async (e) => {
    e.preventDefault()
    if (!f.orgName.trim() || !f.adminName.trim() || !f.adminEmail.trim()) return toast.error('Organization and admin details are required.')
    const minutes = Number(breakMinutes)
    try {
      await saveSettings({
        settings: { ...f, defaultBreak: minutes },
        holidays: hol.filter((h) => h.date && h.name),
        rules: { ...rules, breakMinutes: minutes },
      })
    } catch { /* toast from the API */ }
  }

  const addHoliday = () => setHol([...hol, { date: '', name: '' }])
  const setH = (i, key, val) => setHol(hol.map((h, idx) => (idx === i ? { ...h, [key]: val } : h)))

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" subtitle="Organization profile, roster defaults and demo data." />
      <form onSubmit={save} className="grid gap-4 lg:grid-cols-2">
        <div className="card space-y-3 p-5">
          <h2 className="font-semibold text-navy">Organization</h2>
          <Field label="Company name"><input className="input" value={f.orgName} onChange={(e) => setF({ ...f, orgName: e.target.value })} /></Field>
          <Field label="Ops email"><input className="input" type="email" value={f.orgEmail} onChange={(e) => setF({ ...f, orgEmail: e.target.value })} /></Field>
          <Field label="Timezone">
            <select className="input" value={f.timezone} onChange={(e) => setF({ ...f, timezone: e.target.value })}>
              {['Asia/Kolkata', 'Asia/Dubai', 'UTC'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
        </div>
        <div className="card space-y-3 p-5">
          <h2 className="font-semibold text-navy">Admin profile</h2>
          <Field label="Name"><input className="input" value={f.adminName} onChange={(e) => setF({ ...f, adminName: e.target.value })} /></Field>
          <Field label="Email"><input className="input" type="email" value={f.adminEmail} onChange={(e) => setF({ ...f, adminEmail: e.target.value })} /></Field>
          <Field label="Role"><input className="input" value={f.adminRole} onChange={(e) => setF({ ...f, adminRole: e.target.value })} /></Field>
        </div>
        <div className="card space-y-3 p-5">
          <h2 className="font-semibold text-navy">Roster preferences</h2>
          <Field label="Week starts on">
            <select className="input" value={f.weekStartsOn} onChange={(e) => setF({ ...f, weekStartsOn: Number(e.target.value) })}>
              <option value={1}>Monday</option>
              <option value={0}>Sunday</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Default start"><input type="time" className="input" value={f.defaultShiftStart} onChange={(e) => setF({ ...f, defaultShiftStart: e.target.value })} /></Field>
            <Field label="Default end"><input type="time" className="input" value={f.defaultShiftEnd} onChange={(e) => setF({ ...f, defaultShiftEnd: e.target.value })} /></Field>
          </div>
          <Field label={`Default break · ${Number(breakMinutes)} min`}>
            <input
              type="range"
              min="0"
              max="60"
              step="15"
              value={Number(breakMinutes)}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              className="range-slider"
              aria-label="Default break minutes"
            />
            <div className="mt-1 flex justify-between text-[11px] text-muted">
              {[0, 15, 30, 45, 60].map((m) => <span key={m}>{m}</span>)}
            </div>
          </Field>
          <Field label="Default shift type">
            <select className="input" value={f.defaultShiftType} onChange={(e) => setF({ ...f, defaultShiftType: e.target.value })}>
              {['morning', 'evening', 'general', 'special'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
        </div>
        <div className="card space-y-3 p-5">
          <h2 className="font-semibold text-navy">Notifications</h2>
          {[
            ['notifyInApp', 'In-app alerts in the header'],
            ['notifyEmail', 'Email digest (stored preference)'],
            ['notifyCoverage', 'Coverage and conflict alerts'],
            ['notifyLeave', 'Pending leave requests'],
          ].map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} />
              {l}
            </label>
          ))}
        </div>
        <div className="card space-y-3 p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-navy">Company holidays</h2>
            <button type="button" className="btn-ghost" onClick={addHoliday}>Add holiday</button>
          </div>
          {hol.map((h, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto]">
              <input type="date" className="input" value={h.date} onChange={(e) => setH(i, 'date', e.target.value)} />
              <input className="input" placeholder="Name" value={h.name} onChange={(e) => setH(i, 'name', e.target.value)} />
              <button type="button" className="btn-ghost" onClick={() => setHol(hol.filter((_, idx) => idx !== i))}>Remove</button>
            </div>
          ))}
        </div>
        <div className="card space-y-2 p-5 lg:col-span-2">
          <h2 className="font-semibold text-navy">Workspace snapshot</h2>
          <p className="text-sm text-muted">
            PostgreSQL currently holds {employees.length} employees, {brands.length} brands, {shifts.length} shifts, {leaves.length} leave records and {holidays.length} holidays. Reload reads that database again and does not create a second copy of the sample data.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
          <button className="btn-primary" type="submit">Save settings</button>
          <button type="button" className="btn-ghost" onClick={logout}>Sign out</button>
          <button type="button" className="btn-ghost text-danger" onClick={() => setReset(true)}>Reload workspace</button>
        </div>
      </form>
      {reset && (
        <ConfirmDialog
          title="Reload workspace"
          message="This reloads employees, shifts, leaves and settings from PostgreSQL. It does not delete or reseed the database."
          confirmLabel="Reload"
          danger
          onClose={() => setReset(false)}
          onConfirm={() => { setReset(false); resetDemo() }}
        />
      )}
    </div>
  )
}
