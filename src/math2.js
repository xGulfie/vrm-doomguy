import * as THREE from 'three';

export let normpdf = function(value,mean,variance){
    let x = value-mean;
    return 0.39894*Math.exp(-0.5*x*x/(variance*variance))/variance;
}

// squared euclidean distance from one point to another in any space
export let distSq = function distSq(a, b){
    let ret = new Array(a.length);
    ret.fill(0);
    // subtract components
    return ret.map((n,idx)=>{// subtract
        return a[idx] - b[idx];
    })
    .map((n)=>n*n)//square
    .reduce((prev,current)=>{// sum
        return prev + current;
    },0);
}


export let clamp = function(val,min,max){
    return Math.max(Math.min(val,max),min);
}

// ease stuff around
// use this in place of things like `velocity = oldVelocity * 0.9 + newVelocity`
// instead  do `smoothedVelocity = smoothedVelocity + (newVelocity - smoothedVelocity) * exponentialEase(clockDelta, 0.001)`
function __exponentialEase(delta, r){
    var r = r || 0.0001;
    if (r == 1){r = 0.9999999999999999999999999}
    delta *= 1000;
    var clampedDelta = Math.min(delta, 1)
    let ret =  (Math.pow(r, clampedDelta)-1) / Math.log(r);
    if (Number.isNaN(ret)){
        return 0;
    }
    return ret;
}

export let expEaseFloat = function expEaseFloat(smoothedVal, newVal, delta, r){
    let tmp = newVal - smoothedVal;
    return smoothedVal + tmp * __exponentialEase(delta,r);
}

// target is what is modified, toVal is the new value in the future, r is rate
const __easeTmpVec = new THREE.Vector3(0,0,0);
export let expEaseVector = function expEaseVector(toChange, newVal, delta, r){
    __easeTmpVec.subVectors(newVal, toChange);
    toChange.addScaledVector(__easeTmpVec, __exponentialEase(delta, r) );
}

// (-4*x)*(x-1) from x=0 to 1
export let jumpCurve = function jumpCurve(t, startTime, duration){
    let x = (t - startTime) / (duration);
    let ret = (-4*x)*(x-1);
    return Math.max(ret,0);
}

export let jumpCurve2 = function(t, startTime, duration){
    if (t < startTime || t > startTime+duration){
        return 0;
    }
    let x = (t-startTime)/duration;
    if (x < 0.8){
        return -6.2*x*(x-0.8);
    }else{
        return 10*(x-1)*(x-0.8);
    }
}
// mix between x and y
export let mix = function mix(x,y,a){
    return x*(1-a)+y*a;
}

export let mapRangeClamped = function mapRangeClamped(val,fromMin,fromMax,toMin,toMax){
    let x = (val - fromMin)/(fromMax - fromMin);
    x = clamp(x,0,1);
    return mix(toMin, toMax,x);
}