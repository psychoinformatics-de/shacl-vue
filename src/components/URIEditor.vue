<template>
    <v-input
        v-model="internalValue"
        :rules="rules"
        ref="fieldRef"
        :id="inputId"
        hide-details="auto"
        style="margin-bottom: 1em;"
    >
        <v-row justify="start" no-gutters>
            <v-col cols="9">
                <span v-if="!enterCURIE">
                    <v-text-field
                        v-model="subValues.uri_text"
                        label="add URI text"
                        density="compact"
                        variant="outlined"
                        hide-details="auto"
                    ></v-text-field>
                </span>
                <span v-else>
                    <v-row justify="start" no-gutters>
                        <v-col cols="5">
                            <v-select
                                label="prefix"
                                v-model="subValues.uri_prefix"
                                :items="prefixOptions"
                                density="compact"
                                variant="outlined"
                                style="margin-bottom: 0; padding-bottom: 0"
                                hide-details="auto"
                                ></v-select>
                        </v-col>
                        <v-col cols="7">
                            <v-text-field
                                v-model="subValues.uri_path"
                                density="compact"
                                style="margin-bottom: 0; padding-bottom: 0"
                                variant="outlined"
                                label="add text"
                                validate-on="lazy input"
                                hide-details="auto"
                            >
                            </v-text-field>
                        </v-col>
                    </v-row>
                </span>
            </v-col>
            <v-col>
                <v-checkbox v-model="enterCURIE" density="compact" label="CURIE" hide-details="true" style="margin-top:0; margin-left: 0.5em; padding-top:0;"></v-checkbox>
            </v-col>
        </v-row>
    </v-input>
</template>

<script setup>
    import { inject, computed, ref, watch, onMounted} from 'vue'
    import { useRules } from '../composables/rules'
    import { toCURIE, isObject } from '../modules/utils';
    import { useRegisterRef } from '../composables/refregister';
    import { useBaseInput } from '@/composables/base';

    const props = defineProps({
        modelValue: String,
        property_shape: Object,
        node_uid: String,
        triple_uid: String,
        triple_idx: Number
    })
    const formData = inject('formData');
    const { rules } = useRules(props.property_shape)
    rules.value.push(
      value => {
        const uriRegex = /^([a-zA-Z][a-zA-Z0-9+-.]*):(?:\/\/((?:[a-zA-Z0-9\-._~%!$&'()*+,;=]+@)?(?:\[(?:[A-Fa-f0-9:.]+)\]|(?:[a-zA-Z0-9\-._~%]+))(?:\:[0-9]+)?)?)?((?:\/[a-zA-Z0-9\-._~%!$&'()*+,;=:@]*)*)(?:\?[a-zA-Z0-9\-._~%!$&'()*+,;=:@/?]*)?(?:\#[a-zA-Z0-9\-._~%!$&'()*+,;=:@/?]*)?$/;
        if (!value) return true
        if (uriRegex.test(value)) return true
        return 'This is not a valid URI of type XSD:anyURI'
      }
    )
    const inputId = `input-${Date.now()}`;
    const { fieldRef } = useRegisterRef(inputId, props);
    
    const allPrefixes = inject('allPrefixes');
    const enterCURIE = ref(true)

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

    // --------- //
    // Functions //
    // --------- //
    

    function valueParser(value) {
        // Parsing internalValue into ref values for separate subcomponent(s)

        // internalValue is a URI
        // - if internalValue is null, set all to null or empty strings
        // - for the text field: set directly from internalValue
        // - for the curie:
        //   - call toCurie in order to split it up into prefix and path
        //   - if toCurie not possible (i.e. unknown prefix), don't set the prefix nor path (or set to null or empty string?)
        // whether the switch is set to uri or curie is not important here
        var URItext, URIprefix, URIpath
        if (!value) {
            URItext = '';
            URIprefix = null;
            URIpath = '';
        } else {
            URItext = value
            var curieparts = toCURIE(value, allPrefixes, "parts")
            if ( isObject(curieparts)) {
                URIprefix = curieparts.prefix;
                URIpath = curieparts.property;
            } else {
                URIprefix = null;
                URIpath = '';
            }
        }
        return {
            uri_text: URItext,
            uri_prefix: URIprefix,
            uri_path: URIpath
        }
    }

    function valueCombiner(values) {
        // Determine internalValue (a URI) from subvalues/subcomponents

        // if the switch is set to URI:
        // - return subValues.uri_text
        // if switch set to CURIE (default):
        // - if prefix not selected
        if (!enterCURIE.value) {
            return values.uri_text ?? ''
        } else {
            if (values.uri_prefix !== null) {
                return `${allPrefixes[values.uri_prefix] ?? ''}${values.uri_path ?? ''}`
            } else {
                return `${values.uri_path ?? ''}`
            }
        }
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
                    // sh:datatype == xsd:anyURI
                    return shape[SHACL.datatype.value] == XSD.anyURI.value
                }
            }
        }
        // if sh:nodeKind does not exist, but datatype still exists
        if ( shape.hasOwnProperty(SHACL.datatype.value) ) {
            // sh:datatype == xsd:anyURI
            return shape[SHACL.datatype.value] == XSD.anyURI.value
        }
        return false
    };
</script>