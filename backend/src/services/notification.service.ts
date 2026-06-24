import { logger } from '../utils/logger'
import { db as pool } from '../utils/db'

// Firebase Admin SDK (optionnel — fonctionne en mode demo si absent)
let admin: typeof import('firebase-admin') | null = null
let messaging: import('firebase-admin/messaging').Messaging | null = null

async function initFirebase() {
  if (messaging) return messaging
  try {
    const fa = await import('firebase-admin')
    admin = fa.default
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      })
    }
    const { getMessaging } = await import('firebase-admin/messaging')
    messaging = getMessaging()
    return messaging
  } catch {
    logger.warn('Firebase Admin non configuré — push désactivé')
    return null
  }
}

// ── Types ──

export type NotifType =
  | 'new_sale' | 'new_customer' | 'cart_abandon'
  | 'goal_reached' | 'trending_product' | 'weak_product'
  | 'ai_recommendation' | 'system'

export interface NotifPayload {
  type: NotifType
  title: string
  body: string
  data?: Record<string, string>
  icon?: string
}

// ── Sauvegarde en base ──

export async function saveNotification(
  accountId: string,
  payload: NotifPayload,
  userId?: string
) {
  try {
    await pool.query(
      `INSERT INTO notifications (account_id, user_id, type, title, body, data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT DO NOTHING`,
      [accountId, userId ?? null, payload.type, payload.title, payload.body,
       JSON.stringify(payload.data ?? {})]
    )
  } catch (e) {
    logger.error('saveNotification error', e)
  }
}

// ── Envoi FCM ──

export async function sendPush(token: string, payload: NotifPayload): Promise<boolean> {
  const msg = await initFirebase()
  if (!msg) return false
  try {
    await msg.send({
      token,
      notification: { title: payload.title, body: payload.body },
      data: payload.data ?? {},
      android: {
        priority: 'high',
        notification: {
          icon: 'ic_notification',
          color: '#2563FF',
          channelId: 'pro_digitalix_main',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: { aps: { badge: 1, sound: 'default', contentAvailable: true } },
        headers: { 'apns-priority': '10' },
      },
      webpush: {
        notification: { icon: '/favicon.svg', badge: '/favicon.svg', vibrate: [100, 50, 100] },
        fcmOptions: { link: '/' },
      },
    })
    return true
  } catch (e) {
    logger.error('FCM send error', e)
    return false
  }
}

// ── Envoi à tous les tokens d'un compte ──

export async function notifyAccount(accountId: string, payload: NotifPayload) {
  await saveNotification(accountId, payload)

  // Récupérer tous les tokens FCM enregistrés pour ce compte
  const { rows } = await pool.query<{ fcm_token: string }>(
    `SELECT DISTINCT fcm_token FROM user_fcm_tokens
     WHERE account_id = $1 AND active = true`,
    [accountId]
  )

  const results = await Promise.allSettled(
    rows.map((r) => sendPush(r.fcm_token, payload))
  )
  const sent = results.filter((r): r is PromiseFulfilledResult<boolean> =>
    r.status === 'fulfilled' && r.value
  ).length
  logger.info(`Notified ${sent}/${rows.length} devices for account ${accountId}`)
  return { sent, total: rows.length }
}

// ── Déclencheurs automatiques ──

export const triggers = {
  async newSale(accountId: string, amount: number, product: string) {
    await notifyAccount(accountId, {
      type: 'new_sale',
      title: '🛍️ Nouvelle vente !',
      body: `${product} — ${amount.toLocaleString('fr-FR')} XOF`,
      data: { amount: String(amount), product, action: '/sales' },
    })
  },

  async newCustomer(accountId: string, name: string) {
    await notifyAccount(accountId, {
      type: 'new_customer',
      title: '👤 Nouveau client',
      body: `${name} vient de s'inscrire.`,
      data: { name, action: '/customers' },
    })
  },

  async cartAbandon(accountId: string, count: number, value: number) {
    await notifyAccount(accountId, {
      type: 'cart_abandon',
      title: '🛒 Abandons de panier',
      body: `${count} panier${count > 1 ? 's' : ''} abandonné${count > 1 ? 's' : ''} — ${value.toLocaleString('fr-FR')} XOF perdus`,
      data: { count: String(count), value: String(value), action: '/abandons' },
    })
  },

  async goalReached(accountId: string, goal: string, value: number) {
    await notifyAccount(accountId, {
      type: 'goal_reached',
      title: '🎯 Objectif atteint !',
      body: `${goal} : ${value.toLocaleString('fr-FR')} XOF`,
      data: { goal, value: String(value), action: '/dashboard' },
    })
  },

  async trendingProduct(accountId: string, product: string, growth: number) {
    await notifyAccount(accountId, {
      type: 'trending_product',
      title: '📈 Produit en tendance',
      body: `${product} : +${growth}% de ventes cette semaine`,
      data: { product, growth: String(growth), action: '/products' },
    })
  },

  async weakProduct(accountId: string, product: string) {
    await notifyAccount(accountId, {
      type: 'weak_product',
      title: '⚠️ Produit faible',
      body: `${product} n'a pas été vendu depuis 7 jours.`,
      data: { product, action: '/products' },
    })
  },

  async aiRecommendation(accountId: string, message: string) {
    await notifyAccount(accountId, {
      type: 'ai_recommendation',
      title: '🤖 Recommandation IA',
      body: message,
      data: { action: '/ai' },
    })
  },
}
