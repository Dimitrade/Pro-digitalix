import jwt from 'jsonwebtoken'
import { query, queryOne } from '../utils/db'
import { hashPassword, comparePassword, generateToken, hashToken } from '../utils/crypto'
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from './email.service'
import { AppError } from '../middleware/error.middleware'

const JWT_SECRET = process.env.JWT_SECRET || 'changeme'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: string
  plan: string
  is_active: boolean
  is_verified: boolean
  created_at: string
}

export interface TokenPayload {
  id: string
  email: string
  role: string
  premium?: boolean
  premium_ends?: string | null
}

function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

// ── Inscription ──────────────────────────────────────────────

export async function registerUser(data: {
  email: string
  password: string
  full_name: string
}): Promise<{ user: User; token: string }> {
  const existing = await queryOne<User>(
    'SELECT id FROM users WHERE email = $1',
    [data.email.toLowerCase()]
  )
  if (existing) throw new AppError('Cet email est déjà utilisé.', 409, 'EMAIL_EXISTS')

  const password_hash = await hashPassword(data.password)

  const [user] = await query<User>(
    `INSERT INTO users (email, password_hash, full_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, full_name, avatar_url, role, plan, is_active, is_verified, created_at`,
    [data.email.toLowerCase(), password_hash, data.full_name]
  )

  const verifyToken = generateToken()
  const tokenHash = hashToken(verifyToken)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await query(
    `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt]
  )

  await sendVerificationEmail(user.email, verifyToken, user.full_name)

  const token = signToken({ id: user.id, email: user.email, role: user.role, premium: (user as unknown as { premium?: boolean }).premium ?? false })
  return { user, token }
}

// ── Connexion Email/Mot de passe ─────────────────────────────

export async function loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
  const user = await queryOne<User & { password_hash: string }>(
    `SELECT id, email, full_name, avatar_url, role, plan, is_active, is_verified, created_at, password_hash
     FROM users WHERE email = $1`,
    [email.toLowerCase()]
  )

  if (!user) throw new AppError('Email ou mot de passe incorrect.', 401, 'INVALID_CREDENTIALS')
  if (!user.is_active) throw new AppError('Compte désactivé. Contactez le support.', 403, 'ACCOUNT_DISABLED')
  if (!user.password_hash) throw new AppError('Utilisez Google ou Facebook pour vous connecter.', 400, 'OAUTH_ONLY')

  const valid = await comparePassword(password, user.password_hash)
  if (!valid) throw new AppError('Email ou mot de passe incorrect.', 401, 'INVALID_CREDENTIALS')

  const token = signToken({ id: user.id, email: user.email, role: user.role, premium: (user as unknown as { premium?: boolean }).premium ?? false })
  const { password_hash: _, ...safeUser } = user
  return { user: safeUser as User, token }
}

// ── OAuth (Google / Facebook) ────────────────────────────────

export async function upsertOAuthUser(data: {
  provider: 'google' | 'facebook'
  provider_id: string
  email: string
  full_name: string
  avatar_url?: string
  access_token?: string
}): Promise<{ user: User; token: string; isNew: boolean }> {
  // Vérifier si le compte OAuth existe déjà
  const existingOAuth = await queryOne<{ user_id: string }>(
    'SELECT user_id FROM oauth_accounts WHERE provider = $1 AND provider_id = $2',
    [data.provider, data.provider_id]
  )

  let user: User
  let isNew = false

  if (existingOAuth) {
    user = await queryOne<User>(
      `SELECT id, email, full_name, avatar_url, role, plan, is_active, is_verified, created_at
       FROM users WHERE id = $1`,
      [existingOAuth.user_id]
    ) as User
  } else {
    // Chercher un user existant avec ce email
    let existingUser = await queryOne<User>(
      `SELECT id, email, full_name, avatar_url, role, plan, is_active, is_verified, created_at
       FROM users WHERE email = $1`,
      [data.email.toLowerCase()]
    )

    if (!existingUser) {
      // Créer le user
      const [newUser] = await query<User>(
        `INSERT INTO users (email, full_name, avatar_url, is_verified)
         VALUES ($1, $2, $3, true)
         RETURNING id, email, full_name, avatar_url, role, plan, is_active, is_verified, created_at`,
        [data.email.toLowerCase(), data.full_name, data.avatar_url ?? null]
      )
      existingUser = newUser
      isNew = true
    }

    // Lier le compte OAuth
    await query(
      `INSERT INTO oauth_accounts (user_id, provider, provider_id, access_token)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (provider, provider_id) DO UPDATE SET access_token = $4`,
      [existingUser.id, data.provider, data.provider_id, data.access_token ?? null]
    )

    user = existingUser
  }

  if (!user.is_active) throw new AppError('Compte désactivé.', 403, 'ACCOUNT_DISABLED')

  const token = signToken({ id: user.id, email: user.email, role: user.role, premium: (user as unknown as { premium?: boolean }).premium ?? false })
  return { user, token, isNew }
}

// ── Vérification Email ───────────────────────────────────────

export async function verifyEmail(token: string): Promise<void> {
  const tokenHash = hashToken(token)

  const record = await queryOne<{ user_id: string; expires_at: string; used: boolean }>(
    'SELECT user_id, expires_at, used FROM email_verification_tokens WHERE token_hash = $1',
    [tokenHash]
  )

  if (!record) throw new AppError('Lien de vérification invalide.', 400, 'INVALID_TOKEN')
  if (record.used) throw new AppError('Ce lien a déjà été utilisé.', 400, 'TOKEN_USED')
  if (new Date(record.expires_at) < new Date()) throw new AppError('Lien expiré. Demandez un nouveau.', 400, 'TOKEN_EXPIRED')

  await query('UPDATE users SET is_verified = true WHERE id = $1', [record.user_id])
  await query('UPDATE email_verification_tokens SET used = true WHERE token_hash = $1', [tokenHash])

  const user = await queryOne<User>('SELECT email, full_name FROM users WHERE id = $1', [record.user_id])
  if (user) await sendWelcomeEmail(user.email, user.full_name)
}

export async function resendVerification(email: string): Promise<void> {
  const user = await queryOne<User>(
    'SELECT id, email, full_name, is_verified FROM users WHERE email = $1',
    [email.toLowerCase()]
  )
  if (!user) throw new AppError('Email introuvable.', 404, 'NOT_FOUND')
  if ((user as any).is_verified) throw new AppError('Email déjà vérifié.', 400, 'ALREADY_VERIFIED')

  // Invalider les anciens tokens
  await query('DELETE FROM email_verification_tokens WHERE user_id = $1', [user.id])

  const verifyToken = generateToken()
  const tokenHash = hashToken(verifyToken)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await query(
    'INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [user.id, tokenHash, expiresAt]
  )

  await sendVerificationEmail(user.email, verifyToken, user.full_name)
}

// ── Réinitialisation Mot de Passe ────────────────────────────

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await queryOne<User>(
    'SELECT id, email, full_name FROM users WHERE email = $1',
    [email.toLowerCase()]
  )
  // On ne révèle pas si l'email existe ou non (sécurité)
  if (!user) return

  await query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id])

  const resetToken = generateToken()
  const tokenHash = hashToken(resetToken)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1h

  await query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [user.id, tokenHash, expiresAt]
  )

  await sendPasswordResetEmail(user.email, resetToken, user.full_name)
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(token)

  const record = await queryOne<{ user_id: string; expires_at: string; used: boolean }>(
    'SELECT user_id, expires_at, used FROM password_reset_tokens WHERE token_hash = $1',
    [tokenHash]
  )

  if (!record) throw new AppError('Lien invalide.', 400, 'INVALID_TOKEN')
  if (record.used) throw new AppError('Ce lien a déjà été utilisé.', 400, 'TOKEN_USED')
  if (new Date(record.expires_at) < new Date()) throw new AppError('Lien expiré.', 400, 'TOKEN_EXPIRED')

  const password_hash = await hashPassword(newPassword)

  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, record.user_id])
  await query('UPDATE password_reset_tokens SET used = true WHERE token_hash = $1', [tokenHash])
}

// ── Profil ───────────────────────────────────────────────────

export async function getUserById(id: string): Promise<User | null> {
  return queryOne<User>(
    `SELECT id, email, full_name, avatar_url, role, plan, is_active, is_verified, created_at
     FROM users WHERE id = $1`,
    [id]
  )
}
