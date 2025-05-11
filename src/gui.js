const dat = require('lil-gui')

let helpOpen = false;
let gui = null;

export let guiData = {
    fpsLookSensitivity:1,
    runAmplitude: 0.02,
    walkAmplitude: .02 * 0.6,
    runSpeed: 0.3,
    walkSpeed: 0.2,
    jumpDuration: .6667,
    jumpAmplitude: 0.15,
    blinkDuration: 0.1,
    shoulderRotation: 0.12,
    upperArmRotation: 1.1,
    lowerArmRotation: 0.35,
    armSwing:1,
    wasdMove:true,
    invertX:false,
    invertY:false,
    spaceJump:true,
    autorun:false,
    turnHead:false,
    turnHeadNeckBlend:0.4,
    turnHeadFactorX:0.3,
    turnHeadFactorY:0.3,
    lightColor: '#FFFFFF',
    ambientColor: '#ff0000',
    useEnvmap: true,
    lightIntensity: 1,
    lightX: 1,
    lightY: 1,
    lightZ: 1,
    exposure:1,
    fov:30,
    speechEnabled:true,
    speechFloor: 0.15,
    speechRange:0.05,
    speechBlend:0.8,
    mouthShape:"ee",
    gamepadLook:false,
    gamepadLookInvertY:false,
    gamepadLookInvertX:false,
    walkHeadRotation:0.4,

    revert:function(){
        gui.load(JSON.parse(localStorage.getItem("gui")))
    },
    save:function(){
        localStorage.setItem('gui',JSON.stringify(gui.save()));
    },    
    reset:function(){
        if(!confirm("reset to defaults?"))
            return;
        gui.load(JSON.parse(localStorage.getItem("gui-defaults")))
    },    
    cameraLocationNeedsLoading:true,
    cameraLocationNeedsSaving:false,
    cameraNeedsReset:false,
    saveCameraPosition:function(){
        guiData.cameraLocationNeedsSaving=true;
    },
    loadCameraPosition:function(){
        guiData.cameraLocationNeedsLoading=true;
    },
    resetCamera: function(){
        guiData.cameraNeedsReset=true;
    },
    toggleHide:function(){
        if (gui._hidden){
            gui.show()
        } else {
            gui.hide()
        }
    }
};

