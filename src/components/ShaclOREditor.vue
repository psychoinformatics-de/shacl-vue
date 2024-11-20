<template>
    <v-select
        :items="orList"
        density="compact"
        variant="underlined"
        label="select type"
        item-value="value"
        item-text="title"
        ref="selector"
    >
        <template v-slot:item="data">
            <v-list-item @click="selectORelement(data.item)">
                <span v-for="(value, key, index) in data.item.props">
                    <span v-if="['title', 'subtitle', 'name', 'value'].indexOf(key) < 0">
                        <strong>{{ toCURIE(key, shapePrefixes) }}</strong>: {{ toCURIE(value, shapePrefixes) }} <br>
                    </span>
                </span>
            </v-list-item>
        </template>
    </v-select>

    <component
        v-if="orElementSelected"
        v-model="formData[props.node_uid][props.node_idx][props.triple_uid][props.triple_idx]"
        :is="matchedComponent"
        :property_shape="updatedShape"
        :node_uid="props.node_uid"
        :node_idx="props.node_idx"
        :triple_uid="props.triple_uid"
        :triple_idx="props.triple_idx"
        >
    </component>        
</template>

<script setup>
    import { computed, inject, ref, toRaw} from 'vue'
    import { useRules } from '../composables/rules'
    import { useRegisterRef } from '../composables/refregister';
    import { useBaseInput } from '@/composables/base';
    import { toCURIE } from '../modules/utils';


    const props = defineProps({
        modelValue: String,
        property_shape: Object,
        node_uid: String,
        node_idx: String,
        triple_uid: String,
        triple_idx: Number
    })
    const shapePrefixes = inject('shapePrefixes');
    const editorMatchers = inject('editorMatchers');
    const defaultEditor = inject('defaultEditor');
    const formData = inject('formData');
    const matchedComponent = ref(null)
    const selector = ref(null)

    // const { subValues, internalValue } = useBaseInput(
    //     props,
    //     emit,
    //     valueParser,
    //     valueCombiner
    // );

    const orElementSelected = ref(false)
    const selectedElement = ref(null)
    const updatedShape = ref({})

    const orList = computed(() => {
        var items = []
        console.log(props.property_shape)
        const or_array = props.property_shape[SHACL.or.value]
        console.log(or_array)
        console.log(or_array.length)
        for (var el of or_array) {
            console.log(`OR array element:`)
            console.log(el)

            
            items.push(
                {
                    title: "",
                    value: el,
                    props: el
                }
            )
        }
        console.log("Or list items")
        console.log(items)
        return items
    })


    function selectORelement(el) {
        selectedElement.value = el.value
        // create new shape with the sh:or removed, and replaced by all key-value pairs in el.value
        const newShape = structuredClone(toRaw(props.property_shape));
        delete newShape[SHACL.or.value]
        for (const [key, value] of Object.entries(el.value)) {
            newShape[key] = value
        }

        // This is a bandaid fix to let the resulting shape match with existing components
        // that always check for a nodekind. The origin of the issue could be:
        // - linkml should also add the nodekind to the array element in the
        //   gen-shacl output of a shape with sh:or, while it doesn't
        // - the nodekind should actually not be required, as is currently assumed by most matchers
        //   which means that matchers need to be updated. This could likely relate to sh:class as
        //   a value type constraint https://www.w3.org/TR/shacl/#ClassConstraintComponent, vs the
        //   target class of a nodeshape, and my own confusion about these two.
        if (newShape.hasOwnProperty(SHACL.class.value) && !newShape.hasOwnProperty(SHACL.nodeKind.value)) {
            newShape[SHACL.nodeKind.value] = SHACL.BlankNodeOrIRI.value 
        }

        updatedShape.value = newShape

        var matched = false
        for (const key in editorMatchers) {
            if (editorMatchers[key].match(updatedShape.value)) {
                matchedComponent.value = editorMatchers[key].component;
                matched = true
            }
        }
        if (!matched) {
            matchedComponent.value = defaultEditor

        }
        orElementSelected.value = true;
        selector.value.blur();
        console.log(newShape)
    }

</script>

<script>
    import { SHACL, XSD } from '../modules/namespaces'
    export const matchingLogic = (shape) => {
        // sh:or exists
        if ( shape.hasOwnProperty(SHACL.or.value) && Array.isArray(shape[SHACL.or.value])) {
            return true
            
            // // sh:nodeKind == sh:Literal
            // if ( shape[SHACL.nodeKind.value] == SHACL.Literal.value ) {
            //     // sh:datatype exists
            //     if ( shape.hasOwnProperty(SHACL.datatype.value) ) {
            //         // sh:datatype == xsd:hexBinary
            //         return shape[SHACL.datatype.value] == XSD.hexBinary.value
            //     }
            // }
        }
        return false
    };
</script>