<template>
    <v-card class="mx-4 mb-4" :variant="props.variant">
        <v-card-title class="text-h6">
            <v-icon>{{ getClassIcon(props.classIRI) }}</v-icon
            >&nbsp;
            {{ record.prefLabel ? record.prefLabel : record.title }}
            <span v-if="resolveExternally">
                <sup
                    ><a
                        class="inline-icon-btn"
                        :href="toIRI(record.title, allPrefixes)"
                        target="_blank"
                        ><v-icon>mdi-arrow-top-right-thick</v-icon></a
                    ></sup
                >
            </span>
        </v-card-title>
        <v-card-subtitle>
            Type: <em>{{ toCURIE(record.subtitle, allPrefixes) }}</em>
            <span v-if="!props.formOpen">
                <v-tooltip text="Edit record" location="bottom">
                    <template v-slot:activator="{ props }">
                        &nbsp;
                        <v-btn
                            icon="mdi-pencil"
                            variant="tonal"
                            size="x-small"
                            class="rounded-lg"
                            @click="editInstanceItem(record)"
                            :disabled="props.formOpen || !canEditClass"
                            v-bind="props"
                        ></v-btn>
                    </template>
                </v-tooltip>
                &nbsp;
                <v-tooltip text="View RDF" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn
                            icon="mdi-file-eye-outline"
                            variant="tonal"
                            size="x-small"
                            class="rounded-lg"
                            @click="viewRDF()"
                            :disabled="props.formOpen"
                            v-bind="props"
                        ></v-btn>
                    </template>
                </v-tooltip>
            </span>
        </v-card-subtitle>
        <v-card-text v-if="!props.formOpen">
            <strong>Persistent Identifier</strong>: &nbsp;{{ record.title
            }}<br />
            <!-- Literal nodes -->
            <span v-for="(v, k, index) in record.triples['Literal']">
                <span v-if="propertyShapes[k]">
                    <strong>{{
                        nameOrCURIE(
                            propertyShapes[k],
                            shapesDS.data.prefixes,
                            true
                        )
                    }}</strong
                    >:
                </span>
                <span v-else>
                    <strong>{{ k }}</strong
                    >:
                </span>
                <span v-for="(el, i) in v">
                    <span v-if="v.length > 1"><br />&nbsp;- </span>
                    &nbsp;<LiteralNodeViewer
                        v-if="el.value"
                        :textVal="el.value"
                    ></LiteralNodeViewer>
                </span>
                <br />
            </span>
            <!-- Named nodes -->
            <span v-if="fetchingRecords">
                <v-skeleton-loader type="paragraph"></v-skeleton-loader>
            </span>
            <span v-else>
                <span v-for="(v, k, index) in record.triples['NamedNode']">
                    <span v-if="k != RDF.type.value">
                        <span v-if="propertyShapes[k]">
                            <strong>{{
                                nameOrCURIE(
                                    propertyShapes[k],
                                    shapesDS.data.prefixes,
                                    true
                                )
                            }}</strong
                            >:
                            <span v-for="(el, i) in v">
                                <span v-if="v.length > 1"><br />&nbsp;- </span>
                                &nbsp;<NamedNodeViewer
                                    v-if="el.value"
                                    :textVal="el.value"
                                    :prefLabel="
                                        getPrefLabel(el, rdfDS, allPrefixes)
                                    "
                                    :quad="
                                        getPidQuad(el.value, rdfDS.data.graph)
                                    "
                                    :targetClass="
                                        propertyShapes[k][SHACL.class.value]
                                    "
                                >
                                </NamedNodeViewer>
                            </span>
                        </span>
                        <span v-else>
                            <strong>{{ k }}</strong
                            >:
                            <span v-for="(el, i) in v">
                                <span v-if="v.length > 1"><br />&nbsp;- </span>
                                &nbsp;{{ el.value }}
                            </span>
                        </span>

                        <br />
                    </span>
                </span>
            </span>
            <!-- Blank nodes -->
            <br />
            <v-btn
                no-gutters
                v-if="Object.keys(record.triples['BlankNode']).length > 0"
                @click="showHideBlankNodes()"
                density="compact"
                :append-icon="
                    showBlankNodes ? 'mdi-chevron-down' : 'mdi-chevron-right'
                "
                >More details</v-btn
            >
            <span v-if="showBlankNodes">
                <br /><br />
                <span v-for="(v, k, index) in record.triples['BlankNode']">
                    <strong>{{
                        makeReadable(toCURIE(k, allPrefixes, 'parts').property)
                    }}</strong
                    >:
                    <br />
                    <span v-for="(el, i) in v">
                        <div>
                            <BlankNodeViewer :node="el"></BlankNodeViewer>
                        </div>
                    </span>
                </span>
            </span>
        </v-card-text>
    </v-card>

    <v-dialog
        v-model="ttlDialog"
        max-width="60%"
        @click:outside="ttlDialog = false"
    >
        <v-card>
            <v-card-title
                >RDF record for: <em>{{ ttlDialog_name }}</em></v-card-title
            >
            <v-card-subtitle
                ><v-icon>{{ ttlDialog_icon }}</v-icon>
                {{ ttlDialog_type }}</v-card-subtitle
            >
            <v-card-text>
                <code>
                    <pre style="overflow-x: scroll">
                    {{ ttlDialog_content }}
                </pre
                    >
                </code>
            </v-card-text>
            <v-card-actions>
                <v-btn prepend-icon="mdi-download" @click="downloadTTL()"
                    >Download</v-btn
                >
                <v-btn prepend-icon="mdi-close-box" @click="ttlDialog = false"
                    >Close</v-btn
                >
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import {
    reactive,
    onBeforeMount,
    inject,
    onUpdated,
    ref,
    nextTick,
    toRaw,
    provide,
} from 'vue';
import { toCURIE, toIRI } from 'shacl-tulip';
import {
    makeReadable,
    getPrefLabel,
    nameOrCURIE,
    getPidQuad,
    dlTTL,
    toSnakeCase,
    quadsToTTL,
} from '../modules/utils';
import { RDF, SHACL } from '@/modules/namespaces';
// Define component properties
const props = defineProps({
    classIRI: String,
    quad: Object,
    variant: String,
    formOpen: Boolean,
});

