/**
 * Component that manages the drawing of the selection line used for selection of scene elements.
 */
class SelectionLineComponent {
    /**
     * Contains all relevant D3 selectors.
     *
     * @param selectionLineDom {Object} - D3 selector of the selection line
     */
    constructor(selectionLineDom) {
        this.selectionLineDom = selectionLineDom;
        //INTERACTION - for selection
        this.selectionPath = '';
    }

    /*----------------------------------------------------------------------*/

    /**
     * Changes the path for the selection helper element into a rectangular
     * selector through given polygon point.
     *
     * @param selectorPoints {Array} - corner points of the rectangle
     */
    drawRectSelector(selectorPoints) {
        const path = Helpers.addFormToPath(selectorPoints, '');
        this.selectionLineDom.attr('d', path);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds a point to the current path of the selection helper element.
     *
     * @param x {Number} - x-coordinate of point to add
     * @param y {Number} - y-coordinate of point to add
     */
    addToFreeSelector({x, y}) {
        if (this.selectionPath === '') {
            this.selectionPath += `M${x} ${y}`;
        } else {
            this.selectionPath += ` L${x} ${y}`;
        }
        this.selectionLineDom.attr('d', this.selectionPath);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hides the selection helper element.
     */
    hideSelector() {
        this.selectionLineDom.attr('d', '');
        this.selectionPath = '';
    }
}