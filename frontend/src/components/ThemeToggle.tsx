import { useState } from 'react'
import { setTheme, type Theme } from '../utils/theme'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setCurrentTheme] = useState<Theme>(() => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')
  const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'

  function toggleTheme() {
    setTheme(nextTheme)
    setCurrentTheme(nextTheme)
  }

  return (
    <button type="button" className={`theme-toggle ${className}`.trim()} onClick={toggleTheme} aria-label={`Switch to ${nextTheme} mode`} title={`Switch to ${nextTheme} mode`}>
      <svg className="theme-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {theme === 'dark'
          ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>
          : <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z" />}
      </svg>
      <span>{nextTheme === 'light' ? 'Light' : 'Dark'}</span>
    </button>
  )
}
