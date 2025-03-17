<template>
    <v-card class="mx-4 mb-4" :variant="props.variant">
        <v-card-title class="text-h6">
            <v-icon>{{ getClassIcon(props.classIRI) }}</v-icon>&nbsp;
            <TextOrLinkViewer :textVal="record.title" :prefLabel="record.prefLabel"></TextOrLinkViewer>&nbsp;
            <v-btn
                icon="mdi-pencil"
                variant="tonal"
                size="x-small"
                class="rounded-lg"
                @click="editInstanceItem(record)"
            ></v-btn>
        </v-card-title>
        <v-card-subtitle>{{ toCURIE(record.subtitle, allPrefixes) }}</v-card-subtitle>
        <v-card-text v-if="!props.formOpen">
            <!-- literal and named nodes -->
            <span v-for="tt of ['Literal', 'NamedNode']">
                <span v-for="(v, k, index) in record.triples[tt]">
                    <span v-if="k != RDF.type.value ">
                        <strong>{{ makeReadable(toCURIE(k, allPrefixes, "parts").property) }}</strong>:
                        <span v-for="(el, i) in v">
                            <span v-if="v.length > 1"><br>&nbsp;- </span>
                            &nbsp;<TextOrLinkViewer :textVal="el.value" :prefLabel="getPrefLabel(el, rdfDS, allPrefixes)"></TextOrLinkViewer>
                        </span>
                        <br>
                    </span>
                </span>
            </span>
            <!-- Blank nodes -->
            <span v-for="(v, k, index) in record.triples['BlankNode']">
                <strong>{{ makeReadable(toCURIE(k, allPrefixes, "parts").property) }}</strong>:
                <br>
                <span v-for="(el, i) in v">
                    <div>
                        <BlankNodeViewer :node="el"></BlankNodeViewer>
                    </div>
                </span>
            </span>
        </v-card-text>
    </v-card>


</template>

<script setup>
    import { reactive, onBeforeMount, inject, onUpdated} from 'vue'
    import { toCURIE } from 'shacl-tulip'
    import { makeReadable, getPrefLabel} from '../modules/utils';
    import { RDF } from '@/modules/namespaces';
    // Define component properties
    const props = defineProps({
        classIRI: String,
        quad: Object,
        variant: String,
        formOpen: Boolean,
    })

    const editInstanceItem = inject('editInstanceItem')
    const allPrefixes = inject('allPrefixes')
    const getClassIcon = inject('getClassIcon')
    const rdfDS = inject('rdfDS')
    const record = reactive({})

    onBeforeMount(() => {
        updateRecord()
    })

    onUpdated(() => {
        updateRecord()
    })

    function updateRecord() {
        record.title = props.quad.subject.value
        record.quad = props.quad
        record.value = props.quad.subject.value
        record.subtitle = props.quad.object.value
        record.relatedQuads = rdfDS.getSubjectTriples(props.quad.subject)
        record.prefLabel = getPrefLabel(props.quad.subject, rdfDS, allPrefixes)
        record.triples = {
            "Literal": {},
            "BlankNode": {},
            "NamedNode": {},
        }
        record.relatedQuads.forEach((rQ) => {
            addRecordProperty(rQ)
        })
    }

    function addRecordProperty(quad) {
        var termType = quad.object.termType
        if (!record.triples[termType].hasOwnProperty(quad.predicate.value)) {
            record.triples[termType][quad.predicate.value] = []
        }
        record.triples[termType][quad.predicate.value].push(quad.object)
    }
</script>