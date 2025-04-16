<template>
    <v-container fluid>
    <v-card class="d-flex flex-column justify-center">
    <!-- Drag and Drop area -->
    <v-card-title class="justify-center">Upload, drag and drop, or link a CSV file</v-card-title>

        <v-card-text>
            <v-select :items="allClassIRIs" v-model="selectedShapeIRI" variant="solo" density="compact">
            </v-select>
        </v-card-text>
        <v-card
            class="drag-drop-area"
            :class="{'dragover': isDragging}"
            max-width="80%"
            variant="tonal"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onFileDrop"
        >
        <v-row >
            <!-- File input on the left -->
            <v-col cols="6" class="justify-center align-center">
            <v-input>
                <v-icon style="margin-top: 0.25em;">mdi-upload</v-icon>
                <v-btn
                variant="outlined"
                @click="onFileSelect"
                style="margin-left: 1em;"
                > Upload a CSV/TSV file
                </v-btn>
            </v-input>
            </v-col>
    
            <!-- URL input on the right -->
            <v-col cols="6">
            <v-text-field
                label="Or paste a CSV/TSV file URL"
                density="compact"
                variant="outlined"
                v-model="fileUrl"
                prepend-icon="mdi-link"
                @change="onUrlInput"
            ></v-text-field>
            </v-col>
        </v-row>
        </v-card>
        <!-- Uploaded file details or preview -->
        <v-card v-if="fileData" class="mt-5">
        <v-card-title>File details:</v-card-title>
        <v-card-text>
            <p><strong>Name:</strong> {{ fileData.name }}</p>
            <p><strong>Size:</strong> {{ formatBytes(fileData.size) }}</p>
            <p><strong>Type:</strong> {{ fileData.type }}</p>
            <v-img v-if="isImage" :src="fileData.url" max-width="300" />
        </v-card-text>
        </v-card>


        <v-card v-show="showTable">
            
            <div id="mytable"></div>
            <div style="display: flex; margin: 1em; margin-left: auto;">
                <v-btn
                    text="Cancel"
                    @click="closeDialog()"
                    style="margin-left: auto; margin-right: 1em;"
                    prepend-icon="mdi-close-box"
                ></v-btn>
                <v-btn
                    text="Save"
                    type="submit"
                    @click="saveData()"
                    prepend-icon="mdi-content-save"
                ></v-btn>
            </div>
        </v-card>
        
    </v-card>
    </v-container>
</template>

