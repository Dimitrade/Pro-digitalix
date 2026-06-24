import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { chat, insights, forecasts, report } from '../controllers/ai.controller'

export const aiRouter = Router()

aiRouter.use(authenticate)

aiRouter.post('/chat/:accountId', chat)
aiRouter.get('/insights/:accountId', insights)
aiRouter.get('/forecasts/:accountId', forecasts)
aiRouter.get('/report/:accountId', report)
