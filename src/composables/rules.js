// rules.js
import { ref } from 'vue'
import { SHACL } from '../modules/namespaces'

export function useRules(propShape) {

  const isRequired = ref(false)
  const rules = ref([])

  // sh:minCount (isRequired)
  if ( propShape[SHACL.minCount?.value] > 0 ) {
    isRequired.value = true;
    rules.value.push(
      value => {
        if (value) return true
        return 'This is a required field'
      }
    )
  }

  // sh:pattern
  if ( propShape[SHACL.pattern?.value] ) {
    rules.value.push(
      value => {
        const regex = new RegExp(propShape[SHACL.pattern.value]);
        if (!value) return true
        if (regex.test(value)) return true
        return 'Regular expression matching failed'
        // TODO: this should be replaced by pattern-specific messaging, possibly using sh:message as source
      }
    )
  }
  return {
    isRequired,
    rules
  }
}
