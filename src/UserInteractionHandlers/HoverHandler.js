/**
 * Processes hover user interactions with the draw area.
 */
class HoverHandler {
    /**
     * Contains instances for the data storage/access, user interaction tracking,
     * draw area manipulation, mouse hover handling with drawn objects and
     * configuration options.
     * A callback executed after hovering can be set optionally.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     * @param interactionState {Object} - tracks user interactions
     * @param svgDrawer {Object} - updates the draw area
     */
    constructor(opts, sceneData, interactionState, svgDrawer) {
        this.opts = opts;
        this.sceneData = sceneData;
        this.interactionState = interactionState;
        this.svgDrawer = svgDrawer;

        this.collisionFinder = new CollisionFinder(opts, sceneData);
        this.hoverCallback = null;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Triggers hover behavior based on current cursor position.
     */
    handleHoverAtCurrentCursor() {
        if (this.interactionState.cursorPos) {
            this.handleHover(this.interactionState.cursorPos);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * As part of user interaction, it handles hovering over the scene. This paints
     * selection shapes of hovered elements in the hover color and logs hovered
     * atoms/bonds as selection candidates to be fully selected on click/touch.
     * To discern which elements are hovered, collision detection is performed.
     *
     * @param drawAreaCoords {Object} - x- and y-coordinates of current
     * cursor screen position translated to position in draw area
     */
    handleHover(drawAreaCoords) {
        //reset previous hover information
        this.interactionState.interaction.resetAllButMirrorInfo();
        //remove previous hover colors
        this.unselectAllHovered();
        //perform collision detection and find which elements may be affected
        //by interaction based on found hits
        const realCoords = this.interactionState.getRealCoordinates(drawAreaCoords);
        //find first valid hit and handle hit function
        let hit;
        (() => {
            //annotation hits with highest priority
            hit = this.collisionFinder.findLastCollisionAnnotation([realCoords]);
            if (hit) {
                this.handleHoverAnnotation(hit);
                return;
            }
            //if control point of spline is hit, spline can be manipulated
            hit = this.collisionFinder.findFirstCollisionSplines([realCoords]);
            if (hit) {
                this.handleHoverSplineHit(hit);
                return;

            }
            //if spline path is hovered, show where interaction points are
            hit = this.collisionFinder.findFirstCollisionSplinePath(realCoords);
            if (hit) {
                this.handleHoverCompleteSplineHit(hit);
                return;
            }
            hit = this.collisionFinder.findLastIntermolecularCollision([realCoords]);

            if (hit) {
                this.handleHoverIntermolecularHit(hit);
                return;
            }
            //structure hits with lowest priority
            hit = this.collisionFinder.findFirstStructureCollision([realCoords]);
            if (hit) {
                this.handleHoverStructureHit(hit);
            }
        })();
        //report to callback
        if (this.hoverCallback) {
            this.hoverCallback(hit || false);
        }

        if (!hit) {
            //finish reset (can be safely done anywhere after structure hit check)
            this.interactionState.interaction.resetMirrorInfo();

            //prepare full structure rotation
            this.interactionState.setInteractionRotationFullScene();
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles when a user hovers an annotation, highlights it in the scene and
     * marks it in the drawer's Interaction object.
     *
     * @param labelId {Number} - id of the hovered annotation
     * @param structureLink {Number} - structure (id) the annotation belongs to
     */
    handleHoverAnnotation({id: labelId, structureLink: structureLink}) {
        if (this.opts.allowedInteraction.includes('movement')) {
            this.interactionState.interaction.movement.annotations.add(labelId);
        }
        if (this.opts.allowedInteraction.includes('remove')) {
            this.interactionState.interaction.remove.annotations.add(labelId);
        }
        this.svgDrawer.annotationDrawer.hoverAnnotation(labelId);
        this.interactionState.interaction.addSelectionCandidate(structureLink,
            labelId,
            'annotation'
        );
        this.interactionState.selectionHovered = false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles when a user hovers an atom as part of handleHoverStructureHit().
     *
     * @param structureId {Number} - id of the structure the atom belongs to
     * @param atomId {Number} - id of the hovered atom
     */
    handleHoverAtom(structureId, atomId) {
        const structure = this.sceneData.structuresData.structures[structureId];
        if (this.opts.allowedInteraction.includes('remove')) {
            this.interactionState.interaction.remove.atoms.add(atomId);
        }
        this.svgDrawer.atomDrawer.hoverAtom(structureId, atomId);
        if (structure.atomsData.selectedAtoms.has(atomId) && this.opts.moveAllSelection) {
            //selection is hovered, signal that
            this.interactionState.selectionHovered = true;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles when a user hovers a bond as part of handleHoverStructureHit().
     *
     * @param structureId {Number} - id of the structure the bond belongs to
     * @param edgeId {Number} - id of the hovered bond
     */
    handleHoverEdge(structureId, edgeId) {
        const structure = this.sceneData.structuresData.structures[structureId];
        if (this.opts.allowedInteraction.includes('remove')) {
            this.interactionState.interaction.remove.edges.add({
                structureId: structureId,
                edgeId: edgeId
            });
        }
        this.svgDrawer.edgeDrawer.hoverEdge(structureId, edgeId);
        if (structure.edgesData.selectedEdges.has(edgeId) && this.opts.moveAllSelection) {
            //selection is hovered, signal that
            this.interactionState.selectionHovered = true;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles when a user hovers a control point of a spline representing a
     * hydrophobic contact, highlights it in the scene and marks it in the
     * drawer's Interaction object.
     *
     * @param structureId {Number} - id of the structure the hydrophobic
     * contact belongs to
     * @param hydrophobicId {Number} - id of the hydrophobic contact
     * @param controlPointId {Number} - id of the hovered control point
     */
    handleHoverSplineHit({structureId, hydrophobicId, controlPointId}) {
        const interaction = this.interactionState.interaction;
        if (this.opts.allowedInteraction.includes('movement')) {
            interaction.movement.splineControlPoints[hydrophobicId] = [controlPointId];
        }
        if (this.opts.allowedInteraction.includes('remove')) {
            interaction.remove.hydrophobicContacts.add({
                id: hydrophobicId, controlPoints: [controlPointId]
            })
        }
        if (this.opts.allowedInteraction.includes('rotation') && !this.opts.geomineMode) {
            const rotation = this.interactionState.interaction.rotation;
            rotation.type = 'singleSpline';
            const controlPointIds =
                this.sceneData.hydrophobicData.hydrophobicContacts[hydrophobicId].getControlPointIds();
            rotation.splineControlPoints[hydrophobicId] = new Set(controlPointIds);
        }
        if (this.opts.allowedInteraction.includes('lineMirror')) {
            const lineMirror = this.interactionState.interaction.lineMirror;
            const controlPointIds =
                this.sceneData.hydrophobicData.hydrophobicContacts[hydrophobicId].getControlPointIds();
            lineMirror.splineControlPoints[hydrophobicId] = new Set(controlPointIds);
        }
        this.svgDrawer.hydrophobicDrawer.hoverHydrophobicControlPoint(structureId,
            hydrophobicId,
            controlPointId
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles when a user hovers a spline (which is no control point) representing
     * a hydrophobic contact, highlights all control points of this spline in the
     * scene and marks it in the drawer's Interaction object.
     *
     * @param structureId {Number} - id of the structure the hydrophobic
     * contact belongs to
     * @param hydrophobicId {Number} - id of the hydrophobic contact
     * @param controlPointIds {Array} - ids of the hovered control points
     */
    handleHoverCompleteSplineHit({structureId, hydrophobicId, controlPointIds}) {
        const interaction = this.interactionState.interaction;
        if (this.opts.allowedInteraction.includes('movement')) {
            interaction.movement.splineControlPoints[hydrophobicId] = controlPointIds;
        }
        if (this.opts.allowedInteraction.includes('remove')) {
            interaction.remove.hydrophobicContacts.add({
                id: hydrophobicId, controlPoints: controlPointIds
            })
        }
        if (this.opts.allowedInteraction.includes('rotation') && !this.opts.geomineMode) {
            const rotation = this.interactionState.interaction.rotation;
            rotation.type = 'singleSpline';
            rotation.splineControlPoints[hydrophobicId] = new Set(controlPointIds);
        }
        if (this.opts.allowedInteraction.includes('lineMirror')) {
            const lineMirror = this.interactionState.interaction.lineMirror;
            const controlPointIds =
                this.sceneData.hydrophobicData.hydrophobicContacts[hydrophobicId].getControlPointIds();
            lineMirror.splineControlPoints[hydrophobicId] = new Set(controlPointIds);
        }
        this.svgDrawer.hydrophobicDrawer.hoverAllHydrophobicControlPoints(structureId,
            hydrophobicId
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles when a user hovers an intermolecular edge,
     * highlights candidates in the scene and marks them in the
     * drawer's Interaction object.
     *
     * @param hit {Object} - details on which draw element is hit (logs
     * "type" as "atomPairInteraction", "piStacking" or "cationPiStacking"
     * and "id" of hit element)
     */
    handleHoverIntermolecularHit(hit) {
        const {id: id, type: type} = hit;
        if (!this.sceneData.intermolecularData[type].hasOwnProperty(id)) {
            return;
        }
        this.handleHoverIntermolecular(id, type);
        this.interactionState.selectionHovered = false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles when a user hovers an interaction as part of
     * handleHoverStructureHit().
     *
     * @param interactionId {Number} - id of the interaction to unselect
     * @param type {String} - identifier of the intermolecular edge
     */
    handleHoverIntermolecular(interactionId, type) {
        const interaction = this.interactionState.interaction;
        if (this.opts.allowedInteraction.includes('remove')) {
            interaction.remove[type].add(interactionId);
        }
        this.svgDrawer.intermolecularDrawer.hoverIntermolecular(interactionId, type);
        if (!this.sceneData.intermolecularData.selectedIntermolecular[type].has(interactionId)) {
            interaction.movement[type] = new Set([interactionId]);
        } else if (this.opts.moveAllSelection) {
            //selection is hovered, signal that
            this.interactionState.selectionHovered = true;
        }
        this.interactionState.interaction.addSelectionCandidate(interaction.fromStructure,
            interactionId,
            type
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles when a user hovers an structure circle as part of
     * handleHoverStructureHit().
     *
     * @param structureId {Number} - id of the structure
     */
    handleHoverStructureCircle(structureId) {
        const structure = this.sceneData.structuresData.structures[structureId];
        if (this.opts.allowedInteraction.includes("remove")) {
            this.interactionState.interaction.remove.structures.add(structureId);
        }
        this.svgDrawer.structureCircleDrawer.hoverStructureCircle(structureId);
        if (structure.representationsData.selectedStructureCircle && this.opts.moveAllSelection) {
            //selection is hovered, signal that
            this.interactionState.selectionHovered = true;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles when a user hovers an atom or bond of a structure. Discerns
     * candidates to move at once (based on move freedom level), highlights them
     * in the scene and marks them in the drawer's Interaction object.
     *
     * @param hit {Object} - details on which draw element is hit (logs
     * "structureId", "type" as "atom", "edge" or "structure circle"
     * and "id" of hit element)
     */
    handleHoverStructureHit(hit) {
        const {structureId, type, id} = hit;
        if (!this.sceneData.structuresData.structures.hasOwnProperty(structureId)) {
            return;
        }
        const structure = this.sceneData.structuresData.structures[structureId];
        //color selection shapes of atom/bond and mark in this.interactionState.selectionHovered
        //if a selected element is hovered
        switch (type) {
            case 'structureCircle':
                if (!structure.representationsData.hasRepresentation(StructureRepresentation.circle)) {
                    return;
                }
                this.handleHoverStructureCircle(structureId);
                //mirror info only relevant for bond mirroring
                this.interactionState.interaction.resetMirrorInfo();
                break;
            case 'atom':
                if (!this.sceneData.structuresData.structureHasElements([{id: id}],
                    [],
                    structureId
                )) {
                    return;
                }
                this.handleHoverAtom(structureId, id);
                //mirror info only relevant for bond mirroring
                this.interactionState.interaction.resetMirrorInfo();
                break;
            case 'edge':
                if (!this.sceneData.structuresData.structureHasElements([],
                    [{id: id}],
                    structureId
                )) {
                    return;
                }
                this.handleHoverEdge(structureId, id);
                if (this.opts.allowedInteraction.includes('bondMirror')) {
                    this.interactionState.setInteractionEdgeMirror(structureId, id);
                }
                break;
        }
        //infer relevant elements to move for the different interaction modes
        if (this.opts.allowedInteraction.includes('movement') && !this.opts.geomineMode) {
            const selectionHovered = this.interactionState.selectionHovered;
            this.interactionState.setInteractionMovement(structureId, id, type, selectionHovered);
        }
        if (this.opts.allowedInteraction.includes('rotation') && !this.opts.geomineMode) {
            const selectionHovered = this.interactionState.selectionHovered;
            this.interactionState.setInteractionRotation(structureId, selectionHovered);
        }
        if (this.opts.allowedInteraction.includes('lineMirror')) {
            this.interactionState.setInteractionLineMirror(structureId);
        }
        if (this.opts.allowedInteraction.includes('remove') &&
            this.interactionState.selectionHovered) {
            this.interactionState.interaction.remove.selected = true;
        }
        //candidates confirmed in handleMouseUp, dismissed by movement
        this.interactionState.interaction.addSelectionCandidate(structureId, id, type);
        //reset information on if selection is hovered
        this.interactionState.selectionHovered = false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Instructs the draw layer to unselect (= hide selection shapes) all
     * currently hovered annotations, atoms and bonds that are NOT selected.
     * Hovering is removed for all other draw object types.
     */
    unselectAllHovered() {
        for (const structureId in this.sceneData.structuresData.structures) {
            const structure = this.sceneData.structuresData.structures[structureId];
            structure.atomsData.atoms.forEach(({id: atomId}) => {
                if (!structure.atomsData.selectedAtoms.has(atomId)) {
                    this.svgDrawer.atomDrawer.unselectAtomDrawarea(structureId, atomId);
                } else {
                    this.svgDrawer.atomDrawer.selectAtomDrawarea(structureId, atomId)
                }
            });
            structure.edgesData.edges.forEach(({id: edgeId}) => {
                if (!structure.edgesData.selectedEdges.has(edgeId)) {
                    this.svgDrawer.edgeDrawer.unselectEdgeDrawarea(structureId, edgeId);
                } else {
                    this.svgDrawer.edgeDrawer.selectEdgeDrawarea(structureId, edgeId);
                }
            });
            if (structure.representationsData.hasRepresentation(StructureRepresentation.circle) &&
                !structure.representationsData.selectedStructureCircle) {
                this.svgDrawer.structureCircleDrawer.unselectStructureCircleDrawarea(structureId);
            } else if (
                structure.representationsData.hasRepresentation(StructureRepresentation.circle) &&
                structure.representationsData.selectedStructureCircle) {
                this.svgDrawer.structureCircleDrawer.selectStructureCircleDrawarea(structureId);
            }
        }
        for (const annotationId in this.sceneData.annotationsData.annotations) {
            if (!this.sceneData.annotationsData.selectedAnnotations.has(parseInt(annotationId))) {
                this.svgDrawer.annotationDrawer.unselectAnnotationDrawarea(annotationId);
            } else {
                this.svgDrawer.annotationDrawer.selectAnnotationDrawarea(parseInt(annotationId));
            }
        }
        for (const type of this.sceneData.intermolecularData.intermolecularTypes) {
            for (const intermolecularId in this.sceneData.intermolecularData[type]) {
                if (!this.sceneData.intermolecularData.selectedIntermolecular[type].has(parseInt(
                    intermolecularId))) {
                    this.svgDrawer.intermolecularDrawer.unselectIntermolecularDrawarea(intermolecularId,
                        type
                    );
                } else {
                    this.svgDrawer.intermolecularDrawer.selectIntermolecularDrawarea(intermolecularId,
                        type
                    );
                }
            }
        }
        this.svgDrawer.hydrophobicDrawer.unselectAllSplines();
        this.svgDrawer.intermolecularDrawer.unselectAllIntermolecular();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hovers a query or selection point feature in the scene.
     *
     * @param nglFeatureName {String} - NGL name of the point feature to hover
     * @param nglFeatureType {String} - type of the point feature
     */
    hoverGeominePointFeature(nglFeatureName, nglFeatureType) {
        const annotationsData = this.sceneData.annotationsData;
        const annotations = annotationsData.annotations;
        for (const annotationId in annotations) {
            const annotation = annotations[annotationId];
            const additionalInformation = annotation.additionalInformation;
            if (additionalInformation && additionalInformation.nglFeatureType &&
                additionalInformation.nglFeatureType === nglFeatureType &&
                additionalInformation.nglFeatureName && additionalInformation.nglFeatureName ===
                nglFeatureName) {
                const hover = {
                    structureLink: annotation.structureLink, id: annotationId
                };
                this.handleHoverAnnotation(hover);
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hovers a point to point constraint in the scene.
     *
     * @param nglFeatureName {String} - NGL name of the point to point constraint to hover
     * @param type {String} - type of the point to point constraint
     */
    hoverGeomineQueryPointToPointConstraint(nglFeatureName, type) {
        const intermolecularData = this.sceneData.intermolecularData;
        const ptops = intermolecularData[type];
        for (const ptopId in ptops) {
            const ptop = ptops[ptopId];
            const additionalInformation = ptop.additionalInformation;
            if (additionalInformation && additionalInformation.nglFeatureName &&
                additionalInformation.nglFeatureName === nglFeatureName) {
                const hover = {
                    type: type, id: ptopId
                };
                this.handleHoverIntermolecularHit(hover);
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hovers an atom specified by id in the scene.
     *
     * @param atomId {Number} - id of the atom that shall be hovered
     */
    hoverAtomByInfileId(atomId) {
        const structures = this.sceneData.structuresData.structures;
        for (const structureId in structures) {
            const structure = structures[structureId];
            const atoms = structure.atomsData.atomById;
            for (const id in atoms) {
                const atom = atoms[id];
                if (!atom.additionalInformation || !atom.additionalInformation.infileId) {
                    continue;
                }
                let infileId = atom.additionalInformation.infileId;
                if (atomId === infileId) {
                    const hover = {
                        type: 'atom', structureId: structureId, id: parseInt(id)
                    };
                    this.handleHoverStructureHit(hover);
                }
            }
        }
    }
}
