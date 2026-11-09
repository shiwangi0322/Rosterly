import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Login from './pages/Login'
import Landing from './pages/Landing'
import { useApp } from './context/AppContext'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import Employees from './pages/Employees'
import Brands from './pages/Brands'
import Processes from './pages/Processes'
import Pods from './pages/Pods'
import Leaves from './pages/Leaves'
import Rules from './pages/Rules'
import Conflicts from './pages/Conflicts'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

export default function App() {
  const { admin, booting, loadError, refresh } = useApp()
  if (booting) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted">Loading workspace…</div>
  }
  if (!admin) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }
  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-md space-y-3 p-6 text-sm">
          <h1 className="text-lg font-semibold text-navy">Could not load the workspace</h1>
          <p className="text-danger">{loadError}</p>
          <button type="button" className="btn-primary" onClick={() => refresh()}>Try again</button>
        </div>
      </div>
    )
  }
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/signup" element={<Navigate to="/" replace />} />
      <Route element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="employees" element={<Employees />} />
        <Route path="brands" element={<Brands />} />
        <Route path="processes" element={<Processes />} />
        <Route path="pods" element={<Pods />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="rules" element={<Rules />} />
        <Route path="conflicts" element={<Conflicts />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
