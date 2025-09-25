---
layout: doc
---

# Get started

## What is `shacl-vue`?

::: warning
ALL CONTENT HERE AND IN THE SOURCE CODE REPOSITORY IS UNDER CONTINUOUS DEVELOPMENT AND MAY CHANGE AT ANY TIME.
:::

`shacl-vue` is a browser-based JavaScript application that uses the [Shapes Constraint Language](https://www.w3.org/TR/shacl/) (SHACL) to generate user interfaces for entering, editing, and viewing data.

Think of it as an automatic builder that you just have to feed with a model of your data. If you have a SHACL schema, or a schema in a format that can be exported to SHACL, then you're good to go. No need to build custom forms for data entry, no need to struggle with post-entry data validation, no need to create a catalog application that renders all the entered data. `shacl-vue` does all of this automatically.

`shacl-vue` is built with [VueJS 3](https://vuejs.org/), [Vuetify](https://vuetifyjs.com), and [Vite](https://vitejs.dev/), and was heavily inspired by the WC3 Draft: [Form Generation using SHACL and DASH](https://datashapes.org/forms.html).

:rocket: Try out a live demo at https://psychoinformatics-de.github.io/shacl-vue/app



## Installation

`shacl-vue` can be installed from `npm` or from sources.

It is usually a good idea to start with a virtual environment. You can for example create a `NodeJS` environment with [micromamba](https://mamba.readthedocs.io/en/latest/installation/micromamba-installation.html#):

```
micromamba create -n <my-env-name> nodejs
micromamba activate <my-env-name>
```

Then install `shacl-vue`:

```
npm install shacl-vue
```

For the latest development version, first clone the repo locally and then install `shacl-vue`:

```
git clone https://github.com/psychoinformatics-de/shacl-vue.git
cd shacl-vue
npm install .
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

To roll your own instance while using the existing set of editor components that are used for the demo instance, together with the demo data, just install and run the application locally as explained above.

To work with a completely different set of shapes, classes and data, you can use the application config to customize your instance. This involves updating the config file that is located at `shacl-vue/public/config.json`. Details are provided in the [App configuration section](./app-configuration). After editing the config file, while running a local development server, just refresh your browser page and the customizations should be available.

Once you are happy with your locally tested site, you can deploy it to your own infrastructure. Read the [Application deployment and dependencies section](./app-deployment) for more details.
