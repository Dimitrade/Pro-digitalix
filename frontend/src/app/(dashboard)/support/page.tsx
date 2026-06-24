'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

const FAQ = [
  {
    q: 'Comment connecter ma boutique Chariow ?',
    a: 'Allez dans Paramètres → Intégration Chariow, entrez votre clé API et votre ID boutique. Les données se synchronisent automatiquement toutes les 15 minutes.',
  },
  {
    q: 'Qu\'est-ce que le plan Premium inclut ?',
    a: 'Le plan Premium (10 000 FCFA/an) donne accès à : rapports PDF avancés, export Excel, assistant IA illimité, notifications push, CRM complet, analytics produits et visiteurs, prévisions de ventes.',
  },
  {
    q: 'Comment activer le Premium après paiement ?',
    a: 'Votre abonnement est activé automatiquement dans les 5 minutes après confirmation du paiement Chariow. Si ce n\'est pas le cas, contactez le support avec votre ID de transaction.',
  },
  {
    q: 'Les notifications push ne fonctionnent pas — que faire ?',
    a: 'Vérifiez que les notifications sont autorisées dans votre navigateur (Paramètres → Notifications → prodigitalix.com). Sur mobile, assurez-vous d\'avoir ajouté l\'app à votre écran d\'accueil (PWA).',
  },
  {
    q: 'Comment exporter mes données ?',
    a: 'Dans Rapports, sélectionnez la période et cliquez sur "Exporter Excel" ou "Générer PDF". Les exports sont disponibles pour les ventes, clients et analytics produits.',
  },
  {
    q: 'Mon abonnement expire bientôt — comment renouveler ?',
    a: 'Allez dans Mon Abonnement et cliquez sur "Renouveler". Le renouvellement s\'ajoute à la date d\'expiration existante, vous ne perdez pas les jours restants.',
  },
  {
    q: 'Puis-je utiliser PRO DIGITALIX sur mobile ?',
    a: 'Oui ! Vous pouvez installer l\'application PWA sur Android/iOS (menu du navigateur → "Ajouter à l\'écran d\'accueil"). Des apps natives Android et iOS sont également disponibles.',
  },
  {
    q: 'Comment fonctionne l\'Assistant IA ?',
    a: 'L\'assistant analyse vos données de vente en temps réel et génère des recommandations personnalisées. Posez-lui des questions en langage naturel sur votre boutique.',
  },
]

type TicketCategory = 'technical' | 'billing' | 'account' | 'feature' | 'other'

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [tab, setTab] = useState<'faq' | 'contact' | 'ticket'>('faq')
  const [form, setForm] = useState({ subject: '', category: 'technical' as TicketCategory, message: '', email: '' })
  const [submitted, setSubmitted] = useState(false)

  const submitTicket = useMutation({
    mutationFn: async (data: typeof form) => {
      await apiClient.post('/support/ticket', data)
    },
    onSuccess: () => setSubmitted(true),
  })

  const tabs = [
    { id: 'faq',     label: 'FAQ' },
    { id: 'contact', label: 'Contact' },
    { id: 'ticket',  label: 'Signaler un problème' },
  ] as const

  const catLabels: Record<TicketCategory, string> = {
    technical: 'Problème technique',
    billing:   'Facturation / Paiement',
    account:   'Mon compte',
    feature:   'Suggestion de fonctionnalité',
    other:     'Autre',
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-black gradient-text">Centre d'aide</h1>
        <p className="text-muted-foreground text-sm mt-1">FAQ, contact et signalement de problèmes</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-primary text-white' : 'glass text-muted-foreground hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── FAQ ── */}
      {tab === 'faq' && (
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden">
              <button
                className="w-full text-left p-4 flex items-center justify-between hover:bg-white/5 transition-all"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-semibold text-sm pr-4">{item.q}</span>
                <svg
                  className={`w-4 h-4 text-primary flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-white/5 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Contact ── */}
      {tab === 'contact' && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-5">
            <h2 className="font-bold mb-4">Contactez ANABOK GROUP</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  ),
                  label: 'Email',
                  value: 'anabokgroup@gmail.com',
                  href: 'mailto:anabokgroup@gmail.com',
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  ),
                  label: 'WhatsApp / Téléphone',
                  value: '+228 79 81 29 99',
                  href: 'https://wa.me/22879812999',
                },
              ].map(c => (
                <a
                  key={c.label}
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass rounded-xl p-4 flex items-start gap-3 hover:bg-white/5 transition-all group"
                >
                  <span className="text-primary mt-0.5">{c.icon}</span>
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className="font-semibold group-hover:text-primary transition-colors">{c.value}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-4 border border-primary/20">
            <p className="text-sm">
              <span className="font-bold text-primary">Délai de réponse :</span>{' '}
              <span className="text-muted-foreground">Lundi – Samedi, 8h–20h (GMT+1). Réponse en moins de 24h ouvrables.</span>
            </p>
          </div>
        </div>
      )}

      {/* ── Ticket ── */}
      {tab === 'ticket' && (
        <div className="glass rounded-xl p-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Ticket envoyé !</h2>
              <p className="text-muted-foreground text-sm">Nous reviendrons vers vous dans les 24h ouvrables.</p>
              <button
                onClick={() => { setSubmitted(false); setForm({ subject: '', category: 'technical', message: '', email: '' }) }}
                className="mt-4 glass px-4 py-2 rounded-lg text-sm hover:bg-white/5 transition-all"
              >
                Nouveau ticket
              </button>
            </div>
          ) : (
            <form
              onSubmit={e => { e.preventDefault(); submitTicket.mutate(form) }}
              className="space-y-4"
            >
              <h2 className="font-bold text-lg">Signaler un problème</h2>

              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Votre email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full glass rounded-lg px-3 py-2.5 text-sm bg-transparent border border-white/10 focus:border-primary/50 focus:outline-none"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Catégorie</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as TicketCategory }))}
                  className="w-full glass rounded-lg px-3 py-2.5 text-sm bg-card border border-white/10 focus:border-primary/50 focus:outline-none"
                >
                  {Object.entries(catLabels).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Sujet</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full glass rounded-lg px-3 py-2.5 text-sm bg-transparent border border-white/10 focus:border-primary/50 focus:outline-none"
                  placeholder="Résumé du problème"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Description détaillée</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full glass rounded-lg px-3 py-2.5 text-sm bg-transparent border border-white/10 focus:border-primary/50 focus:outline-none resize-none"
                  placeholder="Décrivez le problème en détail : étapes pour reproduire, message d'erreur, etc."
                />
              </div>

              <button
                type="submit"
                disabled={submitTicket.isPending}
                className="gradient-brand text-white w-full py-3 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {submitTicket.isPending ? 'Envoi en cours...' : 'Envoyer le ticket'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
