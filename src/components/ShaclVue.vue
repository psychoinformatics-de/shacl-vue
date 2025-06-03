<template>
    <AppHeader v-if="config_ready" :logo="configVarsMain.appTheme.logo" />
    <v-main>
        <v-container fluid>
            <span v-if="page_ready">
                <v-card>
                    <v-layout>
                        <v-navigation-drawer
                            theme="dark"
                            :color="configVarsMain.appTheme.panel_color"
                            v-model="drawer"
                            style="overflow-y: auto;"
                        >
                            <v-list nav selectable :disabled="formOpen" v-model:selected="selectedItem">
                                <v-list-item  value="data"><h4>Data Types</h4></v-list-item>
                                <!-- <v-text-field variant="outlined" append-inner-icon="mdi-magnify" density="compact"></v-text-field> -->
                                <v-list-item
                                    v-for="node in filteredNodeShapeNames"
                                    :prepend-icon="getClassIcon(shapesDS.data.nodeShapeNames[node])"
                                    :title="node"
                                    :value="shapesDS.data.nodeShapeNames[node]"
                                    @click="selectType(shapesDS.data.nodeShapeNames[node], true)">
                                </v-list-item>
                            </v-list>
                        </v-navigation-drawer>
                        <v-main ref="mainContent" style="height: 90vh; overflow-y: auto;">
                            <v-container fluid>
                                <v-row>
                                    <v-col
                                        :cols="formOpen ? 3 : 12"
                                        class="transition-all"
                                        :class="formOpen ? 'opacity-column' : ''"
                                    >

                                        <span v-if="selectedIRI">
                                            <h2 class="mx-4 mb-4 truncate-heading">
                                                <span v-if="internalHistory.length">
                                                    <v-btn icon="mdi-chevron-left" density="compact" variant="outlined" @click="goBack()"></v-btn>
                                                    &nbsp;
                                                </span>
                                                
                                                {{ getDisplayName(selectedIRI, configVarsMain, allPrefixes) }}
                                                &nbsp;&nbsp; <v-btn icon="mdi-plus" size="x-small" variant="tonal" @click="addInstanceItem()" :disabled="openForms.length > 0"></v-btn>
                                            </h2>

                                            <p class="mx-4 mb-4" v-html="formattedDescription"></p>

                                            <span v-if="classRecordsLoading">
                                                <v-skeleton-loader type="list-item-avatar"></v-skeleton-loader>
                                            </span>
                                            <span v-else>
                                                <div v-if="instanceItemsComp.length">
                                                    <v-row v-if="instanceItemsComp.length">
                                                        <v-col cols="7">
                                                            <v-text-field
                                                                v-model="searchText"
                                                                density="compact"
                                                                variant="outlined"
                                                                label="Enter search text"
                                                                hide-details="auto"
                                                                style="margin: 1em;"
                                                                :disabled="openForms.length > 0"
                                                            >
                                                            <template v-slot:append-inner>
                                                                <v-icon v-if="searchText" class="mr-2" @click.stop="clearField()" @mousedown.stop.prevent >
                                                                    mdi-close-circle
                                                                </v-icon>
                                                            </template>
                                                                <template #append>
                                                                    <v-btn variant="outlined" @click="toggleOrder" :append-icon="orderIcon" :disabled="openForms.length > 0">Order</v-btn>
                                                                </template>
                                                            </v-text-field>
                                                        </v-col>
                                                        <v-col>

                                                        </v-col>
                                                    </v-row>
                                                    <DynamicScroller
                                                        :items="filteredInstanceItemsComp"
                                                        :min-item-size="50"
                                                        key-field="title"
                                                        class="virtual-scroller"
                                                        >
                                                        <template v-slot="{ item, index, active }">
                                                            <DynamicScrollerItem :item="item" :index="index" :active="active" class="scroller-item" :ref="itemRefs[index]">
                                                                <template #default>
                                                                    <NodeShapeViewer
                                                                    :classIRI="selectedIRI"
                                                                    :quad="item.props.quad"
                                                                    :key="selectedIRI + '-' + item.title "
                                                                    :formOpen="formOpen"
                                                                    :variant="item.title == queried_id ? 'outlined' : 'tonal'"
                                                                    @namedNodeSelected="handleInternalNavigation"
                                                                    />
                                                                </template>
                                                            </DynamicScrollerItem>
                                                        </template>
                                                    </DynamicScroller>
                                                </div>
                                                <div v-else style="margin-top: 1em; margin-left: 1em;">
                                                    <em>No items</em>
                                                </div>
                                            </span>
                                        </span>
                                        <span v-else style="margin-top: 1em; margin-left: 1em;">
                                            <em>Select a data type</em>
                                        </span>
                                        

                                    </v-col>
                                    <v-col v-if="formOpen" cols="9">
                                        <v-expansion-panels variant="accordion" v-model="currentOpenForm" class="custompanels">
                                            <v-expansion-panel
                                                v-for="(f, i) in openForms"
                                                :key="f.shapeIRI + '-'+ f.nodeIDX + '-expansionpanel'"
                                                :value="'panel' + (i+1).toString()"
                                                :disabled="f.disabled"
                                            >
                                                <v-expansion-panel-title>
                                                  <h2>
                                                    <em>
                                                      {{ f.formType === 'new' ? 'Adding' : 'Editing' }}:
                                                       {{ getDisplayName(f.shapeIRI, configVarsMain, allPrefixes) }}
                                                    </em>
                                                   </h2>
                                                 </v-expansion-panel-title>
                                                <v-expansion-panel-text density="compact">
                                                    <span v-if="idRecordLoading">
                                                        <v-skeleton-loader type="list-item-avatar"></v-skeleton-loader>
                                                    </span>
                                                    <span v-else>
                                                        <FormEditor :key="f.shapeIRI + '-'+ f.nodeIDX + '-form-' + f.formType" :shape_iri="f.shapeIRI" :node_idx="f.nodeIDX"></FormEditor>
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
                <v-dialog v-model="noSubmitDialog" max-width="500" @click:outside="noSubmitDialog = false">
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
        {{ selectedItem }}
    </v-main>
    <AppFooter />
