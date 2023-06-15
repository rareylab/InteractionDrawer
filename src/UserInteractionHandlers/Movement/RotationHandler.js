/**
 * Processes rotation user interactions with objects in the draw area.
 */
class RotationHandler {
    /**
     * Contains instances for the data storage/access, user interaction tracking,
     * draw area manipulation, rotation of drawn objects and configuration options.
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
     * Main function of the scaled rotation mode. Similar procedure as
     * handleRotationByCoords(), but also rejects rotations of current angles
     * below the value set in this.opts.scaledRotationThreshold.
     *
     * @param drawAreaCoords {Object} - x- and y-coordinates of current
     * cursor screen position translated to position in draw area
     * @returns {Boolean} - whether rotation was actually applied
     */
    handleScaledRotation(drawAreaCoords) {
        const interaction = this.interactionState.interaction;
        const {rememberedAngle} = interaction.scaledRotation;
        let {angle, scaledMid} = this.interactionState.getRotationParameters(drawAreaCoords);
        if (Number.isNaN(angle)) return false;
        //always move in fixed intervals, but do remember previous overflows
        angle += rememberedAngle;
        if (Math.abs(angle) < this.opts.scaledRotationThreshold) return false;
        //move when angles over threshold but conform to intervals
        const overflow = angle % this.opts.scaledRotationThreshold;
        angle -= overflow;
        const {curRotation} = interaction.rotation;
        const fullAngle = Math.round((curRotation + angle) % 360);
        //apply rotation and change tracked parameters
        this.handleRotation(angle, fullAngle, scaledMid);
        interaction.rotation.curRotation = fullAngle;
        interaction.scaledRotation.rememberedAngle = overflow;
        return true;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Main function of the rotation interaction mode. Freely rotates elements
     * marked in this.interactionState.interaction.rotation between intermittent cursor
     * positions. As a fail-safe, reject rotation whenever angles are
     * unrecognizable (shown as Number.isNaN).
     *
     * @param drawAreaCoords {Object} - x- and y-coordinates of current
     * cursor screen position translated to position in draw area
     * @returns {Boolean} - whether rotation was actually applied
     */
    handleRotationByCoords(drawAreaCoords) {
        const {angle, scaledMid} = this.interactionState.getRotationParameters(drawAreaCoords);
        if (Number.isNaN(angle)) return false;
        //infer full rotation so far for bond skeleton rotation
        const {curRotation} = this.interactionState.interaction.rotation;
        const fullAngle = (curRotation + angle) % 360;
        //apply rotation and change tracked parameters
        this.handleRotation(angle, fullAngle, scaledMid);
        this.interactionState.interaction.rotation.curRotation = fullAngle;
        return true;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Applies rotation to all marked elements in this.interactionState.interaction.rotation.
     * This calculates new positions for atoms and intermolecular elements
     * (and logs these positions as temporary coordinates), but leverages composite
     * layers for the rotation of full bond skeletons.
     *
     * @param angle {Number} - the angle to rotate elements by
     * @param fullAngle {Number} - full angle elements have been rotated by
     * during the current interaction (to be set to bond skeleton groups)
     * @param curMid {Object} - x- and y-coordinates of the point to rotate
     * elements around
     */
    handleRotation(angle, fullAngle, curMid) {
        const {
            structures: affectedSids,
            annotations,
            splineControlPoints,
            distances,
            interactions,
            atomPairInteractions,
            piStackings,
            cationPiStackings
        } = this.interactionState.interaction.rotation;
        //update of atoms and bonds
        for (const structureId of affectedSids) {
            this.svgDrawer.atomDrawer.rotateStructureAtoms(structureId, angle, curMid);
            //optimized group movement for bonds
            this.svgDrawer.edgeDrawer.setRotationEdgeSkeleton(structureId, fullAngle, curMid, true);
            const structure = this.sceneData.structuresData.structures[structureId];
            Object.keys(structure.ringsData.ringSystems).forEach(ringSysId => {
                structure.ringsData.updateRingSystem(ringSysId, true);
            });
            if (structure.representationsData.hasRepresentation(StructureRepresentation.circle)) {
                //this also rotates corresponding annotations.
                this.svgDrawer.structureCircleDrawer.rotateStructureCircle(structureId,
                    angle,
                    curMid,
                    affectedSids.length !== 1
                );
            }
        }
        //correct placement of related text elements
        this.svgDrawer.edgeDrawer.updateEdgeDebugTextPositions(affectedSids);
        this.svgDrawer.atomDrawer.correctAtomTextPlacement(affectedSids);
        //update splines and annotations
        annotations.forEach(annotationId => {
            const structureLink = this.sceneData.annotationsData.annotations[annotationId].structureLink;
            if (this.sceneData.structuresData.structures.hasOwnProperty(structureLink) &&
                this.sceneData.structuresData.structures[structureLink]
                    .representationsData.isCurRepresentation(StructureRepresentation.circle)) {
                return;
            }

            this.svgDrawer.annotationDrawer.rotateAnnotation(annotationId, angle, curMid);
        });
        for (const splineId in splineControlPoints) {
            const cpIds = splineControlPoints[splineId];
            this.svgDrawer.hydrophobicDrawer.rotateSplineControlPoints(splineId,
                cpIds,
                angle,
                curMid
            );
        }
        //update intermolecular forces -> careful: require updated ring systems
        this.svgDrawer.intermolecularDrawer.updateAllIntermolecular(distances,
            interactions,
            atomPairInteractions,
            piStackings,
            cationPiStackings,
            false,
            true
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Cleanup step for the end of user interaction during execution of the
     * rotation interaction mode. Resets translation on SVG bond skeleton groups
     * and commit new positions to history.
     */
    handleRotationEnd() {
        const interaction = this.interactionState.interaction;
        const rotaInt = interaction.rotation;
        const changeMap = {};
        for (const structureId of rotaInt.structures) {
            this.svgDrawer.edgeDrawer.resetEdgeSkeletonRotation(structureId);
        }
        this.changeMapCreater.createTempCoordinateUpdateMapForFullStructures(rotaInt.structures,
            changeMap
        );
        if (rotaInt.annotations.size) {
            this.changeMapCreater.createAnnotationUpdateMap(rotaInt.annotations,
                rotaInt.structures,
                changeMap,
                InteractionMode.rotation
            );
        }
        if (Object.keys(rotaInt.splineControlPoints)) {
            this.changeMapCreater.createSplineControlPointUpdateMap(rotaInt.splineControlPoints,
                changeMap
            );
        }
        const prevStepCount = this.svgDrawer.historyDrawer.history.steps.length;
        this.svgDrawer.applySceneChanges(changeMap);
        //if no rotation occurred
        if (this.svgDrawer.historyDrawer.history.steps.length === prevStepCount) {
            if (this.opts.geomineMode) {
                this.clickSelectionHandler.switchSelectionCandidates();
                this.hoverHandler.handleHoverAtCurrentCursor();
                if (PointCalculation.coordsAlmostEqual(interaction.origin,
                    interaction.start,
                    interaction.grace
                ) && Object.keys(interaction.selectionCandidates).length === 0) {
                    // except if you select a point
                    this.clickSelectionHandler.deselectAllGeominePoints();
                    this.clickSelectionHandler.deselectAllGeomineQueryPointToPointConstraints();
                    this.clickSelectionHandler.deselectAllGeomineQueryAngles();
                    this.clickSelectionHandler.handleClickInTheBlank()
                }
            }
        }
        this.interactionState.resetAfterHoverEnd();
        this.hoverHandler.handleHoverAtCurrentCursor();
    }
}