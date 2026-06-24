'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, CheckCircle2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const schema = z.object({
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Les mots de passe ne correspondent pas.',
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token')

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    if (!token) { toast.error('Lien invalide.'); return }
    setLoading(true)
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
      await axios.post(`${API}/auth/reset-password?token=${token}`, { password: data.password })
      setDone(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      toast.error(e.response?.data?.error || 'Lien expiré ou invalide.')
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = (hasError: boolean) =>
    `flex h-10 w-full rounded-lg border bg-input pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${hasError ? 'border-destructive' : 'border-border'}`

  if (done) return (
    <div className="animate-fade-in text-center space-y-4">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
      </div>
      <h2 className="text-2xl font-bold">Mot de passe mis à jour !</h2>
      <p className="text-muted-foreground text-sm">Redirection vers la connexion…</p>
    </div>
  )

  if (!token) return (
    <div className="text-center space-y-4">
      <h2 className="text-2xl font-bold text-destructive">Lien invalide</h2>
      <Link href="/forgot-password"><Button variant="outline">Demander un nouveau lien</Button></Link>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Nouveau mot de passe</h2>
        <p className="mt-1 text-muted-foreground text-sm">Choisissez un mot de passe fort.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
              className={`${fieldClass(!!errors.password)} pl-9 pr-10`} {...register('password')} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">Min 8 car., 1 majuscule, 1 chiffre.</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm_password">Confirmer</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input id="confirm_password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
              className={`${fieldClass(!!errors.confirm_password)} pl-9`} {...register('confirm_password')} />
          </div>
          {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
        </div>
        <Button type="submit" variant="gradient" size="lg" className="w-full" loading={loading}>
          Mettre à jour le mot de passe
        </Button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
