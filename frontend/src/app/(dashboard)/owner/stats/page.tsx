'use client'

import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Users, Sparkles, DollarSign, RefreshCw, Crown, AlertTriangle } from 'lucide-react'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'

interface Stats {
  total_users: number; premium_users: number; free_users: number
  new_this_month: number; suspended_users: number
  month_revenue: number; year_revenue: number
  month_payments: number; total_payments: number; conversion_rate: number
}

interface GrowthRow { month: string; users: string; revenue: string; premium: string }

export default function OwnerStatsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['owner-stats'],
    queryFn: () => api.get('/owner/stats').then(r => r.data as {
      stats: Stats; growth: GrowthRow[]; expiring_soon: { email: string; premium_ends: string }[]
    }),
    staleTime: 60_000,
  })

  const s = data?.stats
  const growth = (data?.growth ?? []).map(r => ({
    month: r.month.slice(5),
    users: Number(r.users),
    revenue: Number(r.revenue),
    premium: Number(r.premium),
  }))

  const fmt = (n: number) => n.toLocaleString('fr-FR')

  const kpis = s ? [
    { label: 'Total utilisateurs', value: fmt(s.total_users), icon: Users, color: 'text-blue-400' },
    { label: 'Abonnés PREMIUM', value: fmt(s.premium_users), icon: Sparkles, color: 'text-primary' },
    { label: 'Revenus ce mois', value: `${fmt(s.month_revenue)} FCFA`, icon: DollarSign, color: 'text-green-400' },
    { label: 'Revenus annuels', value: `${fmt(s.year_revenue)} FCFA`, icon: TrendingUp, color: 'text-yellow-400' },
    { label: 'Taux conversion', value: `${s.conversion_rate}%`, icon: RefreshCw, color: 'text-purple-400' },
    { label: 'Nouveaux ce mois', value: fmt(s.new_this_month), icon: Crown, color: 'text-orange-400' },
  ] : []

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">Revenus & Statistiques</h1>
            <p className="text-sm text-muted-foreground">Vision globale de la plateforme PRO DIGITALIX</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 animate-pulse h-24" />
        )) : kpis.map(k => (
          <div key={k.label} className="glass rounded-xl p-4 metric-card">
            <div className="flex items-center gap-2 mb-2">
              <k.icon className={`w-4 h-4 ${k.color}`} />
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </div>
            <p className="text-xl font-black text-foreground">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Croissance utilisateurs */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-bold text-foreground mb-4 text-sm">Croissance utilisateurs (12 mois)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={growth}>
              <defs>
                <linearGradient id="gu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1A6EFF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#1A6EFF" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C8FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00C8FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" stroke="#475569" tick={{ fontSize: 10 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="users" stroke="#1A6EFF" fill="url(#gu)" name="Total" strokeWidth={2} />
              <Area type="monotone" dataKey="premium" stroke="#00C8FF" fill="url(#gp)" name="Premium" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenus */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-bold text-foreground mb-4 text-sm">Revenus mensuels (FCFA)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={growth}>
              <defs>
                <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1A6EFF" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#1A6EFF" stopOpacity={0.4}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" stroke="#475569" tick={{ fontSize: 10 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 8, fontSize: 11 }}
                formatter={(v: number) => [`${v.toLocaleString('fr-FR')} FCFA`, 'Revenus']}
              />
              <Bar dataKey="revenue" fill="url(#gr)" radius={[4,4,0,0]} name="Revenus" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expirations imminentes */}
      {(data?.expiring_soon?.length ?? 0) > 0 && (
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <h3 className="font-bold text-foreground text-sm">Expirations dans 30 jours</h3>
          </div>
          <div className="space-y-2">
            {data!.expiring_soon.map(u => (
              <div key={u.email} className="flex items-center justify-between text-sm py-1 border-b border-border/30">
                <span className="text-foreground">{u.email}</span>
                <span className="text-orange-400 text-xs">{new Date(u.premium_ends).toLocaleDateString('fr-FR')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
