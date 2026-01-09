<template>
    <v-input
        v-model="internalValue"
        :rules="rules"
        ref="fieldRef"
        :id="inputId"
        hide-details="auto"
    >
        <v-row no-gutters>
            <v-col cols="1" class="mr-1">
                <v-dialog max-width="500">
                    <template v-slot:activator="{ props: activatorProps }">
                            <v-btn
                                v-bind="activatorProps"
                                icon="mdi-calendar-month-outline"
                                hide-details="auto"
                                density="comfortable"
                                style="border-radius: 5px;"
                            ></v-btn>
                    </template>
                    <template v-slot:default="{ isActive }">
                        <v-card title="Date">
                            <v-confirm-edit v-model="subValues.picked_date" @save="isActive.value = false" @cancel="isActive.value = false">
                                <template v-slot:default="{ model: proxyModel, actions }">
                                    <v-date-picker
                                        show-adjacent-months
                                        v-model="proxyModel.value"
                                        validate-on="lazy input"
                                        hide-details="auto"
                                    >
                                        <template v-slot:actions>
                                            <component :is="actions"></component>
                                        </template>
                                    </v-date-picker>
                                </template>
                            </v-confirm-edit>
                        </v-card>
                    </template>
                </v-dialog>
            </v-col>
            <v-col cols="1" class="mr-1">
                <v-dialog max-width="500">
                    <template v-slot:activator="{ props: activatorProps }">
                            <v-btn
                                v-bind="activatorProps"
                                icon="mdi-clock-time-eight-outline"
                                hide-details="auto"
                                density="comfortable"
                                style="border-radius: 5px;"
                            ></v-btn>
                    </template>
                    <template v-slot:default="{ isActive }">
                        <v-card title="Time">
                            <v-confirm-edit v-model="subValues.picked_time" @save="isActive.value = false" @cancel="isActive.value = false">
                                <template v-slot:default="{ model: proxyModel, actions }">
                                    <v-time-picker
                                        use-seconds
                                        format="24hr"
                                        v-model="proxyModel.value"
                                        validate-on="lazy input"
                                        hide-details="auto"
                                    >
                                        <template v-slot:actions>
                                            <component :is="actions"></component>
                                        </template>
                                    </v-time-picker>
                                </template>
                            </v-confirm-edit>
                        </v-card>
                    </template>
                </v-dialog>
            </v-col>
            <v-col>
                <v-text-field
                    class="w-100"
                    v-model="subValues.datetime_string"
                    density="compact"
                    variant="outlined"
                    hide-details="auto"
                ></v-text-field>
            </v-col>
        </v-row>
    </v-input>
</template>

<script setup>
import { inject, computed, watch } from 'vue';
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
const dateTimeRegex = /^([-+]\d+|\d{4}|\d{4}-[01]\d|\d{4}-[01]\d-[0-3]\d|\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d|\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d|\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+)(Z|[+-][0-2]\d:[0-5]\d)?$/;
rules.value.push((value) => {
    if (!value) return true;
    if (dateTimeRegex.test(value)) return true;
    return 'This is not a valid NOTE date-time string';
});
const inputId = `input-${Date.now()}`;
const { fieldRef } = useRegisterRef(inputId, props);
const emit = defineEmits(['update:modelValue']);
const configVarsMain = inject('configVarsMain');
const {componentName, componentConfig} = useCompConfig(configVarsMain)


const { subValues, internalValue } = useBaseInput(
    props,
    emit,
    valueParser,
    valueCombiner
);

function valueParser(value) {
    // Parsing internalValue into ref values for separate subcomponent(s)
    if(value) {
        const parsedDateTime = parseW3CNoteString(value)
        const dateStr = getDateString(parsedDateTime)
        const timeStr = getTimeString(parsedDateTime)
        return {
            picked_date: dateStr,
            picked_time: timeStr,
            datetime_string: value
        };
    } else {
        return {
            picked_date: null,
            picked_time: null,
            datetime_string: ''
        };
    }
}

