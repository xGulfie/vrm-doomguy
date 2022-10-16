<template>
    <div class="inputslider"
    :class="{focused: focused, disabled:disabled}"
    @mousemove.prevent="handleMousemove"
    @mousedown="handleMousedown"
    @mouseup="handleMouseup"
    ref="sliderel">
        <div class="fill" :style="'width:'+(_modelValue-min)/(max-min)*100+'%'" v-show="!textInputActive"></div>
        <div class="txt">
            <div class="txtleft noselect">{{label}}</div>
            <div v-show="!textInputActive" class="txtright noselect">{{truncatedValue}}</div>
            <input v-show="textInputActive" type="text" ref="txtinput" class="txtright" @keyup.enter="finishInput" :value="_modelValue"/>
        </div>
    </div>
</template>

<script>
const stringMath = require("string-math")
export default {
    props:{
        modelValue: Number,
        min: Number,
        max: Number,
        label: String,
        disabled: Boolean
    },
    data() {
        return {
            _modelValue:0,
            mousedownOverElement:false,
            mousemoveHappenedThisClick:true,
            textInputActive:false,
            focused:false
        };
    },
    watch:{
        modelValue(newVal){
            this._modelValue=newVal;
        }
    },
    methods: {
        onfocus(){
            // this.textInputActive=true;
            // setTimeout(()=>{
            //     this.$refs.txtinput.focus();
            //     this.$refs.txtinput.select();
            // },0)
        },
        u(){
            this.$emit('update:modelValue',this._modelValue)
            this.$emit('input',this._modelValue)
        },
        handleMousedown(event){
            if (this.disabled){
                return;
            }
            if (this.textInputActive){
                return;
            }
            this.focused=true;
            this.mousedownOverElement = true;
            this.mousemoveHappenedThisClick=false;
            this.$refs.sliderel.focus();
        },
        handleMouseup(event){
            if (this.textInputActive){
                return;
            }
            this.mousedownOverElement = false;
            // check if mouse move happened
            if (!this.mousemoveHappenedThisClick){
                // activate the text input
                this.textInputActive=true;
                setTimeout(()=>{
                    this.$refs.txtinput.focus();
                    this.$refs.txtinput.select();
                },0)
            }
        },
        handleWindowMouseup(event){
            this.mousedownOverElement = false;
        },
        handleWindowMousemove(event){
            if (!this.$refs.sliderel)
                return

            if (this.mousedownOverElement){
                this.mousemoveHappenedThisClick=true;
                let rect = this.$refs.sliderel.getBoundingClientRect();
                let amnt = (event.x-rect.left)/(rect.right-rect.left);
                amnt = Math.min(Math.max(amnt,0),1); 
                this._modelValue = this.min + amnt*(this.max-this.min);
                this.u()
            }
        },
        handleMousemove(event){
            // nop
        },
        handleWindowMousedown(event){
            if (!this.$refs.sliderel)
                return

            let rect = this.$refs.sliderel.getBoundingClientRect();
            let inside = (event.x >= rect.left && event.x <= rect.right && event.y >= rect.top && event.y <= rect.bottom);
            if (!inside){
                this.focused=false;
                if (this.textInputActive){
                    this.finishInput();
                }
            }
            
        },
        finishInput(){
            //defocus and hide text input
            this.textInputActive=false;
            try{
                this._modelValue = stringMath(this.$refs.txtinput.value.toString().replace(/pi/ig,' 3.141592653589793 ').replace(/e(?=\d)/ig,'e+'));
                this.u()
            }
            catch{
                //noop
            }
        }
    },
    computed:{
        hasMinMax(){
            return 
        },
        truncatedValue(){
            let v = Number(this._modelValue);
            let maxLength = 7;
            let s = v.toString()
            if (s.length <= maxLength){
                return s;
            }
            
            let signLength = (v < 0)? 1 : 0;
            
            if ( Math.abs(v) > Math.pow(10,maxLength -2 - signLength) ){
                let powLen = Math.log10(Math.abs(Math.floor(Math.log10(Math.abs(v)))));
                console.log(powLen)
                return v.toExponential(maxLength-4-powLen-signLength).toUpperCase();
            }
            if ( Math.abs(v) < Math.pow(10,-1*(maxLength -2 - signLength)) ){
                let powLen = Math.log10(Math.abs(Math.floor(Math.log10(Math.abs(v)))));
                console.log(powLen)
                return v.toExponential(maxLength-4-powLen-signLength).toUpperCase().replace('+','');
            }
            
            return s.slice(0,maxLength);      
            
        }
    },
    mounted(){
        window.addEventListener('mousemove',this.handleWindowMousemove);
        window.addEventListener('mouseup',this.handleWindowMouseup);
        window.addEventListener('mousedown',this.handleWindowMousedown);
        this._modelValue=this.modelValue;
    },
    unmounted(){
        window.removeEventListener('mousemove',this.handleWindowMousemove)
        window.removeEventListener('mouseup',this.handleWindowMouseup);
        window.removeEventListener('mousedown',this.handleWindowMousedown);        
    }
};
</script>

<!-- Use preprocessors via the lang attribute! e.g. <style lang="scss"> -->
<style scoped>
.inputslider{
    width:100%;
    max-width:10rem;
    height:1rem;
    border-radius:1rem;
    background:#777;
    overflow:hidden;
    position:relative;
    border:2px solid #222;
    cursor:ew-resize;
}
.inputslider *{
    color:#fff;
}
.inputslider.disabled, .inputslider.disabled *{
    color:#bbb;
    border-color:#777;
    cursor:not-allowed;
    background:#555;
}
.inputslider.disabled .fill{
    background:#999;
}
.inputslider .fill{
    height:100%;
    width:100%;
    background:#77d;
}
.inputslider .txt{
    position:absolute;
    top:0;
    display:flex;
    justify-content:space-between;
    height:100%;
    width:100%;
}
.inputslider .txt *{
    line-height:1rem;
    overflow:hidden;
    text-wrap:nowrap;
}
.inputslider .txt .txtleft{
    padding:0 .5rem 0 .5rem;
}
.inputslider .txt .txtright{
    padding:0 0.5rem 0 0;
}
.noselect{
    user-select:none;
}
input[type="text"]{
    background:#777;
    border:none;
    outline:none;
    flex-grow:1;
    flex-shrink:0;
}
.txtright:not(input){
    flex-shrink:1;
}
.inputslider.focused{
    border-color:#77e;
}
</style>