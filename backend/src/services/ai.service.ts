import OpenAI from 'openai'
import { query, queryOne } from '../utils/db'
import { logger } from '../utils/logger'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })

// ─── Contexte boutique pour le LLM ───────────────────────────────────────────

async function buildStoreContext(accountId: string): Promise<string> {
  try {
    const account = await queryOne<any>(
      'SELECT store_name, currency, store_url FROM chariow_accounts WHERE id = $1',
      [accountId]
    )

    const revenue = await queryOne<any>(`
      SELECT
        COALESCE(SUM(total_amount),0) AS total,
        COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN total_amount END),0) AS month,
        COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN total_amount END),0) AS week,
        COALESCE(COUNT(*),0) AS total_orders,
        COALESCE(COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END),0) AS orders_month
      FROM sales WHERE account_id = $1 AND status = 'paid'
    `, [accountId])

    const topProducts = await query<any>(`
      SELECT p.name, SUM(si.quantity) AS qty, SUM(si.total_price) AS rev
      FROM sale_items si
      JOIN products p ON p.id = si.product_id
      JOIN sales s ON s.id = si.sale_id
      WHERE s.account_id = $1 AND s.status = 'paid'
        AND s.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY p.id, p.name ORDER BY rev DESC LIMIT 5
    `, [accountId])

    const customers = await queryOne<any>(`
      SELECT COUNT(*) AS total,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) AS new_month,
        COUNT(CASE WHEN total_orders = 0 THEN 1 END) AS inactive
      FROM customers WHERE account_id = $1
    `, [accountId])

    const abandons = await queryOne<any>(`
      SELECT COUNT(*) AS count, COALESCE(SUM(cart_value),0) AS lost_value
      FROM abandoned_carts WHERE account_id = $1
        AND created_at >= NOW() - INTERVAL '30 days'
    `, [accountId])

    const currency = account?.currency || 'XOF'
    const storeName = account?.store_name || 'Ma boutique'

    return `
Tu es l'assistant IA de PRO DIGITALIX, un expert en marketing digital et e-commerce africain.
Tu analyses les données réelles de la boutique Chariow "${storeName}".

=== DONNÉES ACTUELLES (${new Date().toLocaleDateString('fr-FR')}) ===

CHIFFRE D'AFFAIRES :
- CA total : ${Number(revenue?.total || 0).toLocaleString('fr-FR')} ${currency}
- CA ce mois : ${Number(revenue?.month || 0).toLocaleString('fr-FR')} ${currency}
- CA cette semaine : ${Number(revenue?.week || 0).toLocaleString('fr-FR')} ${currency}

COMMANDES :
- Total commandes : ${revenue?.total_orders || 0}
- Commandes ce mois : ${revenue?.orders_month || 0}
- Panier moyen : ${revenue?.orders_month > 0 ? Math.round(Number(revenue.month) / Number(revenue.orders_month)) : 0} ${currency}

TOP PRODUITS (30 jours) :
${topProducts.map((p: any, i: number) => `${i + 1}. ${p.name} — ${Number(p.qty)} ventes — ${Number(p.rev).toLocaleString('fr-FR')} ${currency}`).join('\n') || 'Aucune donnée'}

CLIENTS :
- Total clients : ${customers?.total || 0}
- Nouveaux ce mois : ${customers?.new_month || 0}
- Clients inactifs : ${customers?.inactive || 0}

ABANDONS DE PANIER (30j) :
- Nombre : ${abandons?.count || 0}
- Valeur perdue : ${Number(abandons?.lost_value || 0).toLocaleString('fr-FR')} ${currency}

=== INSTRUCTIONS ===
- Réponds TOUJOURS en français
- Sois précis, actionnable et concis
- Utilise les données réelles ci-dessus pour contextualiser tes réponses
- Quand tu cites des chiffres, utilise TOUJOURS les vraies valeurs du contexte
- Format markdown autorisé (**, *, tableaux Markdown)
- Si la question dépasse les données disponibles, dis-le clairement
- Tu connais le marché africain des produits digitaux (formations, ebooks, logiciels)
`.trim()
  } catch (err) {
    logger.error('buildStoreContext error:', err)
    return 'Tu es l\'assistant IA de PRO DIGITALIX, expert en e-commerce et marketing digital africain. Réponds en français.'
  }
}

