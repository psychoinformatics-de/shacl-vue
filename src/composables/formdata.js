// formdata.js
import { reactive, ref } from 'vue'

// by convention, composable function names start with "use"
export function useFormData() {
  // state encapsulated and managed by the composable

  const formData = reactive({})

  // a composable can update its managed state over time.
  function add_triple(node_uid, triple_uid) {
    // if the node uid exists and the triple does not exist, add it
    if (Object.keys(formData).indexOf(node_uid) >= 0) {
      if (Object.keys(formData[node_uid]).indexOf(triple_uid) < 0) {
        formData[node_uid][triple_uid] = ref(null)
        console.log(`Added triple to formData: ${triple_uid} -> ${node_uid}`)
      } else {
        console.log(`Triple UID already in formData: ${triple_uid}`)
      }
    } else {
      console.log(`Node UID not in formData yet: ${node_uid}. not doing anything...`)
    }
  }

  function add_node(node_uid) {
    if (Object.keys(formData).indexOf(node_uid) < 0) {
      formData[node_uid] = ref({})
      console.log(`Added node to formData: ${node_uid}`)
    } else {
      console.log(`Node UID already in formData: ${node_uid}`)
    }
  }

  function remove_triple(node_uid) {
    delete formData[node_uid]
  }

  function edit_triple(node_uid, part, newVal) {
    console.log("editing triple from composable")
    formData[node_uid][part] = newVal
  }

  // expose managed state as return value
  return {
    formData,
    add_triple,
    add_node,
    remove_triple,
    edit_triple
  }
}
