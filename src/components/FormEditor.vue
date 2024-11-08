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
    <p>{{ shape_obj[SHACL.description] }}</p>
    <br>
    <v-form ref="form" v-model="formValid" validate-on="lazy input" @submit.prevent="saveForm()" >
        <NodeShapeEditor :key="localShapeIri" :shape_iri="localShapeIri" />
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

  // ----- //
  // Props //
  // ----- //

  const props = defineProps({
      shape_iri: String,
  })

  // ---- //
  // Data //
  // ---- //
  const localShapeIri = ref(props.shape_iri);
  const show_all_fields = ref(false)
  const save_node = inject('save_node')
  const clear_current_node = inject('clear_current_node')
  const remove_current_node = inject('remove_current_node')
  const shapePrefixes = inject('shapePrefixes');
  const nodeShapes = inject('nodeShapes')
  const cancelFormHandler = inject('cancelFormHandler')
  const saveFormHandler = inject('saveFormHandler')
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
    console.log(`the FormEditor component is about to be mounted.`)
  })

  onBeforeUnmount(() => {
      console.log("Running onBeforeUnmount for formeditor")
      localShapeIri.value = null
  });

  onMounted(() => {
    console.log(`the FormEditor component is now mounted.`)
    console.log(shape_obj)
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
        save_node(localShapeIri.value, nodeShapes.value);
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
    clear_current_node(localShapeIri.value)
    form.value.resetValidation();
    validationErrors.value = []

  }

  function cancelForm() {
    console.log("Cancelling form from FormEditor")
    console.log(`Removing current node: ${localShapeIri.value}`)
    remove_current_node(localShapeIri.value)
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