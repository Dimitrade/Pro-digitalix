import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { authenticate } from '../middleware/auth.middleware'
import { log as auditLog } from '../services/audit.service'
import { logger } from '../utils/logger'

const router = Router()

const TicketSchema = z.object({
  subject:  z.string().min(3).max(200),
  category: z.enum(['technical', 'billing', 'account', 'feature', 'other']),
  message:  z.string().min(10).max(5000),
  email:    z.string().email(),
})

router.post('/ticket', authenticate, async (req: Request, res: Response) => {
  try {
    const data = TicketSchema.parse(req.body)
    const user = (req as { user?: { id: string; email: string } }).user

    await auditLog({
      targetUserId: user?.id,
      targetEmail: data.email,
      actorId: user?.id,
      actorEmail: user?.email,
      action: `support_ticket_${data.category}` as import('../services/audit.service').AuditAction,
      details: { subject: data.subject, message: data.message.slice(0, 500) },
      ip: req.ip,
    })

    logger.info(`[support] Ticket reçu — ${data.category} — ${data.email} : ${data.subject}`)

    // Envoyer email (si SMTP configuré)
    try {
      const { sendEmail } = await import('../services/email.service')
      await sendEmail({
        to: 'anabokgroup@gmail.com',
        subject: `[Support PRO DIGITALIX] ${data.subject}`,
        text: `De : ${data.email}\nCatégorie : ${data.category}\n\n${data.message}`,
      })
    } catch { /* silencieux si email non configuré */ }

    res.json({ success: true, message: 'Ticket enregistré. Réponse sous 24h ouvrables.' })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.issues[0].message })
    res.status(500).json({ error: 'Erreur lors de l\'envoi du ticket' })
  }
})

export default router
