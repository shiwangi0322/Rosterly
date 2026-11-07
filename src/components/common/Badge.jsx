const TONES = {
  ok: 'bg-[#E6F4EE] text-ok',
  warn: 'bg-lorange text-[#9A6208]',
  danger: 'bg-[#FCE9E8] text-danger',
  muted: 'bg-[#F1F3F5] text-muted',
  navy: 'bg-navy/10 text-navy',
  critical: 'bg-[#FCE9E8] text-danger',
  high: 'bg-lorange text-[#9A6208]',
  medium: 'bg-[#E6F0FC] text-blue2',
}

export default function Badge({ children, tone = 'muted' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${TONES[tone] || TONES.muted}`}>
      {children}
    </span>
  )
}
