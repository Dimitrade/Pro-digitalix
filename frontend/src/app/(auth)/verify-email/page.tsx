'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

function VerifyEmailContent() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')
  const email = params.get('email')

  const [status, setStatus] = useState<'pending' | 'success' | 'error' | 'waiting'>('waiting')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!token) return
    setStatus('pending')
    axios.get(`${API}/auth/verify-email?token=${token}`)
      .then(() => { setStatus('success'); setTimeout(() => router.push('/dashboard'), 3000) })
      .catch(() => setStatus('error'))
  }, [token, router])

  async function resend() {
    if (!email) return
    setResending(true)
    try {
      await axios.post(`${API}/auth/resend-verification`, { email })
      toast.success('Email de vérification renvoyé !')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      toast.error(e.response?.data?.error || 'Erreur lors de l\'envoi.')
    } finally { setResending(false) }
  }

  if (!token) return (
    <div className="animate-fade-in text-center space-y-5">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-foreground">Vérifiez votre email</h2>
      <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
        Nous avons envoyé un lien de vérification à{' '}
        <strong className="text-foreground">{email || 'votre adresse email'}</strong>.
      </p>
      <div className="pt-2 space-y-3">
        {email && <Button variant="outline" className="w-full" onClick={resend} loading={resending}>Renvoyer l'email</Button>}
        <Link href="/login"><Button variant="ghost" className="w-full">Retour à la connexion</Button></Link>
      </div>
    </div>
  )

  if (status === 'pending') return (
    <div className="text-center space-y-4">
      <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
      <p className="text-muted-foreground">Vérification en cours…</p>
    </div>
  )

  if (status === 'success') return (
    <div className="animate-fade-in text-center space-y-4">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-foreground">Email vérifié !</h2>
      <p className="text-muted-foreground text-sm">Redirection vers votre dashboard…</p>
    </div>
  )

  return (
    <div className="animate-fade-in text-center space-y-4">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-destructive" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-foreground">Lien invalide ou expiré</h2>
      <p className="text-muted-foreground text-sm">Ce lien n'est plus valide.</p>
      <Link href="/login"><Button variant="outline" className="mt-2">Retour à la connexion</Button></Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
