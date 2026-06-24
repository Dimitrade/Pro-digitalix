'use client'

import { Lock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const CHECKOUT_URL = 'https://anabokgroup.online/prd_y2htjbxf/checkout'

interface PremiumGateProps {
  children: React.ReactNode
  /** Si true, affiche le contenu avec un overlay */
  overlay?: boolean
  featureName?: string
  className?: string
}

/**
 * Wrapper pour les fonctionnalités Premium.
 * Usage : <PremiumGate featureName="Assistant IA">{children}</PremiumGate>
 * Passer isPremium={true} supprime le gate.
 */
export function PremiumGate({
  children,
  overlay = false,
  featureName = 'cette fonctionnalité',
  className,
}: PremiumGateProps) {
  if (overlay) {
    return (
      <div className={cn('relative', className)}>
        <div className="pointer-events-none select-none opacity-30 blur-sm">{children}</div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm rounded-xl p-6 text-center">
          <PremiumBadge featureName={featureName} />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center justify-center text-center p-8 glass rounded-xl', className)}>
      <PremiumBadge featureName={featureName} />
    </div>
  )
}

function PremiumBadge({ featureName }: { featureName: string }) {
  return (
    <>
      <div className="w-14 h-14 rounded-full gradient-brand flex items-center justify-center mb-4">
        <Lock className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">Fonctionnalité PREMIUM</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">
        <span className="text-foreground font-medium">{featureName}</span> est disponible dans{' '}
        <span className="text-primary font-bold">PRO DIGITALIX PREMIUM</span>.
      </p>
      <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
        <Button variant="gradient" size="sm" className="gap-2">
          <Sparkles className="w-4 h-4" />
          PASSER AU PREMIUM
        </Button>
      </a>
      <p className="text-[10px] text-muted-foreground mt-2">10 000 FCFA • 12 mois</p>
    </>
  )
}

/** Bouton upsell inline léger */
export function UpgradeButton({ label = 'PASSER AU PREMIUM', size = 'sm' as const }) {
  return (
    <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
      <Button variant="gradient" size={size} className="gap-1.5">
        <Sparkles className="w-3.5 h-3.5" />
        {label}
      </Button>
    </a>
  )
}

/** Badge inline "PREMIUM" */
export function PremiumBadgeInline() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full gradient-brand text-white">
      <Sparkles className="w-2.5 h-2.5" />
      PREMIUM
    </span>
  )
}
