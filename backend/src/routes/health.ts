import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()
router.get('/health/db', async (_request, response) => {
  try {
    await pool.query('SELECT 1')
    response.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    console.error('Database connection failed:', error)
    response.status(503).json({ status: 'error', database: 'unavailable' })
  }
})

export default router
