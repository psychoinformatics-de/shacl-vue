<template>
    <v-card>
        <v-card-title>Submit metadata</v-card-title>
        <v-card-text>
            <v-skeleton-loader :loading="awaitingResponse" type="paragraph">
                <span v-if="!responseReceived">
                    <span v-if="tokenExists">
                        You have edited and saved
                        {{ nodesToSubmit.length }} record{{
                            nodesToSubmit.length == 1 ? '' : 's'
                        }}
                        for submission:

                        <div style="margin-top: 0.7em; margin-bottom: 0.7em">
                            <em>
                                <span v-for="r in nodesToSubmit">
                                    &nbsp;&nbsp;
                                    <v-icon>{{
                                        getClassIcon(r.nodeshape_iri)
                                    }}</v-icon
                                    >&nbsp;
                                    {{
                                        getDisplayName(
                                            r.nodeshape_iri,
                                            configVarsMain,
                                            allPrefixes
                                        )
                                    }}:&nbsp;&nbsp;
                                    {{ r.node_iri }}
                                    <br />
                                </span>
                            </em>
                        </div>

                        Are you sure you want to continue?
                    </span>
                    <span v-else>
                        Please add a valid token before submitting your changes.
                        <v-form ref="submitForm">
                            <v-text-field
                                v-model="tokenval"
                                :rules="rules"
                                :append-inner-icon="
                                    visible ? 'mdi-eye-off' : 'mdi-eye'
                                "
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
                <v-icon v-if="responseSuccess" style="color: green"
                    >mdi-check-circle</v-icon
                >
                <v-icon v-if="responseFailure" style="color: red"
                    >mdi-alert-circle</v-icon
                >
                {{ responseText }}

                <br />
                <br />

                <v-btn
                    v-if="responseFailure"
                    density="compact"
                    @click="toggleFailureResponse()"
                    :prepend-icon="failureToggleIcon"
                >
                    Error details:
                </v-btn>

                <span v-if="responseFailure && showCompleteFailure">
                    <br /><br />
                    <span v-for="(e, i) in responseErrors">
                        <strong>Error {{ i + 1 }}</strong> <br />
                        <strong>Status: </strong>{{ e.error.status }} <br />
                        <strong>Message: </strong>{{ e.message }} <br />
                        <strong>Stack: </strong> <br />
                        <small>
                            <pre class="error-stack">{{ e.error.stack }}</pre>
                        </small>
                    </span>
                </span>
            </span>
        </v-card-text>
        <v-card-actions>
            <v-btn v-if="!responseReceived" @click="cancelSubmit()"
                ><v-icon>mdi-cancel</v-icon> Cancel</v-btn
            >
            <v-btn v-if="!responseReceived" type="submit" @click="submit()"
                ><v-icon>mdi-check-circle-outline</v-icon> Submit</v-btn
            >
            <v-btn v-if="responseReceived" @click="cancelSubmit()"
                ><v-icon>mdi-check-circle-outline</v-icon> OK</v-btn
            >
        </v-card-actions>
    </v-card>
</template>

<script setup>
import { ref, onBeforeMount, inject } from 'vue';
import { getDisplayName } from '@/modules/utils';
import { useToken } from '@/composables/tokens';

const props = defineProps({
    dialog: Boolean,
});

const submitForm = ref(null);
const tokenval = ref(null);
const visible = ref(false);
const { token, setToken, clearToken } = useToken();
const submitFormData = inject('submitFormData');
const submitButtonPressed = inject('submitButtonPressed');
const submitDialog = inject('submitDialog');
const tokenExists = ref(false);
const shapesDS = inject('shapesDS');
const rdfDS = inject('rdfDS');
const nodesToSubmit = inject('nodesToSubmit');
const ID_IRI = inject('ID_IRI');
const config = inject('config');
const configVarsMain = inject('configVarsMain');
const getClassIcon = inject('getClassIcon');
const allPrefixes = inject('allPrefixes');
const awaitingResponse = ref(false);
const responseReceived = ref(false);
const responseSuccess = ref(false);
const responseFailure = ref(false);

const showCompleteFailure = ref(false);
const responseText = ref('');
const responseTextFull = ref('');
const responseErrors = ref([]);

const failureToggleIcon = ref('mdi-chevron-right');

function toggleFailureResponse() {
    showCompleteFailure.value = !showCompleteFailure.value;
    if (showCompleteFailure.value) {
        failureToggleIcon.value = 'mdi-chevron-down';
    } else {
        failureToggleIcon.value = 'mdi-chevron-right';
    }
}

const rules = [
    (value) => {
        if (value) return true;
        return 'A token is required';
    },
];

async function submit() {
    // Validate the form first
    if (!tokenExists.value) {
        const { valid } = await submitForm.value.validate();
        if (!valid) {
            console.log('invalid');
            return;
        }
        setToken(tokenval.value);
    }
    awaitingResponse.value = true;
    var submit_result = await submitFormData(
        shapesDS,
        ID_IRI.value,
        allPrefixes,
        config,
        rdfDS
    );
    console.log('submit_result');
    console.log(submit_result);

    if (submit_result.success) {
        responseSuccess.value = true;
        responseFailure.value = false;
        responseText.value = 'Your metadata submission was successful!';
    } else {
        responseSuccess.value = false;
        responseFailure.value = true;
        responseText.value =
            'There was an error during metadata submission, please try again or report this to your administrator if the problem persists.';
        if (
            submit_result.error &&
            Array.isArray(submit_result.error) &&
            submit_result.error.length > 0
        ) {
            responseErrors.value = [];
            for (var e of submit_result.error) {
                console.error(e.error);
                responseErrors.value.push(e);
            }
            // responseTextFull.value += "\n\nDetails:\n" + submit_result.details.join("\n\n");
        }
    }
    responseReceived.value = true;
    awaitingResponse.value = false;
}

function cancelSubmit() {
    submitButtonPressed.value = false;
    submitDialog.value = false;
}

onBeforeMount(() => {
    if (token.value !== null && token.value !== 'null') {
        tokenExists.value = true;
    }
});
</script>

<style scoped>
.error-stack {
    border: 1px solid rgb(255, 112, 112);
    border-radius: 8px;
    background-color: #efefef;
    overflow-x: scroll;
    padding: 0.5em;
}
</style>
