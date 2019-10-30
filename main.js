const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

const isMac = process.platform === 'darwin';

let window = null;
let menu;

let header = { type: "tilemap-maker", version: "0.0.0" };
let sources = [];
let resize = [64, 64, 16, 16];
let layers = [
    {
        collision: true,
        map: [[]]
    }
];

function createWindow() {
    if(window !== null) return;
    window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    window.loadURL(url.format({
        pathname: path.join(__dirname, 'src/index.html'),
        protocol: 'file:',
        slashes: true
    }));

    window.webContents.openDevTools();

    window.on('closed', () => {
        window = null;
    });
}

function tempLog(name) {
    return () => { console.log('clicked '+name) };
}
app.on('ready', () => {
    header.version = app.getVersion();
    createWindow();

    let menuTemplate = [
        {
            label: 'File',
            submenu: [
                //TODO: add functionality to 'open', 'import spritesheet', 'save', 'save as'
                {
                    label: 'New Window',
                    accelerator: 'CmdOrCtrl+N',
                    click() { createWindow() }
                },
                { type: 'separator' },
                {
                    label: 'Open...',
                    accelerator: 'CmdOrCtrl+O'
                },
                {
                    label: 'Import Spritesheet...',
                    accelerator: 'CmdOrCtrl+I'
                },
                { type: 'separator' },
                {
                    label: 'Save',
                    accelerator: 'CmdOrCtrl+S'
                },
                {
                    label: 'Save As...',
                    accelerator: 'CmdOrCtrl+Shift+S'
                },
                { type: 'separator' },
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                {
                    label: 'Resize Tilemap...',
                    accelerator: 'CmdOrCtrl+R',
                    click: openResizeWindow
                },
                {
                    label: 'Resize Tiles...',
                    accelerator: 'CmdOrCtrl+Alt+R',
                    click: openResizeWindow
                }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' }
            ]
        }
    ];
    if(isMac) menuTemplate.unshift({ role: 'appMenu' });

    menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
});

app.on("window-all-closed", () => {
    if(!isMac) app.quit();
});

app.on("activate", () => {
    if(window === null) createWindow();
});

function openResizeWindow() {
    let win = new BrowserWindow({
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        width: 500,
        height: 400,
        webPreferences: {
            nodeIntegration: true
        }
    });

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'src/resize.html'),
        protocol: 'file:',
        slashes: true
    }));

    win.on('closed', () => {
        win = null;
    });
}

ipcMain.on('get-resize', (event, arg) => {
    event.returnValue = resize;
});
ipcMain.on('resize', (event, arg) => {
    resize = arg;
    console.log(resize[0], resize[1], resize[2], resize[3]);
    event.returnValue = true;
});