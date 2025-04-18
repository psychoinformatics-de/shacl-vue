<template>
    <v-row align="start" no-gutters v-if="formData.content[localNodeUid] && show_field">
        <v-col cols="4">
            <span>{{ nameOrCURIE(localPropertyShape, shapesDS.data.prefixes, true) }}<span v-if="isRequired" style="color: red;"> *</span>:
                <v-tooltip activator="parent" location="right" max-width="400px" max-height="400px">
                    <p v-html="addCodeTagsToText(localPropertyShape[SHACL.description.value])"></p>
                </v-tooltip>
            </span>
        </v-col>
        <v-col cols="8">

            <span v-if="formData.content[localNodeUid][localNodeIdx]">
                <v-row no-gutters v-for="(triple, triple_idx) in formData.content[localNodeUid][localNodeIdx][my_uid]" :key="localNodeUid + '-' + my_uid + '-' + triple_idx">
                    <v-col cols="9">
                        <Suspense>
                            <component
                                v-model="formData.content[localNodeUid][localNodeIdx][my_uid][triple_idx]"
                                :is="matchedComponent"
                                :property_shape="localPropertyShape"
                                :node_uid="localNodeUid"
                                :node_idx="localNodeIdx"
                                :triple_uid="my_uid"
                                :triple_idx="triple_idx"
                                >
                            </component>
                        </Suspense>
                    </v-col>
                    <v-col>
                            &nbsp;
                            <!-- Remove button -->
                            <v-btn v-if="allowRemoveTriple(triple_idx)"
                                rounded="0"
                                elevation="1"
                                icon="mdi-delete-outline"
                                @click="formData.removeObject(localNodeUid, localNodeIdx, my_uid, triple_idx)"
                                density="comfortable"
                            ></v-btn>
                            &nbsp;
                            <!-- Add button -->
                            <v-btn v-if="allowAddTriple(triple_idx)"
                                rounded="0"
                                elevation="1"
                                icon="mdi-plus-circle-outline"
                                @click="formData.addObject(localNodeUid, localNodeIdx, my_uid)"
                                density="comfortable"
                            ></v-btn>
                    </v-col>
                </v-row>
            </span>
        </v-col>
    </v-row>
</template>

<script setup>
    import { ref, onMounted, onBeforeMount, computed, inject, onBeforeUpdate, onBeforeUnmount, watch, toRaw} from 'vue'
    import { SHACL } from '../modules/namespaces'
    import { useRules } from '../composables/rules'
    import { nameOrCURIE, addCodeTagsToText} from '../modules/utils';
    
    // ----- //
    // Props //
    // ----- //
    
    const props = defineProps({
        property_shape: Object,
        node_uid: String,
        node_idx: String,
    })

    // ---- //
    // Data //
    // ---- //

    const my_uid = ref('');
    

    const localPropertyShape = ref(props.property_shape)
    const localNodeUid = ref(props.node_uid)
    const localNodeIdx = ref(props.node_idx)
    const editorMatchers = inject('editorMatchers');
    const defaultEditor = inject('defaultEditor');
    const formData = inject('formData');
    const shapesDS = inject('shapesDS');
    const show_all_fields = inject('show_all_fields');
    const { isRequired } = useRules(localPropertyShape.value)

    // ----------------- //
    // Lifecycle methods //
    // ----------------- //

    onMounted(() => {
        if (formData.content[localNodeUid.value][localNodeIdx.value][my_uid.value]) {
            return;
        }
        formData.addPredicate(localNodeUid.value, localNodeIdx.value, my_uid.value)
    })


    onBeforeMount(() => {
        my_uid.value = localPropertyShape.value[SHACL.path.value]
    })

    onBeforeUnmount(() => {
    })
    
    // ------------------- //
    // Computed properties //
    // ------------------- //

    const matchedComponent = computed(() => {
        for (const key in editorMatchers) {
            if (editorMatchers[key].match(localPropertyShape.value)) {
                return editorMatchers[key].component;
            }
        }
        return defaultEditor;
    });

    const show_field = computed(() => {
        // Determine whether to show this field based on some explicit
        // and derived logic:
        // - show if the switch to "show_all_fields" is true
        // - show if the switch to "show_all_fields" is false, but the field is required
        // - show if the switch to "show_all_fields" is false, but the field has a sh:name attribute in the shape
        //   (which means it was likely annotated and therefore likely important)
        if (show_all_fields.value) {
            return true
        } else {
            if (isRequired.value) {
                return true
            }
            if (localPropertyShape.value.hasOwnProperty(SHACL.name.value)) {
                return true
            }
            return false
        }
    });


    // --------- //
    // Functions //
    // --------- //

    function allowAddTriple(idx) {
        // if there is no maxCount, allowMultiple = true
        // if the maxCount is 1, allowMultiple = false
        // if the maxCount > 1, allowMultiple = true
        if (localPropertyShape.value.hasOwnProperty(SHACL.maxCount)) {
            if (localPropertyShape.value[SHACL.maxCount] == 1) {
                return false
            } else if (localPropertyShape.value[SHACL.maxCount] > 1
                        && formData.content[localNodeUid.value][localNodeIdx.value][my_uid.value].length < localPropertyShape.value[SHACL.maxCount]
                        && formData.content[localNodeUid.value][localNodeIdx.value][my_uid.value].length == idx + 1
            ) {
                return true
            } else {
                return false   
            }
        } else {
            if (formData.content[localNodeUid.value][localNodeIdx.value][my_uid.value].length == idx + 1) {
                return true
            } else {
                return false
            }
        }
    }

    function allowRemoveTriple(idx) {
        if (formData.content[localNodeUid.value][localNodeIdx.value][my_uid.value].length > 1) {
            return true
        }
        return false
    }


</script>


<style>
    .code-style {
        color: red;
        background-color: #f5f5f5;
        padding: 0.1em 0.2em;
        font-family: monospace;
        border-radius: 4px;
        border: 1px solid #ddd;
    }
</style>