import { TYPES, fmt12 } from '../../utils/rosterUtils'
import { useApp } from '../../context/AppContext'

export default function ShiftCard({ s, conflict, compact, onClick }) {
  const { brands, processes } = useApp()
  const t = TYPES[conflict ? 'conflict' : s.type] || TYPES.general
  const b = brands.find((x) => x.id === s.brandId)?.name
  const p = processes.find((x) => x.code === s.processCode)?.name
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={`${fmt12(s.start)} – ${fmt12(s.end)} · ${b} · ${p}`}
        className="w-full truncate rounded border-l-[3px] px-1 py-1 text-left text-[10px] font-medium text-navy"
        style={{ background: t.bg, borderColor: t.bd }}
      >
        {s.start}
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border-l-4 px-2 py-1.5 text-left text-[11px] leading-snug text-ink transition-shadow hover:shadow-md"
      style={{ background: t.bg, borderColor: t.bd }}
    >
      <div className="font-semibold text-navy">{fmt12(s.start)} – {fmt12(s.end)}</div>
      <div className="truncate">{b}</div>
      <div className="truncate text-muted">{p}</div>
      <div className="text-muted">{s.breakMinutes} min break</div>
    </button>
  )
}
