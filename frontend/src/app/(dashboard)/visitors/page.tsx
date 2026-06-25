'use client'

import { useState } from 'react'
import {
  Eye, Globe, Smartphone, Monitor, Tablet,
  TrendingUp, Clock, MousePointer, Wifi,
  ArrowUp, ArrowDown, BarChart2, Users
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { formatNumber, formatPercent, cn } from '@/lib/utils'
import { analyticsApi } from '@/lib/api'
import { useChariowAccounts } from '@/hooks/useChariowAccount'
import { MetricCard } from '@/components/dashboard/metric-card'

const TRAFFIC_COLORS = ['#2563FF', '#8B5CF6', '#10B981', '#EF4444', '#F59E0B', '#6B7280']

type Period = '7d' | '30d' | '90d'

export default function VisitorsPage() {
  const [period, setPeriod] = useState<Period>('30d')

  const { data: accounts, isLoading: accountsLoading } = useChariowAccounts()
  const accountId = accounts?.[0]?.id || null

  const { data, isLoading } = useQuery({
    queryKey: ['visitors', accountId, period],
    queryFn: () => analyticsApi.visitors(accountId!),
    enabled: !!accountId,
  })

  const metrics = data?.metrics || { unique_visitors: 0, page_views: 0, avg_duration: 0, bounce_rate: 0, pages_per_visit: 0 }
  const trend = data?.trend || []
  const sources = data?.sources || []
  const countries = data?.countries || []
  const devices = data?.devices || []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Eye className="w-6 h-6 text-primary" />
            Analytics Visiteurs
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Sources de trafic, appareils, pays et comportements.</p>
        </div>
        <div className="flex items-center gap-1 glass rounded-lg p-1">
          {(['7d', '30d', '90d'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                period === p ? 'gradient-brand text-white' : 'text-muted-foreground hover:text-foreground')}>
              {p === '7d' ? '7 jours' : p === '30d' ? '30 jours' : '90 jours'}
            </button>
          ))}
        </div>
      </div>

      {!accountId && !accountsLoading && (
        <div className="glass rounded-xl p-10 text-center border border-primary/20">
          <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4">
            <Eye className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Aucune boutique connectée</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
            Connectez votre boutique Chariow pour suivre le trafic, les sources et les comportements de vos visiteurs.
          </p>
          <a href="/integrations" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium">
            Connecter Chariow
          </a>
        </div>
      )}

      {(accountId || accountsLoading) && <>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Visiteurs uniques" value={formatNumber(metrics.unique_visitors)} sub="+12% vs période préc." icon={Users} iconColor="text-blue-400" loading={isLoading && !!accountId} />
        <MetricCard title="Pages vues" value={formatNumber(metrics.page_views)} sub={`${metrics.pages_per_visit?.toFixed(1)} pages/visite`} icon={Eye} iconColor="text-primary" loading={isLoading && !!accountId} />
        <MetricCard title="Durée moyenne" value={`${Math.floor(metrics.avg_duration / 60)}m${metrics.avg_duration % 60}s`} sub="Temps sur site" icon={Clock} iconColor="text-green-400" loading={isLoading && !!accountId} />
        <MetricCard title="Taux de rebond" value={formatPercent(metrics.bounce_rate)} sub="-3.2% vs période préc." icon={MousePointer} iconColor="text-orange-400" loading={isLoading && !!accountId} />
      </div>

      {/* Graphique tendance visiteurs */}
      <div className="glass rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Évolution des visiteurs</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trend}>
            <defs>
              <linearGradient id="visitorGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={d => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => formatNumber(v)} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelFormatter={d => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })}
              formatter={(v: any) => [formatNumber(v), 'Visiteurs']}
            />
            <Area type="monotone" dataKey="visitors" stroke="#2563FF" fill="url(#visitorGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Sources + Pays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sources de trafic */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-primary" />
            Sources de trafic
          </h3>
          <div className="flex items-center gap-4">
            <PieChart width={140} height={140}>
              <Pie data={sources} cx={65} cy={65} innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="pct">
                {sources.map((_: any, i: number) => (
                  <Cell key={i} fill={TRAFFIC_COLORS[i % TRAFFIC_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
            <div className="flex-1 space-y-2">
              {sources.map((s: any, i: number) => (
                <div key={s.source} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: TRAFFIC_COLORS[i % TRAFFIC_COLORS.length] }} />
                  <span className="flex-1 text-sm text-foreground">{s.source}</span>
                  <span className="text-sm font-semibold text-foreground">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pays */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            Visiteurs par pays
          </h3>
          <div className="space-y-3">
            {countries.map((c: any) => (
              <div key={c.country} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{c.flag} {c.country}</span>
                  <span className="text-muted-foreground">{formatNumber(c.visitors)} · {c.pct}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full gradient-brand rounded-full" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Appareils + Comportements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Appareils */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary" />
            Répartition par appareil
          </h3>
          <div className="space-y-4">
            {devices.map((d: any) => {
              const Icon = d.device === 'Mobile' ? Smartphone : d.device === 'Desktop' ? Monitor : Tablet
              return (
                <div key={d.device} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground font-medium">{d.device}</span>
                      <span className="text-primary font-bold">{d.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full gradient-brand rounded-full transition-all duration-500" style={{ width: `${d.pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatNumber(d.visitors)} visiteurs</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pages les plus visitées */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            Pages les plus visitées
          </h3>
          <div className="py-6 text-center text-sm text-muted-foreground">
            Synchronisez pour voir les pages les plus visitées.
          </div>
        </div>
      </div>
      </>}
    </div>
  )
}

