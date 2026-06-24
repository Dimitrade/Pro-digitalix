import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth.middleware'

/** Accès OWNER uniquement — jamais exposé aux autres rôles */
export function requireOwner(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'owner') {
    return res.status(403).json({ error: 'Accès refusé.' })
  }
  next()
}

/** Accès ADMIN ou OWNER */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const role = req.user?.role
  if (role !== 'admin' && role !== 'owner') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs.' })
  }
  next()
}

/**
 * Accès Premium — le compte OWNER passe toujours.
 * Les utilisateurs dont premium=false ou dont l'abonnement est expiré sont bloqués.
 */
export function requirePremium(req: AuthRequest, res: Response, next: NextFunction) {
  const u = req.user
  if (!u) return res.status(401).json({ error: 'Non authentifié.' })
  // OWNER : accès inconditionnel
  if (u.role === 'owner') return next()
  // Vérification premium actif
  if (!u.premium) {
    return res.status(402).json({
      error: 'Fonctionnalité réservée au plan PREMIUM.',
      upgrade_url: 'https://anabokgroup.online/prd_y2htjbxf/checkout',
      plan_required: 'premium',
    })
  }
  next()
}
