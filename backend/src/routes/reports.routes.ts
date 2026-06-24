import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { generate, list } from '../controllers/report.controller'

export const reportsRouter = Router()

reportsRouter.use(authenticate)
reportsRouter.post('/:accountId', generate)
reportsRouter.get('/:accountId', list)
