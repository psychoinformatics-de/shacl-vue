<template>
    <v-input
        v-model="internalValue"
        :rules="rules"
        ref="fieldRef"
        :id="inputId"
        hide-details="auto"
    >
        <div class="d-flex align-center" style="width: 100%">
            <Suspense>
                <template #default>
                        <component
                            v-if="formData.content[associationClass][associationClassRecordID][keyPropertyUID][keyPropertyIDX]"
                            v-model="formData.content[associationClass][associationClassRecordID][keyPropertyUID][keyPropertyIDX].value"
                            :is="configMatchedComponent || matchedComponent"
                            :property_shape="keyPropertyShape"
                            :node_uid="associationClass"
                            :node_idx="associationClassRecordID"
                            :triple_uid="keyPropertyUID"
                            :triple_idx="keyPropertyIDX"
                            :disabled="compDisabled"
                            
                            @click.stop="showTooltip = false"
                            @focus="showTooltip = false"
                            @focusin="showTooltip = false"
                            @update:modelValue="childComponentUpdated()"
                        >
                        </component>
                </template>
                <template #fallback>
                    <v-skeleton-loader
                        :elevation="2"
                        type="list-item-avatar"
                    ></v-skeleton-loader>
                </template>
            </Suspense>
            <v-tooltip
                v-model="associationsDialog"
                @click:outside="associationsDialog = false"
                location="start"
                :open-on-click="true"
                :open-on-hover="true"
                :interactive="true"
                content-class="tight-tooltip"
            >
                <template v-slot:activator="{ props }">
                    <v-btn v-if="keyPropertyValueSet"
                        v-bind="props"
                        style="margin-left: 0.5em"
                        rounded="0"
                        icon="mdi-information-variant"
                        density="comfortable"
                        elevation="1"
                        >
                    </v-btn>
                </template>
                <span v-if="associationClassRecordHasRelations">
                    <BlankNodeViewer :node="blankNode(associationClassRecordID)" :allowLink="false"/>
                </span>
                <span v-else>
                    <em>&nbsp;No qualifying relations set yet&nbsp;</em>
                </span>
            </v-tooltip>
            <v-btn
                v-if="keyPropertyValueSet"
                style="margin-left: 0.5em"
                rounded="0"
                icon="mdi-pencil"
                density="comfortable"
                elevation="1"
                @click="editItem()"
                :disabled="!canEditClass"
            ></v-btn>
        </div>
    </v-input>
</template>

<script setup>
import { inject, ref, onBeforeMount, reactive, provide, onMounted } from 'vue';
import { useRules } from '../composables/rules';
import { useRegisterRef } from '../composables/refregister';
import { useBaseInput } from '@/composables/base';
import { toCURIE, toIRI } from 'shacl-tulip';
import { RDF } from '@/modules/namespaces';
import { findObjectByKey, getNodeShapePropertyWithAnnotations } from '@/modules/utils';
import { DataFactory } from 'n3';
import { useCompConfig } from '@/composables/useCompConfig';
const { namedNode, blankNode, quad } = DataFactory;
const triggerListGenAndItemSelect = ref(false)
provide('triggerListGenAndItemSelect', triggerListGenAndItemSelect);
// ----- //
// Props //
// ----- //

const props = defineProps({
    modelValue: String,
    property_shape: Object,
    node_uid: String,
    node_idx: String,
    triple_uid: String,
    triple_idx: Number,
});

// ---- //
// Data //
// ---- //
const { rules } = useRules(props.property_shape);
const inputId = `input-${Date.now()}`;
const { fieldRef } = useRegisterRef(inputId, props);
const emit = defineEmits(['update:modelValue']);
const { subValues, internalValue } = useBaseInput(
    props,
    emit,
    valueParser,
    valueCombiner
);

const configVarsMain = inject('configVarsMain');
const rdfDS = inject('rdfDS');
const shapesDS = inject('shapesDS');
const formData = inject('formData');
const allPrefixes = inject('allPrefixes');
const cancelButtonPressed = inject('cancelButtonPressed');
const saveButtonPressed = inject('saveButtonPressed');
const savedNodes = inject('savedNodes');
const keyPropertyShape = ref(null)
const associationClass = ref(null)
const associationClassQuad = ref(null)
const associationClassRecordID = ref(null)
const associationClassRecord = reactive({})
const keyPropertyClass = ref(null)
const keyPropertyUID = ref(null)
const keyPropertyIDX = ref(null)
const configMatchedComponent = ref(null)
const matchedComponent = ref(null)
const editorMatchers = inject('editorMatchers');
const defaultEditor = inject('defaultEditor');
const editInstanceItem = inject('editInstanceItem');
const ID_IRI = inject('ID_IRI');
const modelValueExistOnStart = ref(false);
const canEditClass = ref(true);
const keyPropertyValueSet = ref(false);
const associationsDialog = ref(false)
const associationClassRecordHasRelations = ref(false);
const keyPropertyValuePrevious = ref(null);
const keyPropertyQuad = ref(null);
const {componentName, componentConfig} = useCompConfig(configVarsMain)
const componentClass = toCURIE(props.property_shape[SHACL.class.value], allPrefixes)
const componentClassConfig = componentConfig[componentClass]
const registerHandler = inject('registerHandler');
const componentInstanceKey = ref(null);

