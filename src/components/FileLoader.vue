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
              label="Upload RDF file"
              v-model="selectedFile"
              :rules="[rules.required, rules.validRdfFile]"
              prepend-icon="mdi-upload"
              accept=".jsonld,.rdf,.ttl,.nt,.trig,.xml"
              @change="onFileSelect"
            ></v-file-input>
          </v-col>
  
          <!-- URL input on the right -->
          <v-col cols="6">
            <v-text-field
              label="Or paste RDF file URL"
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
    </v-container>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  
  // Allowed RDF file MIME types
  const allowedMimeTypes = [
    'application/ld+json',    // JSON-LD
    'application/rdf+xml',    // RDF/XML
    'text/turtle',            // Turtle
    'application/n-triples',  // N-Triples
    'application/trig',       // TriG
  ]
  
  const selectedFile = ref(null)
  const fileUrl = ref('')
  const isDragging = ref(false)
  const fileData = ref(null)
  
  // Check if the file is an image (for preview purposes)
  const isImage = computed(() => {
    return fileData.value && fileData.value.type.startsWith('image/')
  })
  
  const rules = {
    required: value => !!value || 'File is required',
    validRdfFile: value => {
      if (value && value.type && allowedMimeTypes.includes(value.type)) {
        return true
      }
      return 'Invalid file type. Please upload a valid RDF file.'
    }
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
  const validateAndReadFile = (file) => {
    if (!allowedMimeTypes.includes(file.type)) {
      alert('Invalid file type. Please upload a valid RDF file.')
      return
    }
    
    // Further validate if it's an RDF file by trying to parse it
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target.result
      try {
        // If the file is valid, process and store it
        fileData.value = {
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
        }
      } catch (error) {
        alert('The file content is not a valid RDF serialization.')
      }
    }
    reader.readAsText(file)
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
  