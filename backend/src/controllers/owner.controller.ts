import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth.middleware'
import { query, queryOne } from '../utils/db'
import { log } from '../services/audit.service'
import { notifyAccount } from '../services/notification.service'

const ip = (req: AuthRequest) => req.ip || req.headers['x-forwarded-for']?.toString() || ''

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysFromNow(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

function lifetimeDate(): Date {
  return new Date('9999-12-31T23:59:59Z')
}

async function notifyUser(userId: string, title: string, body: string) {
  const acc = await queryOne<{ id: string }>(
    `SELECT id FROM chariow_accounts WHERE user_id = $1 LIMIT 1`, [userId]
  )
  if (acc) await notifyAccount(acc.id, { type: 'system', title, body })
}

// ── Gestion Premium ──────────────────────────────────────────────────────────

const grantSchema = z.object({
  duration: z.enum(['30', '90', '180', '365', 'lifetime']),
  source: z.enum(['owner', 'promotion', 'lifetime', 'test']).default('owner'),
  note: z.string().optional(),
})

export async function grantPremium(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params
    const { duration, source, note } = grantSchema.parse(req.body)

    const target = await queryOne<{ id: string; email: string; full_name: string; premium_ends: string | null; role: string }>(
      `SELECT id, email, full_name, premium_ends, role FROM users WHERE id = $1`, [userId]
    )
    if (!target) return res.status(404).json({ error: 'Utilisateur introuvable.' })
    if (target.role === 'owner') return res.status(403).json({ error: 'Impossible de modifier le compte OWNER.' })

    const isLifetime = duration === 'lifetime'
    const newEnds = isLifetime ? lifetimeDate()
      : (() => {
          // Prolonger à partir de la date courante OU de la fin existante (si encore active)
          const base = target.premium_ends && new Date(target.premium_ends) > new Date()
            ? new Date(target.premium_ends)
            : new Date()
          base.setDate(base.getDate() + Number(duration))
          return base
        })()

    await query(
      `UPDATE users SET
         premium = true, premium_at = COALESCE(premium_at, NOW()),
         premium_ends = $2, subscription_source = $3
       WHERE id = $1`,
      [userId, newEnds.toISOString(), isLifetime ? 'lifetime' : source]
    )

    await log({
      targetUserId: target.id, targetEmail: target.email,
      actorId: req.user!.id, actorEmail: req.user!.email,
      action: isLifetime ? 'lifetime_granted' : 'premium_granted',
      details: { duration, source, note, ends: newEnds.toISOString() },
      ip: ip(req),
    })

    await notifyUser(userId,
      isLifetime ? '🎁 PREMIUM À VIE activé !' : '🎉 PREMIUM activé !',
      isLifetime
        ? `Votre accès PRO DIGITALIX PREMIUM À VIE est actif. Profitez de toutes les fonctionnalités !`
        : `Votre abonnement PREMIUM est actif jusqu'au ${newEnds.toLocaleDateString('fr-FR')}.`
    )

    res.json({ ok: true, premium_ends: newEnds.toISOString(), source: isLifetime ? 'lifetime' : source })
  } catch (e) { next(e) }
}

export async function revokePremium(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params
    const target = await queryOne<{ id: string; email: string; role: string }>(
      `SELECT id, email, role FROM users WHERE id = $1`, [userId]
    )
    if (!target) return res.status(404).json({ error: 'Utilisateur introuvable.' })
    if (target.role === 'owner') return res.status(403).json({ error: 'Impossible de modifier le compte OWNER.' })

    await query(
      `UPDATE users SET premium = false, premium_ends = NULL, subscription_source = 'chariow' WHERE id = $1`,
      [userId]
    )

    await log({
      targetUserId: target.id, targetEmail: target.email,
      actorId: req.user!.id, actorEmail: req.user!.email,
      action: 'premium_revoked',
      details: { reason: req.body.reason },
      ip: ip(req),
    })

    res.json({ ok: true })
  } catch (e) { next(e) }
}

export async function extendPremium(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params
    const { days } = z.object({ days: z.number().int().min(1).max(3650) }).parse(req.body)

    const target = await queryOne<{ id: string; email: string; premium_ends: string | null; role: string }>(
      `SELECT id, email, premium_ends, role FROM users WHERE id = $1`, [userId]
    )
    if (!target) return res.status(404).json({ error: 'Utilisateur introuvable.' })
    if (target.role === 'owner') return res.status(403).json({ error: 'Impossible de modifier le compte OWNER.' })

    const base = target.premium_ends && new Date(target.premium_ends) > new Date()
      ? new Date(target.premium_ends) : new Date()
    base.setDate(base.getDate() + days)

    await query(
      `UPDATE users SET premium = true, premium_ends = $2 WHERE id = $1`,
      [userId, base.toISOString()]
    )

    await log({
      targetUserId: target.id, targetEmail: target.email,
      actorId: req.user!.id, actorEmail: req.user!.email,
      action: 'premium_extended',
      details: { days, new_ends: base.toISOString() },
      ip: ip(req),
    })

    await notifyUser(userId, '📅 Abonnement prolongé',
      `Votre PREMIUM est prolongé jusqu'au ${base.toLocaleDateString('fr-FR')}.`)

    res.json({ ok: true, premium_ends: base.toISOString() })
  } catch (e) { next(e) }
}

