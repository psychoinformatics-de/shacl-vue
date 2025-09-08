---
layout: doc
---

# Application inputs

## Required/recommended inputs

`shacl-vue` needs 4 inputs to function as expected:

1. A SHACL shapes graph with annotated `NodeShape`s and `PropertyShape`s (required)
2. An OWL file with the class hierarchy of the classes mentioned in the shapes graph, detailing subclass relationships (required)
3. A data graph with existing RDF data that could be used or linked in the generated forms (recommended)
4. A set of matchable editor components that will be self-selected and rendered in a form, based on the SHACL shapes (required, with existing defaults)

The current application sources already contain:
- a sample [SHACL shapes graph](https://github.com/psychoinformatics-de/shacl-vue/blob/main/public/dlschemas_shacl.ttl),
- a sample [class hierarchy](https://github.com/psychoinformatics-de/shacl-vue/blob/main/public/dlschemas_owl.ttl),
- a sample [data graph](https://github.com/psychoinformatics-de/shacl-vue/blob/main/public/dlschemas_data.ttl)
- a [set of matchable components](https://github.com/psychoinformatics-de/shacl-vue/tree/main/src/components).

These all underlie the demo `shacl-vue` instance. However, these can all be replaced or amended in order to customize your application instance.

## Preparing the shapes graph with LinkML

A SHACL shapes graph (with its `NodeShape`s, `PropertyShape`s, and UI annotations) is the core driver of a `shacl-vue` application. These shapes can be edited directly as SHACL, for example using [TTL syntax](https://www.w3.org/TR/turtle/) and provided as a text file e.g. `myshapesgraph.ttl`.


### Schema authoring

Considering SHACLs interoperability with the wider world of linked data standards, however, it could be likely that your schema is rather edited in a different modeling language and then exported to SHACL. One such example, [LinkML](https://linkml.io/), has been used extensively as the source for SHACL schemas for `shacl-vue`. LinkML schemas can be authored in YAML and exported to a variety of RDF formats, including SHACL. For some example schemas, have a look at [DataLad Concepts](https://concepts.datalad.org/), for example the [FLAT Study Schema](https://concepts.datalad.org/s/flat-study/unreleased/).

### Adding UI annotations

LinkML generates a SHACL shapes graph from a LinkML schema using its [SHACL generator](https://linkml.io/linkml/generators/shacl.html). By default, the shapes only contain a minimum set of constraints based on the generator's slim translation of LinkML classes, slots, etc, into SHACL shapes and associated constraints. UI annotations can be added in order to let `shacl-vue` generate a form that is intuitive and user-friendly. Below is an example of how a new schema can be set up to firstly inherit from an existing schema, and secondly add UI-specific annotations:

```yaml
classes:

  ScientificDataDistribution:
    class_uri: dlsddui:ScientificDataDistribution
    is_a: Distribution
    slot_usage:
      name:
        title: Name
        annotations:
          sh:order: 0
      title:
        title: Title
        annotations:
          sh:order: 1
      description:
        title: Description
        annotations:
          sh:order: 2
          dash:singleLine: false
```

Take note that:
- A new class `ScientificDataDistribution` is created and it inherits from the actual class for which we want to generate SHACL (`is_a: Distribution`).
- Each slot that we want to annotate gets:
   - a `title` field, which serves as the user-friendly name for the field in a generated form, and in the absence of which the SHACL generator will use the slot name
   - an `annotations` field, here with `sh:order` determining in which order the property is displayed, and `dash:singleLine: false` indicating that the form field should be rendered as a multi-line text field.
- While field `description`s are not included in this example since they already exist on the slots of the base class (`Distribution`), they are absolutely encouraged to provide even more useful information to a user

Other annotations are of course possible, and would be listed under the `annotations` field, but currently those highlighted in this example are the essential ones that allow `shacl-vue` to render user-friendly forms.


### Exporting SHACL

Now that we have an annotated LinkML schema, we can generate the SHACL graph that feeds the `shacl-vue` application. This can be done with LinkML's `gen-shacl`:

```
gen-shacl --include-annotations <path/to/linkml/schema>
```

The output can be saved to a TTL file and put in the `public` directory, and then pointed to from the application config file.


## Creating the class hierarchy

As with the schema and SHACL generation above, LinkML can be used to generate the required class hierarchy information. Here, LinkML's OWL generator is used as follows:

```
gen-owl -f owl --mergeimports <path/to/linkml/schema>
```

Again, the output can be saved to a TTL file and put in the `public` directory, and then pointed to from the application config file.

## Preparing the data graph

When users complete forms, they often do so for data that exists in a wider context. Imagine a consortium of research groups, all collaborating on projects that belong to a specific, coherent theme. It is conceivable that participating researchers would collect data together, write academic papers together, share funding from the same sources, and more. If they then complete forms in order to describe their collected data, they might want to reference the same authors, the same funding sources, etc. No use in entering the same data twice. For this reason, it is useful to make existing data using existing namespaces available to the `shacl-vue` instance. This can be done by providing a file with RDF data, such as the demo example at: https://github.com/psychoinformatics-de/shacl-vue/blob/main/public/dlschemas_data.ttl.

## Adding custom components

While `shacl-vue` ships with a set of default editor components that cover most standard use cases of form entry, developers are free to add their own custom components.

The way to achieve this is explained fully in the [Editor Component section](./editor-component)