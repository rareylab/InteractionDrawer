/**
 * Drawer that uses its own component for the visualization of annotations.
 */
class AnnotationDrawer {
    /**
     * Contains instances for JSON validation, configuration options,
     * data storage/access, draw area manipulation and all relevant components.
     * A selection callback can be set optionally.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     * @param annotationGroupsComponent {Object} - component for annotations
     * @param textLabelDrawer {Object} - drawer for generic text labels
     * @param jsonValidator {Object} - validates input JSON
     */
    constructor(opts, sceneData, annotationGroupsComponent, textLabelDrawer, jsonValidator) {
        this.opts = opts;
        this.sceneData = sceneData;
        this.annotationGroupsComponent = annotationGroupsComponent;
        this.textLabelDrawer = textLabelDrawer;
        this.jsonValidator = jsonValidator;
        this.closestObjectFinder = new ClosestObjectFinder(opts, sceneData);

        this.selectionCallback = null;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds the individual components of different annotations based on the
     * "annotations" field of provided scene draw information and link
     * annotations that belong to specific structures to these structures.
     * Returns the necessary Change objects to remove and re-add these
     * components.
     *
     * @param labelInfos {Array} - draw information for the different
     * annotations to be added to the scene
     * @param globalMaxes {BoundaryUpdateInfo} - log of how the global
     * boundaries of the scene change
     * @returns {undefined|Array} - Change objects for the next history step
     */
    applyAddAnnotations(labelInfos, globalMaxes) {
        const jsonKey = 'annotations';
        if (this.jsonValidator.checkJSONStructureArray(labelInfos, jsonKey, true).error) {
            return;
        }
        //apply add for each given info
        const addChanges = [];
        labelInfos.forEach((labelInfo, i) => {
            if (this.jsonValidator.annotationJSONerror(labelInfo, i, jsonKey)) {
                return;
            }
            this.createNewAnnotation(labelInfo, globalMaxes, addChanges);
        });
        return addChanges;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds an annotation to data an draw area.
     *
     * @param labelInfo {Object} - draw information of annotation to be added to the scene
     * @param globalMaxes {BoundaryUpdateInfo} - log of how the global
     * boundaries of the scene change
     * @param addChanges {Object} - collects Change objects for history
     */
    createNewAnnotation(labelInfo, globalMaxes, addChanges) {
        //create annotation and reference in memory
        const {
            id: labelId,
            label,
            coordinates,
            color: labelColor,
            belongsTo,
            isStructureLabel,
            additionalInformation
        } = labelInfo;
        const color = labelColor ? labelColor : this.opts.colors.DEFAULT;
        let structureLink;
        let atomLinks = [];
        let type;
        let belongsToStructure = false;
        if (belongsTo) {
            structureLink = belongsTo.id;
            atomLinks = belongsTo.atomLinks ? belongsTo.atomLinks : [];
            type = belongsTo.type;
            belongsToStructure = true;
        }
        const annotation = new Annotation({
            id: labelId,
            label: label,
            coordinates: coordinates,
            color: color,
            structureLink: structureLink,
            atomLinks: atomLinks,
            type: type,
            belongsToStructure: belongsToStructure,
            hidden: false,
            isStructureLabel: isStructureLabel,
            additionalInformation: additionalInformation
        });
        this.sceneData.annotationsData.annotations[labelId] = annotation;

        //check context of annotation
        if (belongsTo) {
            let {type, id, atomLinks} = belongsTo;
            switch (type) {
                case 'structureSpline':
                    //special color takes precedence
                    annotation.color = this.opts.colors.hydrophobicContacts;
                //FALLTHROUGH!
                case 'structure':
                    const structure = this.sceneData.structuresData.structures[id];
                    structure.annotationConnectionData.addAnnotation(labelId);
                    if (!atomLinks) {
                        atomLinks = [
                            this.closestObjectFinder.getClosestEnabledAtom(
                                annotation.coordinates,
                                [structure.id]).id
                        ];
                    }
                    if (atomLinks) {
                        new Set(atomLinks).forEach(atomLink => {
                            structure.annotationConnectionData.linkAtomToAnnotation(atomLink,
                                labelId
                            );
                        });
                        annotation.atomLinks = atomLinks;
                    }
                    break;
            }
        }
        if (belongsTo) {
            this.annotationGroupsComponent.drawLabel(annotation, belongsTo.id);
            this.addAltCoordsToAnnotation(annotation);
        } else {
            this.annotationGroupsComponent.drawLabel(annotation);
        }
        annotation.setDrawLimits(this.getAnnotationDrawLimits(annotation),
            this.annotationGroupsComponent.getLabelDrawLimits(annotation.id)
        );
        annotation.setSelectorShapes(this.annotationGroupsComponent.getLabelSelShapes(labelId));
        const {xMin, xMax, yMin, yMax} = annotation.globalDrawLimits;
        globalMaxes.setMaxesAdd(xMin, xMax, yMin, yMax);
        addChanges.push(this.createRemoveChangeAnnotation(labelId));
        //keep track of original to reset later
        this.sceneData.annotationsData.originalAnnotations[labelId] = annotation.clone();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds alternative coordinates to the annotation depending on the
     * allowed representations for the linked structure.
     *
     * @param annotation {Object} - annotation to add the coordinates to
     */
    addAltCoordsToAnnotation(annotation) {
        if (!annotation.hasOwnProperty('structureLink') ||
            !this.sceneData.structuresData.structures.hasOwnProperty(annotation.structureLink) ||
            annotation.isStructureLabel) {
            return;
        }
        const linkedStructureId = annotation.structureLink;
        const linkedStructure = this.sceneData.structuresData.structures[linkedStructureId];
        const representationInfo = {};
        representationInfo[StructureRepresentation.default] = {
            coordinates: Object.assign({}, annotation.coordinates)
        };
        if (linkedStructure.representationsData.hasRepresentation(StructureRepresentation.circle)) {
            const structureCircle = linkedStructure.representationsData.structureCircle;
            if (linkedStructure.representationsData.isCurRepresentation(StructureRepresentation.circle)) {
                const maxes = this.annotationGroupsComponent.getAnnotationMinMax(annotation.id);
                const {dist, relativePosition} = PolygonCalculation.getClosestPointOnRectangle(structureCircle.coordinates,
                    maxes
                );
                representationInfo[StructureRepresentation.circle] = {
                    coordinates: Object.assign({}, annotation.coordinates),
                    distToCircleMid: dist,
                    circleMidIsInside: relativePosition === RelativePosition.inside
                }
            } else {
                //radius around the circle where to draw the annotations on
                const rad = structureCircle.rad * 1.1;
                //init one possible position for the annotation as the position
                //right above the structure circle
                const startCoord = {
                    x: structureCircle.coordinates.x, y: structureCircle.coordinates.y - rad
                };
                this.setAnnotationPositionWithoutOverlap(structureCircle,
                    representationInfo,
                    annotation,
                    linkedStructureId,
                    startCoord,
                    rad
                );
                //if no position without overlap could be found take the position
                //above the circle
                if (!representationInfo.hasOwnProperty(StructureRepresentation.circle)) {
                    representationInfo[StructureRepresentation.circle] = {
                        coordinates: Object.assign({}, startCoord),
                        distToCircleMid: rad,
                        circleMidIsInside: false
                    }
                }
            }
        }
        annotation.structureRepresentationInfo = representationInfo;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Greedy algorithm to determine a position where this annotation
     * does not overlap with another annotation linked to this structure.
     *
     * @param structureCircle {Object} - info about the structure circle the annotation belongs to
     * @param representationInfo {Object} - info about the current structure representation
     * @param annotation {Object} - annotation to modify the coordinates
     * @param linkedStructureId {Object} - id of structure the annotation belongs to
     * @param startCoord {Object} - possible position for the annotation right above the
     * structure circle
     * @param rad {Object} - radius around the circle where to draw the annotations on
     */
    setAnnotationPositionWithoutOverlap(structureCircle,
        representationInfo,
        annotation,
        linkedStructureId,
        startCoord,
        rad
    ) {
        //calculate the width and height of this annotation
        const {height, width} = this.textLabelDrawer.getTextDimensions(annotation.label);
        //least amount of space between annotations
        const spaceBetween = height;
        //already present annotations to check against
        const checkAgainstCoords = Object.values(this.sceneData.annotationsData.annotations)
            .filter(anno => anno.enabled && anno.structureLink === linkedStructureId &&
                anno.structureRepresentationInfo.hasOwnProperty(StructureRepresentation.circle))
            .map(anno => {
                return {
                    coords: anno.structureRepresentationInfo[StructureRepresentation.circle].coordinates, //height and width of BBox
                    ...this.textLabelDrawer.getTextDimensions(anno.label)
                }
            });
        //bounding rect. Note that coords are in the middle and
        //not at bottom right like with BBox
        //checks if an overlap exists between the current position to
        //evaluate and one of the existing annotations
        const isOverlapping = (curCoords) => {
            const curRect = PolygonCalculation.boundingRectangle({
                height, width, coords: curCoords
            });
            for (const checkAgainst of checkAgainstCoords) {
                const checkRect = PolygonCalculation.boundingRectangle(checkAgainst);
                if (curRect.xMin - spaceBetween < checkRect.xMax && checkRect.xMin - spaceBetween <
                    curRect.xMax && curRect.yMin - spaceBetween < checkRect.yMax && checkRect.yMin -
                    spaceBetween < curRect.yMax) {
                    return true;
                }
            }
            return false;
        };
        //loop through possible positions until one is found that does not
        //overlap
        //take 10 times the max possible annotations without overlap, this
        //works well in practice
        const maxPositions = 10 * 2 * (rad + 2 * height) / height;
        const angleStep = 360 / maxPositions;
        //angle = 0 means the annotation is drawn just vertically above
        let angle = 0;
        while (angle < 360) {
            const evalCoords = PolygonCalculation.rotateRectangleAroundPoint(startCoord,
                PolygonCalculation.boundingRectangle({
                    height: height, width: width, coords: startCoord
                }),
                structureCircle.coordinates,
                angle,
                rad,
                false
            );

            if (!isOverlapping(evalCoords)) {
                representationInfo[StructureRepresentation.circle] = {
                    coordinates: Object.assign({}, evalCoords),
                    distToCircleMid: rad,
                    circleMidIsInside: false
                };
                break;
            }
            angle += angleStep;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Retrieves the saved bbox draw limits of the text element of a label.
     * If the label has any alternative coordinates includes those in the draw
     * limits.
     *
     * @param annotation {Object} - annotation to get the draw limits for
     */
    getAnnotationDrawLimits(annotation) {
        const extendBoundary = (maxBoundary, minBoundary, includeVal, origVal) => {
            const ret = {
                min: minBoundary, max: maxBoundary
            };

            if (includeVal !== origVal) { //if same boundaries do not change
                const dist = Math.abs(origVal - includeVal);
                if (includeVal < origVal) { //change boundaries min
                    ret.min = minBoundary - dist;
                } else { //change boundaries max
                    ret.max = maxBoundary + dist;
                }
            }

            return ret;
        };

        const {xMin, xMax, yMin, yMax} = this.annotationGroupsComponent.getLabelDrawLimits(
            annotation.id)[0]['limits'];
        const {x: origX, y: origY} = annotation.coordinates;
        const boundaries = {
            xMins: [xMin], xMaxs: [xMax], yMins: [yMin], yMaxs: [yMax]
        };

        for (const info of Object.values(annotation.structureRepresentationInfo)) {
            const {x: repX, y: repY} = info.coordinates;
            const xBoundaries = extendBoundary(xMax, xMin, repX, origX);
            boundaries.xMins.push(xBoundaries.min);
            boundaries.xMaxs.push(xBoundaries.max);

            const yBoundaries = extendBoundary(yMax, yMin, repY, origY);
            boundaries.yMins.push(yBoundaries.min);
            boundaries.yMaxs.push(yBoundaries.max);
        }

        return [
            {
                limits: {
                    xMin: Math.min(...boundaries.xMins),
                    xMax: Math.max(...boundaries.xMaxs),
                    yMin: Math.min(...boundaries.yMins),
                    yMax: Math.max(...boundaries.yMaxs)
                }
            }
        ];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the Change object to remove/re-add an annotation.
     *
     * @param labelId {Number} - id of the annotation to remove/re-add
     * @param isAdd {Boolean} - whether the change should add the annotation as its
     * apply() or revert() function
     * @returns {Change} - Change object to apply/revert removal
     */
    createRemoveChangeAnnotation(labelId, isAdd = true) {
        const labelChange = new Change();
        const annotation = this.sceneData.annotationsData.annotations[labelId];
        const selectedAnnotations = this.sceneData.annotationsData.selectedAnnotations;
        const wasSelected = selectedAnnotations.has(labelId);
        const remove = () => {
            annotation.enabled = false;
            this.annotationGroupsComponent.removeLabelFromDOM(labelId);
            selectedAnnotations.delete(labelId);
        };
        const readd = () => {
            annotation.enabled = true;
            this.annotationGroupsComponent.redrawLabel(labelId);
        };
        if (isAdd) {
            labelChange.bindApply(readd);
            labelChange.bindRevert(remove);
        } else {
            labelChange.bindApply(remove);
            labelChange.bindRevert(readd);
        }
        return labelChange;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves a single annotation specified by id based on given offsets.
     *
     * @param labelId {Number} - unique id of the annotation to move
     * @param offset {Object} - x- and y-offsets to move draw elements by
     * @param byTemp {Boolean}- whether movement is temporary or not
     */
    moveAnnotation(labelId, offset, byTemp = true) {
        const annotation = this.sceneData.annotationsData.annotations[labelId];
        annotation.addOffsetToCoords(offset, byTemp);
        this.annotationGroupsComponent.moveLabel(labelId, offset);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates the bbox draw limits of the text element of an annotation and its selection shape.
     *
     * @param annotation {Annotation} - Annotation object
     */
    updateAnnotationLimitsSelectors(annotation) {
        annotation.setDrawLimits(this.getAnnotationDrawLimits(annotation),
            this.annotationGroupsComponent.getLabelDrawLimits(annotation.id)
        );
        annotation.setSelectorShapes(this.annotationGroupsComponent.getLabelSelShapes(annotation.id),
            false
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets the coordinates of a single annotation to new values.
     *
     * @param labelId {Number} - id of the annotation to move
     * @param annotationChange {Object} - contains x- and y-coordinates of the
     * new position as value of key "coordinates" and at key "structureMoved"
     * true if the linked structure (if any) was moved as well
     * @param globalMaxes {BoundaryUpdateInfo} - log of how the global
     * boundaries of the scene change
     * @returns {Array} - Change objects for the next history step
     */
    applyCoordinateChangesAnnotation(labelId, annotationChange, globalMaxes) {
        const annotation = this.sceneData.annotationsData.annotations[labelId];
        const oldCoords = annotation.coordinates;
        if (annotationChange.newCoords &&
            PointCalculation.coordsAlmostEqual(oldCoords, annotationChange.newCoords)) {
            return [];
        }

        const labelChanges = [];
        labelChanges.push(this.updateAnnotationCoordinates(annotation, annotationChange));

        //update draw limits and selector shapes
        const oldDrawLimits = Object.assign({}, annotation.globalDrawLimits);
        annotation.setSelectorShapes(this.annotationGroupsComponent.getLabelSelShapes(annotation.id),
            false
        );
        annotation.setDrawLimits(this.getAnnotationDrawLimits(annotation),
            this.annotationGroupsComponent.getLabelDrawLimits(annotation.id)
        );
        const newDrawLimits = annotation.globalDrawLimits;

        //update global boundaries
        globalMaxes.updateMaxesByLimits(oldDrawLimits, newDrawLimits);

        const limitChange = new Change();
        const changeLimits = () => {
            annotation.setSelectorShapes(this.annotationGroupsComponent.getLabelSelShapes(labelId),
                false
            );
            annotation.setDrawLimits(this.getAnnotationDrawLimits(annotation),
                this.annotationGroupsComponent.getLabelDrawLimits(annotation.id)
            );
        };
        limitChange.bindApplyRevert(changeLimits);
        labelChanges.push(limitChange);

        return labelChanges;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Function to move a annotation to new coordinates. Returns the change
     * object to apply/revert this coordinate change. If no new coordinates
     * are available, apply changes to the structureRepresentationInfo
     * so that no actual coordination changes happen.
     * This is (and should) only be used for mirror interaction mode.
     * Returns the Change object to apply/revert the change.
     *
     * @param annotation {Object} - the annotation's container object
     * @param annotationChange {Object} - information about the coordination change
     * @returns {Change} - Change object to apply/revert movement
     */
    updateAnnotationCoordinates(annotation, annotationChange) {
        const {id: annotationId, coordinates: oldCoords, structureLink} = annotation;
        const {
            newCoords,
            structureMoved,
            interactionMode,
            newAltRotCoords,
            oldAltRotCoords,
            oldStructureMid
        } = annotationChange;
        const structure = this.sceneData.structuresData.structures.hasOwnProperty(structureLink) ?
            this.sceneData.structuresData.structures[structureLink] : undefined;
        const structureRep = structure ? structure.representationsData.curRepresentation() :
            undefined;
        const structureMid = structure ? structure.boundaries.mid : undefined;
        let dimensions = undefined;
        let fullOffsets = undefined;
        let invertedOffsets = undefined;
        if (newCoords) {
            dimensions = this.annotationGroupsComponent.getLabelBBox(annotationId);
            const curOffsets = {
                x: newCoords.x - annotation.tempCoordinates.x,
                y: newCoords.y - annotation.tempCoordinates.y
            };
            fullOffsets = {
                x: newCoords.x - oldCoords.x, y: newCoords.y - oldCoords.y
            };
            invertedOffsets = {
                x: -fullOffsets.x, y: -fullOffsets.y
            };
            this.updateContainerAndMoveAnnotation(annotation, newCoords, curOffsets);
        }
        //for NOW: update coordinates in relation to previous temp movement
        annotation.updateAlternativeRepresentationCoords(structureRep,
            structureMoved,
            fullOffsets,
            interactionMode,
            newAltRotCoords,
            structureMid,
            oldStructureMid,
            dimensions
        );
        //for HISTORY: add change based on full movements since last step
        const coordChange = new Change();
        const moveFunction = (moveBack) => {
            const curStructureRep = this.sceneData.structuresData.structures.hasOwnProperty(
                structureLink) ?
                this.sceneData.structuresData.structures[structureLink].representationsData.curRepresentation() :
                undefined;
            const oldAltCoords = annotation.structureRepresentationInfo.hasOwnProperty(
                curStructureRep) ? Object.assign({},
                annotation.structureRepresentationInfo[curStructureRep].coordinates
            ) : undefined;
            if (moveBack) {
                annotation.updateAlternativeRepresentationCoords(structureRep,
                    structureMoved,
                    invertedOffsets,
                    interactionMode,
                    oldAltRotCoords,
                    oldStructureMid,
                    structureMid,
                    dimensions
                );
            } else {
                annotation.updateAlternativeRepresentationCoords(structureRep,
                    structureMoved,
                    fullOffsets,
                    interactionMode,
                    newAltRotCoords,
                    structureMid,
                    oldStructureMid,
                    dimensions
                );
            }
            if (newCoords && (Object.keys(annotation.structureRepresentationInfo).length === 0 ||
                structureRep === curStructureRep)) {
                const moveToCoords = moveBack ? oldCoords : newCoords;
                const moveToOffset = moveBack ? invertedOffsets : fullOffsets;
                this.updateContainerAndMoveAnnotation(annotation, moveToCoords, moveToOffset);
            } else if (newCoords || (curStructureRep === StructureRepresentation.circle &&
                annotation.structureRepresentationInfo.hasOwnProperty(curStructureRep))) {
                const newAltCoords = annotation.structureRepresentationInfo[curStructureRep].coordinates;
                if (PointCalculation.coordsAlmostEqual(oldAltCoords, newAltCoords)) {
                    return;
                }
                const offs = VectorCalculation.vectorSubstract(newAltCoords, oldAltCoords);
                this.updateContainerAndMoveAnnotation(annotation, newAltCoords, offs);
            }
        };
        coordChange.bindApply(moveFunction, false);
        coordChange.bindRevert(moveFunction, true);
        return coordChange;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Function to move a annotation to new coordinates and update its data container.
     *
     * @param annotation {Object} - the annotation's container object
     * @param coords {Object} - new coordinates
     * @param offsets {Object} - x- and y-offsets to move annotation by
     */
    updateContainerAndMoveAnnotation(annotation, coords, offsets) {
        annotation.tempCoordinates = Object.assign({}, coords);
        annotation.coordinates = Object.assign({}, coords);
        this.annotationGroupsComponent.moveLabel(annotation.id, offsets);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes specified annotations in the draw area.
     *
     * @param remAnnotations {Set} - ids of annotations to remove
     * @param remChanges {Array} - Change objects for the history step
     * @param markRequiredRecalcs {Function} - function to memory changes in
     * structure/scene boundaries
     */
    removeAnnotations(remAnnotations, remChanges, markRequiredRecalcs) {
        remAnnotations.forEach(annotationId => {
            if (!this.sceneData.annotationsData.annotations.hasOwnProperty(annotationId)) {
                return;
            }

            const annotation = this.sceneData.annotationsData.annotations[annotationId];
            //filter already removed
            if (!annotation.enabled) {
                return;
            }
            const {xMin, xMax, yMin, yMax} = annotation.globalDrawLimits;
            markRequiredRecalcs('xMin', xMin);
            markRequiredRecalcs('xMax', xMax);
            markRequiredRecalcs('yMin', yMin);
            markRequiredRecalcs('yMax', yMax);
            const remChange = this.createRemoveChangeAnnotation(annotationId, false);
            remChange.apply();
            remChanges.push(remChange);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Instructs the draw layer to unselect (= hide selection shapes) all
     * currently hovered annotations.
     */
    unselectAllAnnotations() {
        Object.keys(this.sceneData.annotationsData.annotations).forEach(labelId => {
            this.annotationGroupsComponent.unselectLabel(labelId);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Rotates a single annotation around a given midpoint. If the linked structure
     * (if any) has circle as its current representation, the annotation rotates around the circle
     * instead to get a smother feel for the user.
     *
     * @param labelId {Number} - unique id of the annotation to rotate
     * @param angle {Number} - angle (in degree) to rotate by
     * @param midpoint {Object} - x- and y-coordinates of the point to rotate
     * the annotations around
     */
    rotateAnnotation(labelId, angle, midpoint) {
        const annotation = this.sceneData.annotationsData.annotations[labelId];
        const tempCoords = annotation.tempCoordinates;
        let newCoords;
        if (this.sceneData.structuresData.structures.hasOwnProperty(annotation.structureLink) &&
            this.sceneData.structuresData.structures[annotation.structureLink]
                .representationsData.isCurRepresentation(StructureRepresentation.circle) &&
            annotation.structureRepresentationInfo
                .hasOwnProperty(StructureRepresentation.circle)) {
            const repInfo = annotation.structureRepresentationInfo[StructureRepresentation.circle];
            newCoords = PolygonCalculation.rotateRectangleAroundPoint(tempCoords,
                this.annotationGroupsComponent.getAnnotationMinMax(annotation.id),
                this.sceneData.structuresData.structures[annotation.structureLink].representationsData.structureCircle.tempCoordinates,
                angle,
                repInfo.distToCircleMid,
                repInfo.circleMidIsInside
            );
        } else {
            newCoords = PointCalculation.rotatePointAroundAnother(annotation.tempCoordinates,
                midpoint,
                angle,
                false
            );
        }

        this.annotationGroupsComponent.moveLabel(labelId, {
            x: newCoords.x - tempCoords.x, y: newCoords.y - tempCoords.y
        });
        annotation.tempCoordinates = newCoords;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes an annotation from the DOM and the cache.
     *
     * @param labelId {Number} - the unique id of the annotation
     */
    removeAnnotationDOMCache(labelId) {
        this.annotationGroupsComponent.removeLabelFromDOM(labelId);
        this.annotationGroupsComponent.purgeLabelFromCache(labelId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hovers an annotation in the draw area.
     *
     * @param labelId {Number} - the unique id of the annotation
     */
    hoverAnnotation(labelId) {
        this.annotationGroupsComponent.hoverLabel(labelId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Selects an annotation in the draw area.
     *
     * @param annotationId {Number} - id of the annotation to select
     */
    selectAnnotationDrawarea(annotationId) {
        this.annotationGroupsComponent.selectLabel(annotationId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Unselects an annotation in the draw area.
     *
     * @param annotationId {Number} - id of the annotation to unselect
     */
    unselectAnnotationDrawarea(annotationId) {
        this.annotationGroupsComponent.unselectLabel(annotationId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hides all annotations in the draw area.
     *
     * @param annotations {Array} - the unique ids of the annotation
     */
    hideAnnotations(annotations) {
        this.annotationGroupsComponent.hideAnnotations(annotations);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Selects an annotation in the draw area and mark it as selected in the annotationData
     * container.
     *
     * @param annotationId {Number} - id of the annotation to select
     * @param executeCallback {Boolean} - whether to execute the selection callback
     */
    selectAnnotationDrawareaContainer(annotationId, executeCallback = true) {
        const annotation = this.sceneData.annotationsData.annotations[annotationId];
        this.sceneData.annotationsData.selectedAnnotations.add(annotationId);
        this.annotationGroupsComponent.selectLabel(annotationId);
        if (executeCallback && this.selectionCallback) {
            this.selectionCallback({
                type: 'annotation',
                selectionType: 'select',
                structureId: parseInt(annotation.structureLink),
                annotationId: parseInt(annotationId),
                additionalInformation: annotation.additionalInformation
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Unselects an annotation in the draw area and remove its selection status inside
     * the annotationData container.
     *
     * @param annotationId {Number} - id of the annotation to unselect
     * @param hover {Boolean} - whether the annotation is to be shown as hovered
     * @param executeCallback {Boolean} - whether to execute the selection callback
     */
    unselectAnnotationDrawareaContainer(annotationId, hover = false, executeCallback = true) {
        const annotation = this.sceneData.annotationsData.annotations[annotationId];
        this.sceneData.annotationsData.selectedAnnotations.delete(Number(annotationId));
        if (hover) {
            this.annotationGroupsComponent.hoverLabel(annotationId);
        } else {
            this.annotationGroupsComponent.unselectLabel(annotationId);
        }
        if (executeCallback && this.selectionCallback) {
            this.selectionCallback({
                type: 'annotation',
                selectionType: 'unselect',
                structureId: parseInt(annotation.structureLink),
                annotationId: parseInt(annotationId),
                additionalInformation: annotation.additionalInformation
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes an annotation from the draw area and data.
     *
     * @param annotationId {Number} - id of the annotation to remove
     */
    removeAnnotationDataView(annotationId) {
        const annotationsData = this.sceneData.annotationsData;
        const annotation = annotationsData.annotations[annotationId];
        const structureId = annotation.structureLink;
        if (structureId !== undefined) {
            const structure = this.sceneData.structuresData.structures[structureId];
            const annotationConnectionData = structure.annotationConnectionData;
            annotationConnectionData.annotations.delete(annotationId);
            const atomLinks = annotation.atomLinks;
            if (atomLinks) {
                const atomAnnotationConnections = annotationConnectionData.atomAnnotationConnections;
                for (const atomId in atomLinks) {
                    atomAnnotationConnections[atomId].delete(annotationId);
                    if (atomAnnotationConnections[atomId].size === 0) {
                        delete atomAnnotationConnections[atomId];
                    }
                }
            }
        }
        this.removeAnnotationDOMCache(annotationId);
        delete annotationsData.annotations[annotationId];
        delete annotationsData.originalAnnotations[annotationId];
        annotationsData.selectedAnnotations.delete(annotationId);
    }
}