let getGui = function () {
    if (gui) { return gui; }
    gui = new dat.GUI({});

    let lookFolder = gui.addFolder("LOOK")
    lookFolder.add(guiData,"fpsLookSensitivity",0,10).name("fps look sensitivity")
    lookFolder.add(guiData,"turnHead").name("turn head with look")
    lookFolder.add(guiData,"turnHeadFactorX",-1.5,1.5).name("turn head with look X factor")
    lookFolder.add(guiData,"turnHeadFactorY",-1.5,1.5).name("turn head with look Y factor")
    lookFolder.add(guiData,"gamepadLook").name("gamepad right stick look")
    lookFolder.add(guiData,"gamepadLookInvertX").name("gamepad look invert X")
    lookFolder.add(guiData,"gamepadLookInvertY").name("gamepad look invert Y")
    lookFolder.add(guiData,"turnHeadNeckBlend",0,1).name("turn head vs. neck")
    lookFolder.add(guiData, "blinkDuration", 0, 0.4).name("blink duration")

    let animFolder = gui.addFolder("ANIMATION")
    animFolder.add(guiData, "runAmplitude", 0, .04)
    animFolder.add(guiData, "walkAmplitude", 0, .04)
    animFolder.add(guiData, "runSpeed", 0,0.5)
    animFolder.add(guiData, "walkSpeed", 0,0.3)
    animFolder.add(guiData, "armSwing", 0,2)
    animFolder.add(guiData, "jumpDuration", 0, 2)
    animFolder.add(guiData, "jumpAmplitude", 0, 0.4)
    animFolder.add(guiData, "wasdMove").name("move with WASD/arrows");
    animFolder.add(guiData, "invertX").name("invert left/right motion");
    animFolder.add(guiData, "invertY").name("invert up/down motion");
    animFolder.add(guiData, "spaceJump").name("jump with space");
    animFolder.add(guiData, "autorun").name("auto-run without pressing Shift");
    animFolder.add(guiData, "shoulderRotation", -0.2, 0.2)
    animFolder.add(guiData, "upperArmRotation", 0, 1.4)
    animFolder.add(guiData, "lowerArmRotation", 0, 0.5)
    animFolder.add(guiData, "walkHeadRotation", 0, 0.6).name("rotate head when moving");

    let speechFolder = gui.addFolder("SPEECH")
    speechFolder.add(guiData,"speechEnabled").name("speech enabled")
    speechFolder.add(guiData, "speechFloor", 0, 0.5).name("speech threshold")
    speechFolder.add(guiData, "speechRange", 0, 0.5).name("speech subtlety");
    speechFolder.add(guiData, "speechBlend", 0.25, .9999).name("mouth speed")
    speechFolder.add(guiData, "mouthShape", ["aa","ih","ou","ee","oh"]).name("VRM mouth shape")

    let lightingFolder = gui.addFolder("LIGHTING / CAMERA")
    lightingFolder.add(guiData, "lightIntensity", 0, 3).name("light intensity")
    lightingFolder.addColor(guiData, "lightColor").name("light color")
    guiData._ambientColorController = lightingFolder.addColor(guiData, "ambientColor").name("ambient color override")
    lightingFolder.add(guiData, "exposure",0,4)
    lightingFolder.add(guiData, "lightX", -1, 1)
    lightingFolder.add(guiData, "lightY", -1, 1)
    lightingFolder.add(guiData, "lightZ", -1, 1)
    lightingFolder.add(guiData, "useEnvmap").name("use envmap for lighting")
    lightingFolder.add(guiData, "fov",10,120)
    lightingFolder.add(guiData,'saveCameraPosition').name('Save Camera Position & FOV')
    lightingFolder.add(guiData,'loadCameraPosition').name('(R)evert Camera Position & FOV')
    lightingFolder.add(guiData,"resetCamera").name("Reset Camera Position & FOV to DEFAULT")

    gui.add(guiData,"revert").name("load")
    gui.add(guiData,"save").name("save")
    gui.add(guiData,"reset").name("Reset to DEFAULT")    

    localStorage.setItem('gui-defaults',JSON.stringify(gui.save()))

    if (localStorage.getItem('gui')){
        gui.load(JSON.parse(localStorage.getItem('gui')))
    }

    //and more!
    let helpEl = document.createElement("div");

    let toggleHelp = function () {
        if (helpOpen){
            window.localStorage.setItem("initialhelpdismissed","yepperino")
        }
        helpOpen = !helpOpen;
        helpEl.style.display = helpOpen ? 'block' : 'none';
    }

    helpEl.innerHTML = `<p>
    press F1 for help

    press H to show or (H)ide the main options menu

    press P for the (P)rops menu

    press R to (R)eset the camera
 
    To use with an FPS, start up your game, then look around a little.
    Then, move your mouse very slowly for a moment, stop, and hit CTRL+SHIFT+M.

    Drag and drop a VRM file into the application to use that instead of this one.   
    You can pan and zoom by clicking and dragging. Left mouse to rotate, right mouse to pan, scroll to move in/out.

    Lipsync uses the default audio device for input. Change your default input in Windows and then restart the application if you need to.

    Check the README for how to set the window background, setalways-on-top, and width and height
    </p>    
    `.split('\n').join('</p><p>');
    helpEl.style = "display:none;position:absolute;top:0;left:0;background:white;max-width:300px;cursor:pointer;";
    document.body.appendChild(helpEl);
    helpEl.addEventListener('click', toggleHelp);
    guiData.toggleHelp=toggleHelp;
    gui.add(guiData,"toggleHelp").name("Help")

    gui.domElement.addEventListener('keyup',function(e){
        if(e.key.toLowerCase() == "h"){
            guiData.toggleHide()
        }
    });

    gui.add(guiData,"toggleHide").name("Hide (H)")

    if (!window.localStorage.getItem("initialhelpdismissed")){
        toggleHelp();
        gui.show();
    } else {
        gui.hide();
    }

    let css = document.createElement("style")
    css.setAttribute("type","text/css")
    css.innerHTML=".lil-gui.root.autoPlace{top:30px;max-height:calc(100vh - 30px);}";
    document.body.appendChild(css)

    gui.folders.forEach(folder=>{
        folder.close()
    })

    return gui;
}

export let getGuiData = function () {
    getGui();
    return guiData;
}