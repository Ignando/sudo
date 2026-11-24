import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function RequireAuth() {
  const { user } = useAuth()
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export function RequireRole({ role }: { role: 'Admin' }) {
  const { user } = useAuth()
  return user?.role === role ? <Outlet /> : <Navigate to="/sales" replace />
}
