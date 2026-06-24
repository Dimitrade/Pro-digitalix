'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Check, Lock, Sparkles, Crown, Calendar, Clock, Tag, ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useSubscription } from '@/hooks/useSubscription'
import api from '@/lib/api'
import toast from 'react-hot-toast'

const CHECKOUT_URL = 'https://anabokgroup.online/prd_y2htjbxf/checkout'

const FREE_OK = [
  'Dashboard principal', 'Suivi des ventes', 'Notifications intelligentes',
  'CRM basique', 'Analytics basiques', '1 compte Chariow',
]

const PREMIUM_LOCKED = [
  'Assistant IA complet', 'Prévisions de ventes', 'Rapports PDF avancés',
  'Export Excel', 'Export CSV', 'Segmentation IA',
  'Analyse visiteurs avancée', 'Analyse produits avancée',
  'Recommandations marketing IA', 'Historique illimité',
]

const PREMIUM_FEATURES = [
  ...FREE_OK,
  ...PREMIUM_LOCKED,
]

export default function SubscriptionPage() {
  const { data, isLoading, plan, isPremium, isOwner, daysLeft } = useSubscription()
  const [promoCode, setPromoCode] = useState('')
  const [showPromo, setShowPromo] = useState(false)

  const applyPromo = useMutation({
    mutationFn: () => api.post('/promo/apply', { code: promoCode }).then(r => r.data),
    onSuccess: (d: { message: string }) => {
      toast.success(d.message || 'Code appliqué !')
      setPromoCode('')
      setShowPromo(false)
      window.location.reload()
    },
    onError: (e: { response?: { data?: { error?: string } } }) => {
      toast.error(e.response?.data?.error || 'Code invalide.')
    },
  })

  if (isLoading) return <div className="p-6"><div className="animate-pulse space-y-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-16 glass rounded-xl"/>)}</div></div>

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header plan */}
      <div className="glass rounded-2xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isOwner ? 'bg-yellow-400/10' : isPremium ? 'gradient-brand' : 'bg-secondary'
            }`}>
              {isOwner ? <Crown className="w-6 h-6 text-yellow-400" />
                : isPremium ? <Sparkles className="w-6 h-6 text-white" />
                : <Sparkles className="w-6 h-6 text-muted-foreground" />}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Votre plan actuel</p>
              <h1 className="text-2xl font-black text-foreground">
                {isOwner ? 'OWNER' : isPremium ? 'PREMIUM' : 'GRATUIT'}
              </h1>
            </div>
          </div>
          {(isPremium || isOwner) && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-green-400/10 text-green-400">Actif</span>
          )}
        </div>

        {/* Infos abonnement */}
        {isPremium && !isOwner && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {data?.premium_at && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Activation</p>
                  <p className="text-xs font-medium text-foreground">
                    {new Date(data.premium_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}
            {data?.premium_ends && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Expiration</p>
                  <p className="text-xs font-medium text-foreground">
                    {new Date(data.premium_ends).getFullYear() > 9000
                      ? '∞ À vie'
                      : new Date(data.premium_ends).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        {isPremium && daysLeft !== null && daysLeft <= 30 && !isOwner && (
          <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-orange-400" style={{ width: `${Math.min(100,(daysLeft/365)*100)}%` }} />
          </div>
        )}
        {isPremium && daysLeft !== null && daysLeft <= 30 && (
          <p className="text-xs text-orange-400 mt-1">⚠️ Expire dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Fonctionnalités */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-bold text-foreground mb-4">Fonctionnalités disponibles</h2>

        {/* Free OK */}
        <div className="space-y-2 mb-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Inclus dans votre plan</p>
          {FREE_OK.map(f => (
            <div key={f} className="flex items-center gap-2 text-sm">
              <div className="w-5 h-5 rounded-full bg-green-400/10 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-green-400" />
              </div>
              <span className="text-foreground">{f}</span>
            </div>
          ))}
        </div>

        {/* Premium locked ou débloqué */}
        {!isPremium && !isOwner && (
          <>
            <div className="border-t border-border/50 my-4" />
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Fonctionnalités PREMIUM verrouillées
            </p>
            <div className="space-y-2">
              {PREMIUM_LOCKED.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <Lock className="w-3 h-3 text-muted-foreground/50" />
                  </div>
                  <span className="text-muted-foreground/60">{f}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {(isPremium || isOwner) && (
          <>
            <div className="border-t border-border/50 my-4" />
            <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-2">
              Fonctionnalités PREMIUM débloquées
            </p>
            <div className="space-y-2">
              {PREMIUM_LOCKED.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full gradient-brand flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-foreground">{f}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* CTA upgrade */}
      {!isPremium && !isOwner && (
        <div className="rounded-2xl p-[2px] gradient-brand">
          <div className="bg-card rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">Passez au PREMIUM</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Débloquez toutes les fonctionnalités pour <span className="text-primary font-bold">10 000 FCFA</span> / 12 mois
              </p>
            </div>
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer" className="block">
              <Button variant="gradient" size="lg" className="w-full gap-2">
                <Sparkles className="w-4 h-4" />
                PASSER AU PREMIUM
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <p className="text-[10px] text-muted-foreground">
              Paiement sécurisé · Activation instantanée · Orange Money / Wave / MTN
            </p>

            {/* Code promo */}
            <button onClick={() => setShowPromo(!showPromo)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mx-auto transition-colors">
              <Tag className="w-3.5 h-3.5" />
              J'ai un code promotionnel
            </button>
            {showPromo && (
              <div className="flex gap-2">
                <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="CODE PROMO"
                  className="flex-1 h-9 px-3 bg-secondary border border-border rounded-lg text-sm font-mono tracking-widest text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                <Button variant="gradient" size="sm" onClick={() => applyPromo.mutate()} loading={applyPromo.isPending}>
                  Appliquer
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Renouveler si expire bientôt */}
      {isPremium && !isOwner && daysLeft !== null && daysLeft <= 60 && (
        <div className="glass rounded-xl p-5 border border-orange-400/20 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-foreground text-sm">Renouveler votre abonnement</p>
            <p className="text-xs text-muted-foreground mt-0.5">Expire dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}</p>
          </div>
          <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="gradient" size="sm" className="gap-2">
              <RefreshIcon />
              Renouveler
            </Button>
          </a>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Développé par <span className="text-foreground font-medium">ANABOK GROUP</span> •{' '}
        <a href="mailto:anabokgroup@gmail.com" className="text-primary hover:underline">Support</a>
      </p>
    </div>
  )
}

function RefreshIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
}
