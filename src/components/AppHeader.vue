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
            <span v-if="configVarsMain.useGitannexP2phttp">
                <v-tooltip text="File upload credentials" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn
                            icon="mdi-file-key"
                            @click="fileUploadFn()"
                            v-bind="props"
                            :disabled="!canSubmit"
                        ></v-btn>
                    </template>
                </v-tooltip>
            </span>
            <span v-if="configVarsMain.useToken">
                <v-tooltip text="Submission token" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn
                            icon="mdi-key-variant"
                            @click="tokenFn()"
                            v-bind="props"
                            :disabled="!canSubmit"
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
                            >
                            </v-btn>
                        </v-badge>
                        <v-btn
                            v-else
                            icon="mdi-cloud-upload"
                            @click="submitFn()"
                            v-bind="props"
                            :disabled="!canSubmit"
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
                    @submit.prevent
                >
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
            </v-card-text>
            <v-card-actions>
                <v-btn @click="cancel()"
                    ><v-icon>mdi-close</v-icon> Cancel</v-btn
                >
                <v-btn @click="reset()"><v-icon>mdi-undo</v-icon> Reset</v-btn>
                <v-btn type="submit" @click="save()"
                    ><v-icon>mdi-check-circle-outline</v-icon> Save</v-btn
                >
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="tokenDialogCreds" max-width="700">
        <v-card>
            <v-card-title>File Upload Credentials</v-card-title>
            <v-card-text>
                A username and password (access token) are required in order to upload
                files to the configured storage backend at
                <a :href="configVarsMain.gitannexP2phttpConfig.deployment_url" target="_blank">{{ configVarsMain.gitannexP2phttpConfig.deployment_url }}</a>.
                <br /><br />

                <span v-if="configVarsMain.gitannexP2phttpConfig.info">
                    {{ configVarsMain.gitannexP2phttpConfig.info
                    }}<span v-if="configVarsMain.gitannexP2phttpConfig.info_url"
                        >:
                        <a target="_blank" :href="configVarsMain.gitannexP2phttpConfig.info_url"
                            >link</a
                        ></span
                    >
                    <br /><br />
                </span>

                Below you can enter/update your username and password:
                <br><br>
                <v-form
                    ref="tokenFormCreds"
                    validate-on="submit lazy"
                    @submit.prevent
                >
                    <v-text-field
                        v-model="tokenvalUsr"
                        :rules="rules"
                        type="text"
                        density="compact"
                        placeholder="username"
                        variant="outlined"
                    ></v-text-field>
                    <v-text-field
                        v-model="tokenvalPwd"
                        :rules="rules"
                        :append-inner-icon="visiblePwd ? 'mdi-eye-off' : 'mdi-eye'"
                        :type="visiblePwd ? 'text' : 'password'"
                        density="compact"
                        placeholder="password"
                        prepend-inner-icon="mdi-lock-outline"
                        variant="outlined"
                        @click:append-inner="visiblePwd = !visiblePwd"
                    ></v-text-field>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-btn @click="cancelCreds()"
                    ><v-icon>mdi-close</v-icon> Cancel</v-btn
                >
                <v-btn @click="resetCreds()"><v-icon>mdi-undo</v-icon> Reset</v-btn>
                <v-btn type="submit" @click="saveCreds()"
                    ><v-icon>mdi-check-circle-outline</v-icon> Save</v-btn
                >
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script setup>
import { inject, onBeforeMount, ref, computed } from 'vue';
import { useTokens } from '@/composables/tokens';

const props = defineProps({
    logo: String,
});

const { tokens, setToken, clearToken } = useTokens();
const tokenName = 'serviceToken';
const token = tokens[tokenName];
const submitFn = inject('submitFn');
const canSubmit = inject('canSubmit');
const nodesToSubmit = inject('nodesToSubmit');
const formOpen = inject('formOpen');
const configVarsMain = inject('configVarsMain');
const visible = ref(false);
const tokenDialog = ref(false);
const tokenExists = ref(false);
const tokenval = ref('');
const tokenForm = ref(null);

const tokenNameUsr = 'gitAnnexUserName'
const tokenNamePwd = 'gitAnnexPassword'
const visibleUsr = ref(false);
const visiblePwd = ref(false);
const tokenDialogCreds = ref(false);
const tokenExistsCreds = ref(false);
const tokenvalUsr = ref('');
const tokenvalPwd = ref('');
const tokenFormCreds = ref(null);
const rules = [
    (value) => {
        if (value) return true;
        return 'A value is required';
    },
];

onBeforeMount(() => {
    if (token.value !== null && token.value !== 'null') {
        tokenExists.value = true;
        tokenval.value = token.value;
    }

    if (tokens[tokenNameUsr].value !== null && tokens[tokenNameUsr].value !== 'null'
        && tokens[tokenNamePwd].value !== null && tokens[tokenNamePwd].value !== 'null') {
        tokenExistsCreds.value = true;
        tokenvalUsr.value = tokens[tokenNameUsr].value;
        tokenvalPwd.value = tokens[tokenNamePwd].value;
    }
});

function goToHome() {
    window.location.href = window.location.pathname;
}


// File upload tokens
function fileUploadFn() {
    if (tokens[tokenNameUsr].value !== null && tokens[tokenNameUsr].value !== 'null'
        && tokens[tokenNamePwd].value !== null && tokens[tokenNamePwd].value !== 'null') {
        tokenExistsCreds.value = true;
        tokenvalUsr.value = tokens[tokenNameUsr].value;
        tokenvalPwd.value = tokens[tokenNamePwd].value;
    }
    tokenDialogCreds.value = true;
    visibleUsr.value = false;
    visiblePwd.value = false;
}
function cancelCreds() {
    tokenvalUsr.value = '';
    tokenvalPwd.value = '';
    tokenDialogCreds.value = false;
}
function resetCreds() {
    tokenvalUsr.value = '';
    tokenvalPwd.value = '';
    clearToken(tokenNameUsr);
    clearToken(tokenNamePwd);
}
async function saveCreds() {
    const { valid } = await tokenFormCreds.value.validate();
    if (!valid) {
        console.log('invalid');
        return;
    }
    setToken(tokenNameUsr, tokenvalUsr.value);
    setToken(tokenNamePwd, tokenvalPwd.value);
    tokenDialogCreds.value = false;
}


// Service Token
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
    clearToken(tokenName);
}
async function save() {
    const { valid } = await tokenForm.value.validate();
    if (!valid) {
        console.log('invalid');
        return;
    }
    setToken(tokenName, tokenval.value);
    tokenDialog.value = false;
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
