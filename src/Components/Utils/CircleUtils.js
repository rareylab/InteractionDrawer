/**
 * Contains by components commonly used functions for the drawing of circles.
 */
class CircleUtils {
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
    }

    /*----------------------------------------------------------------------*/

    /**
     * Attaches a circle element to the SVG as child of a given parent element
     *
     * @param domParent {Object} - D3 selector for the parent element
     * @param id {number|string} - unique id to be used in the browser
     * @param x {Number} - x-coordinate to place the element at
     * @param y {Number} - y-coordinate to place the element at
     * @param rad {Number} - radius of the circle
     * @param styles {Object} - properties matched to style values
     * @returns {Object} - D3 selector for the circle
     */
    addCircleToSvg(domParent, id, {x, y}, rad, styles = {}) {
        const circleSel = domParent.append('circle');
        const circleNode = circleSel.node();
        this.base.setAttributeRounded(circleNode, 'cx', x);
        this.base.setAttributeRounded(circleNode, 'cy', y);
        this.base.setAttributeRounded(circleNode, 'r', rad);
        if (id) {
            circleSel.attr('id', id);
        }
        for (const style in styles) {
            circleSel.style(style, styles[style]);
        }
        return circleSel;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates the position of a circle by moving its center to new x- and y-
     * coordinates.
     *
     * @param circleNode {Element} - the browser element to move
     * @param x {Number} - x-coordinate of the new center
     * @param y {Number} - y-coordinate of the new center
     */
    moveCircleElement(circleNode, x, y) {
        this.base.setAttributeRounded(circleNode, 'cx', x);
        this.base.setAttributeRounded(circleNode, 'cy', y);
    }
}