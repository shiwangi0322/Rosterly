export default function MiniBars({ data, valueKey = 'count', labelKey = 'day', color = '#142D50' }) {
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey]) || 0))
  return (
    <div className="flex h-52 min-w-0 items-end gap-2 overflow-x-auto pt-2">
      {data.map((d) => {
        const value = Number(d[valueKey]) || 0
        const h = Math.max(value ? 10 : 3, Math.round((value / max) * 160))
        return (
          <div key={String(d[labelKey])} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            <div className="text-xs font-semibold text-navy">{value}</div>
            <div className="w-full max-w-[42px] rounded-t-md" style={{ height: h, background: color }} title={`${d[labelKey]}: ${value}`} />
            <div className="truncate text-[11px] text-muted">{d[labelKey]}</div>
          </div>
        )
      })}
    </div>
  )
}
