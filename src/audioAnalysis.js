// try and provide info about the sound coming from the mic on window.micAnalysis

/*
notes:
use meyda
spectral centroid for vowel
flatness for consonance
*/

window.audioFeatures = null;

let debug=false;

import {clamp, expEaseFloat} from "./math2"

let n = 0;
function makeProgress(name,min,max){
    if(!debug){return;}
    let el = document.createElement("div");
    el.innerHTML = `<label>${name}
    <progress id="${name}" min="${min}" max="${max}"></progress>
    <span id="${name}-span"></span>
    </label>`;
    el.style=`position:absolute;bottom:${20*(n++)}px;z-index:3000`
    document.body.appendChild(el);
}
function setProgress(name,value){
    if(!debug){return;}
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
        makeProgress("loudness",0,1)    
        makeProgress("spectralCentroid",0,1)    
        makeProgress("speak",0,1)
        makeProgress("smoothedSpeak",0,1)
        let t0 = performance.now()
        let smoothedSpectralFlatness=0;
        let smoothedSpectralCentroid=0;
        let smoothedLoudness = 0;


        const analyzer = Meyda.createMeydaAnalyzer({
        "audioContext": audioContext,
        "source": source,
        "bufferSize": 1024,
        "featureExtractors": [
            "spectralFlatness", // noisy vs pure sound
            "loudness", // adoy
            "spectralCentroid" // it's high with kayboard noise
        ],
        "callback": (features) => {
            let now = performance.now();
            let delta =(now - t0)/1000;
            t0=now;

            let loudnessTotal = 0;
            // see https://en.wikipedia.org/wiki/Bark_scale#/media/File:Bark_scale.png
            // first 9 bands gets you above 1khz
            for(var i = 0; i < 12 && i < features.loudness.specific.length; i++){
                loudnessTotal+= features.loudness.specific[i];
            }

            let clampedLoudness = clamp(loudnessTotal/50,0,1)
            let clampedCentroid = clamp(features.spectralCentroid/256,0,1)
            let clampedFlatness = features.spectralFlatness
            window.audioFeatures = features;
            
            let rate = 0.5
            smoothedSpectralCentroid = expEaseFloat(smoothedSpectralCentroid,clampedCentroid,delta,rate) || 0;
            smoothedSpectralFlatness = expEaseFloat(smoothedSpectralFlatness,clampedFlatness,delta,rate) || 0;
            smoothedLoudness = expEaseFloat(smoothedLoudness,clampedLoudness,delta,rate) || 0;

            window.audioFeatures.smoothedSpeak = smoothedLoudness * (1-smoothedSpectralFlatness) * (1 - smoothedSpectralCentroid);
            window.audioFeatures.speak = clampedLoudness * (1-clampedFlatness) * (1 - clampedCentroid);

            setProgress("spectralFlatness",smoothedSpectralFlatness)
            setProgress("loudness",smoothedLoudness) 
            setProgress("spectralCentroid",smoothedSpectralCentroid)
            setProgress("speak",window.audioFeatures.speak)
            setProgress("smoothedSpeak",window.audioFeatures.smoothedSpeak)
        }
        });
        analyzer.start();
    
    }
    catch(e){
        console.error(e)
    }

})();