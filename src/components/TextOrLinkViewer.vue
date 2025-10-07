<template>
    <span v-if="isLink">
        <a :href="hrefVal" target="_blank" ref="el" class="text-ellipsis">{{ contentVal }}</a>
    </span>
    <span v-else ref="el" class="text-ellipsis">{{ textVal }}</span>
    <v-tooltip
        v-if="isTruncated"
        :text="contentVal || textVal"
        :activator="el"
        location="top start"
        origin="start center"
    />
</template>

<script setup>
import { onBeforeMount, ref, inject, onMounted} from 'vue';
import { toIRI } from 'shacl-tulip';
const props = defineProps({
    textVal: String,
});
const isTruncated = ref(false)
const el = ref(null);
const allPrefixes = inject('allPrefixes');
const isLink = ref(false);
const hrefVal = ref('');
const contentVal = ref('');
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
    if (el.value) {
        isTruncated.value = el.value.scrollWidth > el.value.clientWidth
    }
})

</script>

<style scoped>
.text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
    max-width: 400px;
    vertical-align: bottom;
}
</style>
