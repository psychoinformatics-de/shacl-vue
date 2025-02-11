<template>
    <span v-if="isLink">
        <a :href="hrefVal" target="_blank">{{ contentVal }}</a>
    </span>
    <span v-else>{{ textVal }}</span>
</template>

<script setup>
    import { onBeforeMount, ref, inject} from 'vue';
    import { toIRI } from '@/modules/utils';
    const props = defineProps({
        textVal: String,
        prefLabel: String,
    })
    const allPrefixes = inject('allPrefixes')
    const isLink = ref(false)
    const hrefVal = ref("")
    const contentVal = ref("")
    onBeforeMount(() => {
        if (props.textVal.startsWith("http")) {
            isLink.value = true;
            hrefVal.value = props.textVal
            if (props.prefLabel) {
                contentVal.value = props.prefLabel
            } else {
                contentVal.value = props.textVal
            }
            return
        }
        var textIRI = toIRI(props.textVal, allPrefixes)
        if (textIRI.startsWith("http")) {
            isLink.value = true;
            hrefVal.value = textIRI
            if (props.prefLabel) {
                contentVal.value = props.prefLabel
            } else {
                contentVal.value = props.textVal
            }
            return
        }
        return
    })
</script>
