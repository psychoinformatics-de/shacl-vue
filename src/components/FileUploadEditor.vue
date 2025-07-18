<template>
    <v-input
        v-model="internalValue"
        :rules="rules"
        ref="fieldRef"
        :id="inputId"
        hide-details="auto"
        style="margin-bottom: 1em"
    >
        <v-card
            class="drag-drop-area"
            :class="{'dragover': isDragging}"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onFileDrop"
            style="width: 100%;"
        >
            <v-file-input
                label="Drag&drop or select a file"
                v-model="selectedFile"
                @change="onFileSelect"
                hide-details="auto"
                density="compact"
                variant="outlined"
            >
            <template #append>
                <span v-if="selectedFile && !isUploading && uploadSuccess">
                    <v-tooltip location="left">
                        <template v-slot:activator="{ props }">
                            <v-icon v-bind="props">mdi-information-outline</v-icon>
                        </template>
                        <template v-slot:default>
                            <strong>Name</strong>: {{fileData.name}} <br>
                            <strong>Size</strong>: {{formatBytes(fileData.size)}} <br>
                            <strong>Annex key</strong>: {{fileData.key}} <br>
                            <strong>Download URL</strong>: <a :href="fileData.download"></a> {{fileData.download}} <br>
                        </template>
                    </v-tooltip>
                </span>
                <span v-if="selectedFile && !isUploading && uploadFailure">
                    <v-tooltip location="left">
                        <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="error">mdi-alert-circle-outline</v-icon>
                        </template>
                        <template v-slot:default>
                            <strong>Name</strong>: {{fileData.name}} <br>
                            <strong>Size</strong>: {{fileData.size}} Bytes  ({{formatBytes(fileData.size)}}) <br>
                            <strong>Annex key</strong>: {{fileData.key}} <br>
                            <strong>UPLOAD ERROR</strong>: {{uploadFailureError}}
                        </template>
                    </v-tooltip>
                </span>
                <span v-if="selectedFile && isUploading">
                    <v-progress-circular indeterminate></v-progress-circular>
                </span>
            </template>
            </v-file-input>
        </v-card>
        
    </v-input>
</template>

<script setup>
import { useRules } from '../composables/rules';
import { useRegisterRef } from '../composables/refregister';
import { useBaseInput } from '@/composables/base';
import { ref, inject } from 'vue'
import { useTokens } from '@/composables/tokens';

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
const { subValues, internalValue } = useBaseInput(
    props,
    emit,
    valueParser,
    valueCombiner
);
const isDragging = ref(false)
const selectedFile = ref(null)
const fileData = ref({})
const configVarsMain = inject('configVarsMain');
const allPrefixes = inject('allPrefixes');
const prefixUrl =  allPrefixes[configVarsMain.gitannexP2phttpConfig.id_prefix]
const { tokens, setToken, clearToken } = useTokens();
const tokenNameUsr = 'gitAnnexUserName'
const tokenNamePwd = 'gitAnnexPassword'
const baseUrl = configVarsMain.gitannexP2phttpConfig.base_url
const targetUuid = configVarsMain.gitannexP2phttpConfig.annex_uuid
const clientUuid = configVarsMain.gitannexP2phttpConfig.client_uuid
const username = tokens[tokenNameUsr]
const password = tokens[tokenNamePwd]
const isUploading = ref(false)
const uploadSuccess = ref(false)
const uploadFailure = ref(false)
const uploadFailureError = ref({})


function valueParser(value) {
    // Parsing internalValue into ref values for separate subcomponent(s)
    return {
        fileData: {
            pid: value,
        },
    };
}

function valueCombiner(values) {
    // Determine internalValue from subvalues/subcomponents
    return values.fileData.pid;
}

// Format file sizes
const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Handle file selection from the file input
const onFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
        validateAndReadFile(file)
    }
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

// Validate file type and read it
const validateAndReadFile = async (file) => {

    try {
        const arrayBuffer = await file.arrayBuffer()
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)

        // Convert hash buffer to hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : null

        const gitAnnexKey = `SHA256E-s${file.size}--${hashHex}${extension !== null ? '.'+extension : ''}`

        fileData.value = {
            file: file,
            name: file.name,
            size: file.size,
            type: file.type || 'Unknown',
            ext: extension,
            hash: hashHex,
            url: URL.createObjectURL(file),
            key: gitAnnexKey,
            pid: prefixUrl + gitAnnexKey,
            download: `${baseUrl}/${targetUuid}/key/${encodeURIComponent(gitAnnexKey)}`
        }
        subValues.fileData = fileData.value

        isUploading.value = true
        const result = await uploadFile()
        isUploading.value = false
        if (result.status == 'ok') {
            uploadSuccess.value = true;
            uploadFailure.value = false;
            console.log("Uploaded file can be downloaded at:")
            console.log(fileData.value.download)
        } else {
            uploadSuccess.value = false;
            uploadFailure.value = true;
            uploadFailureError.value = result.error;
        }


    } catch (error) {
        alert('Failed to process file: ' + error.message)
    }
}

const uploadFile = async () => {

    const endpoint = `${baseUrl}/${targetUuid}/v4/put?key=${encodeURIComponent(fileData.value.key)}&clientuuid=${encodeURIComponent(clientUuid)}`
    // Use the following line during development to circumvent CORS issues, it sends the request to the local proxy server insteda of directly to the baseurl
    // const endpoint = `/forgejo-api/${targetUuid}/v4/put?key=${encodeURIComponent(fileData.value.key)}&clientuuid=${encodeURIComponent(clientUuid)}`
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'X-git-annex-data-length': fileData.value.size,
                'Authorization': 'Basic ' + btoa(`${username.value}:${password.value}`)
            },
            body: fileData.value.file
        })
        if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`)
        }
        const result = await response.text()
        console.log('Upload successful:', result)
        return {
            status: 'ok'
        }
    } catch (error) {
        console.error('Upload error:', error)
        return {
            status: 'error',
            'error': error,
        }
    }
}
</script>



<script>
import { SHACL, INM7FD } from '../modules/namespaces';
export const matchingLogic = (shape) => {
    // sh:class exists
    if (shape.hasOwnProperty(SHACL.class.value)) {
        // sh:class == inm7fd:Attachment
        return shape[SHACL.class.value] == INM7FD.Attachment.value
    }
    return false;
};
</script>

<style scoped>
.drag-drop-area {
    padding: 5px;
    border: 2px solid transparent;
    transition: all 0.3s ease;
}

.drag-drop-area.dragover {
    border: 2px dashed #3f51b5;
    background-color: #f0f0f0;
    filter: grayscale(50%);
}
</style>
