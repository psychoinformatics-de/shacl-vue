// composables/base.js
import { ref, watch, computed } from 'vue';

/**
 * Composable for managing the state and behavior of a custom editor
 *
 * @param {Object} props - The props passed to the custom input component.
 * @param {Function} emit - The emit function to trigger events.
 * @param {Function} valueParser - A function to parse the modelValue into subcomponent values.
 * @param {Function} valueCombiner - A function to combine subcomponent values into the modelValue.
 * @returns {Object} - Returns an object containing reactive references and methods for managing the input state.
 */

export function useBaseInput(props, emit, valueParser, valueCombiner) {
  /**
   * Reactive object to hold the individual values of subcomponents.
   * @type {Object}
   */
  const subValues = ref(valueParser(props.modelValue) || {});

  /**
   * Computed property to manage the internal value of the custom input component.
   * - The getter combines the subcomponent values into the modelValue.
   * - The setter parses the modelValue back into subcomponent values.
   */
  const internalValue = computed({
    get() {
      // console.log("Calling base internalvalue getter")
      return valueCombiner(subValues.value);
    },
    set(value) {
      // console.log("Calling base internalvalue SETTER")
      subValues.value = valueParser(value);
    }
  });

  /**
   * Watcher for the parent component's modelValue.
   * Updates internal values when modelValue changes.
   */
  watch(
    () => props.modelValue,
    (newValue) => {
      // console.log("Base props.modelValue has updated")
      if (newValue !== internalValue.value) {
        internalValue.value = newValue;
      }
    }
  );

  // Emit updates to parent
  watch(internalValue, (newValue) => {
      emit('update:modelValue', newValue);
  });

  return {
    subValues,
    internalValue,
  };
}
