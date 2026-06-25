'use client'

import { useState } from 'react'
import {
  Bell, Search, Filter, Settings, CheckCheck,
  ShoppingCart, TrendingUp, AlertTriangle, FileText,
  Users, MoreHorizontal, Mail, MessageCircle, Smartphone,
  Star, Archive, X, ChevronRight, Clock, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/hooks/useNotifications'
import { useChariowAccounts } from '@/hooks/useChariowAccount'

type NotifTab = 'all' | 'unread' | 'archived'

const TYPE_CONFIG: Record<string, { color: string; icon: React.ElementType; badge: string; badgeColor: string }> = {
  order:       { color: 'bg-blue-400/10 text-blue-400',    icon: ShoppingCart,  badge: 'Commande',    badgeColor: 'bg-blue-400/10 text-blue-400' },
  performance: { color: 'bg-green-400/10 text-green-400',  icon: TrendingUp,    badge: 'Performance', badgeColor: 'bg-green-400/10 text-green-400' },
  stock:       { color: 'bg-yellow-400/10 text-yellow-400',icon: AlertTriangle, badge: 'Stock',       badgeColor: 'bg-yellow-400/10 text-yellow-400' },
  report:      { color: 'bg-purple-400/10 text-purple-400',icon: FileText,      badge: 'Rapports',    badgeColor: 'bg-purple-400/10 text-purple-400' },
  visitor:     { color: 'bg-teal-400/10 text-teal-400',    icon: Users,         badge: 'Visiteurs',   badgeColor: 'bg-teal-400/10 text-teal-400' },
  abandon:     { color: 'bg-orange-400/10 text-orange-400',icon: ShoppingCart,  badge: 'Abandons',    badgeColor: 'bg-orange-400/10 text-orange-400' },
}

const CHANNEL_CONFIG = [
  { key: 'in_app', label: 'Notifications in-app', icon: Bell, enabled: true },
  { key: 'email', label: 'Email', icon: Mail, enabled: true },
  { key: 'sms', label: 'SMS', icon: MessageCircle, enabled: false },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, enabled: true },
  { key: 'push', label: 'Push mobile', icon: Smartphone, enabled: true },
]

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} minute${mins > 1 ? 's' : ''}`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Hier'
  return `Il y a ${days} jours`
}

export default function NotificationsPage() {
  const [tab, setTab] = useState<NotifTab>('all')
  const [search, setSearch] = useState('')
  const [channels, setChannels] = useState<Record<string, boolean>>(
    Object.fromEntries(CHANNEL_CONFIG.map(c => [c.key, c.enabled]))
  )

  const { data: accounts } = useChariowAccounts()
  const hasAccount = !!accounts?.[0]
  const { notifications: rawNotifs, unreadCount, isLoading, markRead, markAllRead } = useNotifications()

  const filtered = rawNotifs.filter(n => {
    if (tab === 'unread') return !n.read_at
    if (tab === 'archived') return !!n.archived_at
    return !n.archived_at
  }).filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase()))

  const tabs = [
    { key: 'all' as NotifTab, label: 'Toutes', count: rawNotifs.filter(n => !n.archived_at).length },
    { key: 'unread' as NotifTab, label: 'Non lues', count: unreadCount },
    { key: 'archived' as NotifTab, label: 'Archives', count: rawNotifs.filter(n => !!n.archived_at).length },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Notifications
            {unreadCount > 0 && (
              <span className="w-6 h-6 rounded-full gradient-brand text-white text-xs flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Restez informé de tout ce qui compte pour votre boutique.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="h-9 w-48 bg-secondary border border-border rounded-lg pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground" />
          </div>
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={!hasAccount || unreadCount === 0}>
            <CheckCheck className="w-4 h-4" />
            Marquer tout comme lu
          </Button>
          <Button variant="gradient" size="sm">
            <Settings className="w-4 h-4" />
            Paramètres des notifications
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Liste notifications */}
        <div className="flex-1 glass rounded-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-border px-4">
            <div className="flex">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={cn('px-4 py-3.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5',
                    tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                  {t.label}
                  {t.count > 0 && (
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                      tab === t.key ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground')}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm">
              <Filter className="w-3.5 h-3.5" />
              Filtrer
            </Button>
          </div>

          {/* Notifications */}
          <div className="divide-y divide-border">
            {!hasAccount && (
              <div className="py-16 text-center px-6">
                <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Bienvenue sur PRO DIGITALIX !</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  Connectez votre boutique Chariow pour recevoir vos notifications de ventes, stocks et performances en temps réel.
                </p>
              </div>
            )}
            {hasAccount && isLoading && (
              <div className="py-12 text-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}
            {hasAccount && !isLoading && filtered.map(n => {
              const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG['order']
              const Icon = cfg.icon
              const isUnread = !n.read_at
              return (
                <div
                  key={n.id}
                  onClick={() => isUnread && markRead(n.id)}
                  className={cn(
                    'flex items-start gap-4 px-4 py-4 hover:bg-secondary/30 transition-colors cursor-pointer border-b border-border/50',
                    isUnread && 'bg-primary/3'
                  )}
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className={cn('w-2 h-2 rounded-full', isUnread ? 'bg-primary' : 'bg-transparent')} />
                  </div>
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm', isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80')}>
                        {n.title}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', cfg.badgeColor)}>
                          {cfg.badge}
                        </span>
                        {isUnread && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{formatRelativeTime(n.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}

            {hasAccount && !isLoading && filtered.length === 0 && (
              <div className="py-12 text-center">
                <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Aucune notification.</p>
              </div>
            )}
          </div>

          <div className="p-4 text-center">
            <Button variant="outline" size="sm">
              Charger plus
            </Button>
          </div>
        </div>

        {/* Sidebar préférences */}
        <div className="hidden xl:flex flex-col gap-4 w-72">
          {/* Préférences */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-1">Préférences</h3>
            <p className="text-xs text-muted-foreground mb-4">Personnalisez vos notifications selon vos besoins.</p>
            <div className="space-y-1">
              {[
                { label: 'Paramètres des notifications' },
                { label: 'Gérer les catégories' },
                { label: 'Heures de silence', value: '22:00 - 07:00' },
                { label: 'Fréquence des résumés', value: 'Quotidien' },
              ].map(p => (
                <div key={p.label} className="flex items-center justify-between px-2 py-2.5 rounded-lg hover:bg-secondary cursor-pointer">
                  <span className="text-sm text-foreground">{p.label}</span>
                  <div className="flex items-center gap-1">
                    {p.value && <span className="text-xs text-muted-foreground">{p.value}</span>}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Canaux */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-1">Canaux activés</h3>
            <p className="text-xs text-muted-foreground mb-4">Choisissez comment vous souhaitez être notifié.</p>
            <div className="space-y-3">
              {CHANNEL_CONFIG.map(c => (
                <div key={c.key} className="flex items-center gap-3">
                  <c.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 text-sm text-foreground">{c.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-medium', channels[c.key] ? 'text-green-400' : 'text-muted-foreground')}>
                      {channels[c.key] ? 'Activé' : 'Désactivé'}
                    </span>
                    <button
                      onClick={() => setChannels(prev => ({ ...prev, [c.key]: !prev[c.key] }))}
                      className={cn(
                        'w-10 h-5 rounded-full transition-colors relative',
                        channels[c.key] ? 'bg-primary' : 'bg-secondary'
                      )}
                    >
                      <span className={cn(
                        'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm',
                        channels[c.key] ? 'translate-x-5' : 'translate-x-0.5'
                      )} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Résumé */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-1">Résumé</h3>
            <p className="text-xs text-muted-foreground mb-4">Sur les 7 derniers jours</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Bell, label: 'Total reçues', value: rawNotifs.length, color: 'text-primary' },
                { icon: Bell, label: 'Non lues', value: unreadCount, color: 'text-green-400' },
              ].map(s => (
                <div key={s.label} className="glass rounded-lg p-3 text-center">
                  <s.icon className={cn('w-4 h-4 mx-auto mb-1', s.color)} />
                  <p className="font-bold text-foreground text-lg">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
