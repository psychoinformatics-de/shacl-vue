/**
 * @module shapedata.js
 * @description This composable reads a ttl file with shacl shapes and returns
 * a set of reactive variables used by the root application component
 */
import { reactive } from 'vue'
import { ShapesDataset } from 'shacl-tulip'

const basePath = import.meta.env.BASE_URL || '/';

export function useShapes(config) {

    // ---- //
    // Data //
    // ---- //
	const defaultURL = `${basePath}dlschemas_shacl.ttl`;
	const shapesDS = new ShapesDataset(reactive({}));

    // ----------------- //
    // Lifecycle methods //
    // ----------------- //

    // --------- //
    // Functions //
    // --------- //

	async function getSHACLschema(url) {
		const shapesURL = config.value.shapes_url ? config.value.shapes_url : defaultURL
		const getURL = url ? url : shapesURL
		await shapesDS.loadRDF(getURL)
	}

	// ------- //
    // Returns //
    // ------- //
	return {
		shapesDS,
		getSHACLschema,
	}
}