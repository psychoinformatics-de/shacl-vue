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
            <a @click="goToHome()" class="header-button"><code style="font-size: 1em;">{{ appName }}</code></a>
        </v-app-bar-title>

        <template v-slot:append>

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
            
            <v-tooltip text="Submit" location="bottom">
                <template v-slot:activator="{ props }">
                    <v-btn 
                    icon="mdi-cloud-upload"
                    @click="submitFn()"
                    v-bind="props"
                    :disabled="!canSubmit"
                    ></v-btn>
                </template>
            </v-tooltip>
            <span v-if="documentationUrl">
                <v-tooltip text="Documentation" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn 
                        icon="mdi-text-box"
                        :href="documentationUrl"
                        target="_blank"
                        v-bind="props"
                        class="header-button"
                        ></v-btn>
                    </template>
                </v-tooltip>
            </span>
            <span v-if="sourceCodeUrl">
                <v-tooltip text="Source code" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn 
                        icon="mdi-code-not-equal-variant"
                        :href="sourceCodeUrl"
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
                
                Please read the <a href="https://docs.trr379.de/rdm/metadata-edit/index.html">metadata management docs</a> to find out how to acquire a token.

                <br><br>

                Below you can enter/update your personal token:
                <v-form ref="tokenForm">
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
                <v-btn  @click="cancel()"><v-icon>mdi-cancel</v-icon> Cancel</v-btn>
                <v-btn type="submit" @click="save()"><v-icon>mdi-check-circle-outline</v-icon> Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script setup>
    import { inject, onBeforeMount, ref} from 'vue'
    import { useToken } from '@/composables/tokens'

    const props = defineProps({
        logo: String
    })

    const { token, setToken, clearToken } = useToken()
    const submitFn = inject('submitFn')
    const canSubmit = inject('canSubmit')
    const appName = inject('appName')
    const documentationUrl = inject('documentationUrl')
    const sourceCodeUrl = inject('sourceCodeUrl')
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