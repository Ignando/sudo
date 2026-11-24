import { userrole, users } from './mockDb'
import type { AuthUserResponse } from '../types'

async function hashPassword(plainText: string): Promise<string> {
  const bytes = new TextEncoder().encode(plainText)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function login(email: string, password: string): Promise<AuthUserResponse> {
  const user = users.find((row) => row.email.toLowerCase() === email.trim().toLowerCase())
  if (!user || await hashPassword(password) !== user.password_hash) {
    throw new Error('Incorrect email or password.')
  }
  if (!user.is_active) throw new Error('This account is disabled.')

  const role = userrole.find((row) => row.role_id === user.role_id)?.role_name
  if (!role) throw new Error('Incorrect email or password.')
  return {
    userId: user.user_id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    role,
  }
}
