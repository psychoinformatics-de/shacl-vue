<template>
    <AppHeader v-if="config_ready" :logo="configVarsMain.appTheme.logo" @tokenDialogOpened="onTokenDialogOpened" />
    <v-main>
        <v-container fluid>
            <span v-if="page_ready">
                <v-card>
                    <v-layout>
                        <v-navigation-drawer
                            theme="dark"
                            :color="configVarsMain.appTheme.panel_color"
                            v-model="drawer"
                            style="overflow-y: auto"
                            :disable-resize-watcher="true"
                            :permanent="true"
                            :temporary="false"
                            :floating="false"
                            :mobile-breakpoint="0"
                        >
                            <v-list
                                nav
                                selectable
                                :disabled="formOpen"
                                v-model:selected="selectedItem"
                            >
                                <v-list-item value="data"
                                    ><h4>Data Types</h4></v-list-item
                                >
                                <v-list-item
                                    v-for="node in orderedNodeShapeNames"
                                    :prepend-icon="
                                        getClassIcon(
                                            shapesDS.data.nodeShapeNames[node]
                                        )
                                    "
                                    :title="
                                        getDisplayName(
                                            shapesDS.data.nodeShapeNames[node],
                                            configVarsMain,
                                            allPrefixes,
                                            shapesDS.data.nodeShapes[shapesDS.data.nodeShapeNames[node]]
                                        )
                                    "
                                    :value="shapesDS.data.nodeShapeNames[node]"
                                    @click="
                                        selectType(
                                            shapesDS.data.nodeShapeNames[node],
                                            true
                                        )
                                    "
                                >
                                </v-list-item>
                            </v-list>
                        </v-navigation-drawer>
                        <v-main
                            ref="mainContent"
                            style="height: 90vh; overflow-y: auto"
                        >
                            <v-container fluid>
                                <v-row>
                                    <v-col
                                        :cols="formOpen ? 3 : 12"
                                        class="transition-all"
                                        :class="
                                            formOpen ? 'opacity-column' : ''
                                        "
                                    >
                                        <span v-if="selectedIRI">
                                            <h2
                                                class="mx-4 mb-4 truncate-heading"
                                                @mouseenter="headingHover = true"
                                                @mouseleave="headingHover = false"
                                            >
                                                <span
                                                    v-if="
                                                        internalHistory.length
                                                    "
                                                >
                                                    <v-btn
                                                        icon="mdi-chevron-left"
                                                        density="compact"
                                                        variant="outlined"
                                                        @click="goBack()"
                                                        :disabled="openForms.length > 0"
                                                    ></v-btn>
                                                    &nbsp;
                                                </span>

                                                <span class="display-text-wrapper">
                                                    {{
                                                        getDisplayName(
                                                            selectedIRI,
                                                            configVarsMain,
                                                            allPrefixes,
                                                            shapesDS.data.nodeShapes[selectedIRI]
                                                        )
                                                    }}
                                                    <span v-if="fetchedItemCount">
                                                        <small>
                                                            ({{fetchedItemCount}}<span v-if="totalItemCount && totalItemCount > fetchedItemCount">/{{ totalItemCount }}</span>
                                                            record{{ fetchedItemCount == 1 ? '' : 's' }})
                                                        </small>
                                                    </span>
                                                    <v-progress-linear
                                                        v-model="currentProgress"
                                                        height="5"
                                                        :color="configVarsMain.appTheme.link_color"
                                                        class="progress-underline"
                                                        rounded
                                                        :style="{ opacity: showProgress ? 1 : 0 }"
                                                    >
                                                    </v-progress-linear>
                                                </span>
                                                &nbsp;&nbsp;

                                                <v-btn
                                                    icon="mdi-plus"
                                                    size="x-small"
                                                    variant="tonal"
                                                    @click="addInstanceItem()"
                                                    :disabled="
                                                        openForms.length > 0 ||
                                                        !canEditClass
                                                    "
                                                ></v-btn>
                                            </h2>

                                            <p
                                                class="mx-4 mb-4"
                                                v-html="formattedDescription"
                                            ></p>

                                            <span v-if="classRecordsLoading">
                                                <v-skeleton-loader
                                                    type="list-item-avatar"
                                                ></v-skeleton-loader>
                                            </span>
                                            <span v-else>
                                                <div
                                                    v-if="
                                                        instanceItemsComp.length
                                                    "
                                                >
                                                    <v-row
                                                        v-if="
                                                            instanceItemsComp.length
                                                        "
                                                    >
                                                        <v-col cols="8">
                                                            <v-text-field
                                                                v-model="
                                                                    searchText
                                                                "
                                                                density="compact"
                                                                variant="outlined"
                                                                :label="`Enter at least ${configVarsMain.serviceConstrainedSearch.min_characters} characters to search all records`"
                                                                hide-details="auto"
                                                                style="
                                                                    margin: 1em;
                                                                "
                                                                :disabled="
                                                                    openForms.length >
                                                                    0
                                                                "
                                                                @update:modelValue="onUserTyping"
                                                            >
                                                                <template
                                                                    v-slot:append-inner
                                                                >
                                                                    <v-icon
                                                                        v-if="
                                                                            searchText
                                                                        "
                                                                        class="mr-2"
                                                                        @click.stop="
                                                                            clearField()
                                                                        "
                                                                        @mousedown.stop.prevent
                                                                    >
                                                                        mdi-close-circle
                                                                    </v-icon>
                                                                </template>
                                                                <template
                                                                    #append
                                                                >
                                                                    <v-btn
                                                                        variant="outlined"
                                                                        @click="
                                                                            toggleOrder
                                                                        "
                                                                        :append-icon="
                                                                            orderIcon
                                                                        "
                                                                        :disabled="
                                                                            openForms.length >
                                                                            0
                                                                        "
                                                                        >Order</v-btn
                                                                    >
                                                                </template>
                                                            </v-text-field>
                                                        </v-col>
                                                        <v-col> </v-col>
                                                    </v-row>
                                                    <v-tooltip text="Scroll to top" location="top end">
                                                        <template v-slot:activator="{ props }">
                                                            <v-fab
                                                                v-if="showScrollTopBtn && openForms.length == 0"
                                                                @click="scrollToTop"
                                                                icon="mdi-arrow-up-bold"
                                                                :app="true"
                                                                style="bottom: 2em;"
                                                                v-bind="props"
                                                            ></v-fab>
                                                        </template>
                                                    </v-tooltip>
                                                    <DynamicScroller
                                                        :items="
                                                            textMatchType == 'exact' ?
                                                            matchedInstanceItemsComp :
                                                            filteredInstanceItemsComp
                                                        "
                                                        page-mode
                                                        :min-item-size="50"
                                                        key-field="title"
                                                        class="virtual-scroller"
                                                        @scroll-end="onScrollEnd"
                                                        ref="scrollerRef"
                                                    >
                                                        <template
                                                            v-slot="{
                                                                item,
                                                                index,
                                                                active,
                                                            }"
                                                        >
                                                            <DynamicScrollerItem
                                                                :item="item"
                                                                :index="index"
                                                                :active="active"
                                                                class="scroller-item"
                                                                :ref="
                                                                    itemRefs[
                                                                        index
                                                                    ]
                                                                "
                                                            >
                                                                <template
                                                                    #default
                                                                >
                                                                    <NodeShapeViewer
                                                                        :classIRI="
                                                                            selectedIRI
                                                                        "
                                                                        :quad="
                                                                            item
                                                                                .props
                                                                                .quad
                                                                        "
                                                                        :key="
                                                                            selectedIRI +
                                                                            '-' +
                                                                            item.title
                                                                        "
                                                                        :formOpen="
                                                                            formOpen
                                                                        "
                                                                        :variant="
                                                                            item.title ==
                                                                            queried_pid
                                                                                ? 'outlined'
                                                                                : 'tonal'
                                                                        "
                                                                        @namedNodeSelected="
                                                                            handleInternalNavigation
                                                                        "
                                                                    />
                                                                </template>
                                                            </DynamicScrollerItem>
                                                        </template>
                                                        <template #after>
                                                            <div class="after-loader" :style="'color: ' + configVarsMain.appTheme.link_color + ';'">
                                                                <v-progress-circular v-show="showFetchingPageLoader" indeterminate :size="40" :width="4"></v-progress-circular>
                                                            </div>
                                                        </template>
                                                    </DynamicScroller>
                                                </div>
                                                <div
                                                    v-else
                                                    style="
                                                        margin-top: 1em;
                                                        margin-left: 1em;
                                                    "
                                                >
                                                    <em>No items</em>
                                                </div>
                                            </span>
                                        </span>
                                        <span
                                            v-else-if="frontPageHTML"
                                            style="
                                                margin-top: 1em;
                                                margin-left: 1em;
                                            "
                                        >
                                            <div v-html="frontPageHTML"></div>
                                        </span>
                                        <span
                                            v-else
                                            style="
                                                margin-top: 1em;
                                                margin-left: 1em;
                                            "
                                        >
                                            <em>Select a data type</em>
                                        </span>

                                    </v-col>
                                    <v-col v-if="formOpen" cols="9">
                                        <v-expansion-panels
                                            variant="accordion"
                                            v-model="currentOpenForm"
                                            class="custompanels"
                                        >
                                            <v-expansion-panel
                                                v-for="(f, i) in openForms"
                                                :key="
                                                    f.shapeIRI +
                                                    '-' +
                                                    f.nodeIDX +
                                                    '-expansionpanel'
                                                "
                                                :value="
                                                    'panel' + (i + 1).toString()
                                                "
                                                :disabled="f.disabled"
                                            >
                                                <v-expansion-panel-title>
                                                    <h2>
                                                        <em>
                                                            {{
                                                                f.formType ===
                                                                'new'
                                                                    ? 'Adding'
                                                                    : 'Editing'
                                                            }}:
                                                            {{
                                                                getDisplayName(
                                                                    f.shapeIRI,
                                                                    configVarsMain,
                                                                    allPrefixes,
                                                                    shapesDS.data.nodeShapes[f.shapeIRI]
                                                                )
                                                            }}
                                                        </em>
                                                    </h2>
                                                </v-expansion-panel-title>
                                                <v-expansion-panel-text
                                                    density="compact"
                                                >
                                                    <span
                                                        v-if="idRecordLoading"
                                                    >
                                                        <v-skeleton-loader
                                                            type="list-item-avatar"
                                                        ></v-skeleton-loader>
                                                    </span>
                                                    <span v-else>
                                                        <FormEditor
                                                            :key="
                                                                f.shapeIRI +
                                                                '-' +
                                                                f.nodeIDX +
                                                                '-form-' +
                                                                f.formType
                                                            "
                                                            :shape_iri="
                                                                f.shapeIRI
                                                            "
                                                            :node_idx="
                                                                f.nodeIDX
                                                            "
                                                        ></FormEditor>
                                                    </span>
                                                </v-expansion-panel-text>
                                            </v-expansion-panel>
                                        </v-expansion-panels>
                                    </v-col>
                                </v-row>
                            </v-container>
                        </v-main>
                    </v-layout>
                </v-card>
                <v-dialog v-model="submitDialog" max-width="800">
                    <SubmitComp></SubmitComp>
                </v-dialog>
                <v-dialog
                    v-model="noSubmitDialog"
                    max-width="500"
                    @click:outside="noSubmitDialog = false"
                >
                    <v-card>
                        <v-card-title>Nothing to submit</v-card-title>
                        <v-card-text>You have no changes to submit</v-card-text>
                        <v-card-actions>
                            <v-btn @click="noSubmitDialog = false">Close</v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>
            </span>
            <span v-else>
                <v-skeleton-loader type="article"></v-skeleton-loader>
            </span>
        </v-container>
    </v-main>
    <AppFooter />
