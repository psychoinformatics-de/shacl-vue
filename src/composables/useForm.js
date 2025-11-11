// formdata.js

import { reactive } from 'vue';
import { FormBase } from 'shacl-tulip';

export function useForm(config) {
    const formData = new FormBase(null, reactive({}));
    // expose managed state as return value
    return {
        formData,
    };
}
