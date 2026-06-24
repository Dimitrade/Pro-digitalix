'use client'
import { TrendingUp } from 'lucide-react'

export default function ForecastsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />Prévisions
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Prévisions de ventes et projections IA — disponible à l'Étape 6.</p>
      </div>
      <div className="glass rounded-xl p-8 text-center">
        <TrendingUp className="w-12 h-12 text-primary mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Module Prévisions en cours de développement.</p>
      </div>
    </div>
  )
}
