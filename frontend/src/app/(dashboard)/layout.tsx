import type { Metadata } from 'next'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/topbar'

export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
          <footer className="mt-8 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">Développé par <span className="font-semibold text-foreground">ANABOK GROUP</span></p>
          </footer>
        </main>
      </div>
    </div>
  )
}
