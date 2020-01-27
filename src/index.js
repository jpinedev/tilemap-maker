const electron = require('electron');
const ipc = electron.ipcRenderer;

let sources = [];
let size = [];
let layers = [];

let views = [];

ipc.on('update-tilemap', (event, tm) => {
    sources = tm[0];
    size = tm[1];
    layers = tm[2];
    console.table(tm);
    console.table(sources);
    console.table(size);
    console.table(layers);
    init();
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
let bg;
let c;

function setupCanvases() {
    win.innerHTML = '';

    bg = document.createElement('canvas');
    bg.id = 'editor';

    bg.style.display = 'block';
    bg.style.position = 'absolute';
    bg.style.width = size[0]*4+'vh';
    bg.style.height = size[1]*4+'vh';
    bg.style.zIndex = 0;

    win.appendChild(bg);
    win.style.width = (size[0]*4+128)+'vh';
    win.style.height = (size[1]*4+128)+'vh';
    c = bg.getContext('2d');
    
    views = layers.map(_ => {
        let e = document.createElement('canvas');
        e.style.display = 'block';
        e.style.position = 'absolute';
        e.style.top = '64vh';
        e.style.left = '64vh';
        e.style.width = size[0]*4+'vh';
        e.style.height = size[1]*4+'vh';
        win.appendChild(e);
        return { canvas: e, ctx: e.getContext('2d') };
    });
    
    editorDiv.scroll(win.scrollWidth/4, win.scrollHeight/4);
}

const ll = document.getElementsByClassName('layers-list')[0];
let layersList = [];

function setupLayersList() {
    ll.innerHTML = '';

    layersList = layers.map((layer, i) => {
        let li = document.createElement('li');
        li.classList.add('layers-list_layer');
        let a = document.createElement('a');
        a.href = '#';
        a.onclick = () => { toggleShowLayer(i) };
        let shown = document.createElement('span');
        shown.style.padding = '0 0.13rem 0 0.12rem';
        shown.style.textAlign = 'center';
        let shownIcon = document.createElement('i');
        shownIcon.classList.add('far');
        shownIcon.classList.add('fa-eye');
        let hidden = document.createElement('span');
        hidden.style.display = 'none';
        let hiddenIcon = document.createElement('i');
        hiddenIcon.classList.add('far');
        hiddenIcon.classList.add('fa-eye-slash');
        let span = document.createElement('span');
        span.innerHTML = layer.name;
        shown.appendChild(shownIcon);
        hidden.appendChild(hiddenIcon);
        a.appendChild(shown);
        a.appendChild(hidden);
        li.appendChild(a);
        li.appendChild(span);
        ll.appendChild(li);
        return {layer: li, hidden: false, eyeShown: shown, eyeHidden: hidden};
    });
}

function toggleShowLayer(i) {
    let layerObj = layersList[i];
    layersList[i].hidden = !layersList[i].hidden;
    if(layersList[i].hidden) {
        layerObj.eyeShown.style.display = 'none';
        layerObj.eyeHidden.style.display = 'inline';
        views[i].canvas.style.display = 'none';
    } else {
        layerObj.eyeShown.style.display = 'inline';
        layerObj.eyeHidden.style.display = 'none';
        views[i].canvas.style.display = 'block';
    }
}

function init() {
    setupCanvases();
    c.fillStyle = 'rgba(99, 110, 114, .25)';
    c.fillRect(0, 0, bg.width, bg.height);
    renderTilemap();
    setupLayersList();
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
            ctx.fillStyle = '#000000';
            if(value != -1) ctx.fillRect(i*tileWidth, j*tileHeight, tileWidth, tileHeight);
        }
    }
}

init();
