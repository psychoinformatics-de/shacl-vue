<template>
    <span v-if="isLink">
        <a :href="hrefVal">{{ contentVal }}</a>
    </span>
    <span v-else>{{ textVal }}</span>
</template>

<script setup>
    import { onBeforeMount, ref, inject} from 'vue';
    import { toIRI } from '@/modules/utils';
    const props = defineProps({
        textVal: String,
    })
    const allPrefixes = inject('allPrefixes')
    const isLink = ref(false)
    const hrefVal = ref("")
    const contentVal = ref("")
    onBeforeMount(() => {
        console.log("props.textVal")
        console.log(props.textVal)
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
