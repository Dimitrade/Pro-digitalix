import { query } from '../utils/db'
import { logger } from '../utils/logger'

export type AuditAction =
  | 'premium_granted' | 'premium_revoked' | 'premium_extended' | 'lifetime_granted'
  | 'account_suspended' | 'account_reactivated' | 'payment_received' | 'promo_used'
  | 'plan_changed' | 'role_changed' | 'promo_created' | 'promo_disabled'
  | 'support_ticket_technical' | 'support_ticket_billing' | 'support_ticket_account'
  | 'support_ticket_feature' | 'support_ticket_other'

export interface AuditEntry {
  targetUserId?: string
  targetEmail?: string
  actorId?: string
  actorEmail?: string
  action: AuditAction
  details?: Record<string, unknown>
  ip?: string
}

export async function log(entry: AuditEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs
         (target_user_id, target_email, actor_id, actor_email, action, details, ip_address, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
      [
        entry.targetUserId ?? null,
        entry.targetEmail ?? null,
        entry.actorId ?? null,
        entry.actorEmail ?? null,
        entry.action,
        JSON.stringify(entry.details ?? {}),
        entry.ip ?? null,
      ]
    )
  } catch (e) {
    logger.error('audit.log error', e)
  }
}

export async function getAuditLogs(limit = 100, offset = 0, search = '') {
  return query(
    `SELECT a.*,
       tu.full_name AS target_name,
       au.full_name AS actor_name
     FROM audit_logs a
     LEFT JOIN users tu ON tu.id = a.target_user_id
     LEFT JOIN users au ON au.id = a.actor_id
     WHERE ($3 = '' OR a.target_email ILIKE $3 OR a.action ILIKE $3)
     ORDER BY a.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset, search ? `%${search}%` : '']
  )
}
