<template>
    <v-card>
        <v-card-title>Submit metadata</v-card-title>
        <v-card-text>
            <span v-if="tokenExists">
                Are you sure you want to continue?
            </span>
            <span v-else>
                Please add a valid token before submitting your changes.
                <v-form ref="submitForm">
                    <v-text-field
                        v-model="tokenval"
                        label="Token"
                        :rules="rules"
                    ></v-text-field>
                </v-form>
            </span>
        </v-card-text>
        <v-card-actions>
            <v-btn @click="cancelSubmit()"><v-icon>mdi-cancel</v-icon> Cancel</v-btn>
            <v-btn type="submit" @click="submit()"><v-icon>mdi-check-circle-outline</v-icon> Submit</v-btn>
        </v-card-actions>
    </v-card>
</template>

<script setup>
    import { ref, onBeforeMount, inject} from 'vue';
    import { useToken } from '@/composables/tokens'

    const props = defineProps({
        dialog: Boolean
    })


    const submitForm = ref(null)
    const tokenval = ref(null)
    const { token, setToken, clearToken } = useToken()
    const submitFormData = inject('submitFormData')
    const submitButtonPressed = inject('submitButtonPressed')
    const submitDialog = inject('submitDialog')
    const tokenExists = ref(false)
    const nodeShapes = inject('nodeShapes')
    const ID_IRI = inject('ID_IRI')
    const config = inject('config')
    const allPrefixes = inject('allPrefixes');

    const rules = [
        value => {
            if (value) return true
            return 'A token is required'
        },
    ]

    async function submit() {
        // Validate the form first
        if (!tokenExists.value) {
            const { valid } = await submitForm.value.validate();
            if (!valid) {
                console.log("invalid")
                return 
            }
            setToken(tokenval.value)
        }
        var submit_result = await submitFormData(nodeShapes.value, ID_IRI.value, allPrefixes, config)
    }

    function cancelSubmit() {
        submitButtonPressed.value = false
        submitDialog.value = false
    }

    onBeforeMount(()=>{
        if (token.value !== null && token.value !== "null") {
            tokenExists.value = true
        }
    })
</script>