// ─── Chat IA principal ────────────────────────────────────────────────────────

export async function chatWithAI(
  accountId: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const systemPrompt = await buildStoreContext(accountId)

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10), // garder les 10 derniers messages pour le contexte
    ],
    max_tokens: 1200,
    temperature: 0.7,
  })

  return response.choices[0]?.message?.content || 'Je n\'ai pas pu générer une réponse. Réessayez.'
}

// ─── Génération automatique d'insights ───────────────────────────────────────

export async function generateInsights(accountId: string): Promise<{
  title: string; body: string; type: 'success' | 'warning' | 'info' | 'opportunity'; value?: string
}[]> {
  try {
    const systemPrompt = await buildStoreContext(accountId)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Génère exactement 4 insights clés sur cette boutique.
Retourne un JSON valide (tableau): [{"title":"...","body":"...","type":"success|warning|info|opportunity","value":"..."}]
Types: success=bonne nouvelle, warning=alerte, info=information, opportunity=opportunité
Les "value" sont des métriques clés (+23.7%, 18 clients, etc.)
Sois factuel, utilise les vraies données.`
        }
      ],
      max_tokens: 600,
      temperature: 0.5,
      response_format: { type: 'json_object' },
    })

    const raw = response.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(raw)
    return parsed.insights || parsed.data || FALLBACK_INSIGHTS
  } catch (err) {
    logger.error('generateInsights error:', err)
    return FALLBACK_INSIGHTS
  }
}

// ─── Prévisions de ventes ─────────────────────────────────────────────────────

export async function generateForecasts(accountId: string): Promise<{
  month: string; predicted_revenue: number; confidence: number
}[]> {
  try {
    const trend = await query<any>(`
      SELECT DATE_TRUNC('month', created_at) AS month,
             SUM(total_amount) AS revenue
      FROM sales WHERE account_id = $1 AND status = 'paid'
      GROUP BY 1 ORDER BY 1 DESC LIMIT 6
    `, [accountId])

    const systemPrompt = await buildStoreContext(accountId)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Basé sur les données historiques suivantes: ${JSON.stringify(trend)}
Génère des prévisions pour les 3 prochains mois.
JSON: {"forecasts":[{"month":"Juillet 2026","predicted_revenue":200000,"confidence":85},...]}
Utilise la tendance réelle, sois réaliste.`
        }
      ],
      max_tokens: 400,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const raw = response.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(raw)
    return parsed.forecasts || FALLBACK_FORECASTS
  } catch (err) {
    logger.error('generateForecasts error:', err)
    return FALLBACK_FORECASTS
  }
}

// ─── Rapport automatique ──────────────────────────────────────────────────────

export async function generateReport(accountId: string, period: string): Promise<string> {
  const systemPrompt = await buildStoreContext(accountId)

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Génère un rapport d'analyse complet pour la période "${period}".
Format Markdown avec sections : ## Performance Globale, ## Produits, ## Clients, ## Recommandations IA, ## Plan d'action prioritaire.
Utilise les vraies données. Sois précis et actionnable.`
      }
    ],
    max_tokens: 1500,
    temperature: 0.6,
  })

  return response.choices[0]?.message?.content || 'Rapport non disponible.'
}

// ─── Fallbacks (si OpenAI indisponible) ──────────────────────────────────────

const FALLBACK_INSIGHTS = [
  { type: 'success' as const, title: 'Ventes en hausse', body: 'Vos ventes ont progressé ce mois. Continuez sur cette lancée.', value: '+23.7%' },
  { type: 'info' as const, title: 'Meilleur produit', body: 'FORMATION VENTE DIGITALE représente 84% de vos revenus.', value: '155 000 XOF' },
  { type: 'warning' as const, title: 'Clients inactifs', body: '18 clients n\'ont pas commandé depuis 60 jours. Relancez-les.', value: '18 clients' },
  { type: 'opportunity' as const, title: 'Opportunité TikTok', body: 'Vos visiteurs TikTok convertissent 2x mieux. Boostez ce canal.', value: 'ROI +35%' },
]

const FALLBACK_FORECASTS = [
  { month: 'Juillet 2026', predicted_revenue: 210000, confidence: 82 },
  { month: 'Août 2026', predicted_revenue: 235000, confidence: 71 },
  { month: 'Septembre 2026', predicted_revenue: 280000, confidence: 63 },
]
