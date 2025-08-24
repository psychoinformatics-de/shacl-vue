<template>
    <span v-if="isLink">
        <a
            style="cursor: pointer"
            @click.prevent="selectNamedNode(currentClassIRI, currentRecordPID)"
            >{{ contentVal }}</a
        >
    </span>
    <span v-else>{{ contentVal }}</span>
    <span v-if="resolveExternally">
        <sup
            ><a class="inline-icon-btn" :href="hrefVal" target="_blank"
                ><v-icon>mdi-arrow-top-right-thick</v-icon></a
            ></sup
        >
    </span>
</template>

<script setup>
import { onBeforeMount, ref, inject, onMounted } from 'vue';
import { toIRI, toCURIE } from 'shacl-tulip';
const props = defineProps({
    textVal: String,
    prefLabel: String,
    quad: Object,
    targetClass: String,
});
const allPrefixes = inject('allPrefixes');
const selectNamedNode = inject('selectNamedNode');
const configVarsMain = inject('configVarsMain');
const isLink = ref(false);
const hrefVal = ref('');
const contentVal = ref('');
const resolveExternally = ref(false);
const currentClassIRI = ref('');
const currentRecordPID = ref('');

onBeforeMount(() => {
    // quad:
    // - NamedNode(pid) - NamedNode(RDF.type) - NamedNode(class)
    // - pid - a - class
    // - Stephan - a - human

    // If the quad prop is truthy, it means that this is a record that can be
    // linked to inside the application, because the quad exists in the graph.
    // Then it should display as a link, and the click action should call the
    // selectNamedNode function with the correct arguments: class and pid

    // We also need to check if the record has a prefix that is would be
    // externally resolvable (i.e. included in configVarsMain['idResolvesExternally'])
    //
    // ==> If the quad exists and the class records resolve externally:
    // - name of record should be a link that navigates to internal record
    // - extra link button should open new tab with pid url
    //
    // ==> If the quad DOES NOT exist and the class records resolve externally:
    // - name of record should be text
    // - extra link button should open new tab with pid url

    currentRecordPID.value = toIRI(props.textVal, allPrefixes);
    if (props.prefLabel) {
        contentVal.value = props.prefLabel;
    } else {
        contentVal.value = currentRecordPID.value;
    }

    // If the quad exists
    if (props.quad !== undefined) {
        currentClassIRI.value = props.quad.object.value;
        // name of record should be a link that navigates to internal record
        isLink.value = true;
    }
    // If the quad does not exist
    else {
        currentClassIRI.value = props.targetClass;
        // name of record is just text (no internal navigation)
        isLink.value = false;
    }
    // If the record has a prefix that resolves externally
    let mainRecordPIDprefix = toCURIE(currentRecordPID.value, allPrefixes, 'parts').prefix;
    if (
        configVarsMain['idResolvesExternally'].indexOf(
            mainRecordPIDprefix
        ) >= 0
    ) {
        // extra link button should open new tab with pid url
        resolveExternally.value = true;
        hrefVal.value = currentRecordPID.value;
    }
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
</style>
