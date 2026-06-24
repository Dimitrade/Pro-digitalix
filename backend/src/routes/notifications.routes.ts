import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import {
  registerToken, removeToken, list, markRead, archive,
  testPush, getPreferences, savePreferences,
} from '../controllers/notification.controller'

export const notificationsRouter = Router()
notificationsRouter.use(authenticate)

notificationsRouter.post('/token/:accountId',     registerToken)
notificationsRouter.delete('/token/:accountId',   removeToken)
notificationsRouter.get('/preferences',           getPreferences)
notificationsRouter.put('/preferences',           savePreferences)
notificationsRouter.post('/test/:accountId',      testPush)
notificationsRouter.get('/:accountId',            list)
notificationsRouter.patch('/:accountId/:notifId', markRead)
notificationsRouter.delete('/:accountId/:notifId',archive)
