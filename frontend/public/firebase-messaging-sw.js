// Service Worker FCM — PRO DIGITALIX by ANABOK GROUP
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

// Config injectée au build (ou hardcodée si pas de build step)
const FIREBASE_CONFIG = self.__FIREBASE_CONFIG__ || {
  apiKey:            '',
  authDomain:        '',
  projectId:         '',
  storageBucket:     '',
  messagingSenderId: '',
  appId:             '',
}

if (FIREBASE_CONFIG.apiKey) {
  firebase.initializeApp(FIREBASE_CONFIG)
  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    const { title = 'PRO DIGITALIX', body = '' } = payload.notification || {}
    self.registration.showNotification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: payload.data,
      actions: [{ action: 'open', title: 'Ouvrir' }],
      vibrate: [100, 50, 100],
      tag: payload.data?.type || 'prodigitalix',
    })
  })

  self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const url = event.notification.data?.action || '/'
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((cs) => {
        const existing = cs.find(c => c.url.includes(url))
        if (existing) return existing.focus()
        return clients.openWindow(url)
      })
    )
  })
}
