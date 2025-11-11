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
                    :placeholder="
                    configVarsMain.serviceConstrainedSearch.min_characters ?
                    `select an item | enter at least ${configVarsMain.serviceConstrainedSearch.min_characters} characters to search all records` :
                    `search/select an item`
                    "
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
                <span v-if="fetchingDataLoader">
                    <v-list-item>
                        <small>
                        <em>
                            {{ fetchingText }}
                        </em>
                        </small>
                        <v-progress-linear :color="configVarsMain.appTheme.link_color" indeterminate></v-progress-linear>
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
                        :emit-update="true"
                        @scroll-end="onScrollEnd"
                        @resize="onScrollerReady"
                        @update="onScrollerUpdate"
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
                                                        'title', 'subtitle', 'name', 'value',
                                                        'itemQuad', 'relatedQuads', 'isTemp',
                                                        'hasPrefLabel', 'hasDisplayLabel', 'hasNote',
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
                                            @click="editItem(item)"
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
                                <span v-if="!showFetchingPageLoader && filteredItems.length == 0" style="color: grey"><em>No items</em></span>
                            </div>
                        </template>
                    </DynamicScroller>
                </span>
                <span v-else>
                    <span v-if="!fetchingDataLoader"><v-card-text> No items </v-card-text></span>
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
    ref,
    provide,
    computed,
    nextTick,
} from 'vue';
import { useRules } from '../composables/rules';
import { DataFactory } from 'n3';
import { SHACL, RDF, SKOS } from '@/modules/namespaces';
import {
    findObjectByKey,
    hasConfigDisplayLabel,
    getConfigDisplayLabel,
    nodeShapeHasPID,
    hashSubgraph,
} from '../modules/utils';
import { toCURIE, toIRI } from 'shacl-tulip';
import { useRegisterRef } from '../composables/refregister';
import { useBaseInput } from '@/composables/base';
import { debounce } from 'lodash-es';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
const { namedNode, blankNode, quad,} = DataFactory;

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
const shapesDS = inject('shapesDS');
const ID_IRI = inject('ID_IRI');
const nsHasPID = ref(true);
const visibleRange = ref({
    startIndex: 0,
    endIndex: 0,
    visibleStartIndex: 0,
    visibleEndIndex: 0
})
const config = inject('config');
const fetchFromService = inject('fetchFromService');
const hasUnfetchedPages = inject('hasUnfetchedPages');
const getTotalItems = inject('getTotalItems');
const firstPageFetched = inject('firstPageFetched');
const isFetchingPage = ref(false);
const hasOpenedMenu = ref(false);
const configVarsMain = inject('configVarsMain')
const includeClass = inject('includeClass');
const allSubClasses = inject('allSubClasses');
const localPropertyShape = ref(props.property_shape);
const propClass = ref(null);
propClass.value = localPropertyShape.value[SHACL.class.value] ?? false;
// Prepare array of the base class and all of it subclasses
let allclass_array = [propClass.value]
if (Array.isArray(allSubClasses[propClass.value]) && allSubClasses[propClass.value].length > 0 ) {
    allclass_array = allclass_array.concat(allSubClasses[propClass.value])
}
const propClassList = allclass_array.map((cl) => {
    configVarsMain.noEditClasses
    if (includeClass(cl) && configVarsMain.noEditClasses.indexOf(cl) < 0) {
        return {
            title: toCURIE(cl, allPrefixes, "parts").property,
            value: cl,
        };
    }
}).filter((el) => {
   return el !== undefined;
}).sort((a,b) =>{
    return a.title.localeCompare(b.title)
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
const lastSavedNode = inject('lastSavedNode');
const openForms = inject('openForms');

const cancelDialogForm = () => {
    newNodeIdx.value = null;
};
provide('cancelFormHandler', cancelDialogForm);
const saveDialogForm = () => {
    newNodeIdx.value = null;
};
provide('saveFormHandler', saveDialogForm);
let debounceTypingTimer = null;
const fetchingText = configVarsMain.editorConfig?.InstancesSelectEditor?.fetchingsRecordsText;


const showClearIcon = computed(() => {
    if ((!menu.value) && subValues.value.selectedInstance) {
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

async function scrollToSelectedItem() {
    const scroller = scrollerRef.value
    const selectedItem = subValues.value.selectedInstance
    if (!selectedItem || !scroller) return
    // Find the index of the selected item
    const index = filteredItems.value.findIndex(
        (item) => item.value === selectedItem.value
    )
    if (index === -1) return
    // Helper: check if index is visible
    const isVisible = () => {
        const { startIndex, endIndex } = visibleRange.value
        return index >= startIndex && index <= endIndex
    }
    // If not visible, scroll until it is
    let attempts = 0
    while (!isVisible() && attempts++ < 5) {
        scroller.scrollToItem(index)
        // Wait for DOM + scroller update
        await nextTick()
        await new Promise(r => setTimeout(r, 50))
    }
}

onBeforeMount(async () => {
    nsHasPID.value = nodeShapeHasPID(propClass.value, shapesDS, ID_IRI.value)
    if (props.modelValue) {
        fetchingRecordLoader.value = true;
        if (config.value.use_service && nsHasPID.value) {
            const results = await fetchFromService(
                'get-record',
                props.modelValue,
                allPrefixes
            );
        }
        getSingleItemToList(props.modelValue);
        setSelectedValue();
        fetchingRecordLoader.value = false;
        fetchedItemCount.value = itemsToList.value.length;
    }
});

const openMenu = async () => {
    if (hasOpenedMenu.value == false) {
        populateList();
        hasOpenedMenu.value = true
    }
    menu.value = true;    
};

function onScrollerReady() {
    setTimeout(() => {
        scrollToSelectedItem();
    }, 200)
}

function onScrollerUpdate(startIndex, endIndex, visibleStartIndex, visibleEndIndex) {
    visibleRange.value = { startIndex, endIndex, visibleStartIndex, visibleEndIndex }
}

watch(menu, (newVal) => {
    if (!newVal) {
        queryText.value = '';
    }
})

async function populateList() {
    fetchingDataLoader.value = true;
    await getItemsToList();
    if (config.value.use_service && nsHasPID.value) {
        try {
            const result = await fetchFromService(
                'get-paginated-records-constrained',
                propClass.value,
                allPrefixes
            );
            if (result.status === null) {
                console.error(result.error);
            }
            console.log("populateList fetch from service result:")
            console.log(result)
            // We need to get total item count here in order to display progress
            totalItemCount.value = getTotalItems(propClass.value)
            console.log("totalItemCount.value")
            console.log(totalItemCount.value)
            await getItemsToList();
            fetchedItemCount.value = itemsToList.value.length;
            console.log("fetchedItemCount.value")
            console.log(fetchedItemCount.value)
        } catch (err) {
            console.error(err);
        } finally {
            fetchingDataLoader.value = false;
        }
    } else {
        fetchingDataLoader.value = false;
    }
    fetchedItemCount.value = itemsToList.value.length;
    setSelectedValue();
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
    // Only fetch new items at bottom of scroller if there is not any queryText
    // Continued fetching of more items while there is queryText will be handled
    // by the watcheffect function.
    if (queryText.value) {
        return
    }
    if (config.value.use_service && nsHasPID.value) {
        if (isFetchingPage.value) return;
        fetchNextPage(propClass.value)
    }
}, 1000);

// trigger whenever lastSavedNode is updated, i.e. whenever a form is saved
watch(
    lastSavedNode,
    async (savedNode) => {
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
                await getItemsToList();
                fetchedItemCount.value = itemsToList.value.length;
                // Then we need to set the selectedInstance. The itemsToList has items as objects,
                // with value = quad.subject.value.
                // We need to find the item that has the value being the same as the saved node's node_iri
                // This holds for named node records. However, the process is different for blank node
                // records since the introduction of the blank node deduplication process. In getItemsToList,
                // the deduplication will assign a quad with a new blank node as subject to item.props.itemQuad.
                // Hence the item value will not be the same anymore as logged by savedNode.node_iri. For
                // blank nodes, we have to look at the subject value of all the relatedQuads, because they
                // reflect the 'true' state before deduplication.
                let inst = null
                for (const listItem of itemsToList.value) {
                    if (listItem.props.itemQuad.subject.termType === "NamedNode") {
                        if (listItem.value == savedNode.node_iri) {
                            inst = listItem;
                            break;
                        }
                    } else {
                        const originalBNid = Array.from(new Set(listItem.props.relatedQuads.map((x) => x.subject.value)))[0];
                        if (originalBNid == savedNode.node_iri) {
                            inst = listItem;
                            break;
                        }
                    }
                }
                if (inst) {
                    // we need to use selectItem so as to trigger processTempItem
                    selectItem(inst)
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
    if (subValues.value.selectedInstance?.value == item.value) {
        queryText.value = '';
        menu.value = false;
        return
    }
    processTempItem(item)
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

function editItem(item) {
    processTempItem(item)
    editInstanceItem(
        {
            quad: item.props.itemQuad,
            value: item.value
        }
    )
}

function processTempItem(item) {
    // First check if this is a temporary item (i.e. blank node copy)
    // If it is, we need to:
    // - create and link all related triple copies
    // - replace the item.props.relatedQuads with the newly created quads
    // - set isTemp flag to false:
    // - add all quads to the graph
    if (item.props.isTemp) {
        const newRelatedQuads = item.props.relatedQuads.map(q => {
            return quad(item.props.itemQuad.subject, q.predicate, q.object, q.graph);
        });
        item.props.relatedQuads = newRelatedQuads;
        item.props.isTemp = false;
        rdfDS.data.graph.addQuads(newRelatedQuads);
    }
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

function prepareItem(myQuad, isTemp = false) {
    return {
        title: myQuad.subject.value,
        value: myQuad.subject.value,
        props: {
            isTemp: isTemp,
            itemQuad: myQuad,
            relatedQuads: [],
            subtitle: toCURIE(myQuad.object.value, allPrefixes),
            hasPrefLabel: false,
            hasDisplayLabel: false,
            hasNote: false,
            itemValue: myQuad.subject.value,
        },
    };
}

function addItemParts(item, myQuad, relatedQuads) {
    let labelTemplate = hasConfigDisplayLabel(myQuad.object.value, allPrefixes, configVarsMain)
    let labelParts = {}
    // add item properties: predicates and objects
    // isolate properties used in label generation, if applicable
    item.props.relatedQuads = relatedQuads;
    relatedQuads.forEach((trip) => {
        let predCuri = toCURIE(trip.predicate.value, allPrefixes)
        item.props[predCuri] = toCURIE(trip.object.value, allPrefixes);
        if (trip.predicate.value == SKOS.prefLabel.value) {
            item.props.hasPrefLabel = true;
            item.props._prefLabel = trip.object.value;
        }
        if (trip.predicate.value == SKOS.note.value) {
            item.props.hasNote = true;
            item.props._note = trip.object.value;
        }
        // If current predicate is used for display label generation, store it
        if ( labelTemplate && labelTemplate.includes(predCuri)) {
            if (!labelParts[predCuri]) {
                labelParts[predCuri] = []
            }
            labelParts[predCuri].push(trip.object.value)
        }
    });
    // Generate display label if possible
    if (labelTemplate) {
        let displayLabel = getConfigDisplayLabel(labelTemplate, labelParts, configVarsMain, rdfDS, allPrefixes)
        if (displayLabel) {
            item.props.hasDisplayLabel = true;
            item.props._displayLabel = displayLabel;
        }
    }
}

function getSingleItemToList(subjectValue) {
    // This function is called to populate the dropdown list with one item
    // when the modelvalue of this component exists on mounting. This
    // helps to save time by not calling getItemsToList, which does EVERYTHING
    // and takes much time to do so.
    // This function should only be called once the fetchFromService in
    // onBeforeMount resolves, so that we can be sure that the quad is locally
    // available on the graph store, if it exists at all.
    // First we need a quad from the graph with:
    // - model value as subject
    // - namedNode(RDF.type.value) as predicate,
    // - propClass.value as object
    const myQuads = rdfDS.data.graph.getQuads(
        nsHasPID.value ? namedNode(subjectValue) : blankNode(subjectValue),
        namedNode(RDF.type.value),
        namedNode(propClass.value),
        null
    );
    let myQuad
    if (Array.isArray(myQuads) && myQuads.length == 1) {
        myQuad = myQuads[0];
    } else {
        console.log(`InstancesSelectEditor: model value set ('${subjectValue}') but no associated quad found; returning empty list of items.`)
        itemsToList.value = []
        return
    }
    var relatedTrips = rdfDS.getSubjectTriples(myQuad.subject);
    var item = prepareItem(myQuad);
    addItemParts(item, myQuad, relatedTrips)
    itemsToList.value = [item]
}

async function getItemsToList() {
    // ---
    // The goal of this method is to populate the list of items for the
    // InstancesSelectEditor
    // ---
    // The allclass_array already contains the base class from 
    let combinedQuads = [];
    for (const cl of allclass_array) {
        const mySubArray = rdfDS.getLiteralAndNamedNodes(
            namedNode(RDF.type.value),
            cl,
            allPrefixes
        )
        combinedQuads = combinedQuads.concat(mySubArray);
    }
    // Finally, create list items from quads
    var itemsToListArr = [];
    const trackedFingerprints = new Set();
    // If there is already a selected item, we need to add it first.
    // This is necessary to deal with the later process of deduplicating
    // blank node (i.e. association class) records. We want the already selected
    // item to remain in the list even if the list is regenerated, so that the UI
    // behaves consistently. Without this step, the selected item display will
    // degrade to only showing the blank node id once the dropdown is clicked on.
    const subjectValues = combinedQuads.map(q => q.subject.value);
    let foundQI = null;
    if (subValues.value.selectedInstance) {
        // props.modelValue shows that the value exists from the formData POV,
        // while subValues.value.selectedInstance shows that the associated
        // item actually exists and is selected in the list.
        // If we use the former, we are working from ground truth,
        // If we use the latter, we already have the item to work with.
        // I will go with the latter until some problem suggests otherwise.
        let subjectValue = subValues.value.selectedInstance.value;
        foundQI = subjectValues.indexOf(subjectValue)
        if (foundQI >= 0) {
            itemsToListArr.push(subValues.value.selectedInstance);
            const QIfingerprint = await hashSubgraph(subValues.value.selectedInstance.props.relatedQuads);
            trackedFingerprints.add(QIfingerprint);
        }
    }
    for (const [i, qd] of combinedQuads.entries()) {
        // Do not process an already processed quad
        if (foundQI !== null && foundQI == i) continue;

        var relatedTrips = rdfDS.getSubjectTriples(qd.subject);
        let activeQuad = qd;
        let activeRelatedTrips = relatedTrips;
        let isTemp = false;
        if (qd.subject.termType === 'BlankNode') {
            // Compare with previously seen subgraphs
            const fingerprint = await hashSubgraph(relatedTrips);
            if (trackedFingerprints.has(fingerprint)) {
                // This means a structurally similar blank node item was already
                // added to the list of items, and we don't want to add a duplicate
                continue;
            } else {
                // The first blank node item with this unique structure.
                // We keep track of that fact, and also continue adding the item.
                trackedFingerprints.add(fingerprint);
                // However: we want to add a structurally similar item but NOT
                // with the same ID. Therefore we need to create a new blank node
                // that serves as the ID of the new item. We use the same related
                // qauds that were already calculated for the item, so as to minimize
                // load. We only create and link to new related quads once actually
                // necessary, which is when the user selects the item, or edits it
                // from the list. We use the isTemp flag to keep track of the fact
                // that this is a "duplicate" blank node, so that we can handle it
                // accordingly when required.
                isTemp = true;
                activeQuad = quad(blankNode(), qd.predicate, qd.object, null);
            }
        }
        var item = prepareItem(activeQuad, isTemp);
        addItemParts(item, activeQuad, activeRelatedTrips)
        itemsToListArr.push(item);
    }

    itemsToList.value = itemsToListArr;
}

// filter and sort
const filteredItems = computed(() => {
    if (!itemsToList.value.length) return [];
    const searchText = queryText.value.toLowerCase();
    const searchableFields = ["_prefLabel", "_displayLabel", "itemValue"];
    return [...itemsToList.value]
        .filter((item) => {
            if (searchText.length == 0) return true;
            return searchableFields.some((field) => {
                const value = item.props[field];
                return value?.toString().toLowerCase().includes(searchText);
            });
        })
        .sort((a, b) => {
            function getSortValue(item) {
                for (const field of searchableFields) {
                    const value = item.props[field];
                    if (value) return value.toString().toLowerCase();
                }
                return null;
            }
            const aVal = getSortValue(a);
            const bVal = getSortValue(b);
            // if both are missing labels, consider them equal
            if (!aVal && !bVal) return 0;
            // if only a is missing, a goes first
            if (!aVal) return -1;
            // if only b is missing, b goes first
            if (!bVal) return 1;
            // if sortvalue starts with http, it goes after all others
            const aIsHttp = aVal.startsWith("http");
            const bIsHttp = bVal.startsWith("http");
            if (aIsHttp && !bIsHttp) return 1;   // a goes after b
            if (!aIsHttp && bIsHttp) return -1;  // a goes before b
            // otherwise compare alphabetically
            return aVal.localeCompare(bVal);
        });
});

watchEffect(async () => {
    if (config.value?.use_service &&
        queryText.value && queryText.value.length >= configVarsMain.serviceConstrainedSearch.min_characters &&
        firstPageFetched(propClass.value, queryText.value) &&
        hasUnfetchedPages(propClass.value, queryText.value)) {
        // Only trigger fetch if not already fetching
        if (!isFetchingPage.value) {
            await fetchNextPage(propClass.value, queryText.value);
        }
    }
});

async function fetchNextPage(iri, matchText='') {
    if (!hasUnfetchedPages(iri, matchText)) {
        console.log(`Does not have unfetched pages: ${iri}`)
        return [];
    }
    isFetchingPage.value = true;
    let result = null
    try {
        result = await fetchFromService(
            'get-paginated-records-constrained',
            iri,
            allPrefixes,
            matchText
        );
        if (result.status === null) {
            console.error(result.error);
        }
        await getItemsToList();
    } catch (err) {
        console.error(err);
    } finally {
        isFetchingPage.value = false;
        return result
    }   
}

watch(queryText, (newVal) => {
    // clear previous timers
    clearTimeout(debounceTypingTimer);
    // wait X ms after last keystroke
    debounceTypingTimer = setTimeout(() => {
        onTypingPause(newVal);
    }, configVarsMain.serviceConstrainedSearch.typing_debounce);
});

async function onTypingPause(textVal) {
    if (!queryText.value || queryText.value.length < configVarsMain.serviceConstrainedSearch.min_characters ) return;
    if (config.value?.use_service && nsHasPID.value) {
        await fetchNextPage(propClass.value, queryText.value);
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
