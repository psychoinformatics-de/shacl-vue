---
layout: doc
---

# Get started

## What is `shacl-vue`?

::: warning
ALL CONTENT HERE AND IN THE SOURCE CODE REPOSITORY IS UNDER CONTINUOUS DEVELOPMENT, IS CONSIDERED UNRELEASED, AND MAY CHANGE AT ANY TIME.
:::

`shacl-vue` is a browser-based JavaScript application that uses the [Shapes Constraint Language](https://www.w3.org/TR/shacl/) (SHACL) to generate user interfaces for entering, editing, and viewing data.

Think of it as an automatic builder that you just have to feed with a model of your data. If you have a SHACL schema, or a schema in a format that can be exported to SHACL, then you're good to go. No need to build custom forms for data entry, no need to struggle with post-entry data validation, no need to create a catalog application that renders all the entered data. `shacl-vue` does all of this automatically.

`shacl-vue` is built with [VueJS 3](https://vuejs.org/), [Vuetify](https://vuetifyjs.com), and [Vite](https://vitejs.dev/), and was heavily inspired by the WC3 Draft: [Form Generation using SHACL and DASH](https://datashapes.org/forms.html).

:rocket: Try out a live demo at https://psychoinformatics-de.github.io/shacl-vue/



## Installation

`shacl-vue` is not yet available via any package manager, and will need to be installed from sources.

First clone the repo locally:
```
git clone https://github.com/psychoinformatics-de/shacl-vue.git
cd shacl-vue
```

Then create a local `NodeJS` virtual environment, for example with [miniconda](https://docs.anaconda.com/miniconda/):

```
conda create -yn <my-env-name> nodejs
conda activate <my-env-name>
```

Then install the application:

```
npm install
```

### Local rendering

To serve the application locally in order to test it in the browser while developing, run:

```
npm run dev
```

To serve the documentation locally, run:

```
npm run docs:dev
```

## Roll your own

`shacl-vue` needs a set of inputs to function as intended. These are explained in the [App inputs section](./app-inputs).

To roll your own instance while using the existing set of editor components that are used for the demo instance, just replace the content of the input files in-place, or update the code that fetches these resources to point to a different URL.

::: info 
TODO: this procedure for creating your own instance of `shacl-vue` is cumbersome and is currently being revamped. In future necessary inputs will likely be specified via some app-level configuration that is then encapsulated during the build process, or read by the application itself in real-time.
:::