<template>
    <v-input
        v-model="internalValue"
        :rules="rules"
        ref="fieldRef"
        :id="inputId"
        hide-details="auto"
    >
        <v-row>
            <v-col cols="6">
                <v-autocomplete
                    label="Year"
                    v-model="subValues.selectedYear"
                    density="compact"
                    variant="outlined"
                    style="margin-left: auto;"
                    :items="yearItems"
                    class="text-caption"
                    hide-details="auto"
                >
                </v-autocomplete>
            </v-col>
            <v-col>
                <v-autocomplete
                    label="Month"
                    v-model="subValues.selectedMonth"
                    density="compact"
                    variant="outlined"
                    style="margin-left: auto;"
                    :items="monthItems"
                    class="text-caption"
                    hide-details="auto"
                >
                </v-autocomplete>
            </v-col>
        </v-row>
    </v-input>
</template>

<script setup>
import { inject, ref } from 'vue';
import { useRules } from '../composables/rules';
import { useRegisterRef } from '../composables/refregister';
import { useBaseInput } from '@/composables/base';

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

const configVarsMain = inject('configVarsMain')
const yearItems = []
for (
    var i=configVarsMain.editorConfig.W3CISO8601YearMonthEditor.yearEnd;
    i>=configVarsMain.editorConfig.W3CISO8601YearMonthEditor.yearStart;
    i--
) {
    yearItems.push(i)
}
const monthItems = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
]

const { subValues, internalValue } = useBaseInput(
    props,
    emit,
    valueParser,
    valueCombiner
);

function valueParser(value) {
    // Parsing internalValue into ref values for separate subcomponent(s)
    if(value) {
        const { year, month } = parseYearMonthString(value)

        return {
            selectedYear: year,
            selectedMonth:  month,
        };
    } else {
        return {
            selectedYear: null,
            selectedMonth:  null,
        };
    }
}

function valueCombiner(values) {
    if (values.selectedYear && values.selectedMonth) {
        var m = ('0' + (parseInt(monthItems.indexOf(values.selectedMonth)) + 1)).slice(-2);
        return `${values.selectedYear}-${m}`;
    } else {
        return null
    }
}

function parseYearMonthString(input) {
    const parts = input.split('-');
    const year = parseInt(parts[0]);
    let month = null;
    if (parts.length == 2) {
        const monthIndex = parseInt(parts[1], 10);
        month = monthIndex || null;
    }
    return { year, month };
}
</script>

<script>
export const matchingLogic = (shape) => {
    // No explicit matching criteria
    // Can still be selected for usage via shacl-vue config
    return false;
};
</script>