// ── Suspension ────────────────────────────────────────────────────────────────

export async function suspendUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params
    const target = await queryOne<{ id: string; email: string; role: string }>(
      `SELECT id, email, role FROM users WHERE id = $1`, [userId]
    )
    if (!target) return res.status(404).json({ error: 'Utilisateur introuvable.' })
    if (target.role === 'owner') return res.status(403).json({ error: 'Impossible de suspendre le compte OWNER.' })

    await query(`UPDATE users SET is_active = false, suspended_at = NOW() WHERE id = $1`, [userId])

    await log({
      targetUserId: target.id, targetEmail: target.email,
      actorId: req.user!.id, actorEmail: req.user!.email,
      action: 'account_suspended',
      details: { reason: req.body.reason },
      ip: ip(req),
    })

    res.json({ ok: true })
  } catch (e) { next(e) }
}

export async function reactivateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params
    const target = await queryOne<{ id: string; email: string; role: string }>(
      `SELECT id, email, role FROM users WHERE id = $1`, [userId]
    )
    if (!target) return res.status(404).json({ error: 'Utilisateur introuvable.' })

    await query(`UPDATE users SET is_active = true, suspended_at = NULL WHERE id = $1`, [userId])

    await log({
      targetUserId: target.id, targetEmail: target.email,
      actorId: req.user!.id, actorEmail: req.user!.email,
      action: 'account_reactivated',
      details: {},
      ip: ip(req),
    })

    res.json({ ok: true })
  } catch (e) { next(e) }
}

// ── Liste utilisateurs ────────────────────────────────────────────────────────

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const q = (req.query.q as string) || ''
    const plan = (req.query.plan as string) || ''
    const limit = Math.min(Number(req.query.limit) || 50, 200)
    const offset = Number(req.query.offset) || 0

    const rows = await query(
      `SELECT
         u.id, u.email, u.full_name, u.phone, u.country, u.role,
         u.premium, u.premium_at, u.premium_ends, u.subscription_source,
         u.is_active, u.suspended_at, u.login_count, u.last_active_at, u.created_at,
         (SELECT COUNT(*) FROM chariow_accounts WHERE user_id = u.id) AS accounts_count
       FROM users u
       WHERE u.role != 'owner'
         AND ($1 = '' OR u.email ILIKE $1 OR u.full_name ILIKE $1 OR u.phone ILIKE $1)
         AND ($2 = '' OR (
           ($2 = 'premium' AND u.premium = true AND (u.premium_ends IS NULL OR u.premium_ends > NOW()))
           OR ($2 = 'free' AND (u.premium = false OR u.premium_ends <= NOW()))
           OR ($2 = 'suspended' AND u.is_active = false)
         ))
       ORDER BY u.created_at DESC
       LIMIT $3 OFFSET $4`,
      [`%${q}%`, plan, limit, offset]
    )

    const countRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM users WHERE role != 'owner'
         AND ($1 = '' OR email ILIKE $1 OR full_name ILIKE $1)`,
      [`%${q}%`]
    )

    res.json({ users: rows, total: Number(countRow?.count ?? 0), limit, offset })
  } catch (e) { next(e) }
}

export async function getUserProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params
    const user = await queryOne(
      `SELECT u.*,
         (SELECT COUNT(*) FROM payments WHERE user_id = u.id AND status IN ('paid','success','completed')) AS payment_count,
         (SELECT COALESCE(SUM(amount),0) FROM payments WHERE user_id = u.id AND status IN ('paid','success','completed')) AS total_paid
       FROM users u WHERE u.id = $1`,
      [userId]
    )
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' })
    const recentLogs = await query(
      `SELECT action, details, created_at, ip_address FROM audit_logs
       WHERE target_user_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [userId]
    )
    res.json({ user, audit: recentLogs })
  } catch (e) { next(e) }
}

// ── Stats plateforme ──────────────────────────────────────────────────────────

