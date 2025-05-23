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
  const patternStr = propShape[SHACL.pattern.value]
  if (patternStr) {
    // anchor so it must match the entire value
    const anchored = `^${patternStr}$`
    let regex
    try {
      regex = new RegExp(anchored)
    } catch (err) {
      console.error(`Invalid SHACL pattern “${patternStr}”:`, err)
      return { isRequired, rules }
    }


    // TODO please review if custom messaging is required.
    // TODO successful submit is not checked, only pattern matching is checked.
    const message = propShape[SHACL.message?.value]
      ? String(propShape[SHACL.message.value])
      : `Value must match pattern: /${patternStr}/`

    // Required rule -> “Field cant be empty”
    //Pattern rule -> “Field doesnt match the regex”
    rules.value.push(v => {
      if (!v) return true           // let “required” handle emptiness
      return regex.test(v) || message
    })
  }
  return {
    isRequired,
    rules
  }
}
