/**
 * Collects from the loaded structural data draw objects that are to remove from the draw area.
 */
class RemoveCollector {
    /**
     * Contains instance for the data storage/access and configuration options.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     */
    constructor(opts, sceneData) {
        this.opts = opts;
        this.sceneData = sceneData;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Determines which items should be removed from the draw area by user input.
     *
     * @param structures {Array|Set} - ids of structure to completely remove
     * @param atoms {Array|Set} - ids of atoms to remove
     * @param edges {Array|Set} - ids of bonds to remove
     * @param annotations {Array|Set} - ids of annotations to remove
     * @param atomPairInteractions {Array|Set} - ids of atom pair interactions to remove
     * @param piStackings {Array|Set} - ids of pi stackings to remove
     * @param cationPiStackings {Array|Set} - ids of cation pi stackings to remove
     * @param hydrophobicContacts {Array|Set} - ids of hydrophobic contacts to remove
     * Those are objects which have 'id' as key and can optional have specified
     * control points (key 'controlPoints', values as array of ids) to only remove
     * those
     */
    determineRemoveObjects({
        structures,
        atoms,
        edges,
        annotations,
        atomPairInteractions,
        piStackings,
        cationPiStackings,
        hydrophobicContacts
    }) {
        const remStructures = new Set(structures);
        const remAtoms = new Set(atoms);
        const remEdges = new Set(edges);
        const remAnnotations = new Set(annotations);
        const remAtomPairInteractions = new Set(atomPairInteractions);
        const remPiStackings = new Set(piStackings);
        const remCationPiStackings = new Set(cationPiStackings);
        const remHydrophobicContacts = new Set(hydrophobicContacts);
        //will be filled later
        const remRings = new Set();
        //Remove a structure if all of its atoms should be removed
        //key as structure id, value as numbers of atoms to remove from structure
        const atomCountMap = {};
        const structuresData = this.sceneData.structuresData;
        RemoveCollector.getAtomsToRemove(structuresData, remAtoms, atomCountMap);
        RemoveCollector.getStructuresToRemove(structuresData, remStructures, atomCountMap);
        RemoveCollector.getHydrophobicAnnotationsToRemove(structuresData,
            remAnnotations,
            remHydrophobicContacts,
            remStructures,
            remAtoms
        );
        RemoveCollector.getRingsToRemove(structuresData, remRings, remAtoms);
        const intermolecularData = this.sceneData.intermolecularData;
        RemoveCollector.determineIntermolecularToRemove(intermolecularData.atomPairInteractions,
            remAtoms,
            remAtoms,
            remStructures,
            remAtomPairInteractions
        );
        RemoveCollector.determineIntermolecularToRemove(intermolecularData.piStackings,
            remRings,
            remRings,
            remStructures,
            remPiStackings
        );
        RemoveCollector.determineIntermolecularToRemove(intermolecularData.cationPiStackings,
            remRings,
            remAtoms,
            remStructures,
            remCationPiStackings
        );
        //process hydrophobic contacts so that no id is present more than once
        const hContacts = {};
        for (const {id, controlPoints} of remHydrophobicContacts) {
            if (!hContacts.hasOwnProperty(id)) {
                hContacts[id] = {
                    completeRemove: false, controlPoints: new Set()
                }
            }
            if (controlPoints) {
                hContacts[id].completeRemove = false;
                Helpers.mergeIntoSet(hContacts[id].controlPoints, controlPoints);
            } else {
                hContacts[id].completeRemove = true;
            }
        }
        remHydrophobicContacts.clear();
        for (const [id, val] of Object.entries(hContacts)) {
            const remContact = {
                id: id
            };
            if (!val.completeRemove) {
                remContact.controlPoints = [...val.controlPoints];
            }
            remHydrophobicContacts.add(remContact);
        }
        return {
            remStructures,
            remAtoms,
            remEdges,
            remAnnotations,
            remAtomPairInteractions,
            remPiStackings,
            remCationPiStackings,
            remHydrophobicContacts
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Determines which atoms should be removed from the draw area.
     *
     * @param structuresData {Object} - ids of structure to completely remove
     * @param remAtoms {Set} - ids of atoms to remove
     * @param atomCountMap {Object} - counter for nr. of atoms to remove from structure
     */
    static getAtomsToRemove(structuresData, remAtoms, atomCountMap) {
        for (const atomId of remAtoms) {
            if (!structuresData.atomIdsToStructure.hasOwnProperty(atomId)) {
                continue;
            }

            const structureId = structuresData.atomIdsToStructure[atomId];
            if (!atomCountMap.hasOwnProperty(structureId)) {
                atomCountMap[structureId] = 0;
            }
            ++atomCountMap[structureId];
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Determines which structures should be removed from the draw area.
     *
     * @param structuresData {Object} - ids of structure to completely remove
     * @param remStructures {Set} - ids of structures to remove
     * @param atomCountMap {Object} - counter for nr. of atoms to remove from structure
     */
    static getStructuresToRemove(structuresData, remStructures, atomCountMap) {
        for (const [structureId, remAtomCount] of Object.entries(atomCountMap)) {
            if (!structuresData.structures.hasOwnProperty(structureId)) {
                continue;
            }

            if (remAtomCount === structuresData.structures[structureId].atomsData.atomIds.length) {
                remStructures.add(structureId);
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Determines which annotations and hydrophobic contacts should be removed from the draw area.
     *
     * @param structuresData {Object} - ids of structure to completely remove
     * @param remAnnotations {Set} - ids of annotations to remove
     * @param remHydrophobicContacts {Set} - ids of hydrophobic contacts to remove
     * @param remStructures {Set} - ids of structures to remove
     * @param remAtoms {Set} - ids of atoms to remove
     */
    static getHydrophobicAnnotationsToRemove(structuresData,
        remAnnotations,
        remHydrophobicContacts,
        remStructures,
        remAtoms
    ) {
        //set annotations and hydrophobic contacts to remove from
        //structures to completely remove
        //also delete atoms and bonds to remove which are part of a structure
        //to delete because structure deletion is handled all at once.
        for (const structureId of remStructures) {
            if (!structuresData.structures.hasOwnProperty(structureId)) {
                continue;
            }
            const structure = structuresData.structures[structureId];
            Helpers.mergeIntoSet(remAnnotations, structure.annotationConnectionData.annotations);
            Helpers.mergeIntoSet(remHydrophobicContacts,
                Object.keys(structure.hydrophobicConnectionData.hydrophobicConts)
                    .map(id => ({id: id}))
            );
            Helpers.deleteFromSet(remAtoms, structure.atomsData.atomIds);
            Helpers.deleteFromSet(remAtoms, Object.values(structure.edgesData.edgeIdByIdx));
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Determines which rings should be removed from the draw area.
     *
     * @param structuresData {Object} - ids of structure to completely remove
     * @param remRings {Set} - ids of rings to remove
     * @param remAtoms {Set} - ids of atoms to remove
     */
    static getRingsToRemove(structuresData, remRings, remAtoms) {
        //determine rings to remove. This is used to determine
        //(cation-)pi-stackings to remove.
        for (const structure of Object.values(structuresData.structures)) {
            for (const ring of Object.values(structure.ringsData.rings)) {
                let removeRing = true;
                for (const atom of Object.values(ring.atoms)) {
                    if (!remAtoms.has(atom.id)) {
                        removeRing = false;
                        break;
                    }
                }
                if (removeRing) {
                    remRings.add(ring.id);
                }
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Determines which intermolecular edges of a certain type should be removed
     * from the draw area.
     *
     * @param container {Array} - data container of the intermolecular edge type
     * @param remFrom {Set} - ids of start points to remove
     * @param remTo {Set} - ids of end points to remove
     * @param remStruc {Set} - structures to remove
     * @param remInter {Set} - collects ids of intermolecular edges to remove
     */
    static determineIntermolecularToRemove(container, remFrom, remTo, remStruc, remInter) {
        for (const [id, intermolecular] of Object.entries(container)) {
            if (remFrom.has(intermolecular.from) || remTo.has(intermolecular.to) ||
                remStruc.has(intermolecular.fromStructure) ||
                remStruc.has(intermolecular.toStructure)) {
                remInter.add(id);
            }
        }
    }
}