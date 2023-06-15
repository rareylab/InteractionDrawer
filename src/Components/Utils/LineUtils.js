/**
 * By components commonly used functions for thr drawing of lines.
 */
class LineUtils {
    /**
     * Contains instances for configuration options and generic drawing functions.
     *
     * @param opts {Object} - configuration parameters
     * @param baseHelpers {BaseUtils} - util instance with by components commonly
     * used generic functions
     */
    constructor(opts, baseHelpers) {
        this.opts = opts;
        this.base = baseHelpers;
        this.dashArrStringPtoP =
            `${this.opts.geomine.interactionQueryDashDrawn} ${this.opts.geomine.interactionQueryDashGap}`;
    }

    /*----------------------------------------------------------------------*/

    dashArrString() {
        return `${this.opts.lineDashDrawn} ${this.opts.lineDashGap}`;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Attaches a line element to the SVG as child of a given parent element.
     *
     * @param domParent {Object} - D3 selector for the parent element
     * @param id {number|string} - unique id to be used in the browser
     * @param fromCoords {Object} - x- and y-coordinates of first line end
     * @param toCoords {Object} - x- and y-coordinates of the second line end
     * @param styles {Object} - properties matched to style values
     * @returns {Object} - D3 selector for the line element
     */
    addLineToSvg(domParent, id, fromCoords, toCoords, styles = {}) {
        const lineSel = domParent.append('line');
        const lineNode = lineSel.node();
        this.base.setAttributeRounded(lineNode, 'x1', fromCoords.x);
        this.base.setAttributeRounded(lineNode, 'y1', fromCoords.y);
        this.base.setAttributeRounded(lineNode, 'x2', toCoords.x);
        this.base.setAttributeRounded(lineNode, 'y2', toCoords.y);
        if (id) {
            lineSel.attr('id', id);
        }
        for (const style in styles) {
            lineSel.style(style, styles[style]);
        }
        return lineSel;
    }

    /*----------------------------------------------------------------------*/

    /**
     * From given draw points, creates the line and path elements represent
     * bonds of all types.
     *
     * @param wrapper {Object} - D3 selector for group element to append drawn
     * lines/paths to
     * @param drawPoints {Array} - array of arrays that defines the
     * endpoints of lines to draw
     * @param edgeType {String} - (optional) parameter to specify type of
     * edge. If not specified, bond is treated like single bond
     * @param styles {Object} - mapping of CSS styles to properties
     * @returns {Array} - D3 selectors for the added edges
     */
    addElementsByDrawPoints(wrapper,
        drawPoints,
        {edgeType, styles} = {edgeType: undefined, styles: {}}
    ) {
        const atomPairInteractionTypes = [
            'up',
            'stereoFront',
            'stereoFrontReverse',
            'stereoBack',
            'stereoBackReverse',
            'single',
            'double',
            'triple',
            'down'
        ];
        if (drawPoints.length === 0) {
            return [];
        }
        let sels;
        if (atomPairInteractionTypes.includes(edgeType)) {
            sels = this.addPathFromDrawPoints(wrapper, drawPoints, styles);
        } else { //no type for atomPairInteraction (treated as single)
            sels = this.addLinesForDrawPoints(wrapper, drawPoints, styles);
        }
        return sels;
    }

    /*----------------------------------------------------------------------*/

    /**
     * From given draw points, construct line elements for the individual lines
     * within the SVG.
     *
     * @param wrapper {Object} - D3 selector for group element to append drawn
     * lines/paths to
     * @param drawPoints {Array} - array of arrays that defines the
     * endpoints of lines to draw
     * @param styles {Object} - mapping of CSS styles to properties
     * @returns {Array} - D3 selectors for the added edges
     */
    addLinesForDrawPoints(wrapper, drawPoints, styles) {
        const sels = [];
        drawPoints.forEach(drawPoint => {
            sels.push(this.addLineToSvg(wrapper, '', drawPoint[0], drawPoint[1], styles));
        });
        return sels;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Attaches a path element to the SVG as child of a given parent element.
     *
     * @param domParent {Object} - D3 selector for the parent element
     * @param id {number|string} - unique id to be used in the browser
     * @param path {String} - path to put into the elements 'd' attribute
     * @param styles {Object} - properties matched to style values
     * @returns {Object} - D3 selector for the path element
     */
    static addPathToSvg(domParent, id, path, styles = {}) {
        const pathSel = domParent.append('path')
            .attr('d', path);
        if (id) {
            pathSel.attr('id', id);
        }
        for (const style in styles) {
            pathSel.style(style, styles[style]);
        }
        return pathSel;
    }

    /*----------------------------------------------------------------------*/

    /**
     * From given draw points, constructs lines within a single path element
     * within the SVG.
     *
     * @param wrapper {Object} - D3 selector for group element to append drawn
     * lines/paths to
     * @param drawPoints {Array} - array of arrays that defines the
     * endpoints of lines to draw
     * @param styles {Object} - mapping of CSS styles to properties
     * @returns {Object} - D3 selector for the constructed path
     */
    addPathFromDrawPoints(wrapper, drawPoints, styles) {
        return LineUtils.addPathToSvg(wrapper, '', this.createPathFromPoints(drawPoints), styles);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Translates an array of line endpoints into a path usable in SVG path
     * elements.
     *
     * @param pointArrs {Array} - array of arrays that defines the
     * endpoints of lines to draw
     * @returns {String} - the path
     */
    createPathFromPoints(pointArrs) {
        let path = '';
        pointArrs.forEach(points => {
            const first = points[0];
            path += ` M ${this.base.round(first.x)} ${this.base.round(first.y)}`;
            for (let i = 1, len = points.length; i < len; ++i) {
                const cur = points[i];
                path += ` L ${this.base.round(cur.x)} ${this.base.round(cur.y)}`;
            }
            path += ` L ${this.base.round(first.x)} ${this.base.round(first.y)}`;
        });
        return path;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates x- and y-coordinates of a line to a new position.
     *
     * @param lineNode {Element} - line node to set attribute for
     * @param drawPoints {Array} - x- and y-coordinates of line start/end points of a new position.
     */
    updateLineByDrawpoints(lineNode, drawPoints) {
        this.base.setAttributeRounded(lineNode, 'x1', drawPoints[0].x);
        this.base.setAttributeRounded(lineNode, 'y1', drawPoints[0].y);
        this.base.setAttributeRounded(lineNode, 'x2', drawPoints[1].x);
        this.base.setAttributeRounded(lineNode, 'y2', drawPoints[1].y);
    }
}