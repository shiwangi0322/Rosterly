import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Users, UserCheck, Tag, Plane } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import Field from '../components/common/Field'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import StatCard from '../components/common/StatCard'
import { useApp } from '../context/AppContext'
import { DAYS, DEMO_TODAY } from '../data/seed'
import Avatar from '../components/common/Avatar'
import { format } from 'date-fns'

const empty = {
  name: '', email: '', phone: '', role: 'Agent', podId: 'POD-1', brandIds: [], processCodes: [],
  weeklyOff: 0, status: 'Active', availabilityStart: '08:00', availabilityEnd: '22:00', joined: '',
}

function EmployeeForm({ initial, onSave, onClose }) {
  const { pods, brands, processes } = useApp()
  const [f, setF] = useState({ ...empty, ...initial, brandIds: initial?.brandIds || [], processCodes: initial?.processCodes || [] })
  const [err, setErr] = useState('')
  const toggle = (key, val) => {
    const list = f[key].includes(val) ? f[key].filter((x) => x !== val) : [...f[key], val]
    setF({ ...f, [key]: list })
  }
  const submit = (e) => {
    e.preventDefault()
    if (!f.name.trim() || !f.email.trim()) return setErr('Name and email are required.')
    if (!f.phone.trim() || f.phone.trim().length < 8) return setErr('Enter a phone number.')
    if (!f.joined) return setErr('Joined date is required.')
    if (!f.brandIds.length) return setErr('Assign at least one brand.')
    if (!f.processCodes.length) return setErr('Assign at least one process.')
    onSave({ ...f, name: f.name.trim(), email: f.email.trim() })
  }
  return (
    <Modal title={f.id ? 'Edit employee' : 'Add employee'} onClose={onClose} xl>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Full name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Email"><input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Phone"><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Role">
            <select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
              {['Agent', 'Specialist', 'Team Lead'].map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Pod">
            <select className="input" value={f.podId} onChange={(e) => setF({ ...f, podId: e.target.value })}>
              {pods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </Field>
          <Field label="Weekly off">
            <select className="input" value={f.weeklyOff} onChange={(e) => setF({ ...f, weeklyOff: +e.target.value })}>
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </Field>
          <Field label="Joined"><input type="date" className="input" value={f.joined} onChange={(e) => setF({ ...f, joined: e.target.value })} /></Field>
          <Field label="Available from"><input type="time" className="input" value={f.availabilityStart} onChange={(e) => setF({ ...f, availabilityStart: e.target.value })} /></Field>
          <Field label="Available until"><input type="time" className="input" value={f.availabilityEnd} onChange={(e) => setF({ ...f, availabilityEnd: e.target.value })} /></Field>
        </div>
        <div>
          <div className="mb-1 text-xs font-medium text-muted">Brand assignments</div>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <label key={b.id} className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${f.brandIds.includes(b.id) ? 'border-amber bg-lorange text-navy' : 'border-line text-muted'}`}>
                <input type="checkbox" className="sr-only" checked={f.brandIds.includes(b.id)} onChange={() => toggle('brandIds', b.id)} />
                {b.name}
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs font-medium text-muted">Process assignments</div>
          <div className="flex flex-wrap gap-2">
            {processes.map((p) => (
              <label key={p.code} className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${f.processCodes.includes(p.code) ? 'border-amber bg-lorange text-navy' : 'border-line text-muted'}`}>
                <input type="checkbox" className="sr-only" checked={f.processCodes.includes(p.code)} onChange={() => toggle('processCodes', p.code)} />
                {p.name}
              </label>
            ))}
          </div>
        </div>
        {err && <p className="text-sm text-danger">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" type="submit">Save employee</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Employees() {
  const { employees, pods, brands, processes, saveEmployee, removeEmployee, leaves } = useApp()
  const [q, setQ] = useState('')
  const [pod, setPod] = useState('')
  const [status, setStatus] = useState('')
  const [proc, setProc] = useState('')
  const iso = format(DEMO_TODAY, 'yyyy-MM-dd')
  const onLeave = employees.filter((e) => leaves.some((l) => l.employeeId === e.id && l.status === 'approved' && iso >= l.from && iso <= l.to)).length
  const [form, setForm] = useState(null)
  const [profile, setProfile] = useState(null)
  const [remove, setRemove] = useState(null)

  const rows = useMemo(() => employees.filter((e) =>
    (!pod || e.podId === pod)
    && (!status || e.status === status)
    && (!proc || e.processCodes.includes(proc))
    && `${e.name}${e.id}${e.email}${e.role}`.toLowerCase().includes(q.toLowerCase()),
  ), [employees, pod, status, proc, q])

  const save = async (f) => {
    try {
      await saveEmployee(f)
      setForm(null)
    } catch { /* toast from the API */ }
  }

  const confirmDelete = async () => {
    try {
      await removeEmployee(remove.id)
      setRemove(null)
      setProfile(null)
    } catch { /* toast from the API */ }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Employees"
        subtitle={`${employees.length} people across ${pods.length} pods. ${employees.filter((e) => e.brandIds.length === 1).length} are single-resource.`}
        actions={<button type="button" className="btn-primary" onClick={() => setForm({})}><Plus size={15} /> Add employee</button>}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Users} label="Directory" value={employees.length} />
        <StatCard icon={UserCheck} label="Active" value={employees.filter((e) => e.status === 'Active').length} tone="bg-[#E6F4EE] text-ok" />
        <StatCard icon={Tag} label="Single-resource" value={employees.filter((e) => e.brandIds.length === 1).length} />
        <StatCard icon={Plane} label="On leave today" value={onLeave} tone="bg-[#E6F0FC] text-blue2" />
      </div>
      <div className="filter-bar">
        <input className="input max-w-xs" placeholder="Search name, ID or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input input-inline" value={pod} onChange={(e) => setPod(e.target.value)}>
          <option value="">All pods</option>
          {pods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="input input-inline" value={proc} onChange={(e) => setProc(e.target.value)}>
          <option value="">All processes</option>
          {processes.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
        </select>
        <select className="input input-inline" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>{['ID', 'Employee', 'Role', 'Pod', 'Brands', 'Processes', 'Weekly off', 'Availability', 'Status', ''].map((h) => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td className="text-muted">{e.id}</td>
                <td>
                  <button type="button" className="flex items-center gap-2 text-left" onClick={() => setProfile(e)}>
                    <Avatar id={e.id} name={e.name} />
                    <span>
                      <div className="font-medium text-navy">{e.name}</div>
                      <div className="text-xs text-muted">{e.email}</div>
                    </span>
                  </button>
                </td>
                <td>{e.role}</td>
                <td>{pods.find((p) => p.id === e.podId)?.short}</td>
                <td>{e.brandIds.map((id) => brands.find((b) => b.id === id)?.name).join(', ')}</td>
                <td>{e.processCodes.join(', ')}</td>
                <td>{DAYS[e.weeklyOff]}</td>
                <td className="text-xs text-muted">{e.availabilityStart}–{e.availabilityEnd}</td>
                <td><Badge tone={e.status === 'Active' ? 'ok' : 'muted'}>{e.status}</Badge></td>
                <td>
                  <div className="flex gap-1">
                    <button type="button" className="rounded p-1.5 hover:bg-cream" aria-label="Edit" onClick={() => setForm(e)}><Pencil size={14} /></button>
                    <button type="button" className="rounded p-1.5 hover:bg-cream text-danger" aria-label="Delete" onClick={() => setRemove(e)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <EmptyState title="No employees match" text="Try another name, pod, process or status." />}
      </div>
      {form && <EmployeeForm initial={form.id ? form : empty} onSave={save} onClose={() => setForm(null)} />}
      {profile && (
        <Modal title="Employee profile" onClose={() => setProfile(null)} wide>
          <div className="flex items-center gap-3">
            <Avatar id={profile.id} name={profile.name} size="lg" />
            <div>
              <div className="text-lg font-semibold text-navy">{profile.name}</div>
              <div className="text-sm text-muted">{profile.role} · {profile.id}</div>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs text-muted">Email</dt><dd>{profile.email}</dd></div>
            <div><dt className="text-xs text-muted">Phone</dt><dd>{profile.phone}</dd></div>
            <div><dt className="text-xs text-muted">Pod</dt><dd>{pods.find((p) => p.id === profile.podId)?.name}</dd></div>
            <div><dt className="text-xs text-muted">Joined</dt><dd>{profile.joined || '—'}</dd></div>
            <div className="col-span-2"><dt className="text-xs text-muted">Brands</dt><dd>{profile.brandIds.map((id) => brands.find((b) => b.id === id)?.name).join(', ')}</dd></div>
            <div className="col-span-2"><dt className="text-xs text-muted">Processes</dt><dd>{profile.processCodes.map((c) => processes.find((p) => p.code === c)?.name).join(', ')}</dd></div>
          </dl>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => { setProfile(null); setForm(profile) }}>Edit</button>
            <button type="button" className="btn-ghost text-danger" onClick={() => setRemove(profile)}>Delete</button>
          </div>
        </Modal>
      )}
      {remove && (
        <ConfirmDialog
          title="Remove employee"
          message={`${remove.name} can be deleted only when they have no shifts or leave history. Otherwise mark them inactive.`}
          confirmLabel="Delete"
          danger
          onClose={() => setRemove(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}
