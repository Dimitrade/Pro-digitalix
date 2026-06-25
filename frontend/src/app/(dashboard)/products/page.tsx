'use client'

import { useState } from 'react'
import {
  Package, TrendingUp, TrendingDown, Star, Brain,
  Search, Filter, Eye, ShoppingCart, BarChart2,
  ArrowUp, ArrowDown, Zap, Target
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency, formatNumber, formatPercent, cn } from '@/lib/utils'
import { productsApi } from '@/lib/api'
import { useChariowAccounts } from '@/hooks/useChariowAccount'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/dashboard/metric-card'

type SortKey = 'revenue' | 'sales' | 'conversion' | 'ai_score'
type ViewTab = 'all' | 'top' | 'low' | 'new'

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-400 bg-green-400/10' : score >= 50 ? 'text-yellow-400 bg-yellow-400/10' : 'text-red-400 bg-red-400/10'
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold', color)}>
      <Brain className="w-3 h-3" />{score}
    </span>
  )
}

function TrendBadge({ pct }: { pct: number }) {
  const up = pct >= 0
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', up ? 'text-green-400' : 'text-red-400')}>
      {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(pct)}%
    </span>
  )
}

export default function ProductsPage() {
  const [tab, setTab] = useState<ViewTab>('all')
  const [sort, setSort] = useState<SortKey>('revenue')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)

  const { data: accounts, isLoading: accountsLoading } = useChariowAccounts()
  const accountId = accounts?.[0]?.id || null
  const currency = accounts?.[0]?.currency || 'XOF'

  const { data, isLoading } = useQuery({
    queryKey: ['products', accountId, tab, sort, search],
    queryFn: () => productsApi.list(accountId!, { search, sort }),
    enabled: !!accountId,
  })

  const products = data?.products || []
  const metrics = data?.metrics || { total_active: 0, total_revenue: 0, sales_this_month: 0, avg_ai_score: 0, top_product_name: '' }

  const filtered = products.filter((p: any) => {
    if (tab === 'top') return (p.ai_score || 0) >= 70
    if (tab === 'low') return (p.ai_score || 0) < 50
    if (tab === 'new') return p.is_new
    return true
  })

  const tabs = [
    { key: 'all' as ViewTab, label: 'Tous les produits' },
    { key: 'top' as ViewTab, label: 'Top performances' },
    { key: 'low' as ViewTab, label: 'Moins performants' },
    { key: 'new' as ViewTab, label: 'Nouveaux' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Analytics Produits
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Performance, score IA et recommandations par produit.</p>
        </div>
      </div>

      {!accountId && !accountsLoading && (
        <div className="glass rounded-xl p-10 text-center border border-primary/20">
          <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Aucune boutique connectée</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
            Connectez votre boutique Chariow pour analyser vos produits et obtenir des recommandations IA.
          </p>
          <a href="/integrations" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium">
            Connecter Chariow
          </a>
        </div>
      )}

      {(accountId || accountsLoading) && <>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Produits actifs" value={formatNumber(metrics.total_active)} icon={Package} iconColor="text-blue-400" loading={isLoading && !!accountId} />
        <MetricCard title="CA total produits" value={formatCurrency(metrics.total_revenue, currency)} icon={BarChart2} iconColor="text-primary" loading={isLoading && !!accountId} />
        <MetricCard title="Ventes ce mois" value={formatNumber(metrics.sales_this_month)} sub={`${metrics.top_product_name}`} icon={ShoppingCart} iconColor="text-green-400" loading={isLoading && !!accountId} />
        <MetricCard title="Score IA moyen" value={`${metrics.avg_ai_score}/100`} sub="Basé sur conversion + CA" icon={Brain} iconColor="text-purple-400" loading={isLoading && !!accountId} />
      </div>

      <div className="flex gap-4">
        {/* Table principale */}
        <div className="flex-1 glass rounded-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border px-4 overflow-x-auto">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn('px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Filtres */}
          <div className="p-4 flex items-center gap-3 border-b border-border flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un produit…"
                className="h-8 w-64 bg-secondary border border-border rounded-lg pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-xs text-muted-foreground mr-1">Trier par :</span>
              {[
                { key: 'revenue' as SortKey, label: 'CA' },
                { key: 'sales' as SortKey, label: 'Ventes' },
                { key: 'conversion' as SortKey, label: 'Conversion' },
                { key: 'ai_score' as SortKey, label: 'Score IA' },
              ].map(s => (
                <button key={s.key} onClick={() => setSort(s.key)}
                  className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                    sort === s.key ? 'gradient-brand text-white' : 'hover:bg-secondary text-muted-foreground')}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards produits */}
          <div className="p-4 space-y-3">
            {filtered.map((p: any, i: number) => (
              <div key={p.id || i}
                className="glass rounded-xl p-4 hover:border-primary/30 border border-transparent transition-all cursor-pointer"
                onClick={() => setSelected(p)}>
                <div className="flex items-start gap-4">
                  {/* Rang + image */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    {p.thumbnail_url
                      ? <img src={p.thumbnail_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      : <div className="w-12 h-12 rounded-lg gradient-brand flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground truncate max-w-xs">{p.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.category || 'Formation'} · {p.type || 'Digital'}</p>
                      </div>
                      <ScoreBadge score={p.ai_score || 75} />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">CA total</p>
                        <p className="font-bold text-primary">{formatCurrency(p.total_revenue || 0, currency)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ventes</p>
                        <p className="font-semibold text-foreground">{formatNumber(p.total_sales || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Prix</p>
                        <p className="font-semibold text-foreground">{formatCurrency(p.price || 0, currency)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Évolution</p>
                        <TrendBadge pct={p.growth_pct || 0} />
                      </div>
                    </div>

                    {/* Barre de progression CA */}
                    <div className="mt-2">
                      <div className="h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full gradient-brand rounded-full"
                          style={{ width: `${Math.min(100, (p.total_revenue / (metrics.total_revenue || 1)) * 100 * 5)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommandation IA */}
                {p.ai_recommendation && (
                  <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                    <Brain className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground">{p.ai_recommendation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: insights */}
        <div className="hidden xl:flex flex-col gap-4 w-72">
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              Insights IA
            </h3>
            <div className="space-y-3">
              {AI_INSIGHTS.map((ins, i) => (
                <div key={i} className={cn('p-3 rounded-lg border', ins.type === 'success' ? 'bg-green-400/5 border-green-400/20' : ins.type === 'warning' ? 'bg-yellow-400/5 border-yellow-400/20' : 'bg-primary/5 border-primary/20')}>
                  <p className="text-xs font-medium text-foreground">{ins.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{ins.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-3">Répartition par type</h3>
            {[
              { label: 'Formation', pct: 72, color: 'gradient-brand' },
              { label: 'Ebook / PDF', pct: 18, color: 'bg-purple-500' },
              { label: 'Logiciel', pct: 7, color: 'bg-green-500' },
              { label: 'Autre', pct: 3, color: 'bg-secondary' },
            ].map(r => (
              <div key={r.label} className="mb-2.5">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground">{r.label}</span>
                  <span className="text-muted-foreground">{r.pct}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', r.color)} style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drawer produit */}
      {selected && <ProductDrawer product={selected} currency={currency} onClose={() => setSelected(null)} />}
    </div>
  )
}

function ProductDrawer({ product: p, currency, onClose }: { product: any; currency: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-card border-l border-border h-full overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg text-foreground">Détail produit</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">✕</button>
        </div>
        {p.thumbnail_url
          ? <img src={p.thumbnail_url} alt="" className="w-full h-40 object-cover rounded-xl" />
          : <div className="w-full h-40 rounded-xl gradient-brand flex items-center justify-center"><Package className="w-12 h-12 text-white" /></div>
        }
        <div>
          <h3 className="font-bold text-foreground">{p.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{p.description || 'Formation digitale premium'}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'CA total', value: formatCurrency(p.total_revenue || 0, currency) },
            { label: 'Ventes', value: formatNumber(p.total_sales || 0) },
            { label: 'Prix', value: formatCurrency(p.price || 0, currency) },
            { label: 'Score IA', value: `${p.ai_score || 75}/100` },
          ].map(s => (
            <div key={s.label} className="glass rounded-lg p-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-bold text-primary text-sm mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
        {p.ai_recommendation && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Recommandation IA</span>
            </div>
            <p className="text-sm text-muted-foreground">{p.ai_recommendation}</p>
          </div>
        )}
      </div>
    </div>
      </>}
  )
}

const AI_INSIGHTS = [
  { type: 'success', title: 'Produit star identifié', body: '"FORMATION VENTE" représente 84% de vos revenus. Envisagez une version premium.' },
  { type: 'warning', title: 'Baisse de performance', body: '"Formation CHINE" a chuté de 15% ce mois. Relancez avec une promo flash.' },
  { type: 'info', title: 'Opportunité de bundle', body: 'Combiner vos 3 premières formations pourrait augmenter le panier moyen de +40%.' },
]

