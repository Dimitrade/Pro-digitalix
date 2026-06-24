import { app, BrowserWindow, shell, Menu, Tray, nativeImage } from 'electron'
import * as path from 'path'

const FRONTEND_URL = process.env.ELECTRON_URL || 'https://prodigitalix.com'
const isDev = process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'PRO DIGITALIX',
    backgroundColor: '#0A0F1C',
    icon: path.join(__dirname, '../assets/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    show: false,
    autoHideMenuBar: true,
  })

  mainWindow.loadURL(isDev ? 'http://localhost:3000' : FRONTEND_URL)

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Ouvrir les liens externes dans le navigateur système
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url)
      return { action: 'deny' as const }
    }
    return { action: 'allow' as const }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createTray(): void {
  const iconPath = path.join(__dirname, '../assets/tray.ico')
  try {
    const icon = nativeImage.createFromPath(iconPath)
    if (!icon.isEmpty()) {
      tray = new Tray(icon.resize({ width: 16, height: 16 }))
      const menu = Menu.buildFromTemplate([
        { label: 'Ouvrir PRO DIGITALIX', click: () => mainWindow?.show() },
        { type: 'separator' },
        { label: 'Quitter', click: () => app.quit() },
      ])
      tray.setToolTip('PRO DIGITALIX — ANABOK GROUP')
      tray.setContextMenu(menu)
      tray.on('double-click', () => mainWindow?.show())
    }
  } catch {
    // Icône tray optionnelle
  }
}

app.whenReady().then(() => {
  createWindow()
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Sécurité — empêcher navigation externe non autorisée
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, url) => {
    const isAllowed =
      url.startsWith(FRONTEND_URL) ||
      url.startsWith('http://localhost') ||
      url.startsWith('https://anabokgroup.online')
    if (!isAllowed) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })
})
