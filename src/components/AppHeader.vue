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
            <v-tooltip text="Settings" location="bottom">
                <template v-slot:activator="{ props }">
                    <v-btn
                        icon="mdi-cog"
                        @click="settingsFn()"
                        v-bind="props"
                        class="header-button"
                    ></v-btn>
                </template>
            </v-tooltip>
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

    <v-dialog v-model="settingsDialog" width="80vw" max-width="80vw">
        <v-card class="settings-card">
            <v-toolbar :color="configVarsMain.appTheme.settings_color" title="Settings and info"></v-toolbar>
            
            <v-card-text class="settings-body" :class="{ 'settings-body--mobile': mobile }">
                <v-tabs
                    v-model="tab"
                    :color="configVarsMain.appTheme.settings_color"
                    :direction="mobile ? 'horizontal' :'vertical'"
                    :class="mobile ? '' : 'settings-tabs'"
                >
                    <v-tab prepend-icon="mdi-information" text="Info" value="info"></v-tab>
                    <v-tab prepend-icon="mdi-key" text="Tokens" value="tokens"></v-tab>
                    <v-tab prepend-icon="mdi-alphabetical" text="Prefixes" value="prefixes"></v-tab>
                    <v-tab prepend-icon="mdi-wrench" text="Config" value="config"></v-tab>
                </v-tabs>

                <v-tabs-window v-model="tab" class="settings-panels">
                    <v-tabs-window-item value="info">
                        <v-card flat class="overflow-y-auto h-100">
                            <v-card-title style="margin-bottom: 1em;">UI deployment information</v-card-title>
                            <v-card-text>                               
                                <span v-if="configVarsMain.shapesUrl">
                                    <h3>Schema source (SHACL)</h3>
                                    <a target="_blank" :href="configVarsMain.shapesUrl">{{configVarsMain.shapesUrl}}</a>
                                </span>
                                <span v-if="configVarsMain.classUrl">
                                    <h3 style="margin-top: 1em;">Class hierarchy source (OWL)</h3>
                                    <a target="_blank" :href="configVarsMain.classUrl">{{configVarsMain.classUrl}}</a>
                                </span>
                                <span v-if="configVarsMain.dataUrl">
                                    <h3 style="margin-top: 1em;">Input data</h3>
                                    <a target="_blank" :href="configVarsMain.dataUrl">{{configVarsMain.dataUrl}}</a>
                                </span>
                                <span v-if="configVarsMain.useService">
                                    <h3 style="margin-top: 1em;">Backend data sources</h3>
                                    <ul style="margin-left: 1em;">
                                        <li v-for="service in configVarsMain.serviceBaseUrl">
                                            <a target="_blank" :href="service.url">{{service.url}}</a>
                                            <span v-if="service.docs">
                                                &nbsp;|&nbsp; <a target="_blank" :href="service.docs">docs</a>
                                            </span>
                                            &nbsp;|&nbsp; type: <em>{{ service.type }}</em>
                                        </li>
                                    </ul>
                                </span>
                                <span v-if="configVarsMain.sourceCodeUrl">
                                    <h3 style="margin-top: 1em;">Source code repository</h3>
                                    <a target="_blank" :href="configVarsMain.sourceCodeUrl">{{configVarsMain.sourceCodeUrl}}</a>
                                </span>
                                <span>
                                    <h3 style="margin-top: 1em;"><em>shacl-vue</em> version</h3>
                                    <a target="_blank" :href="link">{{branch + '@' + commit_short}}</a>
                                </span>
                            </v-card-text>
                        </v-card>
                    </v-tabs-window-item>

                    <v-tabs-window-item value="tokens">
                        <v-card flat class="overflow-y-auto h-100">
                            <v-card-title style="margin-bottom: 1em;">Token management</v-card-title>
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
                                        <v-btn @click="reset()" style="margin-left: auto; margin-right: 0.5em;"><v-icon>mdi-undo</v-icon> Reset</v-btn>
                                        <v-btn type="submit"><v-icon>mdi-check-circle-outline</v-icon> Save</v-btn>
                                    </div>
                                </v-form>
                            </v-card-text>
                        </v-card>
                    </v-tabs-window-item>

                    <v-tabs-window-item value="prefixes">

                        <v-card flat class="overflow-y-auto h-100">
                            <v-card-title style="margin-bottom: 1em;">Prefixes</v-card-title>
                            <v-card-text>
                                <v-text-field
                                    v-model="filterCurieText"
                                    density="compact"
                                    variant="outlined"
                                    label="Filter prefixes"
                                    min-width="200px"
                                >
                                    <template v-slot:append-inner>
                                        <v-icon
                                            v-if="filterCurieText"
                                            class="mr-2"
                                            @click.stop="clearField('curieText')"
                                            @mousedown.stop.prevent
                                        >
                                            mdi-close-circle
                                        </v-icon>
                                    </template>
                                    <template #append >
                                        <v-btn
                                            variant="outlined"
                                            @click="toggleOrder"
                                            :append-icon="orderIcon"
                                        >Order</v-btn>
                                    </template>
                                </v-text-field>
                                <div v-for="c in filteredCURIEs" style="margin-bottom: 5px">
                                    <span class="code-style">{{ c }}</span>: {{allPrefixes[c]}}
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-tabs-window-item>

                    <v-tabs-window-item value="config">
                        <v-card flat class="overflow-y-auto h-100">
                            <v-card-title style="margin-bottom: 1em;">Configured options</v-card-title>
                            <v-card-text>
                                <v-text-field
                                    v-model="filterConfigText"
                                    density="compact"
                                    variant="outlined"
                                    label="Filter options"
                                    min-width="200px"
                                >
                                    <template v-slot:append-inner>
                                        <v-icon
                                            v-if="filterConfigText"
                                            class="mr-2"
                                            @click.stop="clearField('configText')"
                                            @mousedown.stop.prevent
                                        >
                                            mdi-close-circle
                                        </v-icon>
                                    </template>
                                </v-text-field>
                                <span v-for="opt in filteredConfigOptions">
                                    <span class="code-style">{{ opt }}</span><pre>{{ config[opt] }}</pre>
                                    <br>
                                </span>
                            </v-card-text>
                        </v-card>
                    </v-tabs-window-item>
                </v-tabs-window>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>
