<template>
    <v-input
        v-model="internalValue"
        :rules="rules"
        ref="fieldRef"
        :id="inputId"
        hide-details="auto"
    >
        <v-dialog max-width="500">
            <template v-slot:activator="{ props: activatorProps }">
                    <v-btn
                        v-bind="activatorProps"
                        :text="internalValue ? internalValue : 'Select a date'"
                    ></v-btn>
            </template>
            <template v-slot:default="{ isActive }">
                <v-card title="Date">
                    <v-date-picker
                        show-adjacent-months
                        v-model="subValues.picked_date"
                        validate-on="lazy input"
                    ></v-date-picker>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn text="OK" @click="isActive.value = false"></v-btn>
                    </v-card-actions>
                </v-card>
            </template>
        </v-dialog>
    </v-input>
</template>

<script setup>
import { inject } from 'vue';
import { useRules } from '../composables/rules';
import { useRegisterRef } from '../composables/refregister';
import { useBaseInput } from '@/composables/base';
import { useCompConfig } from '@/composables/useCompConfig';

const props = defineProps({
    modelValue: String,
    property_shape: Object,
    node_uid: String,
    node_idx: String,
    triple_uid: String,
    triple_idx: Number,
});
const { rules } = useRules(props.property_shape);
const inputId = `input-${Date.now()}`;
const { fieldRef } = useRegisterRef(inputId, props);
const emit = defineEmits(['update:modelValue']);
const configVarsMain = inject('configVarsMain');
const { subValues, internalValue } = useBaseInput(
    props,
    emit,
    valueParser,
    valueCombiner
);

function valueParser(value) {
    // Parsing internalValue into ref values for separate subcomponent(s)
    if(value) {
        return {
            picked_date: value,
        };
    } else {
        return {
            picked_date: null,
        };
    }
}

function valueCombiner(values) {
    if (values.picked_date) {
        try {
            var y = values.picked_date.getFullYear();
            var m = ('0' + (parseInt(values.picked_date.getMonth()) + 1)).slice(
                -2
            );
            var d = ('0' + values.picked_date.getDate()).slice(-2);
            return `${y}-${m}-${d}`;
        } catch (error) {
            const {year, month, day} = parseDateString(values.picked_date)
            if (day) {
                var m = ('0' + month).slice(-2);
                var d = ('0' + day).slice(-2);
                return `${year}-${m}-${d}`;
            } else {
                return null
            }
        }
    }
    return null;
}

function parseDateString(input) {
    const parts = input.split('-');
    const year = parseInt(parts[0]);
    let month = null;
    let day = null;
    if (parts.length >= 2) {
        const monthIndex = parseInt(parts[1], 10);
        month = monthIndex || null;
    }
    if (parts.length === 3) {
        day = parseInt(parts[2], 10);
    }
    return { year, month, day };
}
</script>

<script>
import { SHACL } from '../modules/namespaces';
export const matchingLogic = (shape) => {
    // No explicit matching criteria
    // Can still be selected for usage via shacl-vue config
    return false;
};
</script>
