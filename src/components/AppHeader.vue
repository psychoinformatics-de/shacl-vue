<template>
    <v-app-bar :elevation="1" rounded>
        <template v-slot:prepend>
            <a @click="goToHome()" class="header-button">
                <v-img
                    :width="36"
                    cover
                    :src="props.logo"
                    style="margin-left: 10px;"
                ></v-img>
            </a>
        </template>
        <v-app-bar-title>
            <a @click="goToHome()" class="header-button"><code style="font-size: 1em;">{{ configVarsMain.appName }}</code></a>
        </v-app-bar-title>

        <template v-slot:append>

            <span v-if="configVarsMain.useToken">
                <v-tooltip text="Token" location="bottom">
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
                          v-if="pendingRecordsCount > 0 && !formOpen"
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
                A token is required to submit new/updated metadata records to the server,
                or to view previously submitted metadata records. <br><br>

                <span v-if=configVarsMain.tokenInfo>
                    {{ configVarsMain.tokenInfo }}<span v-if=configVarsMain.tokenInfoUrl>: <a target="_blank" :href="configVarsMain.tokenInfoUrl">link</a></span>
                    <br><br>
                </span>

                Below you can enter/update your personal token:
                <v-form ref="tokenForm" validate-on="submit lazy" @submit.prevent>
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
                <v-btn  @click="cancel()"><v-icon>mdi-close</v-icon> Cancel</v-btn>
                <v-btn @click="reset()"><v-icon>mdi-undo</v-icon> Reset</v-btn>
                <v-btn type="submit" @click="save()"><v-icon>mdi-check-circle-outline</v-icon> Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script setup>
    import { inject, onBeforeMount, ref, computed} from 'vue'
    import { useToken } from '@/composables/tokens'

    const props = defineProps({
        logo: String
    })

    const { token, setToken, clearToken } = useToken()
    const submitFn = inject('submitFn')
    const canSubmit = inject('canSubmit')
    const formData = inject('formData')
    const formOpen = inject('formOpen')
    const configVarsMain = inject('configVarsMain')
    const visible = ref(false)
    const tokenDialog = ref(false)
    const tokenExists = ref(false)
    const tokenval = ref("")
    const tokenForm = ref(null)
    const rules = [
        value => {
            if (value) return true
            return 'A token is required'
        },
    ]
    // compute if records are pending to be submittedAdd commentMore actions
    const pendingRecordsCount = computed(
      () => Object.keys(formData.content).length
    )

    onBeforeMount(()=>{
        if (token.value !== null && token.value !== "null") {
            tokenExists.value = true;
            tokenval.value = token.value;
        }
    })

    function goToHome() {
        window.location.href = window.location.pathname;
    }

    function tokenFn () {
        if (token.value !== null && token.value !== "null") {
            tokenExists.value = true;
            tokenval.value = token.value;
        }
        tokenDialog.value = true
        visible.value = false
    }

    function cancel() {
        tokenDialog.value = false
    }

    function reset() {
        tokenval.value = "";
        clearToken()
    }

    async function save() {
        const { valid } = await tokenForm.value.validate();
        if (!valid) {
            console.log("invalid")
            return
        }
        setToken(tokenval.value)
        tokenDialog.value = false
    }

</script>

<style scoped>

    .header-button {
        color: #1d1d1d;
    }
    .header-button:hover {
        text-decoration: none;
        cursor:pointer;
    }
</style>
