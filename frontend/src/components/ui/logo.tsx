'use client'

import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon' | 'text'
  className?: string
}

const SIZES = {
  xs: { icon: 20, text: 'text-xs',  gap: 'gap-1.5' },
  sm: { icon: 28, text: 'text-sm',  gap: 'gap-2' },
  md: { icon: 36, text: 'text-base',gap: 'gap-2.5' },
  lg: { icon: 52, text: 'text-xl',  gap: 'gap-3' },
  xl: { icon: 80, text: 'text-3xl', gap: 'gap-4' },
}

/** Icône PD — fidèle au logo officiel PRO DIGITALIX */
export function LogoIcon({ size = 36, className }: { size?: number; className?: string }) {
  const uid = `pd-${Math.random().toString(36).slice(2, 7)}`
  const gMain = `${uid}-main`
  const gCyan = `${uid}-cyan`
  return (
    <svg width={size} height={size} viewBox="0 0 120 130" fill="none"
      xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        {/* Dégradé principal : marine → bleu → cyan (haut-gauche → bas-droite) */}
        <linearGradient id={gMain} x1="0" y1="0" x2="120" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#0D1B4B"/>
          <stop offset="50%"  stopColor="#1655C0"/>
          <stop offset="100%" stopColor="#00C8FF"/>
        </linearGradient>
        {/* Dégradé accent cyan pour le trait de séparation */}
        <linearGradient id={gCyan} x1="0" y1="0" x2="120" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#1A6EFF"/>
          <stop offset="100%" stopColor="#00DFFF"/>
        </linearGradient>
      </defs>

      {/* ── Lettre P (gauche) ── */}
      {/* Tige verticale P */}
      <rect x="4" y="4" width="18" height="122" rx="6" fill={`url(#${gMain})`}/>
      {/* Arc extérieur du P */}
      <path
        d="M22 4 C70 4 80 18 80 42 C80 66 70 80 22 80 L22 62 C58 62 62 54 62 42 C62 30 58 22 22 22 Z"
        fill={`url(#${gMain})`}
      />

      {/* ── Lettre D (droite, légèrement décalée / superposée) ── */}
      {/* Tige verticale D */}
      <rect x="60" y="30" width="16" height="96" rx="6" fill={`url(#${gCyan})`}/>
      {/* Arc extérieur du D */}
      <path
        d="M76 30 C110 30 120 52 120 78 C120 104 110 126 76 126 L76 110 C100 110 104 96 104 78 C104 60 100 46 76 46 Z"
        fill={`url(#${gCyan})`}
      />

      {/* Trait de lumière diagonal — effet 3D/biseau */}
      <path
        d="M22 62 L62 42 L62 22 L22 22 Z"
        fill="rgba(0,200,255,0.18)"
      />
    </svg>
  )
}

/** Logo complet avec texte */
export function Logo({ size = 'sm', variant = 'full', className }: LogoProps) {
  const s = SIZES[size]

  if (variant === 'icon') return <LogoIcon size={s.icon} className={className} />

  if (variant === 'text') return (
    <span className={cn('font-black tracking-tight leading-none', s.text, className)}>
      <span style={{ color: '#0D1B4B' }}>PRO </span>
      <span style={{ background: 'linear-gradient(90deg,#1655C0,#00C8FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        DIGITALIX
      </span>
    </span>
  )

  return (
    <div className={cn('flex items-center', s.gap, className)}>
      <LogoIcon size={s.icon} />
      <div>
        <p className={cn('font-black leading-tight tracking-tight', s.text)}>
          <span style={{ color: 'var(--foreground)' }}>PRO </span>
          <span style={{ background: 'linear-gradient(90deg,#1655C0,#00C8FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            DIGITALIX
          </span>
        </p>
        {(size === 'lg' || size === 'xl') && (
          <p className="text-[11px] text-muted-foreground mt-0.5 tracking-wide">
            Analysez • Optimisez • Développez
          </p>
        )}
      </div>
    </div>
  )
}
