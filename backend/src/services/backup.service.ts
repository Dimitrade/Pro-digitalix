import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { logger } from '../utils/logger'

const execAsync = promisify(exec)

const BACKUP_DIR = process.env.BACKUP_DIR || '/opt/backups/prodigitalix'
const DATABASE_URL = process.env.DATABASE_URL || ''
const MAX_BACKUPS = 30 // 30 jours de rétention

// ── Dump PostgreSQL ──────────────────────────────────────────────────────────
export async function backupDatabase(): Promise<string | null> {
  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true })

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `prodigitalix-db-${ts}.sql.gz`
    const filepath = path.join(BACKUP_DIR, filename)

    // pg_dump via DATABASE_URL + compression gzip
    await execAsync(
      `pg_dump "${DATABASE_URL}" | gzip > "${filepath}"`,
      { env: { ...process.env, PGPASSWORD: '' } }
    )

    const stat = fs.statSync(filepath)
    const sizeMB = (stat.size / 1024 / 1024).toFixed(2)
    logger.info(`[backup] Sauvegarde créée : ${filename} (${sizeMB} MB)`)

    // Nettoyage — garder seulement MAX_BACKUPS fichiers
    await pruneOldBackups()

    return filepath
  } catch (e) {
    logger.error('[backup] Erreur sauvegarde base de données', e)
    return null
  }
}

async function pruneOldBackups() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql.gz'))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

  if (files.length > MAX_BACKUPS) {
    const toDelete = files.slice(MAX_BACKUPS)
    for (const f of toDelete) {
      fs.unlinkSync(path.join(BACKUP_DIR, f.name))
      logger.info(`[backup] Supprimé : ${f.name}`)
    }
  }
}

// ── Démarrer le scheduler de backup ─────────────────────────────────────────
export function startBackupScheduler() {
  // Backup quotidien à 3h du matin (UTC)
  const scheduleNextBackup = () => {
    const now = new Date()
    const next3am = new Date(now)
    next3am.setUTCHours(3, 0, 0, 0)
    if (next3am <= now) next3am.setUTCDate(next3am.getUTCDate() + 1)

    const delay = next3am.getTime() - now.getTime()
    logger.info(`[backup] Prochaine sauvegarde dans ${Math.round(delay / 3600000)}h`)

    setTimeout(async () => {
      await backupDatabase()
      scheduleNextBackup() // Replanifier
    }, delay)
  }

  scheduleNextBackup()
  logger.info('[backup] Scheduler de sauvegarde démarré')
}
