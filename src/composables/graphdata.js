// graphdata.js
import { reactive, ref, onMounted, onUnmounted } from 'vue'

// by convention, composable function names start with "use"
export function useGraph() {
  // state encapsulated and managed by the composable

  const graph = reactive({})

  // a composable can update its managed state over time.
  function add_triple(node_uid) {
    graph[node_uid] = {
      subject: ref(""),
      predicate: ref(""),
      object: ref("")
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
    remove_triple,
    edit_triple
  }
}
