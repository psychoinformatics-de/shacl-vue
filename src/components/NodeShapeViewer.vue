<template>
    <v-card class="mx-4 mb-4" :variant="props.variant">
        <v-card-title class="text-h6" style="display: flex; align-items: center; gap: 6px;">
            <v-icon>{{ getClassIcon(props.classIRI) }}</v-icon
            >&nbsp;
            <span class="card-title">
                {{ record.prefLabel ? record.prefLabel : ( record.displayLabel ? record.displayLabel : record.title) }}
            </span>
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
                <span v-if="showCopyLink">
                    &nbsp;
                    <v-tooltip text="Copy link" location="bottom">
                        <template v-slot:activator="{ props }">
                            <v-btn
                                :icon="linkCopied ? 'mdi-check' : 'mdi-link-variant'"
                                variant="tonal"
                                :color="linkCopied ? 'success' : ''"
                                size="x-small"
                                class="rounded-lg"
                                @click="copyRecordLink()"
                                :disabled="props.formOpen"
                                v-bind="props"
                            ></v-btn>
                        </template>
                    </v-tooltip>
                </span>
            </span>
        </v-card-subtitle>
        <v-card-text v-if="!props.formOpen">
            <strong>Persistent Identifier</strong>: &nbsp;{{ record.title}}<br/>

            <!-- Literal nodes -->
            <span v-for="(v, k, index) in record.triples['Literal']">
                <span v-if="propertyShapes[k]">
                    <strong>
                        {{
                            nameOrCURIE(
                                propertyShapes[k],
                                shapesDS.data.prefixes,
                                true
                            )
                        }}
                    </strong>:
                </span>
                <span v-else>
                    <strong>{{ k }}</strong>:
                </span>
                <span v-for="(el, i) in v.values">
                    <span v-if="i < showCounts['Literal'][k]">
                        <span v-if="v.values.length > 1"><br/>&nbsp;-</span>
                        &nbsp;<LiteralNodeViewer v-if="el.value" :textVal="el.value" :wrap="'wrap'"></LiteralNodeViewer>
                    </span>
                </span>
                <br/>
                <MoreOrLessRecordsViewer
                    :records="v.values"
                    v-model:count="showCounts['Literal'][k]"
                    :stepSize="defaultStep"
                ></MoreOrLessRecordsViewer>
            </span>


            <!-- Named nodes -->
            <span v-if="fetchingRecords">
                <v-skeleton-loader type="paragraph"></v-skeleton-loader>
            </span>
            <span v-else>
                <span v-for="(v, k, index) in record.triples['NamedNode']">
                    <span v-if="k != RDF.type.value">
                        <span v-if="propertyShapes[k]">
                            <strong>
                                {{
                                    nameOrCURIE(
                                        propertyShapes[k],
                                        shapesDS.data.prefixes,
                                        true
                                    )
                                }}
                            </strong>:&nbsp;&nbsp;<MoreOrLessRecordsViewer
                                :records="v.values"
                                v-model:count="showCounts['NamedNode'][k]"
                                :stepSize="defaultStep"
                            ></MoreOrLessRecordsViewer>
                            <span v-for="(el, i) in v.values">
                                <span v-if="i < showCounts['NamedNode'][k]">
                                    <span v-if="v.values.length > 1"><br />&nbsp;-</span>
                                    &nbsp;<NamedNodeViewer
                                        v-if="el.value"
                                        :textVal="el.value"
                                        :prefLabel="
                                            getPrefLabel(el, rdfDS, allPrefixes)
                                        "
                                        :displayLabel="
                                            getRecordDisplayLabel(el, rdfDS, allPrefixes, configVarsMain)
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
                        </span>
                        <span v-else>
                            <strong>{{ k }}bla</strong
                            >:
                            <span v-for="(el, i) in v.values">
                                <span v-if="i < showCounts['NamedNode'][k]">
                                    <span v-if="v.values.length > 1"><br />&nbsp;-</span>
                                    &nbsp;{{ el.value }}
                                </span>
                            </span>
                        </span>
                        <br>                        
                    </span>
                </span>
            </span>
            <!-- Now show all blank nodes for which a display label has been configured, which makes them special-->
            <!-- TODO: how do we deal with preflabel here ??? -->
            <span v-for="(v,k) in specialBlankNodes">
                <strong>
                    {{
                        nameOrCURIE(
                            propertyShapes[k],
                            shapesDS.data.prefixes,
                            true
                        )
                    }}
                </strong>:&nbsp;&nbsp;<MoreOrLessRecordsViewer
                    :records="v.values"
                    v-model:count="showCounts['BlankNodeSpecial'][k]"
                    :stepSize="defaultStep"
                ></MoreOrLessRecordsViewer>
                <span v-for="(item, i) in v.displayLabels">
                    <span v-if="i < showCounts['BlankNodeSpecial'][k]" class="line-item">
                        &nbsp;-&nbsp; <LiteralNodeViewer :textVal="item.displayLabel" :wrap="'nowrap'" :width="600" :allowLink="false"></LiteralNodeViewer>
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
                    <strong>
                        {{
                            nameOrCURIE(
                                propertyShapes[k],
                                shapesDS.data.prefixes,
                                true
                            )
                        }}
                    </strong>: &nbsp;<MoreOrLessRecordsViewer
                        :records="v.values"
                        v-model:count="showCounts['BlankNode'][k]"
                        :stepSize="defaultStep"
                    ></MoreOrLessRecordsViewer>
                    <br />
                    <span v-if="specialBlankNodes[k]?.displayLabels">
                        <span v-for="(item, i) in specialBlankNodes[k]?.displayLabels">
                            <div v-if="i < showCounts['BlankNode'][k]">
                                <BlankNodeViewer :node="item.value" />
                            </div>
                        </span>
                    </span>
                    <span v-else>
                        <span v-for="(el, i) in v.values">
                            <div v-if="i < showCounts['BlankNode'][k]">
                                <BlankNodeViewer :node="el"></BlankNodeViewer>
                            </div>
                        </span>
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
    ref,
    watch,
    provide,
    computed,
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
    getRecordQuads,
    getRecordDisplayLabel,
    hasConfigDisplayLabel,
} from '../modules/utils';
import { RDF, SHACL } from '@/modules/namespaces';
import MoreOrLessRecordsViewer from './MoreOrLessRecordsViewer.vue';
import { useCompConfig } from '@/composables/useCompConfig';
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
const lastSavedNode = inject('lastSavedNode');
const record = reactive({});
const showBlankNodes = ref(false);
const shape_obj = shapesDS.data.nodeShapes[props.classIRI];
const resolveExternally = ref(false);
const linkCopied = ref(false)
const showCopyLink = ref(false)
const propertyShapes = {};
for (var p of shape_obj.properties) {
    propertyShapes[p[SHACL.path.value]] = p;
}
const {componentName, componentConfig} = useCompConfig(configVarsMain);
const defaultStep = componentConfig?.recordNumberStepSize;
const showCounts = reactive(
    {
        'Literal': {},
        'NamedNode': {},
        'BlankNode': {},
        'BlankNodeSpecial': {},
    }
);

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
    if (configVarsMain.allowCopyRecordUrls === true ||
        ( Array.isArray(configVarsMain.allowCopyRecordUrls) &&
        configVarsMain.allowCopyRecordUrls.indexOf(props.classIRI) >= 0 )
    ) {
        showCopyLink.value = true;
    }
    canEditClass.value = configVarsMain.noEditClasses.indexOf(props.classIRI) < 0 ? true : false
    fetchingRecords.value = true;
    await updateRecord(true);
    fetchingRecords.value = false;
    let recordPIDprefix = toCURIE(props.quad.subject.value, allPrefixes, 'parts').prefix;
    if (configVarsMain['idResolvesExternally'].indexOf(recordPIDprefix) >= 0) {
        resolveExternally.value = true;
    }
    initShowCounts();
});