function valueParser(value) {
    // Parsing internalValue into ref values for separate subcomponent(s)
    return {
        selectedInstance: value || null,
    }
}

function valueCombiner(values) {
    // Determine internalValue from subvalues/subcomponents
    return values.selectedInstance || null
}

onBeforeMount(() => {    
    associationClass.value = props.property_shape[SHACL.class.value]
    keyPropertyShape.value = getNodeShapePropertyWithAnnotations(props.property_shape[SHACL.class.value], shapesDS, {"dash:propertyRole": "dash:KeyInfoRole"}, allPrefixes)
    keyPropertyClass.value = keyPropertyShape.value[SHACL.class.value]
    keyPropertyUID.value = keyPropertyShape.value[SHACL.path.value]
    keyPropertyIDX.value = 0
    canEditClass.value = configVarsMain.noEditClasses.indexOf(associationClass.value) < 0 ? true : false

    if (props.modelValue) {
        // If props.modelValue already exist before mount, we assume the association class record
        // has already been created, so we get it from the graph and then work from that quad
        modelValueExistOnStart.value = true;
        associationClassRecordID.value = props.modelValue
        let subTerm = blankNode(associationClassRecordID.value)
        let associationClassQuads = rdfDS.data.graph.getQuads(subTerm, namedNode(RDF.type.value), namedNode(associationClass.value), null);
        if (associationClassQuads.length == 1) {
            associationClassQuad.value = associationClassQuads[0];
        } else if (associationClassQuads.length) {
            console.error("There are multiple association classes for this specific keyPropertRole field! This should not be happening!")
            associationClassQuad.value = associationClassQuads[0];
        } else {
            console.error("There are no association classes for this specific keyPropertRole field, even though props.modelValue exist onbeforemount! This should not be happening!")
        }
        associationClassQuad.value = quad(subTerm, namedNode(RDF.type.value), namedNode(associationClass.value), null)
        // We need the existing graph data to go to the form, because we are going to be editing the keyPropertyRole field
        formData.quadsToFormData(associationClass.value, subTerm, rdfDS);
        // Let's also get all the quads related to this association class record
        associationClassRecord.relatedQuads = rdfDS.data.graph.getQuads(subTerm, null, null, null);
        // if there are more than 2 related quads (more than just the type quad and the keyPropertyRole quad),
        // it means there are relations worth showing
        if (associationClassRecord.relatedQuads.length > 2) {
            associationClassRecordHasRelations.value = true;
        } else {
            associationClassRecordHasRelations.value = false;
        }
        // Now we need to get the quad relating to the keyPropertyRole, if it exists
        let keyPropertyQuads = rdfDS.data.graph.getQuads(subTerm, namedNode(keyPropertyUID.value), null, null);
        if (keyPropertyQuads.length == 1) {
            // the keyPropertyRole value is set, a single quad
            keyPropertyQuad.value = keyPropertyQuads[0]
            keyPropertyValuePrevious.value = keyPropertyQuad.value.object.value;
            keyPropertyValueSet.value = true;
        } else if (keyPropertyQuads.length) {
            console.error("There are multiple key property role quads! This should not be happening!")
            keyPropertyQuad.value = keyPropertyQuads[0]
            keyPropertyValuePrevious.value = keyPropertyQuad.value.object.value;
            keyPropertyValueSet.value = true;
        } else {
            // no keyPropertyRole value set yet
            keyPropertyValueSet.value = false;
        }
    } else {
        modelValueExistOnStart.value = false;
        // let's create the association class record and link it
        // we will unlink and delete if cancelled (and if the record props.modelValue did not exist on start)
        associationClassRecordID.value = crypto.randomUUID();
        let newSubTerm = blankNode(associationClassRecordID.value)
        associationClassQuad.value = quad(newSubTerm, namedNode(RDF.type.value), namedNode(associationClass.value), null)
        rdfDS.data.graph.add(associationClassQuad.value)
        savedNodes.value.push({
            nodeshape_iri: associationClass.value,
            node_iri: associationClassRecordID.value,
        });
        // Now we also have to create quads that are specified by config, e.g. "automatically set the default language"
        if (componentClassConfig?.defaults && Object.keys(componentClassConfig.defaults).length > 0) {
            for (const df of Object.keys(componentClassConfig.defaults)) {
                let predVal = toIRI(df, allPrefixes);
                let objVal = componentClassConfig.defaults[df];
                addRelatedQuad(predVal, objVal)
            }
        }
        // Now take the created quad and populate formData
        formData.quadsToFormData(associationClass.value, newSubTerm, rdfDS);
        // There is no quad related to the keyPropertyRole field yet, so we add that explicitly to the form
        formData.addPredicate(
            associationClass.value,
            associationClassRecordID.value,
            keyPropertyUID.value,
            [{value:null, _key: crypto.randomUUID()}]
        );
        // set the "selected" value
        subValues.value.selectedInstance = newSubTerm.value;
        // Set flags and calculate related info
        keyPropertyValueSet.value = false;
        associationClassRecordHasRelations.value = false;
        associationClassRecord.relatedQuads = rdfDS.data.graph.getQuads(newSubTerm, null, null, null);
    }
    // Now match child component:
    // --------------------------
    // We do the same as what the propertyshape editor does: key assignment (only for keypropertyrole field) and matching
    // Provide triple objects with keys for component rendering if they don't have it
    let current_triple_objects = formData.content[associationClass.value][associationClassRecordID.value][keyPropertyUID.value]
    if (current_triple_objects && Array.isArray(current_triple_objects)) {
        for (const tripObj of current_triple_objects) {
            if (!('_key' in tripObj)) {
                tripObj['_key'] = crypto.randomUUID()
            }
        }
    }
    // See if any config-driven editor matching is available
    // We loop through all keys of config[editor_selection] and assign and exit on first matched
    let configMatchedComponentName
    for (const prop_shape_key of Object.keys(configVarsMain.editorSelection)) {
        var pskey = toIRI(prop_shape_key, allPrefixes)
        if (
            keyPropertyShape.value.hasOwnProperty(pskey) &&
            Object.keys(configVarsMain.editorSelection[prop_shape_key]).indexOf(toCURIE(keyPropertyShape.value[pskey], allPrefixes)) >= 0
        ) {
            configMatchedComponentName = configVarsMain.editorSelection[prop_shape_key][toCURIE(keyPropertyShape.value[pskey], allPrefixes)]
            break;
        }
    }
    if (configMatchedComponentName) {
        const matchingComponentNames = Object.keys(editorMatchers).filter(key => key.includes(configMatchedComponentName));
        if (matchingComponentNames.length > 0) {
            var cname = matchingComponentNames[0] // take first matched
            configMatchedComponent.value = editorMatchers[cname].component
        }
    }
    // Now check normal matching
    for (const key in editorMatchers) {
        if (editorMatchers[key].match(keyPropertyShape.value, shapesDS, ID_IRI.value, allPrefixes)) {
            matchedComponent.value = editorMatchers[key].component;
            break;
        }
    }
    if (!matchedComponent.value) matchedComponent.value = defaultEditor
});

