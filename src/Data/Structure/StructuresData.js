/**
 * Stores structural data about all structures present in the scene.
 */
class StructuresData {
    /**
     * Contains objects to store Structure objects and to set/query data of those.
     */
    constructor() {
        //id of Structure object -> Structure object
        this.structures = {};
        this.originalStructures = {};
        //id of Atom object -> Structure object id
        this.atomIdsToStructure = {};
        this.structureLoaded = false;
        //Structure object ids
        this.structuresInUse = new Set();
        //History step nr. -> added Structure ids
        this.addTimesToStructure = {}; //to clear memory appropriately
        //Structure object id -> Structure object id -> intermolecular ids
        this.intermolecularConnections = {};
    }

    /*----------------------------------------------------------------------*/

    /**
     * Retrieves ids of atoms and bonds of the structure with a specified id.
     *
     * @param structureId {Number} - the unique id of a structure currently
     * present in the scene
     * @returns {Object} - ids of atoms (field 'atoms') and bonds (field
     * 'edges') of the structure in form of Arrays | null for bad requests
     */
    getIdsForStructure(structureId) {
        const structure = this.structures[structureId];
        if (!structure) {
            return null;
        }
        return {
            atoms: structure.atomsData.atoms.map(atom => atom.id),
            edges: structure.edgesData.edges.map(edge => edge.id)
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns all ids of currently hidden structures.
     *
     * @return {Array} - hidden structure ids
     */
    getHiddenStructures() {
        const ids = [];
        for (const structure of Object.values(this.structures)) {
            if (structure.hidden) ids.push(structure.id);
        }
        return ids;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks if structure with given id contains edges and atoms by ids.
     *
     * @param atoms {Array} - ids of atoms
     * @param edges {Array} - ids of edges
     * @param structureId {Number} - id of structure
     * @returns {Boolean} - true if all atom/edge ids belong to the given structure
     */
    structureHasElements(atoms, edges, structureId) {
        const elementsIDs = this.getIdsForStructure(structureId);
        let hasElements = true;
        atoms && atoms.forEach((atomSelection) => {
            if (!atomSelection || !elementsIDs["atoms"].includes(atomSelection.id)) {
                hasElements = false;
            }
        });
        edges && edges.forEach((edgeSelection) => {
            if (!edgeSelection || !elementsIDs["edges"].includes(edgeSelection.id)) {
                hasElements = false;
            }
        });
        return hasElements;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns all structure ids and their names that are currently loaded.
     *
     * @returns {Array} - array of objects with key "id" and key "name"
     */
    getStructures() {
        return Object.values(this.structures).map((structure) => {
            return {
                id: structure.id,
                name: structure.structureName,
                enabled: structure.enabled,
                hidden: structure.hidden
            }
        })
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns all additional information of atoms and structures
     *
     * @param onlySelected {Boolean} - if true returns only information of
     * currently selected elements. If the current representation of a structure
     * is circle then all atoms are considered selected
     * @returns {Object} - contains keys "structures", and "atoms" which
     * hold an array containing objects which hold all "additionalInformation",
     * the "structureId", and, for atoms, the "atomId".
     */
    getAdditionalInformation(onlySelected = false) {
        const info = {
            structures: [], atoms: [], edges: []
        };
        for (const structure of Object.values(this.structures)) {
            const atomInfo = structure.atomsData.atoms
                .filter(atom => atom.additionalInformation &&
                       (!onlySelected || structure.atomsData.selectedAtoms.has(atom.id) ||
                        structure.representationsData.selectedStructureCircle))
                .map(atom => {
                    return {
                        additionalInformation: atom.additionalInformation,
                        atomId: atom.id,
                        structureId: structure.id
                    }
                });
            info.atoms.push(...atomInfo);
            const edgeInfo = structure.edgesData.edges
                .filter(edge =>
                    (!onlySelected || structure.edgesData.selectedEdges.has(edge.id) ||
                        structure.representationsData.selectedStructureCircle))
                .map(edge => {
                    return {
                        edgeId: edge.id,
                        fromId: edge.from,
                        toId: edge.to,
                        structureId: structure.id
                    }
                });
            info.edges.push(...edgeInfo);
            if ((!onlySelected || structure.representationsData.selectedStructureCircle ||
                structure.edgesData.selectedEdges.size > 0 ||
                structure.atomsData.selectedAtoms.size > 0) && structure.additionalInformation) {
                info.structures.push({
                    additionalInformation: structure.additionalInformation,
                    structureId: structure.id
                });
            }
        }
        return info;
    }
}