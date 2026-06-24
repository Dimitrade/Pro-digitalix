import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.anabokgroup.prodigitalix',
  appName: 'PRO DIGITALIX',
  webDir: 'out',
  server: {
    // En production, pointer vers le vrai domaine
    url: process.env.CAPACITOR_SERVER_URL || 'https://prodigitalix.com',
    cleartext: false,
  },
  android: {
    buildOptions: {
      keystorePath: 'android/prodigitalix.jks',
      keystoreAlias: 'prodigitalix',
      releaseType: 'APK',
    },
    backgroundColor: '#0A0F1C',
    allowMixedContent: false,
  },
  ios: {
    backgroundColor: '#0A0F1C',
    contentInset: 'always',
    scheme: 'ProDigitalix',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0A0F1C',
      androidSplashResourceName: 'splash',
      iosSplashResourceName: 'Splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0A0F1C',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
    },
  },
}

export default config
