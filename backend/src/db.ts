import 'dotenv/config'
import { Pool } from 'pg'

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env

if (!PGHOST || !PGDATABASE || !PGUSER || !PGPASSWORD) {
  throw new Error('Set PGHOST, PGDATABASE, PGUSER, and PGPASSWORD in backend/.env')
}

export const pool = new Pool({
  host: PGHOST,
  port: Number(process.env.PGPORT ?? '5432'),
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
})
