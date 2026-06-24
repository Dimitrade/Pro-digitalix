'use client'

import { useState } from 'react'
import {
  Users, UserPlus, Download, Filter, Search,
  Phone, Mail, ShoppingBag, TrendingUp, ChevronLeft,
  ChevronRight, MoreHorizontal, MessageCircle, Eye,
  Star, Clock, Activity
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency, formatNumber, formatDate, cn } from '@/lib/utils'
import { customersApi } from '@/lib/api'
import { useChariowAccounts } from '@/hooks/useChariowAccount'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/dashboard/metric-card'

type Tab = 'all' | 'active' | 'new' | 'inactive'

const SEGMENT_COLORS: Record<string, string> = {
  active: 'text-green-400 bg-green-400/10',
  new: 'text-blue-400 bg-blue-400/10',
  inactive: 'text-muted-foreground bg-secondary',
  vip: 'text-yellow-400 bg-yellow-400/10',
}

const SEGMENT_LABELS: Record<string, string> = {
  active: 'Actif',
  new: 'Nouveau',
  inactive: 'Inactif',
  vip: 'VIP',
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getAvatarColor(name: string) {
  const colors = [
    'from-blue-500 to-purple-600',
    'from-green-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
    'from-yellow-500 to-orange-600',
  ]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export default function CustomersPage() {
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

  const { data: accounts } = useChariowAccounts()
  const accountId = accounts?.[0]?.id || null
  const currency = accounts?.[0]?.currency || 'XOF'

  const { data, isLoading } = useQuery({
    queryKey: ['customers', accountId, tab, search, page],
    queryFn: () => customersApi.list(accountId!, { search, status: tab === 'all' ? undefined : tab, page, limit: 10 }),
    enabled: !!accountId,
  })

  const customers = data?.customers || DEMO_CUSTOMERS
  const total = data?.total || DEMO_CUSTOMERS.length
  const totalPages = Math.ceil(total / 10)

  const metrics = data?.metrics || DEMO_METRICS

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'Tous les clients' },
    { key: 'active', label: 'Clients actifs' },
    { key: 'new', label: 'Nouveaux clients' },
    { key: 'inactive', label: 'Clients inactifs' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Gestion des clients
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gérez et suivez vos clients au même endroit.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4" />
            Exporter
          </Button>
          <Button variant="gradient" size="sm">
            <UserPlus className="w-4 h-4" />
            Ajouter un client
          </Button>
        </div>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Clients totaux"
          value={formatNumber(metrics.total)}
          sub={`+${metrics.growth_pct}% vs mois dernier`}
          icon={Users}
          iconColor="text-blue-400"
          loading={isLoading && !!accountId}
        />
        <MetricCard
          title="Nouveaux clients"
          value={formatNumber(metrics.new_this_month)}
          sub="+18.3% vs mois dernier"
          icon={UserPlus}
          iconColor="text-green-400"
          loading={isLoading && !!accountId}
        />
        <MetricCard
          title="Clients actifs"
          value={formatNumber(metrics.active)}
          sub="+8.7% vs mois dernier"
          icon={Activity}
          iconColor="text-purple-400"
          loading={isLoading && !!accountId}
        />
        <MetricCard
          title="Valeur vie client (CLV)"
          value={formatCurrency(metrics.avg_ltv, currency)}
          sub="+15.2% vs mois dernier"
          icon={TrendingUp}
          iconColor="text-orange-400"
          loading={isLoading && !!accountId}
        />
      </div>

      <div className="flex gap-4">
        {/* Liste principale */}
        <div className="flex-1 glass rounded-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border px-4 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setPage(1) }}
                className={cn(
                  'px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  tab === t.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Filtres */}
          <div className="p-4 flex items-center gap-3 border-b border-border">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
              Filtrer
            </Button>
            <div className="relative flex-1 max-w-xs ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Rechercher un client…"
                className="w-full h-8 bg-secondary border border-border rounded-lg pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
              Exporter
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Client', 'Email', 'Statut', 'Dépensé', 'Dernière activité', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((c: any) => (
                  <tr
                    key={c.id}
                    className="hover:bg-secondary/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedCustomer(c)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0',
                          getAvatarColor(c.name || c.full_name || '')
                        )}>
                          <span className="text-white text-xs font-bold">
                            {getInitials(c.name || c.full_name || '??')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.name || c.full_name}</p>
                          {c.phone && (
                            <p className="text-xs text-muted-foreground">{c.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground">{c.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        SEGMENT_COLORS[c.segment || 'active'] || SEGMENT_COLORS.active
                      )}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {SEGMENT_LABELS[c.segment || 'active'] || 'Actif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(c.total_spent || 0, currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">
                        {c.last_order_at ? formatDate(c.last_order_at) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        {c.phone && (
                          <a
                            href={`https://wa.me/${c.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg hover:bg-green-400/10 text-green-400 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                        <a
                          href={`mailto:${c.email}`}
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                          title="Envoyer un email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                        <button
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                          onClick={() => setSelectedCustomer(c)}
                          title="Voir profil"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Affichage de {((page - 1) * 10) + 1} à {Math.min(page * 10, total)} sur {formatNumber(total)} clients
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                    page === n ? 'gradient-brand text-white' : 'hover:bg-secondary text-muted-foreground'
                  )}
                >
                  {n}
                </button>
              ))}
              {totalPages > 4 && <span className="text-muted-foreground px-1">…</span>}
              {totalPages > 3 && (
                <button
                  onClick={() => setPage(totalPages)}
                  className="w-8 h-8 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary"
                >
                  {totalPages}
                </button>
              )}
              <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar: Segments + Top clients */}
        <div className="hidden xl:flex flex-col gap-4 w-72">
          {/* Segments */}
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-4">Segments de clients</h3>
            <div className="space-y-2">
              {[
                { label: 'Clients actifs', count: metrics.active, pct: 67.6, color: 'bg-blue-500' },
                { label: 'Nouveaux', count: metrics.new_this_month, pct: 9.9, color: 'bg-green-500' },
                { label: 'Inactifs', count: Math.round(metrics.total * 0.125), pct: 12.5, color: 'bg-purple-500' },
                { label: 'Fidèles', count: Math.round(metrics.total * 0.078), pct: 7.8, color: 'bg-yellow-500' },
                { label: 'Autres', count: Math.round(metrics.total * 0.022), pct: 2.2, color: 'bg-muted' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2 text-sm">
                  <span className={cn('w-2 h-2 rounded-full flex-shrink-0', s.color)} />
                  <span className="flex-1 text-foreground">{s.label}</span>
                  <span className="text-muted-foreground">{formatNumber(s.count)}</span>
                  <span className="text-muted-foreground w-12 text-right">({s.pct}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top clients */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Top clients par dépenses</h3>
            </div>
            <div className="space-y-3">
              {customers.slice(0, 5).map((c: any, i: number) => (
                <div key={c.id} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                  <div className={cn(
                    'w-7 h-7 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0',
                    getAvatarColor(c.name || c.full_name || '')
                  )}>
                    <span className="text-white text-[10px] font-bold">
                      {getInitials(c.name || c.full_name || '??')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{c.name || c.full_name}</p>
                  </div>
                  <p className="text-xs font-bold text-primary flex-shrink-0">
                    {formatCurrency(c.total_spent || 0, currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-3">Actions rapides</h3>
            <div className="space-y-2">
              {[
                { icon: UserPlus, label: 'Ajouter un client', color: 'text-primary' },
                { icon: Download, label: 'Importer des clients', color: 'text-green-400' },
                { icon: Mail, label: 'Inviter par email', color: 'text-blue-400' },
              ].map(a => (
                <button key={a.label} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary text-sm text-foreground transition-colors">
                  <a.icon className={cn('w-4 h-4', a.color)} />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Panneau client sélectionné */}
      {selectedCustomer && (
        <CustomerDrawer
          customer={selectedCustomer}
          currency={currency}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  )
}

function CustomerDrawer({ customer: c, currency, onClose }: { customer: any; currency: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-card border-l border-border h-full overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg text-foreground">Profil client</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">✕</button>
        </div>

        {/* Avatar + nom */}
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xl font-bold',
            getAvatarColor(c.name || c.full_name || '')
          )}>
            {getInitials(c.name || c.full_name || '??')}
          </div>
          <div>
            <p className="font-semibold text-foreground">{c.name || c.full_name}</p>
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1',
              SEGMENT_COLORS[c.segment || 'active']
            )}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {SEGMENT_LABELS[c.segment || 'active']}
            </span>
          </div>
        </div>

        {/* Contacts */}
        <div className="glass rounded-xl p-4 space-y-2">
          <a href={`mailto:${c.email}`} className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors">
            <Mail className="w-4 h-4 text-primary" />{c.email}
          </a>
          {c.phone && (
            <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-2.5 text-sm text-foreground hover:text-green-400 transition-colors">
              <MessageCircle className="w-4 h-4 text-green-400" />{c.phone}
            </a>
          )}
          {c.country && (
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <span>🌍</span>{c.country}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total dépensé', value: formatCurrency(c.total_spent || 0, currency), icon: ShoppingBag, color: 'text-primary' },
            { label: 'Commandes', value: formatNumber(c.total_orders || 0), icon: ShoppingBag, color: 'text-green-400' },
            { label: 'Panier moyen', value: formatCurrency(c.total_orders ? (c.total_spent / c.total_orders) : 0, currency), icon: TrendingUp, color: 'text-orange-400' },
            { label: 'Client depuis', value: c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '—', icon: Clock, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="glass rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={cn('font-bold text-sm', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Historique achats */}
        <div>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Historique des achats
          </h3>
          <div className="space-y-2">
            {(c.orders || DEMO_ORDERS).map((o: any, i: number) => (
              <div key={i} className="glass rounded-lg p-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{o.product_name || o.name}</p>
                  <p className="text-xs text-muted-foreground">{o.created_at ? formatDate(o.created_at) : '—'}</p>
                </div>
                <p className="text-sm font-bold text-primary flex-shrink-0">
                  {formatCurrency(o.total || o.amount || 0, currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Données de démo
const DEMO_METRICS = { total: 1017, new_this_month: 36, active: 687, avg_ltv: 4484, growth_pct: 12.5 }
const DEMO_ORDERS = [
  { name: 'FORMATION VENTE DIGITALE', created_at: '2026-06-20', amount: 5000 },
  { name: 'Formation achat CHINE', created_at: '2026-05-10', amount: 4500 },
]
const DEMO_CUSTOMERS = [
  { id: '1', full_name: 'Koffi Amani', email: 'koffi.amani@email.com', phone: '+22890112233', total_spent: 245000, total_orders: 8, segment: 'vip', last_order_at: '2026-06-22', country: 'Togo', created_at: '2025-01-15' },
  { id: '2', full_name: 'Marie Bertin', email: 'marie.bertin@email.com', phone: '+22996112233', total_spent: 185000, total_orders: 6, segment: 'active', last_order_at: '2026-06-21', country: 'Bénin', created_at: '2025-03-10' },
  { id: '3', full_name: 'Yao Ahoussou', email: 'yao.ahoussou@email.com', phone: '+22507112233', total_spent: 320000, total_orders: 11, segment: 'vip', last_order_at: '2026-06-20', country: 'Côte d\'Ivoire', created_at: '2024-11-05' },
  { id: '4', full_name: 'Serge Bamba', email: 'serge.bamba@email.com', phone: '+22507445566', total_spent: 75000, total_orders: 2, segment: 'inactive', last_order_at: '2026-05-08', country: 'Côte d\'Ivoire', created_at: '2025-05-20' },
  { id: '5', full_name: 'Nadia Aka', email: 'nadia.aka@email.com', phone: '+22507778899', total_spent: 130000, total_orders: 4, segment: 'active', last_order_at: '2026-06-22', country: 'Côte d\'Ivoire', created_at: '2025-04-12' },
  { id: '6', full_name: 'Fabrice Ouattara', email: 'fabrice.ouattara@email.com', total_spent: 45000, total_orders: 1, segment: 'inactive', last_order_at: '2026-04-15', country: 'Côte d\'Ivoire', created_at: '2026-03-01' },
  { id: '7', full_name: 'Estelle Dago', email: 'estelle.dago@email.com', phone: '+22507334455', total_spent: 210000, total_orders: 7, segment: 'active', last_order_at: '2026-06-23', country: 'Côte d\'Ivoire', created_at: '2024-09-18' },
  { id: '8', full_name: 'Thomas Kouassi', email: 'thomas.kouassi@email.com', phone: '+22507556677', total_spent: 165000, total_orders: 5, segment: 'active', last_order_at: '2026-06-19', country: 'Côte d\'Ivoire', created_at: '2025-02-14' },
]
