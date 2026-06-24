'use client'

import { useState } from 'react'
import {
  Settings, Store, Shield, Bell, Link2, Users,
  CreditCard, Receipt, Key, Save, Check, Sun, Moon,
  Monitor, Database, Globe, Clock, Languages
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useChariowAccounts } from '@/hooks/useChariowAccount'
import toast from 'react-hot-toast'

type SettingsTab = 'general' | 'account' | 'security' | 'notifications' | 'integrations' | 'team' | 'subscription' | 'billing' | 'api'

const TABS: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
  { key: 'general',       label: 'Général',       icon: Settings },
  { key: 'account',       label: 'Compte',        icon: Store },
  { key: 'security',      label: 'Sécurité',      icon: Shield },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'integrations',  label: 'Intégrations',  icon: Link2 },
  { key: 'team',          label: 'Équipe',        icon: Users },
  { key: 'subscription',  label: 'Abonnement',    icon: CreditCard },
  { key: 'billing',       label: 'Facturation',   icon: Receipt },
  { key: 'api',           label: 'API',           icon: Key },
]

const ACCENT_COLORS = [
  { value: '#2563FF', label: 'Bleu' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#10B981', label: 'Vert' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#EF4444', label: 'Rouge' },
  { value: '#EC4899', label: 'Rose' },
  { value: '#14B8A6', label: 'Teal' },
]

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('general')
  const [saved, setSaved] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark')
  const [density, setDensity] = useState<'comfortable' | 'normal' | 'compact'>('comfortable')
  const [accent, setAccent] = useState('#2563FF')
  const [dataSettings, setDataSettings] = useState({
    auto_sync: true,
    anonymize_ip: true,
    data_collection: true,
    retention: '12',
  })
  const [otherPrefs, setOtherPrefs] = useState({
    auto_export: false,
    keyboard_shortcuts: true,
    tips: true,
  })

  const { data: accounts } = useChariowAccounts()
  const account = accounts?.[0]

  function handleSave() {
    setSaved(true)
    toast.success('Paramètres enregistrés !')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gérez vos préférences et les paramètres de votre compte.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input placeholder="Rechercher dans les paramètres…"
              className="h-9 w-56 bg-secondary border border-border rounded-lg pl-3 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground" />
          </div>
          <Button variant="gradient" size="sm" onClick={handleSave}>
            {saved ? <><Check className="w-4 h-4" />Enregistré</> : <><Save className="w-4 h-4" />Enregistrer les modifications</>}
          </Button>
        </div>
      </div>

      {/* Tabs horizontaux */}
      <div className="flex border-b border-border overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5',
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Informations générales */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Informations générales</h3>
                <p className="text-xs text-muted-foreground">Informations sur votre boutique et votre entreprise.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Nom de la boutique</label>
                  <input defaultValue={account?.store_name || 'ANABOK BOUTIQUE'}
                    className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Nom de l'entreprise</label>
                  <input defaultValue="ANABOK GROUP"
                    className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5 flex items-center gap-1"><Globe className="w-3 h-3" />Domaine</label>
                  <input defaultValue={account?.store_url || 'https://anabokgroup.com'}
                    className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Devise</label>
                  <select defaultValue="XOF"
                    className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="XOF">XOF (Franc CFA)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="USD">USD (Dollar)</option>
                    <option value="GHS">GHS (Cedi ghanéen)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" />Fuseau horaire</label>
                  <select defaultValue="Africa/Abidjan"
                    className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="Africa/Abidjan">(UTC+01:00) Abidjan</option>
                    <option value="Africa/Porto-Novo">(UTC+01:00) Porto-Novo</option>
                    <option value="Africa/Lome">(UTC+00:00) Lomé</option>
                    <option value="Europe/Paris">(UTC+02:00) Paris</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5 flex items-center gap-1"><Languages className="w-3 h-3" />Langue</label>
                  <select defaultValue="fr"
                    className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-primary w-4 h-4" />
                <span className="text-sm text-foreground">Afficher les indicateurs de performance sur le tableau de bord</span>
              </label>
            </div>
          </div>

          {/* Préférences d'affichage */}
          <div className="space-y-4">
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Préférences d'affichage</h3>
                  <p className="text-xs text-muted-foreground">Personnalisez l'apparence de votre interface.</p>
                </div>
              </div>

              {/* Thème */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground block mb-2">Thème</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'light' as const, label: 'Clair', icon: Sun },
                    { key: 'dark' as const, label: 'Sombre', icon: Moon },
                    { key: 'system' as const, label: 'Système', icon: Monitor },
                  ].map(t => (
                    <button key={t.key} onClick={() => setTheme(t.key)}
                      className={cn(
                        'flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 text-sm transition-all',
                        theme === t.key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                      )}>
                      <t.icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Couleur principale */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground block mb-2">Couleur principale</label>
                <div className="flex gap-2">
                  {ACCENT_COLORS.map(c => (
                    <button key={c.value} onClick={() => setAccent(c.value)}
                      title={c.label}
                      className={cn(
                        'w-8 h-8 rounded-full border-2 transition-all',
                        accent === c.value ? 'border-foreground scale-110' : 'border-transparent'
                      )}
                      style={{ background: c.value }}>
                      {accent === c.value && <Check className="w-4 h-4 text-white mx-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Densité */}
              <div>
                <label className="text-xs text-muted-foreground block mb-2">Densité de l'interface</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'comfortable' as const, label: 'Confortable' },
                    { key: 'normal' as const, label: 'Normale' },
                    { key: 'compact' as const, label: 'Compacte' },
                  ].map(d => (
                    <button key={d.key} onClick={() => setDensity(d.key)}
                      className={cn(
                        'py-2 px-3 rounded-lg border-2 text-sm transition-all',
                        density === d.key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                      )}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Autres préférences */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-orange-400/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Autres préférences</h3>
                  <p className="text-xs text-muted-foreground">Configuration des options avancées.</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { key: 'auto_export' as const, label: 'Exportation automatique des rapports', desc: 'Recevoir vos rapports par email selon la fréquence définie.' },
                  { key: 'keyboard_shortcuts' as const, label: 'Raccourcis clavier', desc: 'Activer les raccourcis pour naviguer plus rapidement.' },
                  { key: 'tips' as const, label: 'Astuces et conseils', desc: 'Afficher des conseils pour améliorer votre expérience.' },
                ].map(p => (
                  <div key={p.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                    </div>
                    <button
                      onClick={() => setOtherPrefs(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                      className={cn('w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ml-4',
                        otherPrefs[p.key] ? 'bg-primary' : 'bg-secondary')}
                    >
                      <span className={cn('absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow',
                        otherPrefs[p.key] ? 'translate-x-5' : 'translate-x-1')} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Mode maintenance</p>
                    <p className="text-xs text-muted-foreground">Mettre votre tableau de bord en maintenance.</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs flex-shrink-0">
                    Configurer
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Paramètres données */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-green-400/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Paramètres de données</h3>
                <p className="text-xs text-muted-foreground">Gérez la collecte et la rétention de vos données.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Rétention des données</p>
                  <p className="text-xs text-muted-foreground">Durée de conservation de vos données analytiques.</p>
                </div>
                <select value={dataSettings.retention} onChange={e => setDataSettings(p => ({ ...p, retention: e.target.value }))}
                  className="h-8 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="3">3 mois</option>
                  <option value="6">6 mois</option>
                  <option value="12">12 mois</option>
                  <option value="24">24 mois</option>
                </select>
              </div>
              {[
                { key: 'auto_sync' as const, label: 'Mise à jour automatique', desc: 'Synchroniser automatiquement les données.' },
                { key: 'anonymize_ip' as const, label: 'Anonymisation IP', desc: 'Anonymiser les adresses IP des visiteurs.' },
                { key: 'data_collection' as const, label: 'Collecte des données', desc: 'Autoriser la collecte des données analytiques.' },
              ].map(s => (
                <div key={s.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                  <button
                    onClick={() => setDataSettings(p => ({ ...p, [s.key]: !p[s.key] }))}
                    className={cn('w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ml-4',
                      dataSettings[s.key] ? 'bg-primary' : 'bg-secondary')}
                  >
                    <span className={cn('absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow',
                      dataSettings[s.key] ? 'translate-x-5' : 'translate-x-1')} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* À propos */}
          <div className="glass rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center">
                <span className="text-blue-400 text-lg font-black">i</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">À propos de PRO DIGITALIX</p>
                <p className="text-xs text-muted-foreground">Version 1.0.0 • Développé par <span className="text-primary font-semibold">ANABOK GROUP</span> • {new Date().toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-3.5 h-3.5" />
              Vérifier les mises à jour
            </Button>
          </div>
        </div>
      )}

      {tab !== 'general' && (
        <div className="glass rounded-xl p-8 text-center">
          {(() => { const T = TABS.find(t => t.key === tab); return T ? <T.icon className="w-10 h-10 text-muted-foreground mx-auto mb-3" /> : null })()}
          <p className="text-muted-foreground text-sm">Section «{TABS.find(t => t.key === tab)?.label}» — disponible dans une prochaine mise à jour.</p>
        </div>
      )}
    </div>
  )
}

function RefreshCw({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
}
