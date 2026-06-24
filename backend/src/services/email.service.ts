import { logger } from '../utils/logger'

interface EmailOptions {
  to: string
  subject: string
  html?: string
  text?: string
}

// Utilise Resend ou Nodemailer selon l'environnement
export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<void> {
  // En production: intégrer Resend / SendGrid / SMTP
  // Pour dev: log dans la console
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[EMAIL] To: ${to} | Subject: ${subject}`)
    return
  }

  // Exemple avec Resend (npm install resend)
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({ from: 'noreply@prodigitalix.com', to, subject, html })
}

const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
const APP_NAME = 'PRO DIGITALIX'

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${APP_NAME}</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:40px 20px;">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;border:1px solid #334155;overflow:hidden;">
      <tr>
        <td style="padding:32px;background:linear-gradient(135deg,#1d4ed8,#0ea5e9);text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:1px;">⚡ ${APP_NAME}</h1>
          <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Analytics pour Chariow</p>
        </td>
      </tr>
      <tr><td style="padding:32px;color:#e2e8f0;font-size:15px;line-height:1.7;">
        ${content}
      </td></tr>
      <tr><td style="padding:20px 32px;border-top:1px solid #334155;text-align:center;">
        <p style="margin:0;color:#475569;font-size:12px;">© ${new Date().getFullYear()} ${APP_NAME} — Tous droits réservés</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

export async function sendVerificationEmail(email: string, token: string, name: string): Promise<void> {
  const url = `${APP_URL}/verify-email?token=${token}`
  await sendEmail({
    to: email,
    subject: `Vérifiez votre email — ${APP_NAME}`,
    html: baseTemplate(`
      <p>Bonjour <strong>${name}</strong>,</p>
      <p>Merci de vous être inscrit sur <strong>${APP_NAME}</strong> ! Cliquez sur le bouton ci-dessous pour vérifier votre adresse email.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${url}" style="background:linear-gradient(135deg,#1d4ed8,#0ea5e9);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">Vérifier mon email</a>
      </div>
      <p style="color:#94a3b8;font-size:13px;">Ce lien expire dans <strong>24 heures</strong>. Si vous n'avez pas créé de compte, ignorez cet email.</p>
    `),
  })
}

export async function sendPasswordResetEmail(email: string, token: string, name: string): Promise<void> {
  const url = `${APP_URL}/reset-password?token=${token}`
  await sendEmail({
    to: email,
    subject: `Réinitialisation de mot de passe — ${APP_NAME}`,
    html: baseTemplate(`
      <p>Bonjour <strong>${name}</strong>,</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${url}" style="background:linear-gradient(135deg,#1d4ed8,#0ea5e9);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">Réinitialiser mon mot de passe</a>
      </div>
      <p style="color:#94a3b8;font-size:13px;">Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    `),
  })
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Bienvenue sur ${APP_NAME} !`,
    html: baseTemplate(`
      <p>Bonjour <strong>${name}</strong> 🎉</p>
      <p>Votre compte est maintenant vérifié. Vous pouvez commencer à connecter votre boutique Chariow et analyser vos ventes.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${APP_URL}/dashboard" style="background:linear-gradient(135deg,#1d4ed8,#0ea5e9);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">Accéder au Dashboard</a>
      </div>
    `),
  })
}
