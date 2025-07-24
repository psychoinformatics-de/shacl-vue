<template>
    <v-input
        v-model="internalValue"
        :rules="rules"
        ref="fieldRef"
        :id="inputId"
        hide-details="auto"
    >
        <v-menu v-model="menu" location="bottom">
            <template #activator="{ props }">
                <v-text-field
                    v-model="queryText"
                    v-bind="props"
                    variant="outlined"
                    placeholder="select an item"
                    style="margin-bottom: 0"
                    :label="queryLabel"
                    ref="inputRef"
                    @click.stop="openMenu()"
                    :append-inner-icon="
                        menu ? 'mdi-chevron-down' : 'mdi-chevron-right'
                    "
                    :prepend-inner-icon="selectedItemIcon"
                    :loading="fetchingRecordLoader"
                >
                    <template v-slot:append-inner>
                        <v-icon
                            v-if="showClearIcon"
                            class="mr-2"
                            @click.stop="clearField()"
                            @mousedown.stop.prevent
                        >
                            mdi-close-circle
                        </v-icon>
                    </template>
                </v-text-field>
            </template>
            <v-card style="margin-top: 0">
                <span v-if="fetchingDataLoader">
                    <v-list-item
                        ><em
                            >Fetching items (this might take a while)</em
                        ></v-list-item
                    >
                    <v-skeleton-loader
                        type="list-item-avatar"
                    ></v-skeleton-loader>
                </span>
                <span v-else>
                    <v-list-item @click.stop :active="false">
                        <v-list-item-title>
                            <v-menu v-model="addItemMenu" location="end">
                                <template v-slot:activator="{ props }">
                                    <v-btn variant="tonal" v-bind="props"
                                        >Add new item &nbsp;&nbsp;
                                        <v-icon icon="item.icon"
                                            >mdi-play</v-icon
                                        ></v-btn
                                    >
                                </template>

                                <v-list ref="addItemList">
                                    <v-list-item
                                        v-for="item in propClassList"
                                        @click.stop="handleAddItemClick(item)"
                                    >
                                        <v-list-item-title>{{
                                            item.title
                                        }}</v-list-item-title>
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </v-list-item-title>
                    </v-list-item>
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
                                        :active="
                                            subValues.selectedInstance?.value ==
                                            item.value
                                        "
                                        class="myInstancesList"
                                    >
                                        <template v-slot:prepend>
                                            <v-icon>{{
                                                getClassIcon(
                                                    toIRI(
                                                        item.props[
                                                            toCURIE(
                                                                RDF.type.value,
                                                                allPrefixes
                                                            )
                                                        ],
                                                        allPrefixes
                                                    )
                                                )
                                            }}</v-icon>
                                        </template>
                                        <span v-if="item.props.hasPrefLabel">
                                            {{
                                                item.props[
                                                    toCURIE(
                                                        SKOS.prefLabel.value,
                                                        allPrefixes
                                                    )
                                                ]
                                            }}
                                        </span>
                                        <span v-else>
                                            <span
                                                v-for="(
                                                    value, key, index
                                                ) in item.props"
                                            >
                                                <v-row
                                                    no-gutters
                                                    v-if="
                                                        [
                                                            'title',
                                                            'subtitle',
                                                            'name',
                                                            'value',
                                                            RDF.type.value,
                                                            toCURIE(
                                                                RDF.type.value,
                                                                allPrefixes
                                                            ),
                                                        ].indexOf(key) < 0
                                                    "
                                                >
                                                    <v-col cols="6"
                                                        ><small>{{
                                                            key
                                                        }}</small></v-col
                                                    >
                                                    <v-col
                                                        ><small>{{
                                                            value
                                                        }}</small></v-col
                                                    >
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
                </span>
            </v-card>
        </v-menu>
    </v-input>
</template>

<script setup>
import {
    inject,
    watch,
    onBeforeMount,
    onMounted,
    ref,
    provide,
    computed,
    nextTick,
} from 'vue';
import { useRules } from '../composables/rules';
import { DataFactory } from 'n3';
import { SHACL, RDF, RDFS, SKOS } from '@/modules/namespaces';
import { findObjectByKey, getAllClasses } from '../modules/utils';
import { toCURIE, toIRI } from 'shacl-tulip';
import { useRegisterRef } from '../composables/refregister';
import { useBaseInput } from '@/composables/base';
import { debounce } from 'lodash-es';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
const { namedNode, literal } = DataFactory;

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

