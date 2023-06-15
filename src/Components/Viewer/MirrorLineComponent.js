/**
 * Component that manages the drawing of the mirror line used for structure mirroring.
 */
class MirrorLineComponent {
    /**
     * Contains all relevant D3 selectors and an instance for drawing utils.
     *
     * @param utils {Object} - by components commonly used generic functions for drawing
     * @param mirrorLineDom {Object} - D3 selector of the mirror line
     */
    constructor(utils, mirrorLineDom) {
        this.utils = utils;
        this.mirrorLineDom = mirrorLineDom;
        this.mirrorLineShown = false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves the line on which structures are mirrored.
     *
     * @param first {Object} - first new coordinates of mirror line
     * @param second {Object} - second new coordinates of mirror line
     */
    moveMirrorLine(first, second) {
        if (!this.mirrorLineShown) {
            this.mirrorLineDom.style('display', null);
            this.mirrorLineShown = true;
        }
        this.utils.line.updateLineByDrawpoints(this.mirrorLineDom.node(), [first, second]);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hides element representing the mirror line.
     */
    hideMirrorLine() {
        this.mirrorLineDom.style('display', 'none');
        this.mirrorLineShown = false;
    }
}