const specialBlankNodes = computed( () => {
    const triples = record.triples?.['BlankNode'] ?? {};
    const result = {};
    for (const [key, v] of Object.entries(triples)) {
        if (!v.configDisplayLabel || !Array.isArray(v.values)) continue
        const merged = v.values.map((value, i) => ({
            value,
            displayLabel: v.displayLabels?.[i] ?? '',
        }))
        const sorted = merged.sort((a, b) => {
            // display labels starting with 'http' are deprioritized
            const aIsHttp = a.displayLabel.trim().toLowerCase().startsWith('http')
            const bIsHttp = b.displayLabel.trim().toLowerCase().startsWith('http')
            if (aIsHttp && !bIsHttp) return 1
            if (!aIsHttp && bIsHttp) return -1
            // within each group, sort alphabetically
            return a.displayLabel.localeCompare(b.displayLabel, undefined, { sensitivity: 'base' })
        })
        result[key] = {
            ...v,
            displayLabels: sorted,
        }
    }
    return result
})


async function viewRDF() {
    ttlDialog.value = false;
    ttlDialog_icon.value = getClassIcon(props.classIRI);
    ttlDialog_name.value = record.prefLabel ? record.prefLabel : record.title;
    ttlDialog_type.value = toCURIE(record.subtitle, allPrefixes);
    var rQs = getRecordQuads(record.value, rdfDS.data.graph, true)
    var tmpStr = await quadsToTTL(rQs, allPrefixes);
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

function initShowCounts() {
    for (const n of ['BlankNodeSpecial', 'BlankNode', 'NamedNode', 'Literal']) {
        const nt = n == 'BlankNodeSpecial' ? 'BlankNode' : n
        for (const pred in record.triples[nt]) {
            if (!showCounts[n].hasOwnProperty(pred)) {
                showCounts[n][pred] = defaultStep;
            }
        }
    }
}


async function updateRecord(fetchData, from) {
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
    record.displayLabel = getRecordDisplayLabel(record.quad.subject, rdfDS, allPrefixes, configVarsMain)    
    // Now we have all record.triples, and we need to get displaylabels for blanknodes
    for (const triplePred in record.triples['BlankNode']) {
        let cIRI = propertyShapes[triplePred][SHACL.class.value];
        record.triples['BlankNode'][triplePred].classIRI = cIRI;
        record.triples['BlankNode'][triplePred].configDisplayLabel = hasConfigDisplayLabel(cIRI, allPrefixes, configVarsMain);
        for (var i=0; i<record.triples['BlankNode'][triplePred].values.length; i++) {
            let tripNode = record.triples['BlankNode'][triplePred].values[i]
            let dL = getRecordDisplayLabel(tripNode, rdfDS, allPrefixes, configVarsMain)
            let pL = getPrefLabel(tripNode, rdfDS, allPrefixes)
            record.triples['BlankNode'][triplePred].displayLabels.push(dL)
            record.triples['BlankNode'][triplePred].prefLabels.push(pL)
        }
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
        record.triples[termType][quad.predicate.value] = {
            values: [],
            displayLabels: [],
            prefLabels: [],
        };
    }
    record.triples[termType][quad.predicate.value].values.push(quad.object);
}

// trigger record update whenever lastSavedNode is updated, i.e. whenever a form is saved
watch(
    lastSavedNode, async (savedNode) => {
        if (savedNode) {
            if (savedNode.node_iri == record.value) {
                await updateRecord(false, 'lastSavedNode')
                initShowCounts();
            }
        }
    }
)

function copyRecordLink() {
    var nodeShapeCurie = toCURIE(props.classIRI, allPrefixes);
    var pidCurie = toCURIE(props.quad.subject.value, allPrefixes);
    var nsQPvar = encodeURIComponent('sh:NodeShape')
    var nsQP = encodeURIComponent(nodeShapeCurie)
    var pidQP = encodeURIComponent(pidCurie)
    var queryParams = `?${nsQPvar}=${nsQP}&pid=${pidQP}`;
    var urlText = window.location.origin + window.location.pathname + queryParams
    copyTextToClipboard(urlText)
}

async function copyTextToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        linkCopied.value = true
        setTimeout(() => {
            linkCopied.value = false;
        }, 1000);
    } catch (err) {
        console.error('Clipboard copy failed:', err);
    }
}
</script>

<style scoped>
.line-item {
    display: block;
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.card-title {
    display: inline-block;
    text-wrap: wrap;
    max-width: 90%;
    line-height: 1.2em;
    vertical-align: middle;
}
</style>