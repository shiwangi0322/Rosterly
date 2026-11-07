import { useState } from 'react'
import { Plus, Pencil, Trash2, Workflow, Users, Clock } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import StatCard from '../components/common/StatCard'
import EmptyState from '../components/common/EmptyState'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import Field from '../components/common/Field'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { useApp } from '../context/AppContext'
import Avatar from '../components/common/Avatar'

function ProcessForm({ initial, onSave, onClose }) {
  const { brands } = useApp()
  const [f, setF] = useState({
    name: '',
    code: '',
    description: '',
    requiredStaff: 4,
    defaultStart: '09:00',
    defaultEnd: '18:00',
    ...initial,
    shiftTypes: initial?.shiftTypes || ['general'],
    brandIds: initial?.brandIds || [],
  })
  const [err, setErr] = useState('')
  const toggle = (key, val) => setF({ ...f, [key]: f[key].includes(val) ? f[key].filter((x) => x !== val) : [...f[key], val] })
  const submit = (e) => {
    e.preventDefault()
    if (!f.name.trim() || !f.code.trim()) return setErr('Name and code are required.')
    if ((f.description || '').trim().length < 4) return setErr('Add a short description.')
    if (!f.brandIds.length) return setErr('Select at least one brand.')
    if (!f.shiftTypes.length) return setErr('Select at least one shift type.')
    onSave({ ...f, name: f.name.trim(), code: f.code.trim().toUpperCase(), requiredStaff: Number(f.requiredStaff) || 1 })
  }
  return (
    <Modal title={f.id ? 'Edit process' : 'Add process'} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Code"><input className="input uppercase" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></Field>
          <Field label="Required staffing" className="col-span-2 sm:col-span-1">
            <input type="number" min="1" className="input" value={f.requiredStaff} onChange={(e) => setF({ ...f, requiredStaff: e.target.value })} />
          </Field>
          <Field label="Default start"><input type="time" className="input" value={f.defaultStart} onChange={(e) => setF({ ...f, defaultStart: e.target.value })} /></Field>
          <Field label="Default end"><input type="time" className="input" value={f.defaultEnd} onChange={(e) => setF({ ...f, defaultEnd: e.target.value })} /></Field>
        </div>
        <Field label="Description">
          <textarea className="input min-h-[80px]" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </Field>
        <div>
          <div className="mb-1 text-xs font-medium text-muted">Shift requirements</div>
          <div className="flex flex-wrap gap-2">
            {['morning', 'evening', 'general', 'special'].map((t) => (
              <label key={t} className={`cursor-pointer rounded-full border px-3 py-1 text-xs capitalize ${f.shiftTypes.includes(t) ? 'border-amber bg-lorange text-navy' : 'border-line text-muted'}`}>
                <input type="checkbox" className="sr-only" checked={f.shiftTypes.includes(t)} onChange={() => toggle('shiftTypes', t)} />
                {t}
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs font-medium text-muted">Brand associations</div>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <label key={b.id} className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${f.brandIds.includes(b.id) ? 'border-amber bg-lorange text-navy' : 'border-line text-muted'}`}>
                <input type="checkbox" className="sr-only" checked={f.brandIds.includes(b.id)} onChange={() => toggle('brandIds', b.id)} />
                {b.name}
              </label>
            ))}
          </div>
        </div>
        {err && <p className="text-sm text-danger">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" type="submit">Save process</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Processes() {
  const { processes, brands, employees, saveProcess, removeProcess } = useApp()
  const [form, setForm] = useState(null)
  const [remove, setRemove] = useState(null)
  const [q, setQ] = useState('')
  const shown = processes.filter((p) => `${p.name} ${p.code} ${p.description}`.toLowerCase().includes(q.toLowerCase()))
  const staffed = processes.filter((p) => employees.filter((e) => e.processCodes.includes(p.code) && e.status === 'Active').length >= p.requiredStaff).length

  const save = async (f) => {
    try {
      await saveProcess(f)
      setForm(null)
    } catch { /* toast from the API */ }
  }

  const confirmDelete = async () => {
    try {
      await removeProcess(remove)
      setRemove(null)
    } catch { /* toast from the API */ }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Processes"
        subtitle="Configure workstreams, default timings and which brands they support."
        actions={<button type="button" className="btn-primary" onClick={() => setForm({})}><Plus size={15} /> Add process</button>}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard icon={Workflow} label="Processes" value={processes.length} />
        <StatCard icon={Users} label="At required staffing" value={`${staffed}/${processes.length}`} tone="bg-[#E6F4EE] text-ok" />
        <StatCard icon={Clock} label="Shift types in use" value={[...new Set(processes.flatMap((p) => p.shiftTypes))].length} />
      </div>
      <input className="input max-w-xs" placeholder="Search processes" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        {shown.map((p) => {
          const assigned = employees.filter((e) => e.processCodes.includes(p.code) && e.status === 'Active')
          return (
            <div key={p.id} className="card min-w-0 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-medium text-amber">{p.code}</div>
                  <h2 className="text-lg font-semibold text-navy">{p.name}</h2>
                </div>
                <Badge tone={assigned.length >= p.requiredStaff ? 'ok' : 'danger'}>{assigned.length}/{p.requiredStaff} staffed</Badge>
              </div>
              <p className="mt-2 text-sm text-muted">{p.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.shiftTypes.map((t) => <Badge key={t} tone="navy">{t}</Badge>)}
              </div>
              <div className="mt-3 break-words text-xs text-muted">
                {p.defaultStart} – {p.defaultEnd} · Brands: {p.brandIds.map((id) => brands.find((b) => b.id === id)?.name).filter(Boolean).join(', ') || 'None'}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {assigned.slice(0, 8).map((e) => (
                  <Avatar key={e.id} id={e.id} name={e.name} size="sm" />
                ))}
                {assigned.length > 8 && <span className="self-center text-xs text-muted">+{assigned.length - 8}</span>}
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" className="btn-ghost" onClick={() => setForm(p)}><Pencil size={14} /> Edit</button>
                <button type="button" className="btn-ghost text-danger" onClick={() => setRemove(p)}><Trash2 size={14} /> Delete</button>
              </div>
            </div>
          )
        })}
      </div>
      {!shown.length && <div className="card"><EmptyState title="No processes match" text="Try another search or add a process." /></div>}
      {form && <ProcessForm initial={form.id ? form : {}} onSave={save} onClose={() => setForm(null)} />}
      {remove && (
        <ConfirmDialog
          title="Delete process"
          message={`${remove.name} will be removed from employee assignments.`}
          confirmLabel="Delete"
          danger
          onClose={() => setRemove(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}
