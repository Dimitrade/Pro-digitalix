import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth.middleware'
import { AppError } from '../middleware/error.middleware'
import {
  generateReportData, generateCSV, generateXLSXData,
  ReportType
} from '../services/report.service'
import { query } from '../utils/db'

const reportSchema = z.object({
  type: z.enum(['daily', 'weekly', 'monthly', 'annual', 'custom']),
  format: z.enum(['json', 'csv', 'xlsx_data']).default('json'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

export async function generate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { accountId } = req.params
    const parsed = reportSchema.safeParse(req.body)
    if (!parsed.success) throw new AppError('Paramètres invalides', 400, 'VALIDATION_ERROR')

    const { type, format, start_date, end_date } = parsed.data
    const data = await generateReportData(accountId, type as ReportType, start_date, end_date)

    // Sauvegarder en historique
    await query(
      `INSERT INTO reports (account_id, user_id, type, format, period_start, period_end, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7)`,
      [
        accountId, req.user!.id, type, format,
        start_date || new Date().toISOString().split('T')[0],
        end_date || new Date().toISOString().split('T')[0],
        JSON.stringify({ title: data.meta.title, store_name: data.meta.store_name }),
      ]
    ).catch(() => {}) // non-bloquant

    if (format === 'csv') {
      const csv = generateCSV(data)
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="rapport-${type}-${Date.now()}.csv"`)
      return res.send('﻿' + csv) // BOM pour Excel UTF-8
    }

    if (format === 'xlsx_data') {
      return res.json({ xlsx_data: generateXLSXData(data), meta: data.meta })
    }

    res.json({ report: data })
  } catch (err) { next(err) }
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { accountId } = req.params
    const reports = await query(
      `SELECT id, type, format, period_start, period_end, status, created_at, metadata
       FROM reports WHERE account_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [accountId]
    ).catch(() => [])
    res.json({ reports })
  } catch (err) { next(err) }
}
