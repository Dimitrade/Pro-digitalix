'use client'

import { useState } from 'react'
import {
  Link2, CheckCircle2, RefreshCw, Trash2, Copy,
  ExternalLink, Settings, BookOpen, HelpCircle,
  Zap, Shield, Activity, BarChart2, Users, ShoppingCart,
  Eye, AlertTriangle, ChevronRight, X
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { formatNumber, formatDate, cn } from '@/lib/utils'
import { chariowApi } from '@/lib/api'
import { useChariowAccounts } from '@/hooks/useChariowAccount'
import { Button } from '@/components/ui/button'

type IntegTab = 'apercu' | 'configuration' | 'donnees' | 'logs' | 'webhooks'

const STATUS_CHECKS = [
  { label: 'Connexion API', status: 'active', icon: Link2 },
  { label: 'Authentification', status: 'ok', icon: Shield },
  { label: 'Synchronisation', status: 'realtime', icon: RefreshCw },
  { label: 'Santé de l\'API', status: '100%', icon: Activity },
]

const SYNCED_DATA = [
  { label: 'Produits', value: 8, icon: ShoppingCart },
  { label: 'Clients', value: 1017, icon: Users },
  { label: 'Commandes', value: 41, icon: ShoppingCart },
  { label: 'Abandons', value: 342, icon: AlertTriangle },
  { label: 'Visites', value: 4218, icon: Eye },
]

const QUICK_ACTIONS = [
  { icon: RefreshCw, label: 'Forcer la synchronisation', desc: 'Lance une synchronisation complète de toutes les données.', color: 'text-primary bg-primary/10', btnLabel: 'Synchroniser maintenant', variant: 'outline' as const },
  { icon: Zap, label: 'Vérifier les webhooks', desc: 'Vérifie la réception et le statut des webhooks Chariow.', color: 'text-purple-400 bg-purple-400/10', btnLabel: 'Vérifier maintenant', variant: 'outline' as const },
  { icon: Trash2, label: 'Réinitialiser les données', desc: 'Supprime toutes les données locales et relance l\'importation.', color: 'text-red-400 bg-red-400/10', btnLabel: 'Réinitialiser', variant: 'outline' as const, danger: true },
  { icon: BookOpen, label: 'Documentation API', desc: 'Consultez la documentation officielle de l\'API Chariow.', color: 'text-green-400 bg-green-400/10', btnLabel: 'Voir la documentation', variant: 'outline' as const },
]

export default function IntegrationsPage() {
  const [tab, setTab] = useState<IntegTab>('apercu')
  const [showBanner, setShowBanner] = useState(true)
  const queryClient = useQueryClient()

  const { data: accounts, isLoading } = useChariowAccounts()
  const account = accounts?.[0] || null

  const syncMutation = useMutation({
    mutationFn: () => chariowApi.sync(account!.id),
    onSuccess: () => {
      toast.success('Synchronisation complète effectuée !')
      queryClient.invalidateQueries({ queryKey: ['chariow-accounts'] })
    },
    onError: () => toast.error('Erreur lors de la synchronisation.'),
  })

  const disconnectMutation = useMutation({
    mutationFn: () => chariowApi.disconnect(account!.id),
    onSuccess: () => {
      toast.success('Boutique déconnectée.')
      queryClient.invalidateQueries({ queryKey: ['chariow-accounts'] })
    },
    onError: () => toast.error('Erreur lors de la déconnexion.'),
  })

  const tabs: { key: IntegTab; label: string }[] = [
    { key: 'apercu', label: 'Aperçu' },
    { key: 'configuration', label: 'Configuration' },
    { key: 'donnees', label: 'Données synchronisées' },
    { key: 'logs', label: 'Logs & Historique' },
    { key: 'webhooks', label: 'Webhooks' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Intégration Chariow</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gérez la connexion entre PRO DIGITALIX et votre boutique Chariow.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <BookOpen className="w-4 h-4" />
            Documentation
          </Button>
          <Button variant="outline" size="sm">
            <HelpCircle className="w-4 h-4" />
            Besoin d'aide ?
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={() => syncMutation.mutate()}
            loading={syncMutation.isPending}
            disabled={!account}
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser les données
          </Button>
        </div>
      </div>

      {/* Carte boutique connectée */}
      <div className="glass rounded-xl p-6 flex flex-col sm:flex-row items-start gap-5">
        {/* Logo Chariow */}
        <div className="w-16 h-16 rounded-2xl bg-[#0D1B2A] border border-border flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black text-2xl">C</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-foreground">Chariow</h2>
            <span className={cn(
              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
              account ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'
            )}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {account ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {account
              ? 'Votre boutique est connectée avec succès. Toutes vos données sont synchronisées en temps réel.'
              : 'Aucune boutique connectée. Cliquez sur "Connecter" pour démarrer.'}
          </p>
          {account && (
            <div className="flex flex-wrap gap-6 mt-3 text-sm text-muted-foreground">
              <span>Connexion établie le <strong className="text-foreground">{account.last_sync_at ? formatDate(account.last_sync_at) : '—'}</strong></span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Dernière synchronisation : <strong className="text-foreground ml-1">Il y a 3 minutes</strong>
              </span>
            </div>
          )}
        </div>

        {account && (
          <Button
            variant="outline"
            size="sm"
            className="text-red-400 border-red-400/30 hover:bg-red-400/10 flex-shrink-0"
            onClick={() => {
              if (confirm('Voulez-vous vraiment déconnecter cette boutique ?')) {
                disconnectMutation.mutate()
              }
            }}
            loading={disconnectMutation.isPending}
          >
            <span className="mr-1">↪</span>
            Déconnecter
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              'px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenu des tabs */}
      {tab === 'apercu' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Statut connexion */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Statut de la connexion</h3>
            <div className="space-y-3">
              {STATUS_CHECKS.map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <s.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 text-sm text-foreground">{s.label}</span>
                  {s.status === '100%' ? (
                    <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />{s.status}
                    </span>
                  ) : (
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      s.status === 'active' ? 'bg-green-400/10 text-green-400' :
                      s.status === 'ok' ? 'bg-green-400/10 text-green-400' :
                      'bg-blue-400/10 text-blue-400'
                    )}>
                      <CheckCircle2 className="w-3 h-3 inline mr-0.5" />
                      {s.status === 'active' ? 'Active' : s.status === 'ok' ? 'Réussie' : 'En temps réel'}
                    </span>
                  )}
                </div>
              ))}
              {/* Limite requêtes */}
              <div className="pt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3" />Limite des requêtes</span>
                  <span className="font-semibold text-foreground">312 / 1000</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full gradient-brand rounded-full" style={{ width: '31.2%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Données synchronisées */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Données synchronisées</h3>
            </div>
            <div className="space-y-3">
              {SYNCED_DATA.map(d => (
                <div key={d.label} className="flex items-center gap-3">
                  <d.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 text-sm text-foreground">{d.label}</span>
                  <span className="font-bold text-foreground">{formatNumber(d.value)}</span>
                </div>
              ))}
            </div>
            <button className="mt-4 text-xs text-primary hover:underline flex items-center gap-1">
              Voir toutes les données <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Résumé boutique */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Résumé de la boutique</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{account?.store_name || 'ANABOK BOUTIQUE'}</p>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-400/10 text-green-400">Active</span>
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ID Boutique Chariow</span>
                <div className="flex items-center gap-1">
                  <span className="text-foreground font-mono text-xs">{account?.store_slug || 'bq_7f3a8d2e9c'}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(account?.store_slug || 'bq_7f3a8d2e9c'); toast.success('Copié !') }}
                    className="text-muted-foreground hover:text-foreground">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Domaine</span>
                <a href={account?.store_url || '#'} target="_blank" rel="noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 text-xs">
                  {account?.store_url?.replace('https://', '') || 'anabokgroup.com'}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fuseau horaire</span>
                <span className="text-foreground text-xs">(UTC+01:00) Abidjan</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4 text-xs">
              <Settings className="w-3.5 h-3.5" />
              Modifier la configuration
            </Button>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      {tab === 'apercu' && (
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-1">Actions rapides</h3>
          <p className="text-xs text-muted-foreground mb-4">Gérez votre intégration et vos données facilement.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_ACTIONS.map((a, i) => (
              <div key={i} className="glass rounded-xl p-4 border border-border">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', a.color)}>
                  <a.icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-foreground text-sm mb-1">{a.label}</p>
                <p className="text-xs text-muted-foreground mb-4">{a.desc}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn('w-full text-xs', a.danger && 'text-red-400 border-red-400/30 hover:bg-red-400/10')}
                  loading={i === 0 && syncMutation.isPending}
                  onClick={i === 0 ? () => syncMutation.mutate() : undefined}
                >
                  {a.btnLabel}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab !== 'apercu' && (
        <div className="glass rounded-xl p-8 text-center">
          <Settings className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Section «{tabs.find(t => t.key === tab)?.label}» — disponible dans une prochaine mise à jour.</p>
        </div>
      )}

      {/* Banner info */}
      {showBanner && (
        <div className="glass rounded-xl p-4 border-l-4 border-primary flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-primary text-xs font-bold">i</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-primary">Les données sont synchronisées automatiquement en temps réel.</p>
            <p className="text-xs text-muted-foreground mt-0.5">Vous serez notifié en cas d'erreur ou d'interruption de service.</p>
          </div>
          <button onClick={() => setShowBanner(false)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
