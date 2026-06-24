import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth.middleware'
import { db as pool } from '../utils/db'
import { triggers, notifyAccount } from '../services/notification.service'

// Enregistrer un token FCM
export async function registerToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { fcm_token, platform } = z.object({
      fcm_token: z.string().min(1),
      platform: z.enum(['web', 'android', 'ios']).default('web'),
    }).parse(req.body)

    const { accountId } = req.params
    await pool.query(
      `INSERT INTO user_fcm_tokens (user_id, account_id, fcm_token, platform, active, updated_at)
       VALUES ($1, $2, $3, $4, true, NOW())
       ON CONFLICT (user_id, fcm_token) DO UPDATE SET active = true, updated_at = NOW()`,
      [req.user!.id, accountId, fcm_token, platform]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
}

// Supprimer un token (logout)
export async function removeToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { fcm_token } = z.object({ fcm_token: z.string() }).parse(req.body)
    await pool.query(
      `UPDATE user_fcm_tokens SET active = false WHERE user_id = $1 AND fcm_token = $2`,
      [req.user!.id, fcm_token]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
}

// Lister les notifications d'un compte
export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { accountId } = req.params
    const limit = Number(req.query.limit) || 50
    const offset = Number(req.query.offset) || 0
    const { rows } = await pool.query<{ read_at: string | null; [k: string]: unknown }>(
      `SELECT id, type, title, body, data, read_at, created_at
       FROM notifications
       WHERE account_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [accountId, limit, offset]
    )
    const unread = rows.filter((r) => !r.read_at).length
    res.json({ notifications: rows, unread })
  } catch (e) { next(e) }
}

// Marquer comme lu
export async function markRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { accountId, notifId } = req.params
    if (notifId === 'all') {
      await pool.query(
        `UPDATE notifications SET read_at = NOW() WHERE account_id = $1 AND read_at IS NULL`,
        [accountId]
      )
    } else {
      await pool.query(
        `UPDATE notifications SET read_at = NOW() WHERE id = $1 AND account_id = $2`,
        [notifId, accountId]
      )
    }
    res.json({ ok: true })
  } catch (e) { next(e) }
}

// Archiver
export async function archive(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { accountId, notifId } = req.params
    await pool.query(
      `UPDATE notifications SET archived_at = NOW() WHERE id = $1 AND account_id = $2`,
      [notifId, accountId]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
}

// Tester un push (admin/debug)
export async function testPush(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { accountId } = req.params
    const { type } = z.object({
      type: z.enum(['new_sale','new_customer','cart_abandon','goal_reached','trending_product','weak_product','ai_recommendation']).default('new_sale'),
    }).parse(req.body)

    const demos: Record<string, () => Promise<unknown>> = {
      new_sale:         () => triggers.newSale(accountId, 25000, 'Formation Marketing Pro'),
      new_customer:     () => triggers.newCustomer(accountId, 'Aminata Diallo'),
      cart_abandon:     () => triggers.cartAbandon(accountId, 3, 75000),
      goal_reached:     () => triggers.goalReached(accountId, 'CA Mensuel', 500000),
      trending_product: () => triggers.trendingProduct(accountId, 'Ebook Business', 45),
      weak_product:     () => triggers.weakProduct(accountId, 'Template CV Pro'),
      ai_recommendation:() => triggers.aiRecommendation(accountId, 'Lancez une promotion sur vos produits peu vendus ce week-end.'),
    }
    const result = await demos[type]()
    res.json({ ok: true, result })
  } catch (e) { next(e) }
}

// Préférences de notification
export async function getPreferences(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const row = await pool.query(
      `SELECT * FROM notification_preferences WHERE user_id = $1 LIMIT 1`,
      [req.user!.id]
    )
    res.json(row.rows[0] ?? {
      email: true, push: true, sms: false, whatsapp: false,
      new_sale: true, new_customer: true, cart_abandon: true,
      goal_reached: true, trending_product: true, weak_product: true,
      ai_recommendation: true,
      silence_start: '22:00', silence_end: '07:00',
    })
  } catch (e) { next(e) }
}

export async function savePreferences(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const prefs = req.body
    await pool.query(
      `INSERT INTO notification_preferences (user_id, prefs, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET prefs = $2, updated_at = NOW()`,
      [req.user!.id, JSON.stringify(prefs)]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
}
