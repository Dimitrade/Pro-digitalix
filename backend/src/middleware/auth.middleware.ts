import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './error.middleware'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    premium: boolean
    premium_ends?: string | null
  }
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return next(new AppError('Token manquant', 401, 'UNAUTHORIZED'))

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string; email: string; role: string; premium?: boolean; premium_ends?: string | null
    }
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      premium: payload.premium ?? false,
      premium_ends: payload.premium_ends ?? null,
    }
    next()
  } catch {
    next(new AppError('Token invalide ou expiré', 401, 'TOKEN_INVALID'))
  }
}

/** @deprecated utiliser requireAdmin de roles.middleware */
export function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!req.user || !['admin', 'owner'].includes(req.user.role)) {
    return next(new AppError('Accès refusé', 403, 'FORBIDDEN'))
  }
  next()
}
