<template>
  <v-sheet class="pa-4" border rounded elevation="2">
    <div style="display: flex;">
      <h2>{{ toCURIE(props.shape_iri, shapePrefixes) }}</h2>
      <span v-if="validationErrors.length" style="margin-left: auto;">
        <v-menu location="end">
            <template v-slot:activator="{ props }">
                <v-btn color="warning" v-bind="props" density="compact" icon="mdi-alert-circle-outline"></v-btn>
            </template>
            <v-list>
                <v-list-item v-for="e of validationErrors" @click="">
                    <v-list-item-title> <em>{{ e.name }}</em></v-list-item-title>
                    <v-list-item-subtitle>{{ e.message }}</v-list-item-subtitle>
                </v-list-item>
            </v-list>
        </v-menu>
      </span>
    </div>
    
    <br>
    <p>{{ shape_obj[SHACL.description] }}</p>
    <br>
    <v-form ref="form" v-model="formValid" validate-on="lazy input" @submit.prevent="saveForm()" >
        <NodeShapeEditor :key="props.shape_iri" :shape_iri="props.shape_iri"/>
        <div style="display: flex;">
          <v-btn
              class="mt-2"
              text="Reset"
              @click="resetForm()"
              style="margin-left: auto; margin-right: 1em;"
          ></v-btn>
          <v-btn
              class="mt-2"
              text="Save"
              type="submit"
          ></v-btn>
        </div>
    </v-form>
  </v-sheet>
</template>


<script setup>
  import { ref, onMounted, onBeforeMount, provide, inject, reactive} from 'vue'
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
  
  const add_empty_node = inject('add_empty_node')
  const shapePrefixes = inject('shapePrefixes');
  const nodeShapes = inject('nodeShapes')
  const shape_obj = nodeShapes.value[props.shape_iri]
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


  // ----------------- //
  // Lifecycle methods //
  // ----------------- //

  onBeforeMount(() => {
    console.log(`the FormEditor component is about to be mounted.`)
  })

  onMounted(() => {
    console.log(`the FormEditor component is now mounted.`)
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
        add_empty_node(props.shape_iri);
      } else {
        console.log("Still some validation errors, bro");

        validationResult.errors.forEach(error => {
          const id = error.id;
          const fieldData = fieldMap[id];
          if (fieldData) {
            validationErrors.value.push({
              name: fieldData.name,
              message: error.errorMessages.join(', '),
            });
          }
        });
      }
    } catch (error) {
      console.error("Validation failed:", error);
    }
  }

  function resetForm() {
    form.value.reset()
  }



</script>