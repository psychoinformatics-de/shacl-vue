<template>
    <h2>{{ toCURIE(shape_iri, shapePrefixes) }}</h2>
    <br>
    <p>{{ shape_obj[sh_description] }}</p>
    <br>

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
                            <span v-for="property in orderArrayOfObjects(group['own_properties'], SHACL.order.value)" :key="props.shape_iri + '-' + String(node_idx) + '-' + property[SHACL.path.value]">
                                <keep-alive>
                                    <PropertyShapeEditor :property_shape="property" :node_uid="props.shape_iri"/>
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
                <span v-for="property in orderArrayOfObjects(group['own_properties'], SHACL.order.value)" :key="props.shape_iri + '-' + String(node_idx) + '-' + property[SHACL.path.value]">
                    <keep-alive>
                        <PropertyShapeEditor :property_shape="property" :node_uid="props.shape_iri"/>
                    </keep-alive>
                </span>
            </span>
            <br>
        </span>
    </span>
</template>


<script setup>
    import { ref, onBeforeUpdate, onBeforeMount, onMounted, computed, inject} from 'vue'
    import {SHACL, RDF, RDFS} from '../modules/namespaces'
    import { toCURIE, orderArrayOfObjects } from '../modules/utils';

    // ----- //
    // Props //
    // ----- //

    const props = defineProps({
        shape_iri: String,
        shape_obj: Object,
        prop_groups: Object
    })

    // ---- //
    // Data //
    // ---- //

    const ready = ref(false)
    const shapePrefixes = inject('shapePrefixes');
    const formData = inject('formData');
    const sh_description = ref(SHACL.description.value)
    const defaultPropertyGroup = inject('defaultPropertyGroup');
    var tab = ref(null)
    // const group_layout = ref('tabs') // ref('default') or ref('tabs')
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
    })

    onBeforeUpdate(() => {
        console.log(`the NodeShapeEditor component is about to be updated.`)
        orderGroups()
    })

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
        for (const [key, value] of Object.entries(props.shape_obj)) {
            if (ignore_properties.indexOf(key) < 0) {
                new_obj[key] = value
            }
        }
        return new_obj
    })

    const orderedProperties = computed(() => {
        var order = SHACL.order.value
        return props.shape_obj.properties.sort((a,b) => a[order] - b[order])
    });

    const node_idx = computed(() => {
        return formData[props.shape_iri].length - 0
    })

    const ignoredProperties = computed(() => {
        var ignored = [RDF.type.value]
        // TODO: need to get actual ignored properties from props.shape_obj[SHACL.ignoredProperties.value]
        // TODO: also load ignored properties from some user-defined default
        return ignored
    })

    const usedPropertyGroups = computed(() => {
        // first get a list of all the sh:PropertyGroup instances 
        // that are provided for any property via sh:group
        var group_instances = props.shape_obj.properties.map(function(shape_prop) {
            return shape_prop[SHACL.group.value];
        });
        // make list unique and remove falsy values
        group_instances = [...new Set(group_instances)].filter( Boolean )
        var used_prop_groups = {}
        for (var group_iri of group_instances) {
            used_prop_groups[group_iri] = props.prop_groups[group_iri]
        }
        // add default property group
        used_prop_groups[defaultPropertyGroup.key] = defaultPropertyGroup.value

        console.debug(used_prop_groups)

        // initialise 'own_properties' array
        for (var group_iri of Object.keys(used_prop_groups)) {
            used_prop_groups[group_iri]["own_properties"] = []
        }
        
        // add shape properties to correct group
        for (var p of props.shape_obj.properties) {
            console.log(p[SHACL.path])
            if (p.hasOwnProperty(SHACL.group.value)) {
                used_prop_groups[p[SHACL.group.value]]["own_properties"].push(p)
            } else {
                if (ignoredProperties.value.indexOf(p[SHACL.path]) < 0) {
                    used_prop_groups[defaultPropertyGroup.key]["own_properties"].push(p)
                }
            }
        }

        console.log("computed")
        console.log(used_prop_groups)

        return used_prop_groups
        // var order = SHACL.order.value
        // return used_prop_groups.sort((a,b) => a[order] - b[order])

    });

    // --------- //
    // Functions //
    // --------- //

    function orderGroups() {
        console.log("ordering groups inside nodeshapeeditor")
        // first get a list of all the sh:PropertyGroup instances 
        // that are provided for any property via sh:group
        var group_instances = props.shape_obj.properties.map(function(shape_prop) {
            return shape_prop[SHACL.group.value];
        });
        // make list unique and remove falsy values
        group_instances = [...new Set(group_instances)].filter( Boolean )
        console.log("group_instances")
        console.log(group_instances)
    }

</script>