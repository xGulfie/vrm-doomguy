const { app, BrowserWindow, globalShortcut, ipcMain, ipcRenderer, dialog } = require('electron');
const { platform } = require('os');
const path = require('path')
const lepikEvents = require('lepikevents').events;
const clArgs = require('yargs/yargs')(process.argv.slice(2)).argv
const package_json = require("./package.json");

const greenScreen = clArgs.greenscreen || clArgs.greenScreen;
let bgColor = greenScreen ? '#ff00ff00' : '#00ffffff';
if (typeof greenScreen === 'string'){
  if (/#(\d|[1-f]|[A-F]){8}/.test(greenScreen)){
    bgColor = greenScreen;
  } else {
    console.error("it needs to be #aarrggbb format you goober")
    app.quit();
  }
}
const onTop = clArgs.ontop || clArgs.onTop || clArgs.alwaysontop || clArgs.alwaysOnTop;
const width = Math.round(clArgs.size || clArgs.width || 800);
const height = Math.round(clArgs.height || width*(3/4));

app.commandLine.appendSwitch('use-fake-ui-for-media-stream')
// app.commandLine.appendSwitch('force_high_performance_gpu')
// app.commandLine.appendSwitch('enable-webgl')

let win = null;
function createWindow () {
  win = new BrowserWindow({
    webSecurity:false,
    width: width,
    height: height,
    x:0,
    y:0,
    useContentSize: true,
    transparent: !greenScreen,
    backgroundColor: bgColor,
    webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        enableRemoteModule: true
    },

    frame:!!greenScreen,
    autoHideMenuBar:true,
    alwaysOnTop:onTop,
    icon:"icon.png",
    title:package_json.windowTitle
  })

  win.loadFile(`build/index.html`,{search: !greenScreen?"addframe":""});
 
  // register key handling
  lepikEvents.on('keyPress', (key) => {
    if(!win){return;}
    let result = filterKeys(key);
    if (result)
      win.webContents.send('keyPress',result);
  });
  lepikEvents.on('keyRelease', (key) => {
    if(!win){return;}
    let result = filterKeys(key);
    if (result){
      win.webContents.send('keyRelease',result);      
    }
  });  
  lepikEvents.on('mouseMove', (data)=>{
    if(!win){return;}
    win.webContents.send('mouseMove',[data[0],data[1]])
  });

  let onMotion = ()=>{
    const pos = win.getPosition();
    const size = win.getSize();
    const center = [pos[0] + size[0]/2,pos[1] + size[1]/2];
    win.webContents.send('windowMove',center);
  }

  win.on('move',onMotion)
  win.on('resize',onMotion)
  // ok so I'm just gonna setTimeout to send new position to it once on window init
  setTimeout(onMotion,1000)

}

app.whenReady().then(() => {
  // globalShortcut.register('CommandOrControl+W', () => {
  //   console.log('Electron loves global shortcuts!')
  // })
  ipcMain.handle("requestGltf",async function(){
    const result = await dialog.showOpenDialog({
      properties:["openFile"],
      title:"Choose a prop model...",
      filters:[{name:"model files (.gltf,.glb)",extensions:["gltf","glb"]}]
    })
      

    if (result.canceled || typeof result.filePaths == 'undefined'){
      return null
    } else {
      let ret ='file://'+(result.filePaths[0].split(/\\|\//g).map(encodeURIComponent).join('/'));

      if (platform == 'win32'){
        ret = ret.replace('%3A',':')
      }
      return ret
    }

  });

  ipcMain.on('requestMinimize',function(){
      win?.minimize();
  });

  ipcMain.on('requestMaximize',function(){
    if(!win){return}
    if (win.isMaximized()){
      win.unmaximize();
    } else {
      win.maximize()
    }
  });


}).then(createWindow);

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') {
    app.quit();
    process.exit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
})



// find a matching key and return it (in lowercase) or false
// this is to avoid sending too much data to the window and also normalize to lowercase
// so we don't have to check in the window
function filterKeys(s){
  let str = s.toString().toLowerCase();
  let match = false;
  ;(['w','a','s','d','shift','ctrl','space',' ','m','up','left','down','right']).some((val)=>{
    if (str == val){
      match = str;
      return true;
    }
  });
  return match;
}

