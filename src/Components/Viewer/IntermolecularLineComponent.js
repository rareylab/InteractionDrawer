/**
 * Component that manages the drawing of the intermolecular line used for the adding
 * of new intermolecular edges.
 */
class IntermolecularLineComponent {
    /**
     * Contains all relevant D3 selectors and an instance for drawing utils.
     *
     * @param utils {Object} - by components commonly used generic functions for drawing
     * @param addIntermolecularLineDom {Object} - D3 selector of the intermolecular line
     */
    constructor(utils, addIntermolecularLineDom) {
        this.utils = utils;
        this.addIntermolecularLineDom = addIntermolecularLineDom;
        this.addIntermolecularLineShown = false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves the line to signal the intermolecular edge to add.
     *
     * @param first {Object} - first new coordinates of the line
     * @param second {Object} - second new coordinates of the line
     * @param color {String} - color of the line as valid css
     * @param dashed {Boolean} - draw a dashed line
     */
    moveAddIntermolecularLine(first, second, color = undefined, dashed = true ) {
        if (!this.addIntermolecularLineShown) {
            this.addIntermolecularLineDom.style('display', null);
            this.addIntermolecularLineShown = true;
        }
        if (dashed) {
            this.addIntermolecularLineDom.style('stroke-dasharray', this.utils.line.dashArrString());
            this.addIntermolecularLineDom.style('stroke-dashoffset',
                this.utils.base.getBaseDashOffsetByMidpoints([first, second])
            );
        } else {
            this.addIntermolecularLineDom.style('stroke-dasharray', '');
            this.addIntermolecularLineDom.style('stroke-dashoffset', '');
        }
        if (color) {
            this.addIntermolecularLineDom.style('stroke', color)
        }
        this.utils.line.updateLineByDrawpoints(this.addIntermolecularLineDom.node(),
            [first, second]
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hides element representing the add intermolecular line.
     */
    hideAddIntermolecularLine() {
        this.addIntermolecularLineDom.style('display', 'none');
        this.addIntermolecularLineShown = false;
    }
}