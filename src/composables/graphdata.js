// graphdata.js
import { reactive, ref, onMounted, onUnmounted } from 'vue'

// by convention, composable function names start with "use"
export function useGraph() {
  // state encapsulated and managed by the composable

  const graph = reactive({})

  // a composable can update its managed state over time.
  function add_triple(node_uid, triple_uid) {

    // if the  node uid exists and the triple does not exist, add it
    if (Object.keys(graph).indexOf(node_uid) >= 0) {
      if (Object.keys(graph[node_uid].properties).indexOf(triple_uid) < 0) {
        graph[node_uid].properties[triple_uid] = {
          subject: ref(null),
          predicate: ref(null),
          object: ref(null)
        }
        console.log(`Added triple to graph: ${triple_uid} -> ${node_uid}`)
      } else {
        console.log(`Triple UID already in graph: ${triple_uid}`)
      }
    } else {
      console.log(`Node UID not in graph yet: ${node_uid}. not doing anything...`)
    }
  }


  function add_node(node_uid) {
    if (Object.keys(graph).indexOf(node_uid) < 0) {
      graph[node_uid] = {
        subject: ref(null),
        predicate: ref(null),
        object: ref(null),
        properties: ref({}),
      }
      console.log(`Added node to graph: ${node_uid}`)
    } else {
      console.log(`Node UID already in graph: ${node_uid}`)
    }
  }

  function remove_triple(node_uid) {
    delete graph[node_uid]
  }

  function edit_triple(node_uid, part, newVal) {
    console.log("editing triple from composable")
    graph[node_uid][part] = newVal
  }

  // expose managed state as return value
  return {
    graph,
    add_triple,
    add_node,
    remove_triple,
    edit_triple
  }
}
