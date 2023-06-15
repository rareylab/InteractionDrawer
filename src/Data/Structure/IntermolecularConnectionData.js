/**
 * Stores data about all intermolecular connections of one structure present in the scene.
 */
class IntermolecularConnectionData {
    /**
     * Contains instances with data rings and about intermolecular connections of this structure.
     *
     * @param ringsData {RingsData} - data about structure rings
     */
    constructor(ringsData) {
        this.ringsData = ringsData;
        // IntermolecularEdge object ids
        this.ids = {
            atomPairInteractions: new Set(),
            piStackings: new Set(),
            cationPiStackings: new Set(),
            distances: new Set(),
            interactions: new Set()
        };
        //Atom/Ring object id -> IntermolecularEdge object ids
        this.connections = {
            atomPairInteractions: {atom: {}},
            piStackings: {ring: {}},
            cationPiStackings: {atom: {}, ring: {}},
            distances: {annotation: {}},
            interactions: {annotation: {}}
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Memorizes that an intermolecular edge (by id and type) belongs to this
     * structure and note the start point such edge is connected to.
     *
     * @param fromID {Number} - start point (atom or ring) the intermolecular
     * edge is connected to
     * @param intermolecularID {Number} - id of intermolecular edge which is
     * connected to this structure
     * @param intermolecularType {String} - identifier of the intermolecular edge
     * @param fromType {String} - optional identifier of the connected object
     */
    addIntermolecularConnection(fromID, intermolecularID, intermolecularType, fromType) {
        this.ids[intermolecularType].add(intermolecularID);
        const connectionsOfType = this.connections[intermolecularType][fromType];
        if (!connectionsOfType.hasOwnProperty(fromID)) {
            connectionsOfType[fromID] = [];
        }
        connectionsOfType[fromID].push(intermolecularID);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Given an array of atoms affected by an interaction (by their ids), finds
     * out which atom pair interactions must then be updated.
     *
     * @param atomArr {Array} - ids of atom affected by interaction
     * @param moveFreedomLevel {String} - freedom level defining the size of
     * units of the structure which can be moved at one. Either 'free',
     * 'rings', or 'structures'
     * @returns {Set} - ids of atom pair interactions that must be updated
     */
    getAtomPairInteractionsAffectedByAtoms(atomArr, moveFreedomLevel) {
        const affectedAtomPairInteractions = new Set();
        if (moveFreedomLevel === 'structures') {
            Object.values(this.connections.atomPairInteractions.atom)
                .forEach(atomPairInteractionArr => {
                    atomPairInteractionArr.forEach(atomPairInteractionId => {
                        affectedAtomPairInteractions.add(atomPairInteractionId);
                    });
                });
        } else {
            this.getAffectedIntermolecularForAtoms(affectedAtomPairInteractions,
                atomArr,
                'atomPairInteractions'
            );
        }
        return affectedAtomPairInteractions;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Given information of which atoms of this structure are to be interacted
     * with and the ring systems these are contained in, finds out which pi-pi
     * stacking interactions must be updated.
     *
     * @param atomIds {Array} - ids of atom affected by interaction
     * @param affectedRingSystems {Array|Set} - ids of ring systems affected
     * by interaction (optional, can be given to speed up the process)
     * @returns {Set} - ids of pi-pi interactions that must be updated
     */
    getPiStackingsAffectedByAtoms(atomIds, affectedRingSystems) {
        const affectedPipi = new Set();
        this.getAffectedIntermolecularforRings(affectedPipi,
            atomIds,
            affectedRingSystems,
            'piStackings'
        );
        return affectedPipi;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Given information of which atoms of this structure are to be interacted
     * with and the ring systems these are contained in, finds out which cation-
     * pi stacking interactions must be updated.
     *
     * @param atomIds {Array} - ids of atom affected by interaction
     * @param affectedRingSystems {Array|Set} - ids of ring systems affected
     * by interaction (optional, can be given to speed up the process)
     * @returns {Set} - ids of cation-pi interactions that must be updated
     */
    getCationPiStackingsAffectedByAtoms(atomIds, affectedRingSystems) {
        const affectedCationPi = new Set();
        this.getAffectedIntermolecularforRings(affectedCationPi,
            atomIds,
            affectedRingSystems,
            'cationPiStackings'
        );
        this.getAffectedIntermolecularForAtoms(affectedCationPi, atomIds, 'cationPiStackings');
        return affectedCationPi;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Given information of which rings of this structure are to be interacted
     * with, finds out which intermolecular edges of a certain type must be updated.
     *
     * @param affectedIntermolecular {Array} - collects affected intermolecular edges of a certain
     *     type
     * @param atomIds {Array} - ids of atoms affected by interaction
     * @param affectedRingSystems {Array|Set} - ids of ring systems affected
     * by intermolecular edge (optional, can be given to speed up the process)
     * @param type {String} - type of intermolecular edge to check
     */
    getAffectedIntermolecularforRings(affectedIntermolecular, atomIds, affectedRingSystems, type) {
        if (!affectedRingSystems) {
            affectedRingSystems = this.ringsData.getRingSystemsAffectedByAtoms(atomIds);
        }
        const affectedRingIds = this.ringsData.getRingsInRingsystem(affectedRingSystems);
        const connectedRingsOfType = this.connections[type].ring;
        for (const ringId of affectedRingIds) {
            if (connectedRingsOfType.hasOwnProperty(ringId)) {
                connectedRingsOfType[ringId].forEach(stackingId => {
                    affectedIntermolecular.add(stackingId);
                });
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Given information of which atoms of this structure are to be interacted
     * with, finds out which intermolecular edges of a certain type must be updated.
     *
     * @param affectedIntermolecular {Array} - collects affected intermolecular edges of a certain
     *     type
     * @param atomIds {Array} - ids of atoms affected by interaction
     * @param type {String} - type of intermolecular edge to check
     */
    getAffectedIntermolecularForAtoms(affectedIntermolecular, atomIds, type) {
        const connectedAtomsOfType = this.connections[type].atom;
        atomIds.forEach(atomId => {
            if (connectedAtomsOfType.hasOwnProperty(atomId)) {
                connectedAtomsOfType[atomId].forEach(id => {
                    affectedIntermolecular.add(id);
                });
            }
        });
    }
}
