import { logger } from '../utils/logger'
import { query, queryOne } from '../utils/db'

// ── Types ────────────────────────────────────────────────────────────────────

interface Alert {
  level: 'info' | 'warning' | 'critical'
  title: string
  message: string
  data?: Record<string, unknown>
}

// ── Envoi alerte (console + webhook optionnel) ────────────────────────────────

async function sendAlert(alert: Alert) {
  const emoji = alert.level === 'critical' ? '🔴' : alert.level === 'warning' ? '🟡' : '🟢'
  logger.warn(`[monitor] ${emoji} [${alert.level.toUpperCase()}] ${alert.title}: ${alert.message}`)

  const webhookUrl = process.env.MONITORING_WEBHOOK_URL
  if (webhookUrl) {
    try {
      const { default: axios } = await import('axios')
      await axios.post(webhookUrl, {
        text: `${emoji} *PRO DIGITALIX — ${alert.title}*\n${alert.message}`,
        attachments: alert.data ? [{ text: JSON.stringify(alert.data, null, 2) }] : [],
      })
    } catch { /* silencieux */ }
  }
}

// ── Monitoring paiements Chariow ─────────────────────────────────────────────

export async function monitorPayments() {
  try {
    // Paiements en attente depuis plus de 30 min
    const stale = await query<{ id: string; transaction_id: string; created_at: string }>(
      `SELECT id, transaction_id, created_at FROM payments
       WHERE status = 'pending' AND created_at < NOW() - interval '30 minutes'
       ORDER BY created_at DESC LIMIT 10`
    )

    if (stale.length > 0) {
      await sendAlert({
        level: 'warning',
        title: 'Paiements en attente',
        message: `${stale.length} paiement(s) en attente depuis plus de 30 min`,
        data: { transactions: stale.map(p => p.transaction_id) },
      })
    }

    // Pic de paiements (> 10 en 5 min = potentiel flood)
    const recentCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM payments WHERE created_at > NOW() - interval '5 minutes'`
    )
    if (Number(recentCount?.count ?? 0) > 10) {
      await sendAlert({
        level: 'critical',
        title: 'Pic de paiements détecté',
        message: `${recentCount?.count} paiements en 5 minutes — vérifier le webhook Chariow`,
      })
    }
  } catch (e) {
    logger.error('[monitor] monitorPayments error', e)
  }
}

// ── Monitoring webhook Chariow ───────────────────────────────────────────────

export async function monitorWebhook() {
  try {
    // Dernière réception webhook
    const last = await queryOne<{ created_at: string }>(
      `SELECT created_at FROM payments ORDER BY created_at DESC LIMIT 1`
    )

    if (last) {
      const lastMs = new Date(last.created_at).getTime()
      const hoursSince = (Date.now() - lastMs) / 3600000

      // Alerte si pas de webhook depuis 48h (hors période creuse normale)
      const hour = new Date().getUTCHours()
      if (hoursSince > 48 && hour >= 8 && hour <= 22) {
        await sendAlert({
          level: 'warning',
          title: 'Webhook Chariow silencieux',
          message: `Aucun webhook reçu depuis ${Math.round(hoursSince)}h — vérifier la configuration`,
        })
      }
    }

    // Taux d'échec webhook
    const stats = await queryOne<{ total: string; failed: string }>(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'failed') AS failed
       FROM payments WHERE created_at > NOW() - interval '24 hours'`
    )

    if (stats && Number(stats.total) > 0) {
      const failRate = (Number(stats.failed) / Number(stats.total)) * 100
      if (failRate > 20) {
        await sendAlert({
          level: 'critical',
          title: 'Taux d\'échec webhook élevé',
          message: `${failRate.toFixed(1)}% d'échecs sur les 24 dernières heures`,
          data: { total: stats.total, failed: stats.failed },
        })
      }
    }
  } catch (e) {
    logger.error('[monitor] monitorWebhook error', e)
  }
}

// ── Monitoring santé application ─────────────────────────────────────────────

export async function monitorAppHealth() {
  try {
    // Connexions DB actives
    const dbStats = await queryOne<{ active: string; max: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE state = 'active') AS active,
         setting::int AS max
       FROM pg_stat_activity, pg_settings WHERE name = 'max_connections'
       GROUP BY setting`
    )

    if (dbStats && (Number(dbStats.active) / Number(dbStats.max)) > 0.8) {
      await sendAlert({
        level: 'warning',
        title: 'Connexions DB proches du maximum',
        message: `${dbStats.active}/${dbStats.max} connexions actives`,
      })
    }

    // Comptes expirés non traités
    const expired = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM users
       WHERE premium = true AND premium_ends < NOW() AND role != 'owner'`
    )
    if (Number(expired?.count ?? 0) > 0) {
      logger.warn(`[monitor] ${expired?.count} abonnement(s) expirés non traités par le cron`)
    }
  } catch (e) {
    logger.error('[monitor] monitorAppHealth error', e)
  }
}

// ── Démarrer le monitoring ───────────────────────────────────────────────────

export function startMonitoring() {
  logger.info('[monitor] Démarrage du monitoring')

  // Paiements — toutes les 10 min
  setInterval(monitorPayments, 10 * 60 * 1000)
  // Webhook — toutes les heures
  setInterval(monitorWebhook, 60 * 60 * 1000)
  // Santé app — toutes les 5 min
  setInterval(monitorAppHealth, 5 * 60 * 1000)

  // Premier passage immédiat
  setTimeout(() => {
    monitorPayments()
    monitorWebhook()
    monitorAppHealth()
  }, 30_000)
}
