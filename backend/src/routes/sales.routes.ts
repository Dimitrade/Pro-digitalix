import { Router, Response, NextFunction } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth.middleware'
import * as chariowService from '../services/chariow.service'
import { query, queryOne } from '../utils/db'

export const salesRouter = Router()
salesRouter.use(authenticate)

// GET /sales/:accountId
salesRouter.get('/:accountId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params
    const live = req.query.live === 'true'

    if (live) {
      const data = await chariowService.getLiveSales(accountId, req.user!.id, {
        status: req.query.status as string,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        cursor: req.query.cursor as string,
      })
      return res.json(data)
    }

    const status = req.query.status as string | undefined
    const from = req.query.from as string | undefined
    const to = req.query.to as string | undefined

    const clauses: string[] = ['s.account_id=$1']
    const params: unknown[] = [accountId]
    let idx = 2

    if (status) { clauses.push(`s.status=$${idx++}`); params.push(status) }
    if (from)   { clauses.push(`DATE(s.created_at) >= $${idx++}`); params.push(from) }
    if (to)     { clauses.push(`DATE(s.created_at) <= $${idx++}`); params.push(to) }

    params.push(50)
    const sales = await query(
      `SELECT s.id, s.chariow_id, s.order_number, s.status,
              s.subtotal, s.total, s.currency, s.payment_method,
              s.created_at,
              c.first_name, c.last_name, c.email, c.phone,
              p.name AS product_name, p.thumbnail_url
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       LEFT JOIN sale_items si ON si.sale_id = s.id
       LEFT JOIN products p ON p.id = si.product_id
       WHERE ${clauses.join(' AND ')}
       ORDER BY s.created_at DESC
       LIMIT $${idx}`,
      params
    )
    res.json({ sales })
  } catch (err) { next(err) }
})

// GET /sales/:accountId/:saleId
salesRouter.get('/:accountId/:saleId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { accountId, saleId } = req.params
    const sale = await queryOne(
      `SELECT s.*, c.first_name, c.last_name, c.email, c.phone
       FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
       WHERE s.account_id=$1 AND s.id=$2`,
      [accountId, saleId]
    )
    const items = await query(
      `SELECT si.*, p.thumbnail_url FROM sale_items si
       LEFT JOIN products p ON p.id = si.product_id
       WHERE si.sale_id=$1`,
      [saleId]
    )
    res.json({ sale, items })
  } catch (err) { next(err) }
})
