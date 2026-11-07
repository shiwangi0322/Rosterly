import { useState } from 'react'
import { ArrowRight, CalendarDays, Eye, EyeOff, ShieldCheck, Sparkles, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import logo from '../assets/rosterly-logo.png'
import Field from '../components/common/Field'
import { useApp } from '../context/AppContext'
import { errorText } from '../api/client'

const points = [
  [CalendarDays, 'Weekly rosters across pods, brands, and processes'],
  [Users, 'See who is on shift, on leave, or short of coverage'],
  [ShieldCheck, 'Administrator access for the Datastraw workspace'],
]

export default function Login() {
  const { login, signup } = useApp()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    if (mode === 'signup' && password !== confirmPassword) {
      setBusy(false)
      setError('Passwords do not match.')
      return
    }
    try {
      if (mode === 'signup') await signup(name.trim(), email.trim(), password)
      else await login(email.trim(), password)
      toast.success(mode === 'signup' ? 'Account created' : 'Signed in')
    } catch (err) {
      const message = errorText(err)
      setError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,0.92fr)]">
      <section className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_85%_15%,rgba(245,154,24,.18),transparent_28%),linear-gradient(145deg,#0E2342,#142D50)] text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-y-0 right-0 w-px bg-white/10" />
        <div className="relative px-12 pt-12 xl:px-16 xl:pt-14">
          <div className="inline-flex rounded-xl bg-white px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,.18)]">
            <img src={logo} alt="Rosterly" className="w-44 xl:w-48" />
          </div>
          <div className="mt-16 max-w-xl xl:mt-20">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
              <Sparkles size={14} className="text-amber" /> Workforce planning, simplified
            </div>
            <h1 className="max-w-lg text-4xl font-semibold leading-[1.08] xl:text-[3.25rem]">
              Smarter scheduling.<br />Better workforce.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/70">
              Plan shifts, manage coverage, and keep every team aligned from one calm workspace.
            </p>
          </div>
        </div>
        <ul className="relative grid gap-3 px-12 pb-12 xl:px-16 xl:pb-14">
          {points.map(([Icon, text]) => (
            <li key={text} className="flex max-w-xl items-center gap-4 border-t border-white/10 py-4 text-sm text-white/85">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/8">
                <Icon size={18} className="text-amber" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </section>

      <section className="relative flex items-center justify-center bg-[#f5f7fb] px-5 py-10 sm:px-8">
        <div className="absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
        <div className="w-full max-w-[460px]">
          <div className="mb-7 flex justify-center lg:hidden">
            <img src={logo} alt="Rosterly" className="w-44" />
          </div>
          <form onSubmit={submit} className="space-y-5 rounded-2xl border border-[#e4e8ef] bg-white px-6 py-7 shadow-[0_24px_70px_rgba(20,45,80,.10)] sm:px-8 sm:py-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber">Workspace access</p>
              <h2 className="mt-2 text-[28px] font-semibold leading-tight text-navy">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {mode === 'login' ? 'Sign in to continue to Rosterly.' : 'Set up your account to join the workspace.'}
              </p>
            </div>

            <div className="grid grid-cols-2 rounded-xl border border-line bg-[#f7f8fa] p-1">
              {['login', 'signup'].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${mode === item ? 'bg-white text-navy shadow-sm' : 'text-muted'}`}
                  onClick={() => { setMode(item); setError('') }}
                >
                  {item === 'login' ? 'Sign in' : 'Sign up'}
                </button>
              ))}
            </div>

            {error && (
              <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
                {error}
              </p>
            )}

            {mode === 'signup' && (
              <Field label="Full name">
                <input
                  className="input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Your name"
                  minLength={2}
                  required
                />
              </Field>
            )}
            <Field label="Email">
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                placeholder="name@company.com"
                required
              />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-navy"
                  onClick={() => setShowPassword((open) => !open)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {mode === 'signup' && (
              <Field label="Confirm password">
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Enter the password again"
                  required
                />
              </Field>
            )}

            <button className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber py-3 text-sm font-semibold text-deep transition hover:bg-[#ea9115] disabled:opacity-50" type="submit" disabled={busy}>
              {busy ? (mode === 'signup' ? 'Creating account…' : 'Signing in…') : (mode === 'signup' ? 'Create account' : 'Sign in')}
              {!busy && <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
