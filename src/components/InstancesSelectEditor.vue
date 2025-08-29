<template>
    <v-input
        v-model="internalValue"
        :rules="rules"
        ref="fieldRef"
        :id="inputId"
        hide-details="auto"
    >
        <v-menu v-model="menu" location="bottom"  hide-details="auto">
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
                     hide-details="auto"
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
            <v-card style="margin-top: 0; padding-top: 6px;">
                <v-progress-linear
                    v-if="showProgress"
                    v-model="currentProgress"
                    height="10"
                    :color="configVarsMain.appTheme.link_color"
                    class="menu-progress"
                    rounded
                >
                    <template v-slot:default="{ value }">
                        <span class="progress-text" v-if="!fetchingDataLoader">
                            <span v-if="fetchedItemCount">
                                {{fetchedItemCount}}<span v-if="totalItemCount && totalItemCount > fetchedItemCount">/{{ totalItemCount }}</span>
                            </span>
                        </span>
                    </template>
                </v-progress-linear>
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
                    <span v-if="canEditClass">
                        <v-list-item @click.stop :active="false">
                            <v-list-item-title>
                                <!-- When there is only one item, just show a button -->
                                <template v-if="propClassList.length === 1">
                                    <v-btn style="margin-top: 5px;" variant="tonal" @click.stop="handleAddItemClick(propClassList[0])">
                                        Add new item &nbsp;&nbsp;
                                        <v-icon icon="mdi-play"></v-icon>
                                    </v-btn>
                                </template>
                                <!-- When there are more items, show the menu -->
                                <template v-else>
                                    <v-menu v-model="addItemMenu" location="end">
                                        <template v-slot:activator="{ props }">
                                            <v-btn style="margin-top: 5px;" variant="tonal" v-bind="props"
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
                                </template>
                            </v-list-item-title>
                        </v-list-item>
                    </span>
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
                                        <span v-else-if="item.props.hasDisplayLabel">
                                            {{ item.props._displayLabel }}
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
                                                            'itemQuad',
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
                                        <template v-slot:append>
                                            <v-tooltip
                                                v-if="
                                                    item.props.hasNote &&
                                                    item.props[toCURIE(SKOS.note.value,allPrefixes)]
                                                "
                                                :text="item.props[toCURIE(SKOS.note.value,allPrefixes)]"
                                                location="top"
                                                max-width="400px"
                                                max-height="400px"
                                                persistent
                                            >
                                                <template v-slot:activator="{ props }">
                                                    <v-icon
                                                        icon="mdi-information-outline"
                                                        size="small"
                                                        v-bind="props"
                                                    ></v-icon>
                                                </template>
                                            </v-tooltip>
                                            <v-btn
                                                v-if="
                                                    configVarsMain.allowEditInstances === true ||
                                                    configVarsMain.allowEditInstances.indexOf(item.props.itemQuad.object.value) >= 0
                                                "
                                                icon="mdi-pencil"
                                                variant="text"
                                                size="x-small"
                                                @click="editInstanceItem(
                                                    {
                                                        quad: item.props.itemQuad,
                                                        value: item.value
                                                    }
                                                )"
                                                :disabled="!canEditClass"
                                            ></v-btn>
                                        </template>
                                    </v-list-item>
                                    <v-divider></v-divider>
                                    <v-divider></v-divider>
                                </DynamicScrollerItem>
                            </template>
                            <template #after>
                                <div class="after-loader" :style="'color: ' + configVarsMain.appTheme.link_color + ';'" >
                                    <v-progress-circular v-show="showFetchingPageLoader" indeterminate :size="26" :width="4"></v-progress-circular>
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
    watchEffect,
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
import { findObjectByKey, getAllClasses, hasConfigDisplayLabel, getConfigDisplayLabel} from '../modules/utils';
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
const showProgress = ref(true);
const totalItemCount = ref(0);
const fetchedItemCount = ref(0);
const showFetchingPageLoader = ref(false)
let hideTimeout = null
const inputRef = ref(null);
const queryText = ref('');
const queryLabel = ref('');
const menu = ref(false);
const addItemMenu = ref(false);
const scrollerRef = ref(null);
const itemsToList = ref([]);
const fetchingDataLoader = ref(false);
const fetchingRecordLoader = ref(false);
const editInstanceItem = inject('editInstanceItem');
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
const canEditClass = ref(true)
canEditClass.value = configVarsMain.noEditClasses.indexOf(propClass.value) < 0 ? true : false
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
                : (
                    subValues.value.selectedInstance.props._displayLabel ?
                    subValues.value.selectedInstance.props._displayLabel :
                    '(selected item name unknown)'
                )
        } else {
            subValues.value.selectedInstance = null;
            queryLabel.value = props.modelValue;
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
        fetchedItemCount.value = itemsToList.value.length;
        console.log("fetchedItemCount.value")
        console.log(fetchedItemCount.value)
    }
});

const openMenu = () => {
    if (hasOpenedMenu.value == false) {
        populateList();
        hasOpenedMenu.value = true
    }
    menu.value = true;
};

