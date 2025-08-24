<template>
    <v-input
        v-model="internalValue"
        :rules="rules"
        ref="fieldRef"
        :id="inputId"
        hide-details="auto"
    >
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
    var i=configVarsMain.editorConfig.W3CISO8601YearEditor.yearEnd;
    i>=configVarsMain.editorConfig.W3CISO8601YearEditor.yearStart;
    i--
) {
    yearItems.push(i)
}

const { subValues, internalValue } = useBaseInput(
    props,
    emit,
    valueParser,
    valueCombiner
);

function valueParser(value) {
    // Parsing internalValue into ref values for separate subcomponent(s)
    return {
        selectedYear: value
    }
}

function valueCombiner(values) {
    return values.selectedYear
}

</script>

<script>
export const matchingLogic = (shape) => {
    // No explicit matching criteria
    // Can still be selected for usage via shacl-vue config
    return false;
};
</script>
