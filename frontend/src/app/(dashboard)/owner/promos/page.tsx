'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tag, Plus, ToggleLeft, Pencil, RefreshCw, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface Promo {
  id: number; code: string; type: string; value: number
  description: string | null; max_uses: number | null; used_count: number
  active: boolean; expires_at: string | null; created_by_email: string | null; created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  percent_off: '% réduction', amount_off: 'Montant fixe',
  premium_days: 'Jours Premium', premium_lifetime: 'Premium à vie',
}

function PromoValue({ type, value }: { type: string; value: number }) {
  if (type === 'percent_off') return <>{value}%</>
  if (type === 'amount_off') return <>{value.toLocaleString('fr-FR')} FCFA</>
  if (type === 'premium_days') return <>{value} jour{value > 1 ? 's' : ''} Premium</>
  return <>À vie</>
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    code: '', type: 'premium_days', value: 30,
    description: '', max_uses: '', expires_at: '',
  })

  const mut = useMutation({
    mutationFn: () => api.post('/owner/promos', {
      ...form,
      value: Number(form.value),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
    }).then(r => r.data),
    onSuccess: () => {
      toast.success('Code promo créé !')
      qc.invalidateQueries({ queryKey: ['promos'] })
      onClose()
    },
    onError: (e: { response?: { data?: { error?: string } } }) => {
      toast.error(e.response?.data?.error || 'Erreur')
    },
  })

  const field = 'w-full h-9 px-3 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 w-full max-w-md border border-border shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-foreground">Créer un code promo</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <Label>Code *</Label>
            <input value={form.code} onChange={e => setForm(s => ({ ...s, code: e.target.value.toUpperCase() }))}
              placeholder="ANABOK50" className={`${field} mt-1 font-mono tracking-widest`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type *</Label>
              <select value={form.type} onChange={e => setForm(s => ({ ...s, type: e.target.value }))}
                className={`${field} mt-1`}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <Label>Valeur *</Label>
              <input type="number" value={form.value}
                onChange={e => setForm(s => ({ ...s, value: Number(e.target.value) }))}
                className={`${field} mt-1`}
                placeholder={form.type === 'percent_off' ? '50' : form.type === 'premium_days' ? '30' : '10000'}
                disabled={form.type === 'premium_lifetime'} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <input value={form.description} onChange={e => setForm(s => ({ ...s, description: e.target.value }))}
              placeholder="Description optionnelle" className={`${field} mt-1`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Utilisations max</Label>
              <input type="number" value={form.max_uses}
                onChange={e => setForm(s => ({ ...s, max_uses: e.target.value }))}
                placeholder="Illimité" className={`${field} mt-1`} />
            </div>
            <div>
              <Label>Expiration</Label>
              <input type="datetime-local" value={form.expires_at}
                onChange={e => setForm(s => ({ ...s, expires_at: e.target.value }))}
                className={`${field} mt-1`} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button variant="gradient" className="flex-1" onClick={() => mut.mutate()} loading={mut.isPending}>
              Créer le code
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OwnerPromosPage() {
  const [showCreate, setShowCreate] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['promos'],
    queryFn: () => api.get('/owner/promos').then(r => r.data as { promos: Promo[] }),
    staleTime: 60_000,
  })

  const promos = data?.promos ?? []

  const disable = useMutation({
    mutationFn: (id: number) => api.delete(`/owner/promos/${id}`).then(r => r.data),
    onSuccess: () => { toast.success('Code désactivé'); qc.invalidateQueries({ queryKey: ['promos'] }) },
  })

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
            <Tag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">Codes Promotionnels</h1>
            <p className="text-sm text-muted-foreground">{promos.length} code{promos.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /></Button>
          <Button variant="gradient" size="sm" className="gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> Créer un code
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-5 animate-pulse h-24" />
        )) : promos.length === 0 ? (
          <div className="glass rounded-xl p-10 text-center">
            <Tag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Aucun code promo créé.</p>
            <Button variant="gradient" size="sm" className="mt-4" onClick={() => setShowCreate(true)}>
              Créer le premier code
            </Button>
          </div>
        ) : promos.map(p => {
          const expired = p.expires_at && new Date(p.expires_at) < new Date()
          const exhausted = p.max_uses !== null && p.used_count >= p.max_uses
          const inactive = !p.active || expired || exhausted

          return (
            <div key={p.id} className={cn('glass rounded-xl p-5 flex items-start justify-between gap-4',
              inactive && 'opacity-50')}>
              <div className="flex items-start gap-4">
                <div className={cn('px-3 py-1 rounded-lg font-mono font-black text-sm tracking-widest',
                  inactive ? 'bg-secondary text-muted-foreground' : 'gradient-brand text-white')}>
                  {p.code}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-medium text-foreground">{TYPE_LABELS[p.type]}</span>
                    <span className="text-xs text-primary font-bold"><PromoValue type={p.type} value={p.value} /></span>
                    {inactive && <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">Inactif</span>}
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground mb-1">{p.description}</p>}
                  <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                    <span>{p.used_count} utilisation{p.used_count > 1 ? 's' : ''}{p.max_uses ? ` / ${p.max_uses}` : ''}</span>
                    {p.expires_at && (
                      <span className={expired ? 'text-destructive' : ''}>
                        Exp. {new Date(p.expires_at).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    {p.created_by_email && <span>Par {p.created_by_email}</span>}
                  </div>
                </div>
              </div>
              {p.active && !expired && !exhausted && (
                <button onClick={() => disable.mutate(p.id)}
                  className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                  <ToggleLeft className="w-4 h-4" /> Désactiver
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
