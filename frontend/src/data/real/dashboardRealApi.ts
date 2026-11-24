import type { DashboardApi, DashboardData } from '../types'

export async function getDashboard(signal?: AbortSignal): Promise<DashboardData> {
  const response = await fetch('/api/dashboard', { signal })
  if (!response.ok) throw new Error('Unable to load dashboard data from the database.')
  return await response.json() as DashboardData
}

export const dashboardRealApi: DashboardApi = { getDashboard }
