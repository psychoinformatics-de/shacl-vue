<template>
    <v-card>
        <v-card-title>Submit metadata</v-card-title>
        <v-card-text>
            <v-skeleton-loader
                :loading="awaitingResponse"
                type="paragraph"
            >
                <span v-if="!responseReceived">
                    <span v-if="tokenExists">
                        Are you sure you want to continue?
                    </span>
                    <span v-else>
                        Please add a valid token before submitting your changes.
                        <v-form ref="submitForm">
                            <v-text-field
                                v-model="tokenval"
                                :rules="rules"
                                :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                                :type="visible ? 'text' : 'password'"
                                density="compact"
                                placeholder="token"
                                prepend-inner-icon="mdi-lock-outline"
                                variant="outlined"
                                @click:append-inner="visible = !visible"
                            ></v-text-field>
                        </v-form>
                    </span>
                </span>
            </v-skeleton-loader>
            <span v-if="responseReceived">
                <v-icon v-if="responseSuccess" style="color:green">mdi-check-circle</v-icon>
                <v-icon v-if="responseFailure" style="color:red">mdi-alert-circle</v-icon>
                {{ responseText }}
            </span>

        </v-card-text>
        <v-card-actions>
            <v-btn v-if="!responseReceived" @click="cancelSubmit()"><v-icon>mdi-cancel</v-icon> Cancel</v-btn>
            <v-btn v-if="!responseReceived"type="submit" @click="submit()"><v-icon>mdi-check-circle-outline</v-icon> Submit</v-btn>
            <v-btn v-if="responseReceived" @click="cancelSubmit()"><v-icon>mdi-check-circle-outline</v-icon> OK</v-btn>
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
    const visible = ref(false)
    const { token, setToken, clearToken } = useToken()
    const submitFormData = inject('submitFormData')
    const submitButtonPressed = inject('submitButtonPressed')
    const submitDialog = inject('submitDialog')
    const tokenExists = ref(false)
    const nodeShapes = inject('nodeShapes')
    const graphData = inject('graphData')
    const ID_IRI = inject('ID_IRI')
    const config = inject('config')
    const allPrefixes = inject('allPrefixes');
    const awaitingResponse = ref(false)
    const responseReceived = ref(false)
    const responseSuccess = ref(false)
    const responseFailure = ref(false)
    const responseText = ref("")

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
        awaitingResponse.value = true
        var submit_result = await submitFormData(nodeShapes.value, ID_IRI.value, allPrefixes, config, graphData)
        console.log("submit_result")
        console.log(submit_result)

        if (submit_result.ok) {
            responseSuccess.value = true;
            responseFailure.value = false;
            responseText.value = "Your metadata submission was successful!"
        } else {
            responseSuccess.value = false;
            responseFailure.value = true;
            responseText.value = "There was an error during metadata submission, please try again or report this to your administrator if the problem persists."
        }
        responseReceived.value = true
        awaitingResponse.value = false
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