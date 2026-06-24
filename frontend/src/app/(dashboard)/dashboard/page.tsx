'use client'

import { useState } from 'react'
import {
  TrendingUp, ShoppingCart, Users, Eye,
  RefreshCw, Plus, Zap, ArrowUpRight,
  DollarSign, Target, Clock, BarChart2
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { MetricCard } from '@/components/dashboard/metric-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { ConnectStoreModal } from '@/components/dashboard/connect-store-modal'
import { Button } from '@/components/ui/button'
import { useChariowAccounts } from '@/hooks/useChariowAccount'
import { useDashboard, useRevenueTrend } from '@/hooks/useDashboard'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { chariowApi } from '@/lib/api'

// Données de démo pour quand il n'y a pas encore de compte connecté
const DEMO_TREND = [
  { date: '2026-06-01', revenue: 10000, orders: 3 },
  { date: '2026-06-02', revenue: 25000, orders: 6 },
  { date: '2026-06-03', revenue: 10000, orders: 2 },
  { date: '2026-06-04', revenue: 15000, orders: 3 },
  { date: '2026-06-05', revenue: 5000, orders: 1 },
  { date: '2026-06-07', revenue: 10000, orders: 3 },
  { date: '2026-06-08', revenue: 15000, orders: 3 },
  { date: '2026-06-10', revenue: 15000, orders: 3 },
  { date: '2026-06-14', revenue: 10000, orders: 2 },
  { date: '2026-06-20', revenue: 25000, orders: 5 },
  { date: '2026-06-23', revenue: 15000, orders: 3 },
]

export default function DashboardPage() {
  const { data: session } = useSession()
  const [showConnect, setShowConnect] = useState(false)
  const queryClient = useQueryClient()

  const { data: accounts, isLoading: accountsLoading } = useChariowAccounts()
  const activeAccount = accounts?.[0] || null

  const from = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0]
  const to = new Date().toISOString().split('T')[0]

  const { data: metrics, isLoading: metricsLoading } = useDashboard(activeAccount?.id || null)
  const { data: trendData } = useRevenueTrend(activeAccount?.id || null, from, to)

  const syncMutation = useMutation({
    mutationFn: () => chariowApi.sync(activeAccount!.id),
    onSuccess: () => {
      toast.success('Synchronisation terminée !')
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: () => toast.error('Erreur de synchronisation.'),
  })

  const currency = activeAccount?.currency || metrics?.revenue?.currency || 'XOF'
  const trend = trendData?.daily_trend || DEMO_TREND
  const isDemo = !activeAccount

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Bonjour, {session?.user?.full_name?.split(' ')[0] || 'Vendeur'} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {activeAccount
              ? `Boutique : ${activeAccount.store_name} · Dernière sync : ${activeAccount.last_sync_at ? new Date(activeAccount.last_sync_at).toLocaleString('fr-FR') : 'Jamais'}`
              : 'Connectez votre boutique Chariow pour voir vos données réelles.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeAccount ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate()}
              loading={syncMutation.isPending}
            >
              <RefreshCw className="w-4 h-4" />
              Synchroniser
            </Button>
          ) : null}
          <Button variant="gradient" size="sm" onClick={() => setShowConnect(true)}>
            <Plus className="w-4 h-4" />
            {activeAccount ? 'Ajouter boutique' : 'Connecter Chariow'}
          </Button>
        </div>
      </div>

      {/* Banner demo */}
      {isDemo && (
        <div className="glass rounded-xl p-4 border-l-4 border-primary flex items-center gap-3">
          <Zap className="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Mode démonstration</p>
            <p className="text-xs text-muted-foreground">Connectez votre boutique Chariow pour afficher vos données réelles.</p>
          </div>
          <Button variant="gradient" size="sm" className="ml-auto" onClick={() => setShowConnect(true)}>
            Connecter
          </Button>
        </div>
      )}

      {/* KPI Cards — CA */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Chiffre d'affaires
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="CA Aujourd'hui"
            value={formatCurrency(metrics?.revenue?.today ?? 0, currency)}
            icon={DollarSign}
            iconColor="text-green-400"
            loading={metricsLoading}
          />
          <MetricCard
            title="CA Cette semaine"
            value={formatCurrency(metrics?.revenue?.week ?? 0, currency)}
            icon={TrendingUp}
            iconColor="text-primary"
            loading={metricsLoading}
          />
          <MetricCard
            title="CA Ce mois"
            value={formatCurrency(metrics?.revenue?.month ?? 183850, currency)}
            sub="Juin 2026"
            icon={BarChart2}
            iconColor="text-electric-400"
            loading={metricsLoading}
          />
          <MetricCard
            title="CA Total"
            value={formatCurrency(metrics?.revenue?.total ?? 183850, currency)}
            icon={Target}
            iconColor="text-purple-400"
            loading={metricsLoading}
          />
        </div>
      </div>

      {/* KPI Cards — Opérations */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Opérations
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Commandes (mois)"
            value={formatNumber(metrics?.orders?.month ?? 41)}
            sub={`${formatNumber(metrics?.orders?.today ?? 0)} aujourd'hui`}
            icon={ShoppingCart}
            iconColor="text-orange-400"
            loading={metricsLoading}
          />
          <MetricCard
            title="Clients total"
            value={formatNumber(metrics?.customers?.total ?? 1017)}
            sub={`${metrics?.customers?.new_this_month ?? 36} nouveaux ce mois`}
            icon={Users}
            iconColor="text-blue-400"
            loading={metricsLoading}
          />
          <MetricCard
            title="Panier moyen"
            value={formatCurrency(metrics?.average_order_value ?? 4484, currency)}
            icon={Clock}
            iconColor="text-yellow-400"
            loading={metricsLoading}
          />
          <MetricCard
            title="Taux conversion"
            value={formatPercent(metrics?.conversion_rate ?? 3.89)}
            icon={ArrowUpRight}
            iconColor="text-green-400"
            loading={metricsLoading}
          />
        </div>
      </div>

      {/* Graphique Revenus */}
      <RevenueChart
        data={trend}
        currency={currency}
        loading={metricsLoading && !!activeAccount}
      />

      {/* Top Produits + Répartition pays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Produits */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Top Produits</h3>
          <div className="space-y-3">
            {(metrics?.top_products?.length
              ? metrics.top_products
              : [
                { name: 'FORMATION VENTE DES PRODUITS DIGITAUX', total_sales: 31, total_revenue: 155000, thumbnail_url: null },
                { name: 'Formation achat CHINE-AFRIQUE', total_sales: 4, total_revenue: 17500, thumbnail_url: null },
                { name: 'FORMATION VIDEO IA GEMINI', total_sales: 4, total_revenue: 7500, thumbnail_url: null },
              ]
            ).slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {i + 1}
                </span>
                {p.thumbnail_url ? (
                  <img src={p.thumbnail_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-secondary flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.total_sales} ventes</p>
                </div>
                <p className="text-sm font-bold text-primary flex-shrink-0">
                  {formatCurrency(p.total_revenue, currency)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition pays */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Ventes par pays</h3>
          <div className="space-y-3">
            {[
              { country: '🇧🇯 Bénin', orders: 10, pct: 24 },
              { country: '🇹🇬 Togo', orders: 7, pct: 17 },
              { country: '🇨🇮 Côte d\'Ivoire', orders: 6, pct: 15 },
              { country: '🇫🇷 France', orders: 3, pct: 7 },
              { country: '🇬🇳 Guinée', orders: 2, pct: 5 },
            ].map((c) => (
              <div key={c.country} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{c.country}</span>
                  <span className="text-muted-foreground">{c.orders} cmd · {c.pct}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-brand rounded-full transition-all duration-500"
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showConnect && <ConnectStoreModal onClose={() => setShowConnect(false)} />}
    </div>
  )
}
