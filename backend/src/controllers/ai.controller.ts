import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth.middleware'
import { chatWithAI, generateInsights, generateForecasts, generateReport } from '../services/ai.service'
import { AppError } from '../middleware/error.middleware'

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(4000),
  })).min(1).max(20),
})

export async function chat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { accountId } = req.params
    const parsed = chatSchema.safeParse(req.body)
    if (!parsed.success) throw new AppError('Messages invalides', 400, 'VALIDATION_ERROR')

    const reply = await chatWithAI(accountId, parsed.data.messages)
    res.json({ reply })
  } catch (err) { next(err) }
}

export async function insights(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { accountId } = req.params
    const data = await generateInsights(accountId)
    res.json({ insights: data })
  } catch (err) { next(err) }
}

export async function forecasts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { accountId } = req.params
    const data = await generateForecasts(accountId)
    res.json({ forecasts: data })
  } catch (err) { next(err) }
}

export async function report(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { accountId } = req.params
    const period = (req.query.period as string) || '30 derniers jours'
    const markdown = await generateReport(accountId, period)
    res.json({ report: markdown, period })
  } catch (err) { next(err) }
}
