/**
 * Processes movement user interactions with the draw area that add new elements
 * to the draw area. New objects are added via its JSON representation.
 */
class AddHandler {
    /**
     * Contains instances for the data storage/access, user interaction tracking,
     * draw area manipulation, JSON preprocessing, adding of new drawn objects and
     * configuration options.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     * @param interactionState {Object} - tracks user interactions
     * @param svgDrawer {Object} - updates the draw area
     * @param hoverHandler {Object} - processes hover user
     * interactions with the draw area
     */
    constructor(opts, sceneData, interactionState, svgDrawer, hoverHandler) {
        this.opts = opts;
        this.sceneData = sceneData;
        this.interactionState = interactionState;
        this.svgDrawer = svgDrawer;
        this.hoverHandler = hoverHandler;

        this.closestObjectFinder = new ClosestObjectFinder(opts, sceneData);
        this.jsonPreprocessor = new JsonPreprocessor(sceneData);
        this.jsonBuilder = new JsonBuilder(sceneData, opts);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates a scene in the draw area based on a JSON object mirroring the
     * required JSON input fields.
     *
     * @param json {Object} - elements to draw
     * @param center {Boolean} - whether to center the scene after adding the new
     * elements
     * @param adaptAdd {Boolean} - whether to alter the ids and positions of the newly
     * added json on top of already drawn objects
     */
    addToScene(json, center = true) {
        this.svgDrawer.applySceneChanges({
            add: JSON.parse(json, (k, v) => v === "true" ? true : v === "false" ? false : v)
        });
        if (center) {
            this.svgDrawer.viewerDrawer.center();
            this.hoverHandler.handleHoverAtCurrentCursor();
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets the start element from where to draw a new atom.
     */
    setInteractionStartAddAtom() {
        const interaction = this.interactionState.interaction;
        const startCoords = this.interactionState.getRealCoordinates(interaction.start);
        const atomContainer = interaction.addAtom;
        const structuresData = this.sceneData.structuresData;
        const color = this.opts.colors[atomContainer.element];
        const atom = this.closestObjectFinder.getClosestEnabledAtom(startCoords,
            undefined,
            1
        );
        if (!atom) return;
        const aStructure = structuresData.structures[structuresData.atomIdsToStructure[atom.id]];
        if (aStructure.representationsData.isCurRepresentation(StructureRepresentation.circle)) {
            return;
        }
        atomContainer.from = atom.id;
        atomContainer.fromStructure = aStructure.id;
        atomContainer.endpoints.first = atom.coordinates;
        atomContainer.endpoints.second = Object.assign({}, startCoords);
        this.svgDrawer.viewerDrawer.toggleIntermolecularLineDrawing(atomContainer, true, color, false);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets the start element from where to draw a intermolecular interaction.
     */
    setInteractionStartAddIntermolecular() {
        const interaction = this.interactionState.interaction;
        const startCoords = this.interactionState.getRealCoordinates(interaction.start);
        const iContainer = interaction.addIntermolecular;
        const structuresData = this.sceneData.structuresData;
        let color = this.opts.colors.DEFAULT;
        let dashed = true;
        switch (this.interactionState.addIntermolecularType) {
            case IntermolecularType.atomPairInteraction:
                const atom = this.closestObjectFinder.getClosestEnabledAtom(startCoords,
                    undefined,
                    1
                );
                if (!atom) return;
                const aStructure = structuresData.structures[structuresData.atomIdsToStructure[atom.id]];
                iContainer.from = atom.id;
                iContainer.fromStructure = aStructure.id;
                if (aStructure.representationsData.isCurRepresentation(StructureRepresentation.circle)) {
                    iContainer.endpoints.first = aStructure.boundaries.mid;
                } else {
                    iContainer.endpoints.first = atom.coordinates;
                }
                break;
            case IntermolecularType.piStacking:
            case IntermolecularType.cationPiStacking:
                const ring = this.closestObjectFinder.getClosestEnabledRing(startCoords);
                if (!ring) return;
                const rStructure = structuresData.structures[structuresData.atomIdsToStructure[ring.atoms[0].id]];
                iContainer.from = ring.id;
                iContainer.fromStructure = rStructure.id;
                if (rStructure.representationsData.isCurRepresentation(StructureRepresentation.circle)) {
                    iContainer.endpoints.first = rStructure.boundaries.mid;
                } else {
                    iContainer.endpoints.first = ring.centroidInfo.centroid;
                }
                color = this.opts.colors.piStackings;
                if (this.interactionState.addIntermolecularType ===
                    IntermolecularType.cationPiStacking) {
                    color = this.opts.colors.cationPiStackings;
                }
                break;
            case IntermolecularType.hydrophobicContact:
                const closestCp = this.closestObjectFinder.getClosestEnabledSplineControlPoint(startCoords,
                    true
                );
                if (!closestCp ||
                    VectorCalculation.getDist2d(startCoords, closestCp.controlPoint) >=
                    this.opts.addIntermolecularSnapDist) {
                    //create a new spline instead of extending the closest one
                    iContainer.endpoints.first = startCoords;
                } else {
                    const {
                        hydrophobicContactId, controlPointId, controlPoint
                    } = closestCp;
                    iContainer.fromHydrophobic.hydrophobicContactId = hydrophobicContactId;
                    iContainer.fromHydrophobic.controlPointId = controlPointId;
                    iContainer.endpoints.first = {
                        x: controlPoint.x, y: controlPoint.y
                    };
                }
                dashed = false;
                color = this.opts.colors.hydrophobicContacts;
                break;
        }
        iContainer.endpoints.second = Object.assign({}, startCoords);
        this.svgDrawer.viewerDrawer.toggleIntermolecularLineDrawing(iContainer, true, color, dashed);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles information gathering during mouse move if interaction
     * addAtom is active.
     */
    handleAddAtom() {
        const interaction = this.interactionState.interaction;
        const atomContainer = interaction.addAtom;
        if (atomContainer.fromStructure !== undefined) {
            const currCoords = this.interactionState.getRealCoordinates(interaction.start);
            const color = this.opts.colors.DEFAULT;
            atomContainer.endpoints.second = currCoords;
            //nicer line drawings that respect the atom radius within no line shall be drawn
            const atom = this.sceneData.structuresData.structures[
                atomContainer.fromStructure
                ].atomsData.atomById[atomContainer.from];
            let fromDist = this.opts.atomRadius;
            let toDist = this.opts.atomRadius;
            if (atom.label === '') {
                fromDist = 0;
            }
            if (this.interactionState.addAtomType.element === 'C') {
                toDist = 0;
            }
            const newPoints = LineCalculation.shortenLine(
                atomContainer.endpoints.first,
                atomContainer.endpoints.second,
                fromDist,
                toDist,
                false
            );
            const newAtomContainer = {
                endpoints: {first: newPoints[0], second: newPoints[1]}
            }
            this.svgDrawer.viewerDrawer.toggleIntermolecularLineDrawing(
                newAtomContainer,
                true,
                color,
                false
            );
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles information gathering during mouse move if interaction
     * addIntermolecular is active.
     */
    handleAddIntermolecular() {
        const interaction = this.interactionState.interaction;
        const currCoords = this.interactionState.getRealCoordinates(interaction.start);
        const iContainer = interaction.addIntermolecular;
        const structuresData = this.sceneData.structuresData;
        let endpoint;
        let color = this.opts.colors.DEFAULT;
        let dashed = true;
        switch (this.interactionState.addIntermolecularType) {
            case IntermolecularType.piStacking:
                const ring = this.closestObjectFinder
                    .getClosestEnabledRing(currCoords);
                if (!ring) return;
                const rStructure = structuresData.structures[structuresData.atomIdsToStructure[ring.atoms[0].id]];
                endpoint = rStructure
                    .representationsData.isCurRepresentation(StructureRepresentation.circle) ?
                    rStructure.boundaries.mid : ring.centroidInfo.centroid;
                if ((iContainer.fromStructure === rStructure.id && iContainer.from === ring.id) ||
                    VectorCalculation.getDist2d(currCoords, endpoint) >
                    this.opts.addIntermolecularSnapDist) {
                    iContainer.endpoints.second = currCoords;
                    iContainer.to = undefined;
                    iContainer.toStructure = undefined;
                } else {
                    iContainer.endpoints.second = endpoint;
                    iContainer.to = ring.id;
                    iContainer.toStructure = rStructure.id;
                }
                color = this.opts.colors.piStackings;
                break;
            case IntermolecularType.atomPairInteraction:
            case IntermolecularType.cationPiStacking:
                const atom = this.closestObjectFinder.getClosestEnabledAtom(currCoords,
                    undefined,
                    1
                );
                if (!atom) return;
                const aStructure = structuresData.structures[structuresData.atomIdsToStructure[atom.id]];
                endpoint = aStructure
                    .representationsData.isCurRepresentation(StructureRepresentation.circle) ?
                    aStructure.boundaries.mid : atom.coordinates;
                if ((iContainer.fromStructure === aStructure.id && iContainer.from === atom.id) ||
                    VectorCalculation.getDist2d(currCoords, endpoint) >
                    this.opts.addIntermolecularSnapDist) {
                    iContainer.endpoints.second = currCoords;
                    iContainer.to = undefined;
                    iContainer.toStructure = undefined;
                } else {
                    iContainer.endpoints.second = endpoint;
                    iContainer.to = atom.id;
                    iContainer.toStructure = aStructure.id;
                }
                if (this.interactionState.addIntermolecularType ===
                    IntermolecularType.cationPiStacking) {
                    color = this.opts.colors.cationPiStackings;
                }
                break;
            case IntermolecularType.hydrophobicContact:
                const closestCp = this.closestObjectFinder.getClosestEnabledSplineControlPoint(currCoords,
                    true
                );
                if (!closestCp || iContainer.fromHydrophobic.hydrophobicContactId !== undefined ||
                    VectorCalculation.getDist2d(currCoords, closestCp.controlPoint) >
                    this.opts.addIntermolecularSnapDist) {
                    iContainer.toHydrophobic.hydrophobicContactId = undefined;
                    iContainer.toHydrophobic.controlPointId = undefined;
                    iContainer.endpoints.second = currCoords;
                } else {
                    const {
                        hydrophobicContactId, controlPointId, controlPoint
                    } = closestCp;
                    iContainer.toHydrophobic.hydrophobicContactId = hydrophobicContactId;
                    iContainer.toHydrophobic.controlPointId = controlPointId;
                    iContainer.endpoints.second = {
                        x: controlPoint.x, y: controlPoint.y
                    };
                }
                dashed = false;
                color = this.opts.colors.hydrophobicContacts;
                break;
        }
        this.svgDrawer.viewerDrawer.toggleIntermolecularLineDrawing(iContainer, true, color, dashed);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles mouse release if addAtom is active.
     * Adds the new atom.
     *
     * @param oldJson {Object} - old JSON that will be updated by a new atom bond
     */
    handleAddAtomEnd(oldJson) {
        const interaction = this.interactionState.interaction;
        const atomContainer = interaction.addAtom;
        this.addNewAtomToScene(atomContainer, oldJson);
        this.svgDrawer.viewerDrawer.toggleIntermolecularLineDrawing(atomContainer, false);
        this.interactionState.resetAfterHoverEnd();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles mouse release if interaction addIntermolecular is active.
     * Adds the new intermolecular interaction.
     */
    handleAddIntermolecularEnd() {
        const iContainer = this.interactionState.interaction.addIntermolecular;
        switch (this.interactionState.addIntermolecularType) {
            case IntermolecularType.atomPairInteraction:
                this.addNewAtomPairInteractionToScene(iContainer);
                break;
            case IntermolecularType.piStacking:
                this.addNewPiStackingToScene(iContainer);
                break;
            case IntermolecularType.cationPiStacking:
                this.addNewCationPiStackingToScene(iContainer);
                break;
            case IntermolecularType.hydrophobicContact:
                const hydrophobicId = iContainer.fromHydrophobic.hydrophobicContactId ||
                    iContainer.toHydrophobic.hydrophobicContactId;
                if (hydrophobicId) {
                    let cpIndex, cp;
                    if (iContainer.fromHydrophobic.controlPointId !== undefined) {
                        cpIndex = iContainer.fromHydrophobic.controlPointId;
                        cp = Object.assign({}, iContainer.endpoints.second);
                    } else {
                        cpIndex = iContainer.toHydrophobic.controlPointId;
                        cp = Object.assign({}, iContainer.endpoints.first);
                    }
                    const cpEnd = this.sceneData.hydrophobicData.hydrophobicContacts[hydrophobicId]
                        .determineCPEnd(cpIndex);
                    const insertId = cpEnd === 1 ? 0 : undefined;
                    this.addNewHydrophobicControlPointsToScene(parseInt(hydrophobicId),
                        [cp],
                        true,
                        insertId
                    );
                } else {
                    const closestAtom = this.closestObjectFinder.getClosestEnabledAtom(iContainer.endpoints.first,
                        undefined,
                        3
                    );
                    if (closestAtom) {
                        const closestStructureId = this.sceneData.structuresData.atomIdsToStructure[closestAtom.id];
                        this.addNewHydrophobicContactToScene(closestStructureId, [
                            iContainer.endpoints.first, iContainer.endpoints.second
                        ]);
                    } else {
                        this.interactionState.resetAfterHoverEnd();
                    }
                }
        }
        this.svgDrawer.viewerDrawer.toggleIntermolecularLineDrawing(iContainer, false);
        this.interactionState.resetAfterHoverEnd();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles mouse release if interaction edit is active.
     * Displays the input form.
     */
    handleEditFormEnd() {
        const editType = this.interactionState.editType;
        const interaction = this.interactionState.interaction;
        const cursorCoords =
            this.interactionState.getRealCoordinates(this.interactionState.cursorPos);
        let hit;
        if (editType === EditType.annotation) {
            hit = this.hoverHandler.collisionFinder.findLastCollisionAnnotation([cursorCoords]);
            if (hit) {
                interaction.edit.object = hit;
            } else {
                hit = this.hoverHandler.collisionFinder.findFirstStructureCollision([cursorCoords]);
                if (hit && hit.type === 'atom') {
                    const structures = this.sceneData.structuresData.structures;
                    for (const structureId in structures) {
                        const structure = structures[structureId];
                        const atom = structure.atomsData.atomById[hit.id];
                        if (atom && atom.element === 'R') {
                            interaction.edit.object = hit;
                            this.interactionState.editType = EditType.atom;
                            this.interactionState.resetEditType = true;
                        }
                    }
                }
            }
        } else if (editType === EditType.atom) {
            hit = this.hoverHandler.collisionFinder.findFirstStructureCollision([cursorCoords]);
            if (hit && hit.type === 'atom') {
                interaction.edit.object = hit;
            }
        } else if (editType === EditType.bond) {
            hit = this.hoverHandler.collisionFinder.findFirstStructureCollision([cursorCoords]);
            if (hit && hit.type === 'edge') {
                interaction.edit.object = hit;
            }
        } else if (editType === EditType.structure) {
            hit = this.hoverHandler.collisionFinder.findFirstStructureCollision([cursorCoords]);
            if (hit && (hit.type === 'atom' ||
                hit.type === 'edge' ||
                hit.type === 'structureCircle')) {
                interaction.edit.object = hit;
            }
        }
        if (!interaction.edit.object) {
            return;
        }
        const x = cursorCoords.x;
        const y = cursorCoords.y;
        interaction.edit.coords = cursorCoords;
        interaction.edit.curMode = InteractionMode.editInput;
        this.svgDrawer.viewerDrawer.openEditForm(x, y);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles mouse release if interaction edit is active.
     * Confirms the edit or cancels the interaction.
     *
     * @param cancel {Boolean} - true if the cancel button for form closing was clicked
     * @param oldJson {String} - JSON that will be edited
     */
    handleEditInputEnd(oldJson, cancel = false) {
        if (!cancel) {
            const formData = this.svgDrawer.viewerDrawer.getEditFormData();
            const object = this.interactionState.interaction.edit.object;
            const oldJsonObject = JSON.parse(oldJson);
            if (this.opts.moveFreedomLevel === "free" && object.type === 'atom') {
                for (const structureObject of oldJsonObject.scene.structures) {
                    if (structureObject.id === object.structureId) {
                        for (const atomObject of structureObject.atoms) {
                            if (atomObject.id === object.id) {
                                atomObject.label = formData.label;
                                atomObject.element = formData.element;
                                atomObject.charge = formData.charge;
                                atomObject.hydrogenCount = formData.h;
                                const preprocessedJson = this.jsonPreprocessor.prepJsonUIds(
                                    JSON.stringify(oldJsonObject)
                                );
                                this.addToScene(preprocessedJson, false);
                                break
                            }
                        }
                    }
                }
            } else if (this.opts.moveFreedomLevel === "free" && object.type === 'edge') {
                for (const structureObject of oldJsonObject.scene.structures) {
                    if (structureObject.id === object.structureId) {
                        for (const edgeObject of structureObject.bonds) {
                            if (edgeObject.id === object.id) {
                                const type = formData.type;
                                if (type === 'aromatic') {
                                    edgeObject.aromatic = true;
                                    edgeObject.type = 'single';
                                } else {
                                    edgeObject.aromatic = false;
                                    edgeObject.type = type;
                                }
                                const preprocessedJson = this.jsonPreprocessor.prepJsonUIds(
                                    JSON.stringify(oldJsonObject)
                                );
                                this.addToScene(preprocessedJson, false);
                                break
                            }
                        }
                    }
                }
            } else if (object.type === 'annotation') {
                for (const annotationObject of oldJsonObject.scene.annotations) {
                    if (annotationObject.id === object.id) {
                        annotationObject.label = formData.text;
                        const preprocessedJson = this.jsonPreprocessor.prepJsonUIds(
                            JSON.stringify(oldJsonObject)
                        );
                        this.addToScene(preprocessedJson, false);
                        break;
                    }
                }
            } else if (this.opts.moveFreedomLevel === "structures"
                && (object.type === 'atom' ||
                    object.type === 'edge' ||
                    object.type === 'structureCircle')) {
                for (const structureObject of oldJsonObject.scene.structures) {
                    if (structureObject.id === object.structureId) {
                        structureObject.structureLabel = formData.label;
                        structureObject.representation = formData.representation;
                        const preprocessedJson = this.jsonPreprocessor.prepJsonUIds(
                            JSON.stringify(oldJsonObject)
                        );
                        this.addToScene(preprocessedJson, false);
                        break;
                    }
                }
            }
        }
        this.editReset();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the edit and editInput interaction mode
     * by altering the corresponding containers and clearing the input form.
     */
    editReset() {
        this.svgDrawer.viewerDrawer.hideEditForm();
        const interaction = this.interactionState.interaction;
        interaction.edit.coords = undefined;
        interaction.edit.object = undefined;
        interaction.edit.curMode = InteractionMode.edit;
        //if an atom with element 'R' is clicked, the edit mode is switched
        //from annotation to atom. This is reverted here for such that the
        //user can continue to edit annotations
        if (this.interactionState.resetEditType) {
            this.interactionState.resetEditType = false;
            this.interactionState.editType = EditType.annotation;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles mouse release if interaction addAnnotation is active.
     * Displays the input form.
     */
    handleAddAnnotationFormEnd() {
        const cursorCoords = this.interactionState.getRealCoordinates(this.interactionState.cursorPos);
        const x = cursorCoords.x;
        const y = cursorCoords.y;
        const interaction = this.interactionState.interaction;
        interaction.addAnnotation.coords = cursorCoords;
        interaction.addAnnotation.curMode = InteractionMode.addAnnotationInput;
        this.svgDrawer.viewerDrawer.openAnnotationAddForm(x, y);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles mouse release if interaction addAnnotationInput is active.
     * Adds the annotation or cancels the interaction.
     *
     * @param cancel {Boolean} - true if the cancel button for form closing was clicked
     */
    handleAddAnnotationInputEnd(cancel = false) {
        const formData = this.svgDrawer.viewerDrawer.getAnnotationFormData();
        if (!cancel && formData.text) {
            this.addNewAnnotationToScene(formData.text,
                formData.coords,
                formData.snap,
                formData.color
            );
        }
        this.addAnnotationReset();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the addAnnotation and addAnnotationInput interaction mode
     * by altering the corresponding containers and clearing the input form.
     * Note that this does not reset the color or the checkbox for structure snap
     * because that this would be counterintuitive for the user.
     */
    addAnnotationReset() {
        const interaction = this.interactionState.interaction;
        interaction.addAnnotation.coords = undefined;
        interaction.addAnnotation.curMode = InteractionMode.addAnnotation;
        this.svgDrawer.viewerDrawer.hideAnnotationAddForm();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles mouse release if interaction addStructure is active.
     * Displays the input form.
     */
    handleAddStructureFormEnd() {
        const cursorCoords = this.interactionState.getRealCoordinates(this.interactionState.cursorPos);
        const x = cursorCoords.x;
        const y = cursorCoords.y;
        const interaction = this.interactionState.interaction;
        interaction.addStructure.coords = cursorCoords;
        interaction.addStructure.curMode = InteractionMode.addStructureInput;
        this.svgDrawer.viewerDrawer.openStructureAddForm(x, y);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles mouse release if interaction addStructureInput is active.
     * Adds the structure or cancels the interaction.
     *
     * @param cancel {Boolean} - true if the cancel button for form closing was clicked
     */
    handleAddStructureInputEnd(cancel = false) {
        const formData = this.svgDrawer.viewerDrawer.getStructureFormData();
        if (!cancel && formData.structure) {
            this.addNewStructureToScene(formData.structure,
                formData.coords,
                formData.input,
                formData.tag,
            );
        }
        this.addStructureReset();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the addStructure and addStructureInput interaction mode
     * by altering the corresponding containers and clearing the input form.
     */
    addStructureReset() {
        const interaction = this.interactionState.interaction;
        interaction.addStructure.coords = undefined;
        interaction.addStructure.curMode = InteractionMode.addStructure;
        this.svgDrawer.viewerDrawer.hideStructureAddForm();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds new control points to a existing hydrophobic contact to the scene.
     *
     * @param hydrophobicId {Number} - id of the the hydrophobic contact
     * @param controlPoints {Array} - array of objects containing x- and
     * y-coordinates of a control point. Can contain an optional array "atomLinks"
     * which holds the atoms ids to which the control point belongs to - this is
     * used for e.g. movement. If atom gets moved the control point gets moved)
     * @param calcAtomLinks {Boolean} - if the atom links, if not present,
     * for each control point should be picked automatically as the nearest
     * atom
     * @param insertId {Number} - id where the control points should be
     * inserted at the array of the current control points of the
     * hydrophobic contact. If omitted will be inserted at the end
     */
    addNewHydrophobicControlPointsToScene(hydrophobicId,
        controlPoints,
        calcAtomLinks = true,
        insertId = undefined
    ) {
        const hydrophobicContacts = this.sceneData.hydrophobicData.hydrophobicContacts;
        if (!hydrophobicContacts.hasOwnProperty(hydrophobicId)) {
            return;
        }
        const structureId = hydrophobicContacts[hydrophobicId].structureLink;
        if (calcAtomLinks) {
            controlPoints.forEach((cp, idx) => {
                if (!cp.hasOwnProperty('atomLinks')) {
                    cp.atomLinks = [
                        this.closestObjectFinder.getClosestEnabledAtom(cp, [structureId]).id
                    ];
                }
            })
        }
        this.addToScene(JSON.stringify({
            scene: {
                hydrophobicContacts: [
                    {
                        id: hydrophobicId,
                        belongsTo: hydrophobicContacts[hydrophobicId].structureLink,
                        controlPoints: controlPoints,
                        controlPointsInsertId: insertId
                    }
                ]
            }
        }), false)
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds a new hydrophobic contact to the scene.
     *
     * @param structureId {Number} - id of the structure the hydrophobic contact
     * belongs to
     * @param controlPoints {Array} - array of objects containing x- and
     * y-coordinates of a control point. Can contain an optional array "atomLinks"
     * which holds the atoms ids to which the control point belongs to - this is
     * used for e.g. movement. If atom gets moved the control point gets moved)
     * @param calcAtomLinks {Boolean} - if the atom links, if not present,
     * for each control point should be picked automatically as the nearest
     * atom
     */
    addNewHydrophobicContactToScene(structureId, controlPoints, calcAtomLinks = true) {
        if (!this.sceneData.structuresData.structures.hasOwnProperty(structureId)) {
            return;
        }
        if (calcAtomLinks) {
            controlPoints.forEach((cp, idx) => {
                if (!cp.hasOwnProperty('atomLinks')) {
                    cp.atomLinks = [
                        this.closestObjectFinder.getClosestEnabledAtom(cp, [structureId]).id
                    ];
                }
            })
        }
        this.addToScene(JSON.stringify({
            scene: {
                hydrophobicContacts: [
                    {
                        id: AddHandler.getNextId(this.sceneData.hydrophobicData.hydrophobicContacts),
                        belongsTo: structureId,
                        controlPoints: controlPoints
                    }
                ]
            }
        }), false)
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds a new annotation to the scene.
     *
     * @param text {String} - text to display
     * @param coords {Object} - x- and y-coordinates to add the annotation at
     * @param snap {Boolean} - whether to snap the annotation (movement wise) to
     * the nearest structure
     * @param color {String} - hex color of the annotation. If omitted takes default
     */
    addNewAnnotationToScene(text,
        coords,
        snap = false,
        color = Helpers.rgbToHex(this.opts.colors.DEFAULT)
    ) {
        const annotation = {
            id: AddHandler.getNextId(this.sceneData.annotationsData.annotations),
            label: text,
            coordinates: coords,
            color: Helpers.hexToRgb(color)
        };
        if (color === Helpers.rgbToHex(this.opts.colors.hydrophobicContacts)) {
            annotation.isStructureLabel = false;
            if (snap) {
                annotation.belongsTo = {};
                annotation.belongsTo.type = 'structureSpline';
                const structure = this.closestObjectFinder.getClosestEnabledStructure(coords,
                    undefined,
                    true
                ).structure;
                if (structure) {
                    annotation.belongsTo.id = structure.id;
                }
            }
        } else {
            annotation.isStructureLabel = false;
            if (snap) {
                annotation.isStructureLabel = true;
                annotation.belongsTo = {};
                annotation.belongsTo.type = 'structure';
                const structure = this.closestObjectFinder.getClosestEnabledStructure(coords,
                    undefined,
                    true
                ).structure;
                if (structure) {
                    annotation.belongsTo.id = structure.id;
                }
            }
        }
        this.addToScene(JSON.stringify({
            scene: {
                annotations: [annotation]
            }
        }), false)
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds a new atom p to the scene.
     *
     * @param atomContainer {Object} - object that tracks an add atom interaction
     * @param oldJson {String} - old JSON that will be updated by a new atom bond
     */
    addNewAtomToScene(atomContainer, oldJson) {
        const fromStructureId = atomContainer.fromStructure;
        const oldJsonObject = JSON.parse(oldJson);
        for (const structureObject of oldJsonObject.scene.structures) {
            if (structureObject.id === fromStructureId) {
                const highestIds = this.jsonPreprocessor.getHighestIDs();
                const newAtomId = highestIds.atoms + 1;
                const newEdgeId = highestIds.bonds + 1;
                structureObject.atoms.push(
                    {
                        additionalInformation: {
                            nglSelectionName: ''
                        },
                        aromatic: false,
                        charge: 0,
                        coordinates: {
                            x: atomContainer.endpoints.second.x,
                            y: atomContainer.endpoints.second.y
                        },
                        element: this.interactionState.addAtomType.element,
                        hydrogenCount: 0,
                        id: newAtomId,
                        label:  this.interactionState.addAtomType.label
                    }
                );
                structureObject.bonds.push(
                    {
                        aromatic: false,
                        from: atomContainer.from,
                        id: newEdgeId,
                        to: newAtomId,
                        type: 'single'
                    }
                );
                break;
            }
        }
        const preprocessedJson = this.jsonPreprocessor.prepJsonUIds(JSON.stringify(oldJsonObject));
        this.addToScene(preprocessedJson, false);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds a new atom pair interaction to the scene.
     *
     * @param iContainer {Object} - object that tracks an add intermolecular interaction
     */
    addNewAtomPairInteractionToScene(iContainer) {
        const fromStructureId = iContainer.fromStructure;
        const toStructureId = iContainer.toStructure;
        const structuresData = this.sceneData.structuresData;
        const fromStructure = structuresData.structures[fromStructureId];
        const toStructure = structuresData.structures[toStructureId];
        if (!fromStructure || !toStructure || (fromStructureId === toStructureId)) return;
        this.addToScene(JSON.stringify({
            scene: {
                atomPairInteractions: [
                    {
                        id: AddHandler.getNextId(this.sceneData.intermolecularData.atomPairInteractions),
                        fromStructure: fromStructureId,
                        toStructure: toStructureId,
                        from: iContainer.from,
                        to: iContainer.to
                    }
                ]
            }
        }), false);
        this.svgDrawer.intermolecularDrawer.updateIntermolecularConnections(fromStructureId,
            toStructureId
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds a new pi stacking to the scene.
     *
     * @param iContainer {Object} - object that tracks an add intermolecular interaction
     */
    addNewPiStackingToScene(iContainer) {
        const fromStructureId = iContainer.fromStructure;
        const toStructureId = iContainer.toStructure;
        const structuresData = this.sceneData.structuresData;
        const fromStructure = structuresData.structures[fromStructureId];
        const toStructure = structuresData.structures[toStructureId];
        if (!fromStructure || !toStructure || (fromStructureId === toStructureId)) return;
        this.addToScene(JSON.stringify({
            scene: {
                piStackings: [
                    {
                        id: AddHandler.getNextId(this.sceneData.intermolecularData.piStackings),
                        fromStructure: fromStructureId,
                        toStructure: toStructureId,
                        from: iContainer.from,
                        to: iContainer.to
                    }
                ]
            }
        }), false);
        this.svgDrawer.intermolecularDrawer.updateIntermolecularConnections(fromStructureId,
            toStructureId
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds a new cation pi stacking to the scene.
     *
     * @param iContainer {Object} - object that tracks an add intermolecular interaction
     */
    addNewCationPiStackingToScene(iContainer) {
        const fromStructureId = iContainer.fromStructure;
        const toStructureId = iContainer.toStructure;
        const structuresData = this.sceneData.structuresData;
        const fromStructure = structuresData.structures[fromStructureId];
        const toStructure = structuresData.structures[toStructureId];
        if (!fromStructure || !toStructure || (fromStructureId === toStructureId)) return;
        this.addToScene(JSON.stringify({
            scene: {
                cationPiStackings: [
                    {
                        id: AddHandler.getNextId(this.sceneData.intermolecularData.cationPiStackings),
                        fromStructure: fromStructureId,
                        toStructure: toStructureId,
                        from: iContainer.from,
                        to: iContainer.to
                    }
                ]
            }
        }), false);
        this.svgDrawer.intermolecularDrawer.updateIntermolecularConnections(fromStructureId,
            toStructureId
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a given container of a certain draw object type, determines the next
     * id for a new draw object this type based on the currently highest one.
     *
     * @param container {Object} - container of a certain draw object type
     * @returns {Number} - id for a new draw object
     */
    static getNextId(container) {
        return Object.keys(container).length === 0 ? 0 : Math.max(...Object.keys(container)
            .map(Number)) + 1;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds a new structure to the scene via JSON format.
     *
     * @param structureName {String} - name of the structure
     * @param coords {Object} - position of the mouse cursor
     * @param input {String} - SMILES input field
     * @param customTag {String} - optional tag displayed together with the structure
     */
    addNewStructureToScene(structureName, coords, input, customTag = "") {
        const structureId = AddHandler.getNextId(this.sceneData.structuresData.structures);
        let structureJson, structure;
        if (input === '') {
            structureJson = Helpers.deepCloneObject(JSONStructureTemplates[structureName]);
        } else {
            structureJson = this.jsonBuilder.getJsonBySmiles(input);
        }
        if (structureJson === null) {
            window.alert("Invalid SMILES");
            return;
        }
        structure = structureJson.scene.structures[0];
        structure.id = structureId;
        if (customTag !== "") {
            structure.structureName = customTag;
            structure.structureLabel = customTag;
            if (structureName === 'BACKBONE') {
                structure.atoms[4].label = customTag;
            } else if (structureName.includes('SIDECHAIN')) {
                structure.atoms[0].label = customTag;
            }
        } else {
            const stringId = structureId.toString();
            structure.structureName += stringId;
            structure.structureLabel += stringId;
            if (structureName.includes('SIDECHAIN')) {
                structure.atoms[0].label += stringId;
            }
        }
        structureJson = JSON.stringify(structureJson);
        structureJson = this.jsonPreprocessor.prepJsonUIds(structureJson);
        structureJson = this.jsonPreprocessor.prepJsonCoordinates(structureJson, coords);
        this.addToScene(structureJson);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds aromatic ring centers point feature to the scene.
     *
     * @param aromaticRingCenterMap {Object} - maps sorted atom ids of aromatic rings to NGL names
     *     of the corresponding aromatic ring centers in the NGL viewer
     */
    addGeomineRingCenterPoints(aromaticRingCenterMap) {
        const structures = this.sceneData.structuresData.structures;
        for (const structureId in structures) {
            const structure = structures[structureId];
            if (structure.ringsData) {
                const rings = structure.ringsData.rings;
                for (const ringId in rings) {
                    const ring = rings[ringId];
                    if (ring.aromatic) {
                        const atomIds = [];
                        const atoms = ring.atoms;
                        for (const atom of atoms) {
                            atomIds.push(atom.id)
                        }
                        const atomIdsString = atomIds.sort(function (a, b) {
                            return a - b;
                        })
                            .join('');
                        this.addGeominePointFeature(ring.centroidInfo.centroid,
                            aromaticRingCenterMap[atomIdsString],
                            'ringcenter',
                            this.opts.geomine.RingCenterColor,
                            2,
                            1,
                            parseInt(structure.id)
                        );
                    }
                }
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds surface point features to the scene excluding those, which are
     * already secondary structure points.
     *
     * @param surfaceAtomIds {Array} - contains ids of surface atoms
     * @param secondaryStructureMap {Object} - maps atom ids of atoms to NGL names of
     * the corresponding secondary structure point features in the NGL viewer
     */
    addGeomineSurfacePoints(surfaceAtomIds, secondaryStructureMap) {
        const structures = this.sceneData.structuresData.structures;
        for (const structureId in structures) {
            const structure = structures[structureId];
            const atoms = structure.atomsData.atomById;
            for (const atomId in atoms) {
                if (surfaceAtomIds.includes(atomId) && !secondaryStructureMap[atomId]) {
                    const atom = atoms[atomId];
                    let color = this.opts.colors[atom.element];
                    this.addGeominePointFeature(atom.coordinates,
                        atom.id,
                        'surface',
                        color,
                        2,
                        1,
                        parseInt(structureId)
                    );
                }
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds secondary structure point features to the scene.
     *
     * @param secondaryStructureMap {Object} - maps atom ids of atoms to NGL names of
     * the corresponding secondary structure point features in the NGL viewer
     */
    addGeomineSecondaryStructurePoints(secondaryStructureMap) {
        const structures = this.sceneData.structuresData.structures;
        for (const structureId in structures) {
            const structure = structures[structureId];
            const atoms = structure.atomsData.atoms;
            for (const atomId in atoms) {
                const atom = atoms[atomId];
                if (secondaryStructureMap[atom.id]) {
                    this.addGeominePointFeature(atom.coordinates,
                        secondaryStructureMap[atom.id],
                        'secondarystructure',
                        this.opts.geomine.SecondaryStructureColor,
                        3,
                        1,
                        parseInt(structureId)
                    );
                }
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds a query point feature for a selection point feature
     * (e.g. for an aromatic ring center) to the scene.
     *
     * @param nglFeatureName {String} - NGL name of selection point feature to select
     * @param queryPointName {String} - name of the query point
     * @param color {String} - color of the query point
     */
    addGeomineQueryPointForSelectionPoint(nglFeatureName, queryPointName, color) {
        const annotationsData = this.sceneData.annotationsData;
        const annotations = annotationsData.annotations;
        for (const annotationId in annotations) {
            const annotation = annotations[annotationId];
            const additionalInformation = annotation.additionalInformation;
            if (additionalInformation && additionalInformation.nglFeatureName &&
                additionalInformation.nglFeatureName === nglFeatureName) {
                this.svgDrawer.annotationDrawer.unselectAnnotationDrawareaContainer(parseInt(
                    annotationId), false, false);
                this.addGeominePointFeature(annotation.coordinates,
                    queryPointName,
                    'point',
                    color,
                    5,
                    1,
                    annotation.structureLink
                );
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds a query point for an atom to the scene.
     *
     * @param atomId {String} - id of the atom to select
     * @param queryPointName {String} - name of the query point
     * @param color {String} - color of the query point
     */
    addGeomineQueryPointForAtom(atomId, queryPointName, color) {
        const structuresData = this.sceneData.structuresData;
        const structureId = structuresData.atomIdsToStructure[atomId];
        if (structureId !== undefined) {
            this.svgDrawer.atomDrawer.unselectAtomDrawareaContainer(structureId,
                atomId,
                false,
                false
            );
            const structure = structuresData.structures[structureId];
            const atom = structure.atomsData.atomById[atomId];
            if (atom) {
                this.addGeominePointFeature(atom.coordinates,
                    queryPointName,
                    'point',
                    color,
                    5,
                    1,
                    structureId
                );
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds a query point or selection point feature to the scene.
     *
     * @param coordinates {Object} - coordinates of the point
     * @param nglFeatureName {String} - name of the feature
     * @param nglFeatureType {String} - type of the feature, e.g. 'point'
     * @param backgroundColor {String} - color of the point
     * @param backgroundRadius {Number} - radius of the points
     * @param opacity {Number} - opacity of the point
     * @param structureId {Number} - id of structure that point belongs to
     */
    addGeominePointFeature(coordinates,
        nglFeatureName,
        nglFeatureType,
        backgroundColor,
        backgroundRadius,
        opacity,
        structureId = 0
    ) {
        const annotations = this.sceneData.annotationsData.annotations;
        const annotationId = AddHandler.getNextId(annotations);
        const annotation = {
            id: annotationId,
            label: '',
            coordinates: coordinates,
            isStructureLabel: true,
            additionalInformation: {
                nglFeatureName: nglFeatureName,
                nglFeatureType: nglFeatureType,
                backgroundColor: backgroundColor,
                backgroundRadius: backgroundRadius,
                opacity: opacity
            },
            belongsTo: {
                type: 'structure', id: structureId, atomLinks: []
            }
        };
        this.addToScene(JSON.stringify({
            scene: {
                annotations: [annotation]
            }
        }), false);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds a selected point to point constraints to the scene.
     *
     * @param nglFeatureName {String} - NGL name of the point to point constraint
     * @param color {String} - color of the point to point constraint
     * @param type {String} - type of the point to point constraint, e.g. 'distance'
     */
    addGeomineQueryPointToPointConstraint(nglFeatureName, color, type) {
        const annotationsData = this.sceneData.annotationsData;
        const selectedAnnotations = annotationsData.selectedAnnotations;
        const annotations = annotationsData.annotations;
        const selectedAnnotationsArray = Array.from(selectedAnnotations);
        const annotationId1 = selectedAnnotationsArray[0];
        const annotationId2 = selectedAnnotationsArray[1];
        const annotation1 = annotations[annotationId1];
        const annotation2 = annotations[annotationId2];
        if (annotation1 === undefined || annotation2 === undefined) return;
        const fromStructure = annotation1.structureLink;
        const toStructure = annotation2.structureLink;
        const json = {scene: {}};
        json.scene[type] = [
            {
                id: AddHandler.getNextId(this.sceneData.intermolecularData[type]),
                fromStructure: fromStructure,
                toStructure: toStructure,
                from: annotation1.id,
                to: annotation2.id,
                additionalInformation: {
                    nglFeatureName: nglFeatureName, nglFeatureType: type, color: color
                }
            }
        ];
        this.addToScene(JSON.stringify(json), false);
        this.svgDrawer.annotationDrawer.unselectAnnotationDrawareaContainer(annotationId1,
            false,
            false
        );
        this.svgDrawer.annotationDrawer.unselectAnnotationDrawareaContainer(annotationId2,
            false,
            false
        );
        this.svgDrawer.intermolecularDrawer.updateIntermolecularConnections(fromStructure,
            toStructure
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds an angle between two point to point constraints to the scene.
     *
     * @param nglFeatureName {String} - NGL name of the angle
     * @param color {String} - color of the angle
     */
    addGeomineQueryAngle(nglFeatureName, color) {
        const selected = [];
        const intermolecularData = this.sceneData.intermolecularData;
        for (const ptopName of intermolecularData.ptopNames) {
            const selectedIntermolecularOfType = Array.from(intermolecularData.selectedIntermolecular[ptopName]);
            for (const intermolecularId of selectedIntermolecularOfType) {
                selected.push({id: intermolecularId, type: ptopName})
            }
        }
        const selectedFirst = selected[0];
        const selectedSecond = selected[1];
        if (selectedFirst === undefined || selectedSecond === undefined) return;
        const firstIntermolecularType = selectedFirst.type;
        const firstIntermolecularId = selectedFirst.id;
        const secondIntermolecularType = selectedSecond.type;
        const secondIntermolecularId = selectedSecond.id;
        const intermolecularEdge1 = intermolecularData[firstIntermolecularType][firstIntermolecularId];
        const intermolecularEdge2 = intermolecularData[secondIntermolecularType][secondIntermolecularId];
        let commonStructure = intermolecularEdge1.fromStructure;
        if (intermolecularEdge1.toStructure === intermolecularEdge2.toStructure) {
            commonStructure = intermolecularEdge1.toStructure;
        }
        let commonPoint = intermolecularEdge1.from;
        let point1 = intermolecularEdge1.to;
        let point2 = intermolecularEdge2.to;
        if (intermolecularEdge1.to === intermolecularEdge2.to) {
            commonPoint = intermolecularEdge1.to;
            point1 = intermolecularEdge1.from;
            point2 = intermolecularEdge2.from;
        } else if (intermolecularEdge1.from === intermolecularEdge2.to) {
            commonPoint = intermolecularEdge1.from;
            point1 = intermolecularEdge1.to;
            point2 = intermolecularEdge2.from;
        } else if (intermolecularEdge1.to === intermolecularEdge2.from) {
            commonPoint = intermolecularEdge1.to;
            point1 = intermolecularEdge1.from;
            point2 = intermolecularEdge2.to;
        }
        const annotationsData = this.sceneData.annotationsData;
        const annotations = this.sceneData.annotationsData.annotations;
        const annotationCommon = annotations[commonPoint];
        const annotations1 = annotations[point1];
        const annotations2 = annotations[point2];
        const vecNorm1 = VectorCalculation.vectorizeLine(annotationCommon.coordinates,
            annotations1.coordinates
        );
        const vecNorm2 = VectorCalculation.vectorizeLine(annotationCommon.coordinates,
            annotations2.coordinates
        );
        const lengthVecNorm1 = VectorCalculation.vectorLength(vecNorm1);
        const lengthVecNorm2 = VectorCalculation.vectorLength(vecNorm2);
        vecNorm1.x = vecNorm1.x / lengthVecNorm1
        vecNorm1.y = vecNorm1.y / lengthVecNorm1
        vecNorm2.x = vecNorm2.x / lengthVecNorm2
        vecNorm2.y = vecNorm2.y / lengthVecNorm2
        const bisector = VectorCalculation.vectorAdd(vecNorm1, vecNorm2)
        const lengthbisector = VectorCalculation.vectorLength(bisector);
        bisector.x = bisector.x / lengthbisector
        bisector.y = bisector.y / lengthbisector
        const endx = annotationCommon.coordinates.x + 4 * bisector.x
        const endy = annotationCommon.coordinates.y + 4 * bisector.y
        if (!intermolecularEdge1 === undefined || !intermolecularEdge2 === undefined) return;
        const annotationId = AddHandler.getNextId(annotationsData.annotations);
        const annotation = {
            id: annotationId,
            label: '',
            coordinates: {x: endx, y: endy},
            isStructureLabel: true,
            additionalInformation: {
                nglFeatureName: nglFeatureName,
                nglFeatureType: 'angle',
                backgroundColor: color,
                backgroundRadius: 4,
                opacity: 1
            },
            belongsTo: {
                type: 'structure', id: commonStructure, atomLinks: []
            }
        };
        this.addToScene(JSON.stringify({
            scene: {
                annotations: [annotation]
            }
        }), false);
        this.svgDrawer.intermolecularDrawer.unselectIntermolecularDrawareaContainer(firstIntermolecularId,
            firstIntermolecularType,
            false,
            false
        );
        this.svgDrawer.intermolecularDrawer.unselectIntermolecularDrawareaContainer(secondIntermolecularId,
            secondIntermolecularType,
            false,
            false
        );
    }
}
