import { useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import Modal from '../common/Modal'
import Field from '../common/Field'
import { useApp } from '../../context/AppContext'
import { validateShift } from '../../utils/rosterUtils'

export default function ShiftModal({ shift, onSave, onDelete, onClose }) {
  const { employees, brands, processes, pods, shifts, leaves, holidays, rules, settings } = useApp()
  const editing = Boolean(shift.id)
  const [f, setF] = useState({
    breakMinutes: settings.defaultBreak,
    type: settings.defaultShiftType,
    start: settings.defaultShiftStart,
    end: settings.defaultShiftEnd,
    notes: '',
    ...shift,
  })
  const [err, setErr] = useState('')
  const [confirm, setConfirm] = useState(false)
  const emp = employees.find((e) => e.id === f.employeeId)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const pick = (e) => {
    const x = employees.find((y) => y.id === e.target.value)
    setF({
      ...f,
      employeeId: x.id,
      brandId: x.brandIds[0],
      processCode: x.processCodes[0],
    })
  }

  const submit = (e) => {
    e.preventDefault()
    const msg = validateShift(f, shifts, { employees, leaves, holidays, rules, settings }, f.id)
    if (msg) return setErr(msg)
    onSave({ ...f, breakMinutes: Number(f.breakMinutes) })
  }

  const empBrands = emp ? brands.filter((b) => emp.brandIds.includes(b.id)) : brands
  const empProcs = emp ? processes.filter((p) => emp.processCodes.includes(p.code)) : processes

  return (
    <Modal title={editing ? 'Edit shift' : 'Add shift'} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Employee">
            <select className="input" value={f.employeeId || ''} onChange={pick}>
              <option value="" disabled>Select employee</option>
              {employees.filter((e) => e.status === 'Active').map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" className="input" value={f.date || ''} onChange={set('date')} />
          </Field>
          <Field label="Brand">
            <select className="input" value={f.brandId || ''} onChange={set('brandId')}>
              <option value="" disabled>Select brand</option>
              {empBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Process">
            <select className="input" value={f.processCode || ''} onChange={set('processCode')}>
              <option value="" disabled>Select process</option>
              {empProcs.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Pod">
            <input className="input bg-cream" readOnly value={emp ? pods.find((p) => p.id === emp.podId)?.name || '—' : '—'} />
          </Field>
          <Field label="Shift type">
            <select className="input" value={f.type} onChange={set('type')}>
              {['morning', 'evening', 'general', 'special'].map((t) => (
                <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </Field>
          <Field label="Start time">
            <input type="time" className="input" value={f.start} onChange={set('start')} />
          </Field>
          <Field label="End time">
            <input type="time" className="input" value={f.end} onChange={set('end')} />
          </Field>
          <Field label="Break (minutes)">
            <select className="input" value={f.breakMinutes} onChange={(e) => setF({ ...f, breakMinutes: +e.target.value })}>
              {[0, 15, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
          </Field>
          <Field label="Notes">
            <input className="input" value={f.notes || ''} onChange={set('notes')} />
          </Field>
        </div>
        {err && (
          <p role="alert" className="flex items-start gap-1.5 rounded-lg bg-[#FCE9E8] px-3 py-2 text-sm text-danger">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            {err}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {editing && (confirm ? (
            <span className="flex items-center gap-2 text-sm">
              Delete this shift?
              <button type="button" className="btn bg-danger text-white" onClick={() => onDelete(f.id)}>Yes, delete</button>
              <button type="button" className="btn-ghost" onClick={() => setConfirm(false)}>Keep</button>
            </span>
          ) : (
            <button type="button" className="btn-ghost text-danger" onClick={() => setConfirm(true)}>
              <Trash2 size={15} /> Delete
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" type="submit">Save shift</button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
