---
layout: doc
---

# Application inputs

## Required inputs

`shacl-vue` needs 4 inputs to function as expected:

1. A SHACL shapes graph, ideally annotated with the details highlighted in the [Core concepts section](./core-concepts#shacl)
2. A class hierarchy of the classes mentioned in the shapes graph, detailing subclass relationships.
3. A data graph with existing RDF data that could be used or linked in the generated forms.
4. A set of matchable editor components that will be self-selected and rendered in a form, based on the SHACL shapes.

The current application sources already contain a sample [SHACL shapes graph](https://github.com/psychoinformatics-de/shacl-vue/blob/main/src/assets/shapesgraph.ttl), a [class hierarchy](https://github.com/psychoinformatics-de/shacl-vue/blob/main/src/assets/class_hierarchy.ttl), a [data graph](https://github.com/psychoinformatics-de/shacl-vue/blob/main/src/assets/distribution-penguins-mini.ttl), and a [set of matchable components](https://github.com/psychoinformatics-de/shacl-vue/tree/main/src/components). These all underlie the demo `shacl-vue` instance.

However, these can all be replaced or amended in order to customize your application instance.

## Preparing the shapes graph

A SHACL shapes graph (with its `NodeShape`s, `PropertyShape`s, and UI annotations) is the core driver of a `shacl-vue` application. These shapes can be edited directly as SHACL, for example using [TTL syntax](https://www.w3.org/TR/turtle/) and provided as a text file `myshapesgraph.ttl`.

### Schema authoring

Considering SHACLs interoperability with the wider world of linked data standards, however, it could be likely that your schema is rather edited in a different modeling language and then exported to SHACL. One such example, [LinkML](https://linkml.io/), has been used extensively as the source for SHACL schemas for `shacl-vue`. LinkML schemas can be authored in YAML and exported to a variety of RDF formats, including SHACL. For some example schemas, have a look at [DataLad Concepts](https://concepts.datalad.org/), in particular the [Scientific Data Distribution](https://concepts.datalad.org/s/sdd/unreleased/) schema, which is the source for the SHACL shapes graph used in the `shacl-vue` demo instance.

### Adding UI annotations

LinkML generates a SHACL shapes graph from a LinkML schema using its [SHACL generator](https://linkml.io/linkml/generators/shacl.html). By default, the shapes only contain a minimum set of constraints based on the generator's slim translation of LinkML classes, slots, etc, into SHACL shapes and associated constraints. UI annotations, specifically the ones highlighted in the [Core concepts section](./core-concepts#shacl), need to be added in order to let `shacl-vue` generate a form that is intuitive and user-friendly. Below is an example of how a new schema can be set up to firstly inherit from an existing schema, and secondly add UI-specific annotations:

```yaml
classes:

  ScientificDataDistribution:
    class_uri: dlsddui:ScientificDataDistribution
    is_a: Distribution
    slot_usage:
      name:
        title: Name
        annotations:
          sh:group: dlsddui:BasicPropertyGroup
          sh:order: 0
      title:
        title: Title
        annotations:
          sh:group: dlsddui:BasicPropertyGroup
          sh:order: 1
      description:
        title: Description
        annotations:
          sh:group: dlsddui:BasicPropertyGroup
          sh:order: 2
```

Take note that:
- A new class `ScientificDataDistribution` is created and it inherits from the actual class for which we want to generate SHACL (`is_a: Distribution`).
- Each slot that we want to annotate gets:
   - a `title` field, which serves as the user-friendly name for the field in a generated form, and in the absence of which the SHACL generator will use the slot name
   - an `annotations` field, with `sh:group` and `sh:order` which determine in which thematic group a field is displayed in the form, and in which order
- While field `description`s are not included in this example since they already exist on the slots of the base class (`Distribution`), they are absolutely encouraged to provide even more useful information to a user

Other annotations are of course possible, and would be listed under the `annotations` field, but currently those highlighted in this example are the essential ones that allow `shacl-vue` to render user-friendly forms.

### Creating `PropertyGroup`s

While specific class slots being annotated with an `sh:group` constitutes one part of intuitive grouping of form fields, the other necessary part is actually defining these groups. For this, an additional graph is necessary. Here is an example of a single `PropertyGroup` specification:

```rdf
dlsddui:BasicPropertyGroup a sh:PropertyGroup ;
	rdfs:label "Basic" ;
	sh:order "0"^^xsd:decimal ;
    rdfs:comment "Basic properties of the dataset distribution" .
```

Again, for ease of authoring, this can also be written in YAML and then converted to SHACL. Here is the same example in YAML:

```yaml
property_groups:
  - id: dlsddui:BasicPropertyGroup 
    label: Basic
    order: 0
    description: >-
      Basic properties of the dataset distribution
```

This is data that can be validated against a LinkML schema and converted to the RDF shown above. Such a schema was developed for this exact purpose, and is available at [shacl-vue/tools/property_group_schema.yaml](https://github.com/psychoinformatics-de/shacl-vue/blob/main/tools/property_group_schema.yaml).


### Exporting SHACL

Now that we have an annotated LinkML schema as well as associated property groups, we can generate the SHACL graph that feeds the `shacl-vue` application. A Python script was developed to simplify this process. It is available at [shacl-vue/tools/gen_shacl_ui.py](https://github.com/psychoinformatics-de/shacl-vue/blob/main/tools/gen_shacl_ui.py) and can be used as follows via the command line:

```
cd shacl-vue
python tools/gen_shacl_ui.py <path/to/linkml/schema> <path/to/property/groups/data>
```

As an example, for `shacl-vue`'s demo instance the SHACL shapes graph at [shacl-vue/src/assets/shapesgraph.ttl](https://github.com/psychoinformatics-de/shacl-vue/blob/main/src/assets/shapesgraph.ttl) was generated with the following inputs:
- schema: https://github.com/jsheunis/datalad-concepts/blob/annotations-etc/src/sddui/unreleased.yaml
- property groups: https://github.com/psychoinformatics-de/shacl-vue/blob/main/src/assets/sddui-shacl-groups.yaml


## Creating the class hierarchy

As with the schema and SHACL generation above, LinkML and helper scripts can be used to generate the required `shacl-vue` input. Here, LinkML's OWL generator is used, and the output is then filtered to only include all triples in the graph where the predicate equals `rdfs:subClassOf`. This is linked-data speak for saying: lets only extract all information about which class is a subclass of which other class, which allows us to put together a hierarchy of classes.

A Python script for this process is available at [shacl-vue/tools/gen_owl_minimal.py](https://github.com/psychoinformatics-de/shacl-vue/blob/main/tools/gen_owl_minimal.py) and can be used as follows via the command line:

```
cd shacl-vue
python tools/gen_owl_minimal.py <path/to/linkml/schema>
```


## Preparing the data graph

When users complete forms, they often do so for data that exists in a wider context. Imagine a consortium of research groups, all collaborating on projects that belong to a specific, coherent theme. It is conceivable that participating researchers would collect data together, write academic papers together, share funding from the same sources, and more. If they then complete forms in order to describe their collected data, they might want to reference the same authors, the same funding sources, etc. No use in entering the same data twice. For this reason, it is useful to make existing data using existing namespaces available to the `shacl-vue` instance. This can be done by providing a file with RDF data, such as the demo example at: https://github.com/psychoinformatics-de/shacl-vue/blob/main/src/assets/distribution-penguins-mini.ttl.

## Adding custom components

While `shacl-vue` ships with a set of default editor components that cover most standard use cases of form entry, developers are free to add their own custom components.

The way to achieve this is explained fully in the [Editor Component section](./editor-component)