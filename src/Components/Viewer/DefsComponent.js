/**
 * Component for a SVG tag for gradients.
 */
class DefsComponent {
    /**
     * Contains all relevant D3 selectors and an instance for drawing utils.
     *
     * @param utils {Object} - by components commonly used generic functions for drawing
     * @param defsDom {Object} - D3 selector
     */
    constructor(utils, defsDom) {
        this.utils = utils;
        this.defsDom = defsDom;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds a new gradient to the def tag of the SVG which can then be used to
     * color bonds.
     *
     * @param gradientId {Number} - DOM id of this gradient
     * @param fromColor {String} - valid CSS color for the first stop color of
     * the gradient
     * @param toColor {String} - valid CSS color for the second stop color of
     * the gradient
     * @param fromCoords {Object} - x- and y-coordinates of first end position
     * @param toCoords {Object} - x- and y-coordinates of second end position
     * @returns {{htmlColor: string, domSel: (Object|Undefined|*), isOnDom: boolean, toColorSel:
     *     (Object|Undefined|*), url: string, fromColorSel: (Object|Undefined|*)}}
     */
    addGradientToSvg(gradientId, fromColor, toColor, fromCoords, toCoords) {
        const gradient = this.defsDom.append('linearGradient')
            .attr('gradientUnits', 'userSpaceOnUse');
        const gradientNode = gradient.node();
        this.utils.base.setAttributeRounded(gradientNode, 'x1', fromCoords.x);
        this.utils.base.setAttributeRounded(gradientNode, 'x2', toCoords.x);
        this.utils.base.setAttributeRounded(gradientNode, 'y1', fromCoords.y);
        this.utils.base.setAttributeRounded(gradientNode, 'y2', toCoords.y);

        if (gradientId) {
            gradient.attr('id', gradientId);
        }

        const g1 = gradient.append("stop")
            .attr('class', 'start')
            .attr('offset', '0%')
            .attr('stop-color', fromColor)
            .attr('stop-opacity', 1);

        const g2 = gradient.append('stop')
            .attr('class', 'end')
            .attr('offset', '100%')
            .attr('stop-color', toColor)
            .attr('stop-opacity', 1);

        const url = `url(#${gradientId})`;
        return {
            domSel: gradient,
            isOnDom: true,
            url: url,
            htmlColor: url,
            fromColorSel: g1,
            toColorSel: g2
        }
    }
}