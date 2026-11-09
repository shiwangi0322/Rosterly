import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, Users, Tag, Workflow, Network, Plane,
  ScrollText, AlertTriangle, BarChart3, Settings, HelpCircle, Bell, Search,
  ChevronDown, Menu, X,
} from 'lucide-react'
import logo from '../../assets/rosterly-logo.png'
import { useApp } from '../../context/AppContext'
import Avatar from '../common/Avatar'

export const SECTIONS = [
  ['Workspace', [
    ['/', 'Dashboard', LayoutDashboard],
    ['/schedule', 'Schedule', CalendarDays],
    ['/employees', 'Employees', Users],
  ]],
  ['Organization', [
    ['/brands', 'Brands', Tag],
    ['/processes', 'Processes', Workflow],
    ['/pods', 'Pods & Teams', Network],
  ]],
  ['Management', [
    ['/leaves', 'Leave Management', Plane],
    ['/rules', 'Working Rules', ScrollText],
    ['/conflicts', 'Conflicts & Alerts', AlertTriangle],
    ['/reports', 'Reports', BarChart3],
  ]],
  ['System', [
    ['/settings', 'Settings', Settings],
  ]],
]

const flat = SECTIONS.flatMap((s) => s[1])

function Sidebar({ onNavigate }) {
  const { admin, settings } = useApp()
  const navigate = useNavigate()
  const accountName = admin?.name || settings.adminName
  const accountRole = admin?.role || settings.adminRole
  return (
    <>
      <div className="px-4 py-5">
        <img src={logo} alt="Rosterly – Smarter Scheduling. Better Workforce." className="w-full" />
      </div>
      <nav className="nav-scroll flex-1 space-y-4 overflow-y-auto px-3 pb-3">
        {SECTIONS.map(([heading, items]) => (
          <div key={heading}>
            <div className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wide text-faint">{heading}</div>
            {items.map(([to, label, Icon]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                    isActive ? 'bg-lorange font-medium text-navy' : 'text-muted hover:bg-cream hover:text-navy'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <i className="absolute left-0 top-2 h-5 w-1 rounded-r bg-amber" />}
                    <Icon size={17} className={isActive ? 'text-amber' : ''} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <button
        type="button"
        onClick={() => { onNavigate?.(); navigate('/settings') }}
        className="m-3 flex items-center gap-2 rounded-xl border border-line p-2.5 text-left hover:bg-cream"
      >
        <Avatar id={admin?.id || 'admin'} name={accountName} size="lg" className="!h-9 !w-9" />
        <div className="min-w-0 flex-1 text-sm">
          <div className="truncate font-medium text-navy">{accountName}</div>
          <div className="truncate text-xs text-muted">{accountRole}</div>
        </div>
        <ChevronDown size={16} className="text-muted" />
      </button>
    </>
  )
}

export default function MainLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { employees, brands, processes, leaves, conflicts, settings, notifications, markNotification } = useApp()
  const title = (flat.find((n) => n[0] === pathname) || [0, 'Dashboard'])[1]
  const [mobile, setMobile] = useState(false)
  const [q, setQ] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)

  const pendingLeaves = leaves.filter((l) => l.status === 'pending')
  const alerts = useMemo(() => {
    const list = []
    if (settings.notifyLeave) {
      pendingLeaves.slice(0, 4).forEach((l) => {
        const emp = employees.find((e) => e.id === l.employeeId)
        list.push({ id: l.id, text: `${emp?.name || 'Employee'} requested ${l.type} leave`, to: '/leaves' })
      })
    }
    if (settings.notifyInApp) {
      notifications.filter((n) => !n.read).slice(0, 4).forEach((n) => {
        list.push({ id: n.id, text: n.title, to: n.kind === 'leave' ? '/leaves' : '/conflicts', notificationId: n.id })
      })
    }
    if (settings.notifyCoverage) {
      conflicts.filter((c) => c.severity === 'critical').slice(0, 4).forEach((c) => {
        list.push({ id: c.id, text: c.title, to: '/conflicts' })
      })
    }
    return list
  }, [pendingLeaves, conflicts, employees, settings, notifications])

  const hits = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (s.length < 2) return []
    const emp = employees.filter((e) => `${e.name} ${e.id} ${e.email}`.toLowerCase().includes(s)).slice(0, 4)
    const br = brands.filter((b) => b.name.toLowerCase().includes(s)).slice(0, 3)
    const pr = processes.filter((p) => `${p.name} ${p.code}`.toLowerCase().includes(s)).slice(0, 3)
    return [
      ...emp.map((e) => ({ to: '/employees', label: e.name, meta: e.id })),
      ...br.map((b) => ({ to: '/brands', label: b.name, meta: 'Brand' })),
      ...pr.map((p) => ({ to: '/processes', label: p.name, meta: p.code })),
    ]
  }, [q, employees, brands, processes])

  const go = (to) => {
    setSearchOpen(false)
    setQ('')
    setBellOpen(false)
    setMobile(false)
    navigate(to)
  }

  return (
    <div className="flex h-dvh min-h-0">
      <aside className="hidden w-[245px] shrink-0 flex-col border-r border-line bg-white lg:flex">
        <Sidebar />
      </aside>
      {mobile && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-deep/40" onClick={() => setMobile(false)} />
          <aside className="relative flex h-full w-[245px] flex-col bg-white shadow-xl">
            <button type="button" className="absolute right-3 top-3 rounded p-1 hover:bg-cream" onClick={() => setMobile(false)} aria-label="Close menu">
              <X size={18} />
            </button>
            <Sidebar onNavigate={() => setMobile(false)} />
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-line bg-white px-4 sm:px-5">
          <button type="button" className="shrink-0 rounded p-1.5 text-muted hover:bg-cream lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>
          <div className="min-w-0 flex-1 truncate text-xs text-muted sm:flex-none sm:text-sm">
            <span className="hidden sm:inline">Rosterly / </span><span className="font-medium text-navy">{title}</span>
          </div>
          <div className="relative ml-auto w-28 min-w-0 shrink-0 sm:w-48 md:w-56 lg:w-72">
            <Search size={15} className="absolute left-3 top-2.5 text-faint" />
            <input
              className="input pl-9"
              placeholder="Search…"
              aria-label="Global search"
              value={q}
              onChange={(e) => { setQ(e.target.value); setSearchOpen(true) }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 180)}
            />
            {searchOpen && hits.length > 0 && (
              <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-line bg-white shadow-lg">
                {hits.map((h) => (
                  <button
                    key={h.label + h.meta}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-cream"
                    onMouseDown={() => go(h.to)}
                  >
                    <span className="font-medium text-navy">{h.label}</span>
                    <span className="text-xs text-muted">{h.meta}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <a href="mailto:support@datastraw.com" aria-label="Help" className="shrink-0 rounded p-1.5 text-muted hover:bg-cream">
            <HelpCircle size={18} />
          </a>
          <div className="relative">
            <button type="button" aria-label="Notifications" className="relative shrink-0 rounded p-1.5 text-muted hover:bg-cream" onClick={() => setBellOpen((v) => !v)}>
              <Bell size={18} />
              {alerts.length > 0 && <i className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber" />}
            </button>
            {bellOpen && (
              <div className="absolute right-0 z-30 mt-2 w-72 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-line bg-white shadow-lg sm:w-80">
                <div className="border-b border-line px-3 py-2 text-sm font-semibold text-navy">Notifications</div>
                {alerts.length === 0 && <div className="px-3 py-6 text-center text-sm text-muted">You are all caught up.</div>}
                {alerts.map((a) => (
                  <button key={a.id} type="button" className="block w-full px-3 py-2.5 text-left text-sm text-ink hover:bg-cream" onClick={() => { if (a.notificationId) markNotification(a.notificationId, true).catch(() => {}); go(a.to) }}>
                    {a.text}
                  </button>
                ))}
                <button type="button" className="w-full border-t border-line px-3 py-2 text-sm font-medium text-navy hover:bg-cream" onClick={() => go('/conflicts')}>
                  View all alerts
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
