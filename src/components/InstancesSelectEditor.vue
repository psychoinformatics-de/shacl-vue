<template>
    <v-autocomplete
        label="(instances select editor)"
        v-model="formData[props.node_uid][props.triple_uid]"
        :items="instanceItems"
        validate-on="lazy input"
        :rules="rules"
    ></v-autocomplete>
</template>

<script setup>
    import { inject, reactive, onMounted, ref, computed} from 'vue'
    import { useRules } from '../composables/rules'
    import rdf from 'rdf-ext'
    import {SHACL, RDF, DLTHING, XSD} from '@/modules/namespaces'
    import { toCURIE } from '../modules/utils';

    const predicateSelector = DLTHING.meta_type
    // const predicateSelector = RDF.type.value

    const props = defineProps({
        property_shape: Object,
        node_uid: String,
        triple_uid: String,
    })
    const formData = inject('formData');
    const graphData = inject('graphData');
    const graphPrefixes = inject('graphPrefixes');
    const shapePrefixes = inject('shapePrefixes');
    const { rules } = useRules(props.property_shape)
    // var classNodes = reactive(null)
    // var classNodes2 = reactive(null)
    var propClass = ref(null)
    const combinedQuads = reactive([])
    const instanceItems = reactive([])

    onMounted(() => {
        console.log(`\nMounted InstancesSelectEditor: ${props.property_shape[SHACL.path.value]} (graphdata is ${graphData.size})`)
        propClass.value = props.property_shape[SHACL.class.value] ?? false // TODO: what should the correct default value be here?

        let allprefixes = {...shapePrefixes, ...graphPrefixes};
        var propClassCurie = toCURIE(propClass.value, allprefixes)
        const literalNodes = rdf.grapoi({ dataset: graphData })
            .hasOut(predicateSelector, rdf.literal(String(propClassCurie), XSD.anyURI))
            .quads();
        const uriNodes = rdf.grapoi({ dataset: graphData })
            .hasOut(predicateSelector, propClass.value)
            .quads();
        const combinedQuads = Array.from(literalNodes).concat(Array.from(uriNodes));
        console.log("Concatenated results")
        combinedQuads.forEach(quad => {
            console.log(`\t${quad.subject.value}`)
            instanceItems.push(quad.subject.value)
        });
    })

</script>


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