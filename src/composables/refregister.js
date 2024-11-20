// useRegrefregisteristerField.js
import { onMounted, onUnmounted, inject, ref } from 'vue';
import { nameOrCURIE } from '../modules/utils';

export function useRegisterRef(id, props) {
    // props:
    // property_shape: Object,
    // node_uid: String,
    // triple_uid: String,
    // triple_idx: Number,

  const fieldRef = ref(null);
  const registerRef = inject('registerRef', null);
  const unregisterRef = inject('unregisterRef', null);
  const shapePrefixes = inject('shapePrefixes');

  onMounted(() => {
    if (registerRef && fieldRef.value) {
        // console.log("Registering ref from within refregister composable...")
        var fieldData = {
            ref: fieldRef,
            name: nameOrCURIE(props.property_shape, shapePrefixes)
        }
        registerRef(id, fieldData);
    }
  });

  onUnmounted(() => {
    if (unregisterRef && fieldRef.value) {
      unregisterRef(id);
    }
  });

  return {
    fieldRef,
  };
}
