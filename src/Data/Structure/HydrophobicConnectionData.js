/**
 * Stores data about all hydrophobic contacts (Spline objects) of one structure present in the
 * scene.
 */
class HydrophobicConnectionData {
    /**
     * Contains instances with data about hydrophobic contacts (Spline objects)
     * belonging to this structure.
     */
    constructor() {
        //Spline object ids
        this.hydrophobicConts = {};
        //links Atom object id -> hydrophobic contact ids -> control point ids
        this.atomControlPointConnections = {};
    }

    /*----------------------------------------------------------------------*/

    /**
     * Memorizes that a hydrophobic contact (by id) belongs to this structure
     * and store the related Spline object.
     *
     * @param hydrophobicId {Number} - unique id of the spline
     * @param spline {Spline} - representation of the hydrophobic contact
     */
    addHydrophobicContact(hydrophobicId, spline) {
        this.hydrophobicConts[hydrophobicId] = spline;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Memorizes that a control point of a spline representing a hydrophobic
     * contact is linked to an atom of the structure (consequently, interaction
     * that affects the atom must also affect this control point).
     *
     * @param atomId {Number} - unique id of the atom to link to
     * @param hydrophobicId {Number} - unique id of the hydrophobic contact
     * @param controlPointId {Number} - unique id of the linked control point
     */
    linkAtomToSplineControlPoint(atomId, hydrophobicId, controlPointId) {
        if (!this.atomControlPointConnections.hasOwnProperty(atomId)) {
            this.atomControlPointConnections[atomId] = {};
        }
        const hLinks = this.atomControlPointConnections[atomId];
        if (!hLinks.hasOwnProperty(hydrophobicId)) {
            hLinks[hydrophobicId] = new Set();
        }
        hLinks[hydrophobicId].add(controlPointId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes linking of a control point of a spline representing a hydrophobic
     * contact to an atom of the structure.
     *
     * @param hydrophobicId {Number} - unique id of the hydrophobic contact
     */
    removeAtomToSplineControlPointLink(hydrophobicId) {
        for (const atomId of Object.keys(this.atomControlPointConnections)) {
            if (this.atomControlPointConnections[atomId]
                .hasOwnProperty(hydrophobicId)) {
                this.atomControlPointConnections[atomId][hydrophobicId] = new Set();
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets the control point ids of all splines associated with this structure.
     *
     * @returns {Object} - control points for each spline
     */
    getSplineControlPointIds() {
        const controlPoints = {};
        for (const hydrophobicId in this.hydrophobicConts) {
            const spline = this.hydrophobicConts[hydrophobicId];
            controlPoints[hydrophobicId] = spline.getControlPointIds();
        }
        return controlPoints;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets the control point ids of all splines linked to given atom ids.
     *
     * @param atomArr {Array} - atom ids to find linked spline control points
     * for
     */
    getSplineControlPointIdsForAtoms(atomArr) {
        const controlPoints = {};
        for (const atomId of atomArr) {
            if (!this.atomControlPointConnections.hasOwnProperty(atomId)) {
                continue;
            }
            const hLinks = this.atomControlPointConnections[atomId];
            for (const hId in hLinks) {
                if (!controlPoints.hasOwnProperty(hId)) {
                    controlPoints[hId] = new Set();
                }
                Helpers.mergeIntoSet(controlPoints[hId], hLinks[hId]);
            }
        }
        return controlPoints;
    }
}