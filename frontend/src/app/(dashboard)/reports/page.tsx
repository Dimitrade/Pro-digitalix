'use client'

import { useState } from 'react'
import {
  FileText, Download, Calendar, Clock, CheckCircle2,
  RefreshCw, BarChart2, Users, Package, Globe,
  Brain, Sparkles, Filter, Trash2, Eye
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import toast from 'react-hot-toast'
import { formatCurrency, formatNumber, formatDate, cn } from '@/lib/utils'
import { reportsApi } from '@/lib/api'
import { useChariowAccounts } from '@/hooks/useChariowAccount'
import { Button } from '@/components/ui/button'

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportType = 'daily' | 'weekly' | 'monthly' | 'annual' | 'custom'
type ReportFormat = 'pdf' | 'xlsx' | 'csv'

const TYPE_CONFIG: Record<ReportType, { label: string; desc: string; icon: React.ElementType; color: string }> = {
  daily:   { label: 'Journalier',     desc: "Rapport d'aujourd'hui",          icon: Clock,    color: 'text-blue-400 bg-blue-400/10' },
  weekly:  { label: 'Hebdomadaire',   desc: '7 derniers jours',               icon: Calendar, color: 'text-green-400 bg-green-400/10' },
  monthly: { label: 'Mensuel',        desc: 'Ce mois en cours',               icon: BarChart2,color: 'text-purple-400 bg-purple-400/10' },
  annual:  { label: 'Annuel',         desc: `Année ${new Date().getFullYear()}`, icon: Globe,color: 'text-orange-400 bg-orange-400/10' },
  custom:  { label: 'Personnalisé',   desc: 'Choisir vos dates',              icon: Filter,   color: 'text-pink-400 bg-pink-400/10' },
}

const REPORT_SECTIONS = [
  { icon: BarChart2, label: 'Résumé exécutif',       desc: 'KPIs globaux et performances clés' },
  { icon: FileText,  label: 'Analyse des ventes',    desc: 'Évolution du CA, commandes, panier moyen' },
  { icon: Users,     label: 'Analyse clients',       desc: 'Nouveaux clients, rétention, CLV' },
  { icon: Package,   label: 'Analyse produits',      desc: 'Top produits, scores IA, recommandations' },
  { icon: Globe,     label: 'Analyse du trafic',     desc: 'Sources, pays, appareils' },
  { icon: Brain,     label: 'Recommandations IA',    desc: 'Actions prioritaires générées par GPT-4' },
]

// ─── Génération PDF branded PRO DIGITALIX ────────────────────────────────────

function generatePDF(data: any, currency: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, M = 16
  let y = 0

  // ── Cover ──────────────────────────────────
  doc.setFillColor(10, 15, 28) // #0A0F1C
  doc.rect(0, 0, W, 297, 'F')

  // Gradient bar top
  doc.setFillColor(37, 99, 255) // #2563FF
  doc.rect(0, 0, W, 4, 'F')

  // Logo text
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text('PRO', M, 28)
  doc.setTextColor(37, 99, 255)
  doc.text('DIGITALIX', M + 26, 28)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('Analysez • Optimisez • Développez', M, 34)

  // Title block
  doc.setFillColor(30, 41, 59) // #1E293B
  doc.roundedRect(M, 50, W - M * 2, 60, 4, 4, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text(data.meta?.title || 'Rapport Analytics', M + 8, 68)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(148, 163, 184)
  doc.text(`Boutique : ${data.meta?.store_name || ''}`, M + 8, 78)
  doc.text(`Période : ${data.meta?.period || ''}`, M + 8, 85)
  doc.text(`Généré le : ${new Date(data.meta?.generated_at || Date.now()).toLocaleString('fr-FR')}`, M + 8, 92)
  doc.text(`Devise : ${currency}`, M + 8, 99)

  // KPIs block
  y = 130
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text('Résumé de la période', M, y)
  y += 8

  const kpis = [
    { label: 'CA Total', value: formatCurrency(data.summary?.total_revenue || 0, currency) },
    { label: 'Commandes', value: formatNumber(data.summary?.total_orders || 0) },
    { label: 'Panier moyen', value: formatCurrency(data.summary?.avg_order_value || 0, currency) },
    { label: 'Nouveaux clients', value: formatNumber(data.summary?.new_customers || 0) },
  ]

  const kpiW = (W - M * 2 - 12) / 4
  kpis.forEach((kpi, i) => {
    const x = M + i * (kpiW + 4)
    doc.setFillColor(30, 41, 59)
    doc.roundedRect(x, y, kpiW, 28, 3, 3, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(kpi.label, x + 4, y + 8)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(37, 99, 255)
    doc.text(kpi.value, x + 4, y + 18)
  })
  y += 40

  // ── Page 2 : Produits ─────────────────────
  doc.addPage()
  doc.setFillColor(10, 15, 28)
  doc.rect(0, 0, W, 297, 'F')
  doc.setFillColor(37, 99, 255)
  doc.rect(0, 0, W, 2, 'F')

  y = 16
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text('Top Produits', M, y)
  y += 10

  // En-tête table
  doc.setFillColor(37, 99, 255)
  doc.rect(M, y, W - M * 2, 8, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('#', M + 3, y + 5.5)
  doc.text('Produit', M + 12, y + 5.5)
  doc.text('Ventes', M + 110, y + 5.5)
  doc.text('Revenus', M + 135, y + 5.5)
  y += 8

  const products = data.top_products || []
  products.slice(0, 10).forEach((p: any, i: number) => {
    doc.setFillColor(i % 2 === 0 ? 22 : 30, i % 2 === 0 ? 32 : 41, i % 2 === 0 ? 50 : 59)
    doc.rect(M, y, W - M * 2, 7, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(200, 210, 230)
    doc.text(String(i + 1), M + 3, y + 5)
    const name = p.name?.length > 52 ? p.name.slice(0, 52) + '…' : (p.name || '')
    doc.text(name, M + 12, y + 5)
    doc.text(String(p.sales || 0), M + 110, y + 5)
    doc.setTextColor(37, 99, 255)
    doc.text(formatCurrency(p.revenue || 0, currency), M + 135, y + 5)
    y += 7
  })

  // ── Page 3 : Clients ──────────────────────
  doc.addPage()
  doc.setFillColor(10, 15, 28)
  doc.rect(0, 0, W, 297, 'F')
  doc.setFillColor(37, 99, 255)
  doc.rect(0, 0, W, 2, 'F')

  y = 16
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text('Top Clients', M, y)
  y += 10

  doc.setFillColor(37, 99, 255)
  doc.rect(M, y, W - M * 2, 8, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('Client', M + 3, y + 5.5)
  doc.text('Email', M + 70, y + 5.5)
  doc.text('Cmd', M + 140, y + 5.5)
  doc.text('Dépensé', M + 155, y + 5.5)
  y += 8

  const topCustomers = data.top_customers || []
  topCustomers.slice(0, 10).forEach((c: any, i: number) => {
    doc.setFillColor(i % 2 === 0 ? 22 : 30, i % 2 === 0 ? 32 : 41, i % 2 === 0 ? 50 : 59)
    doc.rect(M, y, W - M * 2, 7, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(200, 210, 230)
    doc.text((c.name || '').slice(0, 30), M + 3, y + 5)
    doc.text((c.email || '').slice(0, 35), M + 70, y + 5)
    doc.text(String(c.orders || 0), M + 140, y + 5)
    doc.setTextColor(37, 99, 255)
    doc.text(formatCurrency(c.total_spent || 0, currency), M + 155, y + 5)
    y += 7
  })

  // Footer sur toutes les pages
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    doc.setFillColor(30, 41, 59)
    doc.rect(0, 287, W, 10, 'F')
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text('PRO DIGITALIX — Développé par ANABOK GROUP', M, 293)
    doc.text(`Page ${p} / ${pageCount}`, W - M - 12, 293)
  }

  doc.save(`rapport-${data.meta?.title?.toLowerCase().replace(/ /g, '-') || 'analytics'}-${Date.now()}.pdf`)
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState<ReportType>('monthly')
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('pdf')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sections, setSections] = useState<Set<string>>(new Set(REPORT_SECTIONS.map(s => s.label)))
  const [generating, setGenerating] = useState(false)

  const { data: accounts } = useChariowAccounts()
  const accountId = accounts?.[0]?.id || null
  const currency = accounts?.[0]?.currency || 'XOF'

  const { data: historyData } = useQuery({
    queryKey: ['reports-history', accountId],
    queryFn: () => reportsApi.list(accountId!),
    enabled: !!accountId,
  })
  const history = historyData?.reports || DEMO_HISTORY

  async function handleGenerate() {
    setGenerating(true)
    try {
      const body: any = {
        type: selectedType,
        format: selectedFormat === 'pdf' ? 'json' : selectedFormat === 'xlsx' ? 'xlsx_data' : 'csv',
        ...(selectedType === 'custom' && startDate && { start_date: startDate }),
        ...(selectedType === 'custom' && endDate && { end_date: endDate }),
      }

      if (!accountId) {
        // Mode démo sans backend
        if (selectedFormat === 'pdf') {
          generatePDF({ meta: DEMO_REPORT.meta, summary: DEMO_REPORT.summary, top_products: DEMO_REPORT.top_products, top_customers: DEMO_REPORT.top_customers }, currency)
          toast.success('Rapport PDF généré !')
        } else if (selectedFormat === 'csv') {
          const csv = buildDemoCSV(currency)
          downloadBlob(csv, 'text/csv', `rapport-demo-${Date.now()}.csv`)
          toast.success('Export CSV téléchargé !')
        } else {
          buildDemoXLSX(currency)
          toast.success('Export Excel téléchargé !')
        }
        return
      }

      if (selectedFormat === 'csv') {
        const blob = await reportsApi.downloadCSV(accountId, body)
        downloadBlob(blob, 'text/csv', `rapport-${selectedType}-${Date.now()}.csv`)
        toast.success('Export CSV téléchargé !')
      } else if (selectedFormat === 'xlsx') {
        const res = await reportsApi.generate(accountId, body)
        buildXLSX(res.xlsx_data, res.meta)
        toast.success('Export Excel téléchargé !')
      } else {
        const res = await reportsApi.generate(accountId, body)
        generatePDF(res.report, currency)
        toast.success('Rapport PDF généré !')
      }
    } catch {
      // Fallback démo
      generatePDF({ meta: DEMO_REPORT.meta, summary: DEMO_REPORT.summary, top_products: DEMO_REPORT.top_products, top_customers: DEMO_REPORT.top_customers }, currency)
      toast.success('Rapport PDF généré (démo) !')
    } finally {
      setGenerating(false)
    }
  }

  function toggleSection(label: string) {
    setSections(prev => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Centre de Rapports
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Générez des rapports professionnels PDF, Excel ou CSV en un clic.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Panneau gauche : configuration ── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Type de rapport */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Type de rapport
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {(Object.entries(TYPE_CONFIG) as [ReportType, typeof TYPE_CONFIG[ReportType]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setSelectedType(key)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                    selectedType === key
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/40 hover:bg-secondary/50'
                  )}
                >
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', cfg.color)}>
                    <cfg.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{cfg.label}</span>
                  <span className="text-[10px] text-muted-foreground text-center">{cfg.desc}</span>
                </button>
              ))}
            </div>

            {/* Dates custom */}
            {selectedType === 'custom' && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Date de début</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Date de fin</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
            )}
          </div>

          {/* Format d'export */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" />
              Format d'export
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'pdf' as ReportFormat, label: 'PDF', desc: 'Rapport branded', emoji: '📄', color: 'text-red-400 bg-red-400/10' },
                { key: 'xlsx' as ReportFormat, label: 'Excel', desc: 'Fichier .xlsx', emoji: '📊', color: 'text-green-400 bg-green-400/10' },
                { key: 'csv' as ReportFormat, label: 'CSV', desc: 'Données brutes', emoji: '📋', color: 'text-blue-400 bg-blue-400/10' },
              ].map(f => (
                <button key={f.key} onClick={() => setSelectedFormat(f.key)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                    selectedFormat === f.key
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/40'
                  )}>
                  <span className="text-2xl">{f.emoji}</span>
                  <span className="font-semibold text-foreground text-sm">{f.label}</span>
                  <span className="text-xs text-muted-foreground">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sections incluses */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              Sections incluses
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REPORT_SECTIONS.map(s => (
                <label key={s.label} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={sections.has(s.label)}
                    onChange={() => toggleSection(s.label)}
                    className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <s.icon className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm font-medium text-foreground">{s.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Bouton génération */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className={cn(
              'w-full h-14 rounded-xl font-bold text-white text-base transition-all flex items-center justify-center gap-3',
              'gradient-brand hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20'
            )}
          >
            {generating ? (
              <><RefreshCw className="w-5 h-5 animate-spin" />Génération en cours…</>
            ) : (
              <><Sparkles className="w-5 h-5" />Générer le rapport {selectedFormat.toUpperCase()}</>
            )}
          </button>

          {/* Branding note */}
          <p className="text-center text-xs text-muted-foreground">
            Tous les rapports incluent le logo PRO DIGITALIX et la mention <span className="text-foreground font-medium">ANABOK GROUP</span>
          </p>
        </div>

        {/* ── Panneau droit : historique + aperçu ── */}
        <div className="space-y-4">
          {/* Aperçu du rapport */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Aperçu
            </h3>
            {/* Mini preview du PDF */}
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="bg-[#0A0F1C] p-4">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-white font-black text-sm">PRO</span>
                  <span className="text-primary font-black text-sm">DIGITALIX</span>
                </div>
                <div className="bg-[#1E293B] rounded-lg p-3 mb-2">
                  <p className="text-white font-bold text-xs">{TYPE_CONFIG[selectedType].label}</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">{TYPE_CONFIG[selectedType].desc}</p>
                  <p className="text-slate-400 text-[10px]">Boutique : {accounts?.[0]?.store_name || 'Ma boutique'}</p>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { l: 'CA Total', v: '183 850 XOF' },
                    { l: 'Commandes', v: '41' },
                    { l: 'Panier moyen', v: '4 484 XOF' },
                    { l: 'Nouveaux clients', v: '36' },
                  ].map(k => (
                    <div key={k.l} className="bg-[#1E293B] rounded p-2">
                      <p className="text-slate-400 text-[9px]">{k.l}</p>
                      <p className="text-primary text-[10px] font-bold">{k.v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-700">
                  <p className="text-slate-500 text-[8px] text-center">Développé par ANABOK GROUP</p>
                </div>
              </div>
            </div>
          </div>

          {/* Historique */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Historique
            </h3>
            <div className="space-y-2">
              {history.slice(0, 8).map((r: any, i: number) => {
                const cfg = TYPE_CONFIG[(r.type as ReportType) || 'monthly']
                return (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', cfg.color)}>
                      <cfg.icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{cfg.label}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(r.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">{r.format || 'pdf'}</span>
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                    </div>
                  </div>
                )
              })}
              {history.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Aucun rapport généré.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers XLSX ─────────────────────────────────────────────────────────────

function buildXLSX(data: any, meta: any) {
  const wb = XLSX.utils.book_new()
  for (const sheet of data.sheets || []) {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows)
    XLSX.utils.book_append_sheet(wb, ws, sheet.name)
  }
  XLSX.writeFile(wb, `rapport-${meta?.title?.toLowerCase().replace(/ /g, '-') || 'analytics'}-${Date.now()}.xlsx`)
}

function buildDemoXLSX(currency: string) {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([
    ['PRO DIGITALIX — Rapport Mensuel (Démo)'],
    ['Boutique', 'ANABOK GROUP'],
    ['Devise', currency],
    [],
    ['CA Total', 183850],
    ['Commandes', 41],
    ['Panier moyen', 4484],
    ['Nouveaux clients', 36],
    [],
    ['Top Produits', '', ''],
    ['Nom', 'Ventes', 'Revenus'],
    ['FORMATION VENTE DIGITALE', 31, 155000],
    ['Formation CHINE-AFRIQUE', 4, 17500],
    ['Formation IA Gemini', 4, 7500],
    [],
    ['Développé par ANABOK GROUP — PRO DIGITALIX'],
  ])
  XLSX.utils.book_append_sheet(wb, ws, 'Rapport')
  XLSX.writeFile(wb, `rapport-demo-${Date.now()}.xlsx`)
}

function buildDemoCSV(currency: string) {
  return `PRO DIGITALIX — Rapport Mensuel (Démo)\nBoutique,ANABOK GROUP\nDevise,${currency}\n\nCA Total,183 850 ${currency}\nCommandes,41\nPanier moyen,4 484 ${currency}\nNouveaux clients,36\n\nTop Produits\nNom,Ventes,Revenus\nFORMATION VENTE DIGITALE,31,155000 ${currency}\nFormation CHINE-AFRIQUE,4,17500 ${currency}\nFormation IA Gemini,4,7500 ${currency}\n\nDéveloppé par ANABOK GROUP — PRO DIGITALIX`
}

function downloadBlob(content: string, mime: string, filename: string) {
  const blob = new Blob(['﻿' + content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ─── Données démo ─────────────────────────────────────────────────────────────

const DEMO_REPORT = {
  meta: { title: 'Rapport Mensuel', period: 'Juin 2026', store_name: 'ANABOK GROUP', generated_at: new Date().toISOString() },
  summary: { total_revenue: 183850, total_orders: 41, avg_order_value: 4484, new_customers: 36, total_customers: 1017, conversion_rate: 3.89 },
  top_products: [
    { name: 'FORMATION VENTE DES PRODUITS DIGITAUX', sales: 31, revenue: 155000, price: 5000 },
    { name: 'Formation achat CHINE-AFRIQUE', sales: 4, revenue: 17500, price: 4500 },
    { name: 'FORMATION VIDEO IA GEMINI', sales: 4, revenue: 7500, price: 2000 },
  ],
  top_customers: [
    { name: 'Koffi Amani', email: 'koffi@email.com', orders: 8, total_spent: 245000 },
    { name: 'Yao Ahoussou', email: 'yao@email.com', orders: 11, total_spent: 320000 },
  ],
}

const DEMO_HISTORY = [
  { type: 'monthly', format: 'pdf', created_at: new Date(Date.now() - 864e5).toISOString() },
  { type: 'weekly', format: 'xlsx', created_at: new Date(Date.now() - 3 * 864e5).toISOString() },
  { type: 'daily', format: 'csv', created_at: new Date(Date.now() - 7 * 864e5).toISOString() },
  { type: 'monthly', format: 'pdf', created_at: new Date(Date.now() - 35 * 864e5).toISOString() },
]
