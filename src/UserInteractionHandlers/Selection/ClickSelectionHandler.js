/**
 * Processes selection user interactions with the draw area by clicking on draw objects,
 * used directly or in context of the lasso/rectangle selection.
 */
class ClickSelectionHandler {
    /**
     * Contains instances for the data storage/access, user interaction tracking,
     * draw area manipulation, mouse click handling with drawn objects and
     * configuration options. An optional callback can be set that is executed after
     * scene clicks in the blank.
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

        this.clickInTheBlankCallback = null;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles the start of user interaction when one of the selection modes is
     * chosen. Determines the start point of used lasso/rect. selection polygons.
     *
     * @param interactionMode {InteractionMode} - mode of the corresponding
     * interaction
     */
    handleSelectionStart(interactionMode) {
        this.svgDrawer.structureDrawer.resetSelections();
        this.svgDrawer.structureDrawer.clearTempSelections();
        const realStart = this.interactionState.getRealCoordinates(this.interactionState.interaction.start);
        this.selectHits(this.collisionFinder.findCollisions([realStart]), true);
        if (interactionMode === InteractionMode.freeSelect) {
            this.interactionState.selectionPoints.push(realStart);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Selects atoms, bonds and structure circles in the draw area based on
     * hits found during collision detection.
     *
     * @param hitAtoms {Object} - map from structure ids to Arrays of atom ids
     * of atoms to select
     * @param hitEdges {Object} - map from structure ids to Arrays of bond ids
     * of bonds to select
     * @param hitStructureCircles {Array} - array of structure ids which structure circles
     * to select
     * @param byTemp {Boolean} - whether to fully commit hits or log as
     * temporary hits instead (to be committed later)
     */
    selectHits({hitAtoms, hitEdges, hitStructureCircles}, byTemp = false) {
        for (const structureId in hitAtoms) {
            hitAtoms[structureId].forEach(atomId => {
                if (byTemp) {
                    this.svgDrawer.atomDrawer.tempSelectAtom(structureId, atomId);
                } else {
                    this.svgDrawer.atomDrawer.selectAtomDrawareaContainer(structureId, atomId);
                }
            });
        }
        for (const structureId in hitEdges) {
            hitEdges[structureId].forEach(edgeId => {
                if (byTemp) {
                    this.svgDrawer.edgeDrawer.tempSelectEdge(structureId, edgeId);
                } else {
                    this.svgDrawer.edgeDrawer.selectEdgeDrawareaContainer(structureId, edgeId);
                }
            });
        }
        for (const structureId of hitStructureCircles) {
            if (byTemp) {
                this.svgDrawer.structureCircleDrawer.tempSelectStructureCircle(structureId);
            } else {
                this.svgDrawer.structureCircleDrawer.selectStructureCircleDrawareaContainer(
                    structureId);
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Switches selection status of elements marked as selection candidates.
     */
    switchSelectionCandidates() {
        this.iterateSelectionCandidates({
            atomCallback: (structure, id) => {
                this.handleSelectionSwitchAtom(structure, id);
            }, edgeCallback: (structure, id) => {
                this.handleSelectionSwitchEdge(structure, id);
            }, structureCircleCallback: (structure, id) => {
                this.handleSelectionSwitchStructureCircle(structure);
            }, annotationCallback: (structure, id) => {
                this.handleSelectionSwitchAnnotation(id);
            }, intermolecularCallback: (id, type) => {
                this.handleSelectionSwitchIntermolecular(id, type);
            }
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Switches selection status of an edge.
     *
     * @param structure {Structure} - Structure object holding the bond
     * @param edgeId {Number} - edge to switch selection for
     */
    handleSelectionSwitchEdge(structure, edgeId) {
        if (structure.edgesData.selectedEdges.has(edgeId)) {
            this.svgDrawer.edgeDrawer.unselectEdgeDrawareaContainer(structure.id, edgeId, true);
        } else {
            this.svgDrawer.edgeDrawer.selectEdgeDrawareaContainer(structure.id, edgeId);
            structure.edgesData.findAtomsToSelectOnEdgeSelect(edgeId)
                .forEach(atomId => {
                    this.svgDrawer.atomDrawer.selectAtomDrawareaContainer(structure.id, atomId);
                });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Switches selection status of an atom.
     *
     * @param structure {Structure} - Structure object holding the atom
     * @param atomId {Number} - atom to switch selection for
     */
    handleSelectionSwitchAtom(structure, atomId) {
        if (structure.atomsData.selectedAtoms.has(atomId)) {
            this.svgDrawer.atomDrawer.unselectAtomDrawareaContainer(structure.id, atomId, true);
        } else {
            this.svgDrawer.atomDrawer.selectAtomDrawareaContainer(structure.id, atomId);
        }
    };

    /*----------------------------------------------------------------------*/

    /**
     * Switches selection status of a structure circle.
     *
     * @param structure {Structure} - Structure object the structure circle
     * belongs to
     */
    handleSelectionSwitchStructureCircle(structure) {
        if (structure.representationsData.selectedStructureCircle) {
            this.svgDrawer.structureCircleDrawer.unselectStructureCircleDrawareaContainer(structure.id,
                true
            );
        } else {
            this.svgDrawer.structureCircleDrawer.selectStructureCircleDrawareaContainer(structure.id);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Switches selection status of an annotation.
     *
     * @param annotationId {Number} - annotation to switch selection for
     */
    handleSelectionSwitchAnnotation(annotationId) {
        if (this.sceneData.annotationsData.selectedAnnotations.has(annotationId)) {
            this.svgDrawer.annotationDrawer.unselectAnnotationDrawareaContainer(annotationId, true);
        } else {
            this.svgDrawer.annotationDrawer.selectAnnotationDrawareaContainer(annotationId);
        }
    };

    /*----------------------------------------------------------------------*/

    /**
     * Switches selection status of an intermolecular edge.
     *
     * @param intermolecularId {Number} - intermolecular edge to switch selection for
     * @param type {String} - type of this intermolecular edge
     */
    handleSelectionSwitchIntermolecular(intermolecularId, type) {
        if (this.sceneData.intermolecularData.selectedIntermolecular[type].has(intermolecularId)) {
            this.svgDrawer.intermolecularDrawer.unselectIntermolecularDrawareaContainer(intermolecularId,
                type,
                true
            );
        } else {
            this.svgDrawer.intermolecularDrawer.selectIntermolecularDrawareaContainer(intermolecularId,
                type
            );
        }
    };

    /*----------------------------------------------------------------------*/

    /**
     * During movement mode at the start of user interaction, select atoms and
     * and bonds clicked on/touched to convey interaction happening.
     */
    handleInteractionSelect() {
        this.iterateSelectionCandidates({
            atomCallback: (structure, id) => {
                this.svgDrawer.atomDrawer.selectAtomDrawarea(structure.id, id);
            }, edgeCallback: (structure, id) => {
                this.svgDrawer.edgeDrawer.selectEdgeDrawarea(structure.id, id);
            }, structureCircleCallback: (structure, id) => {
                this.svgDrawer.structureCircleDrawer.selectStructureCircleDrawarea(id);
            }, annotationCallback: (structure, id) => {
                this.svgDrawer.annotationDrawer.selectAnnotationDrawarea(id);
            }, intermolecularCallback: (id, type) => {
                this.svgDrawer.intermolecularDrawer.selectIntermolecularDrawarea(id, type);
            }
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Iterates over all selection candidates and performs provided callbacks
     * depending on the type of the individual candidates.
     *
     * @param atomCallback {Function} - callback to call for selection
     * candidates of type 'atom'
     * @param edgeCallback {Function} - callback to call for selection
     * candidates of type 'edge'
     * @param structureCircleCallback {Function} - callback to call for selection
     * candidates of type 'structureCircle'
     * @param annotationCallback {Function} - callback to call for selection
     * candidates of type 'annotation'
     * @param intermolecularCallback {Function} - callback to call for selection
     * candidates of type 'intermolecular'
     */
    iterateSelectionCandidates({
        atomCallback,
        edgeCallback,
        structureCircleCallback,
        annotationCallback,
        intermolecularCallback
    }) {
        const selectionCandidates = this.interactionState.interaction.selectionCandidates;
        for (const structureId in selectionCandidates) {
            const structure = this.sceneData.structuresData.structures[structureId];
            selectionCandidates[structureId]
                .forEach(({type, id}) => {
                    switch (type) {
                        case 'annotation':
                            annotationCallback(structure, id);
                            break;
                        case 'atom':
                            atomCallback(structure, id);
                            break;
                        case 'edge':
                            edgeCallback(structure, id);
                            break;
                        case 'atomPairInteractions':
                        case 'piStackings':
                        case 'cationPiStackings':
                        case 'interactions':
                        case 'distances':
                            intermolecularCallback(id, type);
                            break;
                        case 'structureCircle':
                            structureCircleCallback(structure, id);
                            break;
                    }
                });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles scene clicks in the blank via an optional callback.
     */
    handleClickInTheBlank() {
        const selectionCandidates = this.interactionState.interaction.selectionCandidates;
        if (Object.keys(selectionCandidates).length === 0 && this.clickInTheBlankCallback) {
            const currentCoordinates = this.interactionState.getRealCoordinates(this.interactionState.interaction.start);
            this.clickInTheBlankCallback({coordinates: currentCoordinates});
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * (De)selects a point by its NGL name.
     *
     * @param nglFeatureName {String} - name of the corresponding point in the
     * NGL viewer
     * @param select {Boolean} - set true for selection else false
     */
    toggleSelectionGeominePoint(nglFeatureName, select) {
        const annotationsData = this.sceneData.annotationsData;
        const annotations = annotationsData.annotations;
        for (const annotationId in annotations) {
            const annotation = annotations[annotationId];
            const additionalInformation = annotation.additionalInformation;
            if (additionalInformation && additionalInformation.nglFeatureName &&
                additionalInformation.nglFeatureName === nglFeatureName) {
                if (select) {
                    this.svgDrawer.annotationDrawer.selectAnnotationDrawareaContainer(parseInt(
                        annotationId), false);
                } else {
                    this.svgDrawer.annotationDrawer.unselectAnnotationDrawareaContainer(parseInt(
                        annotationId), false, false);
                }
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * (De)selects a point to point constraint by its NGL name.
     *
     * @param nglFeatureName {String} - name of the corresponding point to point constraint
     * in the NGL viewer
     * @param select {Boolean} - set true for selection else false
     */
    toggleSelectionGeomineQueryPointToPointConstraint(nglFeatureName, select) {
        const intermolecularData = this.sceneData.intermolecularData;
        for (const ptopName of intermolecularData.ptopNames) {
            const intermolecularEdges = intermolecularData[ptopName];
            for (const intermolecularId in intermolecularEdges) {
                const intermolecularEdge = intermolecularEdges[intermolecularId];
                const additionalInformation = intermolecularEdge.additionalInformation;
                if (additionalInformation && additionalInformation.nglFeatureName ===
                    nglFeatureName) {
                    if (select) {
                        this.svgDrawer.intermolecularDrawer.selectIntermolecularDrawareaContainer(parseInt(intermolecularId),
                            ptopName,
                            false
                        );
                    } else {
                        this.svgDrawer.intermolecularDrawer.unselectIntermolecularDrawareaContainer(parseInt(intermolecularId),
                            ptopName,
                            false,
                            false
                        );
                    }
                }
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Deselects all currently selected points in the viewer.
     */
    deselectAllGeominePoints() {
        const annotationsData = this.sceneData.annotationsData;
        const annotations = annotationsData.annotations;
        for (const annotationId in annotations) {
            const annotation = annotations[annotationId];
            const additionalInformation = annotation.additionalInformation;
            if (additionalInformation && additionalInformation.nglFeatureName) {
                this.svgDrawer.annotationDrawer.unselectAnnotationDrawareaContainer(parseInt(
                    annotationId), false, false);
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Deselects all currently selected point to point constraints in the viewer.
     */
    deselectAllGeomineQueryPointToPointConstraints() {
        const intermolecularData = this.sceneData.intermolecularData;
        for (const ptopName of intermolecularData.ptopNames) {
            const intermolecularEdges = intermolecularData[ptopName];
            for (const intermolecularId in intermolecularEdges) {
                const intermolecularEdge = intermolecularEdges[intermolecularId];
                const additionalInformation = intermolecularEdge.additionalInformation;
                if (additionalInformation && additionalInformation.nglFeatureName) {
                    this.svgDrawer.intermolecularDrawer.unselectIntermolecularDrawareaContainer(parseInt(intermolecularId),
                        ptopName,
                        false,
                        false
                    );
                }
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Deselects all currently selected query angles in the viewer.
     */
    deselectAllGeomineQueryAngles() {
        const annotationsData = this.sceneData.annotationsData;
        const annotations = annotationsData.annotations;
        for (const annotationId in annotations) {
            const annotation = annotations[annotationId];
            const additionalInformation = annotation.additionalInformation;
            if (additionalInformation && additionalInformation.nglFeatureName) {
                this.svgDrawer.annotationDrawer.unselectAnnotationDrawareaContainer(parseInt(
                    annotationId), false, false);
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Deselects all currently selected atoms in the viewer.
     */
    deselectAllAtoms() {
        const structures = this.sceneData.structuresData.structures;
        for (const structureId in structures) {
            const structure = structures[structureId];
            const selectedAtoms = structure.atomsData.selectedAtoms;
            for (const atomId of selectedAtoms) {
                this.svgDrawer.atomDrawer.unselectAtomDrawareaContainer(parseInt(structureId),
                    atomId,
                    false,
                    false
                );
            }
        }
    }

    /**
     * Deselects all annotations, intermolecular edges and structures in the viewer.
     */
    deselectEverything() {
        this.svgDrawer.structureDrawer.resetSelections(false);
        this.svgDrawer.structureDrawer.clearTempSelections();
        Object.keys(this.sceneData.annotationsData.annotations).forEach(labelId => {
            this.svgDrawer.annotationDrawer.unselectAnnotationDrawareaContainer(labelId,
                false,
                false
            );
        });
        for (const type of this.sceneData.intermolecularData.intermolecularTypes) {
            for (const intermolecularId in this.sceneData.intermolecularData[type]) {
                this.svgDrawer.intermolecularDrawer.unselectIntermolecularDrawareaContainer(intermolecularId,
                    type,
                    false,
                    false
                );
            }
        }
        if (this.clickInTheBlankCallback) {
            this.clickInTheBlankCallback();
        }
    }
}