'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Key, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { chariowApi } from '@/lib/api'

const schema = z.object({
  api_key: z.string().min(10, 'Clé API invalide'),
})
type FormData = z.infer<typeof schema>

interface Props {
  onClose: () => void
}

export function ConnectStoreModal({ onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      await chariowApi.connect({ api_key: data.api_key })
      setConnected(true)
      queryClient.invalidateQueries({ queryKey: ['chariow-accounts'] })
      toast.success('Boutique connectée ! Synchronisation en cours…')
      setTimeout(onClose, 2000)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Clé API invalide.')
    } finally {
      setLoading(false)
    }
  }

  if (connected) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="glass rounded-2xl p-8 w-full max-w-md text-center space-y-4 animate-fade-in">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
          <h3 className="text-xl font-bold text-foreground">Boutique connectée !</h3>
          <p className="text-muted-foreground text-sm">Synchronisation des données en cours…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl p-7 w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg">Connecter Chariow</h3>
            <p className="text-xs text-muted-foreground">Entrez votre clé API Chariow</p>
          </div>
        </div>

        <div className="bg-brand-950/60 border border-brand-800/50 rounded-xl p-4 mb-5 text-sm text-brand-300 space-y-1">
          <p className="font-medium text-brand-200">Comment obtenir votre clé API ?</p>
          <ol className="list-decimal list-inside space-y-0.5 text-xs">
            <li>Connectez-vous sur votre boutique Chariow</li>
            <li>Allez dans Paramètres → API</li>
            <li>Copiez votre clé API et collez-la ci-dessous</li>
          </ol>
          <a href="https://chariow.com" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
            Ouvrir Chariow <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="api_key">Clé API Chariow</Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="api_key"
                type="password"
                placeholder="ck_••••••••••••••••••••••••"
                className={`flex h-10 w-full rounded-lg border bg-input pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono ${errors.api_key ? 'border-destructive' : 'border-border'}`}
                {...register('api_key')}
              />
            </div>
            {errors.api_key && <p className="text-xs text-destructive">{errors.api_key.message}</p>}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="gradient" className="flex-1" loading={loading}>
              {loading ? 'Connexion…' : 'Connecter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
