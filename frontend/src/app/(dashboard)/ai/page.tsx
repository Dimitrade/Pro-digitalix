'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Brain, Send, Paperclip, TrendingUp, Package, Users,
  Zap, Lightbulb, BarChart2, FileText, RefreshCw,
  CheckCircle, AlertTriangle, Info, Target, Sparkles,
  Download, ArrowRight, Clock, ChevronRight
} from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'
import { aiApi } from '@/lib/api'
import { useChariowAccounts } from '@/hooks/useChariowAccount'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  chart?: { data: any[]; dataKey: string; label: string }
}

interface Insight {
  type: 'success' | 'warning' | 'info' | 'opportunity'
  title: string
  body: string
  value?: string
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { icon: BarChart2, label: 'Analyse des ventes du mois', color: 'text-blue-400' },
  { icon: Package, label: 'Produits les plus performants', color: 'text-green-400' },
  { icon: Users, label: 'Clients à fort potentiel', color: 'text-purple-400' },
  { icon: Zap, label: 'Recommandations pour augmenter les ventes', color: 'text-orange-400' },
]

const QUICK_ACTIONS = [
  { icon: FileText, label: 'Générer un rapport' },
  { icon: BarChart2, label: 'Analyser une période' },
  { icon: Package, label: 'Comparer des produits' },
  { icon: Users, label: 'Segmenter mes clients' },
  { icon: TrendingUp, label: 'Prévisions de ventes' },
]

