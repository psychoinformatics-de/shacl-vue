<template>
    <v-app-bar :elevation="1" rounded>
        <template v-slot:prepend>
            <v-img
                :width="36"
                cover
                src="../assets/shacl_vue.svg"
                style="margin-left: 10px;"
            ></v-img>
        </template>

        <v-app-bar-title> 
            <code style="font-size: 1em;">shacl-vue</code>
        </v-app-bar-title>

        <template v-slot:append>
            
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
            <v-tooltip text="Documentation" location="bottom">
                <template v-slot:activator="{ props }">
                    <v-btn 
                    icon="mdi-text-box"
                    href="https://psychoinformatics-de.github.io/shacl-vue/docs/"
                    target="_blank"
                    v-bind="props"
                    class="header-button"
                    ></v-btn>
                </template>
            </v-tooltip>
            <v-tooltip text="Source code" location="bottom">
                <template v-slot:activator="{ props }">
                    <v-btn 
                    icon="mdi-github"
                    href="https://github.com/psychoinformatics-de/shacl-vue"
                    target="_blank"
                    v-bind="props"
                    class="header-button"
                    ></v-btn>
                </template>
            </v-tooltip>
        </template>
    </v-app-bar>
</template>
<script setup>
    import { inject} from 'vue'
    const submitFn = inject('submitFn')
    const canSubmit = inject('canSubmit')
</script>

<style scoped>

    .header-button {
        color: black;
    }
    .header-button:hover {
        text-decoration: none;
    }

</style>