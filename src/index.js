const electron = require('electron');
const ipc = electron.ipcRenderer;

let sources = [];
let size = [64, 64, 16, 16];
let layers = [];

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

function init() {
    update();
}

function update() {
    renderTilemap();
}

function renderTilemap(scale) {
    c.fillStyle = 'rgba(255, 255, 255, .25)';
    c.strokeStyle = 'rgba(0, 0, 0, .25)';
    c.fillRect(0, 0, size[0]*size[2], size[1]*size[3]);
    for(let j = 0; j < size[1]; j++) {
        
    }
}

init();
