// Electron-Startdatei: öffnet das Spiel als eigenes Windows-Programm
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
app.setName('Buffyverse TCG');
function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 960, minWidth: 900, minHeight: 640,
    backgroundColor: '#0c0a12', title: 'Buffyverse TCG', autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon-512.png'),
    webPreferences: { contextIsolation: true, sandbox: true, autoplayPolicy: 'no-user-gesture-required' },
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
