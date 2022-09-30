// adds window.toast method, that is all

let el = document.createElement("div");
el.style="width:100;height:100;z-index:1000;display:none;position:absolute;left:50%;top:0;transform:translate(-50%, 0%);margin-top:10px;background:transparent"
document.body.appendChild(el)
let timeoutRef = null;

export let toast = function(str){
    el.innerHTML=`
<span style="background:rgba(0,0,0,0.5);color:#ddd;font-family:sans-serif;font-size:8px;padding:.5em;border-radius:0.5em;">${str}</span>
`
    el.style.display="block";

    if (timeoutRef){
        window.clearTimeout(timeoutRef);
    }
    timeoutRef = window.setTimeout(()=>{
        el.style.display="none";    
    },2000);

}