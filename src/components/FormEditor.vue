<template>
  <v-sheet class="pa-4" border rounded elevation="2">
    <div style="display: flex; position: relative; ">
      <h2>{{ toCURIE(localShapeIri, shapePrefixes) }}</h2>

      <div style="margin-left: auto; " class="top-1">
        <v-switch
          v-model="show_all_fields"
          :label="`All fields`"
          hide-details
          color="primary"
        ></v-switch>
      </div>

      
      <div v-if="validationErrors.length" class="position-sticky top-4" style="margin-left: 1em;">
        <v-menu location="end">
            <template v-slot:activator="{ props }">
                <v-btn color="warning" v-bind="props" density="compact" icon="mdi-alert-circle-outline"></v-btn>
            </template>
            <v-list>
                <v-list-item v-for="e of validationErrors" @click="goToError(e)">
                    <v-list-item-title> <em>{{ e.name }}</em></v-list-item-title>
                    <v-list-item-subtitle>{{ e.message }}</v-list-item-subtitle>
                </v-list-item>
            </v-list>
        </v-menu>
      </div>
    </div>
    
    <br>
    <p>{{ shape_obj ? shape_obj[SHACL.description] : '-' }}</p>
    <br>
    <v-form ref="form" v-model="formValid" validate-on="lazy input" @submit.prevent="saveForm()" >
        <NodeShapeEditor :key="localShapeIri" :shape_iri="localShapeIri" :node_idx="localNodeIdx"/>
        <div style="display: flex;">

          <v-btn
              class="mt-2"
              text="Cancel"
              @click="cancelForm()"
              style="margin-left: auto; margin-right: 1em;"
              prepend-icon="mdi-close-box"
          ></v-btn>
          <v-btn
              class="mt-2"
              text="Reset"
              @click="resetForm()"
              style="margin-right: 1em;"
              prepend-icon="mdi-undo"
          ></v-btn>
          <v-btn
              class="mt-2"
              text="Save"
              type="submit"
              prepend-icon="mdi-content-save"
          ></v-btn>
        </div>
    </v-form>
  </v-sheet>
</template>


<script setup>
  import { ref, onMounted, onBeforeMount, onBeforeUnmount, provide, inject, reactive} from 'vue'
  import { SHACL } from '../modules/namespaces'
  import { toCURIE } from '../modules/utils';
  const graphData = inject('graphData')

  // ----- //
  // Props //
  // ----- //

  const props = defineProps({
      shape_iri: String,
      node_idx: Number,
  })

  // ---- //
  // Data //
  // ---- //
  const localShapeIri = ref(props.shape_iri);
  const localNodeIdx = ref(props.node_idx);
  const show_all_fields = ref(false)
  const save_node = inject('save_node')
  const clear_current_node = inject('clear_current_node')
  const remove_current_node = inject('remove_current_node')
  const shapePrefixes = inject('shapePrefixes');
  const nodeShapes = inject('nodeShapes')
  const cancelFormHandler = inject('cancelFormHandler')
  const saveFormHandler = inject('saveFormHandler')
  const editMode = inject('editMode')
  const shape_obj = nodeShapes.value[localShapeIri.value]
  const form = ref(null)
  const formValid = ref(null)
  const fieldMap = reactive({}); // Maps element IDs to human-readable labels
  const validationErrors = ref([]);

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
    // console.log(`the FormEditor component is about to be mounted.`)
  })

  onBeforeUnmount(() => {
      // console.log("Running onBeforeUnmount for formeditor")
      localShapeIri.value = null
  });

  onMounted(() => {
    // console.log(`the FormEditor component is now mounted.`)
    // console.log(shape_obj)
  })

  // ------------------- //
  // Computed properties //
  // ------------------- //



  // --------- //
  // Functions //
  // --------- //

  async function saveForm() {
    try {
      validationErrors.value = []
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
        save_node(localShapeIri.value, localNodeIdx.value, nodeShapes.value, graphData, editMode.form || editMode.graph);
        saveFormHandler()
      } else {
        console.log("Still some validation errors, bro");

        validationResult.errors.forEach(error => {
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
      console.error("Validation failed:", error);
    }
  }

  function resetForm() {
    clear_current_node(localShapeIri.value, localNodeIdx.value)
    form.value.resetValidation();
    validationErrors.value = []

  }

  function cancelForm() {
    console.log("Cancelling form from FormEditor")
    if (!editMode.form) {
      console.log(`Removing current node: ${localShapeIri.value} - ${localNodeIdx.value}`)
      remove_current_node(localShapeIri.value, localNodeIdx.value)
    }
    cancelFormHandler();
  }

  function goToError(e) {
    console.log(e)
    var el = document.getElementById(e.element_id)
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth'
      });
    } else {
      el = document.getElementById(e.element_id + '-messages')
      if (el) {
        el.scrollIntoView({
          behavior: 'smooth'
        });
      }
    }
  }



</script>