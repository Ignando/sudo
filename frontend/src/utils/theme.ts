export type Theme = 'dark' | 'light'


export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem('sudo-theme', theme)
  } catch {
    // Theme still applies for this page load when storage is unavailable.
  }
}
