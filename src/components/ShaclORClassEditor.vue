<template>
    <v-input
        v-model="internalValue"
        :rules="rules"
        ref="fieldRef"
        :id="inputId"
        hide-details="auto"
        :style="orElementSelected ? 'margin-bottom: 1em;' : ''"
    >
        <v-col>
        <v-row>
            <v-select
                v-model="subValues.selectedClassIRI"
                :items="orList"
                density="compact"
                variant="outlined"
                label="select type"
                item-value="value"
                item-title="title"
                ref="selector"
                @update:modelValue="selectORelement"
            >
            </v-select>
        </v-row>
        <v-row v-if="orElementSelected">
            <v-menu v-model="menu" location="bottom">
                <template #activator="{ props }">
                    <v-text-field
                        v-model="queryText"
                        v-bind="props"
                        variant="outlined"
                        placeholder="select an item"
                        style="margin-bottom: 0"
                        :label="queryLabel"
                        @click.stop="openMenu()"
                        :append-inner-icon="menu ? 'mdi-chevron-down' : 'mdi-chevron-right'"
                        :prepend-inner-icon="selectedItemIcon"
                        :loading="fetchingRecordLoader"
                    >
                        <template v-slot:append-inner>
                            <v-icon v-if="showClearIcon" class="mr-2" @click.stop="clearField()" @mousedown.stop.prevent>
                                mdi-close-circle
                            </v-icon>
                        </template>
                    </v-text-field>
                </template>
                <v-card style="margin-top: 0">
                    <span v-if="itemsToList.length">
                        <DynamicScroller
                            style="max-height: 200px; overflow-y: auto"
                            :items="filteredItems"
                            :min-item-size="10"
                            overflow-y
                            key-field="value"
                            class="virtual-scroller"
                            ref="scrollerRef"
                            @scroll-end="onScrollEnd"
                        >
                            <template v-slot="{ item, index, active }">
                                <DynamicScrollerItem
                                    :item="item"
                                    :active="active"
                                    class="scroller-item"
                                >
                                    <v-list-item
                                        @click.stop="selectItem(item)"
                                        rounded
                                        :active="subValues.selectedInstance?.value == item.value"
                                        class="myInstancesList"
                                    >
                                        <template v-slot:prepend>
                                            <v-icon>
                                                {{ getClassIcon(toIRI(item.props[toCURIE(RDF.type.value, allPrefixes)], allPrefixes)) }}
                                            </v-icon>
                                        </template>
                                        <span v-if="item.props.hasPrefLabel">
                                            {{
                                                item.props[toCURIE(SKOS.prefLabel.value, allPrefixes)]
                                            }}
                                        </span>
                                        <span v-else>
                                            <span v-for="(value, key, index) in item.props">
                                                <v-row
                                                    no-gutters
                                                    v-if="['title','subtitle','name','value', RDF.type.value, toCURIE(RDF.type.value, allPrefixes)].indexOf(key) < 0"
                                                >
                                                    <v-col cols="6"><small>{{key}}</small></v-col>
                                                    <v-col><small>{{value}}</small></v-col>
                                                </v-row>
                                            </span>
                                        </span>
                                    </v-list-item>
                                    <v-divider></v-divider>
                                    <v-divider></v-divider>
                                </DynamicScrollerItem>
                            </template>
                            <template #after>
                                <div v-if="isFetchingPage" :style="'margin: auto; margin-bottom: 2em; text-align: center; color: ' + configVarsMain.appTheme.link_color + ';'">
                                    <v-progress-circular indeterminate :size="26" :width="4"></v-progress-circular>
                                </div>
                            </template>
                        </DynamicScroller>
                    </span>
                    <span v-else>
                        <v-card-text> No items </v-card-text>
                    </span>
                </v-card>
            </v-menu>
        </v-row>
        </v-col>
    </v-input>
</template>

<script setup>
import { computed, inject, ref, toRaw, onBeforeMount, nextTick, watch, onBeforeUnmount} from 'vue';
import { useRules } from '../composables/rules';
import { useRegisterRef } from '../composables/refregister';
import { useBaseInput } from '@/composables/base';
import { toCURIE, toIRI } from 'shacl-tulip';
import { getAllClasses, findObjectByKey} from '@/modules/utils';
import { RDF, RDFS, SKOS } from '@/modules/namespaces';
import { DataFactory } from 'n3';
import { debounce } from 'lodash-es';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
const { namedNode } = DataFactory;

// ----- //
// Props //
// ----- //

const props = defineProps({
    modelValue: String,
    property_shape: Object,
    node_uid: String,
    node_idx: String,
    triple_uid: String,
    triple_idx: Number,
});

// ---- //
// Data //
// ---- //

