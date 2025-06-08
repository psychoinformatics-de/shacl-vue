<template>
    <v-input
        v-model="internalValue"
        :rules="rules"
        ref="fieldRef"
        :id="inputId"
        hide-details="auto"
        style="margin-bottom: 1em"
    >
        <v-text-field
            v-model="subValues.intVal"
            type="number"
            density="compact"
            variant="outlined"
            label="add integer value"
            hide-details="auto"
            @input="onInput"
            ref="inputRef"
        >
        </v-text-field>
    </v-input>
</template>

<script setup>
import { useRules } from '../composables/rules';
import { useRegisterRef } from '../composables/refregister';
import { useBaseInput } from '@/composables/base';
import { ref } from 'vue';

const props = defineProps({
    modelValue: String,
    property_shape: Object,
    node_uid: String,
    node_idx: String,
    triple_uid: String,
    triple_idx: Number,
});
const inputRef = ref(null);
const { rules } = useRules(props.property_shape);
rules.value.push((value) => {
    const num = Number(value);
    if (value === '' || value === null || value === undefined) return true;
    if (Number.isInteger(num) && num >= 0) return true;
    return 'Value should be a non-negative integer';
});
const inputId = `input-${Date.now()}`;
const { fieldRef } = useRegisterRef(inputId, props);
const emit = defineEmits(['update:modelValue']);
const { subValues, internalValue } = useBaseInput(
    props,
    emit,
    valueParser,
    valueCombiner
);

function valueParser(value) {
    // Parsing internalValue into ref values for separate subcomponent(s)
    return {
        intVal: value,
    };
}

function valueCombiner(values) {
    // Determine internalValue from subvalues/subcomponents
    return values.intVal;
}

function onInput(event) {
    if (internalValue.value === '') {
        event.target.value = '';
    }
}
</script>

<script>
import { SHACL, XSD } from '../modules/namespaces';
export const matchingLogic = (shape) => {
    // sh:nodeKind exists
    if (shape.hasOwnProperty(SHACL.nodeKind.value)) {
        // sh:nodeKind == sh:Literal
        if (shape[SHACL.nodeKind.value] == SHACL.Literal.value) {
            // sh:datatype exists
            if (shape.hasOwnProperty(SHACL.datatype.value)) {
                // sh:datatype == xsd:nonNegativeInteger
                if (
                    shape[SHACL.datatype.value] == XSD.nonNegativeInteger.value
                ) {
                    return true;
                }
                return false;
            }
        }
    }
    // sh:nodeKind does not exist BUT sh:datatype exists
    if (shape.hasOwnProperty(SHACL.datatype.value)) {
        // sh:datatype == xsd:nonNegativeInteger
        if (shape[SHACL.datatype.value] == XSD.nonNegativeInteger.value) {
            return true;
        }
        return false;
    }
    return false;
};
</script>
