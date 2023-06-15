/**
 * Container class to keep track of how the application of different changes
 * alters the boundaries of a geometrical structure.
 */
class BoundaryUpdateInfo {
    /**
     * For each given structural boundary (i.e., xMin, xMax, yMin, yMax),
     * keeps track of the current maximum/minimum and how this value has changed
     * since the last history step (as changeDir: 0 -> no change, 1 -> new
     * max/min was found, -1 -> uncertain about current max/min, marked for
     * required recalculation).
     *
     * @param structBounds {Object} - initial boundaries of the observed
     * structure
     */
    constructor(structBounds) {
        this.xMin = {
            changeDir: 0, val: structBounds.xMin
        };
        this.xMax = {
            changeDir: 0, val: structBounds.xMax
        };
        this.yMin = {
            changeDir: 0, val: structBounds.yMin
        };
        this.yMax = {
            changeDir: 0, val: structBounds.yMax
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Based on old and new boundaries of the structure, marks changes.
     *
     * @param oldLimits {Object} - boundaries of the observed structure before
     * changes were applied
     * @param newLimits {Object} - boundaries of the observed structure after
     * changes were applied
     */
    updateMaxesByLimits(oldLimits, newLimits) {
        this.updateMaxes('xMin', oldLimits.xMin, newLimits.xMin, false);
        this.updateMaxes('xMax', oldLimits.xMax, newLimits.xMax, true);
        this.updateMaxes('yMin', oldLimits.yMin, newLimits.yMin, false);
        this.updateMaxes('yMax', oldLimits.yMax, newLimits.yMax, true);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Marks changes to a specific boundary based on its old and new value.
     *
     * @param prop {String} - identifier of the boundary (xMin, xMax, yMin,
     * or yMax)
     * @param oldVal {Number} - old value of the boundary
     * @param newVal {Number} - new value of the boundary
     * @param largestIsLim {Boolean} - whether the boundary describes a
     * maximum or a minimum
     */
    updateMaxes(prop, oldVal, newVal, largestIsLim) {
        if (!this.updateMaxesLim(prop, newVal, largestIsLim)) {
            this.updateMaxesNeg(prop, oldVal, largestIsLim);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks whether a new value is a new maximum/minimum of a boundary and
     * if so, mark the corresponding changeDir as 1.
     *
     * @param prop {String} - identifier of the boundary (xMin, xMax, yMin,
     * or yMax)
     * @param newVal {Number} - new value of the boundary
     * @param largestIsLim {Boolean} - whether the boundary describes a
     * maximum or a minimum
     * @returns {Boolean} - whether input value is new maximum/minimum
     */
    updateMaxesLim(prop, newVal, largestIsLim) {
        const limit = this[prop];
        if (largestIsLim) {
            if (newVal >= limit.val) {
                this.setMaxesLim(prop, newVal);
                return true;
            }
        } else {
            if (newVal <= limit.val) {
                this.setMaxesLim(prop, newVal);
                return true;
            }
        }
        return false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks if a (now changed) old value was previously the maximum/minimum
     * of a boundary and if so, mark the corresponding changeDir as -1.
     *
     * @param prop {String} - identifier of the boundary (xMin, xMax, yMin,
     * or yMax)
     * @param oldVal {Number} - the old value of the boundary
     * @param largestIsLim {Boolean} - whether the boundary describes a
     * maximum or a minimum
     */
    updateMaxesNeg(prop, oldVal, largestIsLim) {
        const limit = this[prop];
        if (largestIsLim) {
            if (oldVal === limit.val && !limit.changeDir) { //smaller
                this.setMaxesNeg(prop);
            }
        } else {
            if (oldVal === limit.val && !limit.changeDir) { //larger
                this.setMaxesNeg(prop);
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * During adding of new elements to a structure, updates its boundaries
     * based on the element's boundaries.
     *
     * @param xMin {Number} - minimum x-coordinate of the added element's
     * bounding box
     * @param xMax {Number} - maximum x-coordinate of the added element's
     * bounding box
     * @param yMin {Number} - minimum y-coordinate of the added element's
     * bounding box
     * @param yMax {Number} - maximum y-coordinate of the added element's
     * bounding box
     */
    setMaxesAdd(xMin, xMax, yMin, yMax) {
        if (xMin < this.xMin.val) this.setMaxesLim('xMin', xMin);
        if (xMax > this.xMax.val) this.setMaxesLim('xMax', xMax);
        if (yMin < this.yMin.val) this.setMaxesLim('yMin', yMin);
        if (yMax > this.yMax.val) this.setMaxesLim('yMax', yMax);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates the tracking information for a boundary when a new maximum/
     * minimum is found.
     *
     * @param prop {String} - identifier of the boundary (xMin, xMax, yMin,
     * or yMax)
     * @param val {Number} - new maximum/minimum
     */
    setMaxesLim(prop, val) {
        this[prop] = {
            changeDir: 1, val: val
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Marks a boundary for necessary recalculation.
     *
     * @param prop {String} - identifier of the boundary (xMin, xMax, yMin,
     * or yMax)
     */
    setMaxesNeg(prop) {
        this[prop].changeDir = -1;
    }
}
