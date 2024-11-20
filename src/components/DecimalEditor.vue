<template>
    <v-input
        v-model="internalValue"
        :rules="rules"
        ref="fieldRef"
        :id="inputId"
        hide-details="auto"
        style="margin-bottom: 1em;"
    >
        <v-text-field
            v-model="subValues.decimal"
            density="compact"
            variant="outlined"
            label="add decimal value"
            hide-details="auto"
        >
        </v-text-field>
    </v-input>
</template>

<script setup>
    import { useRules } from '../composables/rules'
    import { useRegisterRef } from '../composables/refregister';
    import { useBaseInput } from '@/composables/base';

    const props = defineProps({
        modelValue: String,
        property_shape: Object,
        node_uid: String,
        node_idx: String,
        triple_uid: String,
        triple_idx: Number
    })
    const { rules } = useRules(props.property_shape)
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
            decimal: value,
        }
    }

    function valueCombiner(values) {
        // Determing internalValue from subvalues/subcomponents
        return values.decimal
    }

</script>

<script>
    import { SHACL, XSD } from '../modules/namespaces'
    export const matchingLogic = (shape) => {
        // sh:nodeKind exists
        if ( shape.hasOwnProperty(SHACL.nodeKind.value) ) {
            // sh:nodeKind == sh:Literal
            if ( shape[SHACL.nodeKind.value] == SHACL.Literal.value ) {
                // sh:datatype exists
                if ( shape.hasOwnProperty(SHACL.datatype.value) ) {
                    // sh:datatype == xsd:decimal
                    return shape[SHACL.datatype.value] == XSD.decimal.value
                }
            }
        }
        return false
    };
</script>