/**
 * Drawer that uses other drawers for the visualization of structure rings.
 */
class RingDrawer {
    /**
     * Contains instances configuration options and data storage/access, draw area manipulation.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     * @param atomDrawer {Object} - drawer for atoms
     * @param edgeDrawer {Object} - drawer for edges
     */
    constructor(opts, sceneData, atomDrawer, edgeDrawer) {
        this.opts = opts;
        this.sceneData = sceneData;
        this.atomDrawer = atomDrawer;
        this.edgeDrawer = edgeDrawer;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Undoes translations applied to SVG groups representing ring systems which
     * were moved in full. Instead, moves the involved atoms to their new positions.
     */
    resetRingSystemMovement(ringSystems) {
        const atomsToUpdate = {};
        for (const structureId in ringSystems) {
            atomsToUpdate[structureId] = [];
            const structure = this.sceneData.structuresData.structures[structureId];
            structure.resetCurOffset();
            ringSystems[structureId].forEach(ringSysId => {
                this.resetRingSkeletonTranslation(structureId, ringSysId);
                structure.ringsData.ringSystems[ringSysId].atoms.forEach(atomId => {
                    atomsToUpdate[structureId].push(atomId);
                });
            });
        }
        this.atomDrawer.moveAtomsToTempCoordinates(atomsToUpdate);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates temporary coordinates of all atoms contained in a ring system
     * specified by id. Note the updated atoms in a provided container.
     *
     * @param offset {Object} - x- and y-offsets to apply to temp coordinates
     * @param structureId {Number} - id of the structure containing the ring
     * system
     * @param ringSysId {Number} - id of the ring system to update atoms of
     * @param changedAtomIds {StructureIdTracker} - container to note which
     * atoms are updated
     */
    updateTempCoordsForRingSystem(offset, structureId, ringSysId, changedAtomIds) {
        const structure = this.sceneData.structuresData.structures[structureId];
        structure.ringsData.ringSystems[ringSysId].atoms.forEach(atomId => {
            AtomDrawer.updateTempCoordsForAtom(structure, atomId, offset, changedAtomIds);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Based on temporary coordinates of atoms affected by interaction, updates
     * all ring systems they are part of.
     *
     * @param ringSystems {Array} - ids of ring systems affected by
     * interaction (per structure)
     */
    updateTempCoordsForAffectedRingSystems(ringSystems) {
        for (const structureId in ringSystems) {
            const structure = this.sceneData.structuresData.structures[structureId];
            ringSystems[structureId].forEach(ringSysId => {
                structure.ringsData.updateRingSystem(ringSysId, true);
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * A variation of molecular movement: Moves entire ring systems based on
     * given offsets. To optimize performance, such ring systems are moved
     * through movement of composite layers of SVG groups. Movement offsets are
     * then noted directly on Structure objects the ring systems are part of.
     *
     * @param ringSystems{Object} - ids of ring systems to move
     * @param offset {Object} - x- and y-offsets to move draw elements by
     */
    moveRingSystems(ringSystems, offset) {
        for (const structureId in ringSystems) {
            const structure = this.sceneData.structuresData.structures[structureId];
            const curOffset = structure.curOffset;
            curOffset.x += offset.x;
            curOffset.y += offset.y;
            ringSystems[structureId].forEach(ringSysId => {
                this.moveRingSkeleton(structureId, ringSysId, curOffset.x, curOffset.y);
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * In a given container, notes that a ring system has to be updated.
     *
     * @param structureId {Number} - id of the structure containing the ring
     * system
     * @param ringSysId {Number} - id of the ring system to be updated
     * @param tracker {StructureIdTracker} - container to note the ring system
     * to update in
     */
    static markRingSystemForTempUpdate(structureId, ringSysId, tracker) {
        if (tracker.hasID(structureId, ringSysId)) return;
        tracker.addID(structureId, ringSysId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves structural skeleton (as groups) of a ring system by specified
     * offsets.
     *
     * @param structureId {Number} - id of structure containing the ring
     * system
     * @param ringSysId {Number} - id of ring systems to move skeleton of
     * @param xOffset {Number} - offset to move ring system by in x-direction
     * @param yOffset {Number} - offset to move ring system by in y-direction
     */
    moveRingSkeleton(structureId, ringSysId, xOffset, yOffset) {
        this.atomDrawer.moveRingAtomSkeleton(structureId, ringSysId, xOffset, yOffset);
        this.edgeDrawer.moveRingEdgeSkeleton(structureId, ringSysId, xOffset, yOffset);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets translations made for a certain ring system
     *
     * @param structureId {Number} - id of structure containing the ring
     * system
     * @param ringSysId {Number} - id of ring systems to reset translations
     * for
     */
    resetRingSkeletonTranslation(structureId, ringSysId) {
        this.atomDrawer.resetRingAtomSkeletonTranslation(structureId, ringSysId);
        this.edgeDrawer.resetRingEdgeSkeletonTranslation(structureId, ringSysId);
    }
}