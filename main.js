const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

const isMac = process.platform === 'darwin';

let window = null;
let menu;

let workingPath = null;

let header = { type: "tilemap-maker", version: "0.0.0" };
let sources = [];
let size = [32, 32, 16, 16];
let layers = [
    {
        collision: true,
        map: []
    }
];
for(let i = 0; i < size[1]; i++) {
    let row = [];
    for(let i = 0; i < size[0]; i++) {
        row.push(-1);
    }
    layers[0].map.push(row);
}

app.commandLine.appendSwitch(
    'enable-experimental-web-platform-features'
);

function createWindow() {
    if(window !== null) return;
    window = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true
        },
        show: false
    });

    window.loadURL(url.format({
        pathname: path.join(__dirname, 'src/index.html'),
        protocol: 'file:',
        slashes: true
    }));

    window.webContents.openDevTools();
    
    window.once('ready-to-show', () => {
        window.show();
        window.webContents.send('update-tilemap', [sources, size, layers, 0]);
    });

    window.on('closed', () => {
        // TODO: Add save before exit dialog
        window = null;
    });
}

app.on('ready', () => {
    header.version = app.getVersion();
    createWindow();

    let menuTemplate = [
        {
            label: 'File',
            submenu: [
                //TODO: add functionality to 'import spritesheet'
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
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: saveFileAs
                },
                { type: 'separator' },
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                // TODO: add functionality for 'undo' and 'redo'
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
    if(window === null) return;
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

function writeFile() {
    let content = compileFile();
    fs.writeFile(workingPath, content, (err) => {
        if(err) {
            console.log('An error has occurred with the creation of the file.');
            return;
        }
    });
}
const confirmOpenOpt = fileVersion => {
    return {
        title: 'Warning: Old file version.',
        type: 'warning',
        message: `Attempting to open outdated file.\nOpening this file could cause corruption.\nPlease make a backup before continuing.`,
        detail: `File version:\nv${fileVersion}\nTilemapper version:\nv${app.getVersion()}`,
        defaultId: 1,
        cancelId: 1,
        buttons: ['Continue', 'Cancel']
    };
};
function readFile(path) {
    fs.readFile(path, "utf-8", (err, data) => {
        if(err) {
            console.log('An error has occurred while trying to load the file.');
            return;
        }

        let tilemapFile = JSON.parse(data);
        if(tilemapFile[0].type === "tilemap-maker") {
            if(tilemapFile[0].version === app.getVersion() || dialog.showMessageBoxSync(confirmOpenOpt(tilemapFile[0].version)) === 0) {
                workingPath = path;
                decompFile(tilemapFile);
                window.webContents.send('update-tilemap', [sources, size, layers, 1])
            }
        } else {
            console.log('JSON File structure unsupported.');
        }
    });
}

function saveFile() {
    if(workingPath !== null) writeFile();
    else saveFileAs();
}
function saveFileAs() {
    dialog.showSaveDialog(window, {
        title: 'Save As...',
        filters: [
            { name: 'JSON', extensions: ['json', 'tmm'] }
        ]
    }).then(result => {
        if(result.canceled || result.filePath === undefined) return;
        workingPath = result.filePath;
        writeFile();
    }).catch(err => {
        console.log(err);
    });
}
function compileFile() {
    let key = [JSON.stringify(-1)];
    let compileLayers = layers.map(l => {
        let _map = '';
        l.map.forEach((row, j) => {
            row.forEach(tile => {
                let tileJSON = JSON.stringify(tile);
                let index = key.indexOf(tileJSON);
                if(index === -1) {
                    key.push(tileJSON);
                    index = key.length-1;
                }
                _map += index.toString();
            });
            if(j !== l.map.length-1) _map += '\n';
        });
        return {
            collision: l.collision,
            map: _map
        };
    });
    let json = [
        header,
        sources,
        size,
        key,
        compileLayers
    ];
    return JSON.stringify(json);
}
function decompFile(data) {
    //header = data[0];
    sources = data[1];
    size = data[2];
    let key = data[3].map(item => JSON.parse(item));
    let decompLayers = data[4].map(l => {
        let _mapString = l.map.split(/\r?\n/);
        let _map = _mapString.map(row => {
            _row = [];
            for (var i = 0; i < row.length; i++) {
                const value = key[parseInt(row.charAt(i))];
                if(value === "-1") _row[i] = -1;
                else _row[i] = value;
            }
            return _row;
        });
        return {
            collision: l.collision,
            map: _map
        };
    });
    
    layers = decompLayers;
}

function openFile() {
    dialog.showOpenDialog(window, {
        title: 'Open...',
        filters: [
            { name: 'JSON', extensions: ['json', 'tmm'] }
        ],
        properties: ['openFile']
    }).then(result => {
        if(result.canceled || result.filePaths === undefined) return;
        readFile(result.filePaths[0]);
        if(window === null) createWindow();
    }).catch(err => {
        console.log(err);
    });
}

ipcMain.on('get-resize', (event, arg) => {
    event.returnValue = size;
});
ipcMain.on('resize', (event, arg) => {
    size = arg;
    layers = layers.map(l => {
        let _map = resizeRows(l.map);
        return {
            collision: l.collision,
            map: _map
        };
    });
    window.webContents.send('update-tilemap', [sources, size, layers]);
    event.returnValue = true;
});

function resizeRows(_map) {
    if(size[1] < _map.length) {
        _map = _map.slice(0, size[1]);
    } else if(size[1] > _map.length) {
        while(_map.length < size[1]) {
            _map.push([]);
        }
    }
    return _map.map(_row => resizeRow(_row));
}
function resizeRow(_row) {
    if(size[0] < _row.length) {
        _row = _row.slice(0, size[0]);
    } else if(size[0] > _row.length) {
        while(_row.length < size[0]) {
            _row.push(-1);
        }
    }
    return _row;
}