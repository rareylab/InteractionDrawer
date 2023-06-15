/**
 * Drawer which manipulates the viewer itself and all non molecular objects.
 */
class ViewerDrawer {
    /**
     * Contains instances for configuration options, data storage/access, user interaction tracking,
     * draw area manipulation and all relevant components.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     * @param interactionState {Object} - tracks user interactions
     * @param svgComponent {Object} - represents the draw area
     */
    constructor(opts, sceneData, interactionState, svgComponent) {
        this.opts = opts;
        this.sceneData = sceneData;
        this.interactionState = interactionState;
        this.svgComponent = svgComponent;

        this.transformGroupsComponent = svgComponent.transformGroupsComponent;
        this.backgroundComponent = svgComponent.backgroundComponent;
        this.selectionLineComponent = svgComponent.selectionLineComponent;
        this.interactionElementsGroupComponent =
            this.transformGroupsComponent.interactionElementsGroupComponent;
        this.mirrorLineComponent = this.interactionElementsGroupComponent.mirrorLineComponent;
        this.intermolecularLineComponent =
            this.interactionElementsGroupComponent.intermolecularLineComponent;
        this.annotationFormComponent =
            this.interactionElementsGroupComponent.annotationFormComponent;
        this.structureFormComponent =
            this.interactionElementsGroupComponent.structureFormComponent;
        this.editAnnotationFormComponent =
            this.interactionElementsGroupComponent.editAnnotationFormComponent;
        this.editAtomFormComponent =
            this.interactionElementsGroupComponent.editAtomFormComponent;
        this.editEdgeFormComponent =
            this.interactionElementsGroupComponent.editEdgeFormComponent;
        this.editStructureFormComponent =
            this.interactionElementsGroupComponent.editStructureFormComponent;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets a new color for the background of the draw area.
     *
     * @param color {String} - valid CSS color
     */

    changeBackgroundColor(color) {
        this.backgroundComponent.changeColor(color);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Makes sure that the elements inside the draw area get rescaled properly.
     */

    resize() {
        const bc = this.svgComponent.svgDom.node().getBoundingClientRect();
        this.rescale(bc.width, bc.height);
    }

    /*----------------------------------------------------------------------*/

    /**
     * On change of the size of the draw area associated with the drawer,
     * rescales and re-centers the current scene.
     *
     * @param width {Number} - new width of the draw area
     * @param height {Number} - new height of the draw area
     */
    rescale(width, height) {
        this.sceneData.setInfoForDrawing(width, height);
        this.center();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Zoom into the scene.
     */
    zoomIn() {
        this.scale(
            this.interactionState.transformParams.scale *
            (1 + (this.opts.zoomStrength / 100))
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Zoom out of the scene.
     */
    zoomOut() {
        this.scale(
            this.interactionState.transformParams.scale *
            (1 - (this.opts.zoomStrength / 100))
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Center the current scene (based on its bounding box) within the draw
     * area, leaving some space at the sides defined by .idealMaxHeight
     * and .idealMaxWidth.
     */
    center() {
        if (!this.sceneData.structuresData.structureLoaded) {
            return;
        }
        const {width, height, mid: {x: curMidX, y: curMidY}} = this.sceneData.globalLimits;
        const drawAreaHeight = this.sceneData.drawAreaDim.height;
        const {x: drawAreaMidX, y: drawAreaMidY} = this.sceneData.drawAreaMid;
        const {
            scale: curScale, translate: {x: translateX, y: translateY}
        } = this.interactionState.transformParams;

        //point where we are at currently (in CURRENT scale)
        const transformPoint = {
            x: curMidX + translateX, y: curMidY + translateY
        };

        //point to reach to be centered (also in CURRENT scale)
        const scaledMid = {
            x: drawAreaMidX / curScale, y: drawAreaMidY / curScale
        };

        //how to get to correct point
        const offsetX = scaledMid.x - transformPoint.x;
        const offsetY = scaledMid.y - transformPoint.y;

        //scale s.t. the scene does not go over borders of draw area
        let scale = this.sceneData.idealMaxWidth / width;
        if (height * scale >= drawAreaHeight) {
            scale = this.sceneData.idealMaxHeight / height;
        }

        //correct translation so scale works right
        this.interactionState.transformParams.translate = {
            x: translateX + offsetX, y: translateY + offsetY
        };

        this.scale(scale);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Applies a scale factor to the draw area. Further apply necessary
     * translations s.t. the center of the scene's bounding box remains at the
     * same relative position.
     *
     * @param scale {Number} - the scale factor
     */
    scale(scale = this.interactionState.transformParams.scale) {
        //apply scaling limits
        scale = scale > this.opts.sceneMaxScale ? this.opts.sceneMaxScale :
            scale < this.opts.sceneMinScale ? this.opts.sceneMinScale : scale;

        //get necessary variables
        const {mid: {x: xMid, y: yMid}} = this.sceneData.globalLimits;

        //easy scaling: no scene loaded, just apply scale
        if (!xMid || !yMid) {
            this.interactionState.transformParams.scale = scale;
            this.transformGroupsComponent.applyTransform(this.interactionState.transformParams);
            return;
        }
        //harder scaling: need to convey feel of zooming into scene
        const {
            scale: prevScale, translate: {x: translateX, y: translateY}
        } = this.interactionState.transformParams;

        //the point to scroll IN to (in CURRENT scale)
        const zoomPoint = {
            x: xMid, y: yMid
        };

        //the point to reach in the end (in NEW scale)
        const scalePoint = {
            x: (zoomPoint.x + translateX) * prevScale / scale,
            y: (zoomPoint.y + translateY) * prevScale / scale
        };

        //how to get to correct point
        const xOffset = scalePoint.x - zoomPoint.x;
        const yOffset = scalePoint.y - zoomPoint.y;

        this.interactionState.transformParams.scale = scale;
        this.interactionState.transformParams.translate = {
            x: xOffset, y: yOffset
        };
        this.transformGroupsComponent.applyTransform(this.interactionState.transformParams);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Set the 'cursor' style on the group containing all relevant draw
     * elements of the scene.
     *
     * @param val {String} - the 'cursor' style to use
     */
    setCursorStyle(val) {
        this.transformGroupsComponent.setTransformGroupPointer(val);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hide element representing the mirror line.
     *
     */
    hideMirrorLine() {
        this.mirrorLineComponent.hideMirrorLine();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Draws the rectangular selection shape.
     */
    drawRectSelector(drawnRectPoints) {
        this.selectionLineComponent.drawRectSelector(drawnRectPoints);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Extends and drawers the lasso selection shape.
     */
    addToFreeSelector(drawAreaCoords) {
        this.selectionLineComponent.addToFreeSelector(drawAreaCoords);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hides the form that allows the editing of objects.
     */
    hideEditForm() {
        const object = this.interactionState.interaction.edit.object;
        if (this.opts.moveFreedomLevel === "free" && object.type === 'atom') {
            this.editAtomFormComponent.hideEditForm();
        } else if (this.opts.moveFreedomLevel === "free" && object.type === 'edge') {
            this.editEdgeFormComponent.hideEditForm();
        } else if (object.type === 'annotation') {
            this.editAnnotationFormComponent.hideEditForm();
        } else if (this.opts.moveFreedomLevel === "structures"
            && (object.type === 'atom' ||
                object.type === 'edge' ||
                object.type === 'structureCircle')) {
            this.editStructureFormComponent.hideEditForm();
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Opens a form that allows the editing of objects.
     * @param x {Number} - x coordinate of cursor
     * @param y {Number} - y coordinate of cursor
     */
    openEditForm(x, y) {
        const object = this.interactionState.interaction.edit.object;
        if (this.opts.moveFreedomLevel === "free" && object.type === 'atom') {
            const atom =
                this.sceneData.structuresData.structures[
                    object.structureId
                    ].atomsData.atomById[object.id];
            const data = {};
            data.label = atom.label;
            data.element = atom.element;
            data.charge = atom.charge;
            data.hydrogenCount = atom.hydrogenCount;
            this.editAtomFormComponent.open(x, y, this.sceneData.globalLimits, data);
        } else if (this.opts.moveFreedomLevel === "free" && object.type === 'edge') {
            const edge =
                this.sceneData.structuresData.structures[
                    object.structureId
                    ].edgesData.edgeById[object.id];
            const data = {};
            if (edge.aromatic) {
                data.type = 'aromatic';
            } else {
                data.type = edge.type;
            }
            this.editEdgeFormComponent.open(x, y, this.sceneData.globalLimits, data);
        } else if (object.type === 'annotation') {
            const annotation = this.sceneData.annotationsData.annotations[object.id];
            const data = {};
            data.label = annotation.label;
            this.editAnnotationFormComponent.open(x, y, this.sceneData.globalLimits, data);
        } else if (this.opts.moveFreedomLevel === "structures"
            && (object.type === 'atom' ||
                object.type === 'edge' ||
                object.type === 'structureCircle')) {
            const structure = this.sceneData.structuresData.structures[object.structureId];
            const data = {};
            data.label = structure.structureLabel;
            data.representation = structure.representationsData.currentRepresentation;
            this.editStructureFormComponent.open(x, y, this.sceneData.globalLimits, data);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns user defined info from the edit form.
     *
     * @return {Object} - info of the add edit form plus its coordinates
     */
    getEditFormData() {
        const object = this.interactionState.interaction.edit.object;
        let formData = {};
        if (this.opts.moveFreedomLevel === "free" && object.type === 'atom') {
            formData = this.editAtomFormComponent.getData();
        } else if (this.opts.moveFreedomLevel === "free" && object.type === 'edge') {
            formData = this.editEdgeFormComponent.getData();
        } else if (object.type === 'annotation') {
            formData = this.editAnnotationFormComponent.getData();
        } else if (this.opts.moveFreedomLevel === "structures"
            && (object.type === 'atom' ||
                object.type === 'edge' ||
                object.type === 'structureCircle')) {
            formData = this.editStructureFormComponent.getData();
        }
        formData.coords = this.interactionState.interaction.edit.coords;
        return formData;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hides the form that allows adding of new annotations.
     */
    hideAnnotationAddForm() {
        this.annotationFormComponent.hideAnnotationAddForm();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns user defined info from the annotation form.
     *
     * @return {Object} - info of the add annotation form plus its coordinates
     */
    getAnnotationFormData() {
        const formData = this.annotationFormComponent.getData();
        formData.coords = this.interactionState.interaction.addAnnotation.coords;
        return formData;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Opens a form that allows the adding of new annotations.
     * @param x {Number} - x coordinate of cursor
     * @param y {Number} - y coordinate of cursor
     */
    openAnnotationAddForm(x, y) {
        this.annotationFormComponent.open(x, y, this.sceneData.globalLimits);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hides the form that allows adding of new structures.
     */
    hideStructureAddForm() {
        this.structureFormComponent.hideStructureAddForm();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns user defined info from the structure form.
     *
     * @return {Object} - info of the add structure form plus its coordinates
     */
    getStructureFormData() {
        const formData = this.structureFormComponent.getData();
        formData.coords = this.interactionState.interaction.addStructure.coords;
        return formData;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Opens a form that allows the adding of new structures.
     * @param x {Number} - x coordinate of cursor
     * @param y {Number} - y coordinate of cursor
     */
    openStructureAddForm(x, y) {
        this.structureFormComponent.open(x, y, this.sceneData.globalLimits);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Applies (cumulative!) translations to the draw area, moving all elements
     * inside. Not tracked by history.
     *
     * @param xOffset {Number} - offset to translate by in x-direction
     * @param yOffset {Number} - offset to translate by in y-direction
     */
    transform({xOffset, yOffset}) {
        const {
            scale, translate: {x: translateX, y: translateY}
        } = this.interactionState.transformParams;
        const newX = translateX + (xOffset / scale);
        const newY = translateY + (yOffset / scale);
        this.interactionState.transformParams.translate = {
            x: newX, y: newY
        };
        this.transformGroupsComponent.applyTransform(this.interactionState.transformParams);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Clears the selector used in rect and lasso selection.
     */
    clearSelector() {
        this.selectionLineComponent.hideSelector();
        this.interactionState.selectionPoints.length = 0; //clear array
    };

    /*----------------------------------------------------------------------*/

    /**
     * During the second step of line mirror interaction, move the mirror line
     * in such a way that one point of it remains at its center and one point
     * on the current cursor position.
     */
    setMirrorLineToCursor() {
        const {
            lineMirror: {curStructureId: structureId, splineControlPoints: splineControlPoints},
            start, origin
        } = this.interactionState.interaction;
        if (structureId === undefined && Object.keys(splineControlPoints).length === 0) return;
        if (structureId === undefined) {
            for (const splineId in splineControlPoints) {
                const realStart = this.interactionState.getRealCoordinates(start);
                const spline = this.sceneData.hydrophobicData.hydrophobicContacts[splineId];
                const realMid = PointCalculation.findGeometricCenter(
                    spline.controlPoints.filter(cp => cp.enabled).map(cp => {
                        return cp;
                    })
                );
                const movement = PointCalculation.createMovementBetweenTwoPoints(
                    realMid,
                    realStart
                );
                const first = movement.forward(50);
                const second = movement.backward(100);
                this.mirrorLineComponent.moveMirrorLine(first, second);
                this.interactionState.mirrorLineInfo = {
                    endpoints: {
                        first: first, second: second
                    }, structure: undefined
                };
            }
        } else {
            const structure = this.sceneData.structuresData.structures[structureId];
            const {mid, maxDist: rad} = structure.boundaries;
            const realStart = this.interactionState.getRealCoordinates(start);
            const movement = PointCalculation.createMovementBetweenTwoPoints(mid, realStart);
            const first = movement.forward(rad);
            const second = movement.backward(2 * rad);
            this.mirrorLineComponent.moveMirrorLine(first, second);
            this.interactionState.mirrorLineInfo = {
                endpoints: {
                    first: first, second: second
                }, structure: structureId
            };
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets zooming and transformation state of the viewer to the default state.
     */
    reset() {
        this.transformGroupsComponent.applyTransform({scale: 1, translate: {x: 0, y: 0}})
    }

    /*----------------------------------------------------------------------*/

    /**
     * Draws the helper line for the drawing of new intermolecular edges.
     */
    toggleIntermolecularLineDrawing(iContainer, draw, color = undefined, dashed = true) {
        if (draw) {
            this.intermolecularLineComponent.moveAddIntermolecularLine(iContainer.endpoints.first,
                iContainer.endpoints.second,
                color,
                dashed
            );
        } else {
            this.intermolecularLineComponent.hideAddIntermolecularLine();
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets viewer to good scale so atom representations are drawn well.
     */
    suggestDrawScaling() {
        return this.transformGroupsComponent.suggestDrawScaling();
    }
}