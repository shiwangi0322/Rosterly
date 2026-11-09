import { ArrowRight, CalendarCheck, Check, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import logo from '../assets/rosterly-logo.png'

const brands = [
  ['BR-001', 'Nike'],
  ['BR-002', 'Zara'],
  ['BR-003', 'Puma'],
  ['BR-004', 'Urban Company'],
  ['BR-005', 'Mamaearth'],
  ['BR-006', 'boAt'],
]

const roster = [
  { name: 'Rahul Sharma', role: 'Customer Support', time: '09:00 – 18:00', brand: 'Nike', color: 'bg-[#e9f4ed] text-[#377a55]' },
  { name: 'Priya Mehta', role: 'Customer Support', time: '10:00 – 19:00', brand: 'Zara', color: 'bg-[#fff1dd] text-[#9c6414]' },
  { name: 'Aman Verma', role: 'Cart Recovery', time: '14:00 – 22:00', brand: 'boAt', color: 'bg-[#e9eef8] text-[#49648e]' },
]

function RosterPreview() {
  return (
    <div className="landing-rise landing-delay-1 relative mx-auto w-full max-w-[610px]">
      <div className="absolute -right-4 -top-5 z-10 hidden items-center gap-2 rounded-lg border border-[#e6e9e3] bg-white px-3 py-2 text-xs font-medium text-[#315d42] shadow-[0_8px_24px_rgba(27,48,37,.08)] sm:flex">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e6f4eb]"><Check size={13} /></span>
        Coverage looks balanced
      </div>
      <div className="overflow-hidden rounded-xl border border-[#dfe5e5] bg-white shadow-[0_28px_70px_rgba(17,40,65,.14)]">
        <div className="flex items-center justify-between border-b border-[#e9edef] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff1dc] text-[#bb7818]"><CalendarCheck size={16} /></span>
            <div>
              <div className="text-xs font-semibold text-[#193653] sm:text-sm">Weekly roster</div>
              <div className="text-[10px] text-[#82909d] sm:text-xs">Nov 9 – Nov 15</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-[#f2f6f3] px-2.5 py-1.5 text-[10px] font-medium text-[#477153] sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#58a66b]" /> Published
          </div>
        </div>
        <div className="grid grid-cols-[1.25fr_1fr_.85fr] border-b border-[#edf0f1] bg-[#fafbf9] px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-[#83909c] sm:grid-cols-[1.3fr_1fr_.9fr_.6fr] sm:px-5 sm:text-[10px]">
          <span>Team member</span><span>Process</span><span>Shift</span><span className="hidden sm:block">Brand</span>
        </div>
        <div className="divide-y divide-[#edf0f1]">
          {roster.map((person, index) => (
            <div key={person.name} className={`grid grid-cols-[1.25fr_1fr_.85fr] items-center px-3 py-2.5 sm:grid-cols-[1.3fr_1fr_.9fr_.6fr] sm:px-5 sm:py-3 ${index === 2 ? 'hidden sm:grid' : ''}`}>
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e9eef4] text-[10px] font-semibold text-[#31506e]">{person.name.split(' ').map((part) => part[0]).join('')}</span>
                <span className="truncate text-[10px] font-medium text-[#243e58] sm:text-xs">{person.name}</span>
              </div>
              <span className="truncate pr-1 text-[9px] text-[#71808e] sm:text-[11px]">{person.role}</span>
              <span className="whitespace-nowrap text-[9px] text-[#536575] sm:text-[11px]">{person.time}</span>
              <span className={`hidden w-fit rounded px-2 py-1 text-[10px] font-medium sm:block ${person.color}`}>{person.brand}</span>
            </div>
          ))}
        </div>
        <div className="hidden items-center justify-between border-t border-[#e9edef] bg-[#fcfdfc] px-4 py-3 text-[10px] text-[#7b8995] sm:flex sm:px-5 sm:text-xs">
          <span className="flex items-center gap-1.5"><Users size={13} /> Team coverage at a glance</span>
          <span>3 of 32 scheduled</span>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  return (
    <main className="flex h-[100svh] min-h-[620px] flex-col overflow-hidden bg-[#fbfaf6] text-[#18324d]">
      <header className="relative z-20 border-b border-[#e9e8e1] bg-[#fbfaf6]/95">
        <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <Link to="/" aria-label="Rosterly home" className="shrink-0">
            <img src={logo} alt="Rosterly" className="w-32 sm:w-36" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="rounded-lg px-3 py-2 text-xs font-semibold text-[#27435f] transition-colors hover:bg-[#f1eee5] sm:px-4 sm:text-sm">Sign in</Link>
            <Link to="/signup" className="inline-flex items-center gap-1.5 rounded-lg bg-[#f4a11b] px-3 py-2.5 text-xs font-semibold text-[#172d45] transition-colors hover:bg-[#e8940f] sm:gap-2 sm:px-4 sm:text-sm">
              Get started <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      <section id="platform" className="mx-auto grid min-h-0 w-full max-w-[1240px] flex-1 items-center gap-5 px-5 py-5 sm:px-8 sm:py-7 lg:grid-cols-[.9fr_1.1fr] lg:grid-rows-[1fr_auto] lg:gap-x-10 lg:gap-y-2 lg:py-6">
        <div className="landing-rise relative z-10 max-w-[520px]">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e5dfce] bg-white/80 px-3 py-1.5 text-xs font-medium text-[#766746]">
            <span className="h-2 w-2 rounded-full bg-[#e89b20]" /> Workforce planning, made clearer
          </div>
          <h1 className="max-w-[510px] font-serif text-[42px] font-semibold leading-[1.02] text-[#142f4b] sm:text-[54px] lg:text-[62px]">
            Rosterly
          </h1>
          <p className="mt-3 max-w-[490px] text-[17px] font-medium leading-6 text-[#2e4a64] sm:text-[19px] sm:leading-7">
            The roster that keeps every team moving.
          </p>
          <p className="mt-3 max-w-[440px] text-sm leading-6 text-[#71808b] sm:text-base">
            Plan shifts, manage leave, and spot coverage gaps in one place.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/signup" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#f4a11b] px-5 text-sm font-semibold text-[#172d45] shadow-[0_8px_18px_rgba(216,143,23,.18)] transition hover:bg-[#e8940f]">
              Create your account <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
        <div className="relative flex min-w-0 items-center justify-center py-1 lg:py-5">
          <RosterPreview />
        </div>
        <div className="hidden items-center justify-between border-t border-[#e9e8e1] pt-3 lg:col-span-2 lg:flex">
          <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#83909a]">One roster across every brand</p>
          <div className="flex items-center gap-6">
            {brands.map(([id, name]) => (
              <div key={id} className="flex items-center gap-1.5 opacity-70">
                <img src={`/brands/${id}.svg`} alt="" className="h-5 w-5 object-contain" />
                <span className="text-[11px] font-semibold text-[#506273]">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
