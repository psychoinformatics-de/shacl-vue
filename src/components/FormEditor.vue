<template>
    <v-sheet ref="mainSheet" class="pa-4 scaled-sheet" border rounded elevation="2">
        <div style="display: flex; position: relative">
            <h3>
                {{ getDisplayName(localShapeIri, configVarsMain, allPrefixes, shape_obj) }}
            </h3>

            <div style="display: flex; margin-left: auto">
                <v-btn
                    text="Cancel"
                    @click="cancelForm()"
                    style="margin-left: auto; margin-right: 1em"
                    prepend-icon="mdi-close-box"
                ></v-btn>
                <v-btn
                    text="Reset"
                    @click="resetForm()"
                    style="margin-right: 1em"
                    prepend-icon="mdi-undo"
                ></v-btn>
                <v-btn
                    text="Save"
                    type="submit"
                    @click="saveForm()"
                    prepend-icon="mdi-content-save"
                ></v-btn>
            </div>

            <div
                v-if="validationErrors.length"
                class="position-sticky top-4"
                style="margin-left: 1em"
            >
                <v-menu location="end">
                    <template v-slot:activator="{ props }">
                        <v-btn
                            color="warning"
                            v-bind="props"
                            density="compact"
                            icon="mdi-alert-circle-outline"
                        ></v-btn>
                    </template>
                    <v-list>
                        <v-list-item
                            v-for="e of validationErrors"
                            @click="goToError(e)"
                        >
                            <v-list-item-title>
                                <em>{{ e.name }}</em></v-list-item-title
                            >
                            <v-list-item-subtitle>{{
                                e.message
                            }}</v-list-item-subtitle>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </div>
        </div>

        <span v-if="localNodeIdx && localShapeIri">
            <v-form
                ref="form"
                v-model="formValid"
                validate-on="lazy input"
                @submit.prevent="saveForm()"
            >
                <br />
                <p v-html="formattedDescription" class="quote-description"></p>
                <br />
                <div class="top-1">
                    <v-switch
                        v-model="show_all_fields"
                        :label="`All fields`"
                        hide-details
                        color="primary"
                    ></v-switch>
                </div>
                <NodeShapeEditor
                    :key="localShapeIri"
                    :shape_iri="localShapeIri"
                    :node_idx="localNodeIdx"
                />
                <div style="display: flex">
                    <v-tooltip text="Scroll to top" location="top">
                        <template v-slot:activator="{ props }">
                            <v-btn
                                icon="mdi-arrow-up-bold"
                                @click="scrollToTop()"
                                style="margin-left: auto"
                                v-bind="props"
                            ></v-btn>
                        </template>
                    </v-tooltip>
                </div>
            </v-form>
        </span>
    </v-sheet>
</template>

<script setup>
import {
    ref,
    onMounted,
    onBeforeMount,
    onBeforeUnmount,
    provide,
    inject,
    reactive,
    computed,
    toRaw,
    nextTick,
} from 'vue';
import { SHACL } from '../modules/namespaces';
import {
    addCodeTagsToText,
    getDisplayName,
    findObjectByKey,
} from '../modules/utils';

// ----- //
// Props //
// ----- //

const props = defineProps({
    shape_iri: String,
    node_idx: String,
});

// ---- //
// Data //
// ---- //
const mainSheet = ref(null)
const localShapeIri = ref(props.shape_iri);
const localNodeIdx = ref(props.node_idx);
const shapesDS = inject('shapesDS');
const rdfDS = inject('rdfDS');
const formData = inject('formData');
const config = inject('config');
const show_all_fields = ref(false);
const ID_IRI = inject('ID_IRI');
const allPrefixes = inject('allPrefixes');
const cancelFormHandler = inject('cancelFormHandler');
const saveFormHandler = inject('saveFormHandler');
const editMode = inject('editMode');
const removeForm = inject('removeForm');
const savedNodes = inject('savedNodes');
const nodesToSubmit = inject('nodesToSubmit');
const shape_obj = shapesDS.data.nodeShapes[localShapeIri.value];
const form = ref(null);
const formValid = ref(null);
const fieldMap = reactive({}); // Maps element IDs to human-readable labels
const validationErrors = ref([]);
const configVarsMain = inject('configVarsMain');
function registerRef(id, fieldData) {
    fieldMap[id] = fieldData;
}
function unregisterRef(id) {
    delete fieldMap[id];
}

provide('registerRef', registerRef);
provide('unregisterRef', unregisterRef);
provide('show_all_fields', show_all_fields);

// ----------------- //
// Lifecycle methods //
// ----------------- //

onBeforeMount(() => {
    console.log(`the FormEditor component is about to be mounted.`);
    formData.addSubject(localShapeIri.value, localNodeIdx.value);

    if (config.value.hasOwnProperty('show_all_fields')) {
        if (
            typeof config.value.show_all_fields == 'boolean' &&
            config.value.show_all_fields
        ) {
            show_all_fields.value = true;
        }
    }
});

onBeforeUnmount(() => {
    console.log(`Running onBeforeUnmount for formeditor: ${props.shape_iri}`);
    localShapeIri.value = null;
});

onMounted(() => {
    console.log(`the FormEditor component is now mounted: ${props.shape_iri}`);
});

// ------------------- //
// Computed properties //
// ------------------- //

const formattedDescription = computed(() => {
    // For the class description, use a regular expression to replace text between backticks with <code> tags
    if (shape_obj) {
        return addCodeTagsToText(shape_obj[SHACL.description.value]);
    } else {
        return '-';
    }
});

