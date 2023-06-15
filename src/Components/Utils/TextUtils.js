/**
 * By components commonly used functions for drawing of text.
 */
class TextUtils {
    /**
     * Contains instances for configuration options and generic drawing.
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
     * Attaches a text element to the SVG as child of a given parent element.
     *
     * @param domParent {Object} - D3 selector for the parent element
     * @param id {number|string} - unique Id to be used in the browser
     * @param text {String}- the text to be displayed
     * @param x {Number} - x-coordinate to place the element at
     * @param y {Number} - y-coordinate to place the element at
     * @param styles {Object} - properties matched to style values
     * @returns {Object} - D3 selector for the text element
     */
    addTextToSvg(domParent, id, text, {x, y}, styles = {}) {
        //place main text
        const textSel = domParent.append('text')
            .text(text);
        const textNode = textSel.node();
        this.base.setAttributeRounded(textNode, 'x', x);
        this.base.setAttributeRounded(textNode, 'y', y);
        if (id) {
            textSel.attr('id', id);
        }
        for (const style in styles) {
            textSel.style(style, styles[style]);
        }
        return textSel;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Helper function to align coordinates with center of text representation
     * (which normally is drawn with coordinates at top left corner).
     *
     * @param sel {Object} - D3 selector of text to center
     * @param coordinates {Object} - x- and y-coordinates to center text in
     * @param forceBotLeft {Boolean} - set to true to force the coordinates
     * to be set to the lower left corner instead of using css features. Used
     * for the atoms labels.
     * @returns {Object} - description of text element and its bounding box
     */
    static centerText(sel, coordinates, forceBotLeft = false) {
        //by svg itself text is placed with lower left corner at coordinates,
        //reposition s.t. middle of text is at coordinates.
        //'text-anchor: middle' aligns the text on mid with x-axis
        //and 'dominant-baseline: middle' with y-axis.
        //Because some browsers (at least firefox) change the BBox of elements
        //with 'transform:scale()' set and that leads to incorrect placement
        //if the coordinates are set to bottom left it is best to use the
        //css features instead. Unfortunately those are not supported by
        //all browsers yet.
        const labelBbox = sel.node().getBBox();
        let labelX, labelY;

        if (forceBotLeft || !CSS.supports("text-anchor", "middle")) {
            labelX = coordinates.x - labelBbox.width / 2;
        } else {
            labelX = coordinates.x;
            sel.style("text-anchor", "middle")
        }

        if (forceBotLeft || !CSS.supports("dominant-baseline", "middle")) {
            labelY = BaseUtils.centerBBoxY(labelBbox, coordinates);
        } else {
            labelY = coordinates.y;
            sel.style("dominant-baseline", "middle")
        }

        sel.attr('x', labelX)
            .attr('y', labelY);

        return {
            sel: sel, width: labelBbox.width, height: labelBbox.height, x: labelX, y: labelY
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Helper function to create a d3 text selector with its svg element.
     *
     * @param textG {Object} - D3 selector for group to place text in
     * @param label {String} - text label to create
     * @param coordinates {Object} - x- and y-coordinates to center text in
     * @param color {String} - valid CSS color string for text color
     * @returns {Object} - d3 selector of the text
     */
    placeText(textG, label, coordinates, color) {
        return textG.append('text')
            .attr('x', coordinates.x)
            .attr('y', coordinates.y)
            .style('font-family', this.opts.fontFamily)
            .attr('font-size', this.opts.textSize + 'px')
            .style('fill', color)
            .text(label);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Helper function to align coordinates with center of text representation
     * (which normally is drawn with coordinates at top left corner).
     *
     * @param textG {Object} - D3 selector for group to place text in
     * @param label {String} - text label to create
     * @param coordinates {Object} - x- and y-coordinates to center text in
     * @param color {String} - valid CSS color string for text color     *
     * @param forceBotLeft {Boolean} - set to true to force the coordinates
     * to be set to the lower left corner instead of using css features to
     * center the text. Used for the atoms labels.
     * @returns {Object} - description of text element and its bounding box
     */
    placeCenteredText(textG, label, coordinates, color, forceBotLeft = false) {
        return TextUtils.centerText(this.placeText(textG, label, coordinates, color),
            coordinates,
            forceBotLeft
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * As part of atom movement, update internal placement information of one
     * of the different text elements drawn to represent a certain atom.
     *
     * @param sel {Object} - D3 selector of the text element
     * @param info {Object} - placement info object
     * @param xOffset {Number} - offset to move in x-direction
     * @param yOffset {Number} - offset to move in y-direction
     */
    moveTextByPlacementInfo(sel, info, xOffset, yOffset) {
        BaseUtils.updatePlacementInfo(info, xOffset, yOffset);
        this.base.moveGenericElement(sel.node(), info.x, info.y);
    }
}