</template>

<script setup>
import {
    ref,
    computed,
    provide,
    watch,
    watchEffect,
    reactive,
    onBeforeUpdate,
    nextTick,
    toRaw,
    onMounted,
    onBeforeUnmount,
} from 'vue';
import { useConfig } from '@/composables/configuration';
import {
    adjustHexColor,
    findObjectByKey,
    addCodeTagsToText,
    getSuperClasses,
    getDisplayName,
    getPidQuad,
    hasConfigDisplayLabel,
    getConfigDisplayLabel,
} from '../modules/utils';
import { toCURIE, toIRI } from 'shacl-tulip';
import editorMatchers from '@/modules/editors';
import defaultEditor from '@/components/UnknownEditor.vue';
import { useData } from '@/composables/useData';
import { useClasses } from '@/composables/useClasses';
import { useShapes } from '@/composables/useShapes';
import { useForm } from '@/composables/useForm';
import { useToken } from '@/composables/tokens';
import { DataFactory } from 'n3';
import { SHACL, RDF, SKOS } from '@/modules/namespaces';
import { debounce } from 'lodash-es';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
import {
    RecycleScroller,
    DynamicScroller,
    DynamicScrollerItem,
} from 'vue-virtual-scroller';
const { namedNode } = DataFactory;

const props = defineProps({
    configUrl: String,
});

