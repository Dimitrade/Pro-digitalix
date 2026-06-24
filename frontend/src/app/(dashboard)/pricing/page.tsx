'use client'

import { Check, X, Sparkles, Crown, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSubscription } from '@/hooks/useSubscription'

const CHECKOUT_URL = 'https://anabokgroup.online/prd_y2htjbxf/checkout'

const FREE_FEATURES = [
  { label: 'Dashboard principal', ok: true },
  { label: 'CRM basique', ok: true },
  { label: 'Analytics basiques', ok: true },
  { label: '1 compte Chariow', ok: true },
  { label: 'Historique 30 jours', ok: true },
  { label: 'Notifications intelligentes', ok: true },
  { label: 'Notifications ventes & clients', ok: true },
  { label: 'Historique illimité', ok: false },
  { label: 'CRM avancé + segmentation IA', ok: false },
  { label: 'Assistant IA complet', ok: false },
  { label: 'Rapports PDF avancés', ok: false },
  { label: 'Export Excel & CSV', ok: false },
  { label: 'Prévisions de ventes IA', ok: false },
  { label: 'Analyse visiteurs avancée', ok: false },
  { label: 'Recommandations marketing IA', ok: false },
  { label: 'Support prioritaire', ok: false },
]

const PREMIUM_FEATURES = [
  { label: 'Dashboard principal', ok: true },
  { label: 'CRM basique', ok: true },
  { label: 'Analytics basiques', ok: true },
  { label: '1 compte Chariow', ok: true },
  { label: 'Historique 30 jours', ok: true },
  { label: 'Notifications intelligentes', ok: true },
  { label: 'Notifications ventes & clients', ok: true },
  { label: 'Historique illimité', ok: true },
  { label: 'CRM avancé + segmentation IA', ok: true },
  { label: 'Assistant IA complet', ok: true },
  { label: 'Rapports PDF avancés', ok: true },
  { label: 'Export Excel & CSV', ok: true },
  { label: 'Prévisions de ventes IA', ok: true },
  { label: 'Analyse visiteurs avancée', ok: true },
  { label: 'Recommandations marketing IA', ok: true },
  { label: 'Support prioritaire', ok: true },
]

export default function PricingPage() {
  const { plan, isPremium, isOwner, daysLeft, data } = useSubscription()

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-primary mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Tarification transparente
        </div>
        <h1 className="text-3xl font-black text-foreground">
          Choisissez votre <span className="gradient-text">plan</span>
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Démarrez gratuitement. Passez au Premium quand vous êtes prêt à booster vos ventes.
        </p>
      </div>

      {/* Abonnement actuel */}
      {(isPremium || isOwner) && (
        <div className="glass rounded-xl p-4 flex items-center justify-between border border-primary/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center">
              {isOwner ? <Crown className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />}
            </div>
            <div>
              <p className="font-bold text-foreground">
                {isOwner ? 'Compte OWNER — Accès illimité à vie' : 'Abonnement PREMIUM actif'}
              </p>
              {!isOwner && data?.premium_ends && (
                <p className="text-sm text-muted-foreground">
                  Expire le {new Date(data.premium_ends).toLocaleDateString('fr-FR')}
                  {daysLeft !== null && ` · ${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`}
                </p>
              )}
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-400/10 text-green-400">Actif</span>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan Gratuit */}
        <div className={cn(
          'glass rounded-2xl p-6 border relative flex flex-col',
          plan === 'free' ? 'border-border' : 'border-border/50 opacity-80'
        )}>
          {plan === 'free' && (
            <span className="absolute -top-3 left-6 text-xs font-bold px-3 py-1 rounded-full bg-secondary text-muted-foreground">
              Plan actuel
            </span>
          )}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-black text-foreground">GRATUIT</h2>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-foreground">0</span>
              <span className="text-muted-foreground font-medium">FCFA</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pour toujours</p>
          </div>

          <ul className="space-y-2.5 flex-1 mb-6">
            {FREE_FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-2.5 text-sm">
                {f.ok
                  ? <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  : <X className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                }
                <span className={f.ok ? 'text-foreground' : 'text-muted-foreground/60 line-through'}>{f.label}</span>
              </li>
            ))}
          </ul>

          <Button variant="outline" className="w-full" disabled>
            {plan === 'free' ? 'Plan actuel' : 'Plan de base'}
          </Button>
        </div>

        {/* Plan Premium */}
        <div className="rounded-2xl p-[2px] gradient-brand relative flex flex-col">
          <div className="bg-card rounded-2xl p-6 flex flex-col h-full">
            <span className="absolute -top-3 left-6 text-xs font-bold px-3 py-1 rounded-full gradient-brand text-white">
              ⭐ RECOMMANDÉ
            </span>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-black gradient-text">PREMIUM</h2>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-foreground">10 000</span>
                <span className="text-muted-foreground font-medium">FCFA</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">12 mois · Soit 833 FCFA/mois</p>
            </div>

            <ul className="space-y-2.5 flex-1 mb-6">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-foreground">{f.label}</span>
                </li>
              ))}
            </ul>

            {isPremium || isOwner ? (
              <Button variant="outline" className="w-full" disabled>
                {isOwner ? 'Accès illimité OWNER' : 'Déjà abonné'}
              </Button>
            ) : (
              <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button variant="gradient" size="lg" className="w-full gap-2">
                  <Sparkles className="w-4 h-4" />
                  PASSER AU PREMIUM
                </Button>
              </a>
            )}

            <p className="text-center text-[10px] text-muted-foreground mt-3">
              Paiement sécurisé · Activation instantanée · Orange Money / Wave / MTN disponibles
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="font-bold text-foreground">Questions fréquentes</h3>
        {[
          { q: 'Comment fonctionne l\'activation ?', a: 'Dès que votre paiement est validé, votre compte est automatiquement passé en PREMIUM. Vous recevez une notification de confirmation.' },
          { q: 'Que se passe-t-il à l\'expiration ?', a: 'Votre compte repasse en plan GRATUIT. Toutes vos données sont conservées. Vous pouvez renouveler à tout moment.' },
          { q: 'Quels moyens de paiement sont acceptés ?', a: 'Orange Money, Wave, MTN Mobile Money et tous les moyens de paiement acceptés par Chariow.' },
          { q: 'Y a-t-il un remboursement possible ?', a: 'Contactez le support ANABOK GROUP dans les 7 jours suivant l\'achat.' },
        ].map(({ q, a }) => (
          <details key={q} className="group">
            <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-foreground py-2 border-b border-border/50">
              {q}
              <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="text-sm text-muted-foreground pt-3 pb-1">{a}</p>
          </details>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Développé par <span className="text-foreground font-medium">ANABOK GROUP</span> •{' '}
        <a href="mailto:anabokgroup@gmail.com" className="text-primary hover:underline">anabokgroup@gmail.com</a>
      </p>
    </div>
  )
}
