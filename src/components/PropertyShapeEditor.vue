<template>
    <v-row align="start" no-gutters>
        <v-col cols="3">
            <span>{{ nameOrCURIE }}<span v-if="isRequired" style="color: red;"> *</span>:
                <v-tooltip activator="parent" location="right" max-width="400px" max-height="400px">
                    {{ props.property_shape[SHACL.description.value] }}
                </v-tooltip>
            </span>
        </v-col>
        <v-col>

            <v-row no-gutters v-for="(triple, triple_idx) in formData[props.node_uid].at(-1)[my_uid]" :key="triple_idx">
                <v-col>
                    <keep-alive>
                        <component
                            :is="matchedComponent"
                            :property_shape="property_shape"
                            :node_uid="props.node_uid"
                            :triple_uid="my_uid"
                            :triple_idx="triple_idx"
                            >
                        </component>
                    </keep-alive>
                </v-col>
                <v-col>
                        &nbsp;
                        <!-- Remove button -->
                        <v-btn v-if="allowRemoveTriple"
                            rounded="0"
                            elevation="1"
                            icon="mdi-delete-outline"
                            @click="remove_triple(props.node_uid, my_uid, triple_idx)"
                            density="comfortable"
                        ></v-btn>
                        &nbsp;
                        <!-- Add button -->
                        <v-btn v-if="allowAddTriple"
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
    import { toCURIE } from '../modules/utils';
    
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
        // allowMultiple.value = setAllowMultiple(props.property_shape);
    })

    onBeforeMount(() => {
        console.log("PropertyShapeEditor is about to be mounted")
        my_uid.value = props.property_shape[SHACL.path.value]
        add_empty_triple(props.node_uid, my_uid.value)
    })

    onBeforeUpdate(() => {
        console.log(`PropertyShapeEditor is about to be updated: ${my_uid.value}`)
    })

    // ------------------- //
    // Computed properties //
    // ------------------- //

    const nameOrCURIE = computed(() => {
        if (props.property_shape.hasOwnProperty(SHACL.name.value)) {
            return props.property_shape[SHACL.name.value]
        } else {
            return toCURIE(props.property_shape[SHACL.path.value], shapePrefixes)   
        }
    });

    const matchedComponent = computed(() => {
        for (const key in editorMatchers) {
            if (editorMatchers[key].match(props.property_shape)) {
                return editorMatchers[key].component;
            }
        }
        return defaultEditor;
    });

    const allowAddTriple = computed(() => {
        // if there is no maxCount, allowMultiple = true
        // if the maxCount is 1, allowMultiple = false
        // if the maxCount > 1, allowMultiple = true
        console.log(`Property: ${props.property_shape[SHACL.path]}`)
        if (props.property_shape.hasOwnProperty(SHACL.maxCount)) {
            console.log(`Max count: ${props.property_shape[SHACL.maxCount]}`)
            console.log(`Triple count: ${formData[props.node_uid].at(-1)[my_uid.value].length}`)
            if (props.property_shape[SHACL.maxCount] == 1) {
                return false
            } else if (props.property_shape[SHACL.maxCount] > 1 && formData[props.node_uid].at(-1)[my_uid.value].length < props.property_shape[SHACL.maxCount]) {
                return true
            } else {
                return false   
            }
        } else {
            console.log("No max count, add button should be shown")
            return true
        }
    })

    const allowRemoveTriple = computed(() => {
        if (formData[props.node_uid].at(-1)[my_uid.value].length > 1) {
            return true
        }
        return false
    })

    // --------- //
    // Functions //
    // --------- //


</script>