<template>
    <v-input
        v-model="internalValue"
        :rules="rules"
        ref="fieldRef"
        :id="inputId"
        hide-details="auto"
    >
        <v-col>
            <v-row style="margin-bottom: -2em;">
                <v-select
                    v-model="subValues.selectedClassIRI"
                    :items="orList"
                    density="compact"
                    variant="outlined"
                    label="select type"
                    item-value="value"
                    item-title="title"
                    ref="selector"
                    clearable
                    @update:modelValue="selectORelement"
                />
            </v-row>
            <v-row v-if="orElementSelected">
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
            </v-row>
        </v-col>
    </v-input>
</template>

<script setup>
import { computed, inject, ref, toRaw, onBeforeMount } from 'vue';
import { useRules } from '../composables/rules';
import { useRegisterRef } from '../composables/refregister';
import { useBaseInput } from '@/composables/base';
import { toCURIE } from 'shacl-tulip';
import { RDF } from '@/modules/namespaces';
import { DataFactory } from 'n3';
import InstancesSelectEditor from '@/components/InstancesSelectEditor.vue'
const { namedNode } = DataFactory;

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
const rdfDS = inject('rdfDS');
const shapesDS = inject('shapesDS');
const allPrefixes = inject('allPrefixes');
const fetchingRecordLoader = ref(false);
const fetchFromService = inject('fetchFromService');
const selector = ref(null);
const orElementSelected = ref(false);
const computedPropertyShape = ref({...props.property_shape,});

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
            selectORelement(detectedType, true)
        }
    } finally {
        fetchingRecordLoader.value = false
    }
})

function onInstanceSelected(instanceValue) {
    emit('update:modelValue', instanceValue)
}

const orList = computed(() => {
    var items = [];
    const or_array = props.property_shape[SHACL.or.value];
    for (var el of or_array) {
        items.push({
            title: toCURIE(toRaw(el)[SHACL.class.value], shapesDS.data.prefixes, "parts").property,
            value: toRaw(el)[SHACL.class.value],
        });
    }
    return items;
});


function selectORelement(el, fromMount = false) {
    // set whole subValues object to ensure reactivity
    subValues.value = {
        selectedClassIRI: el || null,
        // if called fromMount we preserve the instance, otherwise reset
        selectedInstance: fromMount ? subValues.value?.selectedInstance || null : null,
    };
    // replace the computedPropertyShape.value fully so the child sees a new object
    computedPropertyShape.value = {
        ...props.property_shape,
        [SHACL.class.value]: el,
        [SHACL.nodeKind.value]: SHACL.IRI.value,
    };
    delete computedPropertyShape.value[SHACL.or.value]
    orElementSelected.value = !!el;
}

</script>


<script>
import { SHACL } from '../modules/namespaces';
export const matchingLogic = (shape) => {
    // sh:or exists and all elements in array has sh:class key
    if (
        shape.hasOwnProperty(SHACL.or.value) &&
        Array.isArray(shape[SHACL.or.value]) &&
        shape[SHACL.or.value].every(obj => obj.hasOwnProperty(SHACL.class.value))
    ) {
        return true;
    }
    return false;
};
</script>
