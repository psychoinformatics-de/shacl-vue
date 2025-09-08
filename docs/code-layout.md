---
layout: doc
---

# Code Layout

For developers/contributors, the noteworthy parts of this code repository are shown below:

```
.
├── docs
├── public
├── src
│   ├── assets
│   ├── components
│   ├── composables
│   ├── modules
│   └── plugins
└── tools
```

- **docs**: this directory contains the sources for these documentation pages
- **public**: this directory should contain any assets that are to be located in the root of the served address of the built application
- **src**: this is the source code of the `shacl-vue` application
   - *assets* contain styles, images, fonts, and currently also the default shapes graph (`dlschemas_shacl.ttl`), data graph (`dlschemas_data.ttl`), and class hierarchy information (`dlschemas_owl.ttl`) that are all loaded into the application on startup.
   - *components* contain all VueJS components used by the application. These include all internal components that support the application's built-in functionality, as well as all custom editors that together constitute the application's library of matchable components for form fields.
   - *composables* contain modules with general functionality that can be used across components, specifically:
      - `base.js` for common functionality of any custom input component, which all new input components should import
      - `configuration.js` for interpreting configuration options and setting defaults
      - `refregister.js` which provides a means to track references to a parent component's children when validating a form
      - `rules.js` for common functionality used in input field validation
      - `tokens.js` for handling token entry related to external service integration
      - `useClasses.js` for managing class hierarchy information
      - `useData.js` for managing RDF data that have been taken from forms and saved into a graph store
      - `useForm.js` for managing data entered into form fields
      - `useShapes.js` for managing the source shapes graph
   - *modules* and *plugins* have further modules with helper functionality or functionality that extends the application
- **tools**: this directory contains scripts and data that are used to generate supporting inputs for the `shacl-vue` application
