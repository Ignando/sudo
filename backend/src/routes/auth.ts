import { Router } from 'express'
import { pool } from '../db.js'
import { hashPassword } from '../utils/password.js'

const router = Router()
router.post('/auth/login', async (request, response) => {
  const body = request.body as { email?: unknown; password?: unknown }
  if (typeof body?.email !== 'string' || typeof body.password !== 'string') {
    response.status(400).json({ error: 'Email and password are required.' })
    return
  }

  try {
    const { rows } = await pool.query(`
      SELECT users.user_id AS "userId",
        users.first_name AS "firstName",
        users.last_name AS "lastName",
        users.email,
        users.password_hash AS "passwordHash",
        users.is_active AS "isActive",
        userrole.role_name AS role
      FROM users
      JOIN userrole ON userrole.role_id = users.role_id
      WHERE LOWER(users.email) = LOWER($1)
    `, [body.email.trim()])

    const user = rows[0]
    if (!user || hashPassword(body.password) !== user.passwordHash) {
      response.status(401).json({ error: 'Incorrect email or password.' })
      return
    }
    if (!user.isActive) {
      response.status(403).json({ error: 'This account is disabled.' })
      return
    }

    response.json({
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    })
  } catch (error) {
    console.error('Failed to log in:', error)
    response.status(500).json({ error: 'Unable to log in.' })
  }
})

export default router
