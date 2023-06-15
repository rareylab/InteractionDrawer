/**
 * Processes movement user interactions with the draw area.
 */
class TranslationHandler {
    /**
     * Contains instances for the data storage/access, user interaction tracking,
     * draw area manipulation, movement of drawn objects and configuration options.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     * @param interactionState {Object} - tracks user interactions
     * @param svgDrawer {Object} - updates the draw area
     * @param hoverHandler {Object} - processes hover user
     * interactions with the draw area
     * @param clickSelectionHandler {Object} - processes selection user
     * interactions with the draw area
     */
    constructor(opts, sceneData, interactionState, svgDrawer, hoverHandler, clickSelectionHandler) {
        this.opts = opts;
        this.sceneData = sceneData;
        this.interactionState = interactionState;
        this.svgDrawer = svgDrawer;
        this.hoverHandler = hoverHandler;
        this.clickSelectionHandler = clickSelectionHandler;

        this.changeMapCreater = new ChangeMapCreater(opts, sceneData, interactionState);
    }

    /*----------------------------------------------------------------------*/

    /**
     * As part of the movement interaction mode (whenever no draw elements of
     * the scene are affected), translates the scene based on offsets between
     * cursor positions.
     *
     * @param drawAreaCoords {Object} - x- and y-coordinates of current
     * cursor screen position translated to position in draw area
     */
    handleTranslation(drawAreaCoords) {
        const xOffset = drawAreaCoords.x - this.interactionState.interaction.start.x;
        const yOffset = drawAreaCoords.y - this.interactionState.interaction.start.y;
        this.svgDrawer.viewerDrawer.transform({xOffset: xOffset, yOffset: yOffset});
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves draw elements marked for movement in this.interactionState.interaction.movement
     * based on offsets from previous cursor position to current cursor
     * position. Rejects very small movements based on the "selectionGrace"
     * parameter defined in the configuration.
     *
     * @param drawAreaCoords {Object} - x- and y-coordinates of current
     * cursor screen position translated to position in draw area
     * @returns {Boolean} - whether any movement was actually applied
     */
    handleMovement(drawAreaCoords) {
        let newStartReq = true;
        const interaction = this.interactionState.interaction;
        //decide if any movement is made based on specified grace
        const offset = this.interactionState.getOffsetsToInteractionStart(drawAreaCoords);
        //movement may be rejected bc of allowed grace
        const doMove = this.interactionState.decideMovementPossible(offset);
        if (!doMove) newStartReq = false;
        //only move when something is hovered currently
        if (Object.keys(interaction.movement.individualAtoms).length ||
            interaction.movement.fullStructures.length > 0) {
            if (doMove) {
                this.handleMolecularMovement(offset);
                //no longer go through with selection of clicked elements
                interaction.resetSelectionCandidates();
            }
            interaction.movement.didMove = true;
        }
        if (interaction.movement.annotations.size) {
            if (doMove) {
                this.handleAnnotationMovement(offset);
            }
            interaction.movement.didMove = true;
        }
        if (Object.keys(interaction.movement.splineControlPoints).length) {
            if (doMove) {
                this.handleSplineControlPointMovement(offset);
            }
            interaction.movement.didMove = true;
        }
        //if nothing hovered, translate the scene
        if (!this.opts.geomineMode && !interaction.movement.didMove) {
            this.handleTranslation(drawAreaCoords);
        }
        return newStartReq;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Cleanup step for the end of user interaction during execution of the
     * movement interaction mode. Commits new positions to history.
     */
    handleMovementEnd() {
        const interaction = this.interactionState.interaction;
        const movInt = interaction.movement;
        //if no movement occurred, select instead
        if (!movInt.didMove && this.opts.geomineMode) {
            this.clickSelectionHandler.switchSelectionCandidates();
            this.hoverHandler.handleHoverAtCurrentCursor();
        }
        const changeMap = {};
        //add molecular changes to change map
        if (Object.keys(movInt.individualAtoms).length) {
            this.handleMolecularMovementEnd(changeMap);
        }
        //add changes for annotations and splines
        if (movInt.annotations.size) {
            this.changeMapCreater.createAnnotationUpdateMap(movInt.annotations,
                movInt.fullStructures,
                changeMap,
                InteractionMode.movement
            );
        }
        if (Object.keys(movInt.splineControlPoints)) {
            this.changeMapCreater.createSplineControlPointUpdateMap(movInt.splineControlPoints,
                changeMap
            );
        }
        this.svgDrawer.applySceneChanges(changeMap);
        this.interactionState.resetAfterHoverEnd();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves molecular draw elements (atoms, bonds) marked for movement in the
     * drawer's Interaction object based on given offsets. Additionally, update
     * intermolecular forces connected to these draw elements.
     *
     * @param offset {Object} - x- and y-offsets to move draw elements by
     */
    handleMolecularMovement(offset) {
        const {
            fullStructures: movedStructures,
            partialStructures: partialMovedStructures,
            individualAtoms,
            ringSystems
        } = this.interactionState.interaction.movement;
        //atoms of full structures are not individually moved
        const atomsToMove = Helpers.filterObjectByKeys(individualAtoms, partialMovedStructures);
        const tempUpdates = {
            affectedAtoms: new StructureIdTracker(), offsets: {}
        };
        //movement + temp coordinate handling for fully moved structures
        this.handleFullStructureMovement(movedStructures, offset);
        movedStructures.forEach(structureId => {
            this.setNecessaryTempParametersStructureMovement(structureId, tempUpdates);
        });
        //movement + temp coordinate handling for partially moved structures
        const freedomLevel = this.opts.moveFreedomLevel;
        if (freedomLevel === 'free') {
            this.handleFreeStructureMovement(atomsToMove, ringSystems, offset);
        } else if (freedomLevel === 'rings') {
            this.handleRingsStructureMovement(atomsToMove, ringSystems, offset);
        }
        this.svgDrawer.atomDrawer.correctAtomTextPlacement(partialMovedStructures);
        //update intermolecular forces (assumes that all temporary updates are done here!)
        const {
            distances, interactions, atomPairInteractions, piStackings, cationPiStackings
        } = this.interactionState.interaction.movement;
        this.svgDrawer.intermolecularDrawer.updateAllIntermolecular(distances,
            interactions,
            atomPairInteractions,
            piStackings,
            cationPiStackings,
            false,
            true
        );
        this.resetTempCoordsAfterMovement(movedStructures, tempUpdates);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles movement in case moveFreedomLevel 'free' is active.
     *
     * @param atomsToMove {Array} - ids of atoms to update
     * @param ringSystems {Array} - ids of ring systems affected by
     * interaction (per structure)
     * @param offset {Object} - x- and y-offsets to move draw elements by
     */
    handleFreeStructureMovement(atomsToMove, ringSystems, offset) {
        this.svgDrawer.atomDrawer.updateTempCoordsForAtoms(atomsToMove, offset);
        this.svgDrawer.atomDrawer.moveAtomsByOffset(atomsToMove, offset);
        this.svgDrawer.ringDrawer.updateTempCoordsForAffectedRingSystems(ringSystems);
        const edgeChangeCases = this.svgDrawer.edgeDrawer.moveAffectedEdgesToTempCoordinates(
            atomsToMove);
        this.svgDrawer.edgeDrawer.moveAromaticEdgesToTempCoordinates(atomsToMove, edgeChangeCases);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles movement in case moveFreedomLevel 'rings' is active.
     *
     * @param atomsToMove {Array} - ids of atoms to update
     * @param ringSystems {Array} - ids of ring systems affected by
     * interaction (per structure)
     * @param offset {Object} - x- and y-offsets to move draw elements by
     */
    handleRingsStructureMovement(atomsToMove, ringSystems, offset) {
        this.svgDrawer.atomDrawer.updateTempCoordsForAtoms(atomsToMove, offset);
        this.svgDrawer.atomDrawer.moveNonRingAtomsByOffset(atomsToMove, offset);
        this.svgDrawer.ringDrawer.updateTempCoordsForAffectedRingSystems(ringSystems);
        this.svgDrawer.edgeDrawer.moveAffectedNonCyclicEdgesToTempCoordinates(atomsToMove);
        this.svgDrawer.ringDrawer.moveRingSystems(ringSystems, offset);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Accumulates new positions of atoms into a change map which can be fed
     * into this.applySceneChanges(). Reset translations on SVG group elements.
     *
     * @param changeMap {Object} - map of all changes to apply to next history
     * step
     */
    handleMolecularMovementEnd(changeMap) {
        const movement = this.interactionState.interaction.movement;
        if (movement.fullStructures.length) {
            for (const structureId of this.interactionState.interaction.movement.fullStructures) {
                this.svgDrawer.structureDrawer.resetFullSkeletonTranslation(structureId);
            }
            this.changeMapCreater.createFullStructureUpdateMap(changeMap);
        }
        if (movement.partialStructures.length) {
            const {partialStructures, individualAtoms} = movement;
            const movedAtoms = Helpers.filterObjectByKeys(individualAtoms, partialStructures);
            this.changeMapCreater.createTempCoordinateUpdateMap(movedAtoms, changeMap);
        }
        if (this.opts.moveFreedomLevel === 'rings') {
            const ringSystems = movement.ringSystems;
            this.svgDrawer.ringDrawer.resetRingSystemMovement(ringSystems);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Takes back any necessary temporary coordinate changes
     *
     * @param movedStructures {Array} - ids of moved structures
     * @param tempUpdates {Object} - StructureIdTracker with by movement
     * affected atoms and their temp coordinates changes
     */
    resetTempCoordsAfterMovement(movedStructures, tempUpdates) {
        const {affectedAtoms, offsets} = tempUpdates;
        if (affectedAtoms.hasEntries()) {
            const updatedAtomIds = affectedAtoms.container;
            for (const structureId in updatedAtomIds) {
                const structOffset = offsets[structureId];
                const structure = this.sceneData.structuresData.structures[structureId];
                updatedAtomIds[structureId].forEach(atomId => {
                    const atom = structure.atomsData.getAtom(atomId);
                    atom.tempCoordinates.x -= structOffset.x;
                    atom.tempCoordinates.y -= structOffset.y;
                });
            }
        }
        movedStructures.forEach(structureId => {
            const structure = this.sceneData.structuresData.structures[structureId];
            if (structure.representationsData.hasRepresentation(StructureRepresentation.circle)) {
                this.svgDrawer.structureCircleDrawer.resetStructureCircleTempCoords(structureId);
            }
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * A variation of molecular movement: Moves entire structures based on given
     * offsets. To optimize performance, structures are moved through movement
     * of composite layers of SVG groups. Movement offsets are then noted
     * directly on the Structure objects.
     *
     * @param structureIds {Array} - ids of structures to move
     * @param offset {Object} - x- and y-offsets to move draw elements by
     */
    handleFullStructureMovement(structureIds, offset) {
        for (const structureId of structureIds) {
            //movement of structure skeleton
            const structure = this.sceneData.structuresData.structures[structureId];
            const curOffset = structure.curOffset;
            curOffset.x += offset.x;
            curOffset.y += offset.y;
            this.svgDrawer.structureDrawer.moveFullSkeleton(structureId, curOffset.x, curOffset.y);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves annotations marked for movement in this drawer's Interaction object
     * based on given offsets.
     *
     * @param offset {Object} - x- and y-offsets to move draw elements by
     */
    handleAnnotationMovement(offset) {
        this.interactionState.interaction.movement.annotations.forEach(labelId => {
            const annotation = this.sceneData.annotationsData.annotations[labelId];
            if (this.opts.geomineMode && (!annotation.additionalInformation ||
                !annotation.additionalInformation.nglFeatureType ||
                annotation.additionalInformation.nglFeatureType !== 'point')) {
                return;
            }
            this.svgDrawer.annotationDrawer.moveAnnotation(labelId, offset);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves control points of splines representing hydrophobic contacts
     * marked for movement in this drawer's Interaction object based on given
     * offsets.
     *
     * @param offset {Object} - x- and y-offsets to move draw elements by
     */
    handleSplineControlPointMovement(offset) {
        const controlPoints = this.interactionState.interaction.movement.splineControlPoints;
        this.svgDrawer.hydrophobicDrawer.moveSplineControlPoints(controlPoints, offset);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates temporary parameters (coordinates, ring centers, ...) of elements
     * affected by structure movement through composite layers. Notes which
     * atoms of the structure needed to be updated to reset such updates later.
     *
     * @param movedStructureId {Number} - id of structure moved by composite
     * layer
     * @param affectedAtoms {StructureIdTracker} - container to note which
     * atoms needed to be updated
     * @param offsets {Object} - container to track offsets applied to atoms
     * which are updated here
     */
    setNecessaryTempParametersStructureMovement(movedStructureId, {affectedAtoms, offsets}) {
        const structure = this.sceneData.structuresData.structures[movedStructureId];
        const offset = structure.curOffset;
        offsets[movedStructureId] = offset;
        if (structure.representationsData.hasRepresentation(StructureRepresentation.circle)) {
            this.svgDrawer.structureCircleDrawer.updateCoordsForStructureCircleByOffset(movedStructureId,
                offset,
                true
            );
        }
        this.svgDrawer.intermolecularDrawer.updateTempCoordsForIntermolecularAtom(movedStructureId,
            offset,
            affectedAtoms,
            'atomPairInteractions'
        );
        this.svgDrawer.intermolecularDrawer.updateTempCoordsForIntermolecularAtom(movedStructureId,
            offset,
            affectedAtoms,
            'cationPiStackings'
        );

        const ringSysToUpdate = new StructureIdTracker();
        this.svgDrawer.intermolecularDrawer.findRingSystemsToTempUpdateIntermolecular(movedStructureId,
            ringSysToUpdate,
            'piStackings'
        );
        this.svgDrawer.intermolecularDrawer.findRingSystemsToTempUpdateIntermolecular(movedStructureId,
            ringSysToUpdate,
            'cationPiStackings'
        );

        const ringSysIds = ringSysToUpdate.container;
        for (const structureId in ringSysIds) {
            const structureInSys = this.sceneData.structuresData.structures[structureId];
            ringSysIds[structureId].forEach(ringSysId => {
                this.svgDrawer.ringDrawer.updateTempCoordsForRingSystem(offset,
                    structureId,
                    ringSysId,
                    affectedAtoms
                );
                structureInSys.ringsData.updateRingSystem(ringSysId, true);
            });
        }
    }
}