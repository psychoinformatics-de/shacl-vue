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
                    :key="subValues.selectedClassIRI || 'none'"
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
    <v-dialog
        v-model="showTokenDialog"
        width="auto"
    >
        <v-card
            max-width="400"
            prepend-icon="mdi-update"
            text="Your application will relaunch automatically after the update is complete."
            title="Update in progress"
        >
            <template v-slot:actions>
            <v-btn
                class="ms-auto"
                text="Ok"
                @click="showTokenDialog = false"
            ></v-btn>
            </template>
        </v-card>

    </v-dialog>
</template>

<script setup>
import { computed, inject, ref, toRaw, onBeforeMount } from 'vue';
import { useRules } from '../composables/rules';
import { useRegisterRef } from '../composables/refregister';
import { useBaseInput } from '@/composables/base';
import { toCURIE, toIRI } from 'shacl-tulip';
import { RDF, XSD} from '@/modules/namespaces';
import { DataFactory } from 'n3';
import InstancesSelectEditor from '@/components/InstancesSelectEditor.vue'
import GitAnnexUploader from '@/components/GitAnnexUploader.vue'
const { namedNode, blankNode, literal, quad} = DataFactory;

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
const rdfDS = inject('rdfDS');
const allPrefixes = inject('allPrefixes');
const fetchingRecordLoader = ref(false);
const fetchFromService = inject('fetchFromService');
const computedPropertyShape = ref({...props.property_shape,});
const showTokenDialog = ref(false);

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


function onInstanceSelected(instanceValue) {
    emit('update:modelValue', instanceValue)
}

function onUploadComplete(result) {
    console.log('Upload completed:', result)
    if (result.error) {
        console.error(error);
        return;
    }
    if (result.status == 'ok') {
        const id_prefix = toIRI(uploadConfig.id_prefix, allPrefixes)
        const uris = {
            'Distribution': toIRI('trr379ra:TRR379Distribution', allPrefixes),
            'preflabel': toIRI('skos:prefLabel', allPrefixes),
            'media_type': toIRI('dlfilesmx:media_type', allPrefixes),
            'distribution_of': toIRI('dlfilesmx:distribution_of', allPrefixes),
            'pid': toIRI('dlthings:pid', allPrefixes),
            'byte_size': toIRI('dlfilesmx:byte_size', allPrefixes),
            'Checksum': toIRI('dlidentifiers:Checksum', allPrefixes),
            'checksums': toIRI('dlflatfiles:checksums', allPrefixes),
            'notation': toIRI('dlidentifiers:notation', allPrefixes),
            'creator': toIRI('dlidentifiers:creator', allPrefixes),
            'sha256': toIRI('spdx:checksumAlgorithm_sha256', allPrefixes),
            'Statement': toIRI('dlthings:Statement', allPrefixes),
            'object': toIRI('rdf:object', allPrefixes),
            'predicate': toIRI('rdf:predicate', allPrefixes),
            'characterized_by': toIRI('dlthings:characterized_by', allPrefixes),
            'downloadUrl': toIRI('dcat:downloadUrl', allPrefixes),
        }

        const myQuads = [];

        // Start with checksum
        const checksumSub = blankNode();
        // Checksum type quad
        myQuads.push(quad(checksumSub, namedNode(RDF.type.value), namedNode(uris['Checksum'])))
        // creator and notation quads
        const sha256Node = literal(uris['sha256'], namedNode(XSD.anyURI.value))
        myQuads.push(quad(checksumSub, namedNode(uris['creator']), sha256Node))
        const sha256ValueNode = literal(result.fileData.hash, namedNode(XSD.string.value))
        myQuads.push(quad(checksumSub, namedNode(uris['notation']), sha256ValueNode))
        
        // download url as Statement with predicate dcat:downloadUrl
        const statementSub = blankNode();
        // Statement type quad
        myQuads.push(quad(statementSub, namedNode(RDF.type.value), namedNode(uris['Statement'])))
        // predicate and object quads
        myQuads.push(quad(statementSub, namedNode(uris['predicate']), namedNode(uris['downloadUrl'])))
        myQuads.push(quad(statementSub, namedNode(uris['object']), namedNode(result.fileData.download)))

        // Get record PID, add type quad
        let record_pid = id_prefix + result.fileData.key
        const recordSub = namedNode(record_pid);
        myQuads.push(quad(recordSub, namedNode(RDF.type.value), namedNode(uris['Distribution'])))
        // checksum quad
        myQuads.push(quad(recordSub, namedNode(uris['checksums']), checksumSub))
        // download url quad
        myQuads.push(quad(recordSub, namedNode(uris['characterized_by']), statementSub))
        // byte size quad
        const byteSizeNode = literal(result.fileData.size, namedNode(XSD.nonNegativeInteger.value))
        myQuads.push(quad(recordSub, namedNode(uris['byte_size']), byteSizeNode))
        // filename as preflabel quad
        const labelNode = literal(result.fileData.name, namedNode(XSD.string.value))
        myQuads.push(quad(recordSub, namedNode(uris['preflabel']), labelNode))
        for (const q of myQuads) {
            rdfDS.addQuad(q)
        }
        subValues.value.selectedInstance = record_pid;
    }
}

</script>


<script>
import { SHACL, SHACLVUE} from '../modules/namespaces';
import GitAnnexUploader from '@/components/GitAnnexUploader.vue';
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
