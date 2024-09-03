<template>
    <v-autocomplete
        density="compact"
        variant="outlined"
        label="select an item"
        v-model="triple_object"
        :items="instanceItems"
        validate-on="lazy input"
        :rules="rules"
        item-value="value"
        item-text="title"
        return-object
        ref="fieldRef"
        :id="inputId"
    >

        <template v-slot:item="data">
            <div v-if="data.item.props.isButton">
                <v-list-item @click.stop>
                    <v-list-item-title>
                        <v-menu v-model="menu" location="end">
                            <template v-slot:activator="{ props }">
                                <v-btn variant="tonal" v-bind="props">{{ data.item.title }} &nbsp;&nbsp; <v-icon icon="item.icon">mdi-play</v-icon></v-btn>
                            </template>

                            <v-list ref="addItemList">
                                <v-list-item v-for="item in propClassList" @click.stop="handleAddItemClick(item)">
                                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>

                    </v-list-item-title>
                </v-list-item>
            </div>
            <div v-else>
                <v-list-item @click="selectItem(data.item)">
                    <v-list-item-title>{{ data.item.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ data.item.props.subtitle }}</v-list-item-subtitle>
                </v-list-item>
            </div>
        </template>
    </v-autocomplete>

    <v-dialog v-model="dialog" max-width="700">
        <template v-slot:default="{ isActive }">
            <FormEditor :shape_iri="selectedShapeIRI"></FormEditor>
        </template>
    </v-dialog>



</template>

