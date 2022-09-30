const { contextBridge, ipcRenderer } = require('electron');

let opts = {};
const events = [
    'keyPress',
    'keyRelease',
    'mouseMove',
    'windowMove'
];
events.forEach((eventName)=>{
    // 'onKeyPress' etc
    const onName = 'on'+eventName.charAt(0).toUpperCase()+eventName.slice(1);

    opts[onName] = function(callback){
        ipcRenderer.on(eventName, (evt,data)=>callback(data));
    }
});

contextBridge.exposeInMainWorld('electronAPI', opts);