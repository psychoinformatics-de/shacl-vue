<template>
    <v-app-bar :elevation="1" rounded>
        <template v-slot:prepend>
            <a @click="goToHome()" class="header-button">
                <v-img
                    :width="36"
                    cover
                    :src="props.logo"
                    style="margin-left: 10px"
                ></v-img>
            </a>
        </template>
        <v-app-bar-title>
            <a @click="goToHome()" class="header-button"
                ><code style="font-size: 1em">{{
                    configVarsMain.appName
                }}</code></a
            >
        </v-app-bar-title>

        <template v-slot:append>
            <span v-if="configVarsMain.useToken">
                <v-tooltip text="Token" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-badge
                            v-if="http401response"
                            dot
                            color="deep-orange"
                            overlap
                            offset-x="12"
                            offset-y="12"
                        >
                            <v-btn
                                icon="mdi-key-variant"
                                @click="tokenFn()"
                                v-bind="props"
                                :class="{ 'warning-pulse': tokenWarningPulse }"
                            ></v-btn>
                        </v-badge>
                        <v-btn
                            v-else
                            icon="mdi-key-variant"
                            @click="tokenFn()"
                            v-bind="props"
                            :class="{ 'warning-pulse': tokenWarningPulse }"
                        ></v-btn>
                    </template>
                </v-tooltip>
            </span>
            <span v-if="configVarsMain.useService">
                <v-tooltip text="Submit" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-badge
                            v-if="nodesToSubmit.length > 0 && !formOpen"
                            dot
                            color="success"
                            overlap
                            offset-x="12"
                            offset-y="12"
                        >
                            <v-btn
                                icon="mdi-cloud-upload"
                                @click="submitFn()"
                                v-bind="props"
                                :disabled="!canSubmit"
                                :class="{ 'submit-pulse': submitWarningPulse }"
                            >
                            </v-btn>
                        </v-badge>
                        <v-btn
                            v-else
                            icon="mdi-cloud-upload"
                            @click="submitFn()"
                            v-bind="props"
                            :disabled="!canSubmit"
                            :class="{ 'submit-pulse': submitWarningPulse }"
                        >
                        </v-btn>
                    </template>
                </v-tooltip>
            </span>

            <span v-if="configVarsMain.documentationUrl">
                <v-tooltip text="Documentation" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn
                            icon="mdi-text-box"
                            :href="configVarsMain.documentationUrl"
                            target="_blank"
                            v-bind="props"
                            class="header-button"
                        ></v-btn>
                    </template>
                </v-tooltip>
            </span>
            <span v-if="configVarsMain.sourceCodeUrl">
                <v-tooltip text="Source code" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn
                            icon="mdi-code-not-equal-variant"
                            :href="configVarsMain.sourceCodeUrl"
                            target="_blank"
                            v-bind="props"
                            class="header-button"
                        ></v-btn>
                    </template>
                </v-tooltip>
            </span>
        </template>
    </v-app-bar>

    <v-dialog v-model="tokenDialog" max-width="700">
        <v-card>
            <v-card-title>Token management</v-card-title>
            <v-card-text>
                A token is required to submit new/updated metadata records to
                the server, or to view previously submitted metadata records.
                <br /><br />

                <span v-if="configVarsMain.tokenInfo">
                    {{ configVarsMain.tokenInfo
                    }}<span v-if="configVarsMain.tokenInfoUrl"
                        >:
                        <a target="_blank" :href="configVarsMain.tokenInfoUrl"
                            >link</a
                        ></span
                    >
                    <br /><br />
                </span>

                Below you can enter/update your personal token:
                <v-form
                    ref="tokenForm"
                    validate-on="submit lazy"
                    @submit.prevent="save"
                >
                    <v-text-field name="username" autocomplete="username" style="display: none;"></v-text-field>
                    <v-text-field
                        v-model="tokenval"
                        :rules="rules"
                        :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                        :type="visible ? 'text' : 'password'"
                        density="compact"
                        placeholder="token"
                        name="password"
                        autocomplete="current-password"
                        prepend-inner-icon="mdi-lock-outline"
                        variant="outlined"
                        :error-messages="customError"
                        @click:append-inner="visible = !visible"
                    ></v-text-field>
                    <div style="display: flex;">
                        <v-btn @click="cancel()" style="margin-left: auto; margin-right: 0.5em;"><v-icon>mdi-close</v-icon> Cancel</v-btn>
                        <v-btn @click="reset()" style="margin-right: 0.5em;"><v-icon>mdi-undo</v-icon> Reset</v-btn>
                        <v-btn type="submit"><v-icon>mdi-check-circle-outline</v-icon> Save</v-btn>
                    </div>
                </v-form>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>
