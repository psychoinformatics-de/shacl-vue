---
layout: doc
---

# Component Hierarchy

A VueJS application is made up of a hierarchy of components, with parent components instantiating any number or kind of child components based on defined logic and user interactions. The diagram below shows how `shacl-vue` is put together.

By default, a child component is instantiated by its parent using the appropriate component tag, which is based on the component filename, e.g. `<NodeShapeEditor></NodeShapeEditor>` for `NodeShapeEditor.vue`. The exception would be when dynamic programmatic component instantiation is used via the `component` tag and `:is` binding, e.g.:

`<component :is="myComponent"></component>`

This approach is used in `shacl-vue` for dynamically matching the appropriate editor component for a given `sh:PropertyShape`.


```mermaid
flowchart TD
    0[App.vue]
    A(ShaclVue)
    A2{user selects data type}
    A3.1(AppHeader)
    A3.2(AppFooter)
    D(NodeShapeViewer)
    D2.1(BlankNodeViewer)
    D2.2(LiteralNodeViewer)
    D2.3(NamedNodeViewer)
    E(FormEditor)
    F(NodeShapeEditor)
    G(PropertyShapeEditor)
    H(Matched editor component)

    0 --> |config| A

    A --> A2
    A --> A3.1
    A --> A3.2
    
    A2 --> D
    A2 --> |add record| E
    D --> |edit record| E

    D --> D2.1
    D --> D2.2
    D --> D2.3
    E --> |exactly one instance| F
    F --> |one instance per property| G
    G --> |runs matching code| H
    

    %% B --> C{Decision}
    %% C -->|One| D[Result 1]
    %% C -->|Two| E[Result 2]
```
