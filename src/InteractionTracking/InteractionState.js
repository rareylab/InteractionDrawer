/**
 * Class that keeps track of user interactions with the draw area and
 * and currently interacted with draw objects.
 */
class InteractionState {
    /**
     * Contains objects for configuration options, tracking and data access and
     * sets interaction states to default.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     */
    constructor(opts, sceneData) {
        this.opts = opts;
        this.sceneData = sceneData;

        this.reset();
        if (this.opts.allowInteraction) {
            this.setMouseDefaultInteractionState();
        }
        this.drawAreaHovered = false;
        this.selectionHovered = false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Set many important containers for structural information tracking to their
     * default (often empty) state. Useful when resetting the scene.
     */
    reset() {
        //current transformations on draw area (set when loading structures)
        this.transformParams = {
            scale: 1, translate: {
                x: 0, y: 0
            }, centerTranslate: {
                x: 0, y: 0
            }
        };

        //object to track draw objects with which the user currently interacts
        this.interaction = new InteractionObject(this.opts.selectionGrace);

        //interaction - for selection
        this.selectionPoints = [];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Set info relevant for all types of mouse interaction.
     */
    setMouseDefaultInteractionState() {
        this.cursorPos = null;
        this.mirrorLineInfo = {
            endpoints: {
                first: undefined, second: undefined
            }, structure: undefined
        };
        this.addIntermolecularType = IntermolecularType[Object.keys(IntermolecularType)[0]];
        this.addAtomType = {edit: false, element: 'C'};
        this.editType = EditType[Object.keys(EditType)[0]];
        this.resetEditType = false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Set what kind of atom gets added during the 'addAtom' mode and if an atom edit form
     * should be opened afterward.
     *
     * @param modeData {Object} - defines the data of the atom and how to handle it
     */
    setAddAtomType(modeData) {
        this.addAtomType = modeData;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Set the type of what intermolecular interaction gets added during the
     * 'addIntermolecular' mode.
     *
     * @param type {String} - the interaction type (atomPairInteraction, piStacking,
     * cationPiStacking, hydrophobicContact)
     */
    setAddIntermolecularType(type) {
        if (Object.keys(IntermolecularType).includes(type)) {
            this.addIntermolecularType = IntermolecularType[type];
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Set the type of what object gets edited during the 'edit' mode.
     *
     * @param type {String} - the object type (atom, bond, annotation)
     */
    setEditType(type) {
        if (Object.keys(EditType).includes(type)) {
            this.editType = EditType[type];
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * The line mirror mode operates in two stages: choosing a structure to
     * apply mirroring to, and choosing the line to mirror on. This function is
     * used to alternate between the two stages and to adjust the object used
     * to track changes during interaction.
     */
    setNextLineMirrorMode() {
        const curMode = this.interaction.lineMirror.curMode;
        let nextIdentifier, nextMode;
        if (curMode === InteractionMode.lineMirror) {
            nextIdentifier = 'mirrorSelect';
            nextMode = InteractionMode.mirrorSelect;
        } else if (curMode === InteractionMode.mirrorSelect) {
            nextIdentifier = 'lineMirror';
            nextMode = InteractionMode.lineMirror;
        }
        if (this.opts.defaultInteraction === curMode) {
            this.setDefaultInteraction(nextIdentifier, true);
        }
        this.interaction.lineMirror.curMode = nextMode;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets the default interaction mode to be chosen during user interaction
     * start when no modifier combinations of any other mode are met.
     *
     * @param identifier {String} - identifier string of the movement mode, see
     * the InteractionMode object in Enums.js
     * @param directSet {Boolean} - whether to also set this interaction mode
     * as the current interaction mode
     */
    setDefaultInteraction(identifier, directSet = false) {
        if (!InteractionMode.hasOwnProperty(identifier)) {
            console.log('Cannot set default interaction mode: Drawer does ' +
                `not recognize mode "${identifier}".`);
            return;
        }
        if (!this.opts.allowedInteraction.includes(identifier)) {
            console.log('Cannot set default interaction mode: Mode ' +
                `"${identifier}" is disabled by configuration.`);
            return;
        }
        const mode = InteractionMode[identifier];
        this.opts.defaultInteraction = mode;
        if (directSet) {
            this.setInteractionMode(mode);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets the user interaction mode.
     *
     * @param interactionMode {Number} - enum number of the interaction mode,
     * see the InteractionMode object in Enums.js
     */
    setInteractionMode(interactionMode) {
        this.interaction.mode = interactionMode;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Notes elements to be affected by the edge mirror interaction mode based
     * the currently hovered bond.
     *
     * @param structureId {Number} - id of the structure the hovered bond
     * belongs to
     * @param edgeId {Number} - id of the hovered bond
     */
    setInteractionEdgeMirror(structureId, edgeId) {
        if (this.interaction.mirror.edge.edgeId !== edgeId) {
            this.interaction.resetMirrorInfo();
            this.interaction.mirror.edge = {
                structureId: structureId, edgeId: edgeId
            };
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Notes elements to be affected by the rotation interaction mode based on
     * the currently hovered structure.
     *
     * @param structureId {Number} - id of the hovered structure
     * @param selectionHovered {Boolean} - element is currently hovered
     */
    setInteractionRotation(structureId, selectionHovered) {
        const rotation = this.interaction.rotation;
        if (selectionHovered) {
            const structure = this.sceneData.structuresData.structures[structureId];
            const structures = [], moveUnit = {};
            if (this.opts.moveFreedomLevel === 'structures') {
                this.getAffectedStructuresNoFreedom(selectionHovered,
                    structureId,
                    structure,
                    moveUnit,
                    structures
                );
            }
            //get all affected elements from structures
            const allAnnotations = new Set(), allDistances = new Set(), allInteractions = new Set(),
                allAtomPairInteractions = new Set(), allPiStackings = new Set(),
                allCationPiStackings = new Set(), allSplines = {};
            const merge = (connectedElements) => {
                const {
                    annotations,
                    distances,
                    interactions,
                    atomPairInteractions,
                    piStackings,
                    cationPiStackings,
                    splineControlPoints
                } = connectedElements;
                Helpers.mergeIntoSet(allAnnotations, annotations);
                Helpers.mergeIntoSet(allDistances, distances);
                Helpers.mergeIntoSet(allInteractions, interactions);
                Helpers.mergeIntoSet(allAtomPairInteractions, atomPairInteractions);
                Helpers.mergeIntoSet(allPiStackings, piStackings);
                Helpers.mergeIntoSet(allCationPiStackings, cationPiStackings);
                for (const splineId in splineControlPoints) {
                    allSplines[splineId] = splineControlPoints[splineId];
                }
            };
            structures.forEach(id => {
                const fullStructure = this.sceneData.structuresData.structures[id];
                merge(fullStructure.getConnectedElements());
            });
            rotation.type = 'multipleStructures';
            rotation.structures = structures;
            rotation.annotations = allAnnotations;
            rotation.distances = allDistances;
            rotation.interactions = allInteractions;
            rotation.atomPairInteractions = allAtomPairInteractions;
            rotation.piStackings = allPiStackings;
            rotation.cationPiStackings = allCationPiStackings;
            rotation.splineControlPoints = allSplines;
        } else {
            const structure = this.sceneData.structuresData.structures[structureId];
            const {
                annotations,
                distances,
                interactions,
                atomPairInteractions,
                piStackings,
                cationPiStackings,
                splineControlPoints
            } = structure.getConnectedElements();
            rotation.type = 'singleStructure';
            rotation.structures = [structureId];
            rotation.annotations = annotations;
            rotation.distances = distances;
            rotation.interactions = interactions;
            rotation.atomPairInteractions = atomPairInteractions;
            rotation.piStackings = piStackings;
            rotation.cationPiStackings = cationPiStackings;
            rotation.splineControlPoints = splineControlPoints;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Notes elements to be affected by the line mirror interaction mode based
     * on the currently hovered structure.
     *
     * @param structureId {Number} - id of the hovered structure
     */
    setInteractionLineMirror(structureId) {
        const structure = this.sceneData.structuresData.structures[structureId];
        const {annotations, splineControlPoints} = structure.getConnectedElements();
        const lineMirror = this.interaction.lineMirror;
        lineMirror.curStructureId = structureId;
        lineMirror.annotations = annotations;
        lineMirror.splineControlPoints = splineControlPoints;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Notes elements to be affected by the rotation interaction mode when the
     * entire scene shall be rotated.
     */
    setInteractionRotationFullScene() {
        const rotation = this.interaction.rotation;
        rotation.type = 'fullScene';
        rotation.structures = Object.keys(this.sceneData.structuresData.structures);
        rotation.annotations = new Set(Object.keys(this.sceneData.annotationsData.annotations));
        const intermolecularData = this.sceneData.intermolecularData;
        rotation.distances = new Set(Object.keys(intermolecularData.distances));
        rotation.interactions = new Set(Object.keys(intermolecularData.interactions));
        rotation.atomPairInteractions =
            new Set(Object.keys(intermolecularData.atomPairInteractions));
        rotation.piStackings = new Set(Object.keys(intermolecularData.piStackings));
        rotation.cationPiStackings = new Set(Object.keys(intermolecularData.cationPiStackings));
        const controlPoints = {};
        const hydrophobicContacts = this.sceneData.hydrophobicData.hydrophobicContacts;
        for (const hydrophobicId in hydrophobicContacts) {
            const spline = hydrophobicContacts[hydrophobicId];
            controlPoints[hydrophobicId] = spline.getControlPointIds();
        }
        rotation.splineControlPoints = controlPoints;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Notes elements to be affected by the movement interaction mode based on
     * the currently hovered atoms, bonds and structure circles.
     *
     * @param structureId {Number} - id of the structure the hovered element
     * belongs to
     * @param id {Number} - id of the hovered element
     * @param type {String} - type of the hovered element ('atom' or 'edge')
     * @param selectionHovered {Boolean} - element is currently hovered
     */
    setInteractionMovement(structureId, id, type, selectionHovered) {
        const structure = this.sceneData.structuresData.structures[structureId];
        //find out which elements are affected by movement
        const fullStructures = [], partialStructures = [], moveUnit = {};
        if (this.opts.moveFreedomLevel === 'structures' || type === 'structureCircle') {
            this.getAffectedStructuresNoFreedom(selectionHovered,
                structureId,
                structure,
                moveUnit,
                fullStructures
            );
        } else { //harder case, need to obtain values first
            if (selectionHovered && this.opts.moveFreedomLevel !== 'rings') {
                this.getAffectedRingsFreedom(moveUnit, fullStructures, partialStructures);
            } else {
                this.getAffectedFullFreedom(structureId,
                    id,
                    type,
                    structure,
                    moveUnit,
                    fullStructures,
                    partialStructures
                );
            }
        }
        //get all affected elements from full and partial affected structures
        const allAnnotations = new Set(), allDistances = new Set(), allInteractions = new Set(),
            allAtomPairInteractions = new Set(), allPiStackings = new Set(),
            allCationPiStackings = new Set(), allSplines = {};
        const merge = (connectedElements) => {
            const {
                annotations,
                distances,
                interactions,
                atomPairInteractions,
                piStackings,
                cationPiStackings,
                splineControlPoints
            } = connectedElements;
            Helpers.mergeIntoSet(allAnnotations, annotations);
            Helpers.mergeIntoSet(allDistances, distances);
            Helpers.mergeIntoSet(allInteractions, interactions);
            Helpers.mergeIntoSet(allAtomPairInteractions, atomPairInteractions);
            Helpers.mergeIntoSet(allPiStackings, piStackings);
            Helpers.mergeIntoSet(allCationPiStackings, cationPiStackings);
            for (const splineId in splineControlPoints) {
                allSplines[splineId] = splineControlPoints[splineId];
            }
        };
        const ringSystems = {};
        fullStructures.forEach(fullSid => {
            const fullStructure = this.sceneData.structuresData.structures[fullSid];
            merge(fullStructure.getConnectedElements());
            ringSystems[fullSid] = Object.keys(fullStructure.ringsData.ringSystems);
        });
        partialStructures.forEach(partSid => {
            const partialStructure = this.sceneData.structuresData.structures[partSid];
            const movedAtoms = moveUnit[partSid];
            merge(partialStructure.getConnectedElementsForAtoms(movedAtoms, this.opts.moveFreedomLevel));
            ringSystems[partSid] = [
                ...partialStructure
                    .ringsData.getRingSystemsAffectedByAtoms(movedAtoms)
            ];
        });
        //mark in Interaction object all that can be moved
        const movement = this.interaction.movement;
        movement.fullStructures = fullStructures;
        movement.partialStructures = partialStructures;
        movement.ringSystems = ringSystems;
        movement.individualAtoms = moveUnit;
        movement.annotations = allAnnotations;
        movement.distances = allDistances;
        movement.interactions = allInteractions;
        movement.atomPairInteractions = allAtomPairInteractions;
        movement.piStackings = allPiStackings;
        movement.cationPiStackings = allCationPiStackings;
        movement.splineControlPoints = allSplines;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds out which structures are affected and if full or partial freedom level.
     *
     * @param selectionHovered {Boolean} - element is currently hovered
     * @param structureId {Number} - id of the structure the hovered element
     * belongs to
     * @param structure {Structure} - structure of the hovered element
     * belongs to
     * @param moveUnit {Map} - collects moved atoms (atom ids mapped to structure ids)
     * @param fullStructures {Array} - container to mark structures which are
     * moved as a whole
     */
    getAffectedStructuresNoFreedom(selectionHovered,
        structureId,
        structure,
        moveUnit,
        fullStructures
    ) {
        if (selectionHovered) {
            for (const selStructureId in this.sceneData.structuresData.structures) {
                const selStructure = this.sceneData.structuresData.structures[selStructureId];
                //find other affected elements
                if (selStructure.isSelected()) {
                    fullStructures.push(parseInt(selStructureId));
                    moveUnit[selStructureId] = selStructure.atomsData.atomIds.slice
                }
            }
        } else {
            fullStructures.push(structureId);
            moveUnit[structureId] = structure.atomsData.atomIds.slice();
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Find all move units affected by current selection if rings freedom level.
     *
     * @param moveUnit {Map} - collects moved atoms (atom ids mapped to structure ids)
     * @param fullStructures {Array} - container to mark structures which are
     * moved as a whole
     * @param partialStructures {Array} - container to mark structures for
     * which only a subset of atoms is moved
     */
    getAffectedRingsFreedom(moveUnit, fullStructures, partialStructures) {
        for (const selStructureId in this.sceneData.structuresData.structures) {
            const selStructure = this.sceneData.structuresData.structures[selStructureId];
            //find other affected elements
            const movedAtoms = selStructure.edgesData.getAtomsAffectedBySelection();
            if (!movedAtoms.length) continue;
            moveUnit[selStructureId] = movedAtoms;
            this.checkFullStructureAffectedByAtoms(selStructureId,
                movedAtoms,
                fullStructures,
                partialStructures
            );
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Find all move units affected by current selection if full freedom level.
     *
     * @param structureId {Number} - id of the structure the hovered element
     * belongs to
     * @param id {Number} - id of the hovered element
     * belongs to
     * @param type {String} - type of the hovered element
     * belongs to
     * @param structure {Structure} - structure of the hovered element
     * belongs to
     * @param moveUnit {Map} - collects moved atoms (atom ids mapped to structure ids)
     * @param fullStructures {Array} - container to mark structures which are
     * moved as a whole
     * @param partialStructures {Array} - container to mark structures for
     * which only a subset of atoms is moved
     */
    getAffectedFullFreedom(structureId,
        id,
        type,
        structure,
        moveUnit,
        fullStructures,
        partialStructures
    ) {
        let movedAtoms;

        if (type === 'atom') {
            const structure = this.sceneData.structuresData.structures[structureId];
            movedAtoms = structure.getMoveUnitForAtom(id, this.opts.moveFreedomLevel);
        } else if (type === 'edge') {
            movedAtoms = structure.getMoveUnitForEdge(id, this.opts.moveFreedomLevel);
        }
        moveUnit[structureId] = movedAtoms;
        this.checkFullStructureAffectedByAtoms(structureId,
            movedAtoms,
            fullStructures,
            partialStructures
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Determines whether a structure specified by id is fully affected by an
     * interaction on a given number of atoms and accordingly add its id to
     * either an array of fully or partially affected structures.
     *
     * @param structureId {Number} - id of the Structure object containing the
     * atoms
     * @param movedAtoms {Array} - ids of atoms to be moved
     * @param fullStructures {Array} - container to mark structures which are
     * moved as a whole
     * @param partialStructures {Array} - container to mark structures for
     * which only a subset of atoms is moved
     */
    checkFullStructureAffectedByAtoms(structureId, movedAtoms, fullStructures, partialStructures) {
        const structure = this.sceneData.structuresData.structures[structureId];
        if (structure.atomsData.isFullStructureAffected(movedAtoms)) {
            fullStructures.push(structureId);
        } else {
            partialStructures.push(structureId);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Based on information set in interaction.rotation, finds the angle
     * between the current cursor position and the latest logged interaction
     * start point and infer the midpoint to be used in rotation.
     *
     * @param drawAreaCoords {Object} - x- and y-coordinates of current
     * cursor screen position translated to position in draw area
     * @returns {Object} - angle and scaled midpoint to be used in rotation
     */
    getRotationParameters(drawAreaCoords) {
        const startCoords = this.interaction.start;
        const {
            structures: affectedSids, type: rotaType, splineControlPoints: splineControlPoints
        } = this.interaction.rotation;
        //find out what kind of rotation is happening and its midpoint
        let realMid;
        if (rotaType === 'fullScene') {
            realMid = this.sceneData.midCoords;
        } else if (rotaType === 'singleStructure') {
            realMid =
                this.getTransformedCoordinates(this.sceneData.structuresData.structures[affectedSids[0]].getLimits().mid);
        } else if (rotaType === 'singleSpline') {
            for (const splineId in splineControlPoints) {
                const spline = this.sceneData.hydrophobicData.hydrophobicContacts[splineId];
                realMid = PointCalculation.findGeometricCenter(
                    spline.controlPoints.filter(cp => cp.enabled).map(cp => {
                        return this.getTransformedCoordinates(cp);
                    })
                );
            }
        } else if (rotaType === 'multipleStructures') {
            const midPoints = [];
            for (const affectedSid of affectedSids) {
                midPoints.push(
                    this.getTransformedCoordinates(
                        this.sceneData.structuresData.structures[affectedSid].getLimits().mid)
                );
            }
            realMid = PointCalculation.findGeometricCenter(midPoints);
        }
        //infer angle from midpoint and cursor positions
        let angle = AngleCalculation.radianToDegree(VectorCalculation.findAngleBetweenLines(realMid,
            drawAreaCoords,
            realMid,
            startCoords
        ));
        //infer sign of angle
        if (!Number.isNaN(angle)) {
            const clockwise = !LineCalculation.isLeft(realMid, startCoords, drawAreaCoords);
            if (!clockwise) angle = -angle;
        }
        return {
            angle: angle, //rotation applied around translated and scaled coordinates
            scaledMid: this.getRealCoordinates(realMid)
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks if given offsets for movement exceed required minimum movement
     * specified in interaction.grace.
     *
     * @param offset {Object} - x- and y-offsets to move draw elements by
     * @returns {Boolean} - whether movement is allowed to happen
     */
    decideMovementPossible(offset) {
        let canMove = this.interaction.movement.canMove;
        if (!canMove) {
            if (PointCalculation.getDist2dByDists(offset.x, offset.y) > this.interaction.grace) {
                this.interaction.movement.canMove = true;
                canMove = true;
            }
        }
        return canMove;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Calculates offsets between the noted start of user interaction (which
     * is constantly updated) and the current cursor position.
     *
     * @param drawAreaCoords {Object} - x- and y-coordinates of current
     * cursor screen position translated to position in draw area
     * @returns {Object} - x- and y-offsets
     */
    getOffsetsToInteractionStart(drawAreaCoords) {
        const scale = this.transformParams.scale;
        return {
            x: (drawAreaCoords.x - this.interaction.start.x) / scale,
            y: (drawAreaCoords.y - this.interaction.start.y) / scale
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Based on its upper left corner and lower right corner, creates the
     * corners of the selection rectangle and scale them based on current
     * translation parameters.
     *
     * @param startX {Number} - x-coordinate of the upper left corner
     * @param startY {Number} - y-coordinate of the upper left corner
     * @param endX {Number} - x-coordinate of the lower right corner
     * @param endY {Number} - y-coordinate of the lower right corner
     * @returns {Array} - corner points of the rectangle with x- and y-
     * coordinates
     */
    createRectSelection({x: startX, y: startY}, {x: endX, y: endY}) {
        let rectPoints = PolygonCalculation.createRectByBoundaries(startX, endX, startY, endY);
        const scale = this.transformParams.scale;
        const {translate: {x: translateX, y: translateY}} = this.transformParams;
        rectPoints = rectPoints.map(({x, y}) => {
            return {
                x: x / scale - translateX, y: y / scale - translateY
            }
        });
        return rectPoints;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Reversal of getRealCoordinates(): Translates a scaled position in the
     * draw area to pixel coordinates.
     *
     * @param x {Number} - x-coordinate of real position
     * @param y {Number} - y-coordinate of real position
     */
    getTransformedCoordinates({x, y}) {
        const {scale, translate: {x: translateX, y: translateY}} = this.transformParams;
        return {
            x: (x + translateX) * scale, y: (y + translateY) * scale
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * At the end of coordinate manipulating by hover interaction, cleans up internal
     * container tracking elements.
     */
    resetAfterHoverEnd() {
        if (!this.drawAreaHovered) {
            this.interaction.fullReset();
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * As the coordinate system gets translated / scaled, the parameters on
     * screen do no longer match the real coordinates of the draw area. This
     * function translates a perceived position in the draw area (by pixels)
     * to the real position in the scaled coordinate system.
     *
     * @param x {Number} - x-coordinate of perceived position
     * @param y {Number} - y-coordinate of perceived position
     */
    getRealCoordinates({x, y}) {
        const {scale, translate: {x: translateX, y: translateY}} = this.transformParams;
        return {
            x: x / scale - translateX, y: y / scale - translateY
        };
    }
}