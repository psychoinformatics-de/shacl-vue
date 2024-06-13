<template>
    <v-dialog max-width="500">
        <template v-slot:activator="{ props: activatorProps }">
            <v-btn
                v-bind="activatorProps"
                density="compact"
                :text="selectedDate ? selectedDate.toISOString().split('T')[0] : 'Select a date'"
            ></v-btn>
        </template>

        <template v-slot:default="{ isActive }">
            <v-card title="Date">
                <v-date-picker show-adjacent-months v-model="selectedDate"></v-date-picker>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text="OK" @click="isActive.value = false"></v-btn>
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>
    
</template>

<script setup>
    import { ref, onMounted, computed } from 'vue'
    const props = defineProps({
        property_shape: Object,
    })
    var today = new Date()
    var today_date = today.toISOString().split('T')[0]
    var selectedDate = ref(null)

</script>