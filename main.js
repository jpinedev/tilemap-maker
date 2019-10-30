const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

const isMac = process.platform === 'darwin';

let window = null;
let menu;

let header = { type: "tilemap-maker", version: "0.0.0" };
let sources = [];
let size = [64, 64, 16, 16];
let layers = [
    {
        collision: true,
        map: [[]]
    }
];

function createWindow() {
    if(window !== null) return;
    window = new BrowserWindow({
        width: 1280,
        height: 720,
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
                    click: createWindow
                },
                { type: 'separator' },
                {
                    label: 'Open...',
                    accelerator: 'CmdOrCtrl+O',
                    click: openFile
                },
                {
                    label: 'Import Spritesheet...',
                    accelerator: 'CmdOrCtrl+I'
                },
                { type: 'separator' },
                {
                    label: 'Save',
                    accelerator: 'CmdOrCtrl+S',
                    click: saveFile
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

function saveFile() {
    //ipcMain.emit('save-file', compileFile());
    let content = compileFile();
    dialog.showSaveDialog(window, {
        filters: [
            { name: 'JSON', extensions: ['json', 'tmm'] }
        ]
    }).then(result => {
        if(result.canceled || result.filePath === undefined) return;
        fs.writeFile(result.filePath, content, (err) => {
            if(err) {
                console.log('An error has occurred with the creation of the file.');
                return;
            }
        });
    }).catch(err => {
        console.log(err);
    });
}
function compileFile() {
    let json = [
        header,
        sources,
        size,
        layers
    ];
    return JSON.stringify(json);
}

function openFile() {
    dialog.showOpenDialog(window, {
        filters: [
            { name: 'JSON', extensions: ['json', 'tmm'] }
        ]
    }).then(result => {
        if(result.canceled || result.filePaths === undefined) return;
        fs.readFile(result.filePaths[0], "utf-8", (err, data) => {
            if(err) {
                console.log('An error has occurred while trying to load the file.');
                return;
            }

            let tilemapFile = JSON.parse(data);
            // TODO: add dialog warning opening old file version
            // if(tilemapFile[0].version !== app.getVersion()) { }
            if(tilemapFile[0].type === "tilemap-maker") {
                header = tilemapFile[0];
                sources = tilemapFile[1];
                size = tilemapFile[2];
                layers = tilemapFile[3];
            }
        });
    }).catch(err => {
        console.log(err);
    });
}

ipcMain.on('get-resize', (event, arg) => {
    event.returnValue = size;
});
ipcMain.on('resize', (event, arg) => {
    size = arg;
    console.log(size[0], size[1], size[2], size[3]);
    event.returnValue = true;
});