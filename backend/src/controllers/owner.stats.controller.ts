import { Request, Response } from 'express'
import { query, queryOne } from '../utils/db'
import { logger } from '../utils/logger'

// ── Tableau de bord SaaS complet ─────────────────────────────────────────────
export async function saasMetrics(_req: Request, res: Response) {
  try {
    const [
      users,
      premium,
      revenueToday,
      revenueMonth,
      revenueYear,
      newUsersToday,
      newUsersMonth,
      expiringSoon,
      topCountries,
      revenueByMonth,
      conversionByMonth,
    ] = await Promise.all([
      // Total utilisateurs actifs
      queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count FROM users WHERE role != 'owner' AND is_active = true`
      ),
      // Utilisateurs premium actifs
      queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count FROM users WHERE premium = true AND role != 'owner' AND (premium_ends > NOW() OR premium_ends IS NULL)`
      ),
      // Revenus aujourd'hui (FCFA)
      queryOne<{ total: string }>(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'completed' AND confirmed_at >= CURRENT_DATE`
      ),
      // Revenus ce mois
      queryOne<{ total: string }>(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'completed' AND DATE_TRUNC('month', confirmed_at) = DATE_TRUNC('month', NOW())`
      ),
      // Revenus cette année
      queryOne<{ total: string }>(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'completed' AND DATE_TRUNC('year', confirmed_at) = DATE_TRUNC('year', NOW())`
      ),
      // Nouveaux utilisateurs aujourd'hui
      queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count FROM users WHERE created_at >= CURRENT_DATE AND role != 'owner'`
      ),
      // Nouveaux utilisateurs ce mois
      queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count FROM users WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()) AND role != 'owner'`
      ),
      // Abonnements expirant dans 30 jours
      query<{ id: string; email: string; full_name: string; premium_ends: string }>(
        `SELECT id, email, full_name, premium_ends FROM users
         WHERE premium = true AND role != 'owner'
           AND premium_ends BETWEEN NOW() AND NOW() + interval '30 days'
         ORDER BY premium_ends ASC LIMIT 20`
      ),
      // Top pays (par nombre d'utilisateurs)
      query<{ country: string; count: string; premium_count: string }>(
        `SELECT
           COALESCE(country, 'Inconnu') AS country,
           COUNT(*) AS count,
           COUNT(*) FILTER (WHERE premium = true) AS premium_count
         FROM users WHERE role != 'owner'
         GROUP BY country ORDER BY count DESC LIMIT 10`
      ),
      // Revenus par mois (12 derniers mois)
      query<{ month: string; revenue: string; payments: string }>(
        `SELECT
           TO_CHAR(DATE_TRUNC('month', confirmed_at), 'YYYY-MM') AS month,
           COALESCE(SUM(amount), 0) AS revenue,
           COUNT(*) AS payments
         FROM payments WHERE status = 'completed' AND confirmed_at >= NOW() - interval '12 months'
         GROUP BY DATE_TRUNC('month', confirmed_at)
         ORDER BY month ASC`
      ),
      // Taux de conversion par mois
      query<{ month: string; total: string; converted: string }>(
        `SELECT
           TO_CHAR(DATE_TRUNC('month', u.created_at), 'YYYY-MM') AS month,
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE u.premium = true) AS converted
         FROM users u WHERE u.role != 'owner' AND u.created_at >= NOW() - interval '12 months'
         GROUP BY DATE_TRUNC('month', u.created_at)
         ORDER BY month ASC`
      ),
    ])

    const totalUsers = Number(users?.count ?? 0)
    const totalPremium = Number(premium?.count ?? 0)
    const conversionRate = totalUsers > 0 ? ((totalPremium / totalUsers) * 100).toFixed(1) : '0'

    res.json({
      users: {
        total: totalUsers,
        premium: totalPremium,
        free: totalUsers - totalPremium,
        newToday: Number(newUsersToday?.count ?? 0),
        newThisMonth: Number(newUsersMonth?.count ?? 0),
        conversionRate: Number(conversionRate),
      },
      revenue: {
        today: Number(revenueToday?.total ?? 0),
        month: Number(revenueMonth?.total ?? 0),
        year: Number(revenueYear?.total ?? 0),
        byMonth: revenueByMonth.map(r => ({
          month: r.month,
          revenue: Number(r.revenue),
          payments: Number(r.payments),
        })),
      },
      subscriptions: {
        expiringSoon: expiringSoon,
        conversionByMonth: conversionByMonth.map(c => ({
          month: c.month,
          total: Number(c.total),
          converted: Number(c.converted),
          rate: Number(c.total) > 0 ? ((Number(c.converted) / Number(c.total)) * 100).toFixed(1) : '0',
        })),
      },
      topCountries,
    })
  } catch (e) {
    logger.error('[owner.stats] saasMetrics error', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ── Monitoring Chariow ────────────────────────────────────────────────────────
export async function chariowMonitoring(_req: Request, res: Response) {
  try {
    const [paymentsStats, recentWebhooks, accountStats] = await Promise.all([
      queryOne<{ total: string; completed: string; failed: string; pending: string }>(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status = 'completed') AS completed,
           COUNT(*) FILTER (WHERE status = 'failed') AS failed,
           COUNT(*) FILTER (WHERE status = 'pending') AS pending
         FROM payments WHERE created_at >= NOW() - interval '30 days'`
      ),
      query<{ id: string; status: string; amount: number; created_at: string; transaction_id: string }>(
        `SELECT id, status, amount, created_at, transaction_id
         FROM payments ORDER BY created_at DESC LIMIT 20`
      ),
      queryOne<{ total: string; active: string; last_sync: string }>(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status = 'active') AS active,
           MAX(last_sync_at)::text AS last_sync
         FROM chariow_accounts`
      ),
    ])

    const total = Number(paymentsStats?.total ?? 0)
    const completed = Number(paymentsStats?.completed ?? 0)
    const failed = Number(paymentsStats?.failed ?? 0)
    const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '100'

    res.json({
      payments: {
        total,
        completed,
        failed,
        pending: Number(paymentsStats?.pending ?? 0),
        successRate: Number(successRate),
      },
      webhook: {
        received: total,
        rejected: failed,
        lastSync: accountStats?.last_sync ?? null,
      },
      accounts: {
        total: Number(accountStats?.total ?? 0),
        active: Number(accountStats?.active ?? 0),
      },
      recentWebhooks,
    })
  } catch (e) {
    logger.error('[owner.stats] chariowMonitoring error', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ── Monitoring système ────────────────────────────────────────────────────────
export async function systemHealth(req: Request, res: Response) {
  const checks: Record<string, { status: 'ok' | 'error' | 'degraded'; latency?: number; detail?: string }> = {}

  // 1. Base de données
  const dbStart = Date.now()
  try {
    await queryOne('SELECT 1')
    checks.database = { status: 'ok', latency: Date.now() - dbStart }
  } catch {
    checks.database = { status: 'error', detail: 'Connexion DB échouée' }
  }

  // 2. API Chariow (ping endpoint)
  const chariowStart = Date.now()
  try {
    const res2 = await fetch('https://api.chariow.com/ping', { signal: AbortSignal.timeout(5000) })
    checks.chariow = {
      status: res2.ok ? 'ok' : 'degraded',
      latency: Date.now() - chariowStart,
      detail: res2.ok ? undefined : `HTTP ${res2.status}`,
    }
  } catch {
    checks.chariow = { status: 'degraded', detail: 'API Chariow injoignable' }
  }

  // 3. Firebase (admin SDK) — check via env vars
  const firebaseConfigured = !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL)
  checks.notifications = {
    status: firebaseConfigured ? 'ok' : 'degraded',
    detail: firebaseConfigured ? undefined : 'Firebase non configuré (variables manquantes)',
  }

  // 4. OpenAI
  checks.ai = {
    status: process.env.OPENAI_API_KEY ? 'ok' : 'degraded',
    detail: process.env.OPENAI_API_KEY ? undefined : 'Clé API manquante',
  }

  // 5. Mémoire et uptime serveur
  const mem = process.memoryUsage()
  checks.server = {
    status: 'ok',
    detail: `RAM: ${Math.round(mem.heapUsed / 1024 / 1024)}MB / ${Math.round(mem.heapTotal / 1024 / 1024)}MB | Uptime: ${Math.round(process.uptime() / 3600)}h`,
  }

  const allOk = Object.values(checks).every(c => c.status === 'ok')
  const hasError = Object.values(checks).some(c => c.status === 'error')

  res.status(allOk ? 200 : hasError ? 503 : 200).json({
    status: allOk ? 'healthy' : hasError ? 'unhealthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  })
}

// ── Liste sauvegardes ─────────────────────────────────────────────────────────
export async function listBackups(_req: Request, res: Response) {
  try {
    const fs = await import('fs')
    const path = await import('path')
    const dir = process.env.BACKUP_DIR || '/opt/backups/prodigitalix'

    if (!fs.existsSync(dir)) return res.json({ backups: [] })

    const files = fs.readdirSync(dir)
      .filter((f: string) => f.endsWith('.sql.gz'))
      .map((f: string) => {
        const stat = fs.statSync(path.join(dir, f))
        return {
          name: f,
          size: stat.size,
          sizeMB: (stat.size / 1024 / 1024).toFixed(2),
          createdAt: stat.mtime.toISOString(),
        }
      })
      .sort((a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt))

    res.json({ backups: files, directory: dir })
  } catch (e) {
    res.status(500).json({ error: 'Impossible de lister les sauvegardes' })
  }
}

// ── Déclencher une sauvegarde manuelle ───────────────────────────────────────
export async function triggerBackup(_req: Request, res: Response) {
  try {
    const { backupDatabase } = await import('../services/backup.service')
    const path = await backupDatabase()
    if (path) {
      res.json({ success: true, file: path })
    } else {
      res.status(500).json({ error: 'Sauvegarde échouée' })
    }
  } catch (e) {
    res.status(500).json({ error: 'Erreur lors de la sauvegarde' })
  }
}

// ── Rapport support ───────────────────────────────────────────────────────────
export async function getSupportTickets(_req: Request, res: Response) {
  try {
    const tickets = await query<{
      id: string; user_id: string; email: string; full_name: string
      subject: string; status: string; created_at: string
    }>(
      `SELECT al.id, al.target_user_id AS user_id, al.target_email AS email,
              u.full_name, al.action AS subject, al.details->>'status' AS status, al.created_at
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.target_user_id
       WHERE al.action LIKE 'support_%'
       ORDER BY al.created_at DESC LIMIT 50`
    )
    res.json({ tickets })
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
