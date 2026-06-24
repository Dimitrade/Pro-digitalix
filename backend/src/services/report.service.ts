import { query, queryOne } from '../utils/db'
import { logger } from '../utils/logger'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'annual' | 'custom'
export type ReportFormat = 'json' | 'csv' | 'xlsx_data'

export interface ReportData {
  meta: {
    title: string
    period: string
    store_name: string
    currency: string
    generated_at: string
    developed_by: string
  }
  summary: {
    total_revenue: number
    total_orders: number
    avg_order_value: number
    total_customers: number
    new_customers: number
    conversion_rate: number
  }
  revenue_by_day: Array<{ date: string; revenue: number; orders: number }>
  top_products: Array<{ name: string; sales: number; revenue: number; price: number }>
  top_customers: Array<{ name: string; email: string; orders: number; total_spent: number }>
  sales_by_country: Array<{ country: string; orders: number; revenue: number }>
  ai_summary?: string
}

// ─── Génération des données de rapport ───────────────────────────────────────

export async function generateReportData(
  accountId: string,
  type: ReportType,
  startDate?: string,
  endDate?: string
): Promise<ReportData> {
  // Calculer les dates selon le type
  const now = new Date()
  let from: Date, to: Date, periodLabel: string

  if (startDate && endDate) {
    from = new Date(startDate)
    to = new Date(endDate)
    periodLabel = `Du ${from.toLocaleDateString('fr-FR')} au ${to.toLocaleDateString('fr-FR')}`
  } else {
    switch (type) {
      case 'daily':
        from = new Date(now.setHours(0, 0, 0, 0))
        to = new Date()
        periodLabel = `Aujourd'hui ${now.toLocaleDateString('fr-FR')}`
        break
      case 'weekly':
        from = new Date(now.getTime() - 7 * 864e5)
        to = new Date()
        periodLabel = `7 derniers jours`
        break
      case 'monthly':
        from = new Date(now.getFullYear(), now.getMonth(), 1)
        to = new Date()
        periodLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        break
      case 'annual':
        from = new Date(now.getFullYear(), 0, 1)
        to = new Date()
        periodLabel = `Année ${now.getFullYear()}`
        break
      default:
        from = new Date(now.getTime() - 30 * 864e5)
        to = new Date()
        periodLabel = '30 derniers jours'
    }
  }

  const fromISO = from.toISOString()
  const toISO = to.toISOString()

  try {
    const account = await queryOne<any>(
      'SELECT store_name, currency FROM chariow_accounts WHERE id = $1',
      [accountId]
    )

    // Résumé global
    const summary = await queryOne<any>(`
      SELECT
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COUNT(*) AS total_orders,
        COALESCE(AVG(total_amount), 0) AS avg_order_value
      FROM sales
      WHERE account_id = $1 AND status = 'paid'
        AND created_at BETWEEN $2 AND $3
    `, [accountId, fromISO, toISO])

    const customers = await queryOne<any>(`
      SELECT
        COUNT(*) AS total_customers,
        COUNT(CASE WHEN created_at BETWEEN $2 AND $3 THEN 1 END) AS new_customers
      FROM customers WHERE account_id = $1
    `, [accountId, fromISO, toISO])

    // Revenus par jour
    const revenueByDay = await query<any>(`
      SELECT
        DATE(created_at) AS date,
        SUM(total_amount) AS revenue,
        COUNT(*) AS orders
      FROM sales
      WHERE account_id = $1 AND status = 'paid'
        AND created_at BETWEEN $2 AND $3
      GROUP BY DATE(created_at) ORDER BY date
    `, [accountId, fromISO, toISO])

    // Top produits
    const topProducts = await query<any>(`
      SELECT p.name, SUM(si.quantity) AS sales,
             SUM(si.total_price) AS revenue, p.price
      FROM sale_items si
      JOIN products p ON p.id = si.product_id
      JOIN sales s ON s.id = si.sale_id
      WHERE s.account_id = $1 AND s.status = 'paid'
        AND s.created_at BETWEEN $2 AND $3
      GROUP BY p.id, p.name, p.price
      ORDER BY revenue DESC LIMIT 10
    `, [accountId, fromISO, toISO])

    // Top clients
    const topCustomers = await query<any>(`
      SELECT c.full_name AS name, c.email,
             COUNT(s.id) AS orders, SUM(s.total_amount) AS total_spent
      FROM sales s
      JOIN customers c ON c.id = s.customer_id
      WHERE s.account_id = $1 AND s.status = 'paid'
        AND s.created_at BETWEEN $2 AND $3
      GROUP BY c.id, c.full_name, c.email
      ORDER BY total_spent DESC LIMIT 10
    `, [accountId, fromISO, toISO])

    // Ventes par pays
    const salesByCountry = await query<any>(`
      SELECT c.country, COUNT(s.id) AS orders, SUM(s.total_amount) AS revenue
      FROM sales s
      JOIN customers c ON c.id = s.customer_id
      WHERE s.account_id = $1 AND s.status = 'paid'
        AND s.created_at BETWEEN $2 AND $3
        AND c.country IS NOT NULL
      GROUP BY c.country ORDER BY revenue DESC LIMIT 10
    `, [accountId, fromISO, toISO])

    const typeLabels: Record<ReportType, string> = {
      daily: 'Rapport Journalier',
      weekly: 'Rapport Hebdomadaire',
      monthly: 'Rapport Mensuel',
      annual: 'Rapport Annuel',
      custom: 'Rapport Personnalisé',
    }

    return {
      meta: {
        title: typeLabels[type],
        period: periodLabel,
        store_name: account?.store_name || 'Ma boutique',
        currency: account?.currency || 'XOF',
        generated_at: new Date().toISOString(),
        developed_by: 'ANABOK GROUP — PRO DIGITALIX',
      },
      summary: {
        total_revenue: Number(summary?.total_revenue || 0),
        total_orders: Number(summary?.total_orders || 0),
        avg_order_value: Number(summary?.avg_order_value || 0),
        total_customers: Number(customers?.total_customers || 0),
        new_customers: Number(customers?.new_customers || 0),
        conversion_rate: 0,
      },
      revenue_by_day: revenueByDay.map(r => ({
        date: r.date,
        revenue: Number(r.revenue),
        orders: Number(r.orders),
      })),
      top_products: topProducts.map(p => ({
        name: p.name,
        sales: Number(p.sales),
        revenue: Number(p.revenue),
        price: Number(p.price),
      })),
      top_customers: topCustomers.map(c => ({
        name: c.name,
        email: c.email,
        orders: Number(c.orders),
        total_spent: Number(c.total_spent),
      })),
      sales_by_country: salesByCountry.map(c => ({
        country: c.country,
        orders: Number(c.orders),
        revenue: Number(c.revenue),
      })),
    }
  } catch (err) {
    logger.error('generateReportData error:', err)
    throw err
  }
}

