<template>
    <v-card variant="text" class="d-inline-block" style="margin-bottom: 0; padding-bottom: 0; background-color: white;" no-gutters>
        <v-card-text style="padding:0.5em; background-color: white;">
            <v-row justify="center" align="center">
                <v-col cols="1"><v-icon>{{ getClassIcon(record.triples['NamedNode'][RDF.type.value][0].value) }}</v-icon></v-col>
                <v-col>
                    <!-- literal and named nodes -->
                    <span v-for="tt of ['Literal', 'NamedNode']">
                        <span v-for="(v, k, index) in record.triples[tt]">
                            <span v-if="k != RDF.type.value ">
                                <em>{{ makeReadable(toCURIE(k, allPrefixes, "parts").property) }}</em>:
                                <span v-for="(el, i) in v">
                                    <span v-if="v.length > 1"><br>&nbsp;- </span>
                                    &nbsp;<TextOrLinkViewer :textVal="el.value" :prefLabel="getPrefLabel(el, graphData, allPrefixes)"></TextOrLinkViewer>
                                </span>
                                <br>

                            </span>
                        </span>
                    </span>
                    <span v-for="(v, k, index) in record.triples['BlankNode']">
                        <em>{{ makeReadable(toCURIE(k, allPrefixes, "parts").property) }}</em>:
                        <br>
                        <span v-for="(el, i) in v">
                            <div>
                                <BlankNodeViewer :node="el"></BlankNodeViewer>
                            </div>
                        </span>
                    </span>
                </v-col>
            </v-row>
        </v-card-text>
    </v-card>


</template>

<script setup>
    import { ref, onMounted, computed, reactive, onBeforeMount, inject, toRaw} from 'vue'
    import { toCURIE, getSubjectTriples, makeReadable, getPrefLabel} from '../modules/utils';
    import { RDF, DLTHINGS } from '@/modules/namespaces';
    // Define component properties
    const props = defineProps({
        node: Object,
    })

    const allPrefixes = inject('allPrefixes')
    const getClassIcon = inject('getClassIcon')
    const graphData = inject('graphData')
    const record = reactive({})

    onBeforeMount(() => {
        record.relatedQuads = getSubjectTriples(graphData, props.node)
        record.prefLabel = getPrefLabel(props.node, graphData, allPrefixes)
        record.triples = {
            "Literal": {},
            "BlankNode": {},
            "NamedNode": {},
        }
        record.relatedQuads.forEach((rQ) => {
            addRecordProperty(rQ)
        })
    })

    onMounted(() => {
    })


    // const shapeAttributes = computed(() => {
    // })

    function addRecordProperty(quad) {
        var termType = quad.object.termType
        if (!record.triples[termType].hasOwnProperty(quad.predicate.value)) {
            record.triples[termType][quad.predicate.value] = []
        }
        record.triples[termType][quad.predicate.value].push(quad.object)
        // if (termType === "BlankNode") {
        //     record.triples[termType][quad.predicate.value].push(quad.object)
        // } else {
        //     record.triples[termType][quad.predicate.value].push(quad.object.value)
        // }
    }
    

    
</script>