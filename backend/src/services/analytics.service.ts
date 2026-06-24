import { query, queryOne } from '../utils/db'

export interface DashboardMetrics {
  revenue: { today: number; week: number; month: number; total: number; currency: string }
  orders: { today: number; week: number; month: number; total: number }
  customers: { total: number; new_this_month: number; returning: number }
  visitors: { today: number; week: number; month: number }
  conversion_rate: number
  average_order_value: number
  abandoned_cart_rate: number
  top_products: TopProduct[]
  revenue_trend: TrendPoint[]
  sales_by_country: CountryStat[]
}

export interface TopProduct {
  id: string
  chariow_id: string
  name: string
  thumbnail_url: string | null
  total_sales: number
  total_revenue: number
  price: number
  currency: string
  conversion_rate: number
  ai_category: string | null
}

export interface TrendPoint {
  date: string
  revenue: number
  orders: number
}

export interface CountryStat {
  country: string
  orders: number
  revenue: number
  percentage: number
}

// ── Dashboard principal ──────────────────────────────────────

export async function getDashboardMetrics(accountId: string): Promise<DashboardMetrics> {
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0]

  const [revenueData, customerData, topProductsData, trendData] = await Promise.all([
    getRevenueMetrics(accountId, today, weekAgo, monthStart),
    getCustomerMetrics(accountId, monthStart),
    getTopProducts(accountId),
    getRevenueTrend(accountId, weekAgo, today),
  ])

  return {
    revenue: revenueData.revenue,
    orders: revenueData.orders,
    customers: customerData,
    visitors: { today: 0, week: 0, month: 0 }, // depuis pixel / visits analytics
    conversion_rate: revenueData.conversion_rate,
    average_order_value: revenueData.average_order_value,
    abandoned_cart_rate: 0,
    top_products: topProductsData,
    revenue_trend: trendData,
    sales_by_country: [],
  }
}

async function getRevenueMetrics(
  accountId: string,
  today: string,
  weekAgo: string,
  monthStart: string
) {
  const [todayRow, weekRow, monthRow, totalRow, aovRow] = await Promise.all([
    queryOne<{ revenue: string; orders: string }>(
      `SELECT COALESCE(SUM(total),0) AS revenue, COUNT(*) AS orders
       FROM sales WHERE account_id=$1 AND status='completed' AND DATE(created_at)=$2`,
      [accountId, today]
    ),
    queryOne<{ revenue: string; orders: string }>(
      `SELECT COALESCE(SUM(total),0) AS revenue, COUNT(*) AS orders
       FROM sales WHERE account_id=$1 AND status='completed' AND DATE(created_at) >= $2`,
      [accountId, weekAgo]
    ),
    queryOne<{ revenue: string; orders: string }>(
      `SELECT COALESCE(SUM(total),0) AS revenue, COUNT(*) AS orders
       FROM sales WHERE account_id=$1 AND status='completed' AND DATE(created_at) >= $2`,
      [accountId, monthStart]
    ),
    queryOne<{ revenue: string; orders: string }>(
      `SELECT COALESCE(SUM(total),0) AS revenue, COUNT(*) AS orders
       FROM sales WHERE account_id=$1 AND status='completed'`,
      [accountId]
    ),
    queryOne<{ aov: string }>(
      `SELECT COALESCE(AVG(total),0) AS aov
       FROM sales WHERE account_id=$1 AND status='completed' AND total > 0`,
      [accountId]
    ),
  ])

  const currency = await queryOne<{ currency: string }>(
    'SELECT currency FROM chariow_accounts WHERE id=$1',
    [accountId]
  )

  const totalOrders = parseInt(totalRow?.orders || '0')
  const totalRevenue = parseFloat(totalRow?.revenue || '0')
  const aov = parseFloat(aovRow?.aov || '0')

  return {
    revenue: {
      today: parseFloat(todayRow?.revenue || '0'),
      week: parseFloat(weekRow?.revenue || '0'),
      month: parseFloat(monthRow?.revenue || '0'),
      total: totalRevenue,
      currency: currency?.currency || 'XOF',
    },
    orders: {
      today: parseInt(todayRow?.orders || '0'),
      week: parseInt(weekRow?.orders || '0'),
      month: parseInt(monthRow?.orders || '0'),
      total: totalOrders,
    },
    conversion_rate: 0,
    average_order_value: aov,
  }
}

