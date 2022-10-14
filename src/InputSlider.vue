<template>
    <div>
        <label>{{label}}</label>
        <input type="range"  :value="modelValue" :min="min" :max="max" step="0.00001" @input="$emit('update:modelValue',$event.target.value)"/>
        <input type="number" :value="modelValue" :min="min" :max="max" step="0.00001" @input="$emit('update:modelValue',$event.target.value)"/>
    </div>
</template>

<script>
export default{
    props:["modelValue","min","max","label"],
    emits:["update:modelValue"],
    data:function(){
        return {}
    },
    methods:{
        valueChanged(value){
            this.$emit("update:modelValue",value)
        }
    }
}
</script>