// ---------- //
// PAGINATION //
// ---------- //
const headingHover = ref(false);
const totalItemCount = ref(0);
const isFetchingPage = ref(false);
const showScrollTopBtn = ref(false);
const scrollerRef = ref(null);
function onScrollEnd() {
    debouncedScrollEnd();
}
const debouncedScrollEnd = debounce(async () => {
    console.log("NEAR BOTTOM OF SCROLLER")

    // Only fetch new items at bottom of scroller if there is not any search text
    // Continued fetching of more items while there is search text will be handled
    // by the watcheffect function.
    if (searchText.value) {
        return
    }

    if (config.value.use_service) {
        if (hasUnfetchedPages(selectedIRI.value) && !isFetchingPage.value) {
            await fetchNextPage();
        } else {
            console.log("Last page already fetched")
        }
    }
}, 1000);
function scrollToTop() {
    if (scrollerRef.value?.scrollToItem) {
        scrollerRef.value.scrollToItem(0);
    }
    nextTick(() => {
        const el = mainContent.value?.$el || mainContent.value;
        if (el) el.scrollTop = 0;
    });
}
const showProgress = computed(() => {
    return searchText.value || headingHover.value
})
const currentProgress = computed(() => {
    if (fetchedItemCount.value == null) {
        return 0;
    }
    if (fetchedItemCount.value && totalItemCount.value) {
        if (totalItemCount.value == 0) {
            return 100;
        } else {
            return  Math.ceil(fetchedItemCount.value / totalItemCount.value * 100);
        }
    }
    if (fetchedItemCount.value && (totalItemCount.value == null || totalItemCount.value == 0 )) {
        return 100;
    }
})
const showFetchingPageLoader = ref(false)
let hideTimeout = null
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

// ---------------------------------------------------- //
// CONFIGURATION, AND LOADING SHAPES/CLASSES/DATA/FORMS //
// ---------------------------------------------------- //
const internalHistory = ref([]);
const firstNavigationDone = ref(false);
const mainContent = ref(null);
const config_ready = ref(false);
const itemRefs = ref([]);
const { config, configFetched, configError, configVarsMain, loadConfigVars, loadMainPage} =
    useConfig(props.configUrl);
const { rdfDS, getRdfData, fetchFromService, fetchedPages, hasUnfetchedPages, getTotalItems, firstPageFetched, http401response } = useData(config);
const { classDS, getClassData } = useClasses(config);
const { shapesDS, getSHACLschema } = useShapes(config);
const { formData, submitFormData, savedNodes, submittedNodes, nodesToSubmit } =
    useForm(config);
const { token, setToken, clearToken } = useToken();
const ID_IRI = ref('');
const canEditClass = ref(true)
const frontPageHTML = ref(null)
watch(
    configFetched,
    async (newValue) => {
        if (newValue) {
            if (!config.value.id_iri) {
                throw new Error(
                    "Configuration error: 'id_iri' is a required field"
                );
            }
            ID_IRI.value = config.value.id_iri;
            console.log(`ID_IRI is: ${config.value.id_iri}`);
            // Load all variables from config that are necessary for the main shaclvue and appheader components
            loadConfigVars();
            document.documentElement.style.setProperty(
                '--link-color',
                configVarsMain.appTheme.link_color
            );
            document.documentElement.style.setProperty(
                '--hover-color',
                configVarsMain.appTheme.hover_color
            );
            document.documentElement.style.setProperty(
                '--active-color',
                configVarsMain.appTheme.active_color
            );
            document.documentElement.style.setProperty(
                '--visited-color',
                configVarsMain.appTheme.visited_color
            );
            // Set html document title from config variables
            if (configVarsMain.pageTitle) {
                document.title = configVarsMain.pageTitle;
            } else if (configVarsMain.appName) {
                document.title = configVarsMain.appName;
            } else {
                document.title = 'shacl-vue';
            }
            // Load main page content if provided
            frontPageHTML.value = await loadMainPage(configVarsMain)
            config_ready.value = true;
            formData.ID_IRI = ID_IRI.value;

            await getRdfData();
            await getClassData();
            await getSHACLschema();
        }
    },
    { immediate: true }
);
provide('config', config);
provide('configFetched', configFetched);
provide('configError', configError);
provide('configVarsMain', configVarsMain); // for ShaclVue and AppHeader components, mainly
provide('ID_IRI', ID_IRI);
provide('rdfDS', rdfDS);
provide('shapesDS', shapesDS);
provide('classDS', classDS);
provide('formData', formData);
provide('fetchFromService', fetchFromService);
provide('hasUnfetchedPages', hasUnfetchedPages);
provide('getTotalItems', getTotalItems);
provide('firstPageFetched', firstPageFetched);
provide('http401response', http401response)
provide('submitFormData', submitFormData);
provide('savedNodes', savedNodes);
provide('submittedNodes', submittedNodes);
provide('nodesToSubmit', nodesToSubmit);
// Warn if there are any pending records to submit
function handleBeforeUnload(event) {
    if (nodesToSubmit.value.length > 0) {
        event.preventDefault();
        event.returnValue = '';
        return '';
    }
}
onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
});
onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
});

