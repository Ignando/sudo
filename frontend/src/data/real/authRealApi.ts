import type { AuthApi, AuthUserResponse } from '../types'

export async function login(email: string, password: string): Promise<AuthUserResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const result = await response.json() as AuthUserResponse & { error?: string }
  if (!response.ok) throw new Error(result.error ?? 'Unable to log in.')
  return result
}

export const authRealApi: AuthApi = { login }
