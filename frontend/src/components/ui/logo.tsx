'use client'

/**
 * Logo officiel PRO DIGITALIX — ANABOK GROUP
 * Source unique : modifier ici met à jour toute l'application.
 * Pour utiliser le PNG officiel : déposer logo-official.png dans /public/
 * et décommenter la section "Version image officielle" ci-dessous.
 */
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

/** Monogramme PD — fidèle au logo officiel : dégradé cyan→bleu→marine */
export function LogoIcon({ size = 36, className }: { size?: number; className?: string }) {
  const id = `pd-${Math.random().toString(36).slice(2,6)}`
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#00C8FF"/>
          <stop offset="40%"  stopColor="#1A6EFF"/>
          <stop offset="100%" stopColor="#0A1A6E"/>
        </linearGradient>
      </defs>
      {/* P — tige verticale */}
      <rect x="8" y="8" width="12" height="84" rx="5" fill={`url(#${id})`}/>
      {/* P — bol (arc extérieur) */}
      <path d="M20 8 Q58 8 58 32 Q58 56 20 56 Z" fill={`url(#${id})`}/>
      {/* P — découpe intérieure */}
      <path d="M24 18 Q48 18 48 32 Q48 46 24 46 Z" fill="#0B1426"/>
      {/* D — tige verticale */}
      <rect x="64" y="8" width="12" height="84" rx="5" fill={`url(#${id})`}/>
      {/* D — arc extérieur */}
      <path d="M76 8 C94 8 100 22 100 50 C100 78 94 92 76 92 L76 80 C88 80 88 66 88 50 C88 34 88 20 76 20 Z"
            fill={`url(#${id})`}/>
    </svg>
  )
}

/** Logo complet avec texte */
export function Logo({ size = 'sm', variant = 'full', className }: LogoProps) {
  const s = SIZES[size]

  if (variant === 'icon') return <LogoIcon size={s.icon} className={className} />

  if (variant === 'text') return (
    <span className={cn('font-black tracking-tight leading-none', s.text, className)}>
      <span style={{ color: '#0F172A' }}>PRO </span>
      <span style={{ background: 'linear-gradient(90deg,#1A6EFF,#00C8FF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>DIGITALIX</span>
    </span>
  )

  return (
    <div className={cn('flex items-center', s.gap, className)}>
      <LogoIcon size={s.icon} />
      <div>
        <p className={cn('font-black leading-tight', s.text)}>
          <span className="text-foreground">PRO </span>
          <span className="gradient-text">DIGITALIX</span>
        </p>
        {(size === 'lg' || size === 'xl') && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Analysez • Optimisez • Développez
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * VERSION IMAGE OFFICIELLE — activer quand logo-official.png est dans /public/
 *
 * import Image from 'next/image'
 * export function Logo({ size = 'sm', className }: LogoProps) {
 *   const s = SIZES[size]
 *   return (
 *     <Image src="/logo-official.png" alt="PRO DIGITALIX"
 *       width={s.icon * 5} height={s.icon}
 *       className={cn('object-contain', className)} priority />
 *   )
 * }
 */
