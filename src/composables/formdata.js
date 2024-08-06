// formdata.js


import { reactive, ref } from 'vue'

export function useFormData() {

  const formData = reactive({})

  function add_empty_node(node_uid) {
    // if the node key does not exist in the lookup object yet, add it
    // if the node key already exists in the lookup object, do nothing
    console.log("Inside add_empty_node function in formdata composable")
    if (Object.keys(formData).indexOf(node_uid) < 0) {
      // The added value is an array of objects to allow multiple of the same
      // nodes to be added
      formData[node_uid] = reactive([{}])
      console.log(`Node ${node_uid} added`, formData[node_uid].value)
    } else {
      formData[node_uid].push({})
    }
  }

  function add_empty_triple(node_uid, triple_uid) {
    // if the node uid exists and the triple uid (predicate) does not exist, add it
    // if the node uid exists and the triple uid already exists, add empty value to array
    // if the node uid does not exist, print console error because this should not be possible
    if (Object.keys(formData).indexOf(node_uid) >= 0) {
      // Current node being edited is always the last in the array of nodes
      if (Object.keys(formData[node_uid].at(-1)).indexOf(triple_uid) < 0) {
        formData[node_uid].at(-1)[triple_uid] = reactive([null])
        console.log(`Triple ${triple_uid} added to node ${node_uid}`, formData[node_uid].value)
      } else {
        formData[node_uid].at(-1)[triple_uid].push(null)
      }
    } else {
      console.error(`Node UID not in formData yet: ${node_uid}. Cannot add triple to non-existing node.`)
    }
  }

  function save_node(node_uid) {
    // TODO: handle error if the node key does not exist in the lookup object yet
    // Check if the node exists before logging
    if (formData[node_uid]) {
      console.log("Inside save_node function in formdata composable")
      console.log(node_uid)
      console.log(formData[node_uid])
      formData[node_uid].push({})
    } else {
      console.error(`Node ${node_uid} does not exist`)
    }
  }

  function remove_triple(node_uid, triple_uid, triple_idx) {
    if (Object.keys(formData).indexOf(node_uid) >= 0) {
      // Current node being edited is always the last in the array of nodes
      if (Object.keys(formData[node_uid].at(-1)).indexOf(triple_uid) < 0) {
        console.error(`Triple UID ${triple_uid} not in specific node ${node_uid} in formData. Cannot remove non-existing triple.`)
      } else {
        formData[node_uid].at(-1)[triple_uid].splice(triple_idx, 1)
      }
    } else {
      console.error(`Node UID not in formData: ${node_uid}. Cannot remove triple from non-existing node.`)
    }
  }

  // expose managed state as return value
  return {
    formData,
    add_empty_node,
    add_empty_triple,
    remove_triple,
    save_node
  }
}
