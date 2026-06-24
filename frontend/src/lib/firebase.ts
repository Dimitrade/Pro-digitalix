import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, Messaging, MessagePayload } from 'firebase/messaging'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp | null = null
let messaging: Messaging | null = null

export function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseConfig.apiKey) return null
  if (!app) app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  return app
}

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null
  const a = getFirebaseApp()
  if (!a) return null
  try {
    if (!messaging) messaging = getMessaging(a)
    return messaging
  } catch { return null }
}

export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const msg = getFirebaseMessaging()
  if (!msg) return null
  try {
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') return null
    const token = await getToken(msg, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .catch(() => undefined),
    })
    return token || null
  } catch { return null }
}

export function onForegroundMessage(cb: (payload: MessagePayload) => void) {
  const msg = getFirebaseMessaging()
  if (!msg) return () => {}
  return onMessage(msg, cb)
}
