import { useState } from 'react'
import { Plus, Pencil, Trash2, Tag, ShieldCheck, Users, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import PageHeader from '../components/common/PageHeader'
import StatCard from '../components/common/StatCard'
import EmptyState from '../components/common/EmptyState'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import Field from '../components/common/Field'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { useApp } from '../context/AppContext'
import { coverage } from '../utils/rosterUtils'
import Avatar, { BrandMark } from '../components/common/Avatar'
import { DEMO_TODAY } from '../data/seed'

function BrandForm({ initial, onSave, onClose }) {
  const { pods, processes } = useApp()
  const [f, setF] = useState({
    name: '', category: '', podId: pods[0]?.id, minCoverage: 1, singleResource: true, processCodes: [],
    ...initial,
    processCodes: initial?.processCodes || [],
  })
  const [err, setErr] = useState('')
  const toggle = (code) => {
    const processCodes = f.processCodes.includes(code) ? f.processCodes.filter((c) => c !== code) : [...f.processCodes, code]
    setF({ ...f, processCodes })
  }
  const submit = (e) => {
    e.preventDefault()
    if (!f.name.trim()) return setErr('Brand name is required.')
    if ((f.category || '').trim().length < 2) return setErr('Category is required.')
    if (!f.processCodes.length) return setErr('Select at least one process.')
    onSave({ ...f, name: f.name.trim(), minCoverage: Number(f.minCoverage) || 1, singleResource: Number(f.minCoverage) <= 1 })
  }
  return (
    <Modal title={f.id ? 'Edit brand' : 'Add brand'} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Category"><input className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field>
          <Field label="Pod">
            <select className="input" value={f.podId} onChange={(e) => setF({ ...f, podId: e.target.value })}>
              {pods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Minimum staffing">
            <input type="number" min="1" className="input" value={f.minCoverage} onChange={(e) => setF({ ...f, minCoverage: e.target.value })} />
          </Field>
        </div>
        <div>
          <div className="mb-1 text-xs font-medium text-muted">Associated processes</div>
          <div className="flex flex-wrap gap-2">
            {processes.map((p) => (
              <label key={p.code} className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${f.processCodes.includes(p.code) ? 'border-amber bg-lorange text-navy' : 'border-line text-muted'}`}>
                <input type="checkbox" className="sr-only" checked={f.processCodes.includes(p.code)} onChange={() => toggle(p.code)} />
                {p.name}
              </label>
            ))}
          </div>
        </div>
        {err && <p className="text-sm text-danger">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" type="submit">Save brand</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Brands() {
  const { brands, employees, pods, processes, shifts, saveBrand, removeBrand } = useApp()
  const [q, setQ] = useState('')
  const [form, setForm] = useState(null)
  const [detail, setDetail] = useState(null)
  const [remove, setRemove] = useState(null)
  const iso = format(DEMO_TODAY, 'yyyy-MM-dd')
  const rows = brands.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()) || b.category.toLowerCase().includes(q.toLowerCase()))

  const save = async (f) => {
    try {
      await saveBrand(f)
      setForm(null)
    } catch { /* toast from the API */ }
  }

  const confirmDelete = async () => {
    try {
      await removeBrand(remove.id)
      setRemove(null)
      setDetail(null)
    } catch { /* toast from the API */ }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Brands"
        subtitle={`${brands.filter((b) => b.singleResource).length} of ${brands.length} brands run as single-resource. Coverage is calculated for today.`}
        actions={<button type="button" className="btn-primary" onClick={() => setForm({})}><Plus size={15} /> Add brand</button>}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Tag} label="Brands" value={brands.length} />
        <StatCard icon={Users} label="Single-resource" value={brands.filter((b) => b.singleResource).length} />
        <StatCard icon={ShieldCheck} label="At coverage today" value={brands.filter((b) => coverage(shifts, b.id, iso) >= b.minCoverage).length} tone="bg-[#E6F4EE] text-ok" />
        <StatCard icon={AlertTriangle} label="Below minimum" value={brands.filter((b) => coverage(shifts, b.id, iso) < b.minCoverage).length} tone="bg-[#FCE9E8] text-danger" />
      </div>
      <input className="input max-w-xs" placeholder="Search brands" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="grid gap-4 sm:grid-cols-2">
        {rows.map((b) => {
          const assigned = employees.filter((e) => e.brandIds.includes(b.id))
          const c = coverage(shifts, b.id, iso)
          const ok = c >= b.minCoverage
          return (
            <button key={b.id} type="button" className="card p-4 text-left hover:border-amber/50" onClick={() => setDetail(b)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <BrandMark id={b.id} name={b.name} />
                  <div>
                    <div className="font-semibold text-navy">{b.name}</div>
                    <div className="text-xs text-muted">{b.category} · {pods.find((p) => p.id === b.podId)?.name}</div>
                  </div>
                </div>
                <Badge tone={b.singleResource ? 'navy' : 'warn'}>{b.singleResource ? 'Single resource' : 'Multi resource'}</Badge>
              </div>
              <div className="mt-4 flex items-end justify-between text-sm">
                <div>
                  <div className="text-xs text-muted">Assigned</div>
                  <div className="font-medium">{assigned.length} employees</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted">Today</div>
                  <div className={ok ? 'font-medium text-ok' : 'font-medium text-danger'}>{c}/{b.minCoverage}</div>
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded bg-line">
                <div className={`h-1.5 rounded ${ok ? 'bg-amber' : 'bg-danger'}`} style={{ width: `${Math.min(100, (c / b.minCoverage) * 100)}%` }} />
              </div>
            </button>
          )
        })}
      </div>
      {!rows.length && <div className="card"><EmptyState title="No brands match" text="Adjust the search or add a new brand." /></div>}
      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)} wide>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <BrandMark id={detail.id} name={detail.name} />
              <div className="flex flex-wrap gap-2">
              <Badge tone={detail.singleResource ? 'navy' : 'warn'}>{detail.singleResource ? 'Single resource' : 'Multi resource'}</Badge>
              <Badge>{pods.find((p) => p.id === detail.podId)?.name}</Badge>
              <Badge tone="ok">Min staff {detail.minCoverage}</Badge>
              </div>
            </div>
            <p className="text-muted">Processes: {detail.processCodes.map((c) => processes.find((p) => p.code === c)?.name).join(', ')}</p>
            <div>
              <div className="mb-2 font-medium text-navy">Assigned employees</div>
              <ul className="space-y-1">
                {employees.filter((e) => e.brandIds.includes(detail.id)).map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg bg-cream px-3 py-2">
                    <span className="flex items-center gap-2">
                      <Avatar id={e.id} name={e.name} size="sm" />
                      {e.name}
                    </span>
                    <span className="text-muted">{e.role} · {e.status}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => { setDetail(null); setForm(detail) }}><Pencil size={14} /> Edit</button>
              <button type="button" className="btn-ghost text-danger" onClick={() => setRemove(detail)}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        </Modal>
      )}
      {form && <BrandForm initial={form.id ? form : {}} onSave={save} onClose={() => setForm(null)} />}
      {remove && (
        <ConfirmDialog
          title="Delete brand"
          message={`${remove.name} will be removed and unassigned from employees. Existing historical shifts keep the brand id until edited.`}
          confirmLabel="Delete"
          danger
          onClose={() => setRemove(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}
