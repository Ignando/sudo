import { createHash } from 'node:crypto'

// Simple unsalted baseline; replace with bcrypt later.
export function hashPassword(plainText: string): string {
  return createHash('sha256').update(plainText, 'utf8').digest('hex')
}