</template>


<script setup>
    import { effect, ref, computed, provide, watch, reactive, onBeforeUpdate, nextTick, toRaw, defineAsyncComponent} from 'vue'
    import { useConfig } from '@/composables/configuration';
    import { adjustHexColor, findObjectByKey, addCodeTagsToText, getSuperClasses, getDisplayName} from '../modules/utils';
    import {toCURIE, toIRI} from 'shacl-tulip'
    import editorMatchers from '@/modules/editors';
    import defaultEditor from '@/components/UnknownEditor.vue';
    import { useData } from '@/composables/useData';
    import { useClasses } from '@/composables/useClasses';
    import { useShapes } from '@/composables/useShapes';
    import { useForm } from '@/composables/useForm';
    import { useToken } from '@/composables/tokens';
    import { DataFactory } from 'n3';
    import {SHACL, RDF, SKOS} from '@/modules/namespaces'
    import { debounce } from 'lodash-es'
    import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
    import { RecycleScroller, DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
    const { namedNode } = DataFactory;

    const props = defineProps({
        configUrl: String
    })

    // ---------------------------------------------------- //
    // CONFIGURATION, AND LOADING SHAPES/CLASSES/DATA/FORMS //
    // ---------------------------------------------------- //
    const internalHistory = ref([])
    const firstNavigationDone = ref(false)
    const mainContent = ref(null)
    const config_ready = ref(false)
    const itemRefs = ref([])
    const { config, configFetched, configError, configVarsMain, loadConfigVars} = useConfig(props.configUrl);
    const { rdfDS, getRdfData, fetchFromService } = useData(config)
    const { classDS, getClassData } = useClasses(config)
    const { shapesDS, getSHACLschema } = useShapes(config)
    const { formData, submitFormData } = useForm(config)
    const { token, setToken, clearToken } = useToken()
    const ID_IRI = ref("")
    watch(configFetched, async (newValue) => {
        if (newValue) {
            if (!config.value.id_iri) {
                throw new Error("Configuration error: 'id_iri' is a required field");
            }
            ID_IRI.value = config.value.id_iri;
            console.log(`ID_IRI is: ${config.value.id_iri}`)
            // Load all variables from config that are necessary for the main shaclvue and appheader components
            loadConfigVars()
            document.documentElement.style.setProperty("--link-color", configVarsMain.appTheme.link_color);
            document.documentElement.style.setProperty("--hover-color", configVarsMain.appTheme.hover_color);
            document.documentElement.style.setProperty("--visited-color", adjustHexColor(configVarsMain.appTheme.link_color, -1));
            document.documentElement.style.setProperty("--active-color", configVarsMain.appTheme.active_color);
            // Set html document title from config variables
            if (configVarsMain.pageTitle) {
                document.title = configVarsMain.pageTitle
            } else if (configVarsMain.appName) {
                document.title = configVarsMain.appName
            } else {
                document.title = "shacl-vue"
            }
            config_ready.value = true
            formData.ID_IRI = ID_IRI.value

            await getRdfData()
            await getClassData()
            await getSHACLschema()
        }
    }, { immediate: true });
    provide('config', config)
    provide('configFetched', configFetched)
    provide('configError', configError)
    provide('configVarsMain', configVarsMain) // for ShaclVue and AppHeader components, mainly
    provide('ID_IRI', ID_IRI)
    provide('rdfDS', rdfDS)
    provide('shapesDS', shapesDS)
    provide('classDS', classDS)
    provide('formData', formData)
    provide('fetchFromService', fetchFromService)
    provide('submitFormData', submitFormData)
    const superClasses = reactive({})
    provide('superClasses', superClasses)
    const searchText = ref("")
    const instanceItemsComp = ref([])
    var newTypeSelected = false

    // ---------------------------------------------- //
    // ONCE ALL SHAPES/CLASSES/DATA/FORMS ARE LOADED:
    // - SET PREFIXES
    // - FETCH FROM SERVICE IF REQUIRED
    // - SET VIEW FROM QUERY
    // ---------------------------------------------- //
    const allPrefixes = reactive({});
    const page_ready = ref(false);
    provide('allPrefixes', allPrefixes)
    watch(() => shapesDS.data.prefixesLoaded, async (newValue) => {
        console.log('prefixesLoaded changed:', shapesDS.data.prefixesLoaded);
        if (newValue) {
            // Get all prefixes and derive context from it
            Object.assign(allPrefixes, shapesDS.data.prefixes, rdfDS.data.prefixes, classDS.data.prefixes)
            var allPrefixKeys = Object.keys(allPrefixes)
            Object.keys(configVarsMain.prefixes).forEach(p => {
                if (allPrefixKeys.indexOf(p) < 0) {
                    allPrefixes[p] = configVarsMain.prefixes[p]
                }
            });
            console.log("ALL PREFIXES READY")
            console.log(toRaw(allPrefixes))

            if (configVarsMain.useService &&
                config.value.hasOwnProperty("service_fetch_before") &&
                config.value.service_fetch_before
            ) {
                console.log("service_fetch_before!")
                if (config.value.service_fetch_before["get-record"]?.length > 0) {
                    const fetchRPromises = config.value.service_fetch_before["get-record"].map(iri =>
                        fetchFromService('get-record', iri, allPrefixes)
                    )
                    var results = await Promise.allSettled(fetchRPromises)
                }
                if (config.value.service_fetch_before["get-records"]?.length > 0) {

                    const fetchRsPromises = config.value.service_fetch_before["get-records"].map(iri =>
                        fetchFromService('get-records', iri, allPrefixes)
                    )
                    var results = await Promise.allSettled(fetchRsPromises)
                }
            }
            setViewFromQuery()
            page_ready.value = true;
            // Get object with nodeshape uris as keys and their superclass arrays as values
            // This is necessary for ordering the properties according to their originating class, for display
            for (var uri of shapesDS.data.nodeShapeIRIs) {
                superClasses[uri] = getSuperClasses(uri, classDS.data.graph)
            }
            console.log("SUPERCLASSES:")
            console.log(toRaw(superClasses))
        }
    }, {immediate: true });


    // ---------------- //
    // SUBMISSION STUFF //
    // ---------------- //
    const canSubmit = ref(true)
    const submitButtonPressed = ref(false)
    function submitFn() {
        submitButtonPressed.value = true
    }
    provide('submitButtonPressed', submitButtonPressed)
    provide('submitFn', submitFn)
    provide('canSubmit', canSubmit)
    const noSubmitDialog = ref(false)
    const submitDialog = ref(false)
    provide('submitDialog', submitDialog)
    // When user clicks the submit button
    watch(submitButtonPressed, (newValue) => {
        if (newValue) {
            if (Object.keys(formData.content).length == 0) {
                noSubmitDialog.value = true;
                submitDialog.value = false;
            } else {
                submitDialog.value = true;
                noSubmitDialog.value = false;
            }
            submitButtonPressed.value = false;
        }
    }, { immediate: true });

    const activatedInstancesSelectEditor = ref(null)
    provide('activatedInstancesSelectEditor', activatedInstancesSelectEditor)
    const lastSavedNode = ref(null)
    provide('lastSavedNode', lastSavedNode)
    const itemsTrigger = ref(false)
    const queried_id = ref(null)
    const classRecordsLoading = ref(false)
    const idRecordLoading = ref(false)
    provide('editorMatchers', editorMatchers)
    provide('defaultEditor', defaultEditor)
    // Data for creating/editing items
    // Select a data type
    var selectedShape = ref(null)
    var selectedIRI = ref(null)
    // Select a data item
    var selectedItem = ref(null)
    // Create or edit a data item
    const addItem = ref(false)
    const newItemIdx = ref(null)
    const editItem = ref(false)
    const formOpen = ref(false)
    const drawer = ref(true)
    const editShapeIRI = ref(null)
    const editItemIdx = ref(null)
    const editMode = reactive({
        form: false,
        graph: false,
    })
    provide('editMode', editMode)
    onBeforeUpdate( () => {
        console.log("onBeforeUpdate ShaclVue")
        editItemIdx.value = null
        editShapeIRI.value = null
    })


    const debouncedUpdate = debounce(() => {
        if (openForms.length == 0) {
            console.log("CHECK: graphdata shaclvue")
            getInstanceItems()
        }
    }, 500)
    watch(() => rdfDS.data.graphChanged, debouncedUpdate, { deep: true })

    watch(instanceItemsComp, (newVal, oldVal) => {
        if (newTypeSelected) {
            newTypeSelected = false
            return
        }
        if (classRecordsLoading.value) {
            classRecordsLoading.value = false;
        }
    }, { deep: true });

    const idFilteredNodeShapeNames = computed(() =>{
        if (configVarsMain.showShapesWoID === true) {
            return shapesDS.data.nodeShapeNamesArray
        }
        var shapeNames = []
        for (var n of shapesDS.data.nodeShapeNamesArray) {
            if ( findObjectByKey(
                shapesDS.data.nodeShapes[shapesDS.data.nodeShapeNames[n]].properties,
                SHACL.path.value,
                ID_IRI.value)
            ) {
                shapeNames.push(n)
            }
        }
        return shapeNames
    })
    const filteredNodeShapeNames = computed(() =>{
        var names = idFilteredNodeShapeNames.value
        console.log(names)
        if (configVarsMain.hideClasses.length == 0) {
            return names
        }
        var shapeNames = []
        for (var n of names) {
            if (configVarsMain.hideClasses.indexOf(shapesDS.data.nodeShapeNames[n]) < 0) {
                shapeNames.push(n)
            }
        }
        return shapeNames
    })
    

    const formattedDescription = computed(() => {
        // For the class description, use a regular expression to replace text between backticks with <code> tags
        if (selectedShape.value) {
            return addCodeTagsToText(selectedShape.value[SHACL.description.value])
        } else { return '-'}
    })

    function clearField() {
        searchText.value = ""
    }


    async function selectType(IRI, fromUser, fromBackButton) {
        console.log(`Selecting type: ${IRI}`)
        console.log(filteredNodeShapeNames.value)
        console.log(shapesDS.data.nodeShapeNames)
        
        console.log(selectedItem.value)
        newTypeSelected = true;
        var tempSearchText = searchText.value
        var tempIRI = selectedIRI.value
        searchText.value = ""
        selectedIRI.value = IRI
        selectedShape.value = shapesDS.data.nodeShapes[IRI]
        if (config.value.use_service) {
            classRecordsLoading.value = true
            // First fetch rdf data from configured service
            var result = await fetchFromService('get-records', IRI, allPrefixes)
            console.log("fetchFromService results status:")
            console.log(result.status)
            // If there was an actual error during the try statement
            // before making the requests, relay error and deactivate loader
            if (result.status === null) {
                console.error(result.error)
                classRecordsLoading.value = false
            }
            // If any of the results were successful, don't set classRecordsLoading to false
            // because it will be set during the watch event for instanceItemsComp
            if (result.status.length && result.status.indexOf("success") >= 0 ) {
                // do nothing   
            } else {
                classRecordsLoading.value = false
            }
        }
        getInstanceItems()
        nextTick(() => {
            const el = mainContent.value?.$el || mainContent.value
            if (el) el.scrollTop = 0
        })
        if (fromUser) {
            updateURL(IRI)
        }

        if  (!fromUser || fromBackButton) {
            selectedItem.value = [IRI]
        }


        if (firstNavigationDone.value) {
            if (!fromBackButton) {
                if (IRI != tempIRI) {
                    internalHistory.value.push({
                        "iri": tempIRI,
                        "searchText": tempSearchText,
                    })
                }
            }
        } else {
            firstNavigationDone.value = true
        }
    }


    function goBack() {
        var previousView = internalHistory.value.pop()
        selectType(previousView.iri, true, true)
        searchText.value = previousView.searchText
    }

    function updateURL(IRI, edit) {
        var curie = toCURIE(IRI, allPrefixes)
        var queryParams = `?${encodeURIComponent("sh:NodeShape")}=${encodeURIComponent(curie)}`
        if (edit) {
            queryParams += '&edit=true'
        }
        history.replaceState(null, '', window.location.pathname + queryParams)
    }

    function getQueryParams() {
        const url = new URL(window.location)
        return url.searchParams
    }

    async function setViewFromQuery() {
        const qparams = getQueryParams()
        const nodeShape = qparams.get("sh:NodeShape")
        const instance_id = qparams.get("id")
        const token = qparams.get("token")
        const edit = qparams.get("edit")

        if (token) {
            setToken(token)
        }

        if (instance_id) {
            console.log("Queried ID FOUND")
            queried_id.value = instance_id
            console.log(queried_id.value)
        }

        if (nodeShape) {
            console.log("Queried nodeshape FOUND")
            // this could be a curie or iri
            // check if iri is in
            var nodeShapeIRI = toIRI(nodeShape, allPrefixes)
            if (shapesDS.data.nodeShapes[nodeShapeIRI]) {
                await selectType(nodeShapeIRI)
                if (edit) {
                    addInstanceItem()
                    updateURL(nodeShapeIRI, true)
                }
            } else {
                console.log("Queried nodeshape not found in shacl schema")
            }
        } else {
            console.log("nodeshape not in query params")
        }
    }

    function getClassIcon(class_iri) {
        if (configVarsMain.classIcons) {
            if (configVarsMain.classIcons[class_iri] ) {
                return configVarsMain.classIcons[class_iri]
            }
        }
        return "mdi-circle-outline"
    }
    provide('getClassIcon', getClassIcon)

    function addInstanceItem() {
        newItemIdx.value = null
        editItem.value = false
        addItem.value = false
        newItemIdx.value = crypto.randomUUID()
        addForm(selectedIRI.value, newItemIdx.value, 'new')
        addItem.value = true
        formOpen.value = true
        drawer.value = false
        canSubmit.value = false
        updateURL(selectedIRI.value, true)
    }

    async function editInstanceItem(instance) {
        // When user selects to edit, it will be either a namedNode or blankNode
        // and the related information would already be in the graph as triples
        // Also, related information might already be in formData if the user
        // created or edited the same node before in the same session. If not,
        // then a formData node has to be created from the triples in the graph.
        console.log(instance)
        addItem.value = false
        editItem.value = false
        var subjectTerm = instance.quad.subject
        var objectTerm = instance.quad.object
        if (objectTerm.termType === "NamedNode") {
            editShapeIRI.value = objectTerm.value
        } else {
            editShapeIRI.value = toIRI(objectTerm.value, allPrefixes)
        }
        editItemIdx.value = instance.value // this is the id

        // if the node is already in the formData, edit that
        if (formData.content[editShapeIRI.value]?.[editItemIdx.value]) {
            console.log("The node is already in the formData, we will edit that")
            editMode.form = true
            editMode.graph = false
        } else {
            // If not, we need to create the formData entries from quads in the dataset
            formData.quadsToFormData(editShapeIRI.value, subjectTerm, rdfDS)
            editMode.form = false
            editMode.graph = true
        }
        // open formEditor
        addForm(editShapeIRI.value, editItemIdx.value, 'edit')
        editItem.value = true
        formOpen.value = true
        drawer.value = false
        canSubmit.value = false
    }
    provide('editInstanceItem', editInstanceItem)



    function getInstanceItems() {
        // ---
        // The goal of this method is to populate the list of data objects of the selected type
        // ---
        console.log("(re)calculating shaclvue list of records")

        var x = itemsTrigger.value

        if (!selectedIRI.value) {
            return []
        }
        // find nodes with triple predicate == rdf:type, and triple object == the selected class
        var quads = rdfDS.getLiteralAndNamedNodes(namedNode(RDF.type.value), selectedIRI.value, allPrefixes)
        // Create list items from quads
        var instanceItemsArr = []
        quads.forEach(quad => {
            var extra = ''
            if (quad.subject.termType === 'BlankNode') {
                extra = ' (BlankNode)'
            }
            var relatedTrips = rdfDS.getSubjectTriples(quad.subject)
            var item = {
                title: quad.subject.value + extra,
                value: quad.subject.value,
                props: { subtitle: quad.object.value, 'quad': quad },
            }
            relatedTrips.forEach(quad => {
                if (!Object.hasOwn(item.props, quad.predicate.value)) {
                    item.props[quad.predicate.value] = []
                }
                if (quad.object.termType === "BlankNode") {
                    var bnItem = {}
                    var blankNodeTrips = rdfDS.getSubjectTriples(quad.object)
                    blankNodeTrips.forEach(bnquad => {
                        bnItem[bnquad.predicate.value] = bnquad.object.value
                    })
                    item.props[quad.predicate.value].push(bnItem)
                } else {
                    item.props[quad.predicate.value].push(quad.object.value)
                }
            })
            item.props._prefLabel = ""
            if (item.props.hasOwnProperty(SKOS.prefLabel.value)){
                item.props._prefLabel = item.props[SKOS.prefLabel.value][0]
            }
            instanceItemsArr.push(item)
        });
        instanceItemsComp.value = [...instanceItemsArr]
    }

    const filteredInstanceItemsComp = computed(() =>{
        var c = orderTopDown.value ? 1 : -1
        if (!instanceItemsComp.value.length) return []
        return [...instanceItemsComp.value].filter((item) =>{
            if (searchText.value.length == 0) return true
            return item.props._prefLabel.toLowerCase().includes(searchText.value.toLowerCase())
                || item.title.toLowerCase().includes(searchText.value.toLowerCase())
        }).sort((a, b) => c * a.props._prefLabel.toLowerCase().localeCompare(b.props._prefLabel.toLowerCase()));
    });

    async function handleInternalNavigation({ recordClass, recordPID }) {
        console.log('Received:', recordClass, recordPID);
        await selectType(recordClass, true)
        searchText.value = recordPID
    }

    const orderIcon = ref("mdi-arrow-down-thick")
    const orderTopDown = ref(true)

    function toggleOrder() {
        orderTopDown.value = !orderTopDown.value;
        if (orderTopDown.value) {
            orderIcon.value = "mdi-arrow-down-thick"
        } else {
            orderIcon.value = "mdi-arrow-up-thick"
        }

    }

    const openForms = reactive([])
    const currentOpenForm = computed(() => {
        if (openForms.length > 0) {
            return 'panel' + openForms.length.toString();
        }
        return null;
    })

    function addForm(shapeIRI, nodeIDX, formType) {
        for (var i=0;i<openForms.length;i++) {
            openForms[i].disabled = true;
        }
        openForms.push({
            "shapeIRI": shapeIRI,
            "nodeIDX": nodeIDX,
            "formType": formType,
            "disabled": false,
            "activatedInstancesSelectEditor": null,
        })
        nextTick(() => {
            const el = mainContent.value?.$el || mainContent.value
            if (el) el.scrollTop = 0
        })
    }

    function removeForm(savedNode) {
        if (savedNode) {
            lastSavedNode.value = savedNode
        }
        openForms.pop()
        if (openForms.length > 0) {
            openForms.at(-1).disabled = false
        } else {
            editItem.value = false
            formOpen.value = false
            drawer.value = true
            canSubmit.value = true
            editMode.form = editMode.graph = false
            updateURL(selectedIRI.value, false)
            if (savedNode) {
                getInstanceItems()
            }
            classRecordsLoading.value = false
        }
    }
    provide('addForm', addForm)
    provide('openForms', openForms)
    provide('removeForm', removeForm)

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
        overflow: hidden;    /* Hide overflowed text */
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
</style>
