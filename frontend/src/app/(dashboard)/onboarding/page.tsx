'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STEPS = [
  {
    id: 'connect',
    title: 'Connecter votre boutique Chariow',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
    steps: [
      { n: 1, text: 'Allez dans votre boutique Chariow → Paramètres → API' },
      { n: 2, text: 'Copiez votre clé API et votre ID boutique' },
      { n: 3, text: 'Dans PRO DIGITALIX → Paramètres → Intégration Chariow' },
      { n: 4, text: 'Collez vos informations et cliquez sur "Connecter"' },
      { n: 5, text: 'Attendez la première synchronisation (2-5 minutes)' },
    ],
    link: { href: '/integrations', label: 'Aller à l\'intégration →' },
    color: '#1A6EFF',
    tip: 'La clé API Chariow se trouve dans Paramètres → Développeurs → Clés API',
  },
  {
    id: 'dashboard',
    title: 'Comprendre le Dashboard',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    steps: [
      { n: 1, text: 'Les 4 KPI en haut : Ventes, Commandes, Panier moyen, Clients' },
      { n: 2, text: 'Le graphe de revenus montre l\'évolution sur 7/30/90 jours' },
      { n: 3, text: 'Les produits tendance identifient vos best-sellers automatiquement' },
      { n: 4, text: 'Les alertes paniers abandonnés apparaissent en temps réel' },
      { n: 5, text: 'Filtrez par période avec les boutons en haut à droite' },
    ],
    link: { href: '/dashboard', label: 'Voir le Dashboard →' },
    color: '#10B981',
    tip: 'Les données se mettent à jour toutes les 15 minutes depuis Chariow',
  },
  {
    id: 'crm',
    title: 'Comprendre le CRM Clients',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    steps: [
      { n: 1, text: 'La liste clients affiche tous vos acheteurs Chariow importés' },
      { n: 2, text: 'Cliquez sur un client pour voir ses commandes et l\'historique' },
      { n: 3, text: 'Utilisez la recherche pour trouver un client par nom ou email' },
      { n: 4, text: 'Les segments automatiques : Nouveaux, Réguliers, VIP, À risque' },
      { n: 5, text: 'Exportez votre base clients en Excel pour vos campagnes marketing' },
    ],
    link: { href: '/customers', label: 'Voir le CRM →' },
    color: '#8B5CF6',
    tip: 'Un client VIP = 3+ commandes ou panier moyen > 50 000 FCFA',
  },
  {
    id: 'analytics',
    title: 'Comprendre Analytics',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    steps: [
      { n: 1, text: 'Analytics Produits : ventes, stock, tendances par produit' },
      { n: 2, text: 'Analytics Visiteurs : sessions, pages vues, taux de rebond (Pixel)' },
      { n: 3, text: 'Abandons Panier : liste en temps réel avec montant et contacts' },
      { n: 4, text: 'Prévisions : projections sur 30/90 jours basées sur l\'historique' },
      { n: 5, text: 'Assistant IA : posez des questions sur vos performances en langage naturel' },
    ],
    link: { href: '/products', label: 'Voir Analytics →' },
    color: '#F59E0B',
    tip: 'Installez le pixel de tracking sur votre boutique pour les données visiteurs',
  },
  {
    id: 'premium',
    title: 'Comprendre les plans',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    steps: [
      { n: 1, text: 'Plan GRATUIT : Dashboard de base, 1 boutique, données 30 jours' },
      { n: 2, text: 'Plan PREMIUM (10 000 FCFA/an) : toutes les fonctionnalités illimitées' },
      { n: 3, text: 'Paiement sécurisé via Chariow — activation automatique en 5 minutes' },
      { n: 4, text: 'Code promo : entrez votre code dans Mon Abonnement pour une réduction' },
      { n: 5, text: 'Renouvellement manuel ou automatique selon les mises à jour' },
    ],
    link: { href: '/pricing', label: 'Voir les tarifs →' },
    color: '#EC4899',
    tip: 'Le plan Premium s\'active en moins de 5 minutes après votre paiement',
  },
]

export default function OnboardingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [active, setActive] = useState(0)
  const [completed, setCompleted] = useState<Set<number>>(new Set())

  useEffect(() => {
    const saved = localStorage.getItem('pd-onboarding-done')
    if (saved) {
      try { setCompleted(new Set(JSON.parse(saved))) } catch { /* ignore */ }
    }
  }, [])

  const markDone = (i: number) => {
    setCompleted(prev => {
      const next = new Set(prev)
      next.add(i)
      localStorage.setItem('pd-onboarding-done', JSON.stringify(Array.from(next)))
      return next
    })
  }

  const step = STEPS[active]
  const progress = (completed.size / STEPS.length) * 100

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black gradient-text">Guide de démarrage</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {completed.size}/{STEPS.length} étapes complétées
          </p>
        </div>
        {completed.size === STEPS.length && (
          <div className="glass border border-emerald-500/30 rounded-xl px-4 py-2 text-sm text-emerald-400 font-bold">
            ✅ Onboarding terminé !
          </div>
        )}
      </div>

      {/* Barre de progression */}
      <div className="h-2 bg-card rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #00C8FF, #1A6EFF)' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Navigation */}
        <div className="space-y-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              className={`w-full text-left glass rounded-xl p-3 flex items-center gap-3 transition-all ${
                active === i ? 'border border-primary/40' : 'hover:bg-white/5'
              }`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: completed.has(i) ? '#10B98133' : active === i ? `${s.color}22` : '#1E293B' }}
              >
                {completed.has(i) ? (
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs font-bold" style={{ color: active === i ? s.color : '#64748B' }}>{i + 1}</span>
                )}
              </div>
              <span className={`text-sm font-semibold ${active === i ? 'text-white' : 'text-muted-foreground'}`}>
                {s.title}
              </span>
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="lg:col-span-2 glass rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `${step.color}22`, color: step.color }}
            >
              {step.icon}
            </div>
            <div>
              <h2 className="font-bold text-lg">{step.title}</h2>
              <p className="text-xs text-muted-foreground">Étape {active + 1} sur {STEPS.length}</p>
            </div>
          </div>

          <ol className="space-y-3">
            {step.steps.map(s => (
              <li key={s.n} className="flex items-start gap-3">
                <span
                  className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ background: `${step.color}22`, color: step.color }}
                >
                  {s.n}
                </span>
                <span className="text-sm leading-relaxed">{s.text}</span>
              </li>
            ))}
          </ol>

          <div className="glass rounded-lg p-3 flex gap-2 border border-amber-500/20">
            <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-xs text-amber-400">{step.tip}</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Link
              href={step.link.href}
              className="gradient-brand text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
            >
              {step.link.label}
            </Link>

            {!completed.has(active) ? (
              <button
                onClick={() => {
                  markDone(active)
                  if (active < STEPS.length - 1) setActive(active + 1)
                }}
                className="glass px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/5 transition-all"
              >
                Marquer comme fait ✓
              </button>
            ) : (
              <span className="text-sm text-emerald-400 font-semibold">✅ Complétée</span>
            )}

            {active < STEPS.length - 1 && (
              <button
                onClick={() => setActive(active + 1)}
                className="ml-auto glass px-4 py-2 rounded-lg text-sm hover:bg-white/5 transition-all"
              >
                Suivante →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
