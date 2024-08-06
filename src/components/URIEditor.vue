<template>
    <v-row justify="start" no-gutters>
        <v-col cols="4">
            <v-select
                label="Prefix"
                v-model="triple_prefix"
                :items="prefixOptions"
                density="compact"
                variant="outlined"
                ></v-select>
        </v-col>
        <v-col>
            <v-text-field
                v-model="triple_property"
                density="compact"
                variant="outlined"
                type="url"
                label="(URI editor)"
                validate-on="lazy input"
                :rules="rules"
            >
            </v-text-field>
            
        </v-col>
    </v-row>
</template>

<script setup>
    import { inject, computed, reactive, ref, watch} from 'vue'
    import { useRules } from '../composables/rules'
    import { toCURIE } from '../modules/utils';

    const props = defineProps({
        property_shape: Object,
        node_uid: String,
        triple_uid: String,
        triple_idx: Number
    })
    const formData = inject('formData');
    const { rules } = useRules(props.property_shape)
    const graphPrefixes = inject('graphPrefixes');
    const shapePrefixes = inject('shapePrefixes');
    const classPrefixes = inject('classPrefixes');
    const allPrefixes = {...shapePrefixes, ...graphPrefixes, ...classPrefixes};
    const selectedPrefix = ref('')
    const enteredValue = ref('')

    const prefixOptions = computed(() => {
        var prefixes = []
        for (const [k, v] of Object.entries(allPrefixes)) {
            prefixes.push(
                {
                    title: k,
                    value: k,
                    props: { subtitle: v},
                }
            )
        }
        return prefixes
    })

    const triple_components = computed(() => {
        var triple_obj = formData[props.node_uid].at(-1)[props.triple_uid][props.triple_idx]
        return toCURIE(triple_obj, allPrefixes, "parts")
    })

    watch(triple_components, (newValue) => {
        console.log(`newval: ${newValue}`)
        selectedPrefix.value = newValue ? newValue.prefix : '';
        enteredValue.value = newValue ? newValue.property : '';
    }, { immediate: true });

    const triple_prefix = computed({
      get() {
        return selectedPrefix.value;
      },
      set(value) {
        selectedPrefix.value = value;
        updateFormData();
      }
    });

    const triple_property = computed({
      get() {
        return enteredValue.value;
      },
      set(value) {
        enteredValue.value = value;
        updateFormData();
      }
    });

    const updateFormData = () => {
        formData[props.node_uid].at(-1)[props.triple_uid][props.triple_idx] = `${allPrefixes[selectedPrefix.value]}${enteredValue.value}`;
    };

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
                    // sh:datatype == xsd:anyURI
                    return shape[SHACL.datatype.value] == XSD.anyURI.value
                }
            }
        }
        return false
    };
</script>