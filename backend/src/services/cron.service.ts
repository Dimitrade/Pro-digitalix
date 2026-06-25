import axios from 'axios'
import { logger } from '../utils/logger'
import { expireSubscriptions } from './subscription.service'

export function startCronJobs() {
  logger.info('[cron] Démarrage des tâches planifiées')

  expireSubscriptions().then(({ expired }) => {
    if (expired > 0) logger.info(`[cron] init: ${expired} abonnement(s) expiré(s)`)
  })

  // Expiration abonnements — toutes les heures
  setInterval(async () => {
    const { expired } = await expireSubscriptions()
    if (expired > 0) logger.info(`[cron] ${expired} abonnement(s) expiré(s)`)
  }, 60 * 60 * 1000)

  // Keep-alive Render free tier — ping toutes les 10 min pour éviter le sleep
  if (process.env.NODE_ENV === 'production') {
    const selfUrl = process.env.RENDER_EXTERNAL_URL || 'https://pro-digitalix-backend.onrender.com'
    setInterval(async () => {
      try {
        await axios.get(`${selfUrl}/health`, { timeout: 5000 })
        logger.info('[cron] keep-alive ping OK')
      } catch {
        // silence — le service se réveille de lui-même
      }
    }, 10 * 60 * 1000)
  }
}
