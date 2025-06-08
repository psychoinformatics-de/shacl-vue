/**
 * @module editors.js
 * @description This module exports the matching code for all editor Vue components
 *
 * It does that by:
 * - dynamically importing all editor components from '../components' using a glob pattern
 * - looping through the Vue components to grab their default export and matching code
 * - creates a single object with component module paths as keys and components
 *   and matching code as values
 * - exports the object
 *
 * This enables the use of a factory pattern for Vue components. All editor components
 * are imported once (in the application root) and they are completely self-contained,
 * i.e. they contain their own matching code that runs against an individual SHACL
 * property shape and returns true if the editor is a match for the shape. The self-
 * contained design also means that additional components can be added to the
 * '../components' and would immediately part of the factory, i.e. no additional code
 * changes would be required.
 *
 * @todo Use matching scores instead of the current true/false matching outcome
 *
 * This would allow multiple editors to be matched based on the same shape and the one
 * with the highest score would be selected.
 */

export const matchers = import.meta.glob('../components/*Editor.vue', {
    eager: true,
});

const editorMatchers = {};

for (const path in matchers) {
    const component = matchers[path];
    if (component.matchingLogic) {
        editorMatchers[path] = {
            component: component.default,
            match: component.matchingLogic,
        };
    }
}

export default editorMatchers;
