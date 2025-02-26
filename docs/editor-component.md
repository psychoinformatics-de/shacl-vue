---
layout: doc
---

# The Editor Component

A core part of `shacl-vue` is its ability to render a dynamic editor component (and in future also a viewer component) based on the specific constraints in a SHACL `PropertyShape`. E.g. if the `sh:datatype` of the shape is `xsd:datetime`, then one would expect the input field to be a date/time selector, or if the `sh:NodeKind` is `sh:IRI`, then one would expect to be able to select from a list of existing resource identifiers or add a new one.

Here we provide more information about how editor components are put together in order to achieve this dynamic redering, how matching works, how to create new custom editor components, and how to make them discoverable to the application.

## The editor component internals

::: warning
`shacl-vue` is under continuous development and might change at any time. Abstracting out general functionality, especially related to base editor code, is likely to affect the descriptions below.
:::

Let's use the [HexEditor.vue](https://github.com/psychoinformatics-de/shacl-vue/blob/main/src/components/HexEditor.vue) code as an example to explain the component internals.

### The template

```vue
<template>
    <v-input
        v-model="internalValue"
        :rules="rules"
        ref="fieldRef"
        :id="inputId"
        hide-details="auto"
        style="margin-bottom: 1em;"
    >
        <v-text-field
            v-model="subValues.hex_text"
            density="compact"
            variant="outlined"
            label="add hexadecimal text"
            hide-details="auto"
        >
        </v-text-field>
    </v-input>
</template>
```

