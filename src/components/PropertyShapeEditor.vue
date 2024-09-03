<template>
    <v-row align="start" no-gutters>
        <v-col cols="4">
            <span>{{ nameOrCURIE(props.property_shape, shapePrefixes, SHACL) }}<span v-if="isRequired" style="color: red;"> *</span>:
                <v-tooltip activator="parent" location="right" max-width="400px" max-height="400px">
                    {{ props.property_shape[SHACL.description.value] }}
                </v-tooltip>
            </span>
        </v-col>
        <v-col cols="8">

            <v-row no-gutters v-for="(triple, triple_idx) in formData[props.node_uid].at(-1)[my_uid]" :key="props.node_uid + '-' + my_uid + '-' + triple_idx">
                <v-col cols="9">
                    <component
                        v-model="formData[props.node_uid].at(-1)[my_uid][triple_idx]"
                        :is="matchedComponent"
                        :property_shape="props.property_shape"
                        :node_uid="props.node_uid"
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
                            @click="remove_triple(props.node_uid, my_uid, triple_idx)"
                            density="comfortable"
                        ></v-btn>
                        &nbsp;
                        <!-- Add button -->
                        <v-btn v-if="allowAddTriple(triple_idx)"
                            rounded="0"
                            elevation="1"
                            icon="mdi-plus-circle-outline"
                            @click="add_empty_triple(props.node_uid, my_uid)"
                            density="comfortable"
                        ></v-btn>
                </v-col>
            </v-row>
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
        node_uid: String
    })

    // ---- //
    // Data //
    // ---- //

    const my_uid = ref('');
    const add_empty_triple = inject('add_empty_triple');
    const remove_triple = inject('remove_triple');
    const shapePrefixes = inject('shapePrefixes');
    const editorMatchers = inject('editorMatchers');
    const defaultEditor = inject('defaultEditor');
    const formData = inject('formData');
    const { isRequired } = useRules(props.property_shape)

    // ----------------- //
    // Lifecycle methods //
    // ----------------- //

    onMounted(() => {
        add_empty_triple(props.node_uid, my_uid.value)
    })

    onBeforeMount(() => {
        console.log("PropertyShapeEditor is about to be mounted")
        my_uid.value = props.property_shape[SHACL.path.value]
    })

    onBeforeUpdate(() => {
        console.log(`PropertyShapeEditor is about to be updated: ${my_uid.value}`)
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
                        && formData[props.node_uid].at(-1)[my_uid.value].length < props.property_shape[SHACL.maxCount]
                        && formData[props.node_uid].at(-1)[my_uid.value].length == idx + 1
            ) {
                return true
            } else {
                return false   
            }
        } else {
            if (formData[props.node_uid].at(-1)[my_uid.value].length == idx + 1) {
                return true
            } else {
                return false
            }
        }
    }

    function allowRemoveTriple(idx) {
        if (formData[props.node_uid].at(-1)[my_uid.value].length > 1) {
            return true
        }
        return false
    }


</script>