async function getCustomerMetrics(accountId: string, monthStart: string) {
  const [totalRow, newRow, returningRow] = await Promise.all([
    queryOne<{ total: string }>(
      'SELECT COUNT(*) AS total FROM customers WHERE account_id=$1',
      [accountId]
    ),
    queryOne<{ total: string }>(
      `SELECT COUNT(*) AS total FROM customers
       WHERE account_id=$1 AND DATE(created_at) >= $2`,
      [accountId, monthStart]
    ),
    queryOne<{ total: string }>(
      `SELECT COUNT(DISTINCT customer_id) AS total FROM sales
       WHERE account_id=$1 AND status='completed'
       GROUP BY customer_id HAVING COUNT(*) > 1`,
      [accountId]
    ),
  ])

  return {
    total: parseInt(totalRow?.total || '0'),
    new_this_month: parseInt(newRow?.total || '0'),
    returning: parseInt(returningRow?.total || '0'),
  }
}

export async function getTopProducts(accountId: string, limit = 10): Promise<TopProduct[]> {
  const rows = await query<TopProduct>(
    `SELECT p.id, p.chariow_id, p.name, p.thumbnail_url, p.ai_category,
            p.price, p.currency,
            COUNT(si.id)::int AS total_sales,
            COALESCE(SUM(si.total_price),0) AS total_revenue,
            p.conversion_rate
     FROM products p
     LEFT JOIN sale_items si ON si.product_id = p.id
     LEFT JOIN sales s ON s.id = si.sale_id AND s.status = 'completed'
     WHERE p.account_id = $1
     GROUP BY p.id
     ORDER BY total_revenue DESC
     LIMIT $2`,
    [accountId, limit]
  )
  return rows
}

export async function getRevenueTrend(
  accountId: string,
  from: string,
  to: string
): Promise<TrendPoint[]> {
  const rows = await query<TrendPoint>(
    `SELECT DATE(created_at)::text AS date,
            COALESCE(SUM(total),0) AS revenue,
            COUNT(*)::int AS orders
     FROM sales
     WHERE account_id=$1 AND status='completed'
       AND DATE(created_at) BETWEEN $2 AND $3
     GROUP BY DATE(created_at)
     ORDER BY DATE(created_at)`,
    [accountId, from, to]
  )
  return rows
}

export async function getSalesByCountry(accountId: string, from: string, to: string): Promise<CountryStat[]> {
  const rows = await query<{ country: string; orders: string; revenue: string }>(
    `SELECT utm_source AS country, COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue
     FROM sales
     WHERE account_id=$1 AND status='completed'
       AND DATE(created_at) BETWEEN $2 AND $3
       AND utm_source IS NOT NULL
     GROUP BY utm_source
     ORDER BY revenue DESC
     LIMIT 15`,
    [accountId, from, to]
  )

  const totalRevenue = rows.reduce((s, r) => s + parseFloat(r.revenue), 0)
  return rows.map((r) => ({
    country: r.country,
    orders: parseInt(r.orders),
    revenue: parseFloat(r.revenue),
    percentage: totalRevenue > 0 ? Math.round((parseFloat(r.revenue) / totalRevenue) * 100) : 0,
  }))
}

// ── Métriques analytiques période ───────────────────────────

export async function getAnalyticsByPeriod(
  accountId: string,
  from: string,
  to: string
) {
  const [trend, countries, products] = await Promise.all([
    getRevenueTrend(accountId, from, to),
    getSalesByCountry(accountId, from, to),
    getTopProducts(accountId, 5),
  ])

  const summaryRow = await queryOne<{ revenue: string; orders: string; aov: string }>(
    `SELECT COALESCE(SUM(total),0) AS revenue,
            COUNT(*)::int AS orders,
            COALESCE(AVG(NULLIF(total,0)),0) AS aov
     FROM sales
     WHERE account_id=$1 AND status='completed'
       AND DATE(created_at) BETWEEN $2 AND $3`,
    [accountId, from, to]
  )

  return {
    period: { from, to },
    summary: {
      revenue: parseFloat(summaryRow?.revenue || '0'),
      orders: parseInt(summaryRow?.orders || '0'),
      average_order_value: parseFloat(summaryRow?.aov || '0'),
    },
    daily_trend: trend,
    by_country: countries,
    top_products: products,
  }
}
