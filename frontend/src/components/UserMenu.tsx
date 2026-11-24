import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import ThemeToggle from './ThemeToggle'
import './UserMenu.css'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="user-menu">
      <span className="user-menu-identity">
        <strong>{user.firstName} {user.lastName}</strong>
        <span>{user.role}</span>
      </span>
      <ThemeToggle />
      <button type="button" className="user-menu-logout" onClick={handleLogout}>Log out</button>
    </div>
  )
}
