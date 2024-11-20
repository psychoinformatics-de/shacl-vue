<template>
    <v-row align="start" no-gutters v-if="formData[localNodeUid] && show_field">
        <v-col cols="4">
            <span>{{ nameOrCURIE(props.property_shape, shapePrefixes, SHACL) }}<span v-if="isRequired" style="color: red;"> *</span>:
                <v-tooltip activator="parent" location="right" max-width="400px" max-height="400px">
                    {{ props.property_shape[SHACL.description.value] }}
                </v-tooltip>
            </span>
        </v-col>
        <v-col cols="8">

            <span v-if="formData[localNodeUid][props.node_idx]">
                <v-row no-gutters v-for="(triple, triple_idx) in formData[localNodeUid][props.node_idx][my_uid]" :key="localNodeUid + '-' + my_uid + '-' + triple_idx">
                    <v-col cols="9">
                        <component
                            v-model="formData[localNodeUid][props.node_idx][my_uid][triple_idx]"
                            :is="matchedComponent"
                            :property_shape="props.property_shape"
                            :node_uid="localNodeUid"
                            :node_idx="props.node_idx"
                            :triple_uid="my_uid"
                            :triple_idx="triple_idx"
                            >
                        </component>
                    </v-col>
                    <v-col>
                            &nbsp;
                            <!-- Remove button -->
                            <v-btn v-if="allowRemoveTriple(triple_idx)"
                                rounded="0"
                                elevation="1"
                                icon="mdi-delete-outline"
                                @click="remove_triple(localNodeUid, props.node_idx, my_uid, triple_idx)"
                                density="comfortable"
                            ></v-btn>
                            &nbsp;
                            <!-- Add button -->
                            <v-btn v-if="allowAddTriple(triple_idx)"
                                rounded="0"
                                elevation="1"
                                icon="mdi-plus-circle-outline"
                                @click="add_empty_triple(localNodeUid, props.node_idx, my_uid)"
                                density="comfortable"
                            ></v-btn>
                    </v-col>
                </v-row>
            </span>
        </v-col>
    </v-row>
</template>

<script setup>
    import { ref, onMounted, onBeforeMount, computed, inject, onBeforeUpdate} from 'vue'
    import { SHACL } from '../modules/namespaces'
    import { useRules } from '../composables/rules'
    import { toCURIE, nameOrCURIE } from '../modules/utils';
    
    // ----- //
    // Props //
    // ----- //
    
    const props = defineProps({
        property_shape: Object,
        node_uid: String,
        node_idx: Number,
    })

    // ---- //
    // Data //
    // ---- //

    const my_uid = ref('');
    const localNodeUid = ref(props.node_uid)

    const add_empty_triple = inject('add_empty_triple');
    const editMode = inject('editMode');
    const remove_triple = inject('remove_triple');
    const shapePrefixes = inject('shapePrefixes');
    const editorMatchers = inject('editorMatchers');
    const defaultEditor = inject('defaultEditor');
    const formData = inject('formData');
    const show_all_fields = inject('show_all_fields');
    const { isRequired } = useRules(props.property_shape)

    // ----------------- //
    // Lifecycle methods //
    // ----------------- //

    onMounted(() => {
        if (editMode.graph || editMode.form) {
            // if we're busy editing, and if the triple already has a value,
            // don't add another empty element
            if (formData[localNodeUid.value][props.node_idx][my_uid.value]) return;
        }
        add_empty_triple(localNodeUid.value, props.node_idx, my_uid.value)
    })

    onBeforeMount(() => {
        // console.log("PropertyShapeEditor is about to be mounted. The property shape:")
        // console.log(props.property_shape)
        my_uid.value = props.property_shape[SHACL.path.value]
        // console.log("Form data and props before propertyshapeeditor mounting:")
        // console.log(formData)
        // console.log(props)
        // console.log(`props.node_idx: ${props.node_idx}`)


    })

    onBeforeUpdate(() => {
        // console.log(`PropertyShapeEditor is about to be updated: ${my_uid.value}`)
        // console.log(`props.node_idx: ${props.node_idx}`)
    })

    // ------------------- //
    // Computed properties //
    // ------------------- //

    const matchedComponent = computed(() => {
        for (const key in editorMatchers) {
            if (editorMatchers[key].match(props.property_shape)) {
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
            if (props.property_shape.hasOwnProperty(SHACL.name.value)) {
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
        if (props.property_shape.hasOwnProperty(SHACL.maxCount)) {
            if (props.property_shape[SHACL.maxCount] == 1) {
                return false
            } else if (props.property_shape[SHACL.maxCount] > 1
                        && formData[localNodeUid.value][props.node_idx][my_uid.value].length < props.property_shape[SHACL.maxCount]
                        && formData[localNodeUid.value][props.node_idx][my_uid.value].length == idx + 1
            ) {
                return true
            } else {
                return false   
            }
        } else {
            if (formData[localNodeUid.value][props.node_idx][my_uid.value].length == idx + 1) {
                return true
            } else {
                return false
            }
        }
    }

    function allowRemoveTriple(idx) {
        if (formData[localNodeUid.value][props.node_idx][my_uid.value].length > 1) {
            return true
        }
        return false
    }


</script>