<template>
    <span v-if="isTruncated">
        <v-btn
            density="compact"
            no-gutters
            size="small"
            variant="text"
            :icon="btnExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"
            @click="expandBtnOnclick()">
        </v-btn>&nbsp;
    </span>
    <span v-if="isLink && allowLink" @click="expandBtnOnclick()">
        <a :href="hrefVal" target="_blank" ref="el" :class="computedClass" :style="computedStyle">{{ contentVal }}</a>
    </span>
    <span v-else ref="el" :class="computedClass" :style="computedStyle" @click="expandBtnOnclick()">{{ textVal }}</span>
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
        default: '85%',
    },
    allowLink: {
        type: Boolean,
        default: true,
    },
});
const allPrefixes = inject('allPrefixes');
const isLink = ref(false);
const btnExpanded = ref(false);
const hrefVal = ref('');
const contentVal = ref('');
const el = ref(null)
const isTruncated = ref(false)
const localWrap = ref(props.wrap)

onBeforeMount(() => {
    if (props.textVal?.startsWith('http')) {
        isLink.value = true;
        hrefVal.value = props.textVal;
        contentVal.value = props.textVal;
        return;
    }
    var textIRI = toIRI(props.textVal, allPrefixes);
    if (textIRI?.startsWith('http')) {
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
    if (localWrap.value === 'nowrap') {
        style.maxWidth = typeof props.width === 'number' ? `${props.width}px` : props.width;
    }
    style.cursor = isTruncated.value ? 'pointer' : '';
    return style;
});
const computedClass = computed(() => {
    return localWrap.value === 'nowrap' ? 'text-ellipsis' : '';
});

function expandBtnOnclick() {
    btnExpanded.value = !btnExpanded.value;
    if (localWrap.value == 'nowrap' && btnExpanded.value) {
        localWrap.value = 'wrap';
    } else {
        localWrap.value = 'nowrap'
    }

}
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