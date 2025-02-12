<template>
    <v-card class="mx-4 mb-4" :variant="props.variant">
        <v-card-title class="text-h6">
            <v-icon>{{ getClassIcon(classIRI) }}</v-icon>&nbsp;
            <TextOrLinkViewer :textVal="props.record.title" :prefLabel="prefLabel"></TextOrLinkViewer>&nbsp;
            <v-btn
                icon="mdi-pencil"
                variant="tonal"
                size="x-small"
                class="rounded-lg"
                @click="editInstanceItem(props.record)"
            ></v-btn>
        </v-card-title>
        <v-card-subtitle>{{ toCURIE(props.record.props.subtitle, allPrefixes) }}</v-card-subtitle>
        <v-card-text v-if="!formOpen">
            <!-- named or literal nodes -->
            <span v-for="(v, k, index) in textProperties">
                <strong>{{ makeReadable(toCURIE(k, allPrefixes, "parts").property) }}</strong>:
                <span v-for="(el, i) in v">
                    <span v-if="v.length > 1"><br>&nbsp;- </span>
                    &nbsp;<TextOrLinkViewer :textVal="el"></TextOrLinkViewer>
                </span>
                <br>
            </span>
            <!-- Blank nodes -->
            <span v-for="(v, k, index) in objectProperties">
                <strong>{{ makeReadable(toCURIE(k, allPrefixes, "parts").property) }}</strong>:
                <br>
                <span v-for="(el, i) in v">
                    <div>
                        <v-card variant="text" class="d-inline-block" style="margin-bottom: 0; padding-bottom: 0; background-color: white;" no-gutters>
                            <v-card-text style="padding:0.5em; background-color: white;">
                                <v-row justify="center" align="center">
                                    <v-col cols="1"><v-icon>{{ getClassIcon(el[RDF.type.value]) }}</v-icon></v-col>
                                    <v-col>
                                        <span v-for="(val, key, idx) in el">
                                            <span v-if="key != RDF.type.value">
                                                <em>{{ makeReadable(toCURIE(key, allPrefixes, "parts").property) }}</em>: <TextOrLinkViewer :textVal="val"></TextOrLinkViewer> <br>
                                            </span>
                                        </span>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                        </v-card>
                    </div>
                </span>
            </span>
        </v-card-text>
    </v-card>

</template>

<script setup>
    import { inject, onBeforeMount, onUpdated, ref} from 'vue';
    import { toCURIE, makeReadable, isObject, toIRI} from '@/modules/utils';
    import { RDF, DLTHINGS } from '@/modules/namespaces';
    import TextOrLinkViewer from './TextOrLinkViewer.vue';

    const props = defineProps({
        classIRI: String,
        record: Object,
        variant: String,
        formOpen: Boolean,
    })

    const editInstanceItem = inject('editInstanceItem')
    const allPrefixes = inject('allPrefixes')
    const getClassIcon = inject('getClassIcon')
    const textProperties = ref({})
    const objectProperties = ref({})
    const prefLabel = ref("")

    onBeforeMount(()=>{
        const keys = Object.keys(props.record.props)
        for (var k of keys) {
            if (['subtitle', 'quad', RDF.type.value].indexOf(k) >= 0) {
                continue;
            }
            var v = props.record.props[k]
            if (isObject(v[0])) {
                objectProperties.value[k] = v;
            } else {
                textProperties.value[k] = v;
            }
        }
        prefLabel.value = getPrefLabel()
    })

    function getPrefLabel() {
        if ( props.record.props.hasOwnProperty(DLTHINGS.annotations.value) ) {
            for(var i=0; i<props.record.props[DLTHINGS.annotations.value].length; i++) {
                var obj = props.record.props[DLTHINGS.annotations.value][i]
                if (obj.hasOwnProperty(DLTHINGS.annotation_tag.value) &&
                    (obj[DLTHINGS.annotation_tag.value] == "skos:prefLabel" ||
                     obj[DLTHINGS.annotation_tag.value] == toIRI("skos:prefLabel", allPrefixes))) {
                    return obj[DLTHINGS.annotation_value.value]
                }
            }
        }
        return ""
    }

</script>