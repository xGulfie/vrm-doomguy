const dat = require('lil-gui')

export let guiData = {
    fpsLookSensitivity:1,
    runAmplitude: 0.02,
    walkAmplitude: .02 * 0.6,
    runSpeed: 0.3,
    walkSpeed: 0.2,
    jumpDuration: .6667,
    jumpAmplitude: 0.15,
    blinkDuration: 0.1,
    lightColor: '#FFFFFF',
    ambientColor: '#ff0000',
    lightIntensity: 1,
    lightX: 1,
    lightY: 1,
    lightZ: 1,
    shoulderRotation: 0.12,
    upperArmRotation: 1.1,
    lowerArmRotation: 0.35,
    armSwing:1,
    wasdMove:true,
    spaceJump:true,
    autorun:false,
    speechEnabled:true,
    speechFloor: 0.1,
    speechCeiling:0.25,
    speechBlend:0.8,
    mouthShape:"ee",
    exposure:1,
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
    }
};

const guiDefaults = JSON.parse(JSON.stringify(guiData));

let helpOpen = false;
let gui = null;
let getGui = function () {
    if (gui) { return gui; }
    gui = new dat.GUI({});

    gui.add(guiData,"fpsLookSensitivity",0,10)
    gui.add(guiData, "runAmplitude", 0, .04)
    gui.add(guiData, "walkAmplitude", 0, .04)
    gui.add(guiData, "runSpeed", 0,0.5)
    gui.add(guiData, "walkSpeed", 0,0.3)
    gui.add(guiData, "armSwing", 0,2)
    gui.add(guiData, "jumpDuration", 0, 2)
    gui.add(guiData, "jumpAmplitude", 0, 0.4)
    gui.add(guiData, "blinkDuration", 0, 0.4)
    gui.add(guiData, "wasdMove").name("move with WASD/arrows");
    gui.add(guiData, "spaceJump").name("jump with space");
    gui.add(guiData, "autorun").name("auto-run without pressing Shift");
    let lightingFolder = gui.addFolder("LIGHTING")
    lightingFolder.add(guiData, "lightIntensity", 0, 3)
    lightingFolder.addColor(guiData, "lightColor")
    guiData._ambientColorController = lightingFolder.addColor(guiData, "ambientColor")
    lightingFolder.add(guiData, "exposure",0,4)
    lightingFolder.add(guiData, "lightX", -1, 1)
    lightingFolder.add(guiData, "lightY", -1, 1)
    lightingFolder.add(guiData, "lightZ", -1, 1)
    gui.add(guiData, "shoulderRotation", -0.2, 0.2)
    gui.add(guiData, "upperArmRotation", 0, 1.4)
    gui.add(guiData, "lowerArmRotation", 0, 0.5)
    let speechFolder = gui.addFolder("SPEECH")
    speechFolder.add(guiData,"speechEnabled")
    speechFolder.add(guiData, "speechFloor", 0, 0.5)
    speechFolder.add(guiData, "speechCeiling", 0, 0.5);
    speechFolder.add(guiData, "speechBlend", 0.25, .9999)
    speechFolder.add(guiData, "mouthShape", ["aa","ih","ou","ee","oh"])
    gui.add(guiData,"revert")
    gui.add(guiData,"save")
    gui.add(guiData,"reset").name("Reset ALL to DEFAULT")

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

    helpEl.innerHTML = `
    <p>
    press H to show or (H)ide the main options menu
    </p>
    <p>
    press P for the (P)rops menu
    </p>
    <br>
    <p>
    To use with an FPS, start up your game, then look around a little.
    Then, move your mouse very slowly for a moment, stop, and hit CTRL+SHIFT+M.
    </p>
    <br>
    <p>
    Drag and drop a VRM file into the application to use that instead of this one.    
    </p>
    <br>
    <p>
    You can pan and zoom by clicking and dragging. Left mouse to rotate, right mouse to pan, scroll to move in/out.
    </p>    
    `;
    helpEl.style = "display:none;position:absolute;top:0;left:0;background:white;max-width:300px;cursor:pointer;";
    document.body.appendChild(helpEl);
    helpEl.addEventListener('click', toggleHelp);
    guiData.toggleHelp=toggleHelp;
    gui.add(guiData,"toggleHelp").name("Help")

    guiData.toggleHide =function(){
        if (gui._hidden){
            gui.show()
        } else {
            gui.hide()
        }
    }
    window.addEventListener('keyup',function(e){
        if(e.key.toLowerCase() == "h"){
            guiData.toggleHide()
        }
    });
    gui.domElement.addEventListener('keyup',function(e){
        if(e.key.toLowerCase() == "h"){
            guiData.toggleHide()
        }
    });

    gui.add(guiData,"toggleHide").name("Hide (H)")
    guiData.cameraNeedsReset = false;
    guiData.resetCamera = function(){
        guiData.cameraNeedsReset=true;
    }
    gui.add(guiData,"resetCamera").name("Reset Camera")

    if (!window.localStorage.getItem("initialhelpdismissed")){
        toggleHelp();
        gui.show();
    } else {
        gui.hide();
    }

    return gui;
}

export let getGuiData = function () {
    getGui();
    return guiData;
}