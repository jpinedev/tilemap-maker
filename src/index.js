const electron = require('electron');
const dialog = electron.remote.dialog;
const fs = require('fs');
const ipc = electron.ipcRenderer;

ipc.on('save', (event, file) => {
    console.log('hello')
    dialog.showSaveDialog((filename) => {
        fs.writeFile(filename, file, (err) => {
            if(err) {
                console.log('An error has occurred with the creation of the file.');
                return;
            }

            alert('File saved successfully.');
        });
    });
});