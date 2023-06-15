/**
 * Base interface for different classes of bond representations.
 */
class EdgeInterface {
    /**
     * Creates a new EdgeInterface object.
     *
     * @param from {Number} - id of first object this edge connects
     * @param to {Number} - id of second object this edge connects
     */
    constructor(from, to) {
        this.from = from;
        this.to = to;

        this.enabled = true;
        this.hidden = true; //start out as hidden / not drawn

        this.wn = 0;

        //properties set after calculating the edge points
        this.drawInfo = null;

        //properties that have to be set temporarily
        this.tempHidden = true;
        this.tempDrawInfo = null;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Transfers state of temporary parameters to their history relevant counterparts.
     */
    transferTempInformation() {
        this.transferTempDrawInfo();
        this.transferTempHidden();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Provides relevant information to draw the bond in the draw area.
     *
     * @param drawInfo {Object} - relevant draw info. Must provide the
     * following fields:
     * drawPoints -> relevant points of main representation (drawn lines)
     * midpoints -> midpoints on each side of lines
     * edgeCollisionPoints -> points to test for collision of drawn LINES
     * selCollisionPoints -> points to test for collision of SELECTOR
     * selWidth -> width of surrounding selector
     * @param byTemp {Boolean} - whether this info is used for a temporary or
     * history relevant state
     */
    setDrawInfo(drawInfo, byTemp) {
        this.tempDrawInfo = drawInfo;
        if (!byTemp) {
            this.transferTempDrawInfo();
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets collision points for hit test on this edge, based on specified mode,
     * either based only on drawn lines, or on the surrounding selector shape.
     *
     * @param mode {String} - 'selector', or 'drawingOnly'
     * @returns {Array} - the relevant test points
     */
    getCollisionPointsByMode(mode) {
        if (mode === 'selector') {
            return this.getSelectorCollisionPoints();
        } else if (mode === 'drawingOnly') {
            return this.getCollisionPoints();
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets collision points for hit test on the edge's drawn lines.
     */
    getCollisionPoints() {
        if (!this.drawInfo) {
            return null;
        }
        return this.drawInfo.edgeCollisionPoints;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets collision points for hit test on the edge's selector shape.
     */
    getSelectorCollisionPoints() {
        if (!this.drawInfo) {
            return null;
        }
        return this.drawInfo.selCollisionPoints;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Transfers temporary draw info to history relevant this.drawInfo.
     */
    transferTempDrawInfo() {
        const tempDrawInfo = this.tempDrawInfo;
        if (!tempDrawInfo) {
            this.drawInfo = null;
        } else {
            this.drawInfo = Object.assign({}, tempDrawInfo);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets whether the edge should currently be drawn or hidden.
     *
     * @param hidden {Boolean} - whether to hide the edge or not
     * @param byTemp {Boolean} - whether the edge is only hidden in temporary
     * or also in a history relevant state
     */
    setHidden(hidden, byTemp) {
        this.tempHidden = hidden;
        if (!byTemp) {
            this.transferTempHidden();
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Transfers temporary information of hidden state to history relevant this.hidden.
     */
    transferTempHidden() {
        this.hidden = this.tempHidden;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Base for clone implementation of inheriting classes. Transfers relevant
     * parameter information to a given clone.
     *
     * @param clone {EdgeInterface} - clone to transfer parameters to
     */
    setCloneProperties(clone) {
        const cloneDrawInfo = ({
            edgeCollisionPoints, selCollisionPoints, drawPoints, midpoints, selWidth
        }) => {
            const clonedEdgeCollisionPoints = Helpers.cloneArrayOfObjects(edgeCollisionPoints);
            const clonedSelCollisionPoints = Helpers.cloneArrayOfObjects(selCollisionPoints);
            const clonedDrawPoints = [];
            drawPoints.forEach(drawPointArr => {
                clonedDrawPoints.push(Helpers.cloneArrayOfObjects(drawPointArr));
            });
            const clonedMidpoints = Helpers.cloneArrayOfObjects(midpoints);
            return {
                drawPoints: clonedDrawPoints,
                midpoints: clonedMidpoints,
                edgeCollisionPoints: clonedEdgeCollisionPoints,
                selCollisionPoints: clonedSelCollisionPoints,
                selWidth: selWidth
            }
        };
        clone.hidden = this.hidden;
        clone.tempHidden = this.tempHidden;
        clone.enabled = this.enabled;
        clone.drawInfo = cloneDrawInfo(this.drawInfo);
        clone.tempDrawInfo = cloneDrawInfo(this.tempDrawInfo);
    }
}

/**
 * Class for representing a bond inside of a structure.
 */
class Edge extends EdgeInterface {
    /**
     * Creates a new Edge object.
     *
     * @param type {String} - type of bond - 'single', 'double', 'triple',
     * 'stereoFront', 'stereoFrontReverse', 'stereoBack',
     * 'stereoBackReverse'
     * @param id {Number} - internal id of bond in structure
     * @param from {Number} - id of first connected atom
     * @param to {Number} - id of second connected atom
     * @param aromatic {Boolean} - whether bond is part of aromatic ring system
     */
    constructor({type, id, from, to, aromatic}) {
        super(from, to);
        this.type = type;
        this.id = id;
        this.from = from;
        this.to = to;
        this.aromatic = aromatic;
        this.cyclic = true;

        this.rings = new Set();
        this.aromaticRings = new Set();

        //used for calculations
        this.bcc = undefined;
        this.ringSystem = undefined;

        //information on how to draw double bonds
        this.drawWithOffset = undefined;
        this.drawnInRing = undefined;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Marks bond as part of ring with given id.
     *
     * @param ringId {Number} - ring the bond is part of
     */
    addRing(ringId) {
        this.rings.add(ringId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Marks bond as part of aromatic ring with given id.
     *
     * @param ringId {Number} - aromatic ring the bond is part of
     */
    addAromaticRing(ringId) {
        this.aromaticRings.add(ringId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns true if the edge is aromatic and not part of an aromatic ring.
     *
     */
    isAromaticNoRing() {
        return this.aromatic && this.aromaticRings.size == 0 && !this.cyclic;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates a deep copy of this Edge object.
     *
     * @returns {Edge} - cloned Edge object
     */
    clone() {
        const clone = new Edge(this);
        this.setCloneProperties(clone);
        clone.bcc = this.bcc;
        clone.ringSystem = this.ringSystem;
        clone.cyclic = this.cyclic;
        clone.drawWithOffset = this.drawWithOffset;
        clone.wn = this.wn; //probably will always be 0, but added just in case
        return clone;
    }
}

/**
 * Class for representing a bond between different structures.
 */
class IntermolecularEdge extends EdgeInterface {
    /**
     * Creates a new IntermolecularEdge object.
     *
     * @param id {Number} - internal id of intermolecular edge
     * @param from {Number} - id of first atom to connect
     * @param to {Number} - id of second atom to connect
     * @param fromStructure {Number} - id of first structure to connect
     * @param toStructure {Number} - id of second structure to connect
     * @param color {String} - color of intermolecular edge
     * @param additionalInformation {Object} - custom additional information
     * that is saved but does not belong to the drawer itself
     */
    constructor(id, from, to, fromStructure, toStructure, color, additionalInformation) {
        super(from, to);
        this.id = id;
        this.fromStructure = fromStructure;
        this.toStructure = toStructure;
        this.color = color;
        this.additionalInformation = additionalInformation;

        this.selected = false;
        this.tempSelected = false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Create a deep copy of this IntermolecularEdge object.
     *
     * @returns {IntermolecularEdge} - cloned IntermolecularEdge object
     */
    clone() {
        const clone = new IntermolecularEdge(
            this.id,
            this.from,
            this.to,
            this.fromStructure,
            this.toStructure,
            this.color,
            Object.assign({}, this.additionalInformation)
        );
        this.setCloneProperties(clone);
        return clone;
    }
}