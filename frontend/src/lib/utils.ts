import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency: string = 'XOF',
  locale: string = 'fr-FR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n)
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`
}

export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: format,
  }).format(new Date(date))
}

export function growthBadge(growth: number): { label: string; color: string } {
  if (growth > 0) return { label: `+${growth.toFixed(1)}%`, color: 'text-green-400' }
  if (growth < 0) return { label: `${growth.toFixed(1)}%`, color: 'text-red-400' }
  return { label: '0%', color: 'text-muted-foreground' }
}

export function truncate(str: string, max = 40): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}
