import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requireOwner } from '../middleware/roles.middleware'
import {
  grantPremium, revokePremium, extendPremium,
  suspendUser, reactivateUser,
  listUsers, getUserProfile,
  platformStats, getAuditLogs,
  listPromos, createPromo, updatePromo, disablePromo,
} from '../controllers/owner.controller'
import { applyPromo } from '../controllers/owner.controller'

export const ownerRouter = Router()

// Toutes les routes OWNER exigent authentification + rôle owner
ownerRouter.use(authenticate, requireOwner)

// ── Utilisateurs ──
ownerRouter.get('/users',                  listUsers)
ownerRouter.get('/users/:userId',          getUserProfile)
ownerRouter.post('/users/:userId/grant',   grantPremium)
ownerRouter.post('/users/:userId/revoke',  revokePremium)
ownerRouter.post('/users/:userId/extend',  extendPremium)
ownerRouter.post('/users/:userId/suspend', suspendUser)
ownerRouter.post('/users/:userId/reactivate', reactivateUser)

// ── Stats ──
ownerRouter.get('/stats', platformStats)

// ── Audit ──
ownerRouter.get('/audit', getAuditLogs)

// ── Promotions ──
ownerRouter.get('/promos',           listPromos)
ownerRouter.post('/promos',          createPromo)
ownerRouter.patch('/promos/:promoId',updatePromo)
ownerRouter.delete('/promos/:promoId', disablePromo)

// ── Appliquer code promo (utilisateur connecté, pas owner-only) ──
// Monté séparément dans index.ts via /api/v1/promo/apply
export { applyPromo }
