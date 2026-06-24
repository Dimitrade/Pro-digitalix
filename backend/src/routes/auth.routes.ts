import { Router } from 'express'
import {
  register,
  login,
  oauthCallback,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  me,
} from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth.middleware'

export const authRouter = Router()

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.post('/oauth/callback', oauthCallback)

authRouter.get('/verify-email', verifyEmail)
authRouter.post('/resend-verification', resendVerification)

authRouter.post('/forgot-password', forgotPassword)
authRouter.post('/reset-password', resetPassword)

authRouter.get('/me', authenticate, me)
