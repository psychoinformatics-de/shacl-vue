<template>
    <v-row
        align="start"
        no-gutters
        v-if="formData.content[localNodeUid] && show_field"
        :class="compDisabled ? 'disabled-row' : ''"
    >
        <v-col cols="4">
            <span
                >{{
                    nameOrCURIE(
                        localPropertyShape,
                        shapesDS.data.prefixes,
                        true
                    )
                }}<span v-if="isRequired" style="color: red"> *</span>:
                <v-tooltip
                    activator="parent"
                    location="right"
                    max-width="400px"
                    max-height="400px"
                >
                    <p
                        v-html="
                            addCodeTagsToText(
                                localPropertyShape[SHACL.description.value]
                            )
                        "
                    ></p>
                </v-tooltip>
            </span>
        </v-col>
        <v-col cols="8">
            <span v-if="formData.content[localNodeUid][localNodeIdx]">
                <v-row
                    no-gutters
                    v-for="(triple, triple_idx) in formData.content[
                        localNodeUid
                    ][localNodeIdx][my_uid]"
                    :key="localNodeUid + '-' + my_uid + '-' + triple_idx"
                >
                    <v-col cols="9">
                        <Suspense>
                            <template #default>
                                <component
                                    v-model="
                                        formData.content[localNodeUid][
                                            localNodeIdx
                                        ][my_uid][triple_idx]
                                    "
                                    :is="configMatchedComponent || matchedComponent"
                                    :property_shape="localPropertyShape"
                                    :node_uid="localNodeUid"
                                    :node_idx="localNodeIdx"
                                    :triple_uid="my_uid"
                                    :triple_idx="triple_idx"
                                    :disabled="compDisabled"
                                >
                                </component>
                            </template>
                            <template #fallback>
                                <v-skeleton-loader
                                    :elevation="2"
                                    type="list-item-avatar"
                                ></v-skeleton-loader>
                            </template>
                        </Suspense>
                    </v-col>
                    <v-col>
                        &nbsp;
                        <!-- Remove button -->
                        <v-btn
                            v-if="allowRemoveTriple(triple_idx)"
                            rounded="0"
                            elevation="1"
                            icon="mdi-delete-outline"
                            @click="
                                formData.removeObject(
                                    localNodeUid,
                                    localNodeIdx,
                                    my_uid,
                                    triple_idx
                                )
                            "
                            density="comfortable"
                            :disabled="compDisabled"
                        ></v-btn>
                        &nbsp;
                        <!-- Add button -->
                        <v-btn
                            v-if="allowAddTriple(triple_idx)"
                            rounded="0"
                            elevation="1"
                            icon="mdi-plus-circle-outline"
                            @click="
                                formData.addObject(
                                    localNodeUid,
                                    localNodeIdx,
                                    my_uid
                                )
                            "
                            density="comfortable"
                            :disabled="compDisabled"
                        ></v-btn>
                    </v-col>
                </v-row>
            </span>
        </v-col>
    </v-row>
</template>

<script setup>
import {
    ref,
    onMounted,
    onBeforeMount,
    computed,
    inject,
    onBeforeUpdate,
    onBeforeUnmount,
    watch,
    toRaw,
} from 'vue';
import { SHACL, DLCO } from '../modules/namespaces';
import { useRules } from '../composables/rules';
import { nameOrCURIE, addCodeTagsToText, isObject } from '../modules/utils';
import { toCURIE, toIRI } from 'shacl-tulip';

// ----- //
// Props //
// ----- //

const props = defineProps({
    property_shape: Object,
    node_uid: String,
    node_idx: String,
    top_level_prop: Boolean,
});

// ---- //
// Data //
// ---- //

const my_uid = ref('');

const localPropertyShape = ref(props.property_shape);
const localNodeUid = ref(props.node_uid);
const localNodeIdx = ref(props.node_idx);
const localTopLevelProp = ref(props.top_level_prop);
const editorMatchers = inject('editorMatchers');
const defaultEditor = inject('defaultEditor');
const formData = inject('formData');
const shapesDS = inject('shapesDS');
const allPrefixes = inject('allPrefixes');
const show_all_fields = inject('show_all_fields');
const { isRequired } = useRules(localPropertyShape.value);
const configVarsMain = inject('configVarsMain');
const ID_IRI = inject('ID_IRI');
const compDisabled = ref(false);
const configMatchedComponent = ref(null);

// ----------------- //
// Lifecycle methods //
// ----------------- //

