<template>
    <v-card class="mx-4 mb-4" :variant="props.variant">
        <v-card-title class="text-h6">
            <v-icon>{{ getClassIcon(classIRI) }}</v-icon>
            {{ record.title }}
            <v-btn
                icon="mdi-pencil"
                variant="tonal"
                size="x-small"
                class="rounded-lg"
                @click="editInstanceItem(record)"
            ></v-btn>
        </v-card-title>
        <v-card-subtitle>{{ toCURIE(record.props.subtitle, allPrefixes) }}</v-card-subtitle>
        <v-card-text v-if="!formOpen">
        <span v-for="(v, k, index) in record.props">
            <span v-if="k == 'subtitle' || k == 'quad' || k == RDF.type.value"></span>
            <span v-else>
                <strong>{{ makeReadable(toCURIE(k, allPrefixes, "parts").property) }}</strong>:
                <span v-if="v.length > 1 || isObject(v[0])"><br></span>
                <span v-for="(el, i) in v">
                    <span v-if="isObject(el)">
                        <v-row>
                            <v-col cols="8">
                                <v-card variant="text" style="margin-bottom: 0.1em; padding-bottom: 0;" no-gutters>
                                    <v-card-text style="padding:0.5em">
                                        <span v-for="(val, key, idx) in el">
                                            <span v-if="key != RDF.type.value">
                                                <em>{{ makeReadable(toCURIE(key, allPrefixes, "parts").property) }}</em>: {{ val }} <br>
                                            </span>
                                        </span>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                            <v-col></v-col>
                        </v-row>
                        
                    </span>
                    <span v-else>&nbsp;{{ el }}</span>
                </span>
                <span v-if="!isObject(v.at(-1))"><br></span>
            </span>
        </span>
        </v-card-text>
    </v-card>

</template>

<script setup>
    import { inject } from 'vue';
    import { toCURIE, makeReadable, isObject} from '@/modules/utils';
    import { RDF } from '@/modules/namespaces';

    const props = defineProps({
        classIRI: String,
        record: Object,
        variant: String,
        formOpen: Boolean,
    })

    const editInstanceItem = inject('editInstanceItem')
    const allPrefixes = inject('allPrefixes')
    const getClassIcon = inject('getClassIcon')
</script>