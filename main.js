const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true
    }
  });

  mainWindow.setMenu(null);
  mainWindow.loadFile('index.html');

  mainWindow.webContents.session.on('will-download', (event, item) => {

    const fileName = item.getFilename();

    // save to real Downloads folder
    const savePath = path.join(app.getPath('downloads'), fileName);
    item.setSavePath(savePath);

    // start notification
    mainWindow.webContents.send('download-start', {
      name: fileName,
      path: savePath
    });

    // progress updates
    item.on('updated', (event, state) => {
      if (state === 'progressing') {
        mainWindow.webContents.send('download-progress', {
          name: fileName,
          received: item.getReceivedBytes(),
          total: item.getTotalBytes()
        });
      }
    });

    // finished download
    item.on('done', (event, state) => {
      mainWindow.webContents.send('download-done', {
        name: fileName,
        path: savePath,
        state
      });
    });
  });
}

app.whenReady().then(createWindow);