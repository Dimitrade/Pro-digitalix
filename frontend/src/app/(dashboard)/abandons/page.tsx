'use client'

import { useState } from 'react'
import {
  ShoppingCart, AlertTriangle, Brain, Mail,
  MessageCircle, TrendingDown, Clock, DollarSign,
  BarChart2, Zap, ChevronRight, RefreshCw
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency, formatNumber, formatPercent, formatDate, cn } from '@/lib/utils'
import { analyticsApi } from '@/lib/api'
import { useChariowAccounts } from '@/hooks/useChariowAccount'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/dashboard/metric-card'

export default function AbandonsPage() {
  const [selectedAbandon, setSelectedAbandon] = useState<any>(null)

  const { data: accounts } = useChariowAccounts()
  const accountId = accounts?.[0]?.id || null
  const currency = accounts?.[0]?.currency || 'XOF'

  const { data, isLoading } = useQuery({
    queryKey: ['abandons', accountId],
    queryFn: () => analyticsApi.dashboard(accountId!),
    enabled: !!accountId,
  })

  const metrics = data?.abandons || DEMO_METRICS
  const abandons = DEMO_ABANDONS
  const trend = DEMO_TREND

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-orange-400" />
            Abandons de panier
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Récupérez les ventes perdues grâce aux relances automatiques.
          </p>
        </div>
        <Button variant="gradient" size="sm">
          <Zap className="w-4 h-4" />
          Activer relance auto
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Taux d'abandon"
          value={formatPercent(metrics.abandon_rate)}
          sub="Moyenne secteur : 70%"
          icon={TrendingDown}
          iconColor="text-red-400"
          loading={isLoading && !!accountId}
        />
        <MetricCard
          title="Paniers abandonnés"
          value={formatNumber(metrics.total_abandoned)}
          sub="Ce mois"
          icon={ShoppingCart}
          iconColor="text-orange-400"
          loading={isLoading && !!accountId}
        />
        <MetricCard
          title="Valeur perdue"
          value={formatCurrency(metrics.lost_revenue, currency)}
          sub="Récupérable : ~30%"
          icon={DollarSign}
          iconColor="text-red-400"
          loading={isLoading && !!accountId}
        />
        <MetricCard
          title="Récupéré (relances)"
          value={formatCurrency(metrics.recovered_revenue, currency)}
          sub={`${metrics.recovery_rate}% taux récupération`}
          icon={RefreshCw}
          iconColor="text-green-400"
          loading={isLoading && !!accountId}
        />
      </div>

      {/* Graphique + Suggestions IA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Graphique tendance abandons */}
        <div className="glass rounded-xl p-5 lg:col-span-2">
          <h3 className="font-semibold text-foreground mb-4">Évolution des abandons (30j)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="abandonGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={d => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                formatter={(v: any) => [v, 'Abandons']}
              />
              <Area type="monotone" dataKey="count" stroke="#EF4444" fill="url(#abandonGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Suggestions IA */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            Suggestions IA
          </h3>
          <div className="space-y-3">
            {AI_SUGGESTIONS.map((s, i) => (
              <div key={i} className={cn('p-3 rounded-xl border', s.color)}>
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">{s.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">{s.body}</p>
                <button className="mt-2 text-xs font-medium text-primary hover:underline flex items-center gap-1">
                  Configurer <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Liste abandons */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Paniers abandonnés récents</h3>
          <span className="text-xs text-muted-foreground">{abandons.length} ce mois</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Client', 'Produit', 'Valeur', 'Abandonné', 'Étape', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {abandons.map((a: any) => (
                <tr key={a.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.customer_name || 'Visiteur anonyme'}</p>
                      {a.customer_email && (
                        <p className="text-xs text-muted-foreground">{a.customer_email}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-foreground truncate max-w-[200px]">{a.product_name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-red-400">{formatCurrency(a.value, currency)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDate(a.abandoned_at)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StepBadge step={a.step} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {a.customer_email && (
                        <button
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                          title="Envoyer email de relance"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      )}
                      {a.customer_phone && (
                        <a
                          href={`https://wa.me/${a.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ! Vous avez laissé "${a.product_name}" dans votre panier. Voici votre lien de commande : `)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg hover:bg-green-400/10 text-green-400 transition-colors"
                          title="Relancer sur WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Produits les plus abandonnés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            Produits les plus abandonnés
          </h3>
          <div className="space-y-3">
            {TOP_ABANDONED_PRODUCTS.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-red-400/20 flex items-center justify-center text-xs font-bold text-red-400">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.count} abandons</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-400">{formatCurrency(p.lost, currency)}</p>
                  <p className="text-xs text-muted-foreground">perdu</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            Étapes d'abandon
          </h3>
          <div className="space-y-3">
            {ABANDON_STEPS.map(s => (
              <div key={s.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{s.label}</span>
                  <span className="text-muted-foreground">{s.pct}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StepBadge({ step }: { step: string }) {
  const map: Record<string, { label: string; color: string }> = {
    view: { label: 'Vue produit', color: 'text-blue-400 bg-blue-400/10' },
    add_to_cart: { label: 'Ajout panier', color: 'text-orange-400 bg-orange-400/10' },
    checkout: { label: 'Checkout', color: 'text-yellow-400 bg-yellow-400/10' },
    payment: { label: 'Paiement', color: 'text-red-400 bg-red-400/10' },
  }
  const s = map[step] || { label: step, color: 'text-muted-foreground bg-secondary' }
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', s.color)}>
      {s.label}
    </span>
  )
}

// Données démo
const DEMO_METRICS = {
  abandon_rate: 78.4, total_abandoned: 342,
  lost_revenue: 1534800, recovered_revenue: 45000, recovery_rate: 2.9
}

const DEMO_TREND = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 864e5).toISOString().split('T')[0],
  count: Math.floor(5 + Math.random() * 25),
}))

const DEMO_ABANDONS = [
  { id: '1', customer_name: 'Koffi A.', customer_email: 'koffi@email.com', customer_phone: '+22890112233', product_name: 'FORMATION VENTE DES PRODUITS DIGITAUX', value: 5000, abandoned_at: '2026-06-23T14:32:00', step: 'payment' },
  { id: '2', customer_name: 'Marie B.', customer_email: 'marie@email.com', customer_phone: '+22996112233', product_name: 'Formation achat CHINE-AFRIQUE', value: 4500, abandoned_at: '2026-06-23T11:18:00', step: 'checkout' },
  { id: '3', customer_name: null, customer_email: null, customer_phone: null, product_name: 'Formation IA Gemini', value: 2000, abandoned_at: '2026-06-23T09:45:00', step: 'add_to_cart' },
  { id: '4', customer_name: 'Yao A.', customer_email: 'yao@email.com', customer_phone: null, product_name: 'FORMATION VENTE DES PRODUITS DIGITAUX', value: 5000, abandoned_at: '2026-06-22T20:14:00', step: 'payment' },
  { id: '5', customer_name: 'Serge B.', customer_email: 'serge@email.com', customer_phone: '+22507445566', product_name: 'Pack Marketing Digital', value: 7500, abandoned_at: '2026-06-22T16:52:00', step: 'checkout' },
]

const TOP_ABANDONED_PRODUCTS = [
  { name: 'FORMATION VENTE DES PRODUITS DIGITAUX', count: 98, lost: 490000 },
  { name: 'Pack Marketing Digital Afrique', count: 67, lost: 502500 },
  { name: 'Formation achat CHINE-AFRIQUE', count: 54, lost: 243000 },
  { name: 'Formation IA Gemini', count: 43, lost: 86000 },
]

const ABANDON_STEPS = [
  { label: 'Vue produit sans action', pct: 45, color: '#6B7280' },
  { label: 'Ajout panier sans checkout', pct: 22, color: '#F59E0B' },
  { label: 'Checkout sans paiement', pct: 18, color: '#EF4444' },
  { label: 'Paiement échoué', pct: 15, color: '#DC2626' },
]

const AI_SUGGESTIONS = [
  { icon: Mail, title: 'Email de relance J+1', color: 'bg-primary/5 border-primary/20 text-primary', body: 'Envoyez un email automatique 24h après l\'abandon avec un lien direct de paiement.' },
  { icon: MessageCircle, title: 'WhatsApp relance', color: 'bg-green-400/5 border-green-400/20 text-green-400', body: 'Message WhatsApp personnalisé pour les clients identifiés avec numéro de téléphone.' },
  { icon: Zap, title: 'Offre urgence -10%', color: 'bg-orange-400/5 border-orange-400/20 text-orange-400', body: 'Proposez une réduction de 10% valable 48h pour convertir les hésitants.' },
]
