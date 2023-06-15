/**
 * Stores data about all atoms of one structure present in the scene.
 */
class AtomsData {

    /*----------------------------------------------------------------------*/

    /**
     * Adds atoms data to a structure setting up further data containers.
     *
     * @param atomInfos {Array} - objects defining atoms of the structure
     * @param stereoCenterInfos {Array} - objects defining which atoms of
     * the structure are stereo centers (optional, otherwise inferred from
     * bond types)
     */
    addAtomInfo(atomInfos, stereoCenterInfos) {
        //Atom objects
        this.atoms = [];
        //Atom object id -> Edge and Atom object id pairs
        this.neighbors = {};
        //Atom object ids
        this.atomIds = [];
        //Atom object id -> index in atomInfos
        this.atomIdxById = {}; //to map back from e.g. adjacency matrix
        //index in atomInfos -> Atom object id
        this.atomIdByIdx = {};
        //Atom object id -> Atom object
        this.atomById = {};
        //Atom object ids
        this.selectedAtoms = new Set();
        //Atom object ids
        this.tempSelectedAtoms = new Set();
        //Atom object id -> direction and order
        this.stereoSubstituentOrders = {};

        //if stereo center information given, add it to atom information
        if (stereoCenterInfos) {
            stereoCenterInfos.forEach((atomId, idx) => {
                atomInfos[idx].stereoCenter = true;
            });
        }

        atomInfos.forEach((atomInfo, idx) => {
            const atom = new Atom(atomInfo);
            const atomId = atom.id;
            this.atoms.push(atom);
            this.atomIds.push(atomId);
            this.atomIdxById[atomId] = idx;
            this.atomIdByIdx[idx] = atomId;
            this.atomById[atomId] = atom;
            this.neighbors[atomId] = [];
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Does some postprocessing of atom data after adding it, e.g. the side of a label.
     */
    postProcessAtoms() {
        this.atoms.forEach(atom => {
            const neighbors = this.neighbors[atom.id];
            const neighborAtoms = [];
            neighbors.forEach(({neighbor: nbId, edgeId}) => {
                neighborAtoms.push(this.getAtom(nbId));
            });
            //setting of required atom orientations
            if (atom.element !== 'C' && atom.hydrogenCount !== 0) {
                atom.setHydrogenOrientation(atom.calcHydrogenOrientation(neighborAtoms, false));
            }
            if (atom.isLabel) {
                atom.setLabelSide(atom.calcLabelSide(neighborAtoms, false), false);
            }
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns an Atom object belonging to this structure by its id.
     *
     * @param atomId {Number} - id of Atom object to find
     * @returns {Atom} - Atom object of specified id
     */
    getAtom(atomId) {
        return this.atomById[atomId];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds atom objects of atoms which are neighbors of given atom (by id).
     *
     * @param atomId {Number} - id of atom to find neighbors for
     * @returns {Array} - atom objects of neighboring atoms
     */
    getNonHNeighbors(atomId) {
        return this.neighbors[atomId].filter(({neighbor: nbId}) => {
            return this.getAtom(nbId).element !== 'H';
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds ids of all atoms for which currently (non-hidden) representations
     * exist in the draw area.
     *
     * @returns {Array} - drawn atoms by their ids
     */
    getAllDrawnAtoms() {
        return this.atoms.filter(atom => {
            return atom.enabled;
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds ids of all atoms for which currently representations exist in the
     * draw area (INCLUDING hidden representations).
     *
     * @returns {Array} - drawn atoms by their ids
     */
    getAllEnabledAtoms() {
        return this.atoms.filter(atom => {
            return atom.enabled;
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks whether an interaction on a given subset of atoms affects all
     * atoms of the structure.
     *
     * @param atomArr {Array} - atoms (by id) affected by interactions
     * @returns {Boolean} - whether all atoms of the structure are affected
     */
    isFullStructureAffected(atomArr) {
        return atomArr.length === this.atoms.length;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Marks atom as selected in internal selection set.
     *
     * @param atomId {Number} - id of atom to mark
     */
    selectAtom(atomId) {
        this.selectedAtoms.add(atomId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Marks atom as selected in internal selection Set, but only for temporary
     * means not to be committed into the drawer's history.
     *
     * @param atomId {Number} - id of atom to mark
     */
    tempSelectAtom(atomId) {
        this.tempSelectedAtoms.add(atomId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Based on its current position, finds out whether the placement of atom
     * text for this structure's atoms must be altered (and how).
     *
     * @param byTemp {Boolean} - whether to use temporary or non-temporary
     * atom parameters for this calculation
     * @returns {Object} - map between atom ids and new hydrogen text
     * orientations
     */
    findAtomsWithChangedHPlacement(byTemp) {
        const orientationParam = byTemp ? 'tempHydrogenOrientation' : 'hydrogenOrientation';
        const changedAtoms = {};
        this.atoms.forEach(atom => {
            if (atom.element === 'C' || atom.hydrogenCount <= 0) {
                return;
            }
            const neighbors = this.neighbors[atom.id].map(nb => {
                return this.getAtom(nb.neighbor);
            });
            const newHorientation = atom.calcHydrogenOrientation(neighbors, byTemp);
            if (newHorientation !== atom[orientationParam]) {
                changedAtoms[atom.id] = newHorientation;
            }
        });
        return changedAtoms;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Based on its current position, finds out whether the placement of amino
     * acid labels must be altered (and how).
     *
     * @param byTemp {Boolean} - whether to use temporary or non-temporary
     * atom parameters for this calculation
     * @returns {Object} - map between atom ids and new label orientations
     */
    findAtomsWithChangedAnchors(byTemp) {
        const orientationParam = byTemp ? 'tempLabelOrientation' : 'labelOrientation';
        const changedLabels = {};
        this.atoms.forEach(atom => {
            if (!atom.isLabel) return;
            const neighbors = this.neighbors[atom.id].map(nb => {
                return this.getAtom(nb.neighbor);
            });
            const newOrientation = atom.calcLabelSide(neighbors, byTemp);
            if (newOrientation !== atom[orientationParam]) {
                changedLabels[atom.id] = newOrientation;
            }
        });
        return changedLabels;
    }
}