function childComponentUpdated() {
    let current_keyPropertyValue = formData.content[associationClass.value][associationClassRecordID.value][keyPropertyUID.value][keyPropertyIDX.value].value
    if (current_keyPropertyValue) {
        keyPropertyValueSet.value = true;
        // If this update happens after the keyPropertyRole value did not exist on mount,
        // it means the keyPropertyRole value was selected/added/edited which means we can now add that quad too,
        // because only the association class quad (and possible default values) was added initially.
        // And when the keyPropertyRole value did exist on mount, but the value is different from what it is now?
        // This quad should also be added, and the other removed -> "if current is different from previous" covers all logic we need
        if (current_keyPropertyValue !== keyPropertyValuePrevious.value) {
            // remove quad, only if it exists
            if(keyPropertyValuePrevious.value) {
                rdfDS.data.graph.delete(keyPropertyQuad.value)
            }
            keyPropertyQuad.value = addRelatedQuad(keyPropertyUID.value, current_keyPropertyValue)
            // Question: should we add defaults here too?
            // The defaults are initially added and then linked to the association class record
            // Currently, changing the keyPropertyRole field does nothing to the defaults (or the defaults that were since edited)
            // One could argue that the defaults/related records should be removed and then re-added if the keyPropertyRole field is changed....
            // For now we do nothing.
        }
        keyPropertyValuePrevious.value = current_keyPropertyValue;
    } else {
        keyPropertyValueSet.value = false;
        keyPropertyValuePrevious.value = null;
    }
}

