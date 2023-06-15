/**
 * Drawer that uses other drawers and its own component for the visualization
 * of structure circles of the structure circle representation type.
 */
class StructureCircleDrawer {
    /**
     * Contains instances for json validation, configuration options,
     * data storage/access, draw area manipulation and all relevant components.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     * @param structureCircleGroupsComponent {Object} - component for structure circles
     * @param textLabelDrawer {Object} - drawer for text labels.
     * @param annotationDrawer {Object} - drawer for annotations
     */
    constructor(opts,
        sceneData,
        structureCircleGroupsComponent,
        textLabelDrawer,
        annotationDrawer
    ) {
        this.opts = opts;
        this.sceneData = sceneData;
        this.structureCircleGroupsComponent = structureCircleGroupsComponent;
        this.textLabelDrawer = textLabelDrawer;
        this.annotationDrawer = annotationDrawer;

        this.selectionCallback = null;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Draws the circle as an alternative representation of a structure into the
     * draw area.
     *
     * @param structure {Structure} - Structure object
     */
    applyAddStructureCircle(structure) {
        this.structureCircleGroupsComponent.drawStructureCircle(structure);

        const structureMid = structure.boundaries.mid;
        const {
            rad, circleCss, textColor
        } = this.opts.structureCircleOpts[structure.structureType] ||
        this.opts.structureCircleOpts['default'];
        const structureCircle = {
            id: structure.id,
            isStructureCircle: true,
            coordinates: Object.assign({}, structureMid),
            tempCoordinates: Object.assign({}, structureMid),
            rad: rad,
            label: structure.structureLabel,
            circleStyles: circleCss,
            labelColor: textColor,
            selectorShapes: undefined,
            drawLimits: undefined,
            wn: 0 //winding number for free selector
        };
        structure.representationsData.structureCircle = structureCircle;

        this.setStructureCircleDrawLimits(structureCircle);
        this.setStructureCircleSelectionShapes(structureCircle);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds representation of draw limits after creating draw element for the
     * structure circle (for placement concerns).
     *
     * @param structureCircle {Object} - the structure circle
     * @param drawLimits {Object} - object containing draw limits as minima
     * and maxima of the circles bounding box (as xmin, xmax, ymin, ymax). Will be
     * calculated from corresponding drawn circle svg element when omitted
     */
    setStructureCircleDrawLimits(structureCircle, drawLimits = undefined) {
        structureCircle.drawLimits = {
            ...this.structureCircleGroupsComponent.getStructureCircleDrawLimits(structureCircle.id), ...drawLimits
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds representation of the surrounding selector shape of the structure
     * circle after creating its draw element.
     *
     * @param structureCircle {Object} - the structure circle
     * @param selectorShapes {Array} - different selector shapes, objects
     * holding both 'type' and 'coordinates' field. If undefined or omitted
     * this will be extracted from the svg draw elements
     * @param byTemp {Boolean} - whether movement is temporary (not logged to
     * history) or not
     */
    setStructureCircleSelectionShapes(structureCircle, selectorShapes = undefined, byTemp = false) {
        if (!selectorShapes) {
            selectorShapes =
                this.structureCircleGroupsComponent.getStructureCircleSelShapes(structureCircle.id)
        }
        structureCircle.tempSelectorShapes = selectorShapes;
        if (!byTemp) {
            structureCircle.selectorShapes = JSON.parse(JSON.stringify(selectorShapes));
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets the coordinates of a single structure circle to new values.
     * Note that this can only be done after updating the boundaries of
     * the structure.
     *
     * @param structure {Object} - structure whose circle to move
     * @param globalMaxes {BoundaryUpdateInfo} - log of how the global
     * boundaries of the scene change
     * @returns {Array} - Change objects for the next history step
     */
    applyCoordinateChangesStructureCircle(structure, globalMaxes) {
        const structureCircle = structure.representationsData.structureCircle;
        const oldCoords = structureCircle.coordinates;
        const newCoords = structure.boundaries.mid;
        if (PointCalculation.coordsAlmostEqual(oldCoords, newCoords)) return [];

        //update coordinates
        const changes = [];
        const moveFn = (id, offsets) => {
            this.structureCircleGroupsComponent.moveStructureCircle(id, offsets);
        };
        changes.push(this.textLabelDrawer.updateTextLabelCoordinates(structureCircle,
            newCoords,
            moveFn
        ));

        //update draw limits and selector shapes
        const oldDrawLimits = Object.assign({}, structureCircle.drawLimits);
        this.setStructureCircleDrawLimits(structureCircle);
        this.setStructureCircleSelectionShapes(structureCircle);
        const newDrawLimits = structureCircle.drawLimits;

        globalMaxes.updateMaxesByLimits(oldDrawLimits, newDrawLimits);

        const limitChange = new Change();
        const changeLimits = () => {
            this.setStructureCircleDrawLimits(structureCircle);
            this.setStructureCircleSelectionShapes(structureCircle);
        };
        limitChange.bindApplyRevert(changeLimits);
        changes.push(limitChange);

        return changes;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Rotates the structure circle of a structure around a given midpoint.
     * Also rotates all annotations of this structure.
     *
     * @param structureId {Number} - unique Id of structure to rotate
     * @param angle {Number} - angle (in degrees!) to rotate by
     * @param midpoint {Object} - x- and y-coordinates of the point to rotate
     * the structure around
     * @param fullRotate {Boolean} - whether the rotation is around the scenes
     * mid or the structures mid
     */
    rotateStructureCircle(structureId, angle, midpoint, fullRotate) {
        const structure = this.sceneData.structuresData.structures[structureId];
        const offset = structure.calcStructureCircleRotationOffset(angle, true, midpoint);

        if (fullRotate) {
            //the label has to be oriented correctly, need new temp coordinates
            this.updateCoordsForStructureCircleByOffset(structureId, offset, true);
            this.structureCircleGroupsComponent.moveStructureCircle(structureId, offset);

            if (structure.representationsData.isCurRepresentation(StructureRepresentation.circle)) {
                //update annotations, move them by the same offset so they stay at the
                //same relative position to the circle during movement
                structure.annotationConnectionData.annotations.forEach(annotationId => {
                    this.annotationDrawer.moveAnnotation(annotationId, offset);
                })
            }
        } else if (structure.representationsData.isCurRepresentation(StructureRepresentation.circle)) {
            //no need to update the circle. Just update annotations.
            structure.annotationConnectionData.annotations.forEach(annotationId => {
                this.annotationDrawer.rotateAnnotation(annotationId, angle, midpoint);
            })
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates temporary coordinates of a structure circle based on an individual
     * offset given.
     *
     * @param structureId {Number} - id of the structure the structure circle
     * belongs to
     * @param offset {Object} - x and y offset values
     * @param byTemp {Boolean} - whether to change temp coordinates or not
     */
    updateCoordsForStructureCircleByOffset(structureId, offset, byTemp) {
        const structure = this.sceneData.structuresData.structures[structureId];
        const circle = structure.representationsData.structureCircle;
        const coords = byTemp ? circle.tempCoordinates : circle.coordinates;
        coords.x = coords.x + offset.x;
        coords.y = coords.y + offset.y;
        if (!byTemp) {
            this.tempCoordinates = Object.assign({}, coords);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the "tempCoordinates" of a structure circle to their "coordinates"
     * values.
     *
     * @param structureId {Number} - id of the structure the structure circle
     * belongs to
     */
    resetStructureCircleTempCoords(structureId) {
        const structure = this.sceneData.structuresData.structures[structureId];
        const circle = structure.representationsData.structureCircle;
        const tempCoords = circle.tempCoordinates;
        const coords = circle.coordinates;
        tempCoords.x = coords.x;
        tempCoords.y = coords.y;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Selects a structure circle in the draw area and mark it as temporarily (!)
     * selected in the corresponding container.
     *
     * @param structureId {Number} - id of the structure the structure circle
     * belongs to
     */
    tempSelectStructureCircle(structureId) {
        if (!this.sceneData.structuresData.structures.hasOwnProperty(structureId)) {
            return;
        }
        const structure = this.sceneData.structuresData.structures[structureId];
        structure.representationsData.tempSelectStructureCircle();
        this.structureCircleGroupsComponent.selectStructureCircle(structureId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Selects a structure circle in the draw area and mark it as selected in the
     * corresponding container.
     *
     * @param structureId {Number} - id of the structure the structure circle
     * belongs to
     */
    selectStructureCircleDrawareaContainer(structureId) {
        if (!this.sceneData.structuresData.structures.hasOwnProperty(structureId)) {
            return;
        }
        const structure = this.sceneData.structuresData.structures[structureId];
        structure.representationsData.selectStructureCircle();
        this.structureCircleGroupsComponent.selectStructureCircle(structureId);
        if (this.selectionCallback) {
            this.selectionCallback({
                type: 'structureCircle', selectionType: 'select', structureId: parseInt(structureId)
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Selects a structure circle in the draw area.
     *
     * @param structureId {Number} - id of the structure the structure circle
     * belongs to
     */
    selectStructureCircleDrawarea(structureId) {
        this.structureCircleGroupsComponent.selectStructureCircle(structureId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Unselects a structure circle in the draw area and remove its selection status
     * in the corresponding container.
     *
     * @param structureId {Number} - id of the structure the structure circle
     * belongs to
     * @param hover {Boolean} - whether the structure circle is to be shown as
     * hovered
     * @param executeCallback {Boolean} - whether to execute the selection callback
     */
    unselectStructureCircleDrawareaContainer(
        structureId,
        hover = false,
        executeCallback = true)
    {
        if (!this.sceneData.structuresData.structures.hasOwnProperty(structureId) ||
            !this.sceneData.structuresData.structures[structureId]
                .representationsData.hasRepresentation(StructureRepresentation.circle)) {
            return;
        }
        this.sceneData.structuresData.structures[structureId].representationsData.selectedStructureCircle =
            false;
        if (hover) {
            this.structureCircleGroupsComponent.hoverStructureCircle(structureId);
        } else {
            this.structureCircleGroupsComponent.unselectStructureCircle(structureId);
        }
        if (executeCallback && this.selectionCallback) {
            this.selectionCallback({
                type: 'structureCircle',
                selectionType: 'unselect',
                structureId: parseInt(structureId)
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Unselects a structure circle in the draw area.
     *
     * @param structureId {Number} - id of the structure the structure circle
     * belongs to
     */
    unselectStructureCircleDrawarea(structureId) {
        this.structureCircleGroupsComponent.unselectStructureCircle(structureId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hovers a structure circle in the draw area.
     *
     * @param structureId {Number} - id of the structure the structure circle
     * belongs to
     */
    hoverStructureCircle(structureId) {
        this.structureCircleGroupsComponent.hoverStructureCircle(structureId)
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves structural circle skeleton (as groups) by specified offsets.
     *
     * @param structureId {Number} - iId of structure to move skeleton of
     * @param xOffset {Number} - offset to move structure by in x-direction
     * @param yOffset {Number} - offset to move structure by in y-direction
     */
    moveStructureCircleSkeleton(structureId, xOffset, yOffset) {
        this.structureCircleGroupsComponent.moveStructureCircleSkeleton(structureId,
            xOffset,
            yOffset
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets translations made for structure circles of a certain structure
     *
     * @param structureId {Number} - id of structure to reset translations for
     */
    resetStructureCircleSkeletonTranslation(structureId) {
        this.structureCircleGroupsComponent.resetStructureCircleSkeletonTranslation(structureId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes structure circle only from the DOM
     *
     * @param structureId {Number} - the unique Id of the structure to remove
     * its structure circles from DOM
     */
    removeStructureCirclesFromDOM(structureId) {
        this.structureCircleGroupsComponent.removeFromDOM(structureId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes all cached structure circle information for a given structure (by its Id).
     *
     * @param structureId {Number} - id of structure to remove structure circle information
     * from
     */
    purgeStructureCirclesFromCache(structureId) {
        this.structureCircleGroupsComponent.purgeFromCache(structureId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a previously removed structure, puts its detached structure circles
     * DOM elements back into previous positions.
     *
     * @param structureId {Number} - id of structure to add back
     */
    redrawStructureCircles(structureId) {
        this.structureCircleGroupsComponent.redraw(structureId);
    }
}