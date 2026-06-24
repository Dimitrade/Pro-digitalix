'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, ShoppingCart,
  Brain, FileText, Settings,
  ShieldCheck, Eye, Zap, Bell, Link2, BarChart2, Sparkles, Crown,
  TrendingUp, Shield, Tag, CreditCard, Activity, BookOpen, HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { Logo } from '@/components/ui/logo'
import { useSubscription } from '@/hooks/useSubscription'
import { useUnreadCount } from '@/hooks/useNotifications'

const nav = [
  { href: '/dashboard',     label: 'Tableau de bord',     icon: LayoutDashboard },
  { href: '/visitors',      label: 'Visiteurs',           icon: Eye },
  { href: '/products',      label: 'Analytics Produits',  icon: BarChart2 },
  { href: '/customers',     label: 'CRM Clients',         icon: Users },
  { href: '/sales',         label: 'Commandes',           icon: ShoppingCart },
  { href: '/abandons',      label: 'Abandons',            icon: Zap },
  { href: '/ai',            label: 'Assistant IA',        icon: Brain, badge: 'IA', premium: true },
  { href: '/reports',       label: 'Rapports',            icon: FileText, premium: true },
  { href: '/integrations',  label: 'Intégration Chariow', icon: Link2 },
  { href: '/notifications', label: 'Notifications',       icon: Bell, notif: true },
  { href: '/settings',      label: 'Paramètres',          icon: Settings },
  { href: '/onboarding',   label: 'Guide de démarrage',  icon: BookOpen },
  { href: '/support',      label: 'Centre d\'aide',      icon: HelpCircle },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { plan, isPremium, isOwner, daysLeft } = useSubscription()
  const unread = useUnreadCount()
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'owner'

  return (
    <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-card h-full flex-shrink-0">
      {/* Logo officiel */}
      <div className="p-4 border-b border-border">
        <Logo size="sm" variant="full" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {nav.map((item) => {
          const locked = item.premium && !isPremium && !isOwner
          return (
            <Link
              key={item.href}
              href={locked ? '/pricing' : item.href}
              className={cn('sidebar-item', pathname === item.href && 'active', locked && 'opacity-60')}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && !locked && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full gradient-brand text-white flex-shrink-0">
                  {item.badge}
                </span>
              )}
              {locked && (
                <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
              )}
              {item.notif && unread > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-white flex-shrink-0">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
          )
        })}

        {/* Section abonnement (non-owner) */}
        {!isOwner && (
          <>
            <div className="border-t border-border/50 my-2" />
            <Link href="/subscription" className={cn('sidebar-item', pathname === '/subscription' && 'active')}>
              <CreditCard className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 truncate">Mon Abonnement</span>
            </Link>
          </>
        )}

        {isAdmin && (
          <>
            <div className="border-t border-border/50 my-2" />
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 py-2">
              Admin
            </p>
            <Link href="/admin" className={cn('sidebar-item', pathname.startsWith('/admin') && 'active')}>
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              Administration
            </Link>
          </>
        )}

        {/* Section OWNER — invisible pour les autres rôles */}
        {isOwner && (
          <>
            <div className="border-t border-border/50 my-2" />
            <p className="text-[10px] font-semibold text-yellow-400/70 uppercase tracking-widest px-3 py-2">
              Owner
            </p>
            {[
              { href: '/owner/saas',       label: 'Dashboard SaaS',   icon: LayoutDashboard },
              { href: '/owner/monitoring', label: 'Monitoring',       icon: Activity },
              { href: '/owner/stats',      label: 'Revenus & Stats',  icon: TrendingUp },
              { href: '/owner/users',      label: 'Utilisateurs',     icon: Users },
              { href: '/owner/promos',     label: 'Promotions',       icon: Tag },
              { href: '/owner/audit',      label: 'Journal Audit',    icon: Shield },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className={cn('sidebar-item', pathname.startsWith(item.href) && 'active')}>
                <item.icon className="w-4 h-4 flex-shrink-0 text-yellow-400" />
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Plan + user */}
      <div className="p-3 border-t border-border space-y-2">
        {/* Badge plan */}
        {isOwner ? (
          <div className="px-3 py-2.5 glass rounded-lg border border-primary/20">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-400" />
              <p className="text-xs font-black text-foreground">OWNER — Accès illimité</p>
            </div>
          </div>
        ) : isPremium ? (
          <div className="px-3 py-2.5 glass rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs font-bold gradient-text">PREMIUM</p>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-400/10 text-green-400">Actif</span>
            </div>
            {daysLeft !== null && (
              <p className="text-[10px] text-muted-foreground mt-1">{daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}</p>
            )}
          </div>
        ) : (
          <Link href="/pricing" className="block px-3 py-2.5 glass rounded-lg hover:border-primary/30 border border-border/50 transition-colors">
            <p className="text-[10px] text-muted-foreground">Plan Actuel</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-xs font-bold text-foreground">GRATUIT</p>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full gradient-brand text-white">→ PREMIUM</span>
            </div>
            <div className="mt-1.5 h-1 bg-secondary rounded-full overflow-hidden">
              <div className="h-full gradient-brand rounded-full" style={{ width: '30%' }} />
            </div>
          </Link>
        )}

        {/* User */}
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {session?.user?.full_name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">{session?.user?.full_name || 'Utilisateur'}</p>
            <p className="text-[10px] text-muted-foreground truncate">{session?.user?.email || ''}</p>
          </div>
        </div>

        <p className="text-center text-[9px] text-muted-foreground/50 pb-1">
          Développé par <span className="text-muted-foreground">ANABOK GROUP</span>
        </p>
      </div>
    </aside>
  )
}
