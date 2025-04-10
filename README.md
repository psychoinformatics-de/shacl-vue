# shacl-vue

***THIS REPOSITORY IS UNDER CONTINUOUS DEVELOPMENT***


## Overview

`shacl-vue` is an effort to create a web-based user interface for entering, editing, and viewing linked (meta)data using a [VueJS](https://vuejs.org/) application driven by the [Shapes Constraint Language (SHACL)](https://www.w3.org/TR/shacl/).

Think of it as an automatic builder that you just have to feed with a model of your data. If you have a SHACL schema, or a schema in a format that can be exported to SHACL, then you're good to go. No need to build custom forms for data entry, no need to struggle with post-entry data validation, no need to create a catalog application that renders all the entered data. `shacl-vue` does all of this automatically.

`shacl-vue` is built with [VueJS 3](https://vuejs.org/), [Vuetify frontend components](https://vuetifyjs.com/en/), and [Vite build tools](https://vitejs.dev/), and was heavily inspired by the WC3 Draft: [Form Generation using SHACL and DASH](https://datashapes.org/forms.html). For reading, manipulating, and writing RDF data (including shacl), the package uses libraries compatible with the [RDF/JS](https://rdf.js.org/) specifications (see also: https://github.com/rdfjs-base)


## Links

- For an example of a deployed `shacl-vue` instance, see the [metadata annotation tool](https://annotate.trr379.de/s/demo/) of the [TRR379 Research Consortium](https://www.trr379.de/)
- Refer to the (possibly outdated) [documentation](https://psychoinformatics-de.github.io/shacl-vue/docs/) for more information.

## Installation and usage

`shacl-vue` can be installed from [npm](https://www.npmjs.com/package/shacl-vue):

```
npm install shacl-vue
```

### Use as a library

The `npm` package currently provides the named export `ShaclVue`:

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

Here, `config.json` is used to configure the properties of the specific `shacl-vue` deployment. See examples [here](https://github.com/psychoinformatics-de/shacl-vue/blob/main/public/config.json), and [here](https://hub.trr379.de/q04/annotate.trr379.de-demo/src/branch/main/dist/config.json).

For the above to work, the VueJS application will have to install `Vuetify` and the `ShaclVue` might need to be [registered explicitly](https://vuejs.org/guide/components/registration).

### Use as a standalone site

The build steps of `shacl-vue` produce both the library as well as a set of static files that can be served as a standalone site. The abovementioned metadata annotation tool of the TRR379 Research Consortium deploys `shacl-vue` in this manner, and its source code can be viewed [here](https://hub.trr379.de/q04/annotate.trr379.de-demo).

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

## Dependency on `shacl-tulip`

In an effort to generalize `shacl-vue` for improved use by and interoperability with other applications, the underlying functionality was factored out and packaged as the [`shacl-tulip`](https://github.com/psychoinformatics-de/shacl-tulip) library (like "`shacl-vue`-lib"). `shacl-tulip` provides the main (derived) classes for handling RDF data and related form data. It is completely independent of VueJS, yet class constructors allow passing reactive objects as arguments, which `shacl-tulip` handles seamlessly. It also focuses purely on library-level functionality (including utilities that were previously part of `shacl-vue`), and contains no frontend code. `shacl-vue` imports `shacl-tulip` classes and uses them mainly in its composable code.