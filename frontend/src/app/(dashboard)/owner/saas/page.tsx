'use client'

import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts'
import { ownerApi } from '@/lib/api'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)
const fmtFCFA = (n: number) => `${fmt(n)} FCFA`

interface SaasData {
  users: { total: number; premium: number; free: number; newToday: number; newThisMonth: number; conversionRate: number }
  revenue: { today: number; month: number; year: number; byMonth: { month: string; revenue: number; payments: number }[] }
  subscriptions: {
    expiringSoon: { id: string; email: string; full_name: string; premium_ends: string }[]
    conversionByMonth: { month: string; total: number; converted: number; rate: string }[]
  }
  topCountries: { country: string; count: string; premium_count: string }[]
}

export default function OwnerSaasPage() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session && (session.user as { role?: string })?.role !== 'owner') router.push('/dashboard')
  }, [session, router])

  const { data, isLoading } = useQuery<SaasData>({
    queryKey: ['owner-saas-metrics'],
    queryFn: () => ownerApi.saasMetrics(),
    refetchInterval: 60_000,
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  )

  const d = data!

  const kpis = [
    { label: 'Utilisateurs totaux',    value: fmt(d.users.total),         sub: `+${d.users.newToday} aujourd'hui`,   color: '#1A6EFF' },
    { label: 'Utilisateurs Premium',   value: fmt(d.users.premium),        sub: `${d.users.conversionRate}% conversion`, color: '#10B981' },
    { label: 'Revenus aujourd\'hui',   value: fmtFCFA(d.revenue.today),   sub: 'Paiements confirmés',               color: '#F59E0B' },
    { label: 'Revenus ce mois',        value: fmtFCFA(d.revenue.month),   sub: `+${d.users.newThisMonth} nouveaux`, color: '#8B5CF6' },
    { label: 'Revenus annuels',        value: fmtFCFA(d.revenue.year),    sub: new Date().getFullYear().toString(),  color: '#00C8FF' },
    { label: 'Taux de conversion',     value: `${d.users.conversionRate}%`, sub: 'Gratuit → Premium',               color: '#EC4899' },
  ]

  const CHART_COLORS = { revenue: '#1A6EFF', users: '#10B981', converted: '#F59E0B', rate: '#8B5CF6' }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black gradient-text">Tableau de bord SaaS</h1>
        <p className="text-muted-foreground text-sm mt-1">Vue complète de la plateforme PRO DIGITALIX</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="glass rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
            <p className="text-xl font-black" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenus mensuels */}
      <div className="glass rounded-xl p-5">
        <h2 className="font-bold mb-4">Revenus mensuels (12 mois)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={d.revenue.byMonth}>
            <defs>
              <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.revenue} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.revenue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8 }}
              formatter={(v: number) => [fmtFCFA(v), 'Revenus']}
            />
            <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS.revenue} fill="url(#gRev)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion + Utilisateurs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-5">
          <h2 className="font-bold mb-4">Taux de conversion mensuel</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={d.subscriptions.conversionByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8 }}
                formatter={(v: string) => [`${v}%`, 'Conversion']}
              />
              <Line type="monotone" dataKey="rate" stroke={CHART_COLORS.rate} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-xl p-5">
          <h2 className="font-bold mb-4">Nouveaux vs convertis (mensuel)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={d.subscriptions.conversionByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="total" name="Inscrits" fill={CHART_COLORS.users} radius={[4,4,0,0]} />
              <Bar dataKey="converted" name="Premium" fill={CHART_COLORS.converted} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top pays + Expirations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top pays */}
        <div className="glass rounded-xl p-5">
          <h2 className="font-bold mb-4">Top pays</h2>
          <div className="space-y-3">
            {d.topCountries.map((c, i) => {
              const pct = Math.round((Number(c.count) / d.users.total) * 100)
              return (
                <div key={c.country}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{i + 1}. {c.country}</span>
                    <span className="text-muted-foreground">{fmt(Number(c.count))} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-card rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Abonnements expirant bientôt */}
        <div className="glass rounded-xl p-5">
          <h2 className="font-bold mb-4">
            Expirent dans 30 jours
            <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
              {d.subscriptions.expiringSoon.length}
            </span>
          </h2>
          {d.subscriptions.expiringSoon.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun abonnement expirant bientôt.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {d.subscriptions.expiringSoon.map(u => {
                const days = Math.ceil((new Date(u.premium_ends).getTime() - Date.now()) / 86400000)
                return (
                  <div key={u.id} className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="font-medium">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <span className={`text-xs font-bold ${days <= 7 ? 'text-red-400' : 'text-amber-400'}`}>
                      J-{days}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
