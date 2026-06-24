# PRO DIGITALIX — Architecture Globale

## Structure du Projet

```
pro-digitalix/
├── frontend/                    # Next.js 14 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/          # Pages d'authentification
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── callback/
│   │   │   ├── (dashboard)/     # Pages protégées
│   │   │   │   ├── dashboard/
│   │   │   │   ├── visitors/
│   │   │   │   ├── products/
│   │   │   │   ├── customers/
│   │   │   │   ├── abandons/
│   │   │   │   ├── ai/
│   │   │   │   ├── forecasts/
│   │   │   │   ├── reports/
│   │   │   │   └── settings/
│   │   │   └── admin/           # Panel Admin
│   │   ├── components/
│   │   │   ├── ui/              # Shadcn UI components
│   │   │   ├── charts/          # Recharts graphiques
│   │   │   ├── dashboard/
│   │   │   ├── layout/
│   │   │   └── shared/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   └── utils.ts
│   │   └── types/
│
├── backend/                     # Node.js + Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── services/
│   │   │   ├── chariow.service.ts
│   │   │   ├── ai.service.ts
│   │   │   ├── analytics.service.ts
│   │   │   └── notification.service.ts
│   │   ├── models/
│   │   └── utils/
│
└── database/
    └── migrations/              # Scripts SQL PostgreSQL
```

## Architecture Technique

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTS                            │
│         Web  |  Android APK  |  iOS  |  Windows        │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  VERCEL CDN                             │
│              Next.js Frontend                           │
│  Auth | Dashboard | Analytics | AI | Reports            │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API / JWT
┌──────────────────────▼──────────────────────────────────┐
│               Node.js + Express API                     │
│  /api/v1/auth | /api/v1/analytics | /api/v1/ai         │
│  /api/v1/chariow | /api/v1/reports | /api/v1/admin     │
└────────┬─────────────┬──────────────┬───────────────────┘
         │             │              │
┌────────▼───┐  ┌──────▼──────┐  ┌───▼────────┐
│ PostgreSQL  │  │  Chariow    │  │  OpenAI    │
│ (Supabase) │  │    API      │  │    API     │
└────────────┘  └─────────────┘  └────────────┘
         │
┌────────▼────────────────────────────────────────────────┐
│              Services Externes                          │
│   Firebase (Notifs) | PostHog (Analytics) | OAuth      │
└─────────────────────────────────────────────────────────┘
```

## Flux de Données Chariow

```
Chariow API ──► Sync Service ──► PostgreSQL ──► Analytics Engine ──► Dashboard
     │                                                    │
     └── Pixel PRO DIGITALIX (fallback) ─────────────────┘
```