const itemsToList = ref([]);
const { rules } = useRules(props.property_shape);
const inputId = `input-${Date.now()}`;
const { fieldRef } = useRegisterRef(inputId, props);
const emit = defineEmits(['update:modelValue']);
const { subValues, internalValue } = useBaseInput(
    props,
    emit,
    valueParser,
    valueCombiner
);
const rdfDS = inject('rdfDS');
const shapesDS = inject('shapesDS');
const classDS = inject('classDS');
const allPrefixes = inject('allPrefixes');
const config = inject('config');
const fetchingDataLoader = ref(false);
const fetchingRecordLoader = ref(false);
const fetchFromService = inject('fetchFromService');
const hasUnfetchedPages = inject('hasUnfetchedPages');
const getClassIcon = inject('getClassIcon')
const configVarsMain = inject('configVarsMain')
const selector = ref(null);
const orElementSelected = ref(false);
const isFetchingPage = ref(false);
const menu = ref(false)
const queryText = ref('');
const queryLabel = ref('');
const scrollerRef = ref(null);

function onScrollEnd() {
    debouncedScrollEnd();
}

const debouncedScrollEnd = debounce(async () => {
    console.log("NEAR BOTTOM OF SCROLLER")
    if (config.value.use_service) {
        
        isFetchingPage.value = true;
        const allclass_array = getAllClasses(classDS, subValues.value.selectedClassIRI);
        try {
            for (const iri of allclass_array) {
                if (hasUnfetchedPages(iri)) {
                    var result = await fetchFromService('get-paginated-records', iri, allPrefixes)
                    if (result.status === null) {
                        console.error(result.error);
                    }
                }
            }
            getItemsToList();
        }
        finally {
            isFetchingPage.value = false;
        }
    }
}, 1000);

function valueParser(value) {
    // Parsing internalValue into ref values for separate subcomponent(s)
    if (!itemsToList.value) {
        return { selectedInstance: null };
    }
    var inst = findObjectByKey(itemsToList.value, "value", value)
    return { selectedInstance: inst ?? null }
}

function valueCombiner(values) {
    // Determine internalValue from subvalues/subcomponents
    return values.selectedInstance ? values.selectedInstance.value : null
}

function selectItem(item) {
    console.log(item);
    subValues.value.selectedInstance = item;
    queryLabel.value = subValues.value.selectedInstance.props._prefLabel
        ? subValues.value.selectedInstance.props._prefLabel
        : '(selected item name unknown)';
    queryText.value = '';
    menu.value = false;
}

const selectedItemIcon = computed(() => {
    if (subValues.value.selectedInstance) {
        return getClassIcon(toIRI(subValues.value.selectedInstance.props[toCURIE(RDF.type.value, allPrefixes)],allPrefixes));
    } else {
        return null;
    }
});

const openMenu = () => {
    menu.value = true;
};

const showClearIcon = computed(() => {
    if (queryText.value || subValues.value.selectedInstance) {
        return true;
    }
    return false;
});

function clearField() {
    menu.value = false;
    subValues.value.selectedInstance = null;
    queryText.value = '';
    queryLabel.value = '';
}


onBeforeMount(async () => {
    // If the modelvalue exists when the component mounts, we should:
    // - fetch that record
    // - find the quad with the record PID as subject and rdf:type as predicate, in order to get class
    // - use the class to set the selected value of the OR select component
    // - getItemsToList() - here we can technically only show the one record (unless all others have been fetched)
    //   - this needs the class to be available
    console.log("onBeforeMount ShaclORClassEditor:")
    if (props.modelValue) {
        const modelValue_copy = (' ' + props.modelValue).slice(1);
        fetchingRecordLoader.value = true;
        const results = await fetchFromService(
            'get-record',
            modelValue_copy,
            allPrefixes,
        );

        const typeQuads = rdfDS.data.graph.getQuads(
            namedNode(modelValue_copy),
            namedNode(RDF.type.value),
            null,
            null
        );
        console.log("typeQuads of fetched record:")
        console.log(typeQuads)
        if (typeQuads.length > 0) {
            subValues.value.selectedClassIRI = typeQuads[0].object.value
            orElementSelected.value = true;
            getItemsToList();
            await nextTick();
            setSelectedValue();
        }
        fetchingRecordLoader.value = false;
    }
});

const debouncedUpdate = debounce(() => {
    console.log('CHECK: graphdata shaclORclassEditor');
    getItemsToList();
    setSelectedValue();
}, 500);
watch(() => rdfDS.data.graphChanged, debouncedUpdate, { deep: true });

function setSelectedValue() {
    // Set selected value if the prop has a value
    if (props.modelValue) {
        console.log(props.modelValue)
        console.log("setSelectedValue()")
        var inst = findObjectByKey(
            itemsToList.value,
            'value',
            props.modelValue
        );
        if (inst) {
            subValues.value.selectedInstance = inst;
            queryLabel.value = subValues.value.selectedInstance.props._prefLabel
                ? subValues.value.selectedInstance.props._prefLabel
                : '(selected item name unknown)';
        } else {
            subValues.value.selectedInstance = null;
            queryLabel.value = '';
        }
    }
}

