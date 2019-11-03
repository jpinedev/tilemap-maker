const electron = require('electron');
const ipc = electron.ipcRenderer;

let sources = [];
let size = [];
let layers = [];

ipc.on('update-tilemap', (event, tm) => {
    sources = tm[0];
    size = tm[1];
    layers = tm[2];
});

const tools = document.getElementsByClassName('tool');
console.log(tools);
let activeToolIndex = 0;
function getActiveTool() { return tools[activeToolIndex] }
for(let i = 0; i < tools.length; i++) {
    let tool = tools[i];
    tool.addEventListener('click', (event) => {
        getActiveTool().classList.remove('tool-active');
        event.target.classList.add('tool-active');
        activeToolIndex = i;
    });
};
