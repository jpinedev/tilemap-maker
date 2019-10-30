const electron = require('electron');
const remote = electron.remote;
const ipc = electron.ipcRenderer;

const cancelBtn = document.getElementById('cancel');
const confirmBtn = document.getElementById('confirm');

const tilemapwidth = document.getElementsByName('tilemapwidth')[0];
const tilemapheight = document.getElementsByName('tilemapheight')[0];
const tilewidth = document.getElementsByName('tilewidth')[0];
const tileheight = document.getElementsByName('tileheight')[0];
//const squaretiles = document.getElementsByName('squaretiles')[0];

function importArgValues(arg) {
    tilemapwidth.value = arg[0];
    tilemapheight.value = arg[1];
    tilewidth.value = arg[2];
    tileheight.value = arg[3];
}
function exportArgValues() {
    return [parseInt(tilemapwidth.value), parseInt(tilemapheight.value), parseInt(tilewidth.value), parseInt(tileheight.value)];
}

importArgValues(ipc.sendSync('get-resize', () => {}));

function _closeWindow() {
    var window = remote.getCurrentWindow();
    window.close();
}

cancelBtn.addEventListener('click', _closeWindow);
confirmBtn.addEventListener('click', () => {
    if(ipc.sendSync('resize', exportArgValues()))
        _closeWindow();
});