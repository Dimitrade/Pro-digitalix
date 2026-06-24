import { Router, Request, Response } from 'express'
import { trackPixelEvent, PixelEventType } from '../services/tracking.service'

export const pixelRouter = Router()

// POST /pixel/event — Endpoint public (pas d'auth) pour le pixel
pixelRouter.post('/event', async (req: Request, res: Response) => {
  // Toujours répondre 204 rapidement (ne pas bloquer le navigateur)
  res.status(204).end()

  const allowedEvents: PixelEventType[] = ['pageview','click','add_to_cart','purchase','abandon']

  try {
    const { pixel_id, event_type, session_id, visitor_id,
            page_url, product_id, value, currency, metadata } = req.body

    if (!pixel_id || !event_type || !session_id) return
    if (!allowedEvents.includes(event_type)) return

    await trackPixelEvent({
      pixel_id,
      event_type,
      session_id,
      visitor_id,
      page_url,
      product_id,
      value: value ? parseFloat(value) : undefined,
      currency,
      metadata,
      ip_address: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip,
      user_agent: req.headers['user-agent'],
    })
  } catch {
    // Silencieux — ne jamais faire planter le pixel
  }
})

// GET /pixel/gif — 1×1 gif tracking (fallback email/images)
pixelRouter.get('/gif', async (req: Request, res: Response) => {
  const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
  res.setHeader('Content-Type', 'image/gif')
  res.setHeader('Cache-Control', 'no-cache, no-store')
  res.end(gif)

  const { pixel_id, s: session_id } = req.query as Record<string, string>
  if (pixel_id && session_id) {
    trackPixelEvent({
      pixel_id,
      event_type: 'pageview',
      session_id,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    }).catch(() => {})
  }
})
