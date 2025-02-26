<template>

    <v-input
        v-model="internalValue"
        :rules="rules"
        ref="fieldRef"
        :id="inputId"
        hide-details="auto"
        style="margin-bottom: 1em;"
    >
        <!-- <v-text-field
            v-model="subValues.decimal"
            density="compact"
            variant="outlined"
            label="add decimal value"
            hide-details="auto"
        >
        </v-text-field> -->
        <v-select
            :items="inList"
            v-model="subValues.selected_item"
            density="compact"
            variant="outlined"
            label="select type"
            item-value="value"
            item-text="title"
            ref="selector"
        >
            <!-- <template v-slot:item="data">
                <v-list-item @click="selectORelement(data.item)">
                    <v-list-item-title>{{  }}</v-list-item-title>
                    <span v-for="(value, key, index) in data.item.props">
                        <span v-if="['title', 'subtitle', 'name', 'value'].indexOf(key) < 0">
                            <strong>{{ toCURIE(key, shapePrefixes) }}</strong>: {{ toCURIE(value, shapePrefixes) }} <br>
                        </span>
                    </span>
                </v-list-item>
            </template> -->
        </v-select>
    </v-input>
</template>

<script setup>
    import { computed, inject, ref, toRaw} from 'vue'
    import { useRules } from '../composables/rules'
    import { useRegisterRef } from '../composables/refregister';
    import { useBaseInput } from '@/composables/base';
    import { toCURIE } from '../modules/utils';


    const props = defineProps({
        modelValue: String,
        property_shape: Object,
        node_uid: String,
        triple_uid: String,
        triple_idx: Number
    })
    const { rules } = useRules(props.property_shape)
    const inputId = `input-${Date.now()}`;
    const { fieldRef } = useRegisterRef(inputId, props);
    const emit = defineEmits(['update:modelValue']);
    const { subValues, internalValue } = useBaseInput(
        props,
        emit,
        valueParser,
        valueCombiner
    );
    
    function valueParser(value) {
        // Parsing internalValue into ref values for separate subcomponent(s)
        return {
            selected_item: value,
        }
    }

    function valueCombiner(values) {
        // Determine internalValue from subvalues/subcomponents
        return values.selected_item
    }

    const inList = computed(() => {
        var items = []
        const in_array = props.property_shape[SHACL.in.value]
        for (var el of in_array) {
            items.push(
                {
                    title: el,
                    value: el
                }
            )
        }
        return items
    })

</script>

<script>
    import { SHACL, XSD } from '../modules/namespaces'
    export const matchingLogic = (shape) => {
        // sh:in exists, sh:in is an array, all array elements are of same type
        if ( shape.hasOwnProperty(SHACL.in.value)
            && Array.isArray(shape[SHACL.in.value])
            && new Set( shape[SHACL.in.value].map( x => typeof x ) ).size <= 1) {
            return true
        }
        return false
    };
</script>