const inputRef = ref(null);
const queryText = ref('');
const queryLabel = ref('');
const menu = ref(false);
const addItemMenu = ref(false);
const scrollerRef = ref(null);

const itemsToList = ref([]);
const fetchingDataLoader = ref(false);
const fetchingRecordLoader = ref(false);
const rdfDS = inject('rdfDS');
const allPrefixes = inject('allPrefixes');
const classDS = inject('classDS');
const config = inject('config');
const fetchFromService = inject('fetchFromService');
const hasUnfetchedPages = inject('hasUnfetchedPages');
const isFetchingPage = ref(false);
const hasOpenedMenu = ref(false);
const configVarsMain = inject('configVarsMain')
const localPropertyShape = ref(props.property_shape);
const propClass = ref(null);
propClass.value = localPropertyShape.value[SHACL.class.value] ?? false;
const allclass_array = getAllClasses(classDS, propClass.value);
const propClassList = allclass_array.map((cl) => {
    return {
        title: toCURIE(cl, allPrefixes),
        value: cl,
    };
});
const { rules } = useRules(localPropertyShape.value);
const inputId = `input-${Date.now()}`;
const { fieldRef } = useRegisterRef(inputId, props);
const emit = defineEmits(['update:modelValue']);
const { subValues, internalValue } = useBaseInput(
    props,
    emit,
    valueParser,
    valueCombiner
);

const newNodeIdx = ref(null);
const addItemList = ref(null);

const selectedAddItemShapeIRI = ref(null);
const addForm = inject('addForm');
const getClassIcon = inject('getClassIcon');
// const activatedInstancesSelectEditor = inject('activatedInstancesSelectEditor')
const lastSavedNode = inject('lastSavedNode');
const openForms = inject('openForms');

