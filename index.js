const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');

// Zachowanie referencji do głównego okna, żeby garbage collector nie usunął
// Według dokumentacji electrona
var main;

// Utworzenie głównego okna
function createMain() {
	main = new BrowserWindow({width: 375, height: 600});
	main.loadURL(url.format({
		pathname: path.join(__dirname, 'index.htm'),
		protocol: 'file:',
		slashes: true
	}))
	main.on('closed', () => {
		main = null;
	})
}

// Gotowość aplikacji
app.on('ready', createMain);

// Wszystkie okna zamknięte
app.on('window-all-closed', () => {
	// Coś z macOS'em, nie wiem, nie posiadam :P
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
	// Także coś z macOS'em...
  if (win === null) {
    createWindow()
  }
})
