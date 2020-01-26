const electron = require('electron');
const ipc = electron.ipcRenderer;

let sources = [];
let size = [64, 64, 16, 16];
let layers = [];

let views = [];

ipc.on('update-tilemap', (event, tm) => {
    sources = tm[0];
    size = tm[1];
    layers = tm[2];
    console.table(tm);
});

const tools = Array.from(document.getElementsByClassName('tool'));

let activeToolIndex = 0;
function getActiveTool() { return tools[activeToolIndex] }

tools.forEach((tool, i) => {
    tool.addEventListener('click', (event) => {
        tools.forEach(t => {t.classList.remove('tool-active')});
        activeToolIndex = i;
        tool.classList.add('tool-active');
    });
});

const editorDiv = document.getElementsByClassName('editor')[0];
const win = document.getElementsByClassName('window')[0];
const editor = document.getElementById('editor');
let c = editor.getContext('2d');

editorDiv.scroll(win.scrollWidth/4, win.scrollHeight/4);

views = layers.map(_ => {
    let e = document.createElement('canvas', { style: `margin: -100%; width: ${size[0]}vh; height ${size[1]}vh;` });
    win.appendChild(e);
    return { canvas: e, ctx: e.getContext('2d') };
});

function init() {
    c.fillStyle = 'rgba(255, 255, 255, .5)';
    c.fillRect(0, 0, size[0]*size[2], size[1]*size[3]);
    renderTilemap();
}

function renderTilemap() {
    for(let i = 0; i < layers.length; i++) {
        renderLayer(i);
    }
}

function renderLayer(layerIndex) {
    const layer = layers[layerIndex].map;
    const canvas = views[layerIndex].canvas;
    const ctx = views[layerIndex].ctx;
    const tileWidth = canvas.width/size[0];
    const tileHeight = canvas.height/size[1];
    for(let j = 0; j < size[1]; j++) {
        for(let i = 0; i < size[0]; i++) {
            const value = layer[j][i];
            ctx.fillStyle = (value == 0 ? '#000000':'#ffffff');
            ctx.fillRect(i*tileWidth, j*tileHeight, tileWidth, tileHeight);
        }
    }
}

init();
