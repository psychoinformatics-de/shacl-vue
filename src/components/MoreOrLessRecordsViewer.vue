<template>
    <span v-if="records.length > count">
        <v-tooltip text="Show more..." location="top">
            <template v-slot:activator="{ props }">
                <v-btn
                    v-bind:="props"
                    no-gutters
                    @click="increase()"
                    density="compact"
                    icon="mdi-plus"
                    size="small"
                    variant="tonal"
                    rounded="sm"
                ></v-btn>
            </template>
        </v-tooltip>
    </span>
    <span v-if="count > stepSize">
        &nbsp;
        <v-tooltip text="Show less..." location="top">
            <template v-slot:activator="{ props }">
                <v-btn
                    v-bind:="props"
                    no-gutters
                    @click="decrease()"
                    density="compact"
                    icon="mdi-minus"
                    size="small"
                    variant="tonal"
                    rounded="sm"
                ></v-btn>
            </template>
        </v-tooltip>
    </span>
    <span v-if="records.length > stepSize">
        &nbsp; <em>(showing {{ count }} of {{ records.length }})</em>
    </span>
</template>

<script setup>
const props = defineProps({
    records: Array,
    count: Number,
    stepSize: Number,

});

const emit = defineEmits(['update:count']);

function increase() {
    const newTempCount = props.count + props.stepSize
    const newCount = newTempCount > props.records.length ? props.records.length : newTempCount
    emit('update:count', newCount);
}

function decrease() {
    const newCount = props.count - props.stepSize < props.stepSize
        ? props.stepSize
        : props.count - props.stepSize;
    emit('update:count', newCount);
}
</script>

<style scoped>

</style>
