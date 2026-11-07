export default function Field({ label, children, className = '' }) {
  return (
    <label className={`block text-sm ${className}`}>
      {label && <span className="mb-1 block text-xs font-medium text-muted">{label}</span>}
      {children}
    </label>
  )
}
