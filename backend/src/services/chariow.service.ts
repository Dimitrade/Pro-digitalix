import axios, { AxiosInstance } from 'axios'
import { decrypt } from '../utils/crypto'
import { queryOne, query } from '../utils/db'
import { logger } from '../utils/logger'
import { AppError } from '../middleware/error.middleware'

const CHARIOW_BASE = 'https://mcp.chariow.com/public'

// ── Client Chariow authentifié par API key ───────────────────

function createChariowClient(apiKey: string): AxiosInstance {
  return axios.create({
    baseURL: CHARIOW_BASE,
    timeout: 30000,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
}

async function getDecryptedApiKey(accountId: string, userId: string): Promise<string> {
  const account = await queryOne<{ api_key_encrypted: string; user_id: string }>(
    'SELECT api_key_encrypted, user_id FROM chariow_accounts WHERE id = $1 AND is_active = true',
    [accountId]
  )
  if (!account) throw new AppError('Compte Chariow introuvable.', 404, 'NOT_FOUND')
  if (account.user_id !== userId) throw new AppError('Accès non autorisé.', 403, 'FORBIDDEN')
  return decrypt(account.api_key_encrypted)
}

// ── Connexion d'un compte Chariow ───────────────────────────

export async function connectChariowAccount(userId: string, apiKey: string) {
  const client = createChariowClient(apiKey)

  // Vérifier que la clé est valide en récupérant le store
  let storeData: any
  try {
    const { data } = await client.get('/store')
    storeData = data
  } catch {
    throw new AppError('Clé API Chariow invalide. Vérifiez votre clé.', 400, 'INVALID_API_KEY')
  }

  // Vérifier que ce compte n'est pas déjà connecté
  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM chariow_accounts WHERE store_slug = $1 AND user_id = $2',
    [storeData.custom_slug || storeData.id, userId]
  )
  if (existing) throw new AppError('Cette boutique est déjà connectée.', 409, 'ALREADY_CONNECTED')

  const { encrypt } = await import('../utils/crypto')

  const [account] = await query<{ id: string }>(
    `INSERT INTO chariow_accounts
       (user_id, store_name, store_slug, api_key_encrypted, store_url, currency, sync_status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     RETURNING id`,
    [
      userId,
      storeData.name,
      storeData.custom_slug || storeData.id,
      encrypt(apiKey),
      storeData.url,
      storeData.currency?.code || 'XOF',
    ]
  )

  return { account_id: account.id, store_name: storeData.name, store_url: storeData.url }
}

// ── Récupérer les infos du store ────────────────────────────

export async function getStoreInfo(accountId: string, userId: string) {
  const apiKey = await getDecryptedApiKey(accountId, userId)
  const client = createChariowClient(apiKey)
  const { data } = await client.get('/store')
  return data
}

// ── Synchronisation complète ────────────────────────────────

export async function syncAccount(accountId: string, userId: string): Promise<{ synced: Record<string, number> }> {
  const apiKey = await getDecryptedApiKey(accountId, userId)
  const client = createChariowClient(apiKey)

  await query(
    "UPDATE chariow_accounts SET sync_status = 'syncing', last_sync_at = NOW() WHERE id = $1",
    [accountId]
  )

  const synced: Record<string, number> = { products: 0, sales: 0, customers: 0 }

  try {
    // Sync produits
    synced.products = await syncProducts(client, accountId)
    // Sync ventes
    synced.sales = await syncSales(client, accountId)
    // Sync clients
    synced.customers = await syncCustomers(client, accountId)

    await query(
      "UPDATE chariow_accounts SET sync_status = 'success', last_sync_at = NOW() WHERE id = $1",
      [accountId]
    )

    logger.info(`Sync OK account=${accountId} — ${JSON.stringify(synced)}`)
    return { synced }
  } catch (err: any) {
    await query(
      "UPDATE chariow_accounts SET sync_status = 'error', sync_error = $1 WHERE id = $2",
      [err.message, accountId]
    )
    throw err
  }
}

async function syncProducts(client: AxiosInstance, accountId: string): Promise<number> {
  let count = 0
  let cursor: string | null = null

  do {
    const params: Record<string, any> = { per_page: 100 }
    if (cursor) params.cursor = cursor

    const { data } = await client.get('/products', { params })
    const products = data.data || []

    for (const p of products) {
      await query(
        `INSERT INTO products
           (account_id, chariow_id, name, slug, price, currency, category, type, status, thumbnail_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (account_id, chariow_id) DO UPDATE SET
           name = EXCLUDED.name, price = EXCLUDED.price, status = EXCLUDED.status,
           thumbnail_url = EXCLUDED.thumbnail_url, updated_at = NOW()`,
        [
          accountId,
          p.id,
          p.name,
          p.slug || p.id,
          p.pricing?.effective?.value || p.pricing?.price?.value || 0,
          p.pricing?.price?.currency || 'XOF',
          p.category?.value || null,
          p.type || 'downloadable',
          p.status || 'active',
          p.pictures?.thumbnail || null,
        ]
      )
      count++
    }

    cursor = data.pagination?.next_cursor || null
  } while (cursor)

  return count
}

async function syncSales(client: AxiosInstance, accountId: string): Promise<number> {
  let count = 0
  let cursor: string | null = null

  do {
    const params: Record<string, any> = { per_page: 100, status: 'completed' }
    if (cursor) params.cursor = cursor

    const { data } = await client.get('/sales', { params })
    const sales = data.data || []

    for (const s of sales) {
      // Upsert customer
      let customerId: string | null = null
      if (s.customer?.id) {
        const [cust] = await query<{ id: string }>(
          `INSERT INTO customers
             (account_id, chariow_id, first_name, last_name, email, phone)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (account_id, chariow_id) DO UPDATE SET
             email = EXCLUDED.email, updated_at = NOW()
           RETURNING id`,
          [
            accountId,
            s.customer.id,
            s.customer.first_name || '',
            s.customer.last_name || '',
            s.customer.email || null,
            s.customer.phone?.number?.toString() || null,
          ]
        )
        customerId = cust.id
      }

      // Upsert produit lié
      let productId: string | null = null
      if (s.product?.id) {
        const prod = await queryOne<{ id: string }>(
          'SELECT id FROM products WHERE account_id = $1 AND chariow_id = $2',
          [accountId, s.product.id]
        )
        productId = prod?.id || null
      }

      await query(
        `INSERT INTO sales
           (account_id, chariow_id, customer_id, order_number, status,
            subtotal, total, currency, payment_method,
            utm_source, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (account_id, chariow_id) DO UPDATE SET
           status = EXCLUDED.status, total = EXCLUDED.total, updated_at = NOW()`,
        [
          accountId,
          s.id,
          customerId,
          s.id,
          s.status,
          s.original_amount?.value || 0,
          s.amount?.value || s.original_amount?.value || 0,
          s.amount?.currency || 'XOF',
          s.payment?.method || null,
          s.context?.country?.code || null,
          s.completed_at || s.created_at,
        ]
      )

      // Sale items
      if (productId && s.product) {
        const [saleRow] = await query<{ id: string }>(
          'SELECT id FROM sales WHERE account_id = $1 AND chariow_id = $2',
          [accountId, s.id]
        )
        if (saleRow) {
          await query(
            `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, total_price)
             VALUES ($1, $2, $3, 1, $4, $5)
             ON CONFLICT DO NOTHING`,
            [
              saleRow.id,
              productId,
              s.product.name,
              s.original_amount?.value || 0,
              s.amount?.value || 0,
            ]
          )
        }
      }
      count++
    }

    cursor = data.pagination?.next_cursor || null
    // Limiter à 500 ventes par sync pour la perf
    if (count >= 500) break
  } while (cursor)

  return count
}

async function syncCustomers(client: AxiosInstance, accountId: string): Promise<number> {
  let count = 0
  let cursor: string | null = null

  do {
    const params: Record<string, any> = { per_page: 100 }
    if (cursor) params.cursor = cursor

    const { data } = await client.get('/customers', { params })
    const customers = data.data || []

    for (const c of customers) {
      await query(
        `INSERT INTO customers
           (account_id, chariow_id, first_name, last_name, email, phone, country)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (account_id, chariow_id) DO UPDATE SET
           email = EXCLUDED.email, updated_at = NOW()`,
        [
          accountId,
          c.id,
          c.first_name || '',
          c.last_name || '',
          c.email || null,
          c.phone?.number?.toString() || null,
          c.phone?.country?.code || null,
        ]
      )
      count++
      if (count >= 1000) break
    }

    cursor = count < 1000 ? (data.pagination?.next_cursor || null) : null
  } while (cursor)

  return count
}

// ── Données live depuis l'API Chariow ───────────────────────

export async function getLiveAnalytics(
  accountId: string,
  userId: string,
  from: string,
  to: string
) {
  const apiKey = await getDecryptedApiKey(accountId, userId)
  const client = createChariowClient(apiKey)

  const [storeAnalytics, salesAnalytics, visitsAnalytics] = await Promise.all([
    client.get('/analytics/store', { params: { from, to } }).catch(() => ({ data: null })),
    client.get('/analytics/sales', { params: { from, to, sections: 'summary,daily_trend,by_country,by_product' } }).catch(() => ({ data: null })),
    client.get('/analytics/visits', { params: { from, to, sections: 'summary,daily_trend,sources,devices' } }).catch(() => ({ data: null })),
  ])

  return {
    store: storeAnalytics.data,
    sales: salesAnalytics.data,
    visits: visitsAnalytics.data,
  }
}

export async function getLiveProducts(accountId: string, userId: string, cursor?: string) {
  const apiKey = await getDecryptedApiKey(accountId, userId)
  const client = createChariowClient(apiKey)
  const params: Record<string, any> = { per_page: 20, status: 'published' }
  if (cursor) params.cursor = cursor
  const { data } = await client.get('/products', { params })
  return data
}

export async function getLiveSales(
  accountId: string,
  userId: string,
  params: { status?: string; start_date?: string; end_date?: string; cursor?: string }
) {
  const apiKey = await getDecryptedApiKey(accountId, userId)
  const client = createChariowClient(apiKey)
  const { data } = await client.get('/sales', { params: { per_page: 20, ...params } })
  return data
}

export async function getLiveCustomers(accountId: string, userId: string, search?: string, cursor?: string) {
  const apiKey = await getDecryptedApiKey(accountId, userId)
  const client = createChariowClient(apiKey)
  const params: Record<string, any> = { per_page: 20 }
  if (search) params.search = search
  if (cursor) params.cursor = cursor
  const { data } = await client.get('/customers', { params })
  return data
}