async function populateList() {
    fetchingDataLoader.value = true;
    if (config.value.use_service) {
        try {
            const result = await fetchFromService(
                'get-paginated-records',
                propClass.value,
                allPrefixes
            );
            if (result.status === null) {
                console.error(result.error);
            }
            console.log("populateList fetch from service result:")
            console.log(result)
            // We need to get total item count here in order to display progress
            totalItemCount.value = getTotalItemCount(result)
            console.log("totalItemCount.value")
            console.log(totalItemCount.value)
            getItemsToList();
            fetchedItemCount.value = itemsToList.value.length;
            console.log("fetchedItemCount.value")
            console.log(fetchedItemCount.value)
        } catch (err) {
            console.error(err);
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

function getTotalItemCount(results) {

    if (!results || !results.url || !Array.isArray(results.url)) {
        return 0; // nothing found, or no url array
    }
    // Sum pageMeta.total for objects with success: true
    return results.url.reduce((sum, obj) => {
        if (obj.success && obj.pageMeta && typeof obj.pageMeta.total === "number") {
            return sum + obj.pageMeta.total;
        }
        return sum;
    }, 0);
}

watch(isFetchingPage, (newVal) => {
    if (newVal) {
        // If fetching starts → show immediately
        if (hideTimeout) {
            clearTimeout(hideTimeout)
            hideTimeout = null
        }
        showFetchingPageLoader.value = true
    } else {
        // If fetching stops → wait before hiding
        hideTimeout = setTimeout(() => {
            showFetchingPageLoader.value = false
            hideTimeout = null
        }, 1000)
    }
})

// ------------------- //
// Computed properties //
// ------------------- //

const currentProgress = computed(() => {
    if (fetchingDataLoader.value) return 0
    if (!fetchedItemCount.value || !totalItemCount.value) return 0
    return  Math.ceil(fetchedItemCount.value / totalItemCount.value * 100)
})

function onScrollEnd() {
    debouncedScrollEnd();
}

const debouncedScrollEnd = debounce(async () => {
    console.log("NEAR BOTTOM OF SCROLLER")
    if (config.value.use_service) {
        if (isFetchingPage.value) return;
        fetchNextPage(propClass.value)
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
                fetchedItemCount.value = itemsToList.value.length;
                console.log("fetchedItemCount.value")
                console.log(fetchedItemCount.value)
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
                    queryLabel.value = subValues.value.selectedInstance.props._prefLabel
                    ? subValues.value.selectedInstance.props._prefLabel
                    : (
                        subValues.value.selectedInstance.props._displayLabel ?
                        subValues.value.selectedInstance.props._displayLabel :
                        '(selected item name unknown)'
                    )
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
    fetchedItemCount.value = itemsToList.value.length;
    console.log("fetchedItemCount.value")
    console.log(fetchedItemCount.value)
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
                : (
                    subValues.value.selectedInstance.props._displayLabel ?
                    subValues.value.selectedInstance.props._displayLabel :
                    '(selected item name unknown)'
                )
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
                itemQuad: quad,
                subtitle: toCURIE(quad.object.value, allPrefixes),
                hasPrefLabel: false,
                hasDisplayLabel: false,
                hasNote: false,
            },
        };
        let labelTemplate = hasConfigDisplayLabel(quad.object.value, allPrefixes, configVarsMain)
        let labelParts = {}
        relatedTrips.forEach((quad) => {
            let predCuri = toCURIE(quad.predicate.value, allPrefixes)
            item.props[predCuri] = toCURIE(quad.object.value, allPrefixes);
            if (quad.predicate.value == SKOS.prefLabel.value) {
                item.props.hasPrefLabel = true;
                item.props._prefLabel = quad.object.value;
            }
            if (quad.predicate.value == SKOS.note.value) {
                item.props.hasNote = true;
                item.props._note = quad.object.value;
            }
            // If current predicate is used for display label generation, store it
            if ( labelTemplate && labelTemplate.includes(predCuri)) {
                labelParts[predCuri] = quad.object.value
            }
        });
        // Generate display label if possible
        if (labelTemplate) {
            let displayLabel = getConfigDisplayLabel(labelTemplate, labelParts, configVarsMain)
            if (displayLabel) {
                item.props.hasDisplayLabel = true;
                item.props._displayLabel = displayLabel;
            }
        }
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

watchEffect(async () => {
    console.log("WATCHEFFECT")
    if (config.value?.use_service && queryText.value && hasUnfetchedPages(propClass.value)) {
        // Only trigger fetch if not already fetching
        if (!isFetchingPage.value) {
            await fetchNextPage(propClass.value);
        }
    }
});

async function fetchNextPage(iri) {
    if (!hasUnfetchedPages(iri)) {
        console.log(`Does not have unfetched pages: ${iri}`)
        return [];
    }
    isFetchingPage.value = true;
    let result = null
    try {
        result = await fetchFromService(
            'get-paginated-records',
            iri,
            allPrefixes
        );
        if (result.status === null) {
            console.error(result.error);
        }
        getItemsToList();
    } catch (err) {
        console.error(err);
    } finally {
        isFetchingPage.value = false;
        return result
    }   
}


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
.menu-progress {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
}
.after-loader {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.progress-text {
    font-size: xx-small;
}
</style>