const INSIGHT_COLORS: Record<string, { bg: string; icon: React.ElementType; iconColor: string }> = {
  success: { bg: 'border-green-500/30 bg-green-500/5', icon: TrendingUp, iconColor: 'text-green-400' },
  warning: { bg: 'border-yellow-500/30 bg-yellow-500/5', icon: AlertTriangle, iconColor: 'text-yellow-400' },
  info: { bg: 'border-blue-500/30 bg-blue-500/5', icon: Info, iconColor: 'text-blue-400' },
  opportunity: { bg: 'border-purple-500/30 bg-purple-500/5', icon: Lightbulb, iconColor: 'text-purple-400' },
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AiPage() {
  const { data: session } = useSession()
  const { data: accounts } = useChariowAccounts()
  const accountId = accounts?.[0]?.id || null
  const currency = accounts?.[0]?.currency || 'XOF'

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['ai-insights', accountId],
    queryFn: () => aiApi.insights(accountId!),
    enabled: !!accountId,
    staleTime: 10 * 60_000,
  })

  const { data: forecastsData } = useQuery({
    queryKey: ['ai-forecasts', accountId],
    queryFn: () => aiApi.forecasts(accountId!),
    enabled: !!accountId,
    staleTime: 30 * 60_000,
  })

  const insights: Insight[] = insightsData?.insights || DEMO_INSIGHTS
  const forecasts = forecastsData?.forecasts || DEMO_FORECASTS

  const chatMutation = useMutation({
    mutationFn: (msgs: ChatMessage[]) =>
      aiApi.chat(accountId!, msgs.map(m => ({ role: m.role, content: m.content }))),
    onSuccess: (data: any) => {
      const reply = data?.reply || data
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: typeof reply === 'string' ? reply : 'Réponse reçue.',
        timestamp: new Date(),
        chart: detectChartInReply(typeof reply === 'string' ? reply : ''),
      }])
    },
    onError: () => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Je n\'ai pas pu traiter votre demande. Vérifiez votre connexion ou réessayez.',
        timestamp: new Date(),
      }])
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function sendMessage(text?: string) {
    const content = (text || input).trim()
    if (!content || chatMutation.isPending) return

    const userMsg: ChatMessage = { role: 'user', content, timestamp: new Date() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    chatMutation.mutate(newMessages)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function clearHistory() {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-1.5rem)] space-y-0 animate-fade-in -m-6">
      <div className="flex flex-1 overflow-hidden">

        {/* ── Panneau gauche : chat ── */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-foreground flex items-center gap-2">
                  Assistant IA
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full gradient-brand text-white">NOUVEAU</span>
                </h1>
                <p className="text-xs text-muted-foreground">Votre assistant intelligent pour analyser et développer votre activité.</p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearHistory}>
                <RefreshCw className="w-3.5 h-3.5" />
                Effacer l'historique
              </Button>
            )}
          </div>

          {/* Zone de conversation */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* État vide : accueil */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[320px] text-center space-y-6">
                {/* Avatar IA animé */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-3xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/30">
                    <Brain className="w-12 h-12 text-white" />
                  </div>
                  <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-400 animate-pulse" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Bonjour {session?.user?.full_name?.split(' ')[0] || 'Dimitri'} !
                  </h2>
                  <p className="text-muted-foreground mt-1">Comment puis-je vous aider aujourd'hui ?</p>
                </div>

                {/* Raccourcis */}
                <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                  {QUICK_PROMPTS.map(q => (
                    <button
                      key={q.label}
                      onClick={() => sendMessage(q.label)}
                      className="flex items-center gap-2.5 p-3.5 glass rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                    >
                      <q.icon className={cn('w-4 h-4 flex-shrink-0', q.color)} />
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors">{q.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}>
                {/* Avatar */}
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={cn('max-w-[75%] space-y-2', msg.role === 'user' && 'items-end flex flex-col')}>
                  {/* Bulle */}
                  <div className={cn(
                    'px-4 py-3 rounded-2xl text-sm',
                    msg.role === 'user'
                      ? 'gradient-brand text-white rounded-tr-sm'
                      : 'glass border border-border text-foreground rounded-tl-sm'
                  )}>
                    {msg.role === 'assistant' ? (
                      <MarkdownContent content={msg.content} />
                    ) : (
                      msg.content
                    )}
                  </div>

                  {/* Graphique inline si détecté */}
                  {msg.chart && (
                    <div className="glass rounded-xl p-4 border border-border w-full min-w-[340px]">
                      <p className="text-xs font-semibold text-muted-foreground mb-3">{msg.chart.label}</p>
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={msg.chart.data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => formatNumber(v)} />
                          <Tooltip
                            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                            formatter={(v: any) => [formatNumber(v), msg.chart!.dataKey]}
                          />
                          <Line type="monotone" dataKey="value" stroke="#2563FF" strokeWidth={2} dot={{ fill: '#2563FF', r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="text-xs">
                          <Download className="w-3 h-3" />
                          Télécharger le rapport
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs">
                          <BarChart2 className="w-3 h-3" />
                          Voir en Analytics
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Heure */}
                  <p className="text-[10px] text-muted-foreground px-1">
                    {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    {msg.role === 'user' && ' ✓✓'}
                  </p>
                </div>
              </div>
            ))}

            {/* Indicateur de frappe */}
            {chatMutation.isPending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="glass border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                  {[0, 150, 300].map(delay => (
                    <span key={delay} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Disclaimer */}
          <div className="text-center py-1.5">
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" />
              L'IA peut se tromper. Vérifiez les informations importantes.
            </p>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-card/50">
            <div className="flex items-end gap-3 glass rounded-2xl border border-border p-3">
              <button className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mb-0.5">
                <Paperclip className="w-4 h-4" />
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question ou demandez une analyse…"
                rows={1}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none leading-relaxed max-h-32 overflow-y-auto"
                style={{ height: 'auto' }}
                onInput={e => {
                  const t = e.currentTarget
                  t.style.height = 'auto'
                  t.style.height = Math.min(t.scrollHeight, 128) + 'px'
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || chatMutation.isPending}
                className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Panneau droit ── */}
        <div className="w-72 xl:w-80 flex-shrink-0 flex flex-col overflow-y-auto bg-card/30 border-l border-border">

          {/* Insights IA */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">Insights IA</h3>
            </div>
            <p className="text-[10px] text-muted-foreground mb-3">Ce que l'IA a détecté pour vous</p>

            {insightsLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-secondary/50 rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {insights.map((ins, i) => {
                  const cfg = INSIGHT_COLORS[ins.type]
                  const Icon = cfg.icon
                  return (
                    <div key={i} className={cn('p-3 rounded-xl border', cfg.bg)}>
                      <div className="flex items-start gap-2">
                        <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', cfg.iconColor)} />
                        <div>
                          <p className="text-xs font-medium text-foreground">{ins.title}</p>
                          {ins.value && (
                            <p className={cn('text-lg font-black', cfg.iconColor)}>{ins.value}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-0.5">{ins.body}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <button
              onClick={() => sendMessage('Explique-moi tous mes insights en détail')}
              className="mt-3 text-xs text-primary hover:underline flex items-center gap-1"
            >
              Voir tous les insights <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Prévisions */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">Prévisions 3 mois</h3>
            </div>
            <div className="space-y-2">
              {forecasts.map((f: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-foreground">{f.month}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{formatCurrency(f.predicted_revenue, currency)}</p>
                    <p className="text-[10px] text-muted-foreground">Confiance {f.confidence}%</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => sendMessage('Explique-moi tes prévisions de ventes pour les 3 prochains mois')}
              className="mt-3 text-xs text-primary hover:underline flex items-center gap-1"
            >
              Analyser les prévisions <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Actions rapides */}
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm mb-3">Actions rapides</h3>
            <div className="space-y-1">
              {QUICK_ACTIONS.map(a => (
                <button
                  key={a.label}
                  onClick={() => sendMessage(a.label)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary text-sm text-foreground transition-colors group"
                >
                  <a.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  {a.label}
                  <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          {/* Suggestions marketing */}
          <div className="p-4">
            <h3 className="font-semibold text-foreground text-sm mb-3">Suggestions pour vous</h3>
            <div className="space-y-2">
              {MARKETING_SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="w-full text-left text-xs text-muted-foreground hover:text-foreground p-2.5 rounded-lg hover:bg-secondary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => sendMessage('Donne-moi toutes tes suggestions marketing pour développer mes ventes')}
              className="mt-3 text-xs text-primary hover:underline flex items-center gap-1"
            >
              Voir plus de suggestions <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Markdown léger ───────────────────────────────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="space-y-1 text-sm">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} className="font-semibold text-foreground text-xs mt-2">{line.slice(4)}</h3>
        if (line.startsWith('## ')) return <h2 key={i} className="font-bold text-foreground text-sm mt-2">{line.slice(3)}</h2>
        if (line.startsWith('# ')) return <h1 key={i} className="font-black text-foreground mt-2">{line.slice(2)}</h1>
        if (line.startsWith('- ') || line.startsWith('* ')) return (
          <div key={i} className="flex items-start gap-1.5">
            <span className="text-primary mt-1 flex-shrink-0">•</span>
            <span>{renderInline(line.slice(2))}</span>
          </div>
        )
        if (/^\d+\. /.test(line)) return (
          <div key={i} className="flex items-start gap-1.5">
            <span className="text-primary flex-shrink-0 font-semibold">{line.match(/^\d+/)?.[0]}.</span>
            <span>{renderInline(line.replace(/^\d+\. /, ''))}</span>
          </div>
        )
        if (line.trim() === '') return <div key={i} className="h-1" />
        return <p key={i}>{renderInline(line)}</p>
      })}
    </div>
  )
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i} className="italic">{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-secondary px-1 py-0.5 rounded text-xs font-mono text-primary">{part.slice(1, -1)}</code>
    return part
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectChartInReply(content: string): ChatMessage['chart'] | undefined {
  // Détecte si la réponse parle d'évolution ou de tendance pour injecter un graphique
  const hasChart = /évolution|tendance|historique|progression|croissance|mois dernier|6 derniers/i.test(content)
  if (!hasChart) return undefined

  // Graphique d'exemple basé sur les données ANABOK
  return {
    label: 'Évolution des ventes',
    dataKey: 'Ventes',
    data: [
      { label: 'Jan', value: 8000 },
      { label: 'Fév', value: 12000 },
      { label: 'Mar', value: 9500 },
      { label: 'Avr', value: 15000 },
      { label: 'Mai', value: 18500 },
      { label: 'Jun', value: 25000 },
    ],
  }
}

// ─── Données démo ─────────────────────────────────────────────────────────────

const DEMO_INSIGHTS: Insight[] = [
  { type: 'success', title: 'Ventes en hausse', body: 'vs le mois dernier', value: '+23.7%' },
  { type: 'info', title: 'Produit star', body: '"FORMATION VENTE DIGITALE" génère 84% de vos revenus.', value: '155 000 XOF' },
  { type: 'warning', title: '18 clients inactifs', body: 'pourraient être récupérés. Potentiel : 2 180 000 XOF' },
  { type: 'opportunity', title: 'Opportunité TikTok', body: 'Vos visiteurs TikTok convertissent 2x mieux. ROI potentiel : +35%' },
]

const DEMO_FORECASTS = [
  { month: 'Juillet 2026', predicted_revenue: 210000, confidence: 82 },
  { month: 'Août 2026', predicted_revenue: 235000, confidence: 71 },
  { month: 'Septembre 2026', predicted_revenue: 280000, confidence: 63 },
]

const MARKETING_SUGGESTIONS = [
  'Analysez vos sources de trafic pour optimiser vos campagnes.',
  'Relancez vos paniers abandonnés pour récupérer des ventes.',
  'Créez une offre spéciale pour fidéliser vos meilleurs clients.',
]
