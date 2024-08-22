<template>
    <v-dialog max-width="500">
        <template v-slot:activator="{ props: activatorProps }">
            <v-input
                v-model="internalValue"
                :rules="rules"
                ref="fieldRef"
                :id="inputId"
            >
                <v-btn
                    v-bind="activatorProps"
                    :text="internalValue ? internalValue : 'Select a date'"
                ></v-btn>
            </v-input>
        </template>

        <template v-slot:default="{ isActive }">
            <v-card title="Date">
                <v-date-picker 
                    show-adjacent-months
                    v-model="subValues.picked_date"
                    validate-on="lazy input"
                ></v-date-picker>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text="OK" @click="isActive.value = false"></v-btn>
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>
    
</template>

<script setup>
    import {inject, computed} from 'vue'
    import { useRules } from '../composables/rules'
    import { useRegisterRef } from '../composables/refregister';
    import { useBaseInput } from '@/composables/base';

    const props = defineProps({
        modelValue: String,
        property_shape: Object,
        node_uid: String,
        triple_uid: String
    })
    const formData = inject('formData');
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
        return {picked_date: value}
    }

    function valueCombiner(values) {
        if (values.picked_date) return values.picked_date.toISOString().split('T')[0]
        return null
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
                    // sh:datatype == xsd:dateTime ||
                    // sh:datatype == "https://www.w3.org/TR/NOTE-datetime"
                    return shape[SHACL.datatype.value] == XSD.dateTime.value ||
                        shape[SHACL.datatype.value] == "https://www.w3.org/TR/NOTE-datetime"
                }
            }
        }
        return false
    };
</script>