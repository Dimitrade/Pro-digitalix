'use client'

import { useState } from 'react'
import {
  ShoppingCart, Search, Download, ChevronLeft, ChevronRight,
  CheckCircle2, Clock, XCircle, RefreshCw, DollarSign,
  TrendingUp, Package
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency, formatNumber, formatDate, cn } from '@/lib/utils'
import { salesApi } from '@/lib/api'
import { useChariowAccounts } from '@/hooks/useChariowAccount'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/dashboard/metric-card'

type StatusFilter = 'all' | 'paid' | 'pending' | 'refunded' | 'failed'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  paid: { label: 'Payée', color: 'text-green-400 bg-green-400/10', icon: CheckCircle2 },
  pending: { label: 'En attente', color: 'text-yellow-400 bg-yellow-400/10', icon: Clock },
  refunded: { label: 'Remboursée', color: 'text-blue-400 bg-blue-400/10', icon: RefreshCw },
  failed: { label: 'Échouée', color: 'text-red-400 bg-red-400/10', icon: XCircle },
}

export default function SalesPage() {
  const [status, setStatus] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data: accounts } = useChariowAccounts()
  const accountId = accounts?.[0]?.id || null
  const currency = accounts?.[0]?.currency || 'XOF'

  const { data, isLoading } = useQuery({
    queryKey: ['sales', accountId, status, search, page],
    queryFn: () => salesApi.list(accountId!, { status: status === 'all' ? undefined : status, search, page, limit: 15 }),
    enabled: !!accountId,
  })

  const sales = data?.sales || DEMO_SALES
  const metrics = data?.metrics || DEMO_SALE_METRICS
  const total = data?.total || DEMO_SALES.length
  const totalPages = Math.ceil(total / 15)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            Commandes
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Historique et détail de toutes vos ventes.</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="CA total" value={formatCurrency(metrics.total_revenue, currency)} icon={DollarSign} iconColor="text-primary" loading={isLoading && !!accountId} />
        <MetricCard title="Commandes payées" value={formatNumber(metrics.paid_count)} sub={`${formatNumber(metrics.total_count)} au total`} icon={CheckCircle2} iconColor="text-green-400" loading={isLoading && !!accountId} />
        <MetricCard title="Panier moyen" value={formatCurrency(metrics.avg_order, currency)} icon={TrendingUp} iconColor="text-orange-400" loading={isLoading && !!accountId} />
        <MetricCard title="Produits vendus" value={formatNumber(metrics.items_sold)} icon={Package} iconColor="text-blue-400" loading={isLoading && !!accountId} />
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        {/* Filtres */}
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {(['all', 'paid', 'pending', 'refunded', 'failed'] as StatusFilter[]).map(s => (
              <button key={s} onClick={() => { setStatus(s); setPage(1) }}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  status === s ? 'gradient-brand text-white' : 'hover:bg-secondary text-muted-foreground')}>
                {s === 'all' ? 'Toutes' : STATUS_CONFIG[s]?.label}
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Rechercher une commande…"
              className="h-8 w-56 bg-secondary border border-border rounded-lg pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Commande', 'Client', 'Produit', 'Montant', 'Statut', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.map((s: any) => {
                const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending
                const StatusIcon = cfg.icon
                return (
                  <tr key={s.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-primary">#{s.id?.toString().slice(-6) || '000001'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.customer_name || 'Client'}</p>
                        <p className="text-xs text-muted-foreground">{s.customer_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground truncate max-w-[160px]">{s.product_name || s.items?.[0]?.name || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-foreground">{formatCurrency(s.total || s.amount, currency)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', cfg.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">{formatDate(s.created_at)}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {formatNumber(total)} commandes au total
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 text-sm text-foreground">Page {page} / {totalPages || 1}</span>
            <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const DEMO_SALE_METRICS = { total_revenue: 183850, paid_count: 38, total_count: 41, avg_order: 4484, items_sold: 41 }

const DEMO_SALES = [
  { id: 'cmd_001', customer_name: 'Koffi Amani', customer_email: 'koffi@email.com', product_name: 'FORMATION VENTE DIGITALE', total: 5000, status: 'paid', created_at: '2026-06-23T14:32:00' },
  { id: 'cmd_002', customer_name: 'Marie Bertin', customer_email: 'marie@email.com', product_name: 'Formation CHINE-AFRIQUE', total: 4500, status: 'paid', created_at: '2026-06-23T11:18:00' },
  { id: 'cmd_003', customer_name: 'Yao Ahoussou', customer_email: 'yao@email.com', product_name: 'FORMATION VENTE DIGITALE', total: 5000, status: 'paid', created_at: '2026-06-22T20:14:00' },
  { id: 'cmd_004', customer_name: 'Serge Bamba', customer_email: 'serge@email.com', product_name: 'Formation IA Gemini', total: 2000, status: 'pending', created_at: '2026-06-22T16:52:00' },
  { id: 'cmd_005', customer_name: 'Nadia Aka', customer_email: 'nadia@email.com', product_name: 'FORMATION VENTE DIGITALE', total: 5000, status: 'paid', created_at: '2026-06-22T09:30:00' },
  { id: 'cmd_006', customer_name: 'Estelle Dago', customer_email: 'estelle@email.com', product_name: 'Pack Marketing Digital', total: 7500, status: 'paid', created_at: '2026-06-21T15:00:00' },
  { id: 'cmd_007', customer_name: 'Thomas Kouassi', customer_email: 'thomas@email.com', product_name: 'FORMATION VENTE DIGITALE', total: 5000, status: 'refunded', created_at: '2026-06-20T08:45:00' },
]
