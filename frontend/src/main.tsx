import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import AppRoutes from './routes'

import './index.css'

let initialTheme: 'dark' | 'light' = 'dark'
try {
  initialTheme = localStorage.getItem('sudo-theme') === 'light' ? 'light' : 'dark'
} catch {
  initialTheme = 'dark'
}
document.documentElement.dataset.theme = initialTheme

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
