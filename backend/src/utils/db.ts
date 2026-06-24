import { Pool } from 'pg'
import { logger } from './logger'

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

db.on('connect', () => logger.debug('DB: nouvelle connexion PostgreSQL'))
db.on('error', (err) => logger.error('DB: erreur pool PostgreSQL', err))

export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const start = Date.now()
  const res = await db.query(text, params)
  const duration = Date.now() - start
  if (duration > 1000) logger.warn(`Requête lente (${duration}ms): ${text}`)
  return res.rows as T[]
}

export async function queryOne<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}
