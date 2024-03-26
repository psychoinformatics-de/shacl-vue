<template>
        <h2>{{ toCURIE(shape_iri) }}</h2>
        <v-table theme="light">
        <thead>
        <tr>
            <th class="text-left">
            Attribute
            </th>
            <th class="text-left">
            Value
            </th>
        </tr>
        </thead>
        <tbody>
        <tr
            v-for="(value, key) in shapeAttributes"
            :key="key"
        >
            <td>{{ toCURIE(key) }}</td>
            <td>{{ value }}</td>
        </tr>
        </tbody>
        
        </v-table>
        <br>
        <v-divider></v-divider>
        <br>

        <h3>Properties:</h3>
        <br>
        <span v-for="property in shape_obj.properties" :key="key">
            <v-card variant="outlined" style="margin-bottom: 0.5em;">
                <v-card-text>
                    <v-card-title><small>{{ toCURIE(property["http://www.w3.org/ns/shacl#path"])}}</small></v-card-title>
                        <v-table theme="light">
                            <tbody>
                            <tr
                                v-for="(value, key) in property"
                                :key="key"
                            >
                                <td>{{ toCURIE(key) }}</td>
                                <td>{{ value }}</td>
                            </tr>
                            </tbody>
                            
                        </v-table>
                    
                </v-card-text>
                
            </v-card>
        </span>


</template>

<script setup>
    import { ref, onMounted, computed } from 'vue'
    // Define component properties
    const props = defineProps({
        prefixes: Object,
        shape_iri: String,
        shape_obj: Object,
    })

    const ready = ref(false)


    const shapeAttributes = computed(() => {
        const ignore_properties = [
            "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
            "properties",
            "http://www.w3.org/ns/shacl#ignoredProperties"
        ]
        var new_obj = {}
        for (const [key, value] of Object.entries(props.shape_obj)) {
            if (ignore_properties.indexOf(key) < 0) {
                new_obj[key] = value
            }
        }
        return new_obj
    })

    function toCURIE(IRI) {
        for (const [curie, iri] of Object.entries(props.prefixes)) {
            if (IRI.indexOf(iri) >= 0) {
                return curie + ':' + IRI.split(iri)[1]
            }
        }
    }

    onMounted(() => {
        ready.value = true;
    })


  
</script>