const orList = computed(() => {
    var items = [];
    console.log(props.property_shape);
    const or_array = props.property_shape[SHACL.or.value];
    console.log(or_array);
    console.log(or_array.length);
    for (var el of or_array) {
        console.log(`OR array element:`);
        console.log(toRaw(el));

        items.push({
            title: toCURIE(toRaw(el)[SHACL.class.value], shapesDS.data.prefixes),
            value: toRaw(el)[SHACL.class.value],
        });
    }
    console.log('Or list items');
    console.log(items);
    return items;
});

async function selectORelement(el) {
    const allclass_array = getAllClasses(classDS, subValues.value.selectedClassIRI);
    orElementSelected.value = true;
    fetchingDataLoader.value = true;
    if (config.value.use_service) {
        try {
            await getAllRecordsFromService(allclass_array);
            getItemsToList();
        } finally {
            fetchingDataLoader.value = false;
        }
    } else {
        getItemsToList();
        fetchingDataLoader.value = false;
    }
    setSelectedValue();
}

async function getAllRecordsFromService(iri_array) {    
    const fetchPromises = iri_array.map((iri) =>
        fetchFromService('get-paginated-records', iri, allPrefixes)
    );
    const results = await Promise.allSettled(fetchPromises);
    return results;
}


function getItemsToList() {
    // ---
    // The goal of this method is to populate the list of items for the
    // InstancesSelectEditor
    // ---
    // console.log("(Re)calculating instance items")
    // find nodes with predicate rdf:type and object being the property class
    // console.log("find nodes with predicate rdf:type and object being the property class:")
    var quads = rdfDS.getLiteralAndNamedNodes(
        namedNode(RDF.type.value),
        subValues.value.selectedClassIRI,
        allPrefixes
    );
    // then find nodes with predicate rdfs:subClassOf and object being the property class
    // TODO: here we are only using a named node for the object because this is how the
    // tools/gen_owl_minimal.py script outputs the triples in the ttl file. This should be
    // generalised
    const subClasses = classDS.data.graph.getQuads(
        null,
        namedNode(RDFS.subClassOf.value),
        namedNode(subValues.value.selectedClassIRI),
        null
    );
    // For each subclass, find the quads in graphData that has the class name as object
    // and RDF.type as predicate
    var myArr = [];
    subClasses.forEach((quad) => {
        const cl = quad.subject.value;
        // console.log(`\t - getting quads with class: ${cl}`)
        // console.log(`\t - (size of data graph: ${graphData.size})`)
        myArr = myArr.concat(
            rdfDS.getLiteralAndNamedNodes(
                namedNode(RDF.type.value),
                cl,
                allPrefixes
            )
        );
    });
    // Then combine all quad arrays
    // const combinedQuads = quads.concat(savedQuads).concat(myArr);
    const combinedQuads = quads.concat(myArr);
    // Finally, create list items from quads
    var itemsToListArr = [];
    combinedQuads.forEach((quad) => {
        var extra = '';
        if (quad.subject.termType === 'BlankNode') {
            extra = ' (BlankNode)';
        }
        var relatedTrips = rdfDS.getSubjectTriples(quad.subject);
        var item = {
            title: quad.subject.value + extra,
            value: quad.subject.value,
            props: {
                subtitle: toCURIE(quad.object.value, allPrefixes),
                hasPrefLabel: false,
            },
        };
        relatedTrips.forEach((quad) => {
            item.props[toCURIE(quad.predicate.value, allPrefixes)] = toCURIE(
                quad.object.value,
                allPrefixes
            );
            if (quad.predicate.value == SKOS.prefLabel.value) {
                item.props.hasPrefLabel = true;
                item.props._prefLabel = quad.object.value;
            }
        });
        itemsToListArr.push(item);
    });
    itemsToList.value = itemsToListArr;
}

const filteredItems = computed(() => {
    if (!itemsToList.value.length) return [];
    const searchText = queryText.value.toLowerCase();
    return [...itemsToList.value]
        .filter((item) => {
            if (searchText.length == 0) return true;
            return item.props._prefLabel
                ?.toLowerCase()
                .includes(searchText.toLowerCase());
        })
        .sort((a, b) =>
            a.props._prefLabel
                ?.toLowerCase()
                .localeCompare(b.props._prefLabel?.toLowerCase())
        );
});

</script>

<script>
import { SHACL } from '../modules/namespaces';
export const matchingLogic = (shape) => {
    // sh:or exists and all elements in array has sh:class key
    if (
        shape.hasOwnProperty(SHACL.or.value) &&
        Array.isArray(shape[SHACL.or.value]) &&
        shape[SHACL.or.value].every(obj => obj.hasOwnProperty(SHACL.class.value))
    ) {
        return true;
    }
    return false;
};
</script>
