import { reactive, ref} from 'vue'
import { RdfDataset } from "shacl-tulip";
import rdf from 'rdf-ext'

export class ReactiveRdfDataset extends RdfDataset {
    constructor(data = reactive({})) {
        console.log("Running: ReactiveRdfDataset constructor")
        super(data)
        this.data.graphChanged = ref(0)
        this.data.batchMode = false;
    }

    /**
     * Pre-load function to reset the graph loading state.
     */
    beforeLoadFn() {
        this.data.graphLoaded = false
        this.data.batchMode = true;
    }

    async onDataEndFn() {
        await this.updateSerializedGraph()
        this.data.graphLoaded = true
        this.data.batchMode = false;
        this.triggerReactivity();
        this.dispatchEvent(new CustomEvent('graphLoaded', { detail: this.data.graph }));
    }

    createDataset() {
        console.log("Running: ReactiveRdfDataset createDataset()")
        return this.createReactiveDataset()
    }

    createReactiveDataset() {
        console.log("Running: ReactiveRdfDataset createReactiveDataset()")
        const dataset = rdf.dataset();
        const self = this;
        const proxy = new Proxy(dataset, {
            get(target, prop, receiver) {
                const value = Reflect.get(target, prop, receiver);
                if (typeof value === 'function' && ['add', 'delete', 'deleteMatches', 'toCanonical', 'toStream', 'toString'].includes(prop)) {
                    return function (...args) {
                        const result = value.apply(target, args);
                        if (!self.data.batchMode) {
                            self.triggerReactivity(); // Trigger reactivity when dataset is mutated
                        }
                        return result;
                    };
                }
                return value;
            }
        });
        // Initialize the dummy property to ensure reactivity
        proxy._dummy = false;
        return reactive(proxy);
    }

    triggerReactivity() {
        // Toggle the dummy property to trigger reactivity
        this.data.graphChanged++;
        this.data.graph._dummy = !this.data.graph._dummy;
    }
}