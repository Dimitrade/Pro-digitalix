import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { db, query, queryOne } from '../utils/db'
import { logger } from '../utils/logger'
import { notifyAccount } from '../services/notification.service'
import crypto from 'crypto'

const CHECKOUT_URL = 'https://anabokgroup.online/prd_y2htjbxf/checkout'
const CHARIOW_WEBHOOK_SECRET = process.env.CHARIOW_WEBHOOK_SECRET || ''

// ── Statut abonnement de l'utilisateur connecté ─────────────────────────────
export async function getSubscription(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await queryOne<{
      premium: boolean; premium_at: string | null; premium_ends: string | null; role: string
    }>(
      `SELECT premium, premium_at, premium_ends, role FROM users WHERE id = $1`,
      [req.user!.id]
    )
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' })

    const now = new Date()
    const ends = user.premium_ends ? new Date(user.premium_ends) : null
    const daysLeft = ends ? Math.max(0, Math.ceil((ends.getTime() - now.getTime()) / 86400000)) : null
    const isOwner = user.role === 'owner'

    res.json({
      plan: isOwner ? 'owner' : user.premium ? 'premium' : 'free',
      premium: isOwner || user.premium,
      premium_at: user.premium_at,
      premium_ends: isOwner ? null : user.premium_ends,
      days_left: isOwner ? null : daysLeft,
      checkout_url: CHECKOUT_URL,
    })
  } catch (e) { next(e) }
}

// ── Historique paiements ─────────────────────────────────────────────────────
export async function getPayments(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const rows = await query(
      `SELECT id, provider, transaction_id, amount, currency, status, plan, duration_months, created_at, confirmed_at
       FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.user!.id]
    )
    res.json({ payments: rows })
  } catch (e) { next(e) }
}

// ── Webhook Chariow — activation automatique ─────────────────────────────────
export async function chariowWebhook(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Vérification signature (si secret configuré)
    if (CHARIOW_WEBHOOK_SECRET) {
      const sig = req.headers['x-chariow-signature'] as string || ''
      const body = JSON.stringify(req.body)
      const expected = crypto
        .createHmac('sha256', CHARIOW_WEBHOOK_SECRET)
        .update(body)
        .digest('hex')
      if (sig !== `sha256=${expected}`) {
        logger.warn('Webhook Chariow : signature invalide')
        return res.status(401).json({ error: 'Signature invalide.' })
      }
    }

    const payload = req.body
    const event = payload.event || payload.type
    const txId = payload.transaction_id || payload.id
    const status = payload.status
    const buyerEmail = payload.customer?.email || payload.buyer_email || payload.email
    const amount = Number(payload.amount || payload.total || 0)

    logger.info(`Webhook Chariow event=${event} status=${status} tx=${txId} buyer=${buyerEmail}`)

    // Sauvegarder le payload brut
    await query(
      `INSERT INTO payments (provider, transaction_id, amount, status, plan, raw_payload, created_at)
       VALUES ('chariow', $1, $2, $3, 'premium', $4, NOW())
       ON CONFLICT (transaction_id) DO UPDATE SET status = $3, raw_payload = $4`,
      [txId, amount, status, JSON.stringify(payload)]
    )

    // Activer uniquement si paiement validé
    if (['paid', 'success', 'completed', 'PAID', 'SUCCESS'].includes(status) && buyerEmail) {
      const user = await queryOne<{ id: string; full_name: string }>(
        `SELECT id, full_name FROM users WHERE email = $1`,
        [buyerEmail.toLowerCase()]
      )

      if (user) {
        const now = new Date()
        const expiresAt = new Date(now)
        expiresAt.setMonth(expiresAt.getMonth() + 12)

        await query(
          `UPDATE users SET
             premium = true,
             premium_at = $2,
             premium_ends = $3
           WHERE id = $1`,
          [user.id, now.toISOString(), expiresAt.toISOString()]
        )

        await query(
          `UPDATE payments SET user_id = $1, confirmed_at = NOW() WHERE transaction_id = $2`,
          [user.id, txId]
        )

        // Notification push
        const firstAccount = await queryOne<{ id: string }>(
          `SELECT id FROM chariow_accounts WHERE user_id = $1 LIMIT 1`, [user.id]
        )
        if (firstAccount) {
          await notifyAccount(firstAccount.id, {
            type: 'system',
            title: '🎉 Abonnement PREMIUM activé !',
            body: `Votre abonnement PRO DIGITALIX PREMIUM est actif jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}.`,
            data: { action: '/settings' },
          })
        }

        logger.info(`PREMIUM activé pour ${buyerEmail} jusqu'au ${expiresAt.toISOString()}`)
      } else {
        logger.warn(`Webhook Chariow : utilisateur ${buyerEmail} introuvable.`)
      }
    }

    res.json({ received: true })
  } catch (e) {
    logger.error('Webhook error', e)
    next(e)
  }
}

// ── OWNER : stats globales de la plateforme ──────────────────────────────────
export async function platformStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const stats = await queryOne<{
      total_users: string; premium_users: string; free_users: string;
      total_revenue: string; active_accounts: string;
    }>(
      `SELECT
         COUNT(*)                          AS total_users,
         COUNT(*) FILTER (WHERE premium)   AS premium_users,
         COUNT(*) FILTER (WHERE NOT premium AND role = 'user') AS free_users,
         (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status IN ('paid','success','completed')) AS total_revenue,
         (SELECT COUNT(*) FROM chariow_accounts WHERE status = 'active') AS active_accounts
       FROM users WHERE role != 'owner'`
    )

    const recent = await query(
      `SELECT u.email, u.full_name, u.role, u.premium, u.premium_ends, u.created_at
       FROM users u WHERE u.role != 'owner' ORDER BY u.created_at DESC LIMIT 10`
    )

    const recentPayments = await query(
      `SELECT p.*, u.email FROM payments p
       LEFT JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC LIMIT 10`
    )

    res.json({
      stats: {
        total_users: Number(stats?.total_users ?? 0),
        premium_users: Number(stats?.premium_users ?? 0),
        free_users: Number(stats?.free_users ?? 0),
        total_revenue_fcfa: Number(stats?.total_revenue ?? 0),
        active_accounts: Number(stats?.active_accounts ?? 0),
      },
      recent_users: recent,
      recent_payments: recentPayments,
    })
  } catch (e) { next(e) }
}

// ── ADMIN : gestion utilisateurs ─────────────────────────────────────────────
export async function listUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const q = (req.query.q as string) || ''
    const limit = Math.min(Number(req.query.limit) || 50, 200)
    const offset = Number(req.query.offset) || 0
    const rows = await query(
      `SELECT id, email, full_name, phone, role, premium, premium_at, premium_ends, created_at
       FROM users WHERE role != 'owner' AND (email ILIKE $1 OR full_name ILIKE $1)
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [`%${q}%`, limit, offset]
    )
    const countRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM users WHERE role != 'owner'`
    )
    const count = countRow?.count ?? '0'
    res.json({ users: rows, total: Number(count) })
  } catch (e) { next(e) }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params
    const { role, premium, premium_ends } = req.body
    // Interdire la modification du compte OWNER
    const target = await queryOne<{ role: string }>(`SELECT role FROM users WHERE id = $1`, [userId])
    if (target?.role === 'owner') return res.status(403).json({ error: 'Impossible de modifier le compte OWNER.' })

    await query(
      `UPDATE users SET
         role = COALESCE($2, role),
         premium = COALESCE($3, premium),
         premium_ends = COALESCE($4::timestamptz, premium_ends)
       WHERE id = $1`,
      [userId, role ?? null, premium ?? null, premium_ends ?? null]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
}
