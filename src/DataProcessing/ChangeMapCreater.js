/**
 * Collects from structural data new positions of draw objects based on movement operations.
 */
class ChangeMapCreater {
    /**
     * Contains instances for the data storage/access and user interaction tracking.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     * @param interactionState {Object} - tracks user interactions
     */
    constructor(opts, sceneData, interactionState) {
        this.opts = opts;
        this.sceneData = sceneData;
        this.interactionState = interactionState;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Accumulates new positions of annotations of given Ids based on a mirror
     * operation on a given line (defined by two points).
     *
     * @param annotationIds {Array} - array of annotation ids
     * @param first {Object} - x- and y-coordinates of the first point on the
     * mirror line
     * @param second {Object} - x- and y-coordinates of the second point on the
     * mirror line
     * @param map {Object} - map of all changes to apply to next history step
     * @param interactionMode {InteractionMode} - interaction mode that was
     * performed
     * @param onlyUpdateStrucInfo {Boolean} - whether only the information
     * to update the structureRepresentationInfo should be included
     */
    createAnnotationMirrorMap(annotationIds,
        first,
        second,
        map,
        interactionMode,
        onlyUpdateStrucInfo = false
    ) {
        if (!map.hasOwnProperty('annotationCoordinateChanges')) {
            map.annotationCoordinateChanges = {};
        }
        const updateMap = map.annotationCoordinateChanges;
        const annotationCoords = annotationIds.map(annotationId => {
            return this.sceneData.annotationsData.annotations[annotationId].coordinates;
        });
        const newCoords = onlyUpdateStrucInfo ? undefined :
            LineCalculation.mirrorPointsOnLine(annotationCoords, first, second);
        annotationIds.forEach((annotationId, i) => {
            updateMap[annotationId] = {
                newCoords: newCoords && newCoords[i], interactionMode: interactionMode
            };
            const annotation = this.sceneData.annotationsData.annotations[annotationId];
            if (annotation &&
                this.sceneData.structuresData.structures.hasOwnProperty(annotation.structureLink)) {
                updateMap[annotationId].oldStructureMid = Object.assign({},
                    this.sceneData.structuresData.structures[annotation.structureLink].boundaries.mid
                );
            }
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Performs a mirror operation on given atoms based on a mirror line defined
     * by two given points. Afterwards, apply new coordinates to history.
     *
     * @param atomsToMirror {Object} - map from structure Ids to Arrays of
     * atom signalling the atoms to mirror
     * @param first {Object} - x- and y-coordinates of the first line point
     * @param second {Object} - x- and y-coordinates of the second line point
     * @param map {Object} - collects coordinate changes
     */
    createAtomMirrorMap(atomsToMirror, first, second, map) {
        if (!map.hasOwnProperty('coordinateChanges')) {
            map.coordinateChanges = {};
        }
        const coordChanges = map.coordinateChanges;
        for (const structureId in atomsToMirror) {
            const atoms = atomsToMirror[structureId];
            //mirror atoms and build map for changes
            const mirroredAtoms = LineCalculation.mirrorPointsOnLine(atoms.map(atom => atom.coordinates),
                first,
                second
            );
            const atomChanges = {};
            atoms.forEach(({id: atomId}, idx) => {
                atomChanges[atomId] = mirroredAtoms[idx];
            });
            coordChanges[structureId] = {
                newCoordinates: atomChanges, isFlip: true
            };
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Accumulates new positions of specified spline control points based on a
     * mirror operation on a given line (defined by two points).
     *
     * @param controlPoints {Object} - the control points (by structure Id and
     * spline Id) to mirror
     * @param first {Object} - x- and y-coordinates of the first point on the
     * mirror line
     * @param second {Object} - x- and y-coordinates of the second point on the
     * mirror line
     * @param map {Object} - map of all changes to apply to next history step
     */
    createSplineControlPointMirrorMap(controlPoints, first, second, map) {
        if (!map.hasOwnProperty('splineCoordinateChanges')) {
            map.splineCoordinateChanges = {};
        }
        const splineChanges = map.splineCoordinateChanges;
        for (const splineId in controlPoints) {
            const cpChanges = {};
            const spline = this.sceneData.hydrophobicData.hydrophobicContacts[splineId];
            const cpIds = [...controlPoints[splineId]];
            const cpCoords = cpIds.sort().map(cpId => {
                return spline.getControlPoint(cpId, false);
            });
            const newCpCoords = LineCalculation.mirrorPointsOnLine(cpCoords, first, second);
            cpIds.forEach((cpId, i) => {
                cpChanges[cpId] = newCpCoords[i];
            });
            splineChanges[splineId] = cpChanges;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Accumulates new positions of specified spline control points into a
     * change map which can be fed into this.applySceneChanges().
     *
     * @param controlPoints {Object} - the control points (by structure Id and
     * spline Id) to update
     * @param changeMap {Object} - map of all changes to apply to next history
     * step
     */
    createSplineControlPointUpdateMap(controlPoints, changeMap) {
        const splineChanges = {};
        for (const splineId in controlPoints) {
            const cpChanges = {};
            const spline = this.sceneData.hydrophobicData.hydrophobicContacts[splineId];
            controlPoints[splineId].forEach(cpId => {
                cpChanges[cpId] = spline.getControlPoint(cpId, true);
            });
            splineChanges[splineId] = cpChanges;
        }
        changeMap.splineCoordinateChanges = splineChanges;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Accumulates new positions of annotations of given Ids into a change map
     * which can be fed into this.applySceneChanges().
     *
     * @param annotationIds {Set} - ids of annotations to update
     * @param structureIds {Array} - ids of all structures that were updated
     * in this step
     * @param changeMap {Object} - map of all changes to apply to next history
     * step
     * @param interactionMode {InteractionMode} - mode of the corresponding
     * interaction
     */
    createAnnotationUpdateMap(annotationIds, structureIds, changeMap, interactionMode) {
        const annotationChanges = {};
        annotationIds.forEach(annotationId => {
            const annotation = this.sceneData.annotationsData.annotations[annotationId];
            const structureLink = annotation.structureLink;
            annotationChanges[annotationId] = {
                newCoords: annotation.tempCoordinates,
                structureMoved: structureIds.includes(structureLink),
                interactionMode: interactionMode
            };
            if (!this.sceneData.structuresData.structures.hasOwnProperty(structureLink)) {
                return;
            }
            const structure = this.sceneData.structuresData.structures[structureLink];
            annotationChanges[annotationId].oldStructureMid =
                Object.assign({}, structure.boundaries.mid);
            if (interactionMode !== InteractionMode.rotation ||
                Object.keys(annotation.structureRepresentationInfo).length <= 1) {
                return;
            }
            const repInfo = annotation.structureRepresentationInfo;
            const fullAngle = this.interactionState.interaction.rotation.curRotation;
            const sceneRotation = this.interactionState.interaction.rotation.type === 'fullScene';
            if (structure.representationsData.isCurRepresentation(StructureRepresentation.default) &&
                sceneRotation) {
                const offset = structure.calcStructureCircleRotationOffset(fullAngle,
                    true,
                    this.interactionState.getRealCoordinates(this.sceneData.midCoords),
                    false
                );
                annotationChanges[annotationId].oldAltRotCoords =
                    Object.assign({}, repInfo[StructureRepresentation.circle].coordinates);
                annotationChanges[annotationId].newAltRotCoords = VectorCalculation.vectorAdd(
                    repInfo[StructureRepresentation.circle].coordinates,
                    offset
                );
            } else if (structure
                .representationsData.isCurRepresentation(StructureRepresentation.circle)) {
                const mid = sceneRotation ?
                    this.interactionState.getRealCoordinates(this.sceneData.midCoords) :
                    structure.boundaries.mid;
                annotationChanges[annotationId].oldAltRotCoords =
                    Object.assign({}, repInfo[StructureRepresentation.default].coordinates);
                annotationChanges[annotationId].newAltRotCoords =
                    PointCalculation.rotatePointAroundAnother(repInfo[StructureRepresentation.default].coordinates,
                        mid,
                        fullAngle,
                        false
                    );
            }
        });
        changeMap.annotationCoordinateChanges = annotationChanges;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates a map to be used in this.applySceneChanges() to set (real) coordinates
     * of all atoms of structures specified by Id to previously updated
     * temporary coordinates. These changes are then written into a provided
     * map to be used in the larger update.
     *
     * @param structureIds {Array} - ids of structures to update all atoms for
     * @param map {Object} - map to write changes to apply into
     */
    createTempCoordinateUpdateMapForFullStructures(structureIds, map) {
        const atomsToUpdate = {};
        structureIds.forEach(structureId => {
            const structure = this.sceneData.structuresData.structures[structureId];
            atomsToUpdate[structureId] = structure.atomsData.atomIds;
        });
        this.createTempCoordinateUpdateMap(atomsToUpdate, map);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates a map to be used in this.applySceneChanges() to set (real) coordinates
     * of given atoms to previously updated temporary coordinates. These
     * changes are then written into a provided map to be used in the larger
     * update.
     *
     * @param atomsToUpdate {Object} - which atoms to update (structure Ids
     * to Arrays)
     * @param map {Object} - map to write changes to apply into
     */
    createTempCoordinateUpdateMap(atomsToUpdate, map) {
        if (!map.hasOwnProperty('coordinateChanges')) {
            map.coordinateChanges = {};
        }
        const coordChanges = map.coordinateChanges;
        for (const structureId in atomsToUpdate) {
            const structure = this.sceneData.structuresData.structures[structureId];
            const structChanges = {};
            atomsToUpdate[structureId].forEach(atomId => {
                const atom = structure.atomsData.getAtom(atomId);
                structChanges[atomId] = atom.tempCoordinates;
            });
            coordChanges[structureId] = {
                newCoordinates: structChanges, isFlip: false
            };
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Undoes translations applied to SVG groups representing structures which
     * were moved in full and apply offsets to temporary atom coordinates.
     */
    createFullStructureUpdateMap(map) {
        if (!map.hasOwnProperty('coordinateChanges')) {
            map.coordinateChanges = {};
        }
        const coordChanges = map.coordinateChanges;
        for (const structureId of this.interactionState.interaction.movement.fullStructures) {
            const structure = this.sceneData.structuresData.structures[structureId];
            const curOffset = structure.curOffset;
            structure.resetCurOffset();
            const structChanges = {};
            structure.atomsData.atoms.forEach(atom => {
                structChanges[atom.id] = {
                    x: atom.tempCoordinates.x + curOffset.x,
                    y: atom.tempCoordinates.y + curOffset.y
                }
            });
            coordChanges[structureId] = {
                newCoordinates: structChanges, isFlip: false
            };
        }
    }
}