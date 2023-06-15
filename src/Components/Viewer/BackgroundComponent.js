/**
 * Component for a SVG rectangle that represents the background of the draw area.
 */
class BackgroundComponent {
    /**
     * Contains all relevant D3 selectors and an instance for drawing utils.
     *
     * @param utils {Object} - by components commonly used generic functions for drawing
     * @param backgroundDom {Object} - D3 selector
     */
    constructor(utils, backgroundDom) {
        this.utils = utils;
        this.backgroundDom = backgroundDom;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets a new color for the background of the draw area.
     *
     * @param color {String} - valid CSS color
     */

    changeColor(color) {
        this.backgroundDom.style('fill', color);
    }
}