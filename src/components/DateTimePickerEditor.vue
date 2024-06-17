<template>
    <v-dialog max-width="500">
        <template v-slot:activator="{ props: activatorProps }">
            <v-btn
                v-bind="activatorProps"
                :text="graph[props.node_uid].properties[props.triple_uid].object ? graph[props.node_uid].properties[props.triple_uid].object.toISOString().split('T')[0] : 'Select a date'"
            ></v-btn>
        </template>

        <template v-slot:default="{ isActive }">
            <v-card title="Date">
                <v-date-picker show-adjacent-months v-model="graph[props.node_uid].properties[props.triple_uid].object"></v-date-picker>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text="OK" @click="isActive.value = false"></v-btn>
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>
    
</template>

<script setup>
    import {inject} from 'vue'
    const props = defineProps({
        property_shape: Object,
        node_uid: String,
        triple_uid: String
    })
    const graph = inject('graph');
</script>