const superClasses = reactive({});
provide('superClasses', superClasses);
const searchText = ref('');
const textMatchType = ref('partial');
const instanceItemsComp = ref([]);
var newTypeSelected = false;

// ---------------------------------------------- //
// ONCE ALL SHAPES/CLASSES/DATA/FORMS ARE LOADED:
// - SET PREFIXES
// - FETCH FROM SERVICE IF REQUIRED
// - SET VIEW FROM QUERY
// ---------------------------------------------- //
const allPrefixes = reactive({});
const page_ready = ref(false);
provide('allPrefixes', allPrefixes);
watch(
    () => shapesDS.data.prefixesLoaded,
    async (newValue) => {
        console.log('prefixesLoaded changed:', shapesDS.data.prefixesLoaded);
        if (newValue) {
            // Get all prefixes and derive context from it
            Object.assign(
                allPrefixes,
                shapesDS.data.prefixes,
                rdfDS.data.prefixes,
                classDS.data.prefixes
            );
            var allPrefixKeys = Object.keys(allPrefixes);
            Object.keys(configVarsMain.prefixes).forEach((p) => {
                if (allPrefixKeys.indexOf(p) < 0) {
                    allPrefixes[p] = configVarsMain.prefixes[p];
                }
            });
            console.log('ALL PREFIXES READY');
            console.log(toRaw(allPrefixes));

            if (
                configVarsMain.useService &&
                config.value.hasOwnProperty('service_fetch_before') &&
                config.value.service_fetch_before
            ) {
                console.log('service_fetch_before!');
                if (
                    config.value.service_fetch_before['get-record']?.length > 0
                ) {
                    const fetchRPromises = config.value.service_fetch_before[
                        'get-record'
                    ].map((iri) =>
                        fetchFromService('get-record', iri, allPrefixes)
                    );
                    var results = await Promise.allSettled(fetchRPromises);
                }
                if (
                    config.value.service_fetch_before['get-records']?.length > 0
                ) {
                    const fetchRsPromises = config.value.service_fetch_before[
                        'get-records'
                    ].map((iri) =>
                        fetchFromService('get-records-before', iri, allPrefixes)
                    );
                    var results = await Promise.allSettled(fetchRsPromises);
                }
            }
            setViewFromQuery();
            page_ready.value = true;
            // Get object with nodeshape uris as keys and their superclass arrays as values
            // This is necessary for ordering the properties according to their originating class, for display
            for (var uri of shapesDS.data.nodeShapeIRIs) {
                superClasses[uri] = getSuperClasses(uri, classDS.data.graph);
            }
            console.log('SUPERCLASSES:');
            console.log(toRaw(superClasses));
        }
    },
    { immediate: true }
);

// ---------------- //
// SUBMISSION STUFF //
// ---------------- //
const canSubmit = ref(true);
const submitButtonPressed = ref(false);
function submitFn() {
    submitButtonPressed.value = true;
}
provide('submitButtonPressed', submitButtonPressed);
provide('submitFn', submitFn);
provide('canSubmit', canSubmit);
const noSubmitDialog = ref(false);
const submitDialog = ref(false);
provide('submitDialog', submitDialog);
// When user clicks the submit button
watch(
    submitButtonPressed,
    (newValue) => {
        if (newValue) {
            if (nodesToSubmit.value.length == 0) {
                noSubmitDialog.value = true;
                submitDialog.value = false;
            } else {
                submitDialog.value = true;
                noSubmitDialog.value = false;
            }
            submitButtonPressed.value = false;
        }
    },
    { immediate: true }
);

const activatedInstancesSelectEditor = ref(null);
provide('activatedInstancesSelectEditor', activatedInstancesSelectEditor);
const lastSavedNode = ref(null);
provide('lastSavedNode', lastSavedNode);
const itemsTrigger = ref(false);
const queried_pid = ref(null);
const classRecordsLoading = ref(false);
const idRecordLoading = ref(false);
const fetchedItemCount = ref(null)
provide('editorMatchers', editorMatchers);
provide('defaultEditor', defaultEditor);
// Data for creating/editing items
// Select a data type
var selectedShape = ref(null);
var selectedIRI = ref(null);
// Select a data item
var selectedItem = ref(null);
// Create or edit a data item
const addItem = ref(false);
const newItemIdx = ref(null);
const editItem = ref(false);
const formOpen = ref(false);
const drawer = ref(true);
const editShapeIRI = ref(null);
const editItemIdx = ref(null);
const editMode = reactive({
    form: false,
    graph: false,
});
let debounceTypingTimer = null;
provide('editMode', editMode);
provide('formOpen', formOpen);
onBeforeUpdate(() => {
    console.log('onBeforeUpdate ShaclVue');
    editItemIdx.value = null;
    editShapeIRI.value = null;
});

