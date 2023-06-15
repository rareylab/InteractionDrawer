/**
 * Base class for representation of text label information in the drawer's memory. Used for
 * annotations.
 */
class TextLabel {
    /**
     * Creates a new TextLabel object.
     *
     * @param id {Number} - internal id of text label
     * @param label {String} - text of the label
     * @param coordinates {Object} - placement of the label, object with x- and
     * y-coordinates
     * @param color {String} - color text should appear in
     * @param additionalInformation {Object} - custom additional information
     * that is saved but does not belong to the drawer itself
     */
    constructor(id, label, coordinates, color, additionalInformation) {
        this.id = id;
        this.label = label;
        this.additionalInformation = additionalInformation;
        this.coordinates = Object.assign({}, coordinates);
        this.tempCoordinates = Object.assign({}, coordinates);
        this.color = color; //may be undefined
        this.enabled = true;

        //to check actual space taken by text (e.g. used to center the view)
        this.drawLimits = null;
        this.globalDrawLimits = null;
        this.surroundingRect = null;

        //to check collisions of elements with the selector
        this.selectorShapes = [];
        this.tempSelectorShapes = [];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Represents movement of a text label by a certain offset.
     *
     * @param offset {Object} - object to represent x- and y-movement
     * @param byTemp {Boolean}- whether movement is temporary (not logged to
     * history) or not
     */
    addOffsetToCoords(offset, byTemp = false) {
        const coords = byTemp ? this.tempCoordinates : this.coordinates;
        coords.x = coords.x + offset.x;
        coords.y = coords.y + offset.y;
        if (!byTemp) {
            this.tempCoordinates = Object.assign({}, coords);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds representation of draw limits after creating draw element for the
     * label (for placement concerns).
     *
     * @param drawLimits {Array} - object containing draw limits as minima
     * and maxima of the text label's bounding box
     * (as xMin, xMax, yMin, yMax)
     * @param rectBoundaries {Array} - object containing boundaries as minima
     * and maxima of the text label's bounding box (as xMin, xMax, yMin,
     * yMax). If present those will be taken to calculate the surrounding rect
     */
    setDrawLimits(drawLimits, rectBoundaries = undefined) {
        this.drawLimits = JSON.parse(JSON.stringify(drawLimits));
        const globalDrawLimits = {
            xMin: Infinity, xMax: -Infinity, yMin: Infinity, yMax: -Infinity
        };
        drawLimits.forEach(({limits: curDrawLimits}) => {
            if (curDrawLimits.xMin < globalDrawLimits.xMin) {
                globalDrawLimits.xMin = curDrawLimits.xMin;
            }
            if (curDrawLimits.xMax > globalDrawLimits.xMax) {
                globalDrawLimits.xMax = curDrawLimits.xMax;
            }
            if (curDrawLimits.yMin < globalDrawLimits.yMin) {
                globalDrawLimits.yMin = curDrawLimits.yMin;
            }
            if (curDrawLimits.yMax > globalDrawLimits.yMax) {
                globalDrawLimits.yMax = curDrawLimits.yMax;
            }
        });
        this.globalDrawLimits = globalDrawLimits;
        const {xMin, xMax, yMin, yMax} = (rectBoundaries && rectBoundaries[0].limits) || drawLimits;
        this.surroundingRect = PolygonCalculation.createRectByBoundaries(xMin, xMax, yMin, yMax);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds representation of the surrounding selector shape of the text label
     * after creating its draw element.
     *
     * @param selectorShapes {Array} - different selector shapes, objects
     * holding both 'type' and 'coordinates' field
     * @param byTemp {Boolean}- whether movement is temporary (not logged to
     * history) or not
     */
    setSelectorShapes(selectorShapes, byTemp = false) {
        this.tempSelectorShapes = selectorShapes;
        if (!byTemp) {
            this.selectorShapes = JSON.parse(JSON.stringify(selectorShapes));
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Given different hit functions, checks whether the text label is hit by
     * certain other draw elements. The provided callbacks must define which
     * elements to check for, as none are passed into this function. Hit tests
     * selector shapes and the text label itself by approximation over its
     * bounding box.
     *
     * @param circleHitFunction {Function} - function to hit test circle
     * elements
     * @param rectHitFunction {Function} - function to hit test rectangular
     * elements
     * @returns {Boolean} - whether the label is hit by provided functions
     */
    testHitFunctionsForSelection({circleHitFunction, rectHitFunction}) {
        const selShapes = this.selectorShapes;
        //test hits with overall text (appropriated by text box)
        if (rectHitFunction(this.surroundingRect)) {
            return true;
        }
        //test hits with individual selectors (currently just circles)
        for (let i = 0, len = selShapes.length; i < len; ++i) {
            const selShape = selShapes[i];
            if (selShape.type === 'circle') {
                if (circleHitFunction) {
                    //convert shape to circle format used in Geometry
                    const {coordinates: {x, y}, rad} = selShape;
                    const circle = {
                        x: x, y: y, rad: rad
                    };
                    if (circleHitFunction(circle)) {
                        return true;
                    }
                }
            } else if (selShape.type === 'line') {
                if (rectHitFunction && rectHitFunction(selShape.corners)) {
                    return true;
                }
            }
        }
        return false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates a deep copy of this TextLabel object.
     *
     * @returns {TextLabel} cloned TextLabel object
     */
    clone() {
        const clone = new TextLabel(this.id,
            this.label,
            this.coordinates,
            this.color,
            this.additionalInformation
        );
        this.transferParameters(clone);
        return clone;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Transfers important parameters of this object to a new object during the
     * cloning process.
     *
     * @param clone {TextLabel} - text label to refer parameters to
     */
    transferParameters(clone) {
        clone.drawLimits = JSON.parse(JSON.stringify(this.drawLimits));
        clone.globalDrawLimits = JSON.parse(JSON.stringify(this.globalDrawLimits));
        clone.surroundingRect = JSON.parse(JSON.stringify(this.surroundingRect));
        clone.selectorShapes = JSON.parse(JSON.stringify(this.selectorShapes));
        clone.tempSelectorShapes = JSON.parse(JSON.stringify(this.tempSelectorShapes));
    }
}

/**
 * Class for representation of annotation text labels. Extends base TextLabel
 * class by memorization of related structures and atoms.
 */
class Annotation extends TextLabel {
    /**
     * Creates a new Annotation object.
     *
     * @param id {Number} - internal id of the annotation
     * @param label {String} - text of the label
     * @param coordinates {Object} - placement of the label, object with x- and
     * y-coordinates
     * @param color {String} - color text should appear in
     * @param structureLink {Number} - structure the annotation belongs to
     * @param atomLinks {Array} - ids of atoms the annotations should mimic
     * interaction for (e.g., follow the same movement)
     * @param type {String} - type of the annotation ('structure', 'structureSpline')
     * @param belongsToStructure {Boolean} - true if Annotation is connected to a structure
     * @param isStructureLabel {Boolean} - if the annotation is (a part of) the
     * structure label or name. Those annotations will be hidden when the the
     * linked structure is shown as structure circle
     * @param additionalInformation {Object} - custom additional information
     * that is saved but does not belong to the drawer itself
     */
    constructor({
        id,
        label,
        coordinates,
        color,
        structureLink,
        atomLinks,
        type,
        belongsToStructure,
        isStructureLabel,
        additionalInformation
    }) {
        super(id, label, coordinates, color, additionalInformation);
        this.structureLink = structureLink;
        this.atomLinks = atomLinks;
        this.type = type;
        this.belongsToStructure = belongsToStructure;
        this.isStructureLabel = isStructureLabel;
        this.structureRepresentationInfo = {};
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates a deep copy of this Annotation object.
     *
     * @returns {Annotation} - cloned Annotation object
     */
    clone() {
        const createParams = {
            id: this.id,
            label: this.label,
            coordinates: Object.assign({}, this.coordinates),
            color: this.color,
            structureLink: this.structureLink,
            atomLinks: this.atomLinks.slice(),
            type: this.type,
            belongsToStructure: this.belongsToStructure,
            isStructureLabel: this.isStructureLabel,
            structureRepresentationInfo: JSON.parse(JSON.stringify(this.structureRepresentationInfo)),
            additionalInformation: Object.assign({}, this.additionalInformation)
        };
        const clone = new Annotation(createParams);
        this.transferParameters(clone);
        return clone;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates alternative coordinates of the annotation.
     *
     * @param structureRep {StructureRepresentation} - the current
     * representation of the Structure object the annotation belongs to
     * @param structureMoved {Boolean} - whether the complete structure moved
     * or just the (atom and) annotation
     * @param offsets {Object} - x- and y-values of vector to move coordinates
     * @param interactionMode {InteractionMode} - the applied interaction mode
     * @param altRotCoords {Object} - rotation coordinates for the not
     * StructureRepresentation currently not in use
     * @param newStructureMid {Object} - x- and y-values of the structure mid
     * after coordination changes
     * @param oldStructureMid {Object} - x- and y-values of the structure mid
     * before coordination changes
     * @param dimensions {Object} - object containing width and height of the
     * annotation (bbox)
     */
    updateAlternativeRepresentationCoords(structureRep,
        structureMoved,
        offsets,
        interactionMode,
        altRotCoords,
        newStructureMid,
        oldStructureMid,
        dimensions
    ) {
        for (const [rep, info] of Object.entries(this.structureRepresentationInfo)) {
            const repInfoObj = this.structureRepresentationInfo[rep];
            switch (interactionMode) {
                case InteractionMode.movement:
                    if (structureMoved || rep == structureRep) {
                        repInfoObj.coordinates =
                            VectorCalculation.vectorAdd(info.coordinates, offsets);
                    }
                    if (!structureMoved && rep == StructureRepresentation.circle && structureRep ==
                        StructureRepresentation.circle) {

                        const {
                            dist, relativePosition
                        } = PolygonCalculation.getClosestPointOnRectangle(newStructureMid, {
                            xMin: repInfoObj.coordinates.x - dimensions.width / 2,
                            xMax: repInfoObj.coordinates.x + dimensions.width / 2,
                            yMin: repInfoObj.coordinates.y - dimensions.height / 2,
                            yMax: repInfoObj.coordinates.y + dimensions.height / 2
                        });
                        repInfoObj.distToCircleMid = dist;
                        repInfoObj.circleMidIsInside = relativePosition === RelativePosition.inside;
                    }
                    break;
                case InteractionMode.rotation:
                    if (rep != structureRep && altRotCoords) {
                        repInfoObj.coordinates = Object.assign({}, altRotCoords);
                    } else if (rep == structureRep) {
                        repInfoObj.coordinates =
                            VectorCalculation.vectorAdd(info.coordinates, offsets);
                    }
                    break;
                case InteractionMode.lineMirror:
                case InteractionMode.bondMirror:
                    if (rep == structureRep && offsets) {
                        repInfoObj.coordinates =
                            VectorCalculation.vectorAdd(info.coordinates, offsets);
                    } else if (rep == StructureRepresentation.circle) {
                        const offs = VectorCalculation.vectorSubstract(newStructureMid,
                            oldStructureMid
                        );
                        repInfoObj.coordinates =
                            VectorCalculation.vectorAdd(info.coordinates, offs);
                    }
                    break;
            }
        }
    }
}

/**
 * Class for representation of atom text labels. Extends functionality of
 * base TextLabel class for atom specific (chemically motivated) functions.
 */
class Atom extends TextLabel {
    /**
     * Creates a new Atom object.
     *
     * @param id {Number}- internal id (within structure) of atom
     * @param element {String} - one/two letter code for atom's element
     * @param label {String} - text of the label
     * @param charge {Number} - charge of the atom, to draw as separate text
     * element
     * @param hydrogenCount {Number} - hydrogen count of atom, to draw as
     * separate text
     * element {String} - one/two letter code of atom's element
     * @param coordinates {Object} - placement of the label, object with x- and
     * y-coordinates
     * @param color {String} - color text should appear in
     * @param aromatic {Boolean} - whether atom is part of aromatic ring system
     * @param stereoCenter {Boolean} - whether atom is stereo center
     * @param additionalInformation {Object} - custom additional information
     * that is saved but does not belong to the drawer itself
     */
    constructor({
        id,
        element,
        label,
        charge,
        hydrogenCount,
        coordinates,
        color,
        aromatic,
        stereoCenter,
        additionalInformation
    }) {
        super(id, label, coordinates, color, additionalInformation);

        this.element = element;
        this.charge = charge;

        //keep track of aromatic rings (if there are any and which this atom is
        //part of)
        this.aromatic = aromatic;
        this.rings = new Set();
        this.aromaticRings = new Set();
        this.isInRing = false;

        this.stereoCenter = stereoCenter ? stereoCenter : false;
        this.connectedComponent = undefined;
        this.ringSystem = undefined;

        this.hydrogenCount = hydrogenCount;
        this.hydrogenOrientation = undefined;
        this.tempHydrogenOrientation = undefined;

        //if atom should be treated as (amino acid) label
        this.isLabel = (!!this.label && this.label.length > 2 && !this.hydrogenCount);
        this.labelOrientation = undefined;
        this.tempLabelOrientation = undefined;

        this.wn = 0; //winding number for free selector
    }

    /*----------------------------------------------------------------------*/

    /**
     * Marks atom as part of ring with given id.
     *
     * @param ringId {Number} - ring the atom is part of
     */
    addRing(ringId) {
        this.rings.add(ringId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Marks atom as part of aromatic ring with given id.
     *
     * @param ringId {Number} - aromatic ring the atom is part of
     */
    addAromaticRing(ringId) {
        this.aromaticRings.add(ringId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets the hydrogen count of this atom, based on its element and given
     * number of outgoing bonds.
     *
     * @param nrEdges {Number} - number of bonds from this atom
     */
    calcHydrogenCount(nrEdges) {
        this.hydrogenCount = this.calcExpectedHCount(nrEdges);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Calculates the hydrogen count of this atom, based on its element and
     * given number of outgoing bonds.
     *
     * @param nrEdges {Number} - number of bonds from this atom
     * @returns {Number} - atom's hydrogen count
     */
    calcExpectedHCount(nrEdges) {
        const maxPossibleBonds = AtomInfo.maxPossibleBonds(this.element);
        if (maxPossibleBonds === -1) {
            return 0;
        }
        const aromaticBonds = this.aromatic ? 1 : 0;
        return Math.max(maxPossibleBonds - nrEdges - aromaticBonds + this.charge, 0);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets current hydrogen orientation of atom text, to be committed to the
     * drawer's history.
     *
     * @param orientation {String} - 'left', 'right', 'down', or 'up'
     */
    setHydrogenOrientation(orientation) {
        this.hydrogenOrientation = orientation;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets current hydrogen orientation of atom text, NOT to be committed to
     * the drawer's history.
     *
     * @param orientation {String} - 'left', 'right', 'down', or 'up'
     */
    setTempHydrogenOrientation(orientation) {
        this.tempHydrogenOrientation = orientation;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets current label orientation of atom representing amino acid label.
     *
     * @param orientation {String} - 'left', 'right', 'up', or 'down'
     * @param byTemp {Boolean} - whether to apply orientation only to
     * temporary data
     */
    setLabelSide(orientation, byTemp) {
        this.tempLabelOrientation = orientation;
        if (!byTemp) {
            this.labelOrientation = orientation;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds out in which direction, based of the main atom (element) text the
     * text for hydrogen representation should be drawn.
     *
     * @param neighbors {Array} - neighboring Atom objects of this atom
     * @param byTemp {Boolean} - if temporary coordinates should be used for
     * calculation
     * @returns {String} - the atom's hydrogen orientation -> 'left', 'right',
     * 'up' or 'down'
     */
    calcHydrogenOrientation(neighbors, byTemp) {
        const permitUpDown = neighbors.length !== 1;
        return this.findAtomSideMostSpace(neighbors, byTemp, permitUpDown);
    }

    /*----------------------------------------------------------------------*/

    /**
     * If this Atom object represents an amino acid label, finds the side its
     * neighboring bond should dock on.
     *
     * @param neighbors {Array} - neighboring Atom objects of this atom
     * @param byTemp {Boolean} - if temporary coordinates should be used for
     * calculation
     * @returns {String} - the side the neighboring bond should dock on ->
     * 'left', 'right', 'up' or 'down'
     */
    calcLabelSide(neighbors, byTemp) {
        switch (this.findAtomSideMostSpace(neighbors, byTemp, true)) {
            case 'left':
                return 'right';
            case 'right':
                return 'left';
            case 'up':
                return 'down';
            case 'down':
                return 'up';
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds out which side of the atom offers the most free space based on the
     * positions of its neighbors.
     *
     * @param neighbors {Array} - neighboring Atom objects of this atom
     * @param byTemp {Boolean} - if temporary coordinates should be used for
     * calculation
     * @param permitUpDown {Boolean} - whether direction can be 'up' or
     * 'down' (sometimes this should be suppressed for cleaner drawing)
     * @returns {String} - the side with most free space -> 'left', 'right',
     * 'up' or 'down'
     */
    findAtomSideMostSpace(neighbors, byTemp, permitUpDown) {
        const coordParam = byTemp ? 'tempCoordinates' : 'coordinates';
        const center = this[coordParam];
        const nbCoords = neighbors.map(nb => nb[coordParam]);
        return PointCalculation.findSideMostSpace(center, nbCoords, permitUpDown);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks if the atom is a hydrogen.
     *
     * @returns {Boolean} - true if the atom is a hydrogen, else false
     */
    isHydrogen() {
        return this.element === 'H';
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks if the atom is a metal.
     *
     * @returns {Boolean} - true if the atom is a metal, else false
     */
    isMetal() {
        return AtomInfo.metalElements.includes(this.element)
    }

    /*----------------------------------------------------------------------*/

    /**
     * Create a deep copy of this Atom object.
     *
     * @returns {Atom} - cloned Atom object
     */
    clone() {
        const createParams = {
            id: this.id,
            element: this.element,
            label: this.label,
            charge: this.charge,
            hydrogenCount: this.hydrogenCount,
            coordinates: Object.assign({}, this.coordinates),
            color: this.color,
            aromatic: this.aromatic,
            stereoCenter: this.stereoCenter,
            rings: new Set(this.rings),
            aromaticRings: new Set(this.aromaticRings),
            additionalInformation: Object.assign({}, this.additionalInformation)
        };
        const clone = new Atom(createParams);
        this.transferParameters(clone);
        clone.connectedComponent = this.connectedComponent;
        clone.ringSystem = this.ringSystem;
        clone.hydrogenOrientation = this.hydrogenOrientation;
        clone.tempHydrogenOrientation = this.tempHydrogenOrientation;
        return clone;
    }
}