function addRelatedQuad(predicateVal, objectVal) {
    var [nodefunc, datatype] = shapesDS.getPropertyNodeKind(associationClass.value, predicateVal, ID_IRI.value)
    let subj = associationClassQuad.value.subject
    let pred = namedNode(predicateVal)
    let obj
    if (datatype) {
        obj = nodefunc(objectVal, namedNode(datatype))
    } else {
        obj = nodefunc(objectVal)
    }
    let newQuad = quad(subj, pred, obj, null)
    rdfDS.data.graph.add(newQuad)
    return newQuad
}

function editItem() {
    editInstanceItem(
        {
            quad: associationClassQuad.value,
            value: associationClassRecordID.value
        },
        false, // set argument 'quadsToForm' to false to skip the quadsToFormData command, since these quads already exist
    )
}

function onCancel() {
    if (!modelValueExistOnStart.value) {
        // Association class record did not exist when component mounted, then it was created ->
        // therefore now we remove it during form cancel
        // TODO: modelValueExistOnStart.value will not be a true reflection of the original state of the modelValue
        // when the form was initially opened due to the problem with the formeditor comoponent state,
        // since it mounts again when navigating back to it after another interim form was opened.
        // So this delete command will only work if another form was not opened in the interim.
        rdfDS.data.graph.delete(quad(blankNode(associationClassRecordID.value), namedNode(RDF.type.value), namedNode(associationClass.value), null))
        if (keyPropertyQuad.value) rdfDS.data.graph.delete(keyPropertyQuad.value)
        // TODO: also remove any other possibly added quads here, the ones that relate to the associationClassRecord, e.g. roles, start/end
    }
    formData.removeSubject(associationClass.value, associationClassRecordID.value);
}

function onSave() {
    // If the modelValue does not exist now, i.e. keypropertyvalue is not set, we need to delete the associationClassRecord
    // and the reference to it in formdata, otherwise that reference is saved as a quad to graphData, and that quad will point to
    // deleted association class record quad
    if (!keyPropertyValueSet.value) {
        console.log("KeyValue not set - deleting association class record and formdata")
        rdfDS.data.graph.delete(quad(blankNode(associationClassRecordID.value), namedNode(RDF.type.value), namedNode(associationClass.value), null))
        formData.removeSubject(associationClass.value, associationClassRecordID.value);
        // Now we have to remove the reference to the associationClassRecord from the data of the current form being edited.
        // This was initially done with formData.removeObject, which uses splice to remove an array element.
        // However, that approach was not useful here, because removing an array element will change the index for
        // all elements following the current index, so if the same formData.removeObject is called form other 
        // associationClassEditor instantiations, the index will have changed and that operation will fail.
        // Instead, we just find the object by _key, and then set the value to null. formData.saveNode already
        // knows how to handle null values.
        let allTriples = formData.content[props.node_uid][props.node_idx][props.triple_uid]
        let foundObject = findObjectByKey(allTriples, '_key', componentInstanceKey.value)
        foundObject.value = null;
    }
}

onMounted( () => { 
    registerHandler('save', onSave);
    registerHandler('cancel', onCancel);
    // We need the instance _key for later if the form is saved and unused association class records need to be unlinked
    componentInstanceKey.value = formData.content[props.node_uid][props.node_idx][props.triple_uid][props.triple_idx]._key;
})
</script>


<script>
import { SHACL } from '../modules/namespaces';
import { nodeShapeHasPID, nodeShapeHasPropertyWithAnnotations} from '../modules/utils';
import { inject } from 'vue';
export const matchingLogic = (shape, shapesDS, id_iri, prefixes) => {
    // sh:nodeKind exists
    if (shape.hasOwnProperty(SHACL.nodeKind.value) && 
        shape.hasOwnProperty(SHACL.class.value)) {
        // sh:nodeKind == sh:IRI ||
        // sh:nodeKind == sh:BlankNodeOrIRI ||
        // sh:class exists
        var shClass = shape[SHACL.class.value]
        return [SHACL.IRI.value, SHACL.BlankNodeOrIRI.value].includes(
            shape[SHACL.nodeKind.value]
        ) && !nodeShapeHasPID(shClass, shapesDS, id_iri) &&
        nodeShapeHasPropertyWithAnnotations(shClass, shapesDS, {"dash:propertyRole": "dash:KeyInfoRole"}, prefixes)
    }
    return false;
};
</script>

<style>
/* Override Vuetify’s default padding/constraints for tooltip */
.tight-tooltip.v-overlay__content {
    padding: 0 !important;
    margin: 0 !important;
    max-width: none !important;
    min-width: auto !important;
    width: auto !important;
    height: auto !important;
    background-color: white !important;
    color: black !important;
    border: 1px solid #b4b4b4;
}
</style>