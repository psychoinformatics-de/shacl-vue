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
                            permanent
                        >
                            <v-list nav selectable :disabled="formOpen" v-model:selected="selectedItem">
                                <v-list-item  value="data"><h4>Data Types</h4></v-list-item>
                                <!-- <v-text-field variant="outlined" append-inner-icon="mdi-magnify" density="compact"></v-text-field> -->
                                <v-list-item
                                    v-for="node in idFilteredNodeShapeNames"
                                    :prepend-icon="getClassIcon(shapesDS.data.nodeShapeNames[node])"
                                    :title="node"
                                    @click="selectType(shapesDS.data.nodeShapeNames[node], true)">
                                </v-list-item>
                            </v-list>
                        </v-navigation-drawer>
                        <v-main style="min-height: 90vh">
                            <v-container fluid>
                                <v-row>
                                    <v-col
                                        :cols="formOpen ? 3 : 12"
                                        class="transition-all"
                                        :class="formOpen ? 'opacity-column' : ''"
                                    >
                                        
                                        <span v-if="selectedIRI">
                                            <h2 class="mx-4 mb-4 truncate-heading">
                                                {{ toCURIE(selectedIRI, allPrefixes) }}
                                                &nbsp;&nbsp; <v-btn icon="mdi-plus" size="x-small" variant="tonal" @click="addInstanceItem()"></v-btn>
                                            </h2>

                                            <p class="mx-4 mb-4" v-html="formattedDescription"></p>
                                            
                                            <span v-if="classRecordsLoading">
                                                <v-skeleton-loader type="list-item-avatar"></v-skeleton-loader>
                                            </span>
                                            <span v-else>
                                                <div v-if="instanceItemsComp.length">
                                                    <span v-for="r in instanceItemsComp">
                                                        <NodeShapeViewer :classIRI="selectedIRI" :quad="r.props.quad" :key="selectedIRI + '-' + r.title + '-' + itemsTrigger" :formOpen="formOpen" :variant="r.title == queried_id ? 'outlined' : 'tonal'"></NodeShapeViewer>
                                                    </span>
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
                                                <v-expansion-panel-title> <h2><em>Editing: {{ toCURIE(f.shapeIRI, allPrefixes) }} </em></h2></v-expansion-panel-title>
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
                <v-dialog v-model="submitDialog" max-width="500">
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
    </v-main>
    <AppFooter />
</template>


<script setup>
    import { effect, ref, computed, provide, watch, reactive, onBeforeUpdate, nextTick, toRaw} from 'vue'
    import { useConfig } from '@/composables/configuration';
    import { adjustHexColor, findObjectByKey, addCodeTagsToText } from '../modules/utils';
    import {toCURIE, toIRI} from 'shacl-tulip'
    import editorMatchers from '@/modules/editors';
    import defaultEditor from '@/components/UnknownEditor.vue';
    import { useData } from '@/composables/useData';
    import { useClasses } from '@/composables/useClasses';
    import { useShapes } from '@/composables/useShapes';
    import { useForm } from '@/composables/useForm';
    import rdf from 'rdf-ext'
    import {SHACL, RDF, RDFS, DLTHINGS, XSD} from '@/modules/namespaces'

    const props = defineProps({
        configUrl: String
    })

    // ---------------------------------------------------- //
    // CONFIGURATION, AND LOADING SHAPES/CLASSES/DATA/FORMS //
    // ---------------------------------------------------- //
    const config_ready = ref(false)
    const { config, configFetched, configError, configVarsMain, loadConfigVars} = useConfig(props.configUrl);
    const { rdfDS, getRdfData, fetchFromService } = useData(config)
    const { classDS, getClassData } = useClasses(config)
    const { shapesDS, getSHACLschema } = useShapes(config)
    const { formData, submitFormData } = useForm(config)
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
            config_ready.value = true

            formData.ID_IRI = ID_IRI.value
            console.log("vkljhgvkcf")
            console.log(toRaw(formData.content))
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
                    for (var iri of config.value.service_fetch_before["get-record"]) {
                        console.log(`fetching record upfront: ${iri}`)
                        await fetchFromService('get-record', iri, allPrefixes)
                    }
                }
                if (config.value.service_fetch_before["get-records"]?.length > 0) {
                    for (var iri of config.value.service_fetch_before["get-records"]) {
                        console.log(`fetching recordS upfront: ${iri}`)
                        await fetchFromService('get-records', iri, allPrefixes)
                    }
                }                
            }
            setViewFromQuery()
            page_ready.value = true
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
            if (Object.keys(formData).length == 0) {
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
    watch(rdfDS.data.graph, () => {
        console.log("Graphdata UPDATED SHACLVUE")
        itemsTrigger.value = !itemsTrigger.value
    }, { deep: true });

    const formattedDescription = computed(() => {
        // For the class description, use a regular expression to replace text between backticks with <code> tags
        if (selectedShape.value) {
            return addCodeTagsToText(selectedShape.value[SHACL.description])
        } else { return '-'}
    })

    async function selectType(IRI, fromUser) {
        selectedIRI.value = IRI
        selectedShape.value = shapesDS.data.nodeShapes[IRI]
        if (config.value.use_service) {
            classRecordsLoading.value = true
            // First fetch rdf data from configured service
            await fetchFromService('get-records', IRI, allPrefixes)
            classRecordsLoading.value = false
            // Then continue with the rest
            await nextTick();
        }
        if (fromUser) updateURL(IRI)
    }

    function updateURL(IRI) {
        var curie = toCURIE(IRI, allPrefixes)
        var queryParams = `?${encodeURIComponent("sh:NodeShape")}=${encodeURIComponent(curie)}`
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
        newItemIdx.value = '_:' + crypto.randomUUID()
        addForm(selectedIRI.value, newItemIdx.value, 'new')
        addItem.value = true
        formOpen.value = true
        drawer.value = false
        canSubmit.value = false
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

        // See: https://hub.datalad.org/datalink/annotate-trr379-demo/issues/32
        // leaving the following commented out for now:
        // if (config.value.use_service) {
        //     idRecordLoading.value = true
        //     // First fetch rdf data from configured service
        //     await fetchFromService('get-record', editItemIdx.value, allPrefixes)
        //     idRecordLoading.value = false
        //     // Then continue with the rest
        //     await nextTick();
        // }

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
        window.scrollTo(0,0);
    }
    provide('editInstanceItem', editInstanceItem)


    const instanceItemsComp = computed(() =>{
        // ---
        // The goal of this method is to populate the list of data objects of the selected type
        // ---

        var x = itemsTrigger.value

        if (!selectedIRI.value) {
            return []
        }
        // find nodes with triple predicate == rdf:type, and triple object == the selected class
        var quads = rdfDS.getLiteralAndNamedNodes(rdf.namedNode(RDF.type), selectedIRI.value, allPrefixes)
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
            instanceItemsArr.push(item)
        });
        return instanceItemsArr
    })

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
        }
    }
    provide('addForm', addForm)
    provide('openForms', openForms)
    provide('removeForm', removeForm)

</script>

<style>
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