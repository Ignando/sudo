import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function MainNavigation({ className, showAbout = false }: { className?: string; showAbout?: boolean }) {
  const user = useAuth().user
  if (!user) return null

  return (
    <nav aria-label="Main navigation" className={className}>
      <NavLink to="/" end>Home</NavLink>
      <NavLink to="/sales">Shop</NavLink>
      <NavLink to="/my-orders">My orders</NavLink>
      {user.role === 'Admin' && <NavLink to="/products">Products</NavLink>}
      {user.role === 'Admin' && <NavLink to="/dashboard">Dashboard</NavLink>}
      {user.role === 'Admin' && <NavLink to="/inventory">Inventory</NavLink>}
      {user.role === 'Admin' && <NavLink to="/suppliers">Suppliers</NavLink>}
      {showAbout && <a href="#about">About Sudo</a>}
    </nav>
  )
}
