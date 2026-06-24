export const dynamic = 'force-static'

export default function MaintenancePage() {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Maintenance — PRO DIGITALIX</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
            background: #0A0F1C; font-family: Inter, system-ui, sans-serif; color: #fff;
          }
          .container { text-align: center; padding: 2rem; max-width: 480px; }
          .logo { display: inline-flex; align-items: center; gap: 12px; margin-bottom: 2.5rem; }
          .logo-icon { width: 56px; height: 56px; }
          .logo-text { text-align: left; }
          .logo-text h1 { font-size: 1.4rem; font-weight: 900; line-height: 1; }
          .logo-text h1 .blue { color: #1A6EFF; }
          .logo-text p { font-size: 0.65rem; color: #64748B; margin-top: 2px; }
          .icon-wrap {
            width: 80px; height: 80px; border-radius: 24px;
            background: linear-gradient(135deg,#1A6EFF22,#00C8FF22);
            border: 1px solid #1A6EFF44;
            display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;
          }
          h2 { font-size: 1.6rem; font-weight: 900; margin-bottom: 0.75rem; }
          p { color: #94A3B8; line-height: 1.6; font-size: 0.9rem; }
          .dots { display: flex; gap: 8px; justify-content: center; margin: 2rem 0 1.5rem; }
          .dot {
            width: 8px; height: 8px; border-radius: 50%; background: #1A6EFF;
            animation: bounce 1.2s ease-in-out infinite;
          }
          .dot:nth-child(2) { animation-delay: 0.2s; background: #60A5FA; }
          .dot:nth-child(3) { animation-delay: 0.4s; background: #00C8FF; }
          @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
          .contact { margin-top: 1.5rem; font-size: 0.75rem; color: #475569; }
          .contact a { color: #1A6EFF; text-decoration: none; }
          footer { position: fixed; bottom: 1rem; left: 0; right: 0; text-align: center;
            font-size: 0.65rem; color: #334155; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="logo">
            <svg className="logo-icon" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="56" height="56" rx="14" fill="#0B1426"/>
              <defs>
                <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00C8FF"/>
                  <stop offset="45%" stopColor="#1A6EFF"/>
                  <stop offset="100%" stopColor="#0A1A6E"/>
                </linearGradient>
              </defs>
              <rect x="6" y="6" width="8" height="44" rx="3" fill="url(#g)"/>
              <path d="M14 6 Q30 6 30 18 Q30 30 14 30 Z" fill="url(#g)"/>
              <path d="M16 10 Q26 10 26 18 Q26 26 16 26 Z" fill="#0B1426"/>
              <rect x="34" y="6" width="8" height="44" rx="3" fill="url(#g)"/>
              <path d="M42 6 C52 6 56 14 56 28 C56 42 52 50 42 50 L42 44 C48 44 49 38 49 28 C49 18 48 12 42 12 Z" fill="url(#g)"/>
            </svg>
            <div className="logo-text">
              <h1>PRO <span className="blue">DIGITALIX</span></h1>
              <p>Analysez • Optimisez • Développez</p>
            </div>
          </div>

          <div className="icon-wrap">
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#1A6EFF" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
          </div>

          <h2>Maintenance en cours</h2>
          <p>
            PRO DIGITALIX est temporairement indisponible pour une mise à jour.
            Nous reviendrons très bientôt avec de nouvelles fonctionnalités.
          </p>

          <div className="dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>

          <p>Durée estimée : <strong style={{color:'#fff'}}>moins de 30 minutes</strong></p>

          <div className="contact">
            Une urgence ? Contactez-nous :{' '}
            <a href="mailto:anabokgroup@gmail.com">anabokgroup@gmail.com</a>
          </div>
        </div>

        <footer>Développé par ANABOK GROUP</footer>
      </body>
    </html>
  )
}
