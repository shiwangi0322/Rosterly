export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-navy">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="ml-auto flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