<script setup>
    import { inject, reactive, onBeforeMount, ref, computed} from 'vue'
    import { useRules } from '../composables/rules'
    import rdf from 'rdf-ext'
    import {SHACL, RDF, RDFS, DLTHING, XSD} from '@/modules/namespaces'
    import { toCURIE } from '../modules/utils';
    import { useRegisterRef } from '../composables/refregister';

    // ----- //
    // Props //
    // ----- //

    const props = defineProps({
        property_shape: Object,
        node_uid: String,
        triple_uid: String,
        triple_idx: Number,
    })

    // ---- //
    // Data //
    // ---- //
    
    const formData = inject('formData');
    const savedFormData = inject('savedFormData');
    const savedFormDummy = inject('savedFormDummy');
    const graphData = inject('graphData');
    const add_empty_node = inject('add_empty_node');
    const allPrefixes = inject('allPrefixes');
    const classData = inject('classData');
    const { rules } = useRules(props.property_shape)
    var propClass = ref(null)
    const inputId = `input-${Date.now()}`;
    const { fieldRef } = useRegisterRef(inputId, props);
    const addItemList = ref(null)
    const dialog = ref(false)
    const menu = ref(false)
    const selectedShapeIRI = ref(null)


    const cancelDialogForm = () => {
        console.log("Canceling from form in dialog")
        dialog.value = false;
    };
    provide('cancelFormHandler', cancelDialogForm);
    const saveDialogForm = () => {
        console.log("Saving from form in dialog")
        dialog.value = false;
    };
    provide('saveFormHandler', saveDialogForm);
    
    // ------------------- //
    // Computed properties //
    // ------------------- //

    const triple_object = computed({
        get() {
            return formData[props.node_uid].at(-1)[props.triple_uid][props.triple_idx];
        },
        set(value) {
            const node_idx = formData[props.node_uid].length - 1
            formData[props.node_uid][node_idx][props.triple_uid][props.triple_idx] = value;
        }
    });

    // ----------------- //
    // Lifecycle methods //
    // ----------------- //

    onBeforeMount(() => {
        // TODO: what should the correct default value be here?
        propClass.value = props.property_shape[SHACL.class.value] ?? false
    })

    const instanceItems = computed(() => {
        // ---
        // The goal of this method is to populate the list of items for the
        // InstancesSelectEditor
        // ---
        savedFormDummy.value;
        console.log("recalculating instance items")
        // find nodes with predicate rdf:type and object being the property class
        var quads = getLiteralAndNamedNodes(
            graphData,
            rdf.namedNode(RDF.type),
            propClass.value,
            allPrefixes
        )
        // find nodes with predicate rdf:type and object being the property class
        var savedQuads = getLiteralAndNamedNodes(
            savedFormData,
            rdf.namedNode(RDF.type),
            propClass.value,
            allPrefixes
        )
        // then find nodes with predicate rdfs:subClassOf and object being the property class
        // TODO: here we are only using a named node for the object because this is how the
        // tools/gen_owl_minimal.py script outputs the triples in the ttl file. This should be
        // generalised
        const subClasses = rdf.grapoi({ dataset: classData })
            .hasOut(rdf.namedNode(RDFS.subClassOf.value), rdf.namedNode(propClass.value))
            .quads();
        // For each subclass, find the quads in graphData that has the class name as object
        // and RDF.type as predicate
        var myArr = []
        Array.from(subClasses).forEach(quad => {
            const cl = quad.subject.value
            myArr = myArr.concat(getLiteralAndNamedNodes(graphData, rdf.namedNode(RDF.type), cl, allPrefixes))
        });
        // Then combine all quad arrays
        const combinedQuads = quads.concat(savedQuads).concat(myArr);
        // Finally, create list items from quads
        var instanceItemsArr = []
        instanceItemsArr.push(
            {
                title: "Add New Item",
                props: { subtitle: "bla", isButton: true, },
            }
        )
        combinedQuads.forEach(quad => {
            console.log(`\t${quad.subject.value}`)
            var extra = ''
            if (quad.subject.termType === 'BlankNode') {
                extra = ' (BlankNode)'
            }
            instanceItemsArr.push(
                {
                    title: quad.subject.value + extra,
                    value: quad.subject.value,
                    props: { subtitle: toCURIE(quad.object.value, allPrefixes) },
                }
            )
        });
        return instanceItemsArr
    })

    const propClassList = computed(() => {
        var items = []
        // first add main property class
        items.push(
            {
                title: toCURIE(propClass.value, allPrefixes),
                value: propClass.value
            }
        )
        const subClasses = rdf.grapoi({ dataset: classData })
            .hasOut(rdf.namedNode(RDFS.subClassOf.value), rdf.namedNode(propClass.value))
            .quads();
        
        Array.from(subClasses).forEach(quad => {
            items.push(
                {
                    title: toCURIE(quad.subject.value, allPrefixes),
                    value: quad.subject.value
                }
            )
        });
        return items
    })

    // --------- //
    // Functions //
    // --------- //

    function getLiteralAndNamedNodes(graphData, predicate, propertyClass, prefixes) {
        var propClassCurie = toCURIE(propertyClass, prefixes)
        // a) use the literal node with xsd data type
        const literalNodes = rdf.grapoi({ dataset: graphData })
            .hasOut(predicate, rdf.literal(String(propClassCurie), XSD.anyURI))
            .quads();
        // b) and the named node
        const uriNodes = rdf.grapoi({ dataset: graphData })
            .hasOut(predicate, rdf.namedNode(propClass.value))
            .quads();
        // return as a concatenated array of quads
        return Array.from(literalNodes).concat(Array.from(uriNodes))
    }

    function selectItem(item) {
        triple_object.value = item.value;
        fieldRef.value.blur();
    }

    function handleAddItemClick(item) {
        selectedShapeIRI.value = item.value
        menu.value = false;
        dialog.value = true;
        add_empty_node(item.value)
    }

</script>

<!-- Component matching logic -->

<script>
    import { SHACL } from '@/modules/namespaces'
import { provide } from 'vue';
    export const matchingLogic = (shape) => {
        // sh:nodeKind exists
        if ( shape.hasOwnProperty(SHACL.nodeKind.value) ) {
            // sh:nodeKind == sh:IRI ||
            // sh:nodeKind == sh:BlankNodeOrIRI ||
            return [SHACL.IRI.value, SHACL.BlankNodeOrIRI.value].includes(shape[SHACL.nodeKind.value])
        }
        return false
    };
</script>