// ─── Génération CSV ───────────────────────────────────────────────────────────

export function generateCSV(data: ReportData): string {
  const fmt = (n: number) => n.toLocaleString('fr-FR')
  const lines: string[] = []

  lines.push(`PRO DIGITALIX - ${data.meta.title}`)
  lines.push(`Boutique: ${data.meta.store_name}`)
  lines.push(`Période: ${data.meta.period}`)
  lines.push(`Généré le: ${new Date(data.meta.generated_at).toLocaleString('fr-FR')}`)
  lines.push(`Développé par: ${data.meta.developed_by}`)
  lines.push('')

  lines.push('=== RÉSUMÉ ===')
  lines.push(`CA Total,${fmt(data.summary.total_revenue)} ${data.meta.currency}`)
  lines.push(`Commandes,${data.summary.total_orders}`)
  lines.push(`Panier moyen,${fmt(data.summary.avg_order_value)} ${data.meta.currency}`)
  lines.push(`Nouveaux clients,${data.summary.new_customers}`)
  lines.push('')

  lines.push('=== REVENUS PAR JOUR ===')
  lines.push('Date,Revenus,Commandes')
  data.revenue_by_day.forEach(r => {
    lines.push(`${r.date},${fmt(r.revenue)} ${data.meta.currency},${r.orders}`)
  })
  lines.push('')

  lines.push('=== TOP PRODUITS ===')
  lines.push('Produit,Ventes,Revenus,Prix unitaire')
  data.top_products.forEach(p => {
    lines.push(`"${p.name}",${p.sales},${fmt(p.revenue)} ${data.meta.currency},${fmt(p.price)} ${data.meta.currency}`)
  })
  lines.push('')

  lines.push('=== TOP CLIENTS ===')
  lines.push('Nom,Email,Commandes,Total dépensé')
  data.top_customers.forEach(c => {
    lines.push(`"${c.name}","${c.email}",${c.orders},${fmt(c.total_spent)} ${data.meta.currency}`)
  })

  return lines.join('\n')
}

// ─── Données pour Excel (JSON structuré) ──────────────────────────────────────

export function generateXLSXData(data: ReportData) {
  return {
    sheets: [
      {
        name: 'Résumé',
        rows: [
          ['PRO DIGITALIX — ' + data.meta.title],
          ['Boutique', data.meta.store_name],
          ['Période', data.meta.period],
          ['Généré le', new Date(data.meta.generated_at).toLocaleString('fr-FR')],
          ['Développé par', data.meta.developed_by],
          [],
          ['Indicateur', 'Valeur'],
          ['CA Total', data.summary.total_revenue],
          ['Commandes', data.summary.total_orders],
          ['Panier moyen', data.summary.avg_order_value],
          ['Nouveaux clients', data.summary.new_customers],
        ],
      },
      {
        name: 'Revenus par jour',
        rows: [
          ['Date', 'Revenus (' + data.meta.currency + ')', 'Commandes'],
          ...data.revenue_by_day.map(r => [r.date, r.revenue, r.orders]),
        ],
      },
      {
        name: 'Top Produits',
        rows: [
          ['Produit', 'Ventes', 'Revenus (' + data.meta.currency + ')', 'Prix unitaire'],
          ...data.top_products.map(p => [p.name, p.sales, p.revenue, p.price]),
        ],
      },
      {
        name: 'Top Clients',
        rows: [
          ['Nom', 'Email', 'Commandes', 'Total dépensé (' + data.meta.currency + ')'],
          ...data.top_customers.map(c => [c.name, c.email, c.orders, c.total_spent]),
        ],
      },
      {
        name: 'Ventes par pays',
        rows: [
          ['Pays', 'Commandes', 'Revenus (' + data.meta.currency + ')'],
          ...data.sales_by_country.map(c => [c.country, c.orders, c.revenue]),
        ],
      },
    ],
  }
}
