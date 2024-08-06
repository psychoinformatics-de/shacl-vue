<template>
    <v-autocomplete
        density="compact"
        variant="outlined"
        label="(instances select editor)"
        v-model="triple_object"
        :items="instanceItems"
        validate-on="lazy input"
        :rules="rules"
        item-value="value"
        item-text="title"
        return-object
    >

        <template v-slot:item="data">
            <v-list-item @click="console.log('add new item')" v-if="data.item.props.isButton">
                <template v-slot:prepend>
                    <v-icon icon="item.icon">mdi-plus-box</v-icon>
                </template>
                <v-list-item-title>{{ data.item.title }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="selectItem(data.item)" v-else>
                <v-list-item-title>{{ data.item.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ data.item.props.subtitle }}</v-list-item-subtitle>
            </v-list-item>
        </template>
    </v-autocomplete>
</template>

<script setup>
    import { inject, reactive, onMounted, ref, computed} from 'vue'
    import { useRules } from '../composables/rules'
    import rdf from 'rdf-ext'
    import {SHACL, RDF, RDFS, DLTHING, XSD} from '@/modules/namespaces'
    import { toCURIE } from '../modules/utils';

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
    const graphData = inject('graphData');
    const graphPrefixes = inject('graphPrefixes');
    const shapePrefixes = inject('shapePrefixes');
    const classPrefixes = inject('classPrefixes');
    const classData = inject('classData');
    const { rules } = useRules(props.property_shape)
    var propClass = ref(null)
    const combinedQuads = reactive([])
    const instanceItems = reactive([])

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

    onMounted(() => {
        // ---
        // The goal of this method is to populate the list of items for the
        // InstancesSelectEditor
        // ---
        // TODO: what should the correct default value be here?
        propClass.value = props.property_shape[SHACL.class.value] ?? false
        let allprefixes = {...shapePrefixes, ...graphPrefixes, ...classPrefixes};
        // find nodes with predicate rdf:type and object being the property class
        var quads = getLiteralAndNamedNodes(
            graphData,
            rdf.namedNode(RDF.type),
            propClass.value,
            allprefixes
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
            myArr = myArr.concat(getLiteralAndNamedNodes(graphData, rdf.namedNode(RDF.type), cl, allprefixes))
        });
        // Then combine all quad arrays
        const combinedQuads = quads.concat(myArr);
        // Finally, create list items from quads
        instanceItems.push(
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
            instanceItems.push(
                {
                    title: quad.subject.value + extra,
                    value: quad.subject.value,
                    props: { subtitle: toCURIE(quad.object.value, allprefixes) },
                }
            )
        });
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
    }


</script>

<!-- Component matching logic -->

<script>
    import { SHACL } from '@/modules/namespaces'
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