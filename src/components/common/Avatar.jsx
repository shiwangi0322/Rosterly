import { useState } from 'react'
import { initials } from '../../utils/rosterUtils'

export default function Avatar({ id, name, size = 'md', className = '' }) {
  const [broken, setBroken] = useState(false)
  const px = size === 'lg' ? 'h-12 w-12 text-sm' : size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-8 w-8 text-[11px]'
  const src = id ? `/avatars/${id}.svg` : ''
  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name || ''}
        title={name}
        onError={() => setBroken(true)}
        className={`shrink-0 rounded-full object-cover ring-1 ring-line ${px} ${className}`}
      />
    )
  }
  return (
    <span title={name} className={`flex shrink-0 items-center justify-center rounded-full bg-lorange font-semibold text-navy ${px} ${className}`}>
      {initials(name)}
    </span>
  )
}

export function BrandMark({ id, name, className = '' }) {
  const [broken, setBroken] = useState(false)
  const src = id ? `/brands/${id}.svg` : ''
  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name || ''}
        onError={() => setBroken(true)}
        className={`h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-line ${className}`}
      />
    )
  }
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy text-sm font-semibold text-white ${className}`}>
      {(name || '?').slice(0, 1)}
    </span>
  )
}
