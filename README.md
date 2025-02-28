# shacl-vue

***THIS REPOSITORY IS UNDER CONTINOUS DEVELOPMENT***


## Overview

`shacl-vue` is an effort to create a web-based user interface for entering, editing, and viewing linked (meta)data using a [VueJS](https://vuejs.org/) application driven by the [Shapes Constraint Language (SHACL)](https://www.w3.org/TR/shacl/).

Think of it as an automatic builder that you just have to feed with a model of your data. If you have a SHACL schema, or a schema in a format that can be exported to SHACL, then you're good to go. No need to build custom forms for data entry, no need to struggle with post-entry data validation, no need to create a catalog application that renders all the entered data. `shacl-vue` does all of this automatically.

`shacl-vue` is built with [VueJS 3](https://vuejs.org/), [Vuetify frontend components](https://vuetifyjs.com/en/), and [Vite build tools](https://vitejs.dev/), and was heavily inspired by the WC3 Draft: [Form Generation using SHACL and DASH](https://datashapes.org/forms.html). For reading, manipulating, and writing RDF data (including shacl), the package uses libraries compatible with the [RDF/JS](https://rdf.js.org/) specifications (see also: https://github.com/rdfjs-base)


## Links

- For an example of a deployed `shacl-vue` instance, see the [metadata annotation tool](https://annotate.trr379.de/s/demo/) of the [TRR379 Research Consortium](https://www.trr379.de/)
- Refer to the (possibly outdated) [documenation](https://psychoinformatics-de.github.io/shacl-vue/docs/) for more information.

## Installation and usage

`shacl-vue` can be installed from [npm](https://www.npmjs.com/package/shacl-vue):

```
npm install shacl-vue
```

### Use as a library

The `npm` package currently provides the named exports `ShaclVue` and `shapedata`:

#### `ShaclVue`

```
import { ShaclVue } from 'shacl-vue'
```

This is the main configurable VueJS component that is used to render all functionality of `shacl-vue`. It can be instantiated inside a VueJS application as follows:

```vue
<template>
    <ShaclVue :configUrl="myconfig"></ShaclVue>
</template>
<script setup>
    const myconfig = 'config.json'
</script>
```

Here, `config.json` is used to configure the properties of the specific `shacl-vue` deployment. See examples [here](https://github.com/psychoinformatics-de/shacl-vue/blob/main/public/config.json), and [here](https://hub.datalad.org/datalink/annotate-trr379-demo/src/branch/main/config.json).

For the above to work, the VueJS application will have to install `Vuetify` and the `ShaclVue` might need to be [registered explicitly](https://vuejs.org/guide/components/registration).

#### `shapedata`

```
import { shapedata } from 'shacl-vue'
```

This utility provides functionality for reading and transforming SHACL shapes from a source schema. The following provides example usage in JavaScript:

```javascript
import { useShapeData } from 'shacl-vue';
const config = {}
config.value = {}
config.value.shapes_url = "my_shacl_schema.ttl" // this could be a "local" or remote URL that the server allows to be fetched
const {
    getSHACLschema,
    shapesDataset,
    nodeShapes,
    propertyGroups,
    nodeShapeNamesArray,
    shapePrefixes,
    prefixArray,
    prefixes_ready,
    nodeShapeIRIs,
    nodeShapeNames,
    serializedData,
    page_ready
} = useShapeData(config)
await getSHACLschema()
```

In this example, a minimal configuration variable is used, although the variable could also be loaded from the same `config.json` that is used as the input prop for the `ShaclVue` component above. Here, `getSHACLschema()` will populate most of the `useShapeData`-returned variables. For more information about how each returned variable is produced, see the [source code](https://github.com/psychoinformatics-de/shacl-vue/blob/main/src/composables/shapedata.js).

### Use as a standalone site

The build steps of `shacl-vue` produce both the library as well as a set of static files that can be served as a standalone site. The abovementioned metadata annotation tool of the TRR379 Research Consortium deploys `shacl-vue` in this manner, and its source code can be viewed [here](https://hub.datalad.org/datalink/annotate-trr379-demo).

To use `shacl-vue` to deploy a standalone site, follow the build steps below. In addition, a deployment-specific confi file should be provided.

## Local development and building

The `shacl-vue` source code can be cloned for local development, testing, or building. First clone the repository:

```
git clone https://github.com/psychoinformatics-de/shacl-vue.git
cd shacl-vue
```

Then create a local `NodeJS` virtual environment, e.g with [micromamba](https://mamba.readthedocs.io/en/latest/user_guide/micromamba.html):

```
micromamba create -n <my-env-name> nodejs
micromamba activate <my-env-name>
```

Then install the application:

```
npm install .
```

### Local rendering during development

To serve the application locally in order to test it in the browser, run:

```
npm run dev
```

### Build steps

To build the library (output at `/dist/lib`):

```
npm run build:lib
```

To build the standalone site, i.e. VueJS application (output at `/dist/app`):

```
npm run build:app
```

To build both the library and the standalone site:

```
npm run build
```

### Testing

Testing remains a primary TODO for this package, although a minimal test is in place to check whether the named exports can be imported into a new project. Testing is done with [Vitest](https://vitest.dev/).

```
npm run test
```