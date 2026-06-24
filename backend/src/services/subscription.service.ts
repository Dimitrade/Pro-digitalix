import { query } from '../utils/db'
import { logger } from '../utils/logger'

export async function expireSubscriptions(): Promise<{ expired: number }> {
  try {
    const rows = await query<{ id: string; email: string }>(
      `UPDATE users
       SET premium = false
       WHERE premium = true
         AND role != 'owner'
         AND premium_ends IS NOT NULL
         AND premium_ends < NOW()
       RETURNING id, email`
    )
    if (rows.length > 0) {
      logger.info(`[cron] ${rows.length} abonnement(s) expiré(s) : ${rows.map(r => r.email).join(', ')}`)
    }
    return { expired: rows.length }
  } catch (e) {
    logger.error('[cron] expireSubscriptions error', e)
    return { expired: 0 }
  }
}

export function hasPremiumAccess(user: { role: string; premium: boolean; premium_ends?: string | null }): boolean {
  if (user.role === 'owner') return true
  if (!user.premium) return false
  if (!user.premium_ends) return user.premium
  return new Date(user.premium_ends) > new Date()
}
