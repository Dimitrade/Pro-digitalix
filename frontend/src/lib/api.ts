import axios from 'axios'
import { getSession } from 'next-auth/react'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Injecter le token JWT automatiquement
api.interceptors.request.use(async (config) => {
  const session = await getSession()
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }
  return config
})

// Gestion erreurs globale
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
export const apiClient = api

// ── Helpers typés par domaine ──

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; full_name: string }) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

export const analyticsApi = {
  dashboard: (accountId: string, period?: string) =>
    api.get(`/analytics/dashboard/${accountId}`, { params: { period } }).then(r => r.data),
  visitors: (accountId: string, params?: Record<string, string>) =>
    api.get(`/analytics/visitors/${accountId}`, { params }).then(r => r.data),
  revenue: (accountId: string, params?: Record<string, string>) =>
    api.get(`/analytics/revenue/${accountId}`, { params }).then(r => r.data),
}

export const chariowApi = {
  connect: (data: { api_key: string }) =>
    api.post('/chariow/connect', data).then(r => r.data),
  accounts: () => api.get('/chariow/accounts').then(r => r.data),
  sync: (accountId: string) =>
    api.post(`/chariow/sync/${accountId}`).then(r => r.data),
  disconnect: (accountId: string) =>
    api.delete(`/chariow/accounts/${accountId}`).then(r => r.data),
}

export const productsApi = {
  list: (accountId: string, params?: Record<string, unknown>) =>
    api.get(`/products/${accountId}`, { params }).then(r => r.data),
  get: (accountId: string, productId: string) =>
    api.get(`/products/${accountId}/${productId}`).then(r => r.data),
}

export const customersApi = {
  list: (accountId: string, params?: Record<string, unknown>) =>
    api.get(`/customers/${accountId}`, { params }).then(r => r.data),
  get: (accountId: string, customerId: string) =>
    api.get(`/customers/${accountId}/${customerId}`).then(r => r.data),
}

export const salesApi = {
  list: (accountId: string, params?: Record<string, unknown>) =>
    api.get(`/sales/${accountId}`, { params }).then(r => r.data),
  get: (accountId: string, saleId: string) =>
    api.get(`/sales/${accountId}/${saleId}`).then(r => r.data),
}

export const aiApi = {
  insights: (accountId: string) =>
    api.get(`/ai/insights/${accountId}`).then(r => r.data),
  forecasts: (accountId: string) =>
    api.get(`/ai/forecasts/${accountId}`).then(r => r.data),
  chat: (accountId: string, messages: { role: 'user' | 'assistant'; content: string }[]) =>
    api.post(`/ai/chat/${accountId}`, { messages }).then(r => r.data),
  report: (accountId: string, period?: string) =>
    api.get(`/ai/report/${accountId}`, { params: { period } }).then(r => r.data),
}

export const ownerApi = {
  // Utilisateurs
  users: (p?: Record<string, string | number>) => api.get('/owner/users', { params: p }).then(r => r.data),
  userProfile: (id: string) => api.get(`/owner/users/${id}`).then(r => r.data),
  grantPremium: (id: string, duration: string, source?: string) =>
    api.post(`/owner/users/${id}/grant`, { duration, source: source ?? 'owner' }).then(r => r.data),
  revokePremium: (id: string) => api.post(`/owner/users/${id}/revoke`).then(r => r.data),
  extendPremium: (id: string, days: number) => api.post(`/owner/users/${id}/extend`, { days }).then(r => r.data),
  suspend: (id: string, reason?: string) => api.post(`/owner/users/${id}/suspend`, { reason }).then(r => r.data),
  reactivate: (id: string) => api.post(`/owner/users/${id}/reactivate`).then(r => r.data),
  // Stats
  stats: () => api.get('/owner/stats').then(r => r.data),
  // Audit
  audit: (p?: Record<string, string | number>) => api.get('/owner/audit', { params: p }).then(r => r.data),
  // Promos
  promos: () => api.get('/owner/promos').then(r => r.data),
  createPromo: (d: Record<string, unknown>) => api.post('/owner/promos', d).then(r => r.data),
  updatePromo: (id: number, d: Record<string, unknown>) => api.patch(`/owner/promos/${id}`, d).then(r => r.data),
  disablePromo: (id: number) => api.delete(`/owner/promos/${id}`).then(r => r.data),
  // Promo apply (utilisateur)
  applyPromo: (code: string) => api.post('/promo/apply', { code }).then(r => r.data),
  // Étape 11 — SaaS metrics & monitoring
  saasMetrics:        () => api.get('/owner-stats/saas-metrics').then(r => r.data),
  chariowMonitoring:  () => api.get('/owner-stats/chariow-monitoring').then(r => r.data),
  systemHealth:       () => api.get('/owner-stats/system-health').then(r => r.data),
  listBackups:        () => api.get('/owner-stats/backups').then(r => r.data),
  triggerBackup:      () => api.post('/owner-stats/backups/trigger').then(r => r.data),
  supportTickets:     () => api.get('/owner-stats/support-tickets').then(r => r.data),
}

export const subscriptionApi = {
  me: () => api.get('/subscription/me').then(r => r.data),
  payments: () => api.get('/subscription/payments').then(r => r.data),
  ownerStats: () => api.get('/subscription/owner/stats').then(r => r.data),
  ownerUsers: (params?: Record<string, string | number>) =>
    api.get('/subscription/owner/users', { params }).then(r => r.data),
  updateUser: (userId: string, data: Record<string, unknown>) =>
    api.patch(`/subscription/owner/users/${userId}`, data).then(r => r.data),
}

export const notificationsApi = {
  list: (accountId: string, params?: Record<string, string | number>) =>
    api.get(`/notifications/${accountId}`, { params }).then(r => r.data),
  markRead: (accountId: string, id: string) =>
    api.patch(`/notifications/${accountId}/${id}`).then(r => r.data),
  markAllRead: (accountId: string) =>
    api.patch(`/notifications/${accountId}/all`).then(r => r.data),
  archive: (accountId: string, id: string) =>
    api.delete(`/notifications/${accountId}/${id}`).then(r => r.data),
  registerToken: (accountId: string, fcm_token: string, platform: string) =>
    api.post(`/notifications/token/${accountId}`, { fcm_token, platform }).then(r => r.data),
  testPush: (accountId: string, type: string) =>
    api.post(`/notifications/test/${accountId}`, { type }).then(r => r.data),
  getPreferences: () => api.get('/notifications/preferences').then(r => r.data),
  savePreferences: (prefs: Record<string, unknown>) =>
    api.put('/notifications/preferences', prefs).then(r => r.data),
}

export const reportsApi = {
  generate: (accountId: string, data: Record<string, unknown>) =>
    api.post(`/reports/${accountId}`, data).then(r => r.data),
  list: (accountId: string) =>
    api.get(`/reports/${accountId}`).then(r => r.data),
  downloadCSV: (accountId: string, data: Record<string, unknown>) =>
    api.post(`/reports/${accountId}`, data, { responseType: 'blob' }).then(r => r.data),
}