const editInstanceItem = inject('editInstanceItem');
const configVarsMain = inject('configVarsMain');
const allPrefixes = inject('allPrefixes');
const fetchFromService = inject('fetchFromService');
const getClassIcon = inject('getClassIcon');
const rdfDS = inject('rdfDS');
const shapesDS = inject('shapesDS');
const record = reactive({});
const showBlankNodes = ref(false);
const shape_obj = shapesDS.data.nodeShapes[props.classIRI];
const resolveExternally = ref(false);
const propertyShapes = {};
for (var p of shape_obj.properties) {
    propertyShapes[p[SHACL.path.value]] = p;
}

console.log(propertyShapes);

const ttlDialog = ref(false);
const ttlDialog_icon = ref('');
const ttlDialog_name = ref('');
const ttlDialog_type = ref('');
const ttlDialog_content = ref('');

const fetchingRecords = ref(false);
const canEditClass = ref(false)

const emit = defineEmits(['namedNodeSelected']);
function selectNamedNode(recordClass, recordPID) {
    emit('namedNodeSelected', { recordClass, recordPID });
}
provide('selectNamedNode', selectNamedNode);

onBeforeMount(async () => {
    canEditClass.value = configVarsMain.noEditClasses.indexOf(props.classIRI) < 0 ? true : false
    fetchingRecords.value = true;
    await updateRecord(true);
    fetchingRecords.value = false;
    if (configVarsMain['idResolvesExternally'].indexOf(props.classIRI) >= 0) {
        resolveExternally.value = true;
    }
});

onUpdated(() => {
    updateRecord(false);
});

async function viewRDF() {
    ttlDialog.value = false;
    ttlDialog_icon.value = getClassIcon(props.classIRI);
    ttlDialog_name.value = record.prefLabel ? record.prefLabel : record.title;
    ttlDialog_type.value = toCURIE(record.subtitle, allPrefixes);
    var tmpStr = await quadsToTTL(getRecordQuads(), allPrefixes);
    ttlDialog_content.value = tmpStr.replace(/^\s+/g, '');
    ttlDialog_content.value = '\n' + ttlDialog_content.value;
    ttlDialog.value = true;
}

function downloadTTL() {
    dlTTL(ttlDialog_content.value, toSnakeCase(ttlDialog_name.value) + '.ttl');
}

function showHideBlankNodes() {
    showBlankNodes.value = !showBlankNodes.value;
}

function getRecordQuads() {
    const visited = new Set();
    const allQuads = [];

    function addQuadsRecursively(quads) {
        for (const quad of quads) {
            if (!allQuads.includes(quad)) {
                allQuads.push(quad);
                if (quad.object.termType === 'BlankNode') {
                    const id = quad.object.value;
                    if (!visited.has(id)) {
                        visited.add(id);
                        const moreQuads = rdfDS.getSubjectTriples(quad.object);
                        addQuadsRecursively(Array.from(moreQuads));
                    }
                }
            }
        }
    }

    const baseQuads = record.relatedQuads;
    addQuadsRecursively(baseQuads);
    return allQuads;
}

async function updateRecord(fetchData) {
    record.title = props.quad.subject.value;
    record.quad = props.quad;
    record.value = props.quad.subject.value;
    record.subtitle = props.quad.object.value;
    record.relatedQuads = rdfDS.getSubjectTriples(props.quad.subject);
    record.prefLabel = getPrefLabel(props.quad.subject, rdfDS, allPrefixes);
    record.triples = {
        Literal: {},
        BlankNode: {},
        NamedNode: {},
    };
    for (const rQ of record.relatedQuads) {
        await addRecordProperty(rQ, fetchData);
    }
}

async function addRecordProperty(quad, fetchData) {
    var termType = quad.object.termType;

    if (
        termType === 'NamedNode' &&
        quad.predicate.value != RDF.type.value &&
        fetchData
    ) {
        const results = await fetchFromService(
            'get-record',
            quad.object.value,
            allPrefixes
        );
    }
    if (!record.triples[termType].hasOwnProperty(quad.predicate.value)) {
        record.triples[termType][quad.predicate.value] = [];
    }
    record.triples[termType][quad.predicate.value].push(quad.object);
}
</script>
