<!-- TODO: investigate https://vuetifyjs.com/en/components/inputs/
 to combine below into a single input component -->

 <!-- The v-bind="attrs" and v-on="listeners" directives in the v-input component are used to ensure that any attributes and event listeners passed to the custom URIeditor component from its parent are properly forwarded to the underlying v-input component. -->

<template>
    <v-input>
        <v-row justify="start" no-gutters>
            <v-col cols="9">
                <span v-if="enterURI">
                    <v-text-field
                        label="add URI text"
                        density="compact"
                        variant="outlined"
                    ></v-text-field>
                </span>
                <span v-else>
                    <v-row justify="start" no-gutters>
                        <v-col cols="5">
                            <v-select
                                label="prefix"
                                v-model="triple_prefix"
                                :items="prefixOptions"
                                density="compact"
                                variant="outlined"
                                style="margin-bottom: 0; padding-bottom: 0"
                                ></v-select>
                        </v-col>
                        <v-col cols="7">
                            <v-text-field
                                :ref="props.triple_uid + '-' + props.triple_idx"
                                v-model="triple_property"
                                density="compact"
                                style="margin-bottom: 0; padding-bottom: 0"
                                variant="outlined"
                                type="url"
                                label="add text"
                                validate-on="lazy input"
                                :rules="rules"
                            >
                            </v-text-field>
                        </v-col>
                    </v-row>

                </span>
            </v-col>
            <v-col>
                <v-checkbox v-model="enterURI" density="compact" label="URI" style="margin-top:0; margin-left: 0.5em; padding-top:0"></v-checkbox>
            </v-col>
        </v-row>
    </v-input>
</template>

<script setup>
    import { inject, computed, ref, watch, onMounted} from 'vue'
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
    const allPrefixes = inject('allPrefixes');
    const selectedPrefix = ref('')
    const enteredValue = ref('')
    // const prefixRules = ref([])
    const enterURI = ref(false)

    // ----------------- //
    // Lifecycle methods //
    // ----------------- //

    onMounted(() => {
    })


    // ------------------- //
    // Computed properties //
    // ------------------- //

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
        return prefixes.sort((a, b) => a.title.localeCompare(b.title))
    })

    const triple_components = computed(() => {
        var triple_obj = formData[props.node_uid].at(-1)[props.triple_uid][props.triple_idx]
        return toCURIE(triple_obj, allPrefixes, "parts")
    })

    watch(triple_components, (newValue) => {
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