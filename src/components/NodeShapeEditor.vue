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
                            <span v-for="property in orderArrayOfObjects(group['own_properties'], SHACL.order.value)" :key="localShapeIri + '-' + String(Date.now()) + '-' + property[SHACL.path.value]">
                                <keep-alive>
                                    <PropertyShapeEditor :property_shape="property" :node_uid="localShapeIri"/>
                                </keep-alive>
                            </span>
                            <br>
                        </v-tabs-window-item>
                    </span>
                </v-tabs-window>
            </v-card-text>
        </v-card>
    </span>
    <span v-else>
        <span v-for="group in orderArrayOfObjects(Object.values(usedPropertyGroups), SHACL.order.value) ">
            <span v-if="group['own_properties'].length">
                <h3>{{ group[RDFS.label.value] }}</h3>
                <p><em>{{ group[RDFS.comment.value] }}</em></p>
                <br>
                <span v-for="property in orderArrayOfObjects(group['own_properties'], SHACL.order.value)" :key="localShapeIri + '-' + String(Date.now()) + '-' + property[SHACL.path.value]">
                    <keep-alive>
                        <PropertyShapeEditor :property_shape="property" :node_uid="localShapeIri"/>
                    </keep-alive>
                </span>
            </span>
            <br>
        </span>
    </span>
</template>


<script setup>
    import { ref, onBeforeUpdate, onBeforeMount, onBeforeUnmount, onMounted, computed, inject} from 'vue'
    import {SHACL, RDF, RDFS, DLTHING} from '../modules/namespaces'
    import { orderArrayOfObjects } from '../modules/utils';

    // ----- //
    // Props //
    // ----- //

    const props = defineProps({
        shape_iri: String,
    })

    // ---- //
    // Data //
    // ---- //

    const localShapeIri = ref(props.shape_iri);
    const formData = inject('formData');
    const defaultPropertyGroup = inject('defaultPropertyGroup');
    const propertyGroups = inject('propertyGroups');
    const nodeShapes = inject('nodeShapes')
    const shape_obj = nodeShapes.value[localShapeIri.value]
    const ready = ref(false)
    var tab = ref(null)
    const config = inject('config')
    const group_layout = ref('default') // ref('default') or ref('tabs')
    
    // ----------------- //
    // Lifecycle methods //
    // ----------------- //

    onMounted(() => {
        ready.value = true;
    })

    onBeforeMount(() => {
        console.log(`the NodeShapeEditor component is about to be mounted.`)
        orderGroups()
        if (config.value.hasOwnProperty("group_layout") && config.value.group_layout == "tabs") {
            group_layout.value = "tabs"
        }
    })

    onBeforeUpdate(() => {
        console.log(`the NodeShapeEditor component is about to be updated.`)
        orderGroups()
    })

    onBeforeUnmount(() => {
        localShapeIri.value = null
    });

    // ------------------- //
    // Computed properties //
    // ------------------- //

    const shapeAttributes = computed(() => {
        const ignore_properties = [
            "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
            "properties",
            "http://www.w3.org/ns/shacl#ignoredProperties"
        ]
        var new_obj = {}
        for (const [key, value] of Object.entries(shape_obj)) {
            if (ignore_properties.indexOf(key) < 0) {
                new_obj[key] = value
            }
        }
        return new_obj
    })

    const orderedProperties = computed(() => {
        var order = SHACL.order.value
        return shape_obj.properties.sort((a,b) => a[order] - b[order])
    });

    // const node_idx = computed(() => {
    //     console.log("Inside computed in nodeshapeeditor. localShapeIri.value:")
    //     console.log(localShapeIri.value)
    //     return formData[localShapeIri.value].length - 0
    // })

    const ignoredProperties = computed(() => {
        var ignored = [
            RDF.type.value,
            DLTHING.meta_type.value,
        ]
        // TODO: need to get actual ignored properties from shape_obj[SHACL.ignoredProperties.value]
        // TODO: also load ignored properties from some user-defined default
        return ignored
    })

    const usedPropertyGroups = computed(() => {
        // first get a list of all the sh:PropertyGroup instances 
        // that are provided for any property via sh:group
        var group_instances = shape_obj.properties.map(function(shape_prop) {
            return shape_prop[SHACL.group.value];
        });
        // make list unique and remove falsy values
        group_instances = [...new Set(group_instances)].filter( Boolean )
        var used_prop_groups = {}
        for (var group_iri of group_instances) {
            used_prop_groups[group_iri] = propertyGroups.value[group_iri]
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
                if (ignoredProperties.value.indexOf(p[SHACL.path]) < 0) {
                    used_prop_groups[defaultPropertyGroup.key]["own_properties"].push(p)
                }
            }
        }

        return used_prop_groups
        // var order = SHACL.order.value
        // return used_prop_groups.sort((a,b) => a[order] - b[order])
    });

    // --------- //
    // Functions //
    // --------- //

    function orderGroups() {
        // first get a list of all the sh:PropertyGroup instances 
        // that are provided for any property via sh:group
        var group_instances = shape_obj.properties.map(function(shape_prop) {
            return shape_prop[SHACL.group.value];
        });
        // make list unique and remove falsy values
        group_instances = [...new Set(group_instances)].filter( Boolean )
    }

</script>