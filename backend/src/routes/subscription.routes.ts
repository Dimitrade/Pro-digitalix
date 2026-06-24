import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requireOwner, requireAdmin } from '../middleware/roles.middleware'
import {
  getSubscription, getPayments, chariowWebhook,
  platformStats, listUsers, updateUser,
} from '../controllers/subscription.controller'

export const subscriptionRouter = Router()

// Routes utilisateur authentifié
subscriptionRouter.get('/me',       authenticate, getSubscription)
subscriptionRouter.get('/payments', authenticate, getPayments)

// Webhook public (vérification par signature interne)
subscriptionRouter.post('/webhook/chariow', chariowWebhook)

// Routes OWNER uniquement
subscriptionRouter.get('/owner/stats',          authenticate, requireOwner, platformStats)
subscriptionRouter.get('/owner/users',          authenticate, requireOwner, listUsers)
subscriptionRouter.patch('/owner/users/:userId',authenticate, requireOwner, updateUser)

// Routes ADMIN
subscriptionRouter.get('/admin/users',           authenticate, requireAdmin, listUsers)
subscriptionRouter.patch('/admin/users/:userId', authenticate, requireAdmin, updateUser)
