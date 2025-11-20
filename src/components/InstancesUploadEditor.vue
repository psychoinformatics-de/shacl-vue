<template>
    <v-input
        v-model="internalValue"
        :rules="rules"
        ref="fieldRef"
        :id="inputId"
        hide-details="auto"
    >
        <v-row no-gutters align="stretch" class="fill-height">
            <v-col cols="11">
                <InstancesSelectEditor 
                    v-model="subValues.selectedInstance"
                    :property_shape="computedPropertyShape"
                    :node_uid="node_uid"
                    :node_idx="node_idx"
                    :triple_uid="triple_uid"
                    :triple_idx="triple_idx"
                    :disabled="disabled"
                    @update:modelValue="onInstanceSelected"
                />
            </v-col>
            <v-col class="d-flex align-stretch justify-center" style="padding: 0; padding-left: 2px;">
                <GitAnnexUploader
                    :config="uploadConfig"
                    @uploadComplete="onUploadComplete"
                />
            </v-col>
        </v-row>
    </v-input>
</template>

<script setup>
import { inject, ref, onBeforeMount, onMounted, reactive, onBeforeUnmount, provide} from 'vue';
import { useRules } from '../composables/rules';
import { useRegisterRef } from '../composables/refregister';
import { useBaseInput } from '@/composables/base';
import { toCURIE, toIRI } from 'shacl-tulip';
import { RDF } from '@/modules/namespaces';
import { fillStringTemplate, findObjectByKey, getContent } from '@/modules/utils';
import { DataFactory } from 'n3';
import InstancesSelectEditor from '@/components/InstancesSelectEditor.vue'
import GitAnnexUploader from '@/components/GitAnnexUploader.vue'
import { useCompConfig } from '@/composables/useCompConfig';
const { namedNode } = DataFactory;
const triggerListGenAndItemSelect = ref(false)
provide('triggerListGenAndItemSelect', triggerListGenAndItemSelect);

// ----- //
// Props //
// ----- //

const props = defineProps({
    modelValue: String,
    property_shape: Object,
    node_uid: String,
    node_idx: String,
    triple_uid: String,
    triple_idx: Number,
});

// ---- //
// Data //
// ---- //
const { rules } = useRules(props.property_shape);
const inputId = `input-${Date.now()}`;
const { fieldRef } = useRegisterRef(inputId, props);
const emit = defineEmits(['update:modelValue']);
const { subValues, internalValue } = useBaseInput(
    props,
    emit,
    valueParser,
    valueCombiner
);

const configVarsMain = inject('configVarsMain');
const uploadConfig = configVarsMain.gitannexP2phttpConfig ?? {};
const {componentName, componentConfig} = useCompConfig(configVarsMain)
const rdfDS = inject('rdfDS');
const allPrefixes = inject('allPrefixes');
const fetchingRecordLoader = ref(false);
const fetchFromService = inject('fetchFromService');
const cancelButtonPressed = inject('cancelButtonPressed');
const computedPropertyShape = ref({...props.property_shape,});
const templates = reactive({
    pid: '',
    ttl: ''
})
const hasCreatedQuads = ref(false)
const createdQuads = ref([])
const createdDistributions = new Set()
const savedNodes = inject('savedNodes');
const nodesToSubmit = inject('nodesToSubmit');

function valueParser(value) {
    // Parsing internalValue into ref values for separate subcomponent(s)
    return {
        selectedInstance: value || null,
    }
}

function valueCombiner(values) {
    // Determine internalValue from subvalues/subcomponents
    return values.selectedInstance || null
}


onBeforeMount(async () => {
    if (!props.modelValue) return
    // If the modelvalue exists when the component mounts, we should:
    // - fetch that record
    // - find the quad with the record PID as subject and rdf:type as predicate, in order to get class
    // - use the class to set the selected value of the OR select component
    fetchingRecordLoader.value = true
    try {
        // Fetch record metadata to get the type
        const results = await fetchFromService('get-record', props.modelValue, allPrefixes)
        // Find rdf:type quad
        const typeQuads = rdfDS.data.graph.getQuads(
            namedNode(props.modelValue),
            namedNode(RDF.type.value),
            null,
            null
        )
        if (typeQuads.length > 0) {
            const detectedType = typeQuads[0].object.value
            subValues.value.selectedClassIRI = detectedType
            subValues.value.selectedInstance = props.modelValue
        }
    } finally {
        fetchingRecordLoader.value = false
    }
})

onMounted( () => {
    const compClass = toCURIE(props.property_shape[SHACL.class.value], allPrefixes)
    const compClassConfig = componentConfig[compClass]
    templates.pid = compClassConfig.pid_template;
    templates.ttl = getContent(configVarsMain.content, compClassConfig.ttl_template)
})


function onInstanceSelected(instanceValue) {
    emit('update:modelValue', instanceValue)
}

async function onUploadComplete(result) {
    console.log('Upload completed:', result)
    if (result.status == 'ok') {
        const { name, size, hash, annexKey, downloadUrl } = result.fileData;
        // If this distribution was added before, we don't have to continue
        // This prevents duplications.
        if (createdDistributions.has(hash)) return;
        const TTLdata = { name, size, hash, annexKey, downloadUrl }
        TTLdata.pid = fillStringTemplate(templates.pid, {})
        let newTTL = fillStringTemplate(templates.ttl, TTLdata)
        let newQuads = await rdfDS.parseTTLandDedup(newTTL);
        rdfDS.triggerReactivity();
        // Keep track of quads that were added, so that we can delete them if form is cancelled
        createdQuads.value = createdQuads.value.concat(newQuads)
        hasCreatedQuads.value = true;
        // Keep track of distributions that were added
        createdDistributions.add(hash)
        // Finally, set the selected instance to the one that was just created
        subValues.value.selectedInstance = null
        subValues.value.selectedInstance = toIRI(TTLdata.pid, allPrefixes);
        triggerListGenAndItemSelect.value = true;
    }
    if (result.error) {
        console.error(result.error);
        return;
    }
}

onBeforeUnmount( () => {
    // We have different tasks here, based on whether the form was cancelled or saved
    // If cancelled, we need to check if any quads were added to the store already
    // based on the upload functionality. If so, we need to remove those.
    // If saved, we need to add the saved nodes to savedNodes and nodesToSubmit.
    if (cancelButtonPressed.value) {
        if (hasCreatedQuads.value) {
            rdfDS.data.graph.removeQuads(createdQuads.value);
        }
    } else {
        for (const q of createdQuads.value) {
            // only consider named node subjects
            if (q.subject.termType !== 'NamedNode') continue;
            if (q.predicate.value == RDF.type.value) {
                let saved_node = {
                    nodeshape_iri: q.object.value,
                    node_iri: q.subject.value
                }
                savedNodes.value.push(saved_node);
                if (!findObjectByKey(nodesToSubmit.value, 'node_iri', saved_node.node_iri)) {
                    nodesToSubmit.value.push(saved_node);
                }
            }
        }
    }
})
</script>


<script>
import { SHACL, SHACLVUE} from '../modules/namespaces';
export const matchingLogic = (shape) => {
    // sh:nodeKind exists
    if (shape.hasOwnProperty(SHACL.nodeKind.value)) {
        // sh:nodeKind == sh:IRI ||
        // sh:nodeKind == sh:BlankNodeOrIRI ||
        return [SHACL.IRI.value, SHACL.BlankNodeOrIRI.value].includes(
            shape[SHACL.nodeKind.value]
        ) && shape[SHACLVUE.gitAnnexUpload.value] == 'true';
    }
    return false;
};
</script>
