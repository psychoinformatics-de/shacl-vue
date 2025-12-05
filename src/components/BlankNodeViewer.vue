<template>
    <v-card
        variant="text"
        class="d-inline-block"
        style="margin-bottom: 0; padding-bottom: 0; background-color: white"
        no-gutters
    >
        <v-card-text style="padding: 0.5em; background-color: white">
            <v-row align="center" class="d-inline-flex">
                <v-col style="flex: 0 0 30px; max-width: 30px;">
                    <v-icon class="mr-1">
                        {{
                            getClassIcon(
                                record.triples['NamedNode'][RDF.type.value][0].value
                            )
                        }}
                    </v-icon>
                </v-col>
                <v-col>
                    <!-- literal nodes -->
                    <span v-for="(v, k, index) in record.triples['Literal']">
                        <span v-if="propertyShapes[k]">
                            <em>
                                {{
                                    nameOrCURIE(
                                        propertyShapes[k],
                                        shapesDS.data.prefixes,
                                        true
                                    )
                                }}
                            </em>:
                        </span>
                        <span v-else>
                            <em>
                                {{
                                    makeReadable(
                                        toCURIE(k, allPrefixes, 'parts').property
                                    )
                                }}
                            </em>:
                        </span>
                        <span v-for="(el, i) in v">
                            <span v-if="v.length > 1"
                                ><br />&nbsp;-
                            </span>
                            &nbsp;<LiteralNodeViewer v-if="el.value" :textVal="el.value"></LiteralNodeViewer>
                        </span>
                        <br />
                    </span>
                    
                    <!-- named nodes -->
                    <span v-for="(v, k, index) in record.triples['NamedNode']">
                        <span v-if="k != RDF.type.value">
                            <span v-if="propertyShapes[k]">
                                <em>
                                    {{
                                        nameOrCURIE(
                                            propertyShapes[k],
                                            shapesDS.data.prefixes,
                                            true
                                        )
                                    }}
                                </em>:
                            </span>
                            <span v-else>
                                <em>
                                    {{
                                        makeReadable(
                                            toCURIE(k, allPrefixes, 'parts').property
                                        )
                                    }}
                                </em>:
                            </span>
                            <span v-for="(el, i) in v">
                                <span v-if="v.length > 1"
                                    ><br />&nbsp;-
                                </span>
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
                                        :allowLink="props.allowLink"
                                    >
                                </NamedNodeViewer>
                            </span>
                            <br />
                        </span>
                    </span>
                    <span v-for="(v, k, index) in record.triples['BlankNode']">
                        <em>
                            {{
                                makeReadable(
                                    toCURIE(k, allPrefixes, 'parts').property
                                )
                            }}
                        </em>:
                        <br />
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
import { reactive, onBeforeMount, inject, onUpdated } from 'vue';
import { toCURIE } from 'shacl-tulip';
import { makeReadable, nameOrCURIE, getPrefLabel, hasConfigDisplayLabel, getConfigDisplayLabel, getSubjectQuad, getPidQuad, getRecordDisplayLabel} from '../modules/utils';
import { RDF, SHACL} from '@/modules/namespaces';
// Define component properties
const props = defineProps({
    node: Object,
    allowLink: {
        type: Boolean,
        default: true,
    },
});

const allPrefixes = inject('allPrefixes');
const getClassIcon = inject('getClassIcon');
const rdfDS = inject('rdfDS');
const shapesDS = inject('shapesDS');
const configVarsMain = inject('configVarsMain');
const record = reactive({});
const subjQ = getSubjectQuad(props.node, rdfDS.data.graph)
const classIRI = subjQ.object.value;
const shape_obj = shapesDS.data.nodeShapes[classIRI];
const propertyShapes = {};
for (var p of shape_obj.properties) {
    propertyShapes[p[SHACL.path.value]] = p;
}

onBeforeMount(() => {
    updateRecord();
});

onUpdated(() => {
    updateRecord();
});

function updateRecord() {
    record.relatedQuads = rdfDS.getSubjectTriples(props.node);
    record.prefLabel = getPrefLabel(props.node, rdfDS, allPrefixes);
    record.triples = {
        Literal: {},
        BlankNode: {},
        NamedNode: {},
    };
    let labelTemplate = hasConfigDisplayLabel(classIRI, allPrefixes, configVarsMain)
    let labelParts = {}
    record.relatedQuads.forEach((rQ) => {
        addRecordProperty(rQ);
        // If current predicate is used for display label generation, store it
        let predCuri = toCURIE(rQ.predicate.value, allPrefixes)
        if ( labelTemplate && labelTemplate.includes(predCuri)) {
            if (!labelParts[predCuri]) {
                labelParts[predCuri] = []
            }
            labelParts[predCuri].push(rQ.object.value)
        }
    });
    record.displayLabel = '';
    if (labelTemplate) {
        record.displayLabel = getConfigDisplayLabel(labelTemplate, labelParts, configVarsMain, rdfDS, allPrefixes)
    }
}

function addRecordProperty(quad) {
    var termType = quad.object.termType;
    if (!record.triples[termType].hasOwnProperty(quad.predicate.value)) {
        record.triples[termType][quad.predicate.value] = [];
    }
    record.triples[termType][quad.predicate.value].push(quad.object);
}
</script>