const debouncedUpdate = debounce(() => {
    if (openForms.length == 0) {
        console.log('CHECK: graphdata shaclvue');
        getInstanceItems();
    }
}, 500);
watch(() => rdfDS.data.graphChanged, debouncedUpdate, { deep: true });

watch(
    instanceItemsComp,
    (newVal, oldVal) => {
        if (newTypeSelected) {
            newTypeSelected = false;
            return;
        }
        if (classRecordsLoading.value) {
            classRecordsLoading.value = false;
        }
    },
    { deep: true }
);

const idFilteredNodeShapeNames = computed(() => {
    if (configVarsMain.showShapesWoID === true) {
        return shapesDS.data.nodeShapeNamesArray;
    }
    var shapeNames = [];
    for (var n of shapesDS.data.nodeShapeNamesArray) {
        if (
            findObjectByKey(
                shapesDS.data.nodeShapes[shapesDS.data.nodeShapeNames[n]]
                    .properties,
                SHACL.path.value,
                ID_IRI.value
            )
        ) {
            shapeNames.push(n);
        }
    }
    return shapeNames;
});
const filteredNodeShapeNames = computed(() => {
    var names = idFilteredNodeShapeNames.value;
    // If all relevant config arrays are empty, show all classes
    if (
        configVarsMain.showClasses?.length == 0 &&
        configVarsMain.showClassesWithPrefix?.length == 0 &&
        configVarsMain.hideClasses?.length == 0 &&
        configVarsMain.hideClassesWithPrefix?.length == 0
    ) {
        console.log("- include all classes")
        return names;
    }
    var shapeNames = [];
    for (var n of names) {
        // First get IRI and prefix
        var n_iri = shapesDS.data.nodeShapeNames[n]
        if (includeClass(n_iri)) {
            shapeNames.push(n);
        }
    }
    return shapeNames;
});

const orderedNodeShapeNames = computed(() => {
    return filteredNodeShapeNames.value.sort((a, b) =>
        getDisplayName(
            shapesDS.data.nodeShapeNames[a],
            configVarsMain,
            allPrefixes,
            shapesDS.data.nodeShapes[shapesDS.data.nodeShapeNames[a]]
        ).toLowerCase()
        .localeCompare(
            getDisplayName(
                shapesDS.data.nodeShapeNames[b],
                configVarsMain,
                allPrefixes,
                shapesDS.data.nodeShapes[shapesDS.data.nodeShapeNames[b]]
            ).toLowerCase()
        )
    );
})

function includeClass(class_iri) {
    var class_prefix = toCURIE(class_iri, allPrefixes, 'parts').prefix
    // Assume we include class by default
    var include = true;
    // If either showClasses or showClassesWithPrefix contain elements
    // it means we include only some classes
    // If the current class is not found in those classes, exclude it
    if (
        (
            configVarsMain.showClasses?.length != 0 ||
            configVarsMain.showClassesWithPrefix?.length != 0
        ) && (
            configVarsMain.showClasses?.indexOf(class_iri) < 0 &&
            configVarsMain.showClassesWithPrefix?.indexOf(class_prefix) < 0
        )
    ) {
        include = false;
    }
    // If a class is to be included based on the showClasses(...) options,
    // only include it if it should not be explicitly hidden (i.e. include
    // it if it isn't found in hideClasses(...) arrays
    if (
        include &&
        configVarsMain.hideClasses?.indexOf(class_iri) < 0 &&
        configVarsMain.hideClassesWithPrefix?.indexOf(class_prefix) < 0
    ) {
        return true
    } else {
        return false
    }
}

const formattedDescription = computed(() => {
    // For the class description, use a regular expression to replace text between backticks with <code> tags
    if (selectedShape.value) {
        return addCodeTagsToText(selectedShape.value[SHACL.description.value]);
    } else {
        return '-';
    }
});

function clearField() {
    searchText.value = '';
    textMatchType.value = 'partial';
}

async function selectType(IRI, fromUser, fromBackButton) {
    console.log(`Selecting type: ${IRI}`);
    console.log(filteredNodeShapeNames.value);
    console.log(shapesDS.data.nodeShapeNames);
    console.log(selectedItem.value);
    fetchedItemCount.value = null;
    totalItemCount.value = 0
    isFetchingPage.value = false;
    showScrollTopBtn.value = false;
    newTypeSelected = true;
    var tempSearchText = searchText.value;
    var tempIRI = selectedIRI.value;
    searchText.value = '';
    textMatchType.value = 'partial';
    selectedIRI.value = IRI;
    selectedShape.value = shapesDS.data.nodeShapes[IRI];
    canEditClass.value = configVarsMain.noEditClasses.indexOf(IRI) < 0 ? true : false
    if (config.value.use_service) {
        classRecordsLoading.value = true;
        // First fetch rdf data from configured service
        // The first fetch (when a class/type is selected) is always without a
        // matching parameter, to get info about total items on server
        var result = await fetchFromService('get-paginated-records-constrained', IRI, allPrefixes);
        console.log('fetchFromService result:');
        console.log(result);
        console.log('fetchFromService result.status:');
        console.log(result.status);
        console.log('fetchFromService result.url:');
        console.log(result.url);
        // If there was an actual error during the try statement
        // before making the requests, relay error and deactivate loader
        if (result.status === null) {
            console.error(result.error);
            classRecordsLoading.value = false;
        }
        // If any of the results were successful, don't set classRecordsLoading to false
        // because it will be set during the watch event for instanceItemsComp
        if (result.status.length && result.status.indexOf('success') >= 0) {
            // do nothing
        } else {
            classRecordsLoading.value = false;
        }

        // We want to keep track of the progress of currently fetched items
        // vs total items, so we need the total item count of the current class
        var totalItems = getTotalItems(IRI)
        if (totalItems > 0) {
            totalItemCount.value = totalItems
        }
    }
    getInstanceItems();
    nextTick(() => {
        const el = mainContent.value?.$el || mainContent.value;
        if (el) el.scrollTop = 0;
    });
    if (fromUser) {
        updateURL(IRI);
    }

    if (!fromUser || fromBackButton) {
        selectedItem.value = [IRI];
    }

    if (firstNavigationDone.value) {
        if (!fromBackButton) {
            if (IRI != tempIRI) {
                internalHistory.value.push({
                    iri: tempIRI,
                    searchText: tempSearchText,
                });
            }
        }
    } else {
        firstNavigationDone.value = true;
    }
}

