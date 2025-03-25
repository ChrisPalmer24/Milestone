const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const url = require('url');

// Keep a global reference of the window object to prevent it from being garbage collected
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'public/icons/icon-512x512.svg'),
    title: 'Milestone - Investment Tracker',
    autoHideMenuBar: true,
  });

  // Load the app
  const startUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5173' 
    : url.format({
        pathname: path.join(__dirname, './dist/public/index.html'),
        protocol: 'file:',
        slashes: true
      });
  
  mainWindow.loadURL(startUrl);

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when Electron has finished initializing
app.whenReady().then(() => {
  createWindow();

  // On macOS, recreate a window when dock icon is clicked and no other windows are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});