export async function platformStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const stats = await queryOne<Record<string, string>>(
      `SELECT
         COUNT(*) FILTER (WHERE role = 'user')                     AS total_users,
         COUNT(*) FILTER (WHERE premium AND (premium_ends IS NULL OR premium_ends > NOW())) AS premium_users,
         COUNT(*) FILTER (WHERE NOT premium OR premium_ends <= NOW()) AS free_users,
         COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) AS new_this_month,
         COUNT(*) FILTER (WHERE is_active = false) AS suspended_users
       FROM users WHERE role != 'owner'`
    )

    const revenue = await queryOne<Record<string, string>>(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE confirmed_at >= date_trunc('month', NOW())), 0) AS month_revenue,
         COALESCE(SUM(amount) FILTER (WHERE confirmed_at >= date_trunc('year', NOW())), 0)  AS year_revenue,
         COUNT(*) FILTER (WHERE confirmed_at >= date_trunc('month', NOW())) AS month_payments,
         COUNT(*) FILTER (WHERE status IN ('paid','success','completed')) AS total_payments
       FROM payments WHERE status IN ('paid','success','completed')`
    )

    const growthRows = await query<{ month: string; users: string; revenue: string; premium: string }>(
      `SELECT
         TO_CHAR(date_trunc('month', s.d), 'YYYY-MM') AS month,
         COUNT(DISTINCT u.id)::text AS users,
         COALESCE(SUM(p.amount),0)::text AS revenue,
         COUNT(DISTINCT CASE WHEN u.premium THEN u.id END)::text AS premium
       FROM generate_series(
         date_trunc('month', NOW()) - interval '11 months',
         date_trunc('month', NOW()), '1 month'
       ) s(d)
       LEFT JOIN users u ON date_trunc('month', u.created_at) = s.d AND u.role != 'owner'
       LEFT JOIN payments p ON date_trunc('month', p.confirmed_at) = s.d
                            AND p.status IN ('paid','success','completed')
       GROUP BY s.d ORDER BY s.d`
    )

    const expiring = await query(
      `SELECT id, email, full_name, premium_ends FROM users
       WHERE premium = true AND premium_ends BETWEEN NOW() AND NOW() + interval '30 days'
       ORDER BY premium_ends LIMIT 10`
    )

    res.json({
      stats: {
        total_users: Number(stats?.total_users ?? 0),
        premium_users: Number(stats?.premium_users ?? 0),
        free_users: Number(stats?.free_users ?? 0),
        new_this_month: Number(stats?.new_this_month ?? 0),
        suspended_users: Number(stats?.suspended_users ?? 0),
        month_revenue: Number(revenue?.month_revenue ?? 0),
        year_revenue: Number(revenue?.year_revenue ?? 0),
        month_payments: Number(revenue?.month_payments ?? 0),
        total_payments: Number(revenue?.total_payments ?? 0),
        conversion_rate: stats?.total_users
          ? Math.round((Number(stats.premium_users) / Number(stats.total_users)) * 100)
          : 0,
      },
      growth: growthRows,
      expiring_soon: expiring,
    })
  } catch (e) { next(e) }
}

// ── Audit logs ────────────────────────────────────────────────────────────────

export async function getAuditLogs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200)
    const offset = Number(req.query.offset) || 0
    const search = (req.query.q as string) || ''

    const rows = await query(
      `SELECT a.*,
         tu.full_name AS target_name,
         au.full_name AS actor_name
       FROM audit_logs a
       LEFT JOIN users tu ON tu.id = a.target_user_id
       LEFT JOIN users au ON au.id = a.actor_id
       WHERE ($3 = '' OR a.target_email ILIKE $3 OR a.action ILIKE $3 OR a.actor_email ILIKE $3)
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset, search ? `%${search}%` : '']
    )

    const countRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM audit_logs
       WHERE ($1 = '' OR target_email ILIKE $1 OR action ILIKE $1)`,
      [search ? `%${search}%` : '']
    )

    res.json({ logs: rows, total: Number(countRow?.count ?? 0) })
  } catch (e) { next(e) }
}

// ── Promotions ────────────────────────────────────────────────────────────────

const promoSchema = z.object({
  code: z.string().min(2).max(50).toUpperCase(),
  type: z.enum(['percent_off', 'amount_off', 'premium_days', 'premium_lifetime']),
  value: z.number().int().min(0),
  description: z.string().optional(),
  max_uses: z.number().int().positive().optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
})

export async function listPromos(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const rows = await query(
      `SELECT p.*, u.email AS created_by_email
       FROM promo_codes p LEFT JOIN users u ON u.id = p.created_by
       ORDER BY p.created_at DESC`
    )
    res.json({ promos: rows })
  } catch (e) { next(e) }
}

export async function createPromo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = promoSchema.parse(req.body)
    const existing = await queryOne(`SELECT id FROM promo_codes WHERE code = $1`, [data.code])
    if (existing) return res.status(409).json({ error: 'Ce code existe déjà.' })

    const [promo] = await query(
      `INSERT INTO promo_codes (code, type, value, description, max_uses, expires_at, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [data.code, data.type, data.value, data.description ?? null,
       data.max_uses ?? null, data.expires_at ?? null, req.user!.id]
    )

    await log({
      actorId: req.user!.id, actorEmail: req.user!.email,
      action: 'promo_created',
      details: { code: data.code, type: data.type, value: data.value },
      ip: ip(req),
    })

    res.status(201).json({ promo })
  } catch (e) { next(e) }
}

