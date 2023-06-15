/**
 * By components commonly used functions for drawing of selector shapes.
 */
class SelectorUtils {
    /**
     * Contains instances for configuration options, generic, line and circle drawing.
     *
     * @param opts {Object} - configuration parameters
     * @param baseHelpers {BaseUtils} - util instance with by components commonly
     * used generic functions
     * @param circleHelpers {CircleUtils} - util instance with by components commonly
     * used functions for circle drawing
     * @param lineHelpers {LineUtils} - util instance with by components commonly
     * used functions for line drawing
     */
    constructor(opts, baseHelpers, circleHelpers, lineHelpers) {
        this.opts = opts;
        this.base = baseHelpers;
        this.circle = circleHelpers;
        this.line = lineHelpers;
    }

    /*----------------------------------------------------------------------*/

    /**
     * As part of atom movement, updates atom selector shapes (currently just
     * the one circle selector).
     *
     * @param selectors {Array} - array of D3 selector of atom selector shapes
     * @param selectorShapes {Array} - array of objects which internally
     * describe the shape of selectors
     * @param xOffset {Number} - offset to move in x-direction
     * @param yOffset {Number} - offset to move in y-direction
     */
    moveAllSelectors(selectors, selectorShapes, xOffset, yOffset) {
        for (let i = 0; i < selectors.length; ++i) {
            this.moveSelectorShape(selectors[i], selectorShapes[i], xOffset, yOffset);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * As part of atom movement, updates a single atom selector shape.
     *
     * @param selector {Object} - D3 selector of atom selector shape
     * @param selectorShape {Object} - internal description of the shape
     * @param xOffset {Number} - offset to move in x-direction
     * @param yOffset {Number} - offset to move in y-direction
     */
    moveSelectorShape(selector, selectorShape, xOffset, yOffset) {
        const type = selectorShape.type;
        if (type === 'circle') {
            this.moveCircleSelectorByPlacementInfo(selector,
                selectorShape.coordinates,
                xOffset,
                yOffset
            );
        } else if (type === 'line') {
            this.moveLineSelectorByPlacementInfo(selector, selectorShape, xOffset, yOffset);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds out the style to set to a new color for different types of
     * selection shapes.
     *
     * @param type {String} - type of selection shape
     * @returns {String} - CSS style property to change to new color
     */
    static inferSelectorStyleToChange(type) {
        if (type === 'circle') {
            return 'fill'
        } else if (type === 'line') {
            return 'stroke';
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Switches the color of a selection shape based on the status it should
     * convey (unselected, hovered, selected).
     *
     * @param selector {Object} - D3 selector for the selection shape
     * @param type {String} - type of selection shape ('circle' or 'line')
     * @param status {SelectorStatus} - the selection status
     */
    switchSelector(selector, type, status) {
        const style = SelectorUtils.inferSelectorStyleToChange(type);
        switch (status) {
            case SelectorStatus.select:
                selector.style(style, this.opts.colors.SELECTION)
                    .style('opacity', this.opts.selectorOpacity);
                break;
            case SelectorStatus.unselect:
                selector.style('opacity', 0);
                break;
            case SelectorStatus.hover:
                selector.style(style, this.opts.colors.HOVER)
                    .style('opacity', this.opts.selectorOpacity);
                break;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Generic function to mark all selector shapes associated with a text
     * label according to a given status.
     *
     * @param sels {Object} - the container object holding selector information
     * for the text label
     * @param status {SelectorStatus} - the selection status to convey
     */
    switchTextLabelSelectorStatus(sels, status) {
        const selectors = sels.mouseSels;
        const selShapes = sels.selectorShapes;
        selectors.forEach((selector, i) => {
            const type = selShapes[i].type;
            this.switchSelector(selector, type, status);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Generic function to switch the color of all selector shapes associated
     * with a text label to a given color.
     *
     * @param sels {Object} - the container object holding selector information
     * for the text label
     * @param color {String} - valid CSS color
     */
    switchTextLabelSelectorColor(sels, color) {
        const selectors = sels.mouseSels;
        const selShapes = sels.selectorShapes;
        selectors.forEach((selector, i) => {
            const type = selShapes[i].type;
            SelectorUtils.changeSelectorColor(selector, type, color);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Switches the color of a selection shape based on a given CSS color.
     *
     * @param selector {Object} - D3 selector for the selection shape
     * @param type {String} - type of selection shape ('circle' or 'line')
     * @param color {String} - valid CSS color
     */
    static changeSelectorColor(selector, type, color) {
        const style = SelectorUtils.inferSelectorStyleToChange(type);
        selector.style(style, color)
            .style('opacity', this.opts.selectorOpacity);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Helper function to create circular selection shapes.
     *
     * @param domParent {Object} - D3 selector for group to place selector in
     * @param id {String} - id for the created DOM element (can be '')
     * @param coordinates {Object} - x- and y-coordinates of the circle's
     * center
     * @param rad {Number} - optional custom radius of selector
     * @returns {Object} - description of created element, contains reference
     * to selector and description of the shape of the selector
     */
    drawCircleSelectionShape(domParent, id, coordinates, rad = this.opts.atomSelectorRadius) {
        const sel = this.circle.addCircleToSvg(domParent, id, coordinates, rad, {
            'fill': this.opts.colors.BACKGROUND, 'opacity': 0
        });
        const selectorShape = {
            type: 'circle', coordinates: {
                x: coordinates.x, y: coordinates.y
            }, rad: rad
        };
        return {
            sel: sel, selectorShape: selectorShape
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Helper function to create rectangular selection shapes by creation of a
     * line between two points of a certain width.
     *
     * @param domParent {Object} - D3 selector for group to place selector in
     * @param id {String} - id for the created DOM element (can be '')
     * @param midpoints {Array} - the two endpoints of the line
     * @param strokeWidth {Number} - width of the line
     * @returns {Object} - description of created element, contains reference
     * to selector and description of the shape of the selector
     */
    drawLineSelectionShape(domParent, id, midpoints, strokeWidth) {
        const sel = this.line.addLineToSvg(domParent, id, midpoints[0], midpoints[1], {
            'stroke': this.opts.colors.BACKGROUND, 'opacity': 0, 'stroke-width': strokeWidth
        });
        const normals = LineCalculation.findUnitNormals(midpoints[0], midpoints[1]);
        const poly = PolygonCalculation.createRectFromLine(midpoints[0],
            midpoints[1],
            normals,
            strokeWidth / 2
        );
        const selectorShape = {
            type: 'line',
            midpoints: midpoints,
            corners: poly,
            width: VectorCalculation.getDist2d(midpoints[0], midpoints[1]),
            height: strokeWidth //might sound weird but is correct
        };
        return {
            sel: sel, selectorShape: selectorShape
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Draws the different circle and line shapes constituting the full
     * selection shape engulfing a text label.
     *
     * @param label {String} - the text of the text label
     * @param coordinates {Object} - x- and y-coordinates at the center of the
     * text label
     * @param width {Number} - width of the text label's bounding box
     * @param domParent {Object} - D3 selector of SVG group to insert
     * selector elements into
     * @param selId {String} - id of the selector to use as DOM Id base
     * @returns {Object} - arrays of D3 selector objects and selector shapes
     */
    drawTextLabelSelectors(label, coordinates, width, domParent, selId) {
        const mouseSels = [];
        const selectorShapes = [];
        let sel, selectorShape;
        const addSelector = (type, args, i) => {
            const idSuffix = (i !== undefined) ? '_' + i : '';
            const domId = selId + idSuffix;
            if (type === 'circle') {
                const selDesc = this.drawCircleSelectionShape(domParent, domId, args[0]);
                sel = selDesc.sel;
                selectorShape = selDesc.selectorShape;
            } else if (type === 'rect') {
                const selDesc = this.drawLineSelectionShape(domParent,
                    domId,
                    args,
                    this.opts.atomSelectorRadius * 2
                );
                sel = selDesc.sel;
                selectorShape = selDesc.selectorShape;
            }
            mouseSels.push(sel);
            selectorShapes.push(selectorShape);
        };
        //what shapes to use for selection shape around text
        const textSelector = this.opts.textSelector;
        if (textSelector === 'circle') {
            addSelector('circle', [coordinates]);
        } else if (textSelector === 'full') {
            if (!label || label.length <= 1) {
                addSelector('circle', [coordinates]);
            } else {
                //estimate excess space on border boxes of larger text elements
                const offset = width / 2 - this.opts.textBorderCorrection;
                const leftCoords = {
                    x: coordinates.x - offset, y: coordinates.y
                };
                addSelector('circle', [leftCoords], 0);
                const rightCoords = {
                    x: coordinates.x + offset, y: coordinates.y
                };
                addSelector('circle', [rightCoords], 1);
                addSelector('rect', [leftCoords, rightCoords], 2);
            }
        }

        return {
            mouseSels: mouseSels, selectorShapes: selectorShapes
        }
    };

    /*----------------------------------------------------------------------*/

    /**
     * Updates the position of a line selection shape based on given offsets.
     *
     * @param sel {Object} - D3 selector of line selection shape
     * @param selShape {Object} - object representing the selection shape
     * @param xOffset {Number} - offset to move in x-direction
     * @param yOffset {Number} - offset to move in y-direction
     */
    moveLineSelectorByPlacementInfo(sel, selShape, xOffset, yOffset) {
        const newMidpoints = selShape.midpoints.map(midpoint => {
            return {
                x: midpoint.x + xOffset, y: midpoint.y + yOffset
            };
        });
        selShape.midpoints = newMidpoints;
        selShape.corners = selShape.corners.map(point => {
            return {
                x: point.x + xOffset, y: point.y + yOffset
            };
        });
        this.line.updateLineByDrawpoints(sel.node(), newMidpoints);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates the position of a circle selection shape based on given offsets.
     *
     * @param sel {Object} - D3 selector of circle selection shape
     * @param info {Object} - new x- and y-coordinates of selection shape
     * @param xOffset {Number} - offset to move in x-direction
     * @param yOffset {Number} - offset to move in y-direction
     */
    moveCircleSelectorByPlacementInfo(sel, info, xOffset, yOffset) {
        BaseUtils.updatePlacementInfo(info, xOffset, yOffset);
        this.circle.moveCircleElement(sel.node(), info.x, info.y);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the 'transform' attribute on given D3 selectors.
     *
     * @param selector {Object} - selectors to reset
     */
    static resetTransformOnSelectors(selector) {
        selector.structureSel.node().removeAttribute('transform');
        selector.selectorSel.node().removeAttribute('transform');
        if (selector.debugSel) {
            selector.debugSel.node().removeAttribute('transform');
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Applies transformations to groups for atoms, edges, and their respective
     * surrounding selector shapes (making up a structural skeleton)
     *
     * @param sels {Object} - object holding D3 selectors for atom, edge and
     * structure circle related draw elements
     * @param xOffset {Number} - offset to move ring system by in x-direction
     * @param yOffset {Number} - offset to move ring system by in y-direction
     * @param type {String} - structural type identifier
     */
    moveSelectorsOfSkeleton(sels, xOffset, yOffset, type) {
        xOffset = this.base.round(xOffset);
        yOffset = this.base.round(yOffset);
        const transformStr = `translate(${xOffset} ${yOffset})`;
        if (type === "atom" || type === "edge") {
            sels.structureSel.attr('transform', transformStr);
            sels.selectorSel.attr('transform', transformStr);
            if (sels.debugSel) {
                sels.debugSel.attr('transform', transformStr);
            }
        }
        if (sels && type === "structureCircle") {
            sels.structureSel.attr('transform', transformStr);
            sels.selectorSel.attr('transform', transformStr);
        }
    }
}