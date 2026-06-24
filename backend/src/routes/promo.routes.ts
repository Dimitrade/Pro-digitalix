import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { applyPromo } from '../controllers/owner.controller'

export const promoRouter = Router()
promoRouter.post('/apply', authenticate, applyPromo)
