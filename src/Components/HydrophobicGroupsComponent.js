/**
 * Component that manages SVG groups for the drawing of hydrophobic contacts.
 */
class HydrophobicGroupsComponent {
    /**
     * Contains all relevant D3 selectors and instances for configuration options and drawing utils.
     * Creates containers for the caching of draw element selectors.
     *
     * @param opts {Object} - configuration parameters
     * @param utils {Object} - by components commonly used generic functions for drawing
     * @param hydrophobicGroupDom {Object} - D3 selector of the hydrophobic contacts group
     * @param hydrophobicSelGroupDom {Object} - D3 selector of the selection shape group
     */
    constructor(opts, utils, hydrophobicGroupDom, hydrophobicSelGroupDom) {
        this.opts = opts;
        this.utils = utils;
        this.hydrophobicGroupDom = hydrophobicGroupDom;
        this.hydrophobicSelGroupDom = hydrophobicSelGroupDom;

        //Structure object id -> hydrophobic contact id -> selectors
        this.hydrophobicToSelMap = {};
    }

    /*----------------------------------------------------------------------*/

    /**
     * Draws the spline representing a hydrophobic contact as a path element
     * within the SVG and circular selection shapes at the positions of control
     * points. Also creates the wrapper element for this type of intermolecular
     * forces if not done before.
     *
     * @param structureId {Number} - the unique id of the structure the
     * hydrophobic contact belongs to
     * @param hydrophobicId {Number} - the unique id of the hydrophobic
     * contact
     * @param controlPoints {Array} - positions of control points
     * @param splinePath {String} - the path representing the shape of the
     * spline
     */
    drawHydrophobicContact(structureId, hydrophobicId, controlPoints, splinePath) {
        if (!this.hydrophobicToSelMap.hasOwnProperty(structureId)) {
            this.hydrophobicToSelMap[structureId] = {};
        }
        const hydrophobicMap = this.hydrophobicToSelMap[structureId];
        const controlSels = {};
        controlPoints.forEach((coords, idx) => {
            controlSels[idx] =
                this.utils.selector.drawCircleSelectionShape(this.hydrophobicSelGroupDom,
                    '',
                    coords
                ).sel;
        });
        hydrophobicMap[hydrophobicId] = {
            pathSel: LineUtils.addPathToSvg(
                this.hydrophobicGroupDom,
                '',
                splinePath,
                {
                    'stroke-width': this.opts.lineWidth + 'px',
                    'stroke': this.opts.colors.hydrophobicContacts
                }),
            controlSels: controlSels
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds new control points to a existing hydrophobic contact as circular
     * selection shapes within the SVG.
     *
     * @param structureId {Number} - the unique id of the structure the
     * hydrophobic contact belongs to
     * @param hydrophobicId {Number} - the unique id of the hydrophobic
     * contact
     * @param controlPoints {Array} - positions of control points
     * @param addId {Number} - where to insert the given control points in the
     * controlSels array
     */
    addHydrophobicControlPoints(structureId, hydrophobicId, controlPoints, addId = undefined) {
        if (!this.hydrophobicToSelMap.hasOwnProperty(structureId)) {
            return;
        }

        const structureMap = this.hydrophobicToSelMap[structureId];
        if (!structureMap.hasOwnProperty(hydrophobicId)) {
            return;
        }

        const hydrophobicMap = structureMap[hydrophobicId];
        const startSels = [];
        const midSels = [];
        const endSels = [];
        for (const [idx, sel] of Object.entries(hydrophobicMap.controlSels)) {
            if (idx >= addId) {
                endSels.push(sel);
            } else {
                startSels.push(sel);
            }
        }
        controlPoints.forEach((coords, idx) => {
            midSels[idx] = this.utils.selector.drawCircleSelectionShape(this.hydrophobicSelGroupDom,
                '',
                coords
            ).sel;
        });
        hydrophobicMap.controlSels = {};
        [...startSels, ...midSels, ...endSels].forEach((sel, idx) => {
            hydrophobicMap.controlSels[idx] = sel;
        })
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves control points of a hydrophobic contact to new positions and set
     * a new path for the spline.
     *
     * @param structureId {Number} - the unique id of the structure the
     * hydrophobic contact belongs to
     * @param hydrophobicId {Number} - the unique id of the hydrophobic
     * contact
     * @param controlPoints {Array} - positions of control points
     * @param splinePath {String} - the path representing the shape of the
     * spline
     */
    updateHydrophobicContact(structureId, hydrophobicId, controlPoints, splinePath) {
        const {pathSel, controlSels} = this.hydrophobicToSelMap
            [structureId][hydrophobicId];
        controlPoints.forEach((coords, idx) => {
            this.utils.circle.moveCircleElement(controlSels[idx].node(), coords.x, coords.y);
        });
        pathSel.attr('d', splinePath);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Detaches the path element and selection shapes of a hydrophobic contact
     * from the DOM.
     *
     * @param structureId {Number} - the unique id of the structure the
     * hydrophobic contact belongs to
     * @param hydrophobicId {Number} - the unique id of the hydrophobic
     * contact
     */
    removeHydrophobicContactFromDOM(structureId, hydrophobicId) {
        const {pathSel, controlSels} = this.hydrophobicToSelMap
            [structureId][hydrophobicId];
        pathSel.remove();
        Object.values(controlSels).forEach(controlSel => {
            controlSel.remove();
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Reattaches the cached path element and selection shapes of a hydrophobic
     * contact to the DOM (after application of removeHydrophobicContactFromDOM()).
     *
     * @param structureId {Number} - the unique id of the structure the
     * hydrophobic contact belongs to
     * @param hydrophobicId {Number} - the unique id of the hydrophobic
     * contact
     */
    redrawHydrophobicContact(structureId, hydrophobicId) {
        const splineGnode = this.hydrophobicGroupDom.node();
        const ctrlGnode = this.hydrophobicSelGroupDom.node();
        const {pathSel, controlSels} = this.hydrophobicToSelMap
            [structureId][hydrophobicId];
        splineGnode.appendChild(pathSel.node());
        Object.values(controlSels).forEach(controlSel => {
            ctrlGnode.appendChild(controlSel.node());
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Detaches the selection shapes of a single control point of a hydrophobic
     * contact from the DOM. Note that this does not alter the spline so you
     * may have to redraw it.
     *
     * @param structureId {Number} - the unique id of the structure the
     * hydrophobic contact belongs to
     * @param hydrophobicId {Number} - the unique id of the hydrophobic
     * contact
     * @param controlPointId {Number} - the id of the control point
     */
    removeHydrophobicControlPoint(structureId, hydrophobicId, controlPointId) {
        const controlSel = this.hydrophobicToSelMap
            [structureId][hydrophobicId].controlSels[controlPointId];
        controlSel.remove();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Reattaches the cached selection shapes of a single control point of a
     * hydrophobic contact to the DOM (after application of
     * removeHydrophobicControlPoint()). Note that this does not alter the spline
     * so you may have to redraw it.
     *
     * @param structureId {Number} - the unique id of the structure the
     * hydrophobic contact belongs to
     * @param hydrophobicId {Number} - the unique id of the hydrophobic
     * contact
     * @param controlPointId {Number} - the id of the control point
     */
    redrawHydrophobicControlPoint(structureId, hydrophobicId, controlPointId) {
        const ctrlGnode = this.hydrophobicSelGroupDom.node();
        const controlSel = this.hydrophobicToSelMap
            [structureId][hydrophobicId].controlSels[controlPointId];
        ctrlGnode.appendChild(controlSel.node());
    }

    /*----------------------------------------------------------------------*/

    /**
     * To show the position of all control points of a hydrophobic contact,
     * changes the color of all such points' selection shapes to hover color.
     *
     * @param structureId {Number} - the unique id of the structure the
     * hydrophobic contact belongs to
     * @param hydrophobicId {Number} - the unique id of the hydrophobic
     * contact
     */
    hoverAllHydrophobicControlPoints(structureId, hydrophobicId) {
        const controlSels = this.hydrophobicToSelMap[structureId]
            [hydrophobicId].controlSels;
        Object.keys(controlSels).forEach(idx => {
            this.hoverHydrophobicControlPoint(structureId, hydrophobicId, idx);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Indicates that a hydrophobic contact's control point is hovered by the
     * user by switching the color of its corresponding selection shape to the
     * hover color.
     *
     * @param structureId {Number} - the unique id of the structure the
     * hydrophobic contact belongs to
     * @param hydrophobicId {Number} - the unique id of the hydrophobic
     * contact
     * @param idx {Number} - index of the control point in the array of control
     * points within the Spline object representing the hydrophobic contact
     */
    hoverHydrophobicControlPoint(structureId, hydrophobicId, idx) {
        this.utils.selector.switchSelector(this.hydrophobicToSelMap[structureId]
            [hydrophobicId].controlSels[idx], 'circle', SelectorStatus.hover);
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a previously hovered control point of a hydrophobic contact, removes
     * color from its corresponding selection shape.
     *
     * @param structureId {Number} - the unique id of the structure the
     * hydrophobic contact belongs to
     * @param hydrophobicId {Number} - the unique id of the hydrophobic
     * contact
     * @param idx {Number} - index of the control point in the array of control
     * points within the Spline object representing the hydrophobic contact
     */
    unselectHydrophobicControlPoint(structureId, hydrophobicId, idx) {
        this.utils.selector.switchSelector(this.hydrophobicToSelMap[structureId]
            [hydrophobicId].controlSels[idx], 'circle', SelectorStatus.unselect);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes all cached information for a hydrophobic contact's elements.
     *
     * @param structureId {Number} - the unique id of the structure the
     * hydrophobic contact belongs to
     * @param hydrophobicId {Number} - the unique id of the hydrophobic
     * contact
     */
    purgeHydrophobicContactFromCache(structureId, hydrophobicId) {
        delete this.hydrophobicToSelMap[structureId][hydrophobicId];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Shows/hides hydrophobic contacts by changing the corresponding display
     * properties of the svg elements. Also hides the selectors.
     *
     * @param full {Boolean} - set visibility of all hydrophobic contacts
     * @param hydrophobic {Boolean} - toggles the visibility if set true
     * @param structureId {Number} - id of structure to show/hide hydrophobic contacts from
     * @param visibilityClass {String} - CSS class for show/hide
     */
    setVisibility(full, hydrophobic, structureId, visibilityClass) {
        if ((full || hydrophobic) && this.hydrophobicToSelMap.hasOwnProperty(structureId)) {
            const hydrophobicToSelMap = this.hydrophobicToSelMap[structureId];
            for (const hydrophobicSel of Object.values(hydrophobicToSelMap)) {
                hydrophobicSel.pathSel.classed(visibilityClass, true);
                for (const controlSel of Object.values(hydrophobicSel.controlSels)) {
                    controlSel.classed(visibilityClass, true);
                }
            }
        }
    }
}