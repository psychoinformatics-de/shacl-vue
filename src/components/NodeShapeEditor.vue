<template>
    <span v-if="ready">
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
        <span v-if="classProperties[localShapeIri].length > 0">
            <h3>Properties from: <code class="code-style">{{ getDisplayName(localShapeIri, configVarsMain, allPrefixes) }}</code></h3>
            <br>
            <span v-for="property in classProperties[localShapeIri]" :key="localShapeIri + '-' + localNodeIdx + '-' + property">
                <PropertyShapeEditor :property_shape="propertyShapes[property]" :node_uid="localShapeIri" :node_idx="localNodeIdx" :top_level_prop="true"/>
            </span>
        </span>
        
        <span v-for="c in superClasses[localShapeIri]">
            <span v-if="groupHasVisibleProps(c)">
                <h3>Properties from: <code class="code-style">{{ getDisplayName(c, configVarsMain, allPrefixes) }}</code></h3>
                <br>
                <span v-for="property in classProperties[c]" :key="localShapeIri + '-' + localNodeIdx + '-' + property[SHACL.path.value]">
                    <PropertyShapeEditor :property_shape="propertyShapes[property]" :node_uid="localShapeIri" :node_idx="localNodeIdx" :top_level_prop="false"/>
                </span>
            </span>
        </span>
    </span>
    
        
    </span>

</template>


<script setup>
    import { ref, onBeforeUpdate, onBeforeMount, onBeforeUnmount, onMounted, inject, shallowRef, toRaw} from 'vue'
    import {SHACL, RDF, RDFS, DLCO} from '../modules/namespaces'
    import { orderArrayOfObjects, getDisplayName} from '../modules/utils';

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
    const shapesDS = inject('shapesDS')
    const superClasses = inject('superClasses')
    const allPrefixes = inject('allPrefixes')
    const configVarsMain = inject('configVarsMain')
    const show_all_fields = inject('show_all_fields');
    const shape_obj = shapesDS.data.nodeShapes[localShapeIri.value]
    const ready = ref(false)
    var tab = ref(null)
    const group_layout = ref('default') // ref('default') or ref('tabs')
    const ignoredProperties = [
        RDF.type.value,
    ]
    var propertyShapes = {}
    var classProperties

    
    // ----------------- //
    // Lifecycle methods //
    // ----------------- //

    const usedPropertyGroups = shallowRef({});

    onMounted(() => {        
        for (var p of shape_obj.properties) {
            propertyShapes[p[SHACL.path.value]] = p
        }
        classProperties = orderProperties(propertyShapes)
        console.log(classProperties)
        ready.value = true;
    })

    onBeforeMount(() => {
        if (config.value.hasOwnProperty("group_layout") && config.value.group_layout == "tabs") {
            group_layout.value = "tabs"
        }
    })

    onBeforeUpdate(() => {
    })

    onBeforeUnmount(() => {
        localShapeIri.value = null
        localNodeIdx.value = null
    });

    // ------------------- //
    // Computed properties //
    // ------------------- //

    function orderProperties(propertyShapes) {
        // The current class has a possible hierarchy of superclasses
        // The current class has properties, any of which can originate from
        // any of its possible superclasses.
        // We need to divide all class properties into groups of properties that 
        // stem from particular superclasses.
        // For each of the current class's properties, we should check whether that 
        // property is included in the property of the top-level superclass, and if not
        // we should check the same for the second-level superclass, and so forth.
        // If that property is not in any superclass, then it belongs to the current class.
        // 1. Generate a new array (deep clone) of the current class's properties
        // 2. Create an empty array for each of the superclasses
        // 3. If a property is found in any of the superclasses' properties (nodeshape.properties),
        //    move it to that array and remove it from the original clone. If not, do nothing.

        // Initialize onbject to store all classes and properties
        var classProps = {}
        // Get all properties of the current class as a new array
        var propertyPaths = Object.keys(propertyShapes)
        classProps[localShapeIri.value] = propertyPaths
        // Get superclasses
        var currentSuperClasses = superClasses[localShapeIri.value]
        // If the class has no superclasses, all of the properties are from the single class
        if (currentSuperClasses.length == 0) {
            return classProps
        }
        // Initialize all superclass property arrays -> empty
        // Initialize all superclass property references -> arrays of property paths
        var superClassPropRefs = {}
        for (var c of currentSuperClasses) {
            classProps[c] = []
            superClassPropRefs[c] = shapesDS.data.nodeShapes[c].properties.map(function(shape_prop) {
                return shape_prop[SHACL.path.value];
            });
        }
        // Now loop through all the properties and divide them into their top-most-level originating class
        // note: creating a copy via json so that we don't modify the array that is being looped through
        for (var p of JSON.parse(JSON.stringify(propertyPaths))) {
            // Loop through superclasses in reverse order
            for (var i=currentSuperClasses.length-1; i>=0; i--) {
                var c = currentSuperClasses[i]
                if (superClassPropRefs[c].includes(p)) {
                    removeArrayElement(propertyPaths, p)
                    // Only add property to class if it should not be ignored
                    if (ignoredProperties.indexOf(p) < 0) {
                        classProps[c].push(p)
                    }
                    break;
                }
            }
        }

        const sortedClassProps = {};
        for (const classIRI in classProps) {
            // Get the array of properties for the current class
            const properties = classProps[classIRI];
            // Sort the properties based on the sh:order value in propertyShapes
            const sortedProperties = properties.slice().sort((a, b) => {
            const orderA = parseInt(propertyShapes[a]?.["http://www.w3.org/ns/shacl#order"] ?? Infinity, 10);
            const orderB = parseInt(propertyShapes[b]?.["http://www.w3.org/ns/shacl#order"] ?? Infinity, 10);
            return orderA - orderB;
            });
            // Assign sorted array back to the new object
            sortedClassProps[classIRI] = sortedProperties;
        }
        return sortedClassProps;
    }

    function removeArrayElement(arr, el) {
        const index = arr.indexOf(el);
        if (index > -1) { // only splice array when item is found
            arr.splice(index, 1); // 2nd parameter means remove one item only
        }
    }

    
    function computeUsedPropertyGroups() {
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
            if (shapesDS.data.propertyGroups[group_iri]) {
                used_prop_groups[group_iri] = shapesDS.data.propertyGroups[group_iri]
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
    function groupHasVisibleProps(c) {
        if (classProperties[c].length == 0) {
            return false
        }
        for (var p of classProperties[c]) {
            var currShape = propertyShapes[p]
            if (show_all_fields.value) {
                return true
            } else {
                if (currShape[SHACL.minCount?.value] > 0) {
                    return true
                }
                if (currShape.hasOwnProperty(DLCO.recommended.value) && currShape[DLCO.recommended.value] == "true") {
                    return true
                }
            }
        }
        return false
    }

</script>