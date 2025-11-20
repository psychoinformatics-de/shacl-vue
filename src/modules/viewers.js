/**
 * @module viewers.js
 * @description This module loads all viewers and assigns each on a name
 * @todo This module can be expanded in future to load viewer matching code
 *

 */
export const viewers = import.meta.glob('../components/*Viewer.vue', {
    eager: true,
});

const viewerMatchers = {}

for (const file in viewers) {
    const component = viewers[file];
    const componentDefault = component.default;
    const filename = file.split('/').pop().replace('.vue', '');
    componentDefault.name = filename;
    if (component.matchingLogic) {
        viewerMatchers[file] = {
            component: componentDefault,
            match: component.matchingLogic,
        };
    }
}

export default viewerMatchers;
