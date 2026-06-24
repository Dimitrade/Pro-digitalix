import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentification',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Panel gauche — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand-950">
        {/* Gradient orbs */}
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-brand-700/30 blur-3xl" />
        <div className="absolute bottom-[-50px] right-[-50px] w-[400px] h-[400px] rounded-full bg-electric-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              <span className="text-white font-black text-lg">P</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none">PRO DIGITALIX</p>
              <p className="text-brand-300 text-xs">Analytics pour Chariow</p>
            </div>
          </div>

          {/* Tagline centrale */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Analysez vos ventes.<br />
              <span className="gradient-text">Multipliez vos revenus.</span>
            </h1>
            <p className="text-brand-300 text-lg leading-relaxed">
              La plateforme analytics conçue pour les entrepreneurs africains qui vendent des produits digitaux sur Chariow.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[
                { v: '10K+', l: 'Vendeurs' },
                { v: '98%', l: 'Satisfaction' },
                { v: '2×', l: 'CA moyen' },
              ].map((s) => (
                <div key={s.l} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-2xl font-bold text-white">{s.v}</p>
                  <p className="text-brand-300 text-sm">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-brand-400 text-sm">
            © {new Date().getFullYear()} PRO DIGITALIX. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Panel droit — Formulaire */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center">
              <span className="text-white font-black">P</span>
            </div>
            <p className="text-white font-bold">PRO DIGITALIX</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
