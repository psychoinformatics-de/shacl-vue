<template>
    <v-card>
        <v-card-title>Submit metadata</v-card-title>
        <v-card-text>
            <span v-if="tokenExists">
                Are you sure you want to continue?
            </span>
            <span v-else>
                Please add a valid token before submitting your changes.
                <v-form>
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
            <v-btn type="submit" @click="submit"><v-icon>mdi-check-circle-outline</v-icon> Submit</v-btn>
        </v-card-actions>
    </v-card>
</template>

<script setup>
    import { ref, onBeforeMount, inject} from 'vue';
    import { useToken } from '@/composables/tokens'
    import { useFormData } from '@/composables/formdata'

    const props = defineProps({
        dialog: Boolean
    })

    const { token, setToken, clearToken } = useToken()
    const {submitFormData} = useFormData()
    const submitButtonPressed = inject('submitButtonPressed')
    const submitDialog = inject('submitDialog')
    const tokenExists = ref(false)

    const rules = [
        value => {
            if (value) return true
            return 'Please enter a token to submit your edits'
        },
    ]

    function submit() {
        if (!tokenExists.value) {
            setToken(tokenval.value)
        }
        submitFormData()
    }

    function cancelSubmit() {
        submitButtonPressed.value = false
        submitDialog.value = false
    }

    onBeforeMount(()=>{
        if (token.value) {
            tokenExists.value = true
        }
    })
</script>