export async function updatePromo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { promoId } = req.params
    const data = promoSchema.partial().parse(req.body)

    await query(
      `UPDATE promo_codes SET
         code = COALESCE($2, code),
         type = COALESCE($3, type),
         value = COALESCE($4, value),
         description = COALESCE($5, description),
         max_uses = COALESCE($6, max_uses),
         expires_at = COALESCE($7::timestamptz, expires_at),
         active = COALESCE($8, active)
       WHERE id = $1`,
      [promoId, data.code ?? null, data.type ?? null, data.value ?? null,
       data.description ?? null, data.max_uses ?? null,
       (req.body.expires_at as string | undefined) ?? null,
       (req.body.active as boolean | undefined) ?? null]
    )

    res.json({ ok: true })
  } catch (e) { next(e) }
}

export async function disablePromo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { promoId } = req.params
    const promo = await queryOne<{ code: string }>(`SELECT code FROM promo_codes WHERE id = $1`, [promoId])
    await query(`UPDATE promo_codes SET active = false WHERE id = $1`, [promoId])

    await log({
      actorId: req.user!.id, actorEmail: req.user!.email,
      action: 'promo_disabled',
      details: { code: promo?.code },
      ip: ip(req),
    })

    res.json({ ok: true })
  } catch (e) { next(e) }
}

// ── Appliquer un code promo (côté utilisateur) ────────────────────────────────

export async function applyPromo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code } = z.object({ code: z.string().toUpperCase() }).parse(req.body)
    const userId = req.user!.id

    const promo = await queryOne<{
      id: number; type: string; value: number; active: boolean;
      expires_at: string | null; max_uses: number | null; used_count: number
    }>(`SELECT * FROM promo_codes WHERE code = $1`, [code])

    if (!promo) return res.status(404).json({ error: 'Code promo invalide.' })
    if (!promo.active) return res.status(400).json({ error: 'Ce code n\'est plus actif.' })
    if (promo.expires_at && new Date(promo.expires_at) < new Date())
      return res.status(400).json({ error: 'Ce code a expiré.' })
    if (promo.max_uses !== null && promo.used_count >= promo.max_uses)
      return res.status(400).json({ error: 'Ce code a atteint sa limite d\'utilisation.' })

    const alreadyUsed = await queryOne(`SELECT 1 FROM promo_uses WHERE promo_id=$1 AND user_id=$2`, [promo.id, userId])
    if (alreadyUsed) return res.status(400).json({ error: 'Vous avez déjà utilisé ce code.' })

    // Appliquer
    if (promo.type === 'premium_lifetime') {
      await query(
        `UPDATE users SET premium=true, premium_at=COALESCE(premium_at,NOW()),
         premium_ends='9999-12-31 23:59:59+00', subscription_source='lifetime' WHERE id=$1`,
        [userId]
      )
    } else if (promo.type === 'premium_days') {
      const user = await queryOne<{ premium_ends: string | null }>(
        `SELECT premium_ends FROM users WHERE id=$1`, [userId]
      )
      const base = user?.premium_ends && new Date(user.premium_ends) > new Date()
        ? new Date(user.premium_ends) : new Date()
      base.setDate(base.getDate() + promo.value)
      await query(
        `UPDATE users SET premium=true, premium_at=COALESCE(premium_at,NOW()),
         premium_ends=$2, subscription_source='promotion' WHERE id=$1`,
        [userId, base.toISOString()]
      )
    }

    await query(`UPDATE promo_codes SET used_count = used_count + 1 WHERE id=$1`, [promo.id])
    await query(`INSERT INTO promo_uses (promo_id, user_id) VALUES ($1,$2)`, [promo.id, userId])

    await log({
      targetUserId: userId, targetEmail: req.user!.email,
      actorId: userId, actorEmail: req.user!.email,
      action: 'promo_used',
      details: { code, type: promo.type, value: promo.value },
      ip: ip(req),
    })

    res.json({ ok: true, type: promo.type, value: promo.value, message: 'Code appliqué avec succès !' })
  } catch (e) { next(e) }
}
