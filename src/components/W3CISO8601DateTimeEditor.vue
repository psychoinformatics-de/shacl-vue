<template>
    <v-input
        v-model="internalValue"
        :rules="rules"
        ref="fieldRef"
        :id="inputId"
        hide-details="auto"
    >
        <v-row>
            <v-col cols="4">
                <span v-if="subValues.selectedFormat == 'YYYY-MM-DD'">
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
                </span>
                <span v-if="subValues.selectedFormat == 'YYYY-MM' || subValues.selectedFormat == 'YYYY'">
                    <v-autocomplete
                        label="Year"
                        v-model="subValues.selectedYear"
                        density="compact"
                        variant="outlined"
                        style="margin-left: auto;"
                        :items="yearItems"
                        class="text-caption"
                    >
                    </v-autocomplete>
                </span>
            </v-col>
            <v-col cols="4">
                <span v-if="subValues.selectedFormat == 'YYYY-MM'">
                    <v-autocomplete
                        label="Month"
                        v-model="subValues.selectedMonth"
                        density="compact"
                        variant="outlined"
                        style="margin-left: auto;"
                        :items="monthItems"
                        class="text-caption"
                    >
                    </v-autocomplete>

                </span>
            </v-col>
            <v-col cols="4">
                <v-select
                    label="Date format"
                    v-model="subValues.selectedFormat"
                    density="compact"
                    variant="outlined"
                    style="margin-left: auto;"
                    :items="formats"
                    class="text-caption"
                >
                </v-select>
            </v-col>
        </v-row>
        
        
    </v-input>
</template>

<script setup>
import { inject, ref } from 'vue';
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
const {componentName, componentConfig} = useCompConfig(configVarsMain)

// const subValues.selectedFormat = ref("YYYY-MM-DD")
const formats = [
    "YYYY-MM-DD",                       //(eg 1997-07-16)    
    "YYYY-MM",                          //(eg 1997-07)
    "YYYY",                             //(eg 1997)
    // "YYYY-MM-DDThh:mmTZD",           //(eg 1997-07-16T19:20+01:00)
    // "YYYY-MM-DDThh:mm:ssTZD",        //(eg 1997-07-16T19:20:30+01:00)
    // "YYYY-MM-DDThh:mm:ss.sTZD",      //(eg 1997-07-16T19:20:30.45+01:00)
]
const yearItems = []
for (
<<<<<<< HEAD
    var i=componentConfig?.yearEnd;
    i>=componentConfig?.yearStart;
=======
    var i=configVarsMain.editorConfig.W3CISO8601DateTimeEditor.yearEnd;
    i>=configVarsMain.editorConfig.W3CISO8601DateTimeEditor.yearStart;
>>>>>>> origin/main
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
        const { year, month, day } = parseDateString(value)
        let sF
        if (day) {
            sF = 'YYYY-MM-DD';
        } else if (month) {
            sF = 'YYYY-MM';
        } else {
            sF = 'YYYY';
        }
        return {
            selectedFormat: sF,
            picked_date: value,
            selectedYear: year,
            selectedMonth: monthItems[month-1],
        };
    } else {
        return {
            selectedFormat: 'YYYY-MM-DD',
            picked_date: null,
            selectedYear: null,
            selectedMonth:  null,
        };
    }
}

function valueCombiner(values) {
    if (values.selectedFormat == 'YYYY-MM-DD') {
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
    if (values.selectedFormat == 'YYYY-MM') {
        if (values.selectedYear && values.selectedMonth) {
            var m = ('0' + (parseInt(monthItems.indexOf(values.selectedMonth)) + 1)).slice(-2);
            return `${values.selectedYear}-${m}`;
        } else {
            return null
        }
    }
    if (values.selectedFormat == 'YYYY') {
        if (values.selectedYear) {
            return `${values.selectedYear}`;
        } else {
            return null
        }
    }
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
    // sh:nodeKind exists
    if (shape.hasOwnProperty(SHACL.nodeKind.value)) {
        // sh:nodeKind == sh:Literal
        if (shape[SHACL.nodeKind.value] == SHACL.Literal.value) {
            // sh:datatype exists
            if (shape.hasOwnProperty(SHACL.datatype.value)) {
                // sh:datatype == "https://www.w3.org/TR/NOTE-datetime"
                return (
                    shape[SHACL.datatype.value] == 'https://www.w3.org/TR/NOTE-datetime'
                );
            }
        }
    }
    return false;
};
</script>
