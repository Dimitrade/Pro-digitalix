import { Router, Response, NextFunction } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth.middleware'
import * as analyticsService from '../services/analytics.service'
import * as chariowService from '../services/chariow.service'
import * as trackingService from '../services/tracking.service'
import { queryOne } from '../utils/db'
import { AppError } from '../middleware/error.middleware'

export const analyticsRouter = Router()
analyticsRouter.use(authenticate)

function getAccountId(req: AuthRequest): string {
  const id = req.params.accountId || req.query.account_id as string
  if (!id) throw new AppError('account_id requis.', 400, 'MISSING_PARAM')
  return id
}

// GET /analytics/dashboard/:accountId — KPIs principaux
analyticsRouter.get('/dashboard/:accountId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const accountId = getAccountId(req)
    const metrics = await analyticsService.getDashboardMetrics(accountId)
    res.json(metrics)
  } catch (err) { next(err) }
})

// GET /analytics/revenue/:accountId — Tendance revenus
analyticsRouter.get('/revenue/:accountId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const accountId = getAccountId(req)
    const from = (req.query.from as string) || new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0]
    const to = (req.query.to as string) || new Date().toISOString().split('T')[0]
    const data = await analyticsService.getAnalyticsByPeriod(accountId, from, to)
    res.json(data)
  } catch (err) { next(err) }
})

// GET /analytics/visitors/:accountId — Données visiteurs (Chariow live)
analyticsRouter.get('/visitors/:accountId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const accountId = getAccountId(req)
    const from = (req.query.from as string) || new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0]
    const to = (req.query.to as string) || new Date().toISOString().split('T')[0]
    const data = await chariowService.getLiveAnalytics(accountId, req.user!.id, from, to)
    res.json(data.visits)
  } catch (err) { next(err) }
})

// GET /analytics/live/:accountId — Données live Chariow (store KPIs)
analyticsRouter.get('/live/:accountId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const accountId = getAccountId(req)
    const from = (req.query.from as string) || new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0]
    const to = (req.query.to as string) || new Date().toISOString().split('T')[0]
    const data = await chariowService.getLiveAnalytics(accountId, req.user!.id, from, to)
    res.json(data)
  } catch (err) { next(err) }
})

// GET /analytics/pixel/:accountId — Stats pixel tracking
analyticsRouter.get('/pixel/:accountId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const accountId = getAccountId(req)
    const from = (req.query.from as string) || new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0]
    const to = (req.query.to as string) || new Date().toISOString().split('T')[0]
    const data = await trackingService.getPixelStats(accountId, from, to)
    res.json(data)
  } catch (err) { next(err) }
})
