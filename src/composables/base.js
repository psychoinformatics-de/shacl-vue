// base.js
import { reactive, ref, onMounted, onUnmounted } from 'vue'
import { v4 as uuidv4 } from 'uuid';

// by convention, composable function names start with "use"
export function useBaseComponent() {

  var my_uid = ref(null)

  function assignUUID() {
    my_uid = uuidv4();
  }

  onMounted(() => {
    console.log("Component mounted, assigning UUID from composable code:\n")
    assignUUID()
    console.log(my_uid)
  });

  return {
    my_uid
  }
}
