export default function StatCard({ icon: Icon, label, value, hint, tone = 'bg-lorange text-amber' }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-semibold text-navy">{value}</div>
        <div className="text-xs text-muted">{label}</div>
        {hint && <div className="mt-0.5 truncate text-[11px] text-faint">{hint}</div>}
      </div>
    </div>
  )
}