function goBack() {
    var previousView = internalHistory.value.pop();
    selectType(previousView.iri, true, true);
    searchText.value = previousView.searchText;
}

function onTokenDialogOpened() {
    // Replace url with one where token is not included
    const url = new URL(window.location);
    url.searchParams.delete('token');
    window.history.replaceState(null, '', url);
}

function updateURL(IRI, edit, pid) {
    var curie = toCURIE(IRI, allPrefixes);
    var queryParams = `?${encodeURIComponent('sh:NodeShape')}=${encodeURIComponent(curie)}`;
    if (pid) {
        queryParams += `&pid=${encodeURIComponent(pid)}`;
    }
    if (edit) {
        queryParams += '&edit=true';
    }
    history.replaceState(null, '', window.location.pathname + queryParams);
}

function getQueryParams() {
    const url = new URL(window.location);
    return url.searchParams;
}

async function setViewFromQuery() {
    const qparams = getQueryParams();
    const nodeShape = qparams.get('sh:NodeShape');
    const instance_pid = qparams.get('pid');
    const token = qparams.get('token');
    const edit = qparams.get('edit');

    if (token) {
        setToken(token);
    }

    if (nodeShape) {
        console.log('Nodeshape in queryparams');
        // this could be a curie or iri
        // check if iri is in
        var nodeShapeIRI = toIRI(nodeShape, allPrefixes);
        if (shapesDS.data.nodeShapes[nodeShapeIRI]) {
            if (includeClass(nodeShapeIRI)) {
                await selectType(nodeShapeIRI);
                var instanceIRI = null;
                if (instance_pid) {
                    instanceIRI = toIRI(instance_pid, allPrefixes);
                    if (instanceIRI) {
                        // queried_pid.value = instanceIRI;
                        textMatchType.value = 'exact';
                        searchText.value = instanceIRI;
                        updateURL(nodeShapeIRI, false, instanceIRI)
                    } else {
                        updateURL(nodeShapeIRI, false, null)
                        console.error(`Unresolvable PID queryparams: ${instance_pid} `);
                    }
                }
                // If edit AND if instance_pid, then we should:
                // - create object 'instance'
                // - set instance.value = instanceIRI
                // - get the instance quad with instance_pid as subject -> set instance.quad
                // - call editInstanceItem(instance)
                // If edit AND NOT instance_pid, just open the empty form
                if (edit) {
                    if (configVarsMain.noEditClasses.indexOf(nodeShapeIRI) >= 0) {
                        updateURL(nodeShapeIRI, false)
                    } else {
                        if (instanceIRI) {
                            let instObject = {
                                value: instanceIRI,
                                quad: getPidQuad(instanceIRI, rdfDS.data.graph)
                            }
                            editInstanceItem(instObject)
                        } else {
                            addInstanceItem();
                            updateURL(nodeShapeIRI, true);
                        }
                        
                    }
                }
            }
            else {
                console.log('Queried nodeshape found in shacl schema, but show/hide-config options specify that it should be hidden');
                history.replaceState(null, '', window.location.pathname);
            }
        } else {
            console.log('Queried nodeshape not found in shacl schema');
            history.replaceState(null, '', window.location.pathname);
        }
    } else {
        console.log('nodeshape not in query params');
    }
}

function getClassIcon(class_iri) {
    if (configVarsMain.classIcons) {
        if (configVarsMain.classIcons[class_iri]) {
            return configVarsMain.classIcons[class_iri];
        }
    }
    return 'mdi-circle-outline';
}
provide('getClassIcon', getClassIcon);

function addInstanceItem() {
    newItemIdx.value = null;
    editItem.value = false;
    addItem.value = false;
    newItemIdx.value = crypto.randomUUID();
    addForm(selectedIRI.value, newItemIdx.value, 'new');
    addItem.value = true;
    formOpen.value = true;
    drawer.value = false;
    canSubmit.value = false;
    updateURL(selectedIRI.value, true);
}

async function editInstanceItem(instance) {
    // When user selects to edit, it will be either a namedNode or blankNode
    // and the related information would already be in the graph as triples
    // Also, related information might already be in formData if the user
    // created or edited the same node before in the same session. If not,
    // then a formData node has to be created from the triples in the graph.
    console.log(instance);
    addItem.value = false;
    editItem.value = false;
    var subjectTerm = instance.quad.subject;
    var objectTerm = instance.quad.object;
    if (objectTerm.termType === 'NamedNode') {
        editShapeIRI.value = objectTerm.value;
    } else {
        editShapeIRI.value = toIRI(objectTerm.value, allPrefixes);
    }
    editItemIdx.value = instance.value; // this is the id

    // if the node is already in the formData, edit that
    if (formData.content[editShapeIRI.value]?.[editItemIdx.value]) {
        console.log('The node is already in the formData, we will edit that');
        editMode.form = true;
        editMode.graph = false;
    } else {
        // If not, we need to create the formData entries from quads in the dataset
        formData.quadsToFormData(editShapeIRI.value, subjectTerm, rdfDS);
        editMode.form = false;
        editMode.graph = true;
    }
    // open formEditor
    addForm(editShapeIRI.value, editItemIdx.value, 'edit');
    editItem.value = true;
    formOpen.value = true;
    drawer.value = false;
    canSubmit.value = false;
    updateURL(editShapeIRI.value, true, editItemIdx.value);
}
provide('editInstanceItem', editInstanceItem);