onMounted(() => {
    // Autogenerate value for idi_iri if required
    if (
        my_uid.value == ID_IRI.value &&
        isObject(configVarsMain.idAutogenerate) &&
        Object.keys(configVarsMain.idAutogenerate).includes(localNodeUid.value)
    ) {
        // if the object value is already in formdata, dont autogenerate and don't add,
        // but still disable the field
        if (
            formData.content[localNodeUid.value][localNodeIdx.value][
                my_uid.value
            ]
        ) {
            compDisabled.value = true;
            return;
        } else {
            var new_id_val = '';
            var cfg = configVarsMain.idAutogenerate[localNodeUid.value];
            // Start with prefix uri
            if (cfg['id_autogenerate_prefix']) {
                if (allPrefixes.hasOwnProperty(cfg['id_autogenerate_prefix'])) {
                    new_id_val += allPrefixes[cfg['id_autogenerate_prefix']];
                }
            }
            // Then prepend
            if (cfg['id_autogenerate_prepend']) {
                new_id_val += cfg['id_autogenerate_prepend'];
            }
            // then random uuid
            new_id_val += crypto.randomUUID();
            // then add to formdata
            formData.addPredicate(
                localNodeUid.value,
                localNodeIdx.value,
                my_uid.value,
                [new_id_val]
            );
            compDisabled.value = true;
        }
    } else {
        if (
            formData.content[localNodeUid.value][localNodeIdx.value][
                my_uid.value
            ]
        ) {
            return;
        }
        formData.addPredicate(
            localNodeUid.value,
            localNodeIdx.value,
            my_uid.value
        );
    }
});

onBeforeMount(() => {
    my_uid.value = localPropertyShape.value[SHACL.path.value];
    // Lets see if any config-driven editor matching is available
    // We loop through all keys of config[editor_selection] and assign and exit on first matched
    let configMatchedComponentName
    for (const prop_shape_key of Object.keys(configVarsMain.editorSelection)) {
        var pskey = toIRI(prop_shape_key, allPrefixes)
        if (
            localPropertyShape.value.hasOwnProperty(pskey) &&
            Object.keys(configVarsMain.editorSelection[prop_shape_key]).indexOf(toCURIE(localPropertyShape.value[pskey], allPrefixes)) >= 0
        ) {
            configMatchedComponentName = configVarsMain.editorSelection[prop_shape_key][toCURIE(localPropertyShape.value[pskey], allPrefixes)]
            break;
        }
    }
    if (configMatchedComponentName) {
        const matchingComponentNames = Object.keys(editorMatchers).filter(key => key.includes(configMatchedComponentName));
        if (matchingComponentNames.length > 0) {
            var cname = matchingComponentNames[0] // take first matched
            configMatchedComponent.value = editorMatchers[cname].component
        }
    }
});

onBeforeUnmount(() => {});

// ------------------- //
// Computed properties //
// ------------------- //

const matchedComponent = computed(() => {
    for (const key in editorMatchers) {
        if (editorMatchers[key].match(localPropertyShape.value)) {
            return editorMatchers[key].component;
        }
    }
    return defaultEditor;
});

const show_field = computed(() => {
    // Determine whether to show this field based on some explicit
    // and derived logic:
    // - show if the switch to "show_all_fields" is true
    // - show if the switch to "show_all_fields" is false, but the field is required
    // - show if the switch to "show_all_fields" is false, but the field has a sv:recommended attribute in the shape
    //   (which means it was likely annotated and therefore likely important)
    if (show_all_fields.value) {
        return true;
    } else {
        if (localTopLevelProp.value) {
            return true;
        }
        if (isRequired.value) {
            return true;
        }
        if (
            localPropertyShape.value.hasOwnProperty(DLCO.recommended.value) &&
            localPropertyShape.value[DLCO.recommended.value] == 'true'
        ) {
            return true;
        }
        return false;
    }
});

// --------- //
// Functions //
// --------- //

function allowAddTriple(idx) {
    // if there is no maxCount, allowMultiple = true
    // if the maxCount is 1, allowMultiple = false
    // if the maxCount > 1, allowMultiple = true
    if (localPropertyShape.value.hasOwnProperty(SHACL.maxCount.value)) {
        if (localPropertyShape.value[SHACL.maxCount.value] == 1) {
            return false;
        } else if (
            localPropertyShape.value[SHACL.maxCount.value] > 1 &&
            formData.content[localNodeUid.value][localNodeIdx.value][
                my_uid.value
            ].length < localPropertyShape.value[SHACL.maxCount.value] &&
            formData.content[localNodeUid.value][localNodeIdx.value][
                my_uid.value
            ].length ==
                idx + 1
        ) {
            return true;
        } else {
            return false;
        }
    } else {
        if (
            formData.content[localNodeUid.value][localNodeIdx.value][
                my_uid.value
            ].length ==
            idx + 1
        ) {
            return true;
        } else {
            return false;
        }
    }
}

function allowRemoveTriple(idx) {
    if (
        formData.content[localNodeUid.value][localNodeIdx.value][my_uid.value]
            .length > 1
    ) {
        return true;
    }
    return false;
}
</script>

<style scoped>
.disabled-row {
    opacity: 0.5;
    /* color: grey; */
}
</style>

<style>
.code-style {
    color: red;
    background-color: #f5f5f5;
    padding: 0.1em 0.2em;
    font-family: monospace;
    border-radius: 4px;
    border: 1px solid #ddd;
}
</style>