<script setup>
    import { ref, computed, onMounted, inject, toRaw} from 'vue'
    import {TabulatorFull as Tabulator} from 'tabulator-tables';
    import { DataTable } from '../classes/DataTable'
    import { toCURIE } from 'shacl-tulip';

    // ----- //
    // Props //
    // ----- //
    const props = defineProps({
        shape_iri: String,
        node_idx: String,
        propClassList: Array,
        parent_shape_iri: String,
        parent_property_iri: String,
    })
    const localShapeIri = ref(props.shape_iri);
    console.log(localShapeIri.value)
    const localNodeIdx = ref(props.node_idx);
    console.log(localNodeIdx.value)
    console.log(props.propClassList)

    const shapesDS = inject('shapesDS')
    const rdfDS = inject('rdfDS')
    const formData = inject('formData')
    const shape_obj = shapesDS.data.nodeShapes[localShapeIri.value]
    const allPrefixes = inject('allPrefixes');
    const ID_IRI = inject('ID_IRI')

    const allClassIRIs = ref([])
    const selectedShapeIRI = ref(localShapeIri.value)



    onMounted( () => {
        // if the node_idx is passed, it means the TableLoader component
        // was activated from within the NodeShapeEditor (via InstancesSelectEditor).
        if (props.node_idx) {
            allClassIRIs.value = props.propClassList
        } else {
            allClassIRIs.value.push(
                {
                    title: toCURIE(localShapeIri.value, allPrefixes),
                    value: localShapeIri.value
                }
            )
        }
    })

    const emit = defineEmits(['close-multirecord']);
    function closeDialog() {
        emit('close-multirecord');
    };

    // Allowed RDF file MIME types
    const allowedMimeTypes = [
        'text/csv',
        'text/tsv'
    ]

    var table
    const showTable = ref(false)

    const selectedFile = ref(null)
    const fileUrl = ref('')
    const isDragging = ref(false)
    const fileData = ref(null)

    // Check if the file is an image (for preview purposes)
    const isImage = computed(() => {
        return fileData.value && fileData.value.type.startsWith('image/')
    })

    const rules = {
        // required: value => !!value || 'File is required',
        validRdfFile: value => {
        if (value && value.type && allowedMimeTypes.includes(value.type)) {
            return true
        }
        // console.log(value.type)
        return 'Invalid file type. Please upload a valid CSV/TSV file.'
        }
    }

    onMounted(() => {
        table = new Tabulator("#mytable", {
            // height:'50vh',
            layout:"fitColumns",
            // importFormat:"csv",
            autoColumns: true
        });
    })

    // Format file sizes
    const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
    }

    // Handle file upload button
    function onFileSelect() {
        table.import("csv", ".csv,.tsv")
        .then(() => {
            showTable.value = true;
        })
        .catch(() => {
            console.error("Table importing failed!")
        })
    }

    // Handle dragging over the drop area
    const onDragOver = () => {
        isDragging.value = true
    }

    // Handle drag leave (when the file is dragged out of the area)
    const onDragLeave = () => {
        isDragging.value = false
    }

    // Handle file drop event
    const onFileDrop = (event) => {
        isDragging.value = false
        const file = event.dataTransfer.files[0]
        if (file) {
        validateAndReadFile(file)
        
        }
    }

    // Handle URL input
    const onUrlInput = () => {
        const url = fileUrl.value
        fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const file = new File([blob], url.substring(url.lastIndexOf('/') + 1), {
            type: blob.type,
            })
            validateAndReadFile(file)
        })
        .catch(() => {
            alert('Failed to fetch file from URL')
        })
    }

    // Validate file type and read it
    const validateAndReadFile = (file) => {
        if (!allowedMimeTypes.includes(file.type)) {
        alert('Invalid file type. Please upload a valid CSV/TSV file.')
        return
        }
        
        // Further validate if it's an RDF file by trying to parse it
        const reader = new FileReader()
        reader.onload = (e) => {
        const content = e.target.result

        table = new Tabulator("#mytable", {
            // height:'50vh',
            layout:"fitColumns",
            importFormat:"csv",
            autoColumns: true
        });

        table.on("tableBuilt", function(){
            table.setData(content);
            showTable.value = true;
        });
        }
        reader.readAsText(file)
    }

    function saveData() {
        console.log(table.getColumnDefinitions())
        console.log(table.getData())
        console.log(toRaw(shape_obj))
        console.log(toRaw(shape_obj.properties))
        console.log(table.getColumnDefinitions().map(col => col.title))

        const dT = new DataTable(
            table,
            selectedShapeIRI.value,
            localNodeIdx.value,
            shapesDS,
            formData,
            toRaw(allPrefixes),
            ID_IRI.value
        )

        dT.saveTable(rdfDS, props.parent_shape_iri, props.parent_property_iri)
        closeDialog()
        // console.log(toRaw(formData.content))

        // shape_obj = shapesDS.data.nodeShapes[localShapeIri.value]
    };

    



</script>

<style scoped>
.drag-drop-area {
    padding: 20px;
    padding-bottom: 0;
    /* border: 1px solid rgb(201, 201, 201); */
    border: 1px solid transparent;
    transition: all 0.3s ease;
    margin: auto;
    margin-bottom:1em;
    min-width: 80vw;
}

.drag-drop-area.dragover {
    border: 2px dashed #3f51b5;
    background-color: #f0f0f0;
    filter: grayscale(50%);
}

.drag-drop-area .v-col {
    display: flex;
    align-items: center;
}
#mytable {
    margin: 1em 1em;
}
</style>

<style lang="scss">
@import  "/node_modules/tabulator-tables/dist/css/tabulator_site.min.css";
</style>
