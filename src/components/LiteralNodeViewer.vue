<template>
    <span v-if="isLink">
        <a :href="hrefVal" target="_blank">{{ contentVal }}</a>
    </span>
    <span v-else>{{ textVal }}</span>
</template>

<script setup>
    import { onBeforeMount, ref, inject} from 'vue';
    import { toIRI } from 'shacl-tulip'
    const props = defineProps({
        textVal: String,
    })
    const allPrefixes = inject('allPrefixes')
    const isLink = ref(false)
    const hrefVal = ref("")
    const contentVal = ref("")
    onBeforeMount(() => {
        if (props.textVal.startsWith("http")) {
            isLink.value = true;
            hrefVal.value = props.textVal
            contentVal.value = props.textVal
            return
        }
        var textIRI = toIRI(props.textVal, allPrefixes)
        if (textIRI.startsWith("http")) {
            isLink.value = true;
            hrefVal.value = textIRI
            contentVal.value = props.textVal
            return
        }
        return
    })
</script>


<style scoped>
    .inline-icon-btn {
        margin: 0;
        padding: 0;
        height: 5px;
        line-height: 1;
        vertical-align: text-top;
    }
</style>