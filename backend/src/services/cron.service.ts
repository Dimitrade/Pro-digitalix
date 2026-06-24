import { logger } from '../utils/logger'
import { expireSubscriptions } from './subscription.service'

/**
 * Lance le scheduler interne.
 * Expiration des abonnements : vérification toutes les heures.
 */
export function startCronJobs() {
  logger.info('[cron] Démarrage des tâches planifiées')

  // Exécution immédiate au démarrage
  expireSubscriptions().then(({ expired }) => {
    if (expired > 0) logger.info(`[cron] init: ${expired} abonnement(s) expiré(s)`)
  })

  // Toutes les heures
  setInterval(async () => {
    const { expired } = await expireSubscriptions()
    if (expired > 0) logger.info(`[cron] ${expired} abonnement(s) expiré(s)`)
  }, 60 * 60 * 1000)
}
