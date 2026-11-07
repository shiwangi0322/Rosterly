import { useState } from 'react'
import { format, addDays } from 'date-fns'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import Field from '../common/Field'
import { useApp } from '../../context/AppContext'
import { DEMO_TODAY } from '../../data/seed'

export default function GenerateRosterModal({ onClose }) {
  const { generateRosterRange, busy } = useApp()
  const [from, setFrom] = useState(format(DEMO_TODAY, 'yyyy-MM-dd'))
  const [to, setTo] = useState(format(addDays(DEMO_TODAY, 6), 'yyyy-MM-dd'))
  const [result, setResult] = useState(null)

  const run = async (e) => {
    e.preventDefault()
    if (to < from) return toast.error('End date must be on or after start date.')
    try {
      const data = await generateRosterRange({ from, to })
      const created = data.created || []
      const unresolved = data.unresolved || []
      const conflicts = data.conflicts || []
      setResult({ created, unresolved, conflicts, rejections: data.rejections || [] })
      if (created.length && !unresolved.length) toast.success(`Created ${created.length} shifts with no open coverage gaps.`)
      else if (created.length) toast(`${created.length} shifts created. ${unresolved.length} coverage gaps remain.`, { icon: '⚠️', duration: 6000 })
      else toast.error('No valid shifts could be created for this range.')
    } catch { /* toast from the API */ }
  }

  return (
    <Modal title="Generate roster" onClose={onClose} wide>
      <p className="mb-4 text-sm text-muted">
        Rosterly fills gaps only. Existing shifts, weekly offs, approved leave, rest rules and hour caps are respected. Unresolved coverage is listed instead of creating invalid shifts.
      </p>
      <form onSubmit={run} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="From"><input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="To"><input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        <div className="col-span-2 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Close</button>
          <button className="btn-primary" type="submit" disabled={busy}>{busy ? 'Generating…' : 'Generate'}</button>
        </div>
      </form>
      {result && (
        <div className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
          <div className="font-medium text-navy">{result.created.length} shift(s) added</div>
          {result.unresolved.length === 0 && <p className="text-ok">All minimum staffing targets in range were met.</p>}
          {result.unresolved.map((u) => (
            <div key={`${u.brandId}-${u.date}`} className="rounded-lg bg-[#FCE9E8] px-3 py-2 text-danger">
              <div className="font-medium">{u.title}</div>
              <div className="text-xs opacity-80">{u.detail}</div>
            </div>
          ))}
          {result.conflicts?.length > 0 && (
            <div className="font-medium text-navy">{result.conflicts.length} conflict(s) reported for this range</div>
          )}
          {result.conflicts?.slice(0, 6).map((c) => (
            <div key={c.id} className="rounded-lg bg-cream px-3 py-2">
              <div className="font-medium text-navy">{c.title}</div>
              <div className="text-xs text-muted">{c.detail}</div>
            </div>
          ))}
          {result.rejections?.length > 0 && (
            <p className="text-xs text-muted">{result.rejections.length} employee assignments were skipped. {result.rejections[0].reason}</p>
          )}
        </div>
      )}
    </Modal>
  )
}
