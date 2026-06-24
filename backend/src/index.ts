import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

import { authRouter } from './routes/auth.routes'
import { analyticsRouter } from './routes/analytics.routes'
import { chariowRouter } from './routes/chariow.routes'
import { productsRouter } from './routes/products.routes'
import { customersRouter } from './routes/customers.routes'
import { salesRouter } from './routes/sales.routes'
import { aiRouter } from './routes/ai.routes'
import { reportsRouter } from './routes/reports.routes'
import { adminRouter } from './routes/admin.routes'
import { notificationsRouter } from './routes/notifications.routes'
import { subscriptionRouter } from './routes/subscription.routes'
import { ownerRouter } from './routes/owner.routes'
import ownerStatsRouter from './routes/owner.stats.routes'
import supportRouter from './routes/support.routes'
import { promoRouter } from './routes/promo.routes'
import { pixelRouter } from './routes/pixel.routes'
import { errorHandler } from './middleware/error.middleware'
import { logger } from './utils/logger'
import { startCronJobs } from './services/cron.service'
import { startBackupScheduler } from './services/backup.service'
import { startMonitoring } from './services/monitoring.service'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// ── Security ──
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

// ── Rate Limiting ──
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes.' },
  standardHeaders: true, legacyHeaders: false,
})
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives de connexion.' },
})
app.use(globalLimiter)

// ── CORS ──
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-chariow-signature'],
}))

// ── Body Parsing — raw pour webhook avant JSON parse ──
app.use('/api/v1/subscription/webhook', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(compression())

// ── Logging ──
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
  skip: (req) => req.url === '/health',
}))

// ── Health Check ──
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' })
})

// ── Routes API v1 ──
app.use('/api/v1/auth',         authLimiter, authRouter)
app.use('/api/v1/analytics',    analyticsRouter)
app.use('/api/v1/chariow',      chariowRouter)
app.use('/api/v1/products',     productsRouter)
app.use('/api/v1/customers',    customersRouter)
app.use('/api/v1/sales',        salesRouter)
app.use('/api/v1/ai',           aiRouter)
app.use('/api/v1/reports',      reportsRouter)
app.use('/api/v1/admin',        adminRouter)
app.use('/api/v1/notifications',notificationsRouter)
app.use('/api/v1/subscription', subscriptionRouter)
app.use('/api/v1/owner',        ownerRouter)
app.use('/api/v1/owner-stats',  ownerStatsRouter)
app.use('/api/v1/support',      supportRouter)
app.use('/api/v1/promo',        promoRouter)
app.use('/pixel',               pixelRouter)

// ── Error Handler ──
app.use(errorHandler)
app.use((_req, res) => { res.status(404).json({ error: 'Route introuvable' }) })

app.listen(PORT, () => {
  logger.info(`🚀 PRO DIGITALIX API démarrée sur le port ${PORT}`)
  startCronJobs()
  if (process.env.NODE_ENV === 'production') {
    startBackupScheduler()
    startMonitoring()
  }
})

export default app