<script setup>
import { inject, onBeforeMount, ref, watch, computed} from 'vue';
import { useToken } from '@/composables/tokens';
import { useDisplay } from 'vuetify'
const { mobile } = useDisplay()
const branch = __BRANCH__;
const commit_short = __COMMIT_HASH_SHORT__;
const commit = __COMMIT_HASH__;
const link = `https://github.com/psychoinformatics-de/shacl-vue/tree/${commit}`;

const props = defineProps({
    logo: String,
});

const { token, setToken, clearToken } = useToken();
const submitFn = inject('submitFn');
const canSubmit = inject('canSubmit');
const nodesToSubmit = inject('nodesToSubmit');
const formOpen = inject('formOpen');
const configVarsMain = inject('configVarsMain');
const config = inject('config');
const http401response = inject('http401response');
const allPrefixes = inject('allPrefixes');
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
const settingsDialog = ref(false);
const tab = ref('info');
const filterCurieText = ref('');
const orderTopDown = ref(true);
const orderIcon = ref('mdi-arrow-down-thick');

const filterConfigText = ref('');

onBeforeMount(() => {
    if (token.value !== null && token.value !== 'null') {
        tokenExists.value = true;
        tokenval.value = token.value;
    }
});

const filteredConfigOptions = computed(() => {
    let txt = filterConfigText.value.toLowerCase().trim();
    return Object.keys(config.value).filter((item) => {
        if (txt.length == 0) return true;
        return item.toLowerCase().trim().includes(txt);
    })
});

const filteredCURIEs = computed(() => {
    let txt = filterCurieText.value.toLowerCase().trim();
    return sortItems(
        Object.keys(allPrefixes).filter((item) => {
            if (txt.length == 0) return true;
            return item.toLowerCase().trim().includes(txt);
        }),
        orderTopDown.value
    )
});

function sortItems(arr, orderVal) {
    const c = orderVal ? 1 : -1;
    return arr.sort((a, b) => {
        return c * a.localeCompare(b);
    })
}

function toggleOrder() {
    orderTopDown.value = !orderTopDown.value;
    if (orderTopDown.value) {
        orderIcon.value = 'mdi-arrow-down-thick';
    } else {
        orderIcon.value = 'mdi-arrow-up-thick';
    }
}

function clearField(mode) {
    if (mode == 'configText') {
        filterConfigText.value = '';
    } else {
        filterCurieText.value = '';
    }
}

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

function settingsFn() {
    tab.value = 'info';
    settingsDialog.value = true;
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
.settings-tabs {
    min-width: 180px;
    border-right: 1px solid rgba(0,0,0,0.12);
}
.settings-card {
    height: 70vh;        /* fixed dialog height */
    min-height: 70vh;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
}
.settings-body {
    flex: 1;             /* fills remaining height */
    display: flex;
}
.settings-body--mobile {
  flex-direction: column;
}
.settings-panels {
    flex: 1;
    overflow: hidden;
    word-break: break-word;
    white-space: normal;
}

.settings-panels v-tabs-window-item {
  height: 100%;
  display: flex;
}

.settings-panels a {
    word-break: break-all;
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

.code-style {
    color: red;
    background-color: #f5f5f5;
    padding: 0.1em 0.2em;
    font-family: monospace;
    border-radius: 4px;
    border: 1px solid #ddd;
}

</style>
