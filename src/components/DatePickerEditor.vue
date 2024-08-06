<template>
    <v-dialog max-width="500">
        <template v-slot:activator="{ props: activatorProps }">
            <v-btn
                v-bind="activatorProps"
                :text="formData[props.node_uid].at(-1)[props.triple_uid].at(-1) ? formData[props.node_uid].at(-1)[props.triple_uid].at(-1).toISOString().split('T')[0] : 'Select a date'"
            ></v-btn>
        </template>

        <template v-slot:default="{ isActive }">
            <v-card title="Date">
                <v-date-picker 
                    show-adjacent-months
                    v-model="triple_object"
                    validate-on="lazy input"
                    :rules="rules"
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

    const props = defineProps({
        property_shape: Object,
        node_uid: String,
        triple_uid: String
    })
    const formData = inject('formData');
    const { rules } = useRules(props.property_shape)

    const triple_object = computed({
        get() {
            return formData[props.node_uid].at(-1)[props.triple_uid].at(-1);
        },
        set(value) {
            const node_idx = formData[props.node_uid].length - 1
            const triple_idx = formData[props.node_uid][node_idx][props.triple_uid].length - 1
            formData[props.node_uid][node_idx][props.triple_uid][triple_idx] = value;
        }
    });
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
                    // sh:datatype == xsd:date
                    return shape[SHACL.datatype.value] == XSD.date.value
                }
            }
        }
        return false
    };
</script>