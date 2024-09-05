# shacl-vue

***ALL CONTENT HERE IS UNRELEASED AND MAY CHANGE ANY TIME***

This repo constitutes an effort to create a web-based user interface for entering, editing, and viewing linked (meta)data using a [VueJS](https://vuejs.org/) application driven by [shacl](https://www.w3.org/TR/shacl/) shapes.

### Current setup

This is a [VueJS 3](https://vuejs.org/) application, using [Vuetify frontend components](https://vuetifyjs.com/en/), created using [Vite](https://vitejs.dev/) tooling.

For reading, manipulating, and writing RDF data (including shacl), the package uses libraries compatible with the [RDF/JS](https://rdf.js.org/) specifications (see also: https://github.com/rdfjs-base)

Planned additions:
- No continuous integration tests are implemented yet; these will likely be done with [Vitest](https://vitest.dev/) (because of its native integration with Vite)


### Installation

This package is not yet available via any package manager, and will need to be installed from sources.

First clone the repo locally:
```
git clone https://github.com/psychoinformatics-de/shacl-vue.git
cd shacl-vue
```

Then create a local `NodeJS` virtual environment with miniconda:

```
conda create -yn <my-env-name> nodejs
conda activate <my-env-name>
```

Then install the application:

```
npm install
```


### Local rendering

To serve the application locally in order to test it in the browser, run:

```
npm run dev
```

The application currently does the following:
- reads the turtle file at `src/assets/ddist-shacl.ttl`, which contains shacl shapes
- converts the rdf data (quads) to a list of shapes in the form of JS objects
- renders the list of objects
- allows selection of a shape in order to render its properties