// --------- //
// Functions //
// --------- //

async function saveForm() {
    try {
        validationErrors.value = [];
        // Await the validation result
        const validationResult = await form.value.validate();
        if (validationResult.valid) {
            // If the form is valid, proceed with form submission

            // Here, we distinguish between saving a newly created and completed form,
            // and saving a form that is being edited and was previously saved. The former
            // follows a standard workflow in one direction: from formData to graphData;
            // the latter requires tasks to be completed on both ends, specifically: deleting
            // existing quads from graphData before creating the updated quads from formData.
            // One thing that needs to be tracked externally is whether the value of ID_IRI
            // property of the node (if it has one) has changed, i.e. whether the user edited
            // the node's ID, because this will require additional steps. Below, we pass the
            // editMode variable to `save_node` in order to know whether this was a form for
            // a newly created node or for a pre-existing one, but the pre-edit and post-edit
            // values of the ID_IRI field is only known within the corresponding `PropertyShapeEditor`
            // component, so this needs to be indexed or passed or provided somehow to the
            // `save_node` function. TODO.
            // Update: Rethinking this, the pre-edit value of the ID_IRI field
            // would be the same as the localNodeIdx.value (IRI of blankNode or namedNode) and the
            // post-edit value would be in formData, so we have everything we need in `save_node`.

            // Note the "additional steps" needed when the node IRI is altered is to RE-reference
            // existing triples in the graph that has the current node as object. This is only
            // necessary for namedNodes where the IRI changed. The process will need to be:
            // - only do the following if the node is a namedNode and if the IRI changed during editing
            // - find all triples with the node IRI as object -> oldTriples
            // - for each triple in oldTriples: create a new one with same subject and predicate
            //   and with new IRI as object, then delete the old triple
            console.log('going to save form now');
            // var saved_node = save_node(localShapeIri.value, localNodeIdx.value, nodeShapes.value, graphData, editMode.form || editMode.graph, ID_IRI.value, allPrefixes);
            const reactiveCloneFunc = (data) => {
                console.log('using reactiveCloneFunc with data:');
                console.log(toRaw(data));
                return structuredClone(toRaw(data));
            };
            var saved_node = formData.saveNode(
                localShapeIri.value,
                localNodeIdx.value,
                shapesDS,
                rdfDS,
                editMode.form || editMode.graph,
                reactiveCloneFunc
            );
            // saved_node = {
            //   nodeshape_iri: "",
            //   node_iri: ""
            // }
            savedNodes.value.push(saved_node);
            // In order for the node to be submitted, it should have a PID
            // (because blank nodes aren't submitted as such, they are resolved
            // into named nodes), and it should not already be in nodesToSubmit.value.
            // Check if node has PID:
            // if the nodeshape does NOT have a propertyshape with sh:path being equal to ID_IRI,
            // it means the class's records will be blank nodes these should not be submitted
            var nodeShape = shapesDS.data.nodeShapes[saved_node.nodeshape_iri];
            var ps = nodeShape.properties.find(
                (prop) => prop[SHACL.path.value] == ID_IRI.value
            );
            if (
                ps &&
                !findObjectByKey(
                    nodesToSubmit.value,
                    'node_iri',
                    saved_node.node_iri
                )
            ) {
                nodesToSubmit.value.push(saved_node);
            }
            removeForm(saved_node);
            if (typeof saveFormHandler === 'function') {
                saveFormHandler();
            }
        } else {
            console.log('Still some validation errors, bro');
            validationResult.errors.forEach((error) => {
                const id = error.id;
                const fieldData = fieldMap[id];
                if (fieldData) {
                    validationErrors.value.push({
                        name: fieldData.name,
                        message: error.errorMessages.join(', '),
                        element_id: error.id,
                    });
                }
            });
        }
    } catch (error) {
        console.error('Validation failed:', error);
    }
}

function resetForm() {
    formData.clearSubject(localShapeIri.value, localNodeIdx.value);
    form.value.resetValidation();
    validationErrors.value = [];
}

function cancelForm() {
    console.log('Cancelling form from FormEditor');
    if (!editMode.form) {
        console.log(
            `Removing current node: ${localShapeIri.value} - ${localNodeIdx.value}`
        );
        formData.removeSubject(localShapeIri.value, localNodeIdx.value);
    }
    removeForm(null);
    if (typeof cancelFormHandler === 'function') {
        cancelFormHandler();
    }
}

function scrollAllParentsToTop(el) {
  while (el) {
    if (el.scrollTop > 0) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }
    el = el.parentElement;
  }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    nextTick(() => {
        const baseEl = mainSheet.value?.$el || mainSheet.value;
        if (baseEl) scrollAllParentsToTop(baseEl);
    });
}

function goToError(e) {
    console.log(e);
    var el = document.getElementById(e.element_id);
    if (el) {
        el.scrollIntoView({
            behavior: 'smooth',
        });
    } else {
        el = document.getElementById(e.element_id + '-messages');
        if (el) {
            el.scrollIntoView({
                behavior: 'smooth',
            });
        }
    }
}
</script>

<style scoped>
.scaled-sheet {
    transform: scale(0.9);
    transform-origin: top;
}
.quote-description {
    border-left: 3px solid rgb(154, 153, 153);
    padding-left: 1em;
    color: rgb(97, 97, 97);
}
</style>
