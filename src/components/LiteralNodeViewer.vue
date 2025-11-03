<template>
    <span v-if="isLink && allowLink">
        <a :href="hrefVal" target="_blank" ref="el" :class="computedClass" :style="computedStyle">{{ contentVal }}</a>
    </span>
    <span v-else ref="el" :class="computedClass" :style="computedStyle">{{ textVal }}</span>
    <v-tooltip
        v-if="isTruncated"
        :text="contentVal || textVal"
        :activator="el"
        location="top start"
        origin="start center"
    />
</template>

<script setup>
import { onMounted, onBeforeMount, ref, inject, computed} from 'vue';
import { toIRI } from 'shacl-tulip';
const props = defineProps({
    textVal: String,
    wrap: {
        type: String,
        default: 'nowrap', // 'nowrap' | 'wrap'
    },
    width: {
        type: [String, Number],
        default: '500px',
    },
    allowLink: {
        type: Boolean,
        default: true,
    },
});
const allPrefixes = inject('allPrefixes');
const isLink = ref(false);
const hrefVal = ref('');
const contentVal = ref('');
const el = ref(null)
const isTruncated = ref(false)
onBeforeMount(() => {
    if (props.textVal.startsWith('http')) {
        isLink.value = true;
        hrefVal.value = props.textVal;
        contentVal.value = props.textVal;
        return;
    }
    var textIRI = toIRI(props.textVal, allPrefixes);
    if (textIRI.startsWith('http')) {
        isLink.value = true;
        hrefVal.value = textIRI;
        contentVal.value = props.textVal;
        return;
    }
    return;
});
onMounted( () => {
    if (props.wrap === 'nowrap' && el.value) {
        isTruncated.value = el.value.scrollWidth > el.value.clientWidth
    }
})
const computedStyle = computed(() => {
    const style = {};
    if (props.wrap === 'nowrap') {
        style.cursor = isTruncated.value ? 'pointer' : '';
        style.maxWidth = typeof props.width === 'number' ? `${props.width}px` : props.width;
    }
    return style;
});
const computedClass = computed(() => {
    return props.wrap === 'nowrap' ? 'text-ellipsis' : '';
});
</script>

<style scoped>
.inline-icon-btn {
    margin: 0;
    padding: 0;
    height: 5px;
    line-height: 1;
    vertical-align: text-top;
}
.text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
    vertical-align: bottom;
}
</style>