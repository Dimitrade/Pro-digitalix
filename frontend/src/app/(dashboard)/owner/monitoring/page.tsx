'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ownerApi } from '@/lib/api'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

interface ChariowData {
  payments: { total: number; completed: number; failed: number; pending: number; successRate: number }
  webhook: { received: number; rejected: number; lastSync: string | null }
  accounts: { total: number; active: number }
  recentWebhooks: { id: string; status: string; amount: number; created_at: string; transaction_id: string }[]
}

interface SystemData {
  status: 'healthy' | 'degraded' | 'unhealthy'
  uptime: number
  timestamp: string
  checks: Record<string, { status: 'ok' | 'error' | 'degraded'; latency?: number; detail?: string }>
}

interface BackupItem { name: string; sizeMB: string; createdAt: string }

const StatusDot = ({ status }: { status: 'ok' | 'error' | 'degraded' }) => (
  <span className={`inline-block w-2.5 h-2.5 rounded-full ${
    status === 'ok' ? 'bg-emerald-400' : status === 'degraded' ? 'bg-amber-400' : 'bg-red-500'
  }`} />
)

const CheckLabel: Record<string, string> = {
  database: 'Base de données',
  chariow: 'API Chariow',
  notifications: 'Notifications (FCM)',
  ai: 'Assistant IA (OpenAI)',
  server: 'Serveur Node.js',
}

export default function MonitoringPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'chariow' | 'system' | 'backups'>('chariow')

  useEffect(() => {
    if (session && (session.user as { role?: string })?.role !== 'owner') router.push('/dashboard')
  }, [session, router])

  const chariow = useQuery<ChariowData>({
    queryKey: ['owner-chariow-monitoring'],
    queryFn: () => ownerApi.chariowMonitoring(),
    refetchInterval: 30_000,
    enabled: tab === 'chariow',
  })

  const system = useQuery<SystemData>({
    queryKey: ['owner-system-health'],
    queryFn: () => ownerApi.systemHealth(),
    refetchInterval: 30_000,
    enabled: tab === 'system',
  })

  const backups = useQuery<{ backups: BackupItem[] }>({
    queryKey: ['owner-backups'],
    queryFn: () => ownerApi.listBackups(),
    enabled: tab === 'backups',
  })

  const triggerBackup = useMutation({
    mutationFn: () => ownerApi.triggerBackup(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-backups'] }),
  })

  const tabs = [
    { id: 'chariow', label: 'Chariow' },
    { id: 'system',  label: 'Système' },
    { id: 'backups', label: 'Sauvegardes' },
  ] as const

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black gradient-text">Monitoring</h1>
        <p className="text-muted-foreground text-sm mt-1">État en temps réel de la plateforme</p>
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

      {/* ── Chariow ── */}
      {tab === 'chariow' && (
        <div className="space-y-4">
          {chariow.isLoading ? (
            <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>
          ) : chariow.data ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Paiements réussis',  value: fmt(chariow.data.payments.completed), color: '#10B981' },
                  { label: 'Paiements échoués',  value: fmt(chariow.data.payments.failed),    color: '#EF4444' },
                  { label: 'En attente',          value: fmt(chariow.data.payments.pending),   color: '#F59E0B' },
                  { label: 'Taux de succès',      value: `${chariow.data.payments.successRate}%`, color: '#1A6EFF' },
                ].map(k => (
                  <div key={k.label} className="glass rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                    <p className="text-2xl font-black mt-1" style={{ color: k.color }}>{k.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass rounded-xl p-4">
                  <h3 className="font-bold mb-3">Webhook Chariow</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Webhooks reçus (30j)</span><span className="font-bold">{fmt(chariow.data.webhook.received)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Webhooks rejetés</span><span className="font-bold text-red-400">{fmt(chariow.data.webhook.rejected)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Comptes actifs</span><span className="font-bold text-emerald-400">{chariow.data.accounts.active}/{chariow.data.accounts.total}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Dernière synchro</span>
                      <span className="text-xs">{chariow.data.webhook.lastSync ? new Date(chariow.data.webhook.lastSync).toLocaleString('fr-FR') : 'Jamais'}</span>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl p-4">
                  <h3 className="font-bold mb-3">Derniers webhooks</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {chariow.data.recentWebhooks.map(w => (
                      <div key={w.id} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                        <span className="text-muted-foreground font-mono truncate max-w-[100px]">{w.transaction_id || w.id}</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold ${
                          w.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                          w.status === 'failed'    ? 'bg-red-500/20 text-red-400' :
                                                     'bg-amber-500/20 text-amber-400'
                        }`}>{w.status}</span>
                        <span className="text-muted-foreground">{new Date(w.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ── Système ── */}
      {tab === 'system' && (
        <div className="space-y-4">
          {system.isLoading ? (
            <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>
          ) : system.data ? (
            <>
              <div className={`glass rounded-xl p-4 flex items-center gap-3 border ${
                system.data.status === 'healthy' ? 'border-emerald-500/30' : system.data.status === 'degraded' ? 'border-amber-500/30' : 'border-red-500/30'
              }`}>
                <StatusDot status={system.data.status === 'healthy' ? 'ok' : system.data.status === 'degraded' ? 'degraded' : 'error'} />
                <div>
                  <p className="font-bold capitalize">{system.data.status === 'healthy' ? 'Tous les systèmes opérationnels' : system.data.status === 'degraded' ? 'Services partiellement dégradés' : 'Incident détecté'}</p>
                  <p className="text-xs text-muted-foreground">Mis à jour le {new Date(system.data.timestamp).toLocaleString('fr-FR')} — Uptime {Math.round(system.data.uptime / 3600)}h</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(system.data.checks).map(([key, check]) => (
                  <div key={key} className="glass rounded-xl p-4 flex items-start gap-3">
                    <StatusDot status={check.status} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{CheckLabel[key] || key}</p>
                      {check.latency !== undefined && (
                        <p className="text-xs text-muted-foreground">Latence : {check.latency}ms</p>
                      )}
                      {check.detail && <p className="text-xs text-muted-foreground truncate">{check.detail}</p>}
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      check.status === 'ok'       ? 'bg-emerald-500/20 text-emerald-400' :
                      check.status === 'degraded' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-red-500/20 text-red-400'
                    }`}>{check.status.toUpperCase()}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => system.refetch()}
                className="glass px-4 py-2 rounded-lg text-sm hover:bg-white/5 transition-all"
              >
                Actualiser
              </button>
            </>
          ) : null}
        </div>
      )}

      {/* ── Sauvegardes ── */}
      {tab === 'backups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Sauvegardes automatiques quotidiennes (3h UTC) — rétention 30 jours</p>
            <button
              onClick={() => triggerBackup.mutate()}
              disabled={triggerBackup.isPending}
              className="gradient-brand text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {triggerBackup.isPending ? 'En cours...' : 'Sauvegarde manuelle'}
            </button>
          </div>

          {triggerBackup.isSuccess && (
            <div className="glass border border-emerald-500/30 rounded-xl p-3 text-sm text-emerald-400">
              Sauvegarde créée avec succès.
            </div>
          )}

          {backups.isLoading ? (
            <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-muted-foreground font-medium">Fichier</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Taille</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.data?.backups.length === 0 ? (
                    <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">Aucune sauvegarde disponible</td></tr>
                  ) : backups.data?.backups.map(b => (
                    <tr key={b.name} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                      <td className="p-4 font-mono text-xs">{b.name}</td>
                      <td className="p-4 text-muted-foreground">{b.sizeMB} MB</td>
                      <td className="p-4 text-muted-foreground">{new Date(b.createdAt).toLocaleString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
