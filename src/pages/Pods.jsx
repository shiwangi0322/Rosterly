import { useState } from 'react'
import { Pencil, Plus, Trash2, Network, Users, Tag } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import Modal from '../components/common/Modal'
import Field from '../components/common/Field'
import StatCard from '../components/common/StatCard'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { useApp } from '../context/AppContext'
import Avatar from '../components/common/Avatar'

function PodForm({ initial, onSave, onClose }) {
  const { employees, brands } = useApp()
  const [f, setF] = useState({
    name: '', short: '', description: '', leadId: employees[0]?.id, brandIds: [], ...initial,
    brandIds: initial?.brandIds || [],
  })
  const [err, setErr] = useState('')
  const toggle = (id) => setF({ ...f, brandIds: f.brandIds.includes(id) ? f.brandIds.filter((x) => x !== id) : [...f.brandIds, id] })
  const submit = (e) => {
    e.preventDefault()
    if (!f.name.trim()) return setErr('Pod name is required.')
    if ((f.description || '').trim().length < 4) return setErr('Add a short description.')
    onSave({ ...f, name: f.name.trim(), short: f.short.trim() || f.name.trim().split(' ')[0] })
  }
  return (
    <Modal title={f.id ? 'Edit pod' : 'Add pod'} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Short name"><input className="input" value={f.short} onChange={(e) => setF({ ...f, short: e.target.value })} /></Field>
          <Field label="Team lead" className="col-span-2">
            <select className="input" value={f.leadId} onChange={(e) => setF({ ...f, leadId: e.target.value })}>
              {employees.filter((e) => e.status === 'Active').map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Description"><textarea className="input min-h-[72px]" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div>
          <div className="mb-1 text-xs font-medium text-muted">Assigned brands</div>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <label key={b.id} className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${f.brandIds.includes(b.id) ? 'border-amber bg-lorange text-navy' : 'border-line text-muted'}`}>
                <input type="checkbox" className="sr-only" checked={f.brandIds.includes(b.id)} onChange={() => toggle(b.id)} />
                {b.name}
              </label>
            ))}
          </div>
        </div>
        {err && <p className="text-sm text-danger">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" type="submit">Save pod</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Pods() {
  const { pods, employees, brands, savePod, removePod } = useApp()
  const [form, setForm] = useState(null)
  const [remove, setRemove] = useState(null)

  const save = async (f) => {
    try {
      await savePod(f)
      setForm(null)
    } catch { /* toast from the API */ }
  }

  const confirmDelete = async () => {
    try {
      await removePod(remove.id)
      setRemove(null)
    } catch { /* toast from the API */ }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pods & Teams"
        subtitle="Operating pods with leads, brand ownership and headcount."
        actions={<button type="button" className="btn-primary" onClick={() => setForm({})}><Plus size={15} /> Add pod</button>}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard icon={Network} label="Pods" value={pods.length} />
        <StatCard icon={Users} label="People allocated" value={employees.length} />
        <StatCard icon={Tag} label="Brands mapped" value={brands.length} />
      </div>
      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        {pods.map((p) => {
          const members = employees.filter((e) => e.podId === p.id)
          const lead = employees.find((e) => e.id === p.leadId)
          const owned = brands.filter((b) => p.brandIds.includes(b.id) || b.podId === p.id)
          return (
            <div key={p.id} className="card min-w-0 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-navy">{p.name}</h2>
                  <p className="mt-1 text-sm text-muted">{p.description}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-ghost" onClick={() => setForm(p)}><Pencil size={14} /> Edit</button>
                  {pods.length > 1 && <button type="button" className="btn-ghost text-danger" onClick={() => setRemove(p)}><Trash2 size={14} /></button>}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-cream px-3 py-2">
                <Avatar id={lead?.id} name={lead?.name} size="lg" className="!h-9 !w-9" />
                <div className="text-sm">
                  <div className="font-medium text-navy">{lead?.name || 'Unassigned'}</div>
                  <div className="text-xs text-muted">Team lead</div>
                </div>
                <div className="ml-auto text-right text-sm">
                  <div className="font-semibold text-navy">{members.length}</div>
                  <div className="text-xs text-muted">Employees</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1 text-xs font-medium text-muted">Assigned brands</div>
                <div className="flex flex-wrap gap-1.5">
                  {owned.map((b) => (
                    <span key={b.id} className="rounded-full bg-lorange px-2 py-0.5 text-xs text-navy">{b.name}</span>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-2 text-xs font-medium text-muted">Allocation</div>
                <div className="flex flex-wrap gap-2">
                  {members.map((e) => (
                    <Avatar key={e.id} id={e.id} name={e.name} />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {form && <PodForm initial={form.id ? form : {}} onSave={save} onClose={() => setForm(null)} />}
      {remove && (
        <ConfirmDialog
          title="Delete pod"
          message={`${remove.name} will be removed. Members will move to another pod.`}
          confirmLabel="Delete"
          danger
          onClose={() => setRemove(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}