const cancelDialogForm = () => {
    // console.log("Canceling from form in dialog")
    newNodeIdx.value = null;
};
provide('cancelFormHandler', cancelDialogForm);
const saveDialogForm = () => {
    // console.log("Saving from form in dialog")
    newNodeIdx.value = null;
};
provide('saveFormHandler', saveDialogForm);


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
function setSelectedValue() {
    // Set selected value if the prop has a value
    if (props.modelValue) {
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

function scrollToSelectedItem() {
    if (!subValues.value.selectedInstance) return;

    var index = filteredItems.value.findIndex(
        (item) => item.value === subValues.value.selectedInstance.value
    );

    if (index !== -1 && scrollerRef.value) {
        scrollerRef.value.scrollToItem(index);
    }
}

onMounted(async () => {});

onBeforeMount(async () => {
    if (props.modelValue) {
        fetchingRecordLoader.value = true;
        const results = await fetchFromService(
            'get-record',
            props.modelValue,
            allPrefixes
        );
        getItemsToList();
        await nextTick();
        setSelectedValue();
        scrollToSelectedItem();
        fetchingRecordLoader.value = false;
    }
});

const openMenu = () => {
    if (hasOpenedMenu.value == false) {
        populateList();
        hasOpenedMenu.value == true
    }
    menu.value = true;
};

async function populateList() {
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
    scrollToSelectedItem();
}

// ------------------- //
// Computed properties //
// ------------------- //

function onScrollEnd() {
    debouncedScrollEnd();
}

const debouncedScrollEnd = debounce(async () => {
    console.log("NEAR BOTTOM OF SCROLLER")
    if (config.value.use_service) {
        isFetchingPage.value = true;
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

// trigger whenever lastSavedNode is updated, i.e. whenever a form is saved
watch(
    lastSavedNode,
    (savedNode) => {
        if (savedNode) {
            if (!openForms.at(-1).activatedInstancesSelectEditor) {
                return;
            }
            // First check if the current component is also the activatedInstancesSelectEditor
            // If not, do nothing
            if (
                openForms.at(-1).activatedInstancesSelectEditor.nodeshape_iri ==
                    props.node_uid &&
                openForms.at(-1).activatedInstancesSelectEditor.node_iri ==
                    props.node_idx &&
                openForms.at(-1).activatedInstancesSelectEditor.predicate_iri ==
                    props.triple_uid &&
                openForms.at(-1).activatedInstancesSelectEditor.predicate_idx ==
                    props.triple_idx
            ) {
                // If this is the instancesSelectEditor instance that activated the recently saved
                // and closed form, we want to set the selected instance as the saved node
                // This is the format of savedNode:
                // {
                //     nodeshape_iri: nodeshape_iri,
                //     node_iri: subject_iri
                // }
                // First, let's make sure the list is updated to include the recently saved node:
                getItemsToList();
                // Then we need to set the selectedInstance. The itemsToList has items as objects,
                // with value = quad.subject.value.
                // We need to find the item that has the value being the same as the saved node's node_iri:
                var inst = findObjectByKey(
                    itemsToList.value,
                    'value',
                    savedNode.node_iri
                );
                if (inst) {
                    subValues.value.selectedInstance = inst;
                } else {
                    console.log(
                        'A node was recently saved but it could not be found in the itemsToList and was therefore not set as the selectedItem'
                    );
                }
                openForms.at(-1).activatedInstancesSelectEditor = null;
                lastSavedNode.value = null;
            } else {
                console.log(
                    'activatedInstancesSelectEditor is not the same as last saved node'
                );
            }
        }
    },
    { immediate: true }
);

const debouncedUpdate = debounce(() => {
    console.log('CHECK: graphdata instanceselecteditor');
    getItemsToList();
    setSelectedValue();
}, 500);
watch(() => rdfDS.data.graphChanged, debouncedUpdate, { deep: true });

const selectedItemIcon = computed(() => {
    if (subValues.value.selectedInstance) {
        return getClassIcon(
            toIRI(
                subValues.value.selectedInstance.props[
                    toCURIE(RDF.type.value, allPrefixes)
                ],
                allPrefixes
            )
        );
    } else {
        return null;
    }
});

// --------- //
// Functions //
// --------- //

function valueParser(value) {
    // Parsing internalValue into ref values for separate subcomponent(s)
    if (!itemsToList.value) {
        return { selectedInstance: null };
    }
    var inst = findObjectByKey(itemsToList.value, 'value', value);
    return { selectedInstance: inst ?? null };
}

function valueCombiner(values) {
    // Determine internalValue from subvalues/subcomponents
    return values.selectedInstance ? values.selectedInstance.value : null;
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

function handleAddItemClick(item) {
    openForms.at(-1).activatedInstancesSelectEditor = {
        nodeshape_iri: props.node_uid,
        node_iri: props.node_idx,
        predicate_iri: props.triple_uid,
        predicate_idx: props.triple_idx,
    };
    selectedAddItemShapeIRI.value = item.value;
    newNodeIdx.value = crypto.randomUUID();
    console.log('New form shape IRI');
    console.log(selectedAddItemShapeIRI.value);
    console.log('New form node IRI');
    console.log(newNodeIdx.value);
    addItemMenu.value = false;
    addForm(selectedAddItemShapeIRI.value, newNodeIdx.value, 'new');
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
        propClass.value,
        allPrefixes
    );
    // then find nodes with predicate rdfs:subClassOf and object being the property class
    // TODO: here we are only using a named node for the object because this is how the
    // tools/gen_owl_minimal.py script outputs the triples in the ttl file. This should be
    // generalised
    const subClasses = classDS.data.graph.getQuads(
        null,
        namedNode(RDFS.subClassOf.value),
        namedNode(propClass.value),
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

// filter and sort
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

<!-- Component matching logic -->

<script>
import { SHACL } from '@/modules/namespaces';
export const matchingLogic = (shape) => {
    // sh:nodeKind exists
    if (shape.hasOwnProperty(SHACL.nodeKind.value)) {
        // sh:nodeKind == sh:IRI ||
        // sh:nodeKind == sh:BlankNodeOrIRI ||
        return [SHACL.IRI.value, SHACL.BlankNodeOrIRI.value].includes(
            shape[SHACL.nodeKind.value]
        );
    }
    return false;
};
</script>

<style scoped>
.info-tooltip {
    cursor: pointer;
}
</style>
