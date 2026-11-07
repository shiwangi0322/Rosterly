import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import ShiftCard from './ShiftCard'
import { TYPES, dayState, overlaps, shiftHours } from '../../utils/rosterUtils'
import Avatar from '../common/Avatar'
import { useApp } from '../../context/AppContext'
import { DEMO_TODAY } from '../../data/seed'

export default function RosterCalendar({ days, rows, shifts, compact, onCell, onShift }) {
  const { leaves, holidays } = useApp()
  const w = compact ? 'min-w-[46px]' : days.length === 1 ? 'min-w-[260px]' : 'min-w-[148px]'
  const todayIso = format(DEMO_TODAY, 'yyyy-MM-dd')

  return (
    <div className="overflow-auto" style={{ maxHeight: '62vh' }}>
      <table className="w-full border-separate border-spacing-0 text-xs">
        <thead className="sticky top-0 z-20">
          <tr>
            <th className="sticky left-0 z-30 min-w-[210px] border-b border-r border-line bg-cream px-3 py-2.5 text-left font-medium text-muted">Employee</th>
            {days.map((d) => {
              const iso = format(d, 'yyyy-MM-dd')
              const hol = holidays.find((h) => h.date === iso)
              return (
                <th key={iso} title={hol?.name} className={`border-b border-line bg-cream px-1 py-2 text-center font-medium ${w}`}>
                  <div className="text-muted">{format(d, compact ? 'EEEEE' : 'EEEE')}</div>
                  <div className={`mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${iso === todayIso ? 'bg-amber text-deep' : 'text-navy'}`}>
                    {format(d, 'd')}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => {
            const mine = shifts.filter((s) => s.employeeId === e.id)
            const total = days.reduce(
              (n, d) => n + mine.filter((s) => s.date === format(d, 'yyyy-MM-dd')).reduce((a, s) => a + shiftHours(s), 0),
              0,
            )
            return (
              <tr key={e.id}>
                <td className="sticky left-0 z-10 border-b border-r border-line bg-white px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar id={e.id} name={e.name} />
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-navy">{e.name}</div>
                      <div className="text-muted">{e.id} · {total.toFixed(1)} h</div>
                    </div>
                  </div>
                </td>
                {days.map((d) => {
                  const iso = format(d, 'yyyy-MM-dd')
                  const cell = mine.filter((s) => s.date === iso)
                  const st = dayState(e, iso, { leaves, holidays })
                  return (
                    <td key={iso} className="border-b border-line p-1 align-top">
                      {cell.length ? (
                        <div className="space-y-1">
                          {cell.map((s) => (
                            <ShiftCard
                              key={s.id}
                              s={s}
                              compact={compact}
                              conflict={cell.some((o) => o !== s && overlaps(o, s))}
                              onClick={() => onShift(s)}
                            />
                          ))}
                        </div>
                      ) : st ? (
                        <div
                          className="rounded-lg px-1.5 py-2 text-center text-[10px] font-medium text-ink"
                          style={{ background: TYPES[st.k].bg }}
                          title={st.l}
                        >
                          {compact ? st.k[0].toUpperCase() : st.l}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onCell(e, iso)}
                          aria-label={`Add shift for ${e.name} on ${iso}`}
                          className="flex h-full min-h-[40px] w-full items-center justify-center rounded-lg text-faint opacity-0 hover:bg-cream hover:opacity-100 focus:opacity-100"
                        >
                          <Plus size={14} />
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      {!rows.length && <div className="p-10 text-center text-sm text-muted">No employees match these filters.</div>}
    </div>
  )
}
