<template>
    <v-footer height="50">
        <div style="display: flex; justify-content: space-around; width: 100%;">
            <div
                class="text-caption text-disabled"
                style="text-align: center;"
            >
                <span class="d-none d-sm-inline-block">Powered by</span>
                <a
                    :href="link"
                    title="shacl-vue"
                    class="d-inline-block mx-2 social-link"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <v-icon size="24"
                        ><v-img src="/shacl_vue_logo.svg"></v-img
                    ></v-icon>
                </a>
                <span class="d-none d-sm-inline-block"
                    >shacl-vue (<a target="_blank" :href="link">{{
                        branch + '@' + commit_short
                    }}</a
                    >)
                </span>
            </div>
            <span v-for="d in configVarsMain.footerLinks">
                <div v-if="d.url && d.text" class="text-caption">
                    <a :href="d.url" target="_blank">{{d.text}}</a>
                </div>
            </span>
        </div>
    </v-footer>
</template>

<script setup>
import { inject } from 'vue';
const configVarsMain = inject('configVarsMain');
const branch = __BRANCH__;
const commit_short = __COMMIT_HASH_SHORT__;
const commit = __COMMIT_HASH__;
const link = `https://github.com/psychoinformatics-de/shacl-vue/tree/${commit}`;
</script>
