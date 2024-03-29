const { contextBridge, ipcRenderer } = require('electron');

let opts = {};

// these events will be sent to the browser window
const events = [
    'keyPress',
    'keyRelease',
    'mouseMove',
    'windowMove',
    'axisMotion'
];
events.forEach((eventName)=>{
    // 'onKeyPress' etc
    const onName = 'on'+eventName.charAt(0).toUpperCase()+eventName.slice(1);

    opts[onName] = function(callback){
        ipcRenderer.on(eventName, (evt,data)=>callback(data));
    }
});

opts['showGltfDialog'] = ()=> ipcRenderer.invoke("requestGltf")
opts['requestMinimize'] = ()=> ipcRenderer.send("requestMinimize")
opts['requestMaximize'] = ()=> ipcRenderer.send("requestMaximize")

contextBridge.exposeInMainWorld('electronAPI', opts);
