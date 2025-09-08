---
layout: doc
---

# Core Concepts

`shacl-vue`'s functionality rests on several core concepts from its constituent technologies: SHACL, VueJS, N3.js, and `shacl-tulip`.

## SHACL

::: tip
For a thorough understanding of SHACL, please refer to https://www.w3.org/TR/shacl/
:::

The main concepts used from SHACL include the two types of shapes:

> - shapes about the focus node itself, called node shapes [`sh:NodeShape`]
> - shapes about the values of a particular property or path for the focus node, called property shapes [`sh:PropertyShape`]

In terms of user interfaces, a `NodeShape` would specify the schema for a complete form, while related `PropertyShape`s would specify the schemas for individual fields in a form. Knowing the details of these schemas, i.e. knowing how they validate graph data, allows us to generate appropriate UI components for capturing valid data.

The details of these concepts include:
- [targets](https://www.w3.org/TR/shacl/#targets) specified for a `NodeShape` or a `PropertyShape` which can indicate e.g. which class a set of data would have to be validated against
- [`nodeKind`](https://www.w3.org/TR/shacl/#NodeKindConstraintComponent), which specifies which kind of RDF node the field would constitute, such as `sh:IRI` or `sh:BlankNode`.
- [`datatype`](https://www.w3.org/TR/shacl/#DatatypeConstraintComponent), which specifies what data type a field should have, e.g. `string` or `datetime`

In addition to specifications that can be used to render to correct field for a `PropertyShape` and provide the associated validation rules, a SHACL shapes graph can also contain information to construct the layout of a form and make it more user-friendly. These are known as [non-validating property shape characteristics](https://www.w3.org/TR/shacl/#nonValidation):
- [`sh:name` and `sh:description`](https://www.w3.org/TR/shacl/#name) can be included to make a field more intuitive to a user
- [`sh:order`](https://www.w3.org/TR/shacl/#order) can be used to provide order to the fields of a form
- [`sh:group`](https://www.w3.org/TR/shacl/#group) specified on a `PropertyShape` can tell the form builder which `sh:PropertyGroup` a field belongs to in terms of a grouping of themes or subsections in a form

Together, all of these concepts can be put together into a shapes graph in order to provide a full specification of a form and its fields, readily interpretable by a tool such as `shacl-vue`, and ready to validate data on entry.


::: info
Currently, `shacl-vue` does not yet support the full SHACL specification, only the basics. A complete list of supported SHACL features will follow. See https://www.w3.org/TR/shacl/#core-components for a complete list of SHACL's constraint components.
:::

## VueJS

`shacl-vue` is implemented using VueJS 3, specifically the [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html).

The application makes extensive use of:

- [Vue Components](https://vuejs.org/guide/essentials/component-basics.html) to create standalone functional units that specify their own look and feel (`<template>`), their logic and state management code (`<script setup>`), additional JavaScript code (`<script>`), and any optional local styling (`<style scoped>`). These components are the main driver behind `shacl-vue`'s ability to render different forms and fields based on the specifications in a SHACL schema.
- [Lifecycle hooks](https://vuejs.org/guide/essentials/lifecycle) to run tasks during a component's life cycle, e.g. after creation or on mounting.
- [Provide / Inject](https://vuejs.org/guide/components/provide-inject.html) to share states between parent and child components
- [Composables](https://vuejs.org/guide/reusability/composables.html) to manage generalizable and reusable code across components.
- [Vuetify](https://vuetifyjs.com/en/) as a framework for existing UI components. Of note is the generic [`v-input`](https://vuetifyjs.com/en/components/inputs/#inputs) which acts as a wrapper for `shacl-vue` input components in order to standardize the API.

## N3.js

[N3.js](https://github.com/rdfjs/N3.js) is:

> - an implementation of the RDF.js low-level specification that lets you handle RDF in JavaScript easily
> - Lightning fast, spec-compatible, streaming RDF for JavaScript

`shacl-vue` mainly uses N3.js, via `shacl-tulip`, to:
- read RDF data into the application's graph store, which is managed as a VueJS-reactive [`rdf.dataset()`](https://rdf.js.org/dataset-spec/)
- add quads to the graphh store
- traverse a graph in order to find specific nodes

## `shacl-tulip`

In an effort to generalize `shacl-vue` for improved use by and interoperability with other applications, the underlying functionality was factored out and packaged as the [`shacl-tulip`](https://github.com/psychoinformatics-de/shacl-tulip) library (like "`shacl-vue`-lib", but flowery).

`shacl-tulip` provides the main (derived) classes for handling RDF data and related form data. It is completely independent of VueJS, yet class constructors allow passing reactive objects as arguments, which `shacl-tulip` handles seamlessly. It also focuses purely on library-level functionality (including utilities that were previously part of `shacl-vue`), and contains no frontend code. `shacl-vue` imports `shacl-tulip` classes and uses them mainly in its composable code.