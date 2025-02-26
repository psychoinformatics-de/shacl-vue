<template>
    <em>...unknown editor...</em>
</template>

<script setup>
    import { useRules } from '../composables/rules'
    import { useRegisterRef } from '../composables/refregister';
    import { useBaseInput } from '@/composables/base';

    const props = defineProps({
        modelValue: String,
        property_shape: Object,
        node_uid: String,
        node_idx: String,
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
        return {}
    }

    function valueCombiner(values) {
        // Determine internalValue from subvalues/subcomponents
        return null
    }
</script>