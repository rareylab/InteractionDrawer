/**
 * Stores data about structure representations of one structure in the scene.
 */
class RepresentationsData {
    /**
     * Contains instances with data about structure representation data.
     */
    constructor(structureType) {
        this.representations = new Set([StructureRepresentation.default]);
        this.currentRepresentation = undefined;
        this.structureType = structureType;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Memorizes what representation belong to this structure.
     *
     * @param representations {Object} - allowed representations for this
     * drawer. It has the form of "structureType: [StructureRepresentation]"
     */
    addAlternativeRepresentations(representations) {
        const allowedRepresentations = representations[this.structureType] ||
            representations.default;
        for (const rep of allowedRepresentations) {
            this.representations.add(rep);
            if (rep === StructureRepresentation.circle) {
                this.structureCircle = {};
                this.selectedStructureCircle = false;
                this.tempSelectedStructureCircle = false;
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns whether the structure has a given representation.
     *
     * @param rep {StructureRepresentation} - name of representation
     */
    hasRepresentation(rep) {
        return this.representations.has(rep);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns the current shown structure representation.
     */
    curRepresentation() {
        return this.currentRepresentation;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns whether the structures current representation is the
     * given representation.
     *
     * @param rep {StructureRepresentation} - name of representation
     */
    isCurRepresentation(rep) {
        return this.currentRepresentation === rep;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Change the representation of this structure to a given representation.
     * If a unknown representation is given change to default.
     *
     * @param representation {StructureRepresentation} - the representation
     * to display
     */
    changeInternalRepresentation(representation = StructureRepresentation.default) {
        if (representation === this.curRepresentation() ||
            !this.hasRepresentation(representation)) {
            return;
        }
        this.currentRepresentation = representation
    }

    /*----------------------------------------------------------------------*/

    /**
     * Marks structure circle as selected in internal selection set.
     */
    selectStructureCircle() {
        this.selectedStructureCircle = true;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Marks structure circle as selected in internal selection set, but only
     * for temporary means not to be committed into the drawer's history.
     */
    tempSelectStructureCircle() {
        this.tempSelectedStructureCircle = true;
    }
}