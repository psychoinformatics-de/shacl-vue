import { reactive, ref } from 'vue';
import { RdfDataset } from 'shacl-tulip';
import { DataFactory, Store, Parser } from 'n3';
import { RDF } from '@/modules/namespaces';
import { hashSubgraph, getNodeContextKey, collectBlankNodeHierarchy} from '@/modules/utils';
const { blankNode} = DataFactory;

export class ReactiveRdfDataset extends RdfDataset {
    constructor(data = reactive({})) {
        console.log('Running: ReactiveRdfDataset constructor');
        super(data);
        this.data.graphChanged = ref(0);
        this.data.batchMode = false;
        // Track blank-node subgraph hashes by root named node and context (i.e. path)
        this.data.subgraphFingerprintsByRoot = new Map();
    }

    /**
     * Pre-load function to reset the graph loading state.
     */
    beforeLoadFn() {
        this.data.graphLoaded = false;
        this.data.batchMode = true;
    }

    onDataEndFn() {
        this.data.graphLoaded = true;
        this.data.batchMode = false;
        this.triggerReactivity();
        this.dispatchEvent(
            new CustomEvent('graphLoaded', { detail: this.data.graph })
        );
    }

    createDataset() {
        console.log('Running: ReactiveRdfDataset createDataset()');
        return this.createReactiveDataset();
    }

    createReactiveDataset() {
        console.log('Running: ReactiveRdfDataset createReactiveDataset()');
        const dataset = new Store();
        const self = this;
        const proxy = new Proxy(dataset, {
            get(target, prop, receiver) {
                const value = Reflect.get(target, prop, receiver);
                if (
                    typeof value === 'function' &&
                    [
                        'add',
                        'addQuad',
                        'delete',
                        'removeQuad',
                        'removeMatches',
                    ].includes(prop)
                ) {
                    return function (...args) {
                        const result = value.apply(target, args);
                        if (!self.data.batchMode) {
                            self.triggerReactivity(); // Trigger reactivity when dataset is mutated
                        }
                        return result;
                    };
                }
                return value;
            },
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

    parseTTL(ttlString) {
        const parser = new Parser();
        parser.parse(ttlString, {
            // onQuad (required) accepts a listener of type (quad: RDF.Quad) => void
            onQuad: (err, quad) => {
                if (quad) this.onDataFn(quad)
            },
            // onPrefix (optional) accepts a listener of type (prefix: string, iri: NamedNode) => void
            onPrefix: (prefix, iri) => {
                if (prefix && iri) this.onPrefixFn(prefix, iri)
            },
            // onComment (optional) accepts a listener of type (comment: string) => void
            // onComment: (comment) => { console.log('#', comment); },
        });
    }

    async parseTTLandDedup(ttlString) {
        const parser = new Parser();
        const tempStore = new Store();
        let addedQuads = [];
        // Parse synchronously
        const quads = parser.parse(ttlString);
        const prefixes = parser._prefixes;
        for (const [prefix, iri] of Object.entries(prefixes)) {
            this.onPrefixFn(prefix, iri);
        }
        // Now, add to the temp store:
        // - all named-node-as-subject + blank-node-as-object quads
        // - all blank-node-as-subject quads
        // And add all the rest directly to the application store
        let root_node = null
        for (const quad of quads) {
            if (quad.subject.termType === 'NamedNode') {
                if (quad.object.termType === 'BlankNode') {
                    tempStore.addQuad(quad)
                } else {
                    this.onDataFn(quad)
                    addedQuads.push(quad)
                }
                // save root node value
                if (quad.predicate.value == RDF.type.value) {
                    root_node = quad.subject.value;
                }
            } else {
                tempStore.addQuad(quad)
            }
        }
        // If there is no root named node, just add everything to the store, i.e. skip deduplication
        if (!root_node) {
            console.warn('No root named node detected in TTL, skipping deduplication steo and adding all quads to graph.');
            let bnQuads = tempStore.getQuads(null, null, null, null)
            this.data.graph.addQuads(bnQuads);
            return addedQuads.concat(bnQuads);
        }
        // Now get all unique blank-node subject values
        const allTempQuads = tempStore.getQuads(null, null, null, null);
        const blankSubjects = new Set(
            allTempQuads.filter(q => q.subject.termType === 'BlankNode').map(q => q.subject.value)
        );
        // If there are no blank-node subject values, no need to deduplicate
        if (blankSubjects.size == 0) return addedQuads;
        // Initialize set of fingerprints in the root-node context
        if (!this.data.subgraphFingerprintsByRoot.has(root_node)) {
            this.data.subgraphFingerprintsByRoot.set(root_node, new Set());
        }
        const fingerprintSet = this.data.subgraphFingerprintsByRoot.get(root_node);        
        // Add fingerprint for each blank node subgraph
        for (const bnodeId of blankSubjects) {
            const bnode = blankNode(bnodeId);
            // Get the subgraph for this blank node, recursively collecting blank nodes
            const subgraph = collectBlankNodeHierarchy(tempStore, bnode);
            // If no quads, skip
            if (!subgraph.length) continue;
            // Calculate hash signature and contect key
            const fingerprint = await hashSubgraph(subgraph);
            const contextKey = getNodeContextKey(tempStore, bnode);
            // Combine them for deduplication key
            const dedupKey = `${contextKey}::${fingerprint}`;
            // Deduplicate in the context of the current named node
            if (!fingerprintSet.has(dedupKey)) {
                fingerprintSet.add(dedupKey);
                // Add to main graph store
                this.data.graph.addQuads(subgraph);
                addedQuads = addedQuads.concat(subgraph);
                const linkingQuads = tempStore.getQuads(null, null, bnode, null);
                if (linkingQuads.length) {
                    this.data.graph.addQuads(linkingQuads);
                    addedQuads = addedQuads.concat(linkingQuads);
                };
            } else {
                // console.log(`Skipping duplicate subgraph for root ${root_node}, blank node ${bnodeId}`);
            }
        }
        return addedQuads;
    }
}
