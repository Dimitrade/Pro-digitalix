'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatCurrency } from '@/lib/utils'

interface TrendPoint {
  date: string
  revenue: number
  orders: number
}

interface RevenueChartProps {
  data: TrendPoint[]
  currency?: string
  loading?: boolean
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg p-3 text-xs shadow-xl border border-border/80">
      <p className="font-semibold text-foreground mb-2">
        {label && format(parseISO(label), 'dd MMM yyyy', { locale: fr })}
      </p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name === 'revenue' ? 'CA' : 'Commandes'} :</span>
          <span className="font-medium text-foreground">
            {p.name === 'revenue'
              ? formatCurrency(p.value, 'XOF')
              : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function RevenueChart({ data, currency = 'XOF', loading }: RevenueChartProps) {
  if (loading) {
    return (
      <div className="glass rounded-xl p-5">
        <div className="h-4 w-40 bg-secondary rounded animate-pulse mb-4" />
        <div className="h-64 bg-secondary/50 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-foreground">Chiffre d'affaires</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Évolution sur la période</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded bg-primary inline-block" />
            <span className="text-muted-foreground">CA</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded bg-electric-400 inline-block" />
            <span className="text-muted-foreground">Commandes</span>
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(199 89% 48%)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 18%)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(parseISO(d), 'd MMM', { locale: fr })}
            tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="revenue"
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
            tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={45}
          />
          <YAxis
            yAxisId="orders"
            orientation="right"
            tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke="hsl(217 91% 60%)"
            strokeWidth={2}
            fill="url(#gradRevenue)"
            dot={false}
            activeDot={{ r: 5, fill: 'hsl(217 91% 60%)' }}
          />
          <Area
            yAxisId="orders"
            type="monotone"
            dataKey="orders"
            stroke="hsl(199 89% 48%)"
            strokeWidth={2}
            fill="url(#gradOrders)"
            dot={false}
            activeDot={{ r: 4, fill: 'hsl(199 89% 48%)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
