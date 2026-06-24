import { Router, Response, NextFunction } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth.middleware'
import * as chariowService from '../services/chariow.service'
import { query, queryOne } from '../utils/db'

export const customersRouter = Router()
customersRouter.use(authenticate)

// GET /customers/:accountId
customersRouter.get('/:accountId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params
    const live = req.query.live === 'true'
    const search = req.query.search as string | undefined
    const cursor = req.query.cursor as string | undefined

    if (live) {
      const data = await chariowService.getLiveCustomers(accountId, req.user!.id, search, cursor)
      return res.json(data)
    }

    const searchClause = search ? `AND (first_name ILIKE $3 OR last_name ILIKE $3 OR email ILIKE $3)` : ''
    const params: unknown[] = [accountId, 50]
    if (search) params.push(`%${search}%`)

    const customers = await query(
      `SELECT id, chariow_id, first_name, last_name, email, phone,
              whatsapp, country, total_orders, total_spent,
              average_order, last_order_at, customer_segment, created_at
       FROM customers WHERE account_id=$1 ${searchClause}
       ORDER BY total_spent DESC NULLS LAST
       LIMIT $2`,
      params
    )
    res.json({ customers })
  } catch (err) { next(err) }
})

// GET /customers/:accountId/:customerId
customersRouter.get('/:accountId/:customerId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { accountId, customerId } = req.params
    const customer = await queryOne(
      'SELECT * FROM customers WHERE account_id=$1 AND id=$2',
      [accountId, customerId]
    )

    const orders = await query(
      `SELECT s.id, s.chariow_id, s.status, s.total, s.currency,
              s.created_at, p.name AS product_name, p.thumbnail_url
       FROM sales s
       LEFT JOIN sale_items si ON si.sale_id = s.id
       LEFT JOIN products p ON p.id = si.product_id
       WHERE s.account_id=$1 AND s.customer_id=$2
       ORDER BY s.created_at DESC LIMIT 20`,
      [accountId, customerId]
    )

    res.json({ customer, orders })
  } catch (err) { next(err) }
})
