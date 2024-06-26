<template>
    <v-row align="start" no-gutters>
        <v-col cols="3">
            <span>{{ nameOrCURIE }}<span v-if="isRequired" style="color: red;">*</span>:
                <v-tooltip activator="parent" location="right" max-width="400px" max-height="400px">
                    {{ props.property_shape[SHACL.description.value] }}
                </v-tooltip>
            </span>
        </v-col>
        <v-col cols="6">
            <span v-if="isTripleAdded">
                <keep-alive>
                    <component
                        :is="matchedComponent"
                        :property_shape="property_shape"
                        :node_uid="props.node_uid"
                        :triple_uid="my_uid"
                        >
                    </component>
                </keep-alive>
            </span>
        </v-col>
        <v-col></v-col>
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
        node_uid: String,
    })

    // ---- //
    // Data //
    // ---- //

    const my_uid = ref('');
    const add_triple = inject('add_triple');
    const shapePrefixes = inject('shapePrefixes');
    const editorMatchers = inject('editorMatchers');
    const defaultEditor = inject('defaultEditor');
    const isTripleAdded = ref(false);
    const { isRequired } = useRules(props.property_shape)


    // ----------------- //
    // Lifecycle methods //
    // ----------------- //

    onMounted(() => {
    })

    onBeforeMount(() => {
        console.log("PropertyShapeEditor is about to mounted")
        my_uid.value = props.node_uid + '--' + props.property_shape[SHACL.path.value]
        add_triple(props.node_uid, my_uid.value)
        isTripleAdded.value = true;
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


</script>