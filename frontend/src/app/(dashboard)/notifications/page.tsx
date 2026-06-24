'use client'

import { useState } from 'react'
import {
  Bell, Search, Filter, Settings, CheckCheck,
  ShoppingCart, TrendingUp, AlertTriangle, FileText,
  Users, MoreHorizontal, Mail, MessageCircle, Smartphone,
  Star, Archive, X, ChevronRight, Clock
} from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type NotifTab = 'all' | 'unread' | 'important' | 'archived'

interface Notification {
  id: string
  title: string
  body: string
  type: 'order' | 'performance' | 'stock' | 'report' | 'visitor' | 'abandon'
  read: boolean
  important: boolean
  time: string
  group: 'today' | 'yesterday' | 'earlier'
}

const TYPE_CONFIG: Record<string, { color: string; icon: React.ElementType; badge: string; badgeColor: string }> = {
  order:       { color: 'bg-blue-400/10 text-blue-400',    icon: ShoppingCart,  badge: 'Commande',    badgeColor: 'bg-blue-400/10 text-blue-400' },
  performance: { color: 'bg-green-400/10 text-green-400',  icon: TrendingUp,    badge: 'Performance', badgeColor: 'bg-green-400/10 text-green-400' },
  stock:       { color: 'bg-yellow-400/10 text-yellow-400',icon: AlertTriangle, badge: 'Stock',       badgeColor: 'bg-yellow-400/10 text-yellow-400' },
  report:      { color: 'bg-purple-400/10 text-purple-400',icon: FileText,      badge: 'Rapports',    badgeColor: 'bg-purple-400/10 text-purple-400' },
  visitor:     { color: 'bg-teal-400/10 text-teal-400',    icon: Users,         badge: 'Visiteurs',   badgeColor: 'bg-teal-400/10 text-teal-400' },
  abandon:     { color: 'bg-orange-400/10 text-orange-400',icon: ShoppingCart,  badge: 'Abandons',    badgeColor: 'bg-orange-400/10 text-orange-400' },
}

const DEMO_NOTIFS: Notification[] = [
  { id: '1', title: 'Nouvelle commande #1258', body: 'Une nouvelle commande de 245 000 FCFA a été passée par Marie K.', type: 'order', read: false, important: true, time: 'Il y a 5 minutes', group: 'today' },
  { id: '2', title: 'Objectif de ventes atteint !', body: 'Félicitations ! Vous avez atteint 100% de votre objectif de ventes quotidien.', type: 'performance', read: false, important: true, time: 'Il y a 1 heure', group: 'today' },
  { id: '3', title: 'Stock faible : 3 produits', body: 'Certains produits ont un stock faible. Vérifiez maintenant.', type: 'stock', read: false, important: false, time: 'Il y a 2 heures', group: 'today' },
  { id: '4', title: 'Rapport hebdomadaire disponible', body: 'Votre rapport de performance hebdomadaire est prêt.', type: 'report', read: true, important: false, time: 'Hier à 09:00', group: 'yesterday' },
  { id: '5', title: 'Visites en hausse', body: 'Vos visites ont augmenté de 25% par rapport à hier.', type: 'visitor', read: true, important: false, time: 'Hier à 08:30', group: 'yesterday' },
  { id: '6', title: 'Abandon de panier détecté', body: '18 paniers ont été abandonnés dans les dernières 24h.', type: 'abandon', read: true, important: false, time: 'Il y a 3 jours', group: 'earlier' },
]

const CHANNEL_CONFIG = [
  { key: 'in_app', label: 'Notifications in-app', icon: Bell, enabled: true },
  { key: 'email', label: 'Email', icon: Mail, enabled: true },
  { key: 'sms', label: 'SMS', icon: MessageCircle, enabled: false },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, enabled: true },
  { key: 'push', label: 'Push mobile', icon: Smartphone, enabled: true },
]

export default function NotificationsPage() {
  const [tab, setTab] = useState<NotifTab>('all')
  const [search, setSearch] = useState('')
  const [channels, setChannels] = useState<Record<string, boolean>>(
    Object.fromEntries(CHANNEL_CONFIG.map(c => [c.key, c.enabled]))
  )
  const [notifications, setNotifications] = useState(DEMO_NOTIFS)

  const unreadCount = notifications.filter(n => !n.read).length
  const importantCount = notifications.filter(n => n.important).length

  const filtered = notifications.filter(n => {
    if (tab === 'unread') return !n.read
    if (tab === 'important') return n.important
    if (tab === 'archived') return false
    return true
  }).filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase()))

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const groups: { key: 'today' | 'yesterday' | 'earlier'; label: string }[] = [
    { key: 'today', label: "Aujourd'hui" },
    { key: 'yesterday', label: 'Hier' },
    { key: 'earlier', label: 'Plus tôt' },
  ]

  const tabs = [
    { key: 'all' as NotifTab, label: 'Toutes', count: notifications.length },
    { key: 'unread' as NotifTab, label: 'Non lues', count: unreadCount },
    { key: 'important' as NotifTab, label: 'Importantes', count: importantCount },
    { key: 'archived' as NotifTab, label: 'Archives', count: 0 },
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
          <Button variant="outline" size="sm" onClick={markAllRead}>
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

          {/* Notifications groupées */}
          <div className="divide-y divide-border">
            {groups.map(group => {
              const groupNotifs = filtered.filter(n => n.group === group.key)
              if (groupNotifs.length === 0) return null
              return (
                <div key={group.key}>
                  <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/30">
                    {group.label}
                  </p>
                  {groupNotifs.map(n => {
                    const cfg = TYPE_CONFIG[n.type]
                    const Icon = cfg.icon
                    return (
                      <div
                        key={n.id}
                        className={cn(
                          'flex items-start gap-4 px-4 py-4 hover:bg-secondary/30 transition-colors cursor-pointer border-b border-border/50',
                          !n.read && 'bg-primary/3'
                        )}
                      >
                        {/* Dot non lu */}
                        <div className="flex-shrink-0 mt-1">
                          <div className={cn('w-2 h-2 rounded-full', !n.read ? 'bg-primary' : 'bg-transparent')} />
                        </div>

                        {/* Icône */}
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.color)}>
                          <Icon className="w-5 h-5" />
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn('text-sm', !n.read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80')}>
                              {n.title}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', cfg.badgeColor)}>
                                {cfg.badge}
                              </span>
                              {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                              <button className="text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                          <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />{n.time}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {filtered.length === 0 && (
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
                { icon: Bell, label: 'Total reçues', value: 48, color: 'text-primary' },
                { icon: Mail, label: 'Par email', value: 32, color: 'text-green-400' },
                { icon: Smartphone, label: 'Par SMS', value: 12, color: 'text-orange-400' },
                { icon: MessageCircle, label: 'Par WhatsApp', value: 4, color: 'text-green-400' },
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
