import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requireOwner } from '../middleware/roles.middleware'
import {
  saasMetrics,
  chariowMonitoring,
  systemHealth,
  listBackups,
  triggerBackup,
  getSupportTickets,
} from '../controllers/owner.stats.controller'

const router = Router()

router.use(authenticate, requireOwner)

router.get('/saas-metrics',       saasMetrics)
router.get('/chariow-monitoring', chariowMonitoring)
router.get('/system-health',      systemHealth)
router.get('/backups',            listBackups)
router.post('/backups/trigger',   triggerBackup)
router.get('/support-tickets',    getSupportTickets)

export default router