function getInstanceItems() {
    // ---
    // The goal of this method is to populate the list of data objects of the selected type
    // ---
    console.log('(re)calculating shaclvue list of records');

    var x = itemsTrigger.value;

    if (!selectedIRI.value) {
        return [];
    }
    // find nodes with triple predicate == rdf:type, and triple object == the selected class
    var quads = rdfDS.getLiteralAndNamedNodes(
        namedNode(RDF.type.value),
        selectedIRI.value,
        allPrefixes
    );
    // Create list items from quads
    var instanceItemsArr = [];
    quads.forEach((quad) => {
        var extra = '';
        if (quad.subject.termType === 'BlankNode') {
            extra = ' (BlankNode)';
        }
        var relatedTrips = rdfDS.getSubjectTriples(quad.subject);
        var item = {
            title: quad.subject.value + extra,
            value: quad.subject.value,
            props: {
                subtitle: quad.object.value,
                quad: quad,
                itemValue: quad.subject.value,
            },                
        };
        let labelTemplate = hasConfigDisplayLabel(quad.object.value, allPrefixes, configVarsMain)
        let labelParts = {}
        relatedTrips.forEach((quad) => {
            if (!Object.hasOwn(item.props, quad.predicate.value)) {
                item.props[quad.predicate.value] = [];
            }
            if (quad.object.termType === 'BlankNode') {
                var bnItem = {};
                var blankNodeTrips = rdfDS.getSubjectTriples(quad.object);
                blankNodeTrips.forEach((bnquad) => {
                    bnItem[bnquad.predicate.value] = bnquad.object.value;
                });
                item.props[quad.predicate.value].push(bnItem);
            } else {
                item.props[quad.predicate.value].push(quad.object.value);
            }

            let predCuri = toCURIE(quad.predicate.value, allPrefixes)
            // If current predicate is used for display label generation, store it
            if ( labelTemplate && labelTemplate.includes(predCuri)) {
                if (!labelParts[predCuri]) {
                    labelParts[predCuri] = []
                }
                labelParts[predCuri].push(quad.object.value)
            }
        });
        item.props._prefLabel = '';
        if (item.props.hasOwnProperty(SKOS.prefLabel.value)) {
            item.props._prefLabel = item.props[SKOS.prefLabel.value][0];
        }
        // Generate display label if possible
        item.props._displayLabel = '';
        if (labelTemplate) {
            let displayLabel = getConfigDisplayLabel(labelTemplate, labelParts, configVarsMain, rdfDS, allPrefixes)
            if (displayLabel) {
                item.props._displayLabel = displayLabel;
            }
        }
        instanceItemsArr.push(item);
    });
    instanceItemsComp.value = [...instanceItemsArr];
    if (instanceItemsComp.value.length > 7) showScrollTopBtn.value = true;
    fetchedItemCount.value = instanceItemsComp.value.length;
}


const searchableFields = ["_prefLabel", "_displayLabel", "itemValue"];
function getSortValue(item) {
    for (const field of searchableFields) {
        const value = item.props[field];
        if (value) return value.toString().toLowerCase().trim();
    }
    return null;
}
function sortItems(arr) {
    const c = orderTopDown.value ? 1 : -1;
    return arr.sort((a, b) => {
        const aVal = getSortValue(a);
        const bVal = getSortValue(b);
        // if both are missing labels, consider them equal
        if (!aVal && !bVal) return 0;
        // if only a is missing, a goes first
        if (!aVal) return -1 * c;
        // if only b is missing, b goes first
        if (!bVal) return 1 * c;
        // otherwise compare alphabetically
        return c * aVal.localeCompare(bVal);
    })
}
const filteredInstanceItemsComp = computed(() => {
    let txt = searchText.value.toLowerCase().trim();
    return sortItems(
        [...instanceItemsComp.value].filter((item) => {
            if (txt.length == 0) return true;
            return searchableFields.some((field) => {
                const value = item.props[field]?.toString().toLowerCase().trim();
                return value.includes(txt);
            });
        })
    )
});
const matchedInstanceItemsComp = computed(() => {
    let txt = searchText.value.toLowerCase().trim();
    return sortItems(
        [...instanceItemsComp.value].filter((item) => {
            if (txt.length == 0) return true;
            return searchableFields.some((field) => {
                const value = item.props[field]?.toString().toLowerCase().trim();
                return value === txt;
            });
        })
    )
});

watchEffect(async () => {
    // If we are using a backend service AND
    // there are a minimum amount of characters in the search field AND
    // and the first page has already been fetched for the current IRI and searchText AND
    // any of the configured service base URLs have unfetched pages for the current IRI AND searchText
    if (config.value?.use_service &&
        searchText.value && searchText.value.length >= configVarsMain.serviceConstrainedSearch.min_characters &&
        firstPageFetched(selectedIRI.value, searchText.value) &&
        hasUnfetchedPages(selectedIRI.value, searchText.value)) {
        // Only trigger fetch if not already fetching
        if (!isFetchingPage.value) {
            await fetchNextPage(searchText.value);
        }
    }
});

