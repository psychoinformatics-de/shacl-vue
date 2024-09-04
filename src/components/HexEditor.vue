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
            v-model="subValues.hex_text"
            density="compact"
            variant="outlined"
            label="add hexadecimal text"
            hide-details="auto"
        >
        </v-text-field>
    </v-input>
</template>

<script setup>
    import { inject, onMounted} from 'vue'
    import { useRules } from '../composables/rules'
    import { useRegisterRef } from '../composables/refregister';
    import { useBaseInput } from '@/composables/base';

    const props = defineProps({
        modelValue: String,
        property_shape: Object,
        node_uid: String,
        triple_uid: String,
        triple_idx: Number
    })
    const { rules } = useRules(props.property_shape)
    const inputId = `input-${Date.now()}`;
    const { fieldRef } = useRegisterRef(inputId, props);
    const allPrefixes = inject('allPrefixes');

    const emit = defineEmits(['update:modelValue']);
    const { subValues, internalValue } = useBaseInput(
        props,
        emit,
        valueParser,
        valueCombiner
    );

    // ----------------- //
    // Lifecycle methods //
    // ----------------- //

    onMounted(() => {
    })


    // ------------------- //
    // Computed properties //
    // ------------------- //

    // --------- //
    // Functions //
    // --------- //
    

    function valueParser(value) {
        // Parsing internalValue into ref values for separate subcomponent(s)
        return {
            hex_text: value,
        }
    }

    function valueCombiner(values) {
        // Determing internalValue from subvalues/subcomponents
        return values.hex_text
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
                    // sh:datatype == xsd:hexBinary
                    return shape[SHACL.datatype.value] == XSD.hexBinary.value
                }
            }
        }
        return false
    };
</script>