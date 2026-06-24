import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as authService from '../services/auth.service'
import { AuthRequest } from '../middleware/auth.middleware'
import { AppError } from '../middleware/error.middleware'

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères').max(100),
  full_name: z.string().min(2, 'Nom trop court').max(100),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, 'Minimum 8 caractères')
    .regex(/[A-Z]/, 'Une majuscule requise')
    .regex(/[0-9]/, 'Un chiffre requis'),
})

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body)
    const result = await authService.registerUser(data)
    res.status(201).json({
      message: 'Inscription réussie. Vérifiez votre email.',
      user: result.user,
      token: result.token,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.errors[0].message, 400, 'VALIDATION_ERROR'))
    }
    next(err)
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const result = await authService.loginUser(email, password)
    res.json({ user: result.user, token: result.token })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError('Email ou mot de passe invalide.', 400, 'VALIDATION_ERROR'))
    }
    next(err)
  }
}

export async function oauthCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const { provider, provider_id, email, full_name, avatar_url, access_token } = req.body

    if (!['google', 'facebook'].includes(provider)) {
      throw new AppError('Fournisseur OAuth non supporté.', 400, 'INVALID_PROVIDER')
    }

    const result = await authService.upsertOAuthUser({
      provider,
      provider_id,
      email,
      full_name,
      avatar_url,
      access_token,
    })

    res.json({
      user: result.user,
      token: result.token,
      isNew: result.isNew,
    })
  } catch (err) {
    next(err)
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.query as { token: string }
    if (!token) throw new AppError('Token manquant.', 400, 'MISSING_TOKEN')
    await authService.verifyEmail(token)
    res.json({ message: 'Email vérifié avec succès !' })
  } catch (err) {
    next(err)
  }
}

export async function resendVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body
    if (!email) throw new AppError('Email requis.', 400, 'VALIDATION_ERROR')
    await authService.resendVerification(email)
    res.json({ message: 'Email de vérification envoyé.' })
  } catch (err) {
    next(err)
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body
    if (!email) throw new AppError('Email requis.', 400, 'VALIDATION_ERROR')
    await authService.requestPasswordReset(email)
    // Toujours retourner 200 pour ne pas révéler si l'email existe
    res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' })
  } catch (err) {
    next(err)
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.query as { token: string }
    const { password } = passwordSchema.parse(req.body)
    if (!token) throw new AppError('Token manquant.', 400, 'MISSING_TOKEN')
    await authService.resetPassword(token, password)
    res.json({ message: 'Mot de passe mis à jour avec succès.' })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.errors[0].message, 400, 'VALIDATION_ERROR'))
    }
    next(err)
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await authService.getUserById(req.user!.id)
    if (!user) throw new AppError('Utilisateur introuvable.', 404, 'NOT_FOUND')
    res.json({ user })
  } catch (err) {
    next(err)
  }
}
