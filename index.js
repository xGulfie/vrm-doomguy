const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron')
const path = require('path')
const lepikEvents = require('@gulfie/lepikevents').events;
const clArgs = require('yargs/yargs')(process.argv.slice(2)).argv

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
    alwaysOnTop:onTop
  })

  win.loadFile('build/index.html');
 
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
}).then(createWindow);

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') {
    app.quit();
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