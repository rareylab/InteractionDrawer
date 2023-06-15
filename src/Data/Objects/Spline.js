/**
 * Class to manage the representation of splines (for hydrophobic contacts).
 */
class Spline {
    /**
     * Creates new Spline object.
     *
     * @param structureLink {Number} - the structure the spline belongs to
     * @param controlPoints {Array} - control points defining the spline
     * (optional, can be set later from data, need to have radius as rad)
     */
    constructor(structureLink, controlPoints = null) {
        this.structureLink = structureLink;
        this.hidden = false;
        this.enabled = true;
        if (controlPoints) {
            this.controlPoints = JSON.parse(JSON.stringify(controlPoints));
            this.tempControlPoints = JSON.parse(JSON.stringify(controlPoints));
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds control points from data as expected in JSON input format.
     *
     * @param dataPoints {Array} - array of objects containing x- and
     * y-coordinates of control points + atomLinks to remember for data
     * retrieval
     * @param rad {Number} - radius of control points
     * @param addId {Number} - where to insert the given control points in the
     * control points array. Add to end if undefined
     */
    addControlPointsFromData(dataPoints, rad, addId = undefined) {
        let startPoints = [];
        let midPoints = [];
        let endPoints = [];
        if (this.hasOwnProperty("controlPoints")) {
            if (addId === undefined || addId >= this.controlPoints.length) {
                addId = this.controlPoints.length;
            }
            startPoints = this.controlPoints.slice(0, addId);
            endPoints = this.controlPoints.slice(addId)
        }
        midPoints = dataPoints.map(({x, y, atomLinks}) => {
            return {
                x: x, y: y, atomLinks: atomLinks ? atomLinks.slice() : [], rad: rad, enabled: true
            };
        });
        const controlPoints = [...startPoints, ...midPoints, ...endPoints];
        this.controlPoints = JSON.parse(JSON.stringify(controlPoints));
        this.tempControlPoints = JSON.parse(JSON.stringify(controlPoints));
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the path representing the spline for use in SVG elements.
     *
     * @param byTemp {Boolean} - whether to use temporary or non-temporary
     * coordinates for control points
     * @returns {String} - the path representing the spline
     */
    createSplinePath(byTemp = false) {
        const ctrlArr = this.makeCtrlPointArr(byTemp);
        const curvePoints = SplineInterpolation.getCurvePoints(ctrlArr);
        const coords = SplineInterpolation.curvePointsToCoords(curvePoints);
        this.tempCurveCoords = coords;
        if (!byTemp) {
            this.curveCoords = Object.assign([], coords);
        }
        return SplineInterpolation.createSplinePath(curvePoints);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates input for spline interpolation from control points.
     *
     * @param byTemp {Boolean} - whether to use temporary or non-temporary
     * coordinates for control points
     * @returns {Array} - array of alternating x- and y-coordinates of control
     * points
     */
    makeCtrlPointArr(byTemp = false) {
        const arr = [];
        const controlPoints = this.getControlPoints(byTemp)
            .filter((cp => cp.enabled));
        controlPoints.forEach(({x, y}) => {
            arr.push(x);
            arr.push(y);
        });
        return arr;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds offset to a specified (by index) control point.
     *
     * @param idx {Number} - index of control point in internal control point
     * Array
     * @param offset {Object} - x- and y-offset to move control point by
     * @param byTemp {Boolean} - whether to update temporary or non-temporary
     * coordinates of the control point
     */
    updateControlPoint(idx, offset, byTemp = false) {
        const controlPoints = this.getControlPoints(byTemp);
        const oldPointInfo = controlPoints[idx];
        const newPoint = {
            x: oldPointInfo.x + offset.x,
            y: oldPointInfo.y + offset.y,
            rad: oldPointInfo.rad,
            enabled: oldPointInfo.enabled
        };
        controlPoints[idx] = newPoint;
        if (!byTemp) {
            this.getControlPoints(true)[idx] = Object.assign({}, newPoint);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Rotates control points specified by id of the spline around a given
     * center point.
     *
     * @param controlPointIds {Array} - ids of control points to rotate
     * @param angle {Number} - angle of rotation
     * @param isDeg {Boolean} - whether given angle is in degrees or radians
     * @param center {Object} - point to rotate around
     * @param byTemp {Boolean} - whether to update temporary or non-temporary
     * coordinates of the control points
     */
    rotateControlPoints(controlPointIds, angle, isDeg, center, byTemp = false) {
        const radian = isDeg ? AngleCalculation.degreeToRadian(angle) : angle;
        const sin = Math.sin(radian);
        const cos = Math.cos(radian);
        controlPointIds.forEach(cpId => {
            const controlPoint = this.getControlPoint(cpId, byTemp);
            const rotaPoint = PointCalculation.rotatePointAroundAnotherSinCosKnown(controlPoint,
                center,
                sin,
                cos
            );
            this.setControlPoint(cpId, rotaPoint, byTemp);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets a control point (by index) to a certain value.
     *
     * @param idx {Number} - index of control point in internal control point
     * Array
     * @param newPoint {Object} - new control point (coordinates and radius)
     * @param byTemp {Boolean} - whether to set only temporary or also non-
     * temporary coordinates of this control point
     */
    setControlPoint(idx, newPoint, byTemp = false) {
        const cps = [];
        cps.push(this.getControlPoints(byTemp)[idx]);
        if (!byTemp) {
            cps.push(this.getControlPoints(true)[idx]);
        }
        cps.forEach(cp => {
            cp.x = newPoint.x || cp.x;
            cp.y = newPoint.y || cp.y;
            cp.rad = newPoint.rad || cp.rad;
        })
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns the internal array of control points.
     *
     * @param byTemp {Boolean} - whether to return temporary or non-temporary
     * coordinates of the control points
     * @returns {Array} - control points of this spline
     */
    getControlPoints(byTemp = false) {
        return byTemp ? this.tempControlPoints : this.controlPoints;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns a single control point based on a given index position.
     *
     * @param idx {Number} - index position of the control point
     * @param byTemp {Boolean} - whether to return the point's temporary or
     * non-temporary coordinates
     * @returns {Object} - the control point
     */
    getControlPoint(idx, byTemp = false) {
        return this.getControlPoints(byTemp)[idx];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns the index positions of control points of this spline.
     *
     * @returns {Set} - the ids of control points
     */
    getControlPointIds() {
        return new Set(Object.keys(this.controlPoints));
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns all coordinates on the curve of the spline.
     *
     * @param byTemp {Boolean} - whether to return temporary or non-temporary
     * coordinates
     * @returns {Array} - curve coordinates of this spline
     */
    getCurveCoords(byTemp = false) {
        return byTemp ? this.tempCurveCoords : this.curveCoords;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns whether the given control point defines the start or end
     * of the currently enabled control points of this spline.
     *
     * @param controlPointId {Number} - id of the control point
     * @returns {Number} - 0: neither, 1: at start, 2: at end, 3: both
     */
    determineCPEnd(controlPointId) {
        let first = undefined;
        let last = undefined;
        this.controlPoints.forEach((cp, idx) => {
            if (cp.enabled) {
                if (first === undefined) {
                    first = idx;
                }
                last = idx;
            }
        });

        let ret = 0;
        if (first === controlPointId) {
            ret += 1;
        }
        if (last === controlPointId) {
            ret += 2;
        }
        return ret;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Create a deep copy of this Spline object.
     *
     * @returns {Spline} - cloned Spline object
     */

    clone() {
        return new Spline(this.structureLink, this.controlPoints);
    }
}
