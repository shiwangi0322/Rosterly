export default function EmptyState({ title, text, action }) {
  return (
    <div className="px-6 py-10 text-center">
      <p className="font-medium text-navy">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-md text-sm text-muted">{text}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