The template part of the component defines the look, feel, and UI-related functionality of the component. As you can see, there is a [Vuetify `v-input`](https://vuetifyjs.com/en/components/inputs/#usage) component that wraps the component, which is used to provide a unified API for any custom editor. See [this commit](https://github.com/psychoinformatics-de/shacl-vue/commit/b918ebd467fc45edcf22036a4053064b2d10388a) for more details. All attributes of the `v-input` tag are **required to be reused as is** in any new custom component, except for the `style` attribute:

- `v-model="internalValue"` provides a two-way binding of the `v-input` to a required `internalValue`, which is automatically reflected in the global `formData` state. In other words, this is the actual value of the editor component as input by the user.
- `:rules="rules"` binds the `rules` variable (further explained in the `setup` script section below) to the `rules` property of the `v-input` component, for validation purposes
- `ref="fieldRef"` and `:id="inputId"` assigns a `ref` and `id`, respectively, to the `v-input` component, which allows any component to be referenced (possibly recursively) by its parent form, for validation purposes (see [this commit](https://github.com/psychoinformatics-de/shacl-vue/commit/aee824187942bee887ce87342f293580e5540d66)).
- `hide-details="auto"` makes for a better UX regarding messaging from the `v-input` component.

The custom nature of an editor component is established by adding any number of components inside the `v-input`. In the above example we have a single `v-text-field`, but this could also be multiple input components, such as the [`URIEditor`](https://github.com/psychoinformatics-de/shacl-vue/blob/main/src/components/URIEditor.vue#L10-L52) that is shipped with `shacl-vue`. The important part is to `v-model` each subcomponent with a unique field in the `subValues` object, e.g. `subValues.hex_text` above. These subvalues are used in a deterministic way when determining the `internalValue` of the wrapping `v-input` component.


### The `setup` script

```vue
<script setup>
    import { useRules } from '../composables/rules'
    import { useRegisterRef } from '../composables/refregister';
    import { useBaseInput } from '@/composables/base';

    const props = defineProps({
        modelValue: String,
        property_shape: Object,
        node_uid: String,
        triple_uid: String,
        triple_idx: Number
    })
    const { rules } = useRules(props.property_shape)
    const inputId = `input-${Date.now()}`;
    const { fieldRef } = useRegisterRef(inputId, props);
    const emit = defineEmits(['update:modelValue']);
    const { subValues, internalValue } = useBaseInput(
        props,
        emit,
        valueParser,
        valueCombiner
    );

    function valueParser(value) {
        // Parsing internalValue into ref values for separate subcomponent(s)
        return {
            hex_text: value,
        }
    }

    function valueCombiner(values) {
        // Determine internalValue from subvalues/subcomponents
        return values.hex_text
    }

</script>
```

This script defines the behavior logic for the custom component and runs before the component mounts (see the [VueJS docs](https://vuejs.org/api/sfc-script-setup.html#script-setup)).

Importantly, this is where general functionality from composables are imported and used to allow the custom editor component to behave as expected:

- the `props` structure defines all arguments passed to the component from its parent
- the `useRules` composable returns the `rules` variable that is constructed in the format expected by the `v-input` component, by parsing constraints of the `sh:PropertyShape` being processed.
- ``const inputId = `input-${Date.now()}`;`` establishes a unique id for the `v-input` field that is required for the next step.

::: info
`Date.now()` is not strictly necessary as a way to get a unique id, and any alternative method can also be used instead.
:::

- the `useRegisterRef` returns the unique ref that the `v-input` is tagged with in order to allow it to be uniquely identified within the context of its parent form (`FormEditor` component) in order to validate the form and list validation errors.
- `const emit = defineEmits(['update:modelValue']);` tells the component to emit any local updates to the `modelValue` prop upwards to the parent
- the `useBaseInput` composable is essential to the behavior of a custom component. It should be provided with the `valueParser` and `valueCombiner` functions that are unique to the custom component, and it returns `internalValue` which the `v-input` is modeled with, and also the `subValues` structure.
- `valueParser(value)` is the custom logic that the component should provide to determine the subvalues of possible subcomponents from `internalValue`
- `valueCombiner(values)` is the custom logic that the component should provide to determine the `internalValue` from the subvalues of possible subcomponents

The functions in the above example are simplistic, since they just mirror the single subvalue. But this logic could also be more complex, see for example the [functions associated with the `URIEditor` component](https://github.com/psychoinformatics-de/shacl-vue/blob/main/src/components/URIEditor.vue#L125-L174).


### The matching script

```vue
<script>
    import { SHACL, XSD } from '../modules/namespaces'
    export const matchingLogic = (shape) => {
        // sh:nodeKind exists
        if ( shape.hasOwnProperty(SHACL.nodeKind.value) ) {
            // sh:nodeKind == sh:Literal
            if ( shape[SHACL.nodeKind.value] == SHACL.Literal.value ) {
                // sh:datatype exists
                if ( shape.hasOwnProperty(SHACL.datatype.value) ) {
                    // sh:datatype == xsd:hexBinary
                    return shape[SHACL.datatype.value] == XSD.hexBinary.value
                }
            }
        }
        return false
    };
</script>
```

This is an extra and required script that specifies the logic for deciding whether a custom editor component should be rendered or not based on the `sh:PropertyShape`. Here, for example, the component will match (`return true`) if:
- the shape contains the `sh:NodeKind` field and
- the `sh:NodeKind` is an `sh:Literal` and
- the shape contains the `sh:datatype` field and
- the `sh:datatype` equals `XSD.hexBinary`

::: info

TODO: the current matching procedure will return a boolean value when matched, which means that it could be possible for multiple components to match if their logic is similar. At the moment the matching procedure will select the first match. This logic will likely be replaced in future with a rating scheme, where a integer/decimal value of priority will be assigned to a given match based on some global configuration. The highest rated match would then be rendered.
:::

## Component discovery

Custom components can be created as outlined above and will then need to be placed inside the `shacl-vue/src/components` directory in order to be auto-discovered by the application.


## Component matching

The [`editors.js` module](https://github.com/psychoinformatics-de/shacl-vue/blob/main/src/modules/editors.js), which is used once in the `MainForm` component upon application startup, provides the necessary code for grabbing the matching logic of all custom Vue components and making that available (via `Provide/Inject`) to the `PropertyShapeEditor` editor that dynamically matches the correct editor component to the `sh:PropertyShape`.

In the `PropertyShapeEditor`, a computed property determines the correct match:

```vue
const matchedComponent = computed(() => {
    for (const key in editorMatchers) {
        if (editorMatchers[key].match(props.property_shape)) {
            return editorMatchers[key].component;
        }
    }
    return defaultEditor;
});
```

If no match is found, a `DefaultEditor` is returned, which is currently set to the `UnknownEditor` which just prints a line and contains no input field.
