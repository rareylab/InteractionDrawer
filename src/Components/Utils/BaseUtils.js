/**
 * Contains by components commonly used generic functions for the drawing purposes.
 */
class BaseUtils {
    /**
     * Contains an instance for configuration options.
     *
     * @param opts {Object} - configuration parameters
     */
    constructor(opts) {
        this.opts = opts;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Rounds given value to user-specified precision (in this.opts.decimalPrecision).
     *
     * @param val {Number} - value to round
     * @returns {Number} - rounded value
     */
    round(val) {
        return Helpers.round(val, this.opts.decimalPrecision);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Trade-off between accuracy and file size. Rounds attribute (coordinates)
     * to precision specified by user (in this.opts.decimalPrecision).
     *
     * @param node {Element} - node to set attribute for
     * @param attr {String} - attribute to set
     * @param val {Number} - value to set attribute to
     */
    setAttributeRounded(node, attr, val) {
        node.setAttribute(attr, this.round(val));
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates x- and y-coordinates of an element to a new position.
     *
     * @param node {Element} - the browser element to move
     * @param x {Number} - x-coordinate of the new position
     * @param y {Number} - y-coordinate of the new position
     */
    moveGenericElement(node, x, y) {
        this.setAttributeRounded(node, 'x', x);
        this.setAttributeRounded(node, 'y', y);
    }

    /*----------------------------------------------------------------------*/

    /**
     * As part of atom movement, updates internal placement info for a text
     * element.
     *
     * @param info {Object} - internal placement information object
     * @param xOffset {Number} - offset to move in x-direction
     * @param yOffset {Number} - offset to move in y-direction
     */
    static updatePlacementInfo(info, xOffset, yOffset) {
        const newX = info.x + xOffset;
        const newY = info.y + yOffset;
        info.x = newX;
        info.y = newY;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Helper function to determine necessary offsets on the ends of dashed
     * basic lines such that only full dashes are used within the line.
     *
     * @param midpoints {Array} - coordinates of line endpoints
     * @returns {Number} - required offsets
     */
    getBaseDashOffsetByMidpoints(midpoints) {
        return this.getDashOffsetByMidpoints(midpoints,
            this.opts.lineDashDrawn,
            this.opts.lineDashGap
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Helper function to determine necessary offsets on the ends of dashed
     * point to point constraints such that only full dashes are used within
     * the line.
     *
     * @param midpoints {Array} - coordinates of point to point constraint endpoints
     * @returns {Number} - required offsets
     */
    getPtoPdashOffsetByMidpoints(midpoints) {
        return this.getDashOffsetByMidpoints(midpoints,
            this.opts.geomine.interactionQueryDashDrawn,
            this.opts.geomine.interactionQueryDashGap
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Helper function to determine necessary offsets on the ends of dashed
     * lines such that only full dashes are used within the line.
     *
     * @param midpoints {Array} - coordinates of line endpoints
     * @param drawn {Number} - length of a dash segment
     * @param gap {Number} - gap between dash segments
     * @returns {Number} - required offsets
     */
    getDashOffsetByMidpoints(midpoints, length, gap) {
        const dist = VectorCalculation.getDist2d(midpoints[0], midpoints[1]);
        return LineCalculation.calcDashOffset(dist, length, gap);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Helper function to convert structure of bbox object to object of minima
     * and maxima.
     *
     * @param x {Number} - x-coordinate of the bbox (upper left corner)
     * @param y {Number} - y-coordinate of the bbox (upper left corner)
     * @param width {Number} - width of the bbox
     * @param height {Number} - height of the bbox
     * @returns {Object} - minima and maxima of the bbox
     */
    static convertBBoxToMaxes({x, y, width, height}) {
        return {
            xMin: x, yMin: y, xMax: x + width, yMax: y + height
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets the bbox of a d3 selector. If the selector node is hidden
     * (display:none) this will display the node, calculate the bbox and
     * hide the node afterwards.
     *
     * @param sel {Object} - D3 selector
     * @returns {Object} - BBox of node
     */
    static getSelBBox(sel) {
        let bbox;
        const display = sel.style("display") !== "none";

        if (!display) {
            sel.style("display", null);
        }

        bbox = sel.node().getBBox();

        if (!display) {
            sel.style("display", "none");
        }

        return bbox;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Helper function to determine y-coordinate of text element to align its
     * center with a given y-coordinate, given the text elements bbox (which
     * y-coordinate does not align with provided y-coordinate usually)
     *
     * @param bbox {Object} - bbox of the text element
     * @param centerY {Number} - coordinate that the text's center should
     * align with
     * @returns {Number} - y-coordinate of text element which centers the text
     */
    static centerBBoxY(bbox, {y: centerY}) { //atom
        const curYmid = bbox.y + bbox.height / 2;
        const yOffset = centerY - curYmid;
        return centerY + yOffset;
    }
}