function valueCombiner(values) {
    return values.datetime_string;
}

watch(
    () => [subValues.value.picked_date, subValues.value.picked_time],
    ([date, time]) => {
        if (!date && !time) return;
        let dt = date ? dateToString(date) : date
        const combined = getDateTimeString(dt, time);
        if (combined !== subValues.value.datetime_string) {
            subValues.value.datetime_string = combined;
        }
    }
);

watch(
    () => subValues.value.datetime_string,
    (newVal) => {
        if (!dateTimeRegex.test(newVal)) return;
        const parsed = parseW3CNoteString(newVal);
        const date = getDateString(parsed);
        let time = getTimeString(parsed);
        if (time && time.split(':').length === 2) {
            time = `${time}:00`;
        }
        subValues.value.picked_date = date;
        subValues.value.picked_time = time;
    }
);


function getDateTimeString(dateStr, timeStr) {
    let result = '';
    if (dateStr) {
        result += dateStr;
    }
    if (timeStr) {
        result = result + 'T' + timeStr;
    }
    return result
}

function getDateString(dateTime) {
    let result = null;
    if (dateTime.year) {
        const y = String(dateTime.year).padStart(4, '0');
        result = y;
        if (dateTime.month) {
            const m = String(dateTime.month).padStart(2, '0')
            result = `${y}-${m}`
            if (dateTime.day) {
                const d = String(dateTime.day).padStart(2, '0')
                result = `${y}-${m}-${d}`
            }
        }
    }
    return result;
}

function getTimeString(dateTime) {
    let result = null;
    if (dateTime.hour) {
        const h = String(dateTime.hour).padStart(2, '0');
        result = h;
        if (dateTime.minute) {
            const m = String(dateTime.minute).padStart(2, '0')
            result = `${h}:${m}`
            if (dateTime.second) {
                const s = String(dateTime.second).padStart(2, '0')
                result = `${h}:${m}:${s}`
            }
        }
    }
    return result;
}

function dateToString(inputDate) {
    if (typeof inputDate.getFullYear !== 'function') return inputDate
    var y = inputDate.getFullYear();
    var m = ('0' + (parseInt(inputDate.getMonth()) + 1)).slice(-2);
    var d = ('0' + inputDate.getDate()).slice(-2);
    return `${y}-${m}-${d}`;
}

function parseW3CNoteString(input) {
    const result = {
        year: null,
        month: null,
        day: null,
        hour: null,
        minute: null,
        second: null,
        fraction: null,
        timezone: null
    };
    if (!dateTimeRegex.test(input)) {
        return result;
    }

    // Extract timezone if present
    const tzMatch = input.match(/(Z|[+-][0-2]\d:[0-5]\d)$/);
    if (tzMatch) {
        result.timezone = tzMatch[1];
        input = input.slice(0, -tzMatch[1].length);
    }

    // Split date and time
    const [datePart, timePart] = input.split("T");

    // ---- DATE ----
    const dateParts = datePart.split("-");
    result.year = parseInt(dateParts[0], 10);
    if (dateParts.length > 1) {
        result.month = parseInt(dateParts[1], 10);
    }
    if (dateParts.length > 2) {
        result.day = parseInt(dateParts[2], 10);
    }
    // ---- TIME ----
    if (timePart) {
        const timeMatch = timePart.match(/^([0-2]\d)(?::([0-5]\d))?(?::([0-5]\d))?(?:\.(\d+))?$/);

        if (timeMatch) {
            result.hour = parseInt(timeMatch[1], 10);
            if (timeMatch[2]) result.minute = parseInt(timeMatch[2], 10);
            if (timeMatch[3]) result.second = parseInt(timeMatch[3], 10);
            if (timeMatch[4]) result.fraction = timeMatch[4];
        }
    }
    return result;
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
