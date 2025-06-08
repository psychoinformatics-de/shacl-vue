<template>
    <v-footer height="50">
        <div
            class="text-caption text-disabled"
            style="text-align: center; margin: auto"
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
    </v-footer>
</template>

<script setup>
const branch = __BRANCH__;
const commit_short = __COMMIT_HASH_SHORT__;
const commit = __COMMIT_HASH__;
const link = `https://github.com/psychoinformatics-de/shacl-vue/tree/${commit}`;
</script>