<script setup>
import { inject, onBeforeMount, ref, watch } from 'vue';
import { useToken } from '@/composables/tokens';

const props = defineProps({
    logo: String,
});

const { token, setToken, clearToken } = useToken();
const submitFn = inject('submitFn');
const canSubmit = inject('canSubmit');
const nodesToSubmit = inject('nodesToSubmit');
const formOpen = inject('formOpen');
const configVarsMain = inject('configVarsMain');
const http401response = inject('http401response');
const tokenWarning = inject('tokenWarning');
const tokenWarningPulse = ref(false);
const submitWarning = inject('submitWarning');
const submitWarningPulse = ref(false);
const visible = ref(false);
const tokenDialog = ref(false);
const tokenExists = ref(false);
const tokenval = ref('');
const tokenForm = ref(null);
const rules = [
    (value) => {
        if (value) return true;
        return 'A token is required';
    },
];
const customError = ref('')
const emit = defineEmits(['tokenDialogOpened'])

onBeforeMount(() => {
    if (token.value !== null && token.value !== 'null') {
        tokenExists.value = true;
        tokenval.value = token.value;
    }
});

function goToHome() {
    window.location.href = window.location.pathname;
}

function tokenFn() {
    if (token.value !== null && token.value !== 'null') {
        tokenExists.value = true;
        tokenval.value = token.value;
    }
    tokenDialog.value = true;
    visible.value = false;
}

function cancel() {
    tokenDialog.value = false;
}

function reset() {
    tokenval.value = '';
    http401response.value = false;
    customError.value = ''
    clearToken();
}

watch(
    http401response,
    (newValue) => {
        if (newValue) {
            forceError()
            tokenDialog.value = true;
            tokenWarning.value = true;
        }
    },
    { immediate: true }
);

watch(
    tokenDialog,
    (newValue) => {
        if (newValue) {
            emit('tokenDialogOpened')
        }
    },
    { immediate: true }
);

watch(
    tokenWarning,
    (newValue) => {
        if (newValue) {
            tokenWarningPulse.value = true
            setTimeout(() => {
                tokenWarningPulse.value = false
            }, 4000)
            tokenWarning.value = false;
        }
    },
    { immediate: true }
);

watch(
    submitWarning,
    (newValue) => {
        if (newValue) {
            if (token.value !== null && token.value !== 'null') {
                submitWarningPulse.value = true
                setTimeout(() => {
                    submitWarningPulse.value = false
                }, 4000)
            } else {
                tokenWarning.value = true;
                tokenDialog.value = true;
            }
            submitWarning.value = false;
        }
    },
    { immediate: true }
);

function forceError() {
    customError.value = "Invalid token. Please re-enter your token and click Save, or alternatively clear the token by clicking Reset and then Cancel"
}

async function save() {
    const { valid } = await tokenForm.value.validate();
    if (!valid) {
        console.log('invalid entry');
        return;
    }
    setToken(tokenval.value);
    http401response.value = false;
    customError.value = ''
    tokenDialog.value = false;
    if (nodesToSubmit.value.length) {
        submitWarning.value = true;
    }
}


</script>

<style scoped>
.header-button {
    color: #1d1d1d;
}
.header-button:hover {
    text-decoration: none;
    cursor: pointer;
}
</style>

<style>
.warning-pulse {
    animation: pulse-bg-token 1s ease-in-out infinite;
}
.submit-pulse {
    animation: pulse-bg-submit 1s ease-in-out infinite;
}

@keyframes pulse-bg-token {
    0% {
        background-color: rgba(var(--v-theme-error), 0.15);
        box-shadow: 0 0 0px rgba(var(--v-theme-error), 0.6);
    }
    50% {
        background-color: rgba(var(--v-theme-error), 0.35);
        box-shadow: 0 0 10px rgba(var(--v-theme-error), 0.9);
    }
    100% {
        background-color: rgba(var(--v-theme-error), 0.15);
        box-shadow: 0 0 0px rgba(var(--v-theme-error), 0.6);
    }
}

@keyframes pulse-bg-submit {
    0% {
        background-color: rgba(var(--v-theme-success), 0.15);
        box-shadow: 0 0 0px rgba(var(--v-theme-success), 0.6);
    }
    50% {
        background-color: rgba(var(--v-theme-success), 0.35);
        box-shadow: 0 0 10px rgba(var(--v-theme-success), 0.9);
    }
    100% {
        background-color: rgba(var(--v-theme-success), 0.15);
        box-shadow: 0 0 0px rgba(var(--v-theme-success), 0.6);
    }
}


</style>
