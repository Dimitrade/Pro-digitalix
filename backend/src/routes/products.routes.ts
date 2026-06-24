import { Router, Response, NextFunction } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth.middleware'
import * as chariowService from '../services/chariow.service'
import { query } from '../utils/db'

export const productsRouter = Router()
productsRouter.use(authenticate)

// GET /products/:accountId — Liste produits (DB local + live optionnel)
productsRouter.get('/:accountId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params
    const live = req.query.live === 'true'

    if (live) {
      const data = await chariowService.getLiveProducts(accountId, req.user!.id, req.query.cursor as string)
      return res.json(data)
    }

    const products = await query(
      `SELECT id, chariow_id, name, slug, price, currency, category, type,
              status, thumbnail_url, total_views, total_sales, total_revenue,
              conversion_rate, ai_score, ai_category, created_at
       FROM products WHERE account_id=$1 AND status != 'inactive'
       ORDER BY total_revenue DESC NULLS LAST
       LIMIT 50`,
      [accountId]
    )
    res.json({ products })
  } catch (err) { next(err) }
})

// GET /products/:accountId/:productId — Détail produit
productsRouter.get('/:accountId/:productId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { accountId, productId } = req.params
    const [product] = await query(
      `SELECT p.*,
              COUNT(si.id)::int AS sales_count,
              COALESCE(SUM(si.total_price),0) AS revenue
       FROM products p
       LEFT JOIN sale_items si ON si.product_id = p.id
       LEFT JOIN sales s ON s.id = si.sale_id AND s.status = 'completed'
       WHERE p.account_id=$1 AND p.id=$2
       GROUP BY p.id`,
      [accountId, productId]
    )
    res.json(product || null)
  } catch (err) { next(err) }
})
