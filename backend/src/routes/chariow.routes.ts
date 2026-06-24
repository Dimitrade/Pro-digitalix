import { Router, Request, Response, NextFunction } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth.middleware'
import { z } from 'zod'
import { AppError } from '../middleware/error.middleware'
import * as chariowService from '../services/chariow.service'
import { query, queryOne } from '../utils/db'

export const chariowRouter = Router()
chariowRouter.use(authenticate)

// POST /connect — Connecter une boutique Chariow
chariowRouter.post('/connect', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { api_key } = z.object({ api_key: z.string().min(10) }).parse(req.body)
    const result = await chariowService.connectChariowAccount(req.user!.id, api_key)
    res.status(201).json({ message: 'Boutique connectée avec succès.', ...result })
  } catch (err) { next(err) }
})

// GET /accounts — Lister les comptes connectés
chariowRouter.get('/accounts', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const accounts = await query(
      `SELECT id, store_name, store_slug, store_url, currency, is_active,
              sync_status, last_sync_at, created_at
       FROM chariow_accounts WHERE user_id=$1 ORDER BY created_at DESC`,
      [req.user!.id]
    )
    res.json({ accounts })
  } catch (err) { next(err) }
})

// DELETE /accounts/:id — Déconnecter une boutique
chariowRouter.delete('/accounts/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const account = await queryOne<{ user_id: string }>(
      'SELECT user_id FROM chariow_accounts WHERE id=$1',
      [req.params.id]
    )
    if (!account || account.user_id !== req.user!.id) throw new AppError('Introuvable.', 404, 'NOT_FOUND')
    await query('UPDATE chariow_accounts SET is_active=false WHERE id=$1', [req.params.id])
    res.json({ message: 'Boutique déconnectée.' })
  } catch (err) { next(err) }
})

// POST /sync/:accountId — Synchronisation manuelle
chariowRouter.post('/sync/:accountId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await chariowService.syncAccount(req.params.accountId, req.user!.id)
    res.json({ message: 'Synchronisation terminée.', ...result })
  } catch (err) { next(err) }
})

// GET /store/:accountId — Infos store live
chariowRouter.get('/store/:accountId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await chariowService.getStoreInfo(req.params.accountId, req.user!.id)
    res.json(data)
  } catch (err) { next(err) }
})

// GET /pixel-script/:accountId — Snippet pixel JS
chariowRouter.get('/pixel-script/:accountId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const account = await queryOne<{ store_slug: string; user_id: string }>(
      'SELECT store_slug, user_id FROM chariow_accounts WHERE id=$1',
      [req.params.accountId]
    )
    if (!account || account.user_id !== req.user!.id) throw new AppError('Introuvable.', 404, 'NOT_FOUND')
    const { generatePixelScript } = await import('../services/tracking.service')
    const script = generatePixelScript(account.store_slug, process.env.BACKEND_URL || 'http://localhost:4000/api/v1')
    res.json({ pixel_id: account.store_slug, script })
  } catch (err) { next(err) }
})
