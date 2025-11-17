<template>
    <v-card
        class="drag-drop-area"
        :class="{ dragover: isDragging }"
        @click="onCardClick"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onFileDrop"
        variant="outlined"
    >
        <!-- Hidden file input -->
        <input
            type="file"
            ref="fileInput"
            class="hidden"
            @change="onFileSelect"
        />
        <!-- Centered icon -->

        <span v-if="isUploading">
            <v-progress-circular indeterminate></v-progress-circular>
        </span>
        <span v-else>
            <v-icon size="28" color="#616161">mdi-paperclip</v-icon>
        </span>
    </v-card>
</template>

<script setup>
import { ref, inject, toRaw, onMounted} from 'vue'

const props = defineProps({
    config: Object,
});
import { useToken } from '@/composables/tokens';
const { token, setToken, clearToken } = useToken();
const tokenExists = ref(false)
const emit = defineEmits(['uploadComplete'])
const isDragging = ref(false)
const fileData = ref({})
const fileInput = ref(null)
const tokenWarning = inject('tokenWarning');
const baseUrl = props.config.base_url
const targetUuid = props.config.annex_uuid
const clientUuid = props.config.client_uuid

const isUploading = ref(false)
const uploadSuccess = ref(false)
const uploadFailure = ref(false)
const uploadFailureError = ref({})


onMounted(() => {
    if (token.value !== null && token.value !== 'null') {
        tokenExists.value = true;
    }
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

// Handle file selection from the file input
const onFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
        console.log(file)
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

const onCardClick = () => {
    if (beforeUploadCheck() === false) {
        // Do NOT open file dialog
        return;
    }
    fileInput.value.click()
}

function beforeUploadCheck() {
    if (token.value !== null && token.value !== 'null') {
        tokenExists.value = true;
    }
    if (!tokenExists.value) {
        // showTokenDialog.value = true;
        tokenWarning.value = true;
        return false;
    }
    return true;
}

// Validate file type and read it
const validateAndReadFile = async (file) => {
    let result
    try {
        const arrayBuffer = await file.arrayBuffer()
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
        // Convert hash buffer to hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        // get file extension
        const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : null
        // construct git annex key
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
            download: `${baseUrl}/${targetUuid}/key/${encodeURIComponent(gitAnnexKey)}`
        }
        isUploading.value = true
        result = await uploadFile()
        isUploading.value = false
        if (result.status == 'ok') {
            uploadSuccess.value = true;
            uploadFailure.value = false;
            console.log("Uploaded file can be downloaded at:")
            console.log(fileData.value.download)
        } else {
            uploadSuccess.value = false;
            uploadFailure.value = true;
            uploadFailureError.value = result;
        }
    } catch (error) {
        alert('Failed to process file: ' + error.message)
        result.status = 'error';
        result.error = error;
    }
    // Emit upload result to parent
    emit('uploadComplete', {
        status: result.status,
        error: result.error || null,
        fileData: toRaw(fileData.value),
    })
}

const uploadFile = async () => {

    // During development, change baseUrl in config to '/forgejo-api' to circumvent CORS issues;
    // it sends the request to the local proxy server instead of directly to the baseUrl
    const endpoint = `${baseUrl}/${targetUuid}/v4/put?key=${encodeURIComponent(fileData.value.key)}&clientuuid=${encodeURIComponent(clientUuid)}`
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'X-git-annex-data-length': fileData.value.size,
                'Authorization': 'Basic ' + btoa(`${token.value}:`)
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

<style scoped>
.drag-drop-area {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    aspect-ratio: 1 / 1;
    /* min-height: 48px; */
    cursor: pointer;
    border-color: #b4b4b4;
    transition: all 0.3s ease;
}

.drag-drop-area.dragover {
    border: dashed #3f51b5;
    background-color: #f0f0f0;
    filter: grayscale(50%);
}

.drag-drop-area:hover {
    border-color: black;
}

.hidden {
    display: none;
}
</style>