watch(searchText, (newVal) => {
    // clear previous timers
    clearTimeout(debounceTypingTimer);

    // wait X ms after last keystroke
    debounceTypingTimer = setTimeout(() => {
        onTypingPause(newVal);
    }, configVarsMain.serviceConstrainedSearch.typing_debounce);
});

function onUserTyping () {
    if (textMatchType.value !== 'partial') {
        textMatchType.value = 'partial'
    }
}

async function onTypingPause(textVal) {
    console.log(`TYPING PAUSED: ${textVal}`)
    if (!searchText.value || searchText.value.length < configVarsMain.serviceConstrainedSearch.min_characters ) return;
    await fetchNextPage(searchText.value);
}


// User types, debounce effect monitors pauses and waits for configured time
// before making the first constrained request.

// After that, watcheffect checks that there is a minimum amount of characters
// and that the first request has already been made for the current IRI and
// matching parameter. If true, it will continue to fetch next pages for the
// constrained request until finished.

// Only fetch new items at bottom of scroller if there is not any search text
// Continued fetching of more items while there is search text is handled by
// the watcheffect function.

async function fetchNextPage(matchText='') {
    console.log('Inside fetchNextPage')
    // console.log(isFetchingPage.value)
    // console.log(hasUnfetchedPages(selectedIRI.value, matchText))
    if (isFetchingPage.value || !hasUnfetchedPages(selectedIRI.value, matchText)) return;
    // console.log('Inside fetchNextPage going to fetch now')
    isFetchingPage.value = true;
    try {
        const result = await fetchFromService(
            'get-paginated-records-constrained',
            selectedIRI.value,
            allPrefixes,
            matchText
        );
        if (result.status === null) {
            console.error(result.error);
        }
        getInstanceItems(); // rebuild local list of items
    } catch (err) {
        console.error(err);
    } finally {
        isFetchingPage.value = false;
    }
}


async function handleInternalNavigation({ recordClass, recordPID }) {
    console.log('Received:', recordClass, recordPID);
    await selectType(recordClass, true);
    selectedItem.value = [recordClass];
    textMatchType.value = 'exact';
    searchText.value = recordPID;
}

const orderIcon = ref('mdi-arrow-down-thick');
const orderTopDown = ref(true);

function toggleOrder() {
    orderTopDown.value = !orderTopDown.value;
    if (orderTopDown.value) {
        orderIcon.value = 'mdi-arrow-down-thick';
    } else {
        orderIcon.value = 'mdi-arrow-up-thick';
    }
}

const openForms = reactive([]);
const currentOpenForm = computed(() => {
    if (openForms.length > 0) {
        return 'panel' + openForms.length.toString();
    }
    return null;
});

function isPanelOpen(index) {
    return currentOpenForm.value === 'panel' + (index + 1);
}

function addForm(shapeIRI, nodeIDX, formType) {
    for (var i = 0; i < openForms.length; i++) {
        openForms[i].disabled = true;
    }
    openForms.push({
        shapeIRI: shapeIRI,
        nodeIDX: nodeIDX,
        formType: formType,
        disabled: false,
        activatedInstancesSelectEditor: null,
    });
    nextTick(() => {
        const el = mainContent.value?.$el || mainContent.value;
        if (el) el.scrollTop = 0;
    });
}

function removeForm(savedNode) {
    if (savedNode) {
        lastSavedNode.value = savedNode;
    }
    openForms.pop();
    if (openForms.length > 0) {
        openForms.at(-1).disabled = false;
    } else {
        editItem.value = false;
        formOpen.value = false;
        drawer.value = true;
        canSubmit.value = true;
        editMode.form = editMode.graph = false;
        updateURL(selectedIRI.value, false);
        if (savedNode) {
            getInstanceItems();
        }
        classRecordsLoading.value = false;
    }
}
provide('addForm', addForm);
provide('openForms', openForms);
provide('removeForm', removeForm);
</script>

<style>
.virtual-scroller {
    height: auto;
    overflow-y: auto;
}
.scroller-item {
    padding-bottom: 3px;
}
.code-style {
    color: #ff0000;
    background-color: #f5f5f5;
    padding: 0.1em 0.2em;
    font-family: monospace;
    border-radius: 4px;
    border: 1px solid #ddd;
}
.v-expansion-panel-text {
    display: unset !important;
    margin: 0 !important;
    padding: 0 !important;
}
.v-expansion-panel-text__wrapper {
    margin: 0 !important;
    padding: 0 !important;
}

a {
    color: var(--link-color);
    text-decoration: none;
}

a:hover {
    color: var(--hover-color);
    text-decoration: underline;
}

a:visited {
    color: var(--visited-color);
}

a:active {
    color: var(--active-color);
}
</style>

<style scoped>
.truncate-heading {
    white-space: nowrap; /* Prevent text wrapping */
    overflow: hidden; /* Hide overflowed text */
    text-overflow: ellipsis; /* Add ellipsis for overflowed text */
}
.opacity-column {
    opacity: 0.5; /* Set opacity value between 0 (fully transparent) and 1 (fully opaque) */
}
.custompanels {
    border: 1px solid #ccc !important; /* Change to your preferred color */
    box-shadow: none !important; /* Remove elevation */
    border-radius: 8px; /* Optional: Adjust border rounding */
}
.custompanels .v-expansion-panel {
    border-bottom: 1px solid #ddd !important; /* Adds a subtle divider between panels */
    box-shadow: none !important;
    border-radius: 8px; /* Optional: Adjust border rounding */
}
.display-text-wrapper {
    position: relative; /* so the bar anchors under just the text */
    display: inline-block;
    padding-bottom: 0.3em;
}
.progress-underline {
    position: absolute;   /* take it out of layout flow */
    left: 0;
    right: 0;
    bottom: 0;
    transform: translateY(1.45em);
}
.after-loader {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
