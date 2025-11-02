<template>
    <v-container>
        <!-- Drag and Drop area -->
        <v-card
            class="drag-drop-area"
            :class="{'dragover': isDragging}"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onFileDrop"
        >
            <v-row>
                <!-- File input on the left -->
                <v-col cols="6">
                    <v-file-input
                        label="Upload file"
                        v-model="selectedFile"
                        prepend-icon="mdi-upload"
                        @change="onFileSelect"
                    ></v-file-input>
                </v-col>
                <!-- URL input on the right -->
                <v-col cols="6">
                    <v-text-field
                        label="Or pastefile URL"
                        v-model="fileUrl"
                        prepend-icon="mdi-link"
                        @change="onUrlInput"
                    ></v-text-field>
                </v-col>
            </v-row>
        </v-card>

    <!-- Uploaded file details or preview -->
    <v-card v-if="fileData" class="mt-5">
        <v-btn @click="uploadFile()">Upload to forgejo</v-btn>
        <v-card-title>File details:</v-card-title>
        <v-card-text>
            <p><strong>Name:</strong> {{ fileData.name }}</p>
            <p><strong>Size:</strong> {{ formatBytes(fileData.size) }}</p>
            <p><strong>Type:</strong> {{ fileData.type }}</p>
            <p><strong>Extension:</strong> {{ fileData.ext }}</p>
            <p><strong>URL:</strong> {{ fileData.url }}</p>
            <p><strong>SHA-256:</strong> {{ fileData.hash }}</p>
            <p><strong>Annex key:</strong> {{ fileData.key }}</p>
        </v-card-text>
    </v-card>
    </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'

const selectedFile = ref(null)
const fileUrl = ref('')
const isDragging = ref(false)
const fileData = ref(null)



// curl \
//   --data-binary @file-to-upload.txt \
//   -H 'Content-Type: application/octet-stream' \
//   -H 'X-git-annex-data-length: <filesize>' 
//   -u user:password \
//   '<baseurl>/<target-uuid>/v4/put?key=<annex-key>&clientuuid=<client-uuid>'


// SHA256E-s31390--f50d7ac4c6b9031379986bc362fcefb65f1e52621ce1708d537e740fefc59cc0.mp3

// Check if the file is an image
const isImage = computed(() => {
    return fileData.value && fileData.value.type.startsWith('image/')
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

// Handle URL input for an RDF file
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
            key: gitAnnexKey
        }
    } catch (error) {
        alert('Failed to process file: ' + error.message)
    }
}



// curl -v --data-binary @stephans_brain.nii -H 'Content-Type: application/octet-stream' -H 'X-git-annex-data-length: 20736832' -u jsheunis:3d91656eba1991815f55823f22c01e84ece2091c 'https://hub.psychoinformatics.de/git-annex-p2phttp/git-annex/5a53c0b0-e73b-47ac-b0f4-9c441b70c04a/v4/put?key=SHA256E-s20736832--625d18090168478a2d54df3d62a2e6590e78e4bb6b33259972ceabced1c59cc9.nii&clientuuid=shacl-vue'
// curl  'https://hub.psychoinformatics.de/git-annex-p2phttp/git-annex/5a53c0b0-e73b-47ac-b0f4-9c441b70c04a/key/SHA256E-s20736832--625d18090168478a2d54df3d62a2e6590e78e4bb6b33259972ceabced1c59cc9.nii' --output myfile.nii

const uploadFile = async () => {

    // const annexUUID = 'fbce4951-7c6d-41df-a679-480bde3f8fcc'
    // const annexUUID = '0dfba023-e931-4522-8153-2d0e4fefece2'
    const annexUUID = '5a53c0b0-e73b-47ac-b0f4-9c441b70c04a'
    const clientUUID = 'shacl-vue'
    const baseUrl = 'https://hub.psychoinformatics.de/git-annex-p2phttp/git-annex'
    // const baseUrl = 'http://localhost:9417/git-annex'
    const targetUuid = annexUUID
    const clientUuid = clientUUID
    const username = 'jsheunis'
    const password = '3d91656eba1991815f55823f22c01e84ece2091c'

    const endpoint = `${baseUrl}/${targetUuid}/v4/put?key=${encodeURIComponent(fileData.value.key)}&clientuuid=${encodeURIComponent(clientUuid)}`

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'X-git-annex-data-length': fileData.value.size,
                'Authorization': 'Basic ' + btoa(`${username}:${password}`)
            },
            body: fileData.value.file
        })

        if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`)
        }

        const result = await response.text()
        console.log('Upload successful:', result)
        alert('Upload completed successfully.')
    } catch (error) {
        console.error('Upload error:', error)
        alert('Upload failed: ' + error.message)
    }
}

</script>

<style scoped>
.drag-drop-area {
    padding: 20px;
    border: 2px solid transparent;
    transition: all 0.3s ease;
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
</style>
