import { query, queryOne } from '../utils/db'
import { v4 as uuidv4 } from 'uuid'

export type PixelEventType = 'pageview' | 'click' | 'add_to_cart' | 'purchase' | 'abandon'

export interface PixelEventPayload {
  pixel_id: string
  event_type: PixelEventType
  session_id: string
  visitor_id?: string
  page_url?: string
  product_id?: string
  value?: number
  currency?: string
  metadata?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
}

// ── Enregistrer un événement pixel ──────────────────────────

export async function trackPixelEvent(payload: PixelEventPayload): Promise<void> {
  const account = await queryOne<{ id: string }>(
    'SELECT id FROM chariow_accounts WHERE store_slug = $1 AND is_active = true',
    [payload.pixel_id]
  )
  if (!account) return // pixel silencieux — ne pas révéler les erreurs

  await query(
    `INSERT INTO pixel_events
       (account_id, pixel_id, event_type, session_id, visitor_id,
        page_url, product_id, value, currency, metadata, ip_address, user_agent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      account.id,
      payload.pixel_id,
      payload.event_type,
      payload.session_id,
      payload.visitor_id || null,
      payload.page_url || null,
      payload.product_id || null,
      payload.value || null,
      payload.currency || 'XOF',
      payload.metadata ? JSON.stringify(payload.metadata) : null,
      payload.ip_address || null,
      payload.user_agent || null,
    ]
  )

  // Mettre à jour les métriques agrégées en temps réel
  if (payload.event_type === 'purchase') {
    await updateDailyRevenue(account.id, payload.value || 0)
  }
}

async function updateDailyRevenue(accountId: string, amount: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  await query(
    `INSERT INTO daily_metrics (account_id, date, total_orders, total_revenue)
     VALUES ($1, $2, 1, $3)
     ON CONFLICT (account_id, date) DO UPDATE SET
       total_orders = daily_metrics.total_orders + 1,
       total_revenue = daily_metrics.total_revenue + $3`,
    [accountId, today, amount]
  )
}

// ── Générer le snippet pixel JavaScript ─────────────────────

export function generatePixelScript(pixelId: string, apiBaseUrl: string): string {
  return `<!-- PRO DIGITALIX Pixel -->
<script>
(function(w,d,s,p,e){
  w.__pdx=w.__pdx||[];
  w.__pdx.push=w.__pdx.push.bind(w.__pdx);
  w.__pdx_pixel_id="${pixelId}";
  w.__pdx_api="${apiBaseUrl}/pixel";
  var sid=localStorage.getItem('_pdx_sid')||'${uuidv4().split('-')[0]}'+Math.random().toString(36).slice(2);
  localStorage.setItem('_pdx_sid',sid);
  function track(event,data){
    var payload=Object.assign({pixel_id:"${pixelId}",event_type:event,session_id:sid,page_url:location.href},data||{});
    fetch(w.__pdx_api+'/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(function(){});
  }
  w.__pdx.track=track;
  // Auto-track pageview
  track('pageview');
  // Track time on page
  var start=Date.now();
  window.addEventListener('beforeunload',function(){
    track('pageview',{metadata:{duration_seconds:Math.round((Date.now()-start)/1000)}});
  });
})(window,document);
</script>
<!-- End PRO DIGITALIX Pixel -->`.trim()
}

// ── Stats Pixel pour un compte ───────────────────────────────

export async function getPixelStats(accountId: string, from: string, to: string) {
  const rows = await query<{ event_type: string; count: string; unique_sessions: string }>(
    `SELECT event_type,
            COUNT(*) AS count,
            COUNT(DISTINCT session_id) AS unique_sessions
     FROM pixel_events
     WHERE account_id=$1 AND DATE(created_at) BETWEEN $2 AND $3
     GROUP BY event_type`,
    [accountId, from, to]
  )

  const stats: Record<string, { count: number; sessions: number }> = {}
  for (const r of rows) {
    stats[r.event_type] = {
      count: parseInt(r.count),
      sessions: parseInt(r.unique_sessions),
    }
  }

  const pageviews = stats.pageview?.sessions || 0
  const purchases = stats.purchase?.count || 0
  const abandonments = stats.abandon?.count || 0

  return {
    pageviews,
    unique_visitors: pageviews,
    purchases,
    abandonments,
    conversion_rate: pageviews > 0 ? ((purchases / pageviews) * 100).toFixed(2) : '0',
    abandon_rate: pageviews > 0 ? ((abandonments / pageviews) * 100).toFixed(2) : '0',
    by_event: stats,
  }
}
