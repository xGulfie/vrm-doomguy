// try and provide info about the sound coming from the mic on window.micAnalysis

/*
notes:
use meyda
spectral centroid for vowel
flatness for consonance
*/

window.audioFeatures = null;

function makeProgress(name,min,max){
    if(!window.debug){return;}
    let el = document.createElement("div");
    el.innerHTML = `<label>${name}
    <progress id="${name}" min="${min}" max="${max}"></progress>
    <span id="${name}-span"></span>
    </label>`;
    document.body.appendChild(el);
}
function setProgress(name,value){
    if(!window.debug){return;}
    document.getElementById(name).value = value;
    document.getElementById(name+"-span").innerHTML = value;
}

(async function(){
    let stream = null;
    const audioContext = new AudioContext();


    try{

        let devices = await navigator.mediaDevices.enumerateDevices();
        console.log("devices",devices);
        let deviceId = devices[0].deviceId;
        console.log('device Id:',deviceId)

        stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
                noiseSuppression:false,
                echoCancellation:false
            }
        });
        console.log('stream',stream);

        const source = audioContext.createMediaStreamSource(stream);
        
        makeProgress("spectralFlatness",0,1 )
        makeProgress("loudness",0,50)    

        const analyzer = Meyda.createMeydaAnalyzer({
        "audioContext": audioContext,
        "source": source,
        "bufferSize": 1024,
        "featureExtractors": [
            "spectralFlatness", // noisy vs pure sound
            "loudness", // adoy
        ],
        "callback": (features) => {
            let clampedLoudness = Math.min(100,features.loudness.total)/100;
            window.audioFeatures = features;
            window.audioFeatures.speak = clampedLoudness * (1-features.spectralFlatness);

            setProgress("spectralFlatness",features.spectralFlatness)
            setProgress("loudness",features.clampedLoudness)
        }
        });
        analyzer.start();
    
    }
    catch(e){
        console.error(e)
    }

})();