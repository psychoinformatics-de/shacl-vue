<template>
    <span v-if="group_layout == 'tabs'">
        <v-card>
            <v-tabs v-model="tab" bg-color="#C5CAE9" >
                <span v-for="group in orderArrayOfObjects(Object.values(usedPropertyGroups), SHACL.order.value)" >
                    <v-tab :value="group[RDFS.label.value]">{{ group[RDFS.label.value] }}</v-tab>
                </span>
            </v-tabs>
            <v-card-text>
                <v-tabs-window v-model="tab">
                    <span v-for="group in orderArrayOfObjects(Object.values(usedPropertyGroups), SHACL.order.value) ">
                        <v-tabs-window-item v-if="group['own_properties'].length" :value="group[RDFS.label.value]">
                            <h3>{{ group[RDFS.label.value] }}</h3>
                            <p>{{ group[RDFS.comment.value] }}</p>
                            <br>
                            <span v-for="property in orderArrayOfObjects(group['own_properties'], SHACL.order.value)" :key="localShapeIri + '-' + localNodeIdx + '-' + property[SHACL.path.value]">
                                <PropertyShapeEditor :property_shape="property" :node_uid="localShapeIri" :node_idx="localNodeIdx"/>
                            </span>
                            <br>
                        </v-tabs-window-item>
                    </span>
                </v-tabs-window>
            </v-card-text>
        </v-card>
    </span>
    <span v-else>
        <span v-for="group in orderArrayOfObjects([...Object.values(usedPropertyGroups)], SHACL.order.value) ">
            <span v-if="group['own_properties'].length">
                <h3>{{ group[RDFS.label.value] }}</h3>
                <p><em>{{ group[RDFS.comment.value] }}</em></p>
                <br>
                <span v-for="property in orderArrayOfObjects(group['own_properties'], SHACL.order.value)" :key="localShapeIri + '-' + localNodeIdx + '-' + property[SHACL.path.value]">
                    <PropertyShapeEditor :property_shape="property" :node_uid="localShapeIri" :node_idx="localNodeIdx"/>
                </span>
            </span>
            <br>
        </span>
    </span>
</template>


<script setup>
    import { ref, onBeforeUpdate, onBeforeMount, onBeforeUnmount, onMounted, inject, shallowRef} from 'vue'
    import {SHACL, RDF, RDFS, DLTHING} from '../modules/namespaces'
    import { orderArrayOfObjects } from '../modules/utils';

    // ----- //
    // Props //
    // ----- //

    const props = defineProps({
        shape_iri: String,
        node_idx: String,
    })

    // ---- //
    // Data //
    // ---- //

    const localShapeIri = ref(props.shape_iri);
    const localNodeIdx = ref(props.node_idx);
    const config = inject('config');
    const defaultPropertyGroup = config.value.defaultPropertyGroup;
    const propertyGroups = inject('propertyGroups');
    const nodeShapes = inject('nodeShapes')
    const shape_obj = nodeShapes.value[localShapeIri.value]
    const ready = ref(false)
    var tab = ref(null)
    const group_layout = ref('default') // ref('default') or ref('tabs')
    const ignoredProperties = [
        // RDF.type.value,
        // DLTHING.meta_type.value,
    ]
    
    // ----------------- //
    // Lifecycle methods //
    // ----------------- //

    const usedPropertyGroups = shallowRef({});

    onMounted(() => {

        usedPropertyGroups.value = computeUsedPropertyGroups();
        ready.value = true;
        console.log("NodeShapeEditor is MOUNTED")
    })

    onBeforeMount(() => {
        console.log(`NodeShapeEditor is about to be mounted.`)
        if (config.value.hasOwnProperty("group_layout") && config.value.group_layout == "tabs") {
            group_layout.value = "tabs"
        }
    })

    onBeforeUpdate(() => {
        console.log(`the NodeShapeEditor component is about to be updated.`)
    })

    onBeforeUnmount(() => {
        console.log(`NodeShapeEditor is about to be UNMOUNTED.`)
        localShapeIri.value = null
        localNodeIdx.value = null
    });

    // ------------------- //
    // Computed properties //
    // ------------------- //

    

    function computeUsedPropertyGroups() {
        console.log("usedPropertyGroups recomputed");
        // first get a list of all the sh:PropertyGroup instances 
        // that are provided for any property via sh:group
        var group_instances = shape_obj.properties.map(function(shape_prop) {
            return shape_prop[SHACL.group.value];
        });
        // make list unique and remove falsy values
        group_instances = [...new Set(group_instances)].filter( Boolean )
        var used_prop_groups = {}
        for (var group_iri of group_instances) {
            // Here we also deal with the possibility that the property group
            // provided for a property via `sh:group` was not declared as a
            // propertyGroup (with e.g. name, description, order) and is therefore
            // not part of the incoming SHACL, i.e. not in propertyGroups.value
            if (propertyGroups.value[group_iri]) {
                used_prop_groups[group_iri] = propertyGroups.value[group_iri]
            } else {
                used_prop_groups[group_iri] = {}
            }
        }
        // add default property group
        used_prop_groups[defaultPropertyGroup.key] = defaultPropertyGroup.value
        // initialise 'own_properties' array
        for (var group_iri of Object.keys(used_prop_groups)) {
            used_prop_groups[group_iri]["own_properties"] = []
        }
        // add shape properties to correct group
        for (var p of shape_obj.properties) {
            if (p.hasOwnProperty(SHACL.group.value)) {
                used_prop_groups[p[SHACL.group.value]]["own_properties"].push(p)
            } else {
                if (ignoredProperties.indexOf(p[SHACL.path]) < 0) {
                    used_prop_groups[defaultPropertyGroup.key]["own_properties"].push(p)
                } else {
                    console.log(`Not adding ignored property default group:`)
                    console.log(p)
                }
            }
        }
        return used_prop_groups;
    }

    // --------- //
    // Functions //
    // --------- //

    // function orderGroups() {
    //     // first get a list of all the sh:PropertyGroup instances 
    //     // that are provided for any property via sh:group
    //     var group_instances = shape_obj.properties.map(function(shape_prop) {
    //         return shape_prop[SHACL.group.value];
    //     });
    //     // make list unique and remove falsy values
    //     group_instances = [...new Set(group_instances)].filter( Boolean )
    // }

</script>