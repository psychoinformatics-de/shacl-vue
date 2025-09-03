// rules.js
import { ref } from 'vue';
import { SHACL } from '../modules/namespaces';

export function useRules(propShape) {
    const isRequired = ref(false);
    const rules = ref([]);

    // sh:minCount (isRequired)
    if (propShape[SHACL.minCount?.value] > 0) {
        isRequired.value = true;
        rules.value.push((value) => {
            if (value) return true;
            return 'This is a required field';
        });
    }

    // sh:pattern
    const patternStr = propShape[SHACL.pattern.value];
    if (patternStr) {
        // anchor so it must match the entire value
        const anchored = `^${patternStr}$`;
        let regex;
        try {
            regex = new RegExp(anchored);
            // If propertyShape has an sh:message key, it is assumed to be the content
            // to show upon validation error, and then displayed. If not, display default message.
            const message = propShape.hasOwnProperty(SHACL.message.value)
                ? String(propShape[SHACL.message.value])
                : 'Input does not match the required format';
            // Required rule -> “Field can't be empty”
            // Pattern rule -> “Field doesn't match the regex”
            // Let “required” handle emptiness
            rules.value.push((v) => {
                if (!v) return true;
                return regex.test(v) || message;
            });
        } catch (err) {
            console.error(`Invalid SHACL pattern “${patternStr}”:`, err);
        }
    }

    return {
        isRequired,
        rules,
    };
}
