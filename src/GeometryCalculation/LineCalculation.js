/**
 * Class (for namespace purposes) containing static helper functions for
 * geometrically motivated calculations with respect to lines.
 */
class LineCalculation {
    /**
     * Based on two points (defined by x and y coordinates), returns the
     * linear function that goes through these two points in form of a Line
     * object.
     *
     * @param AX {Number} - x coordinate of first point
     * @param AY {Number} - y coordinate of first point
     * @param BX {Number} - x coordinate of second point
     * @param BY {Number} - y coordinate of second point
     * @param checkVertical {Boolean} - if true a VerticalLine object is returned if x distance is
     * approx. 0
     * @returns {Line|VerticalLine} - Line object defining the linear function
     * through points A and B
     */
    static createLinearFunctionByTwoPoints({x: AX, y: AY}, {x: BX, y: BY}, checkVertical = true) {
        const xDist = BX - AX;
        const yDist = BY - AY;
        if (checkVertical && Helpers.isAlmostEqual(xDist, 0)) {
            return new VerticalLine(AX);
        }
        const slope = yDist / xDist;
        const b = AY - slope * AX;
        return new Line(slope, b);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates line parallel to a given line. This new line can be shorter or
     * larger than the first line, depending on provided angle which defines
     * the angle in which new line end points should lie in relation to
     * original end points.
     *
     * @param fromCoords {Object} - first line end point
     * @param toCoords {Object} - second line end point
     * @param normal {Object} - normal to place second line
     * @param offset {Number} - distance between the two lines
     * @param angle {Number} - angle to place new endpoints
     * @returns {Object} - contains new end points and a secondMakesSense
     * field to annotate if new line is valid
     */
    static createInnerLine(fromCoords, toCoords, normal, offset, angle) {
        const distVec = {
            x: normal.x * offset, y: normal.y * offset
        };

        //move along dist vector to non-shortened line points
        const [movedFrom, movedTo] = VectorCalculation
            .findParallelLineByDistVec(fromCoords, toCoords, distVec);
        const movedLineF = this.createLinearFunctionByTwoPoints(movedFrom, movedTo);

        const rotaAngle = angle;
        let invertedAngle = 360 - rotaAngle;

        //get hit with moved line in specified angle
        const getHit = (point, origin, angle) => {
            const rotaPoint = PointCalculation.rotatePointAroundAnother(point,
                origin,
                angle,
                false
            );
            const hitF = LineCalculation.createLinearFunctionByTwoPoints(rotaPoint, origin);
            return this.findIntersectionTwoLines(movedLineF, hitF);
        };

        //make sure correct angles are applied (and line actually is shortened)
        let secondTo = getHit(fromCoords, toCoords, rotaAngle);
        if (!this.checkPointOnLineSegment(movedFrom, movedTo, secondTo)) {
            secondTo = getHit(fromCoords, toCoords, invertedAngle);
            invertedAngle = rotaAngle;
        }
        const secondFrom = getHit(toCoords, fromCoords, invertedAngle);

        //check if inner line is sane
        const fromToVec = VectorCalculation.vectorizeLine(fromCoords, toCoords);
        const secVec = VectorCalculation.vectorizeLine(secondFrom, secondTo);
        const fromDist = VectorCalculation.getDist2d(fromCoords, toCoords);
        const secDist = VectorCalculation.getDist2d(secondFrom, secondTo);

        return {
            points: [secondFrom, secondTo],
            secondMakesSense: fromDist > secDist &&
                VectorCalculation.checkTwoVectorsPointSameDirection(fromToVec, secVec)
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Calculates the necessary value for the stroke-dashoffset for given
     * stroke-dasharray s.t. the drawn start and end of the line both have the
     * same offset to the actual start coordinates of the line.
     *
     * @param lineLen {Number} - length of the line
     * @param dash {Number} - length of drawn units of the line
     * @param gap {Number} - length of gaps between drawn units of the line
     * @returns {Number} - required stroke-dashoffset
     */
    static calcDashOffset(lineLen, dash, gap) {
        const fullFits = Math.floor(lineLen / (dash + gap));
        let maxOff = (lineLen - dash * fullFits - gap * (fullFits - 1)) / 2;
        if (maxOff > dash) maxOff -= dash;
        return -maxOff;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds the point on which two lines (defined by Line objects) intersect.
     *
     * @param line1 {Line|VerticalLine} - first line
     * @param line2 {Line|VerticalLine} - second line
     * @returns {Object} - point where lines intersect
     */
    static findIntersectionTwoLines(line1, line2) {
        //minify drops constructor name, so check for unique parameters of Line
        if (!line1.hasOwnProperty('m')) {
            return this.findIntersectionLineVerticalLine(line1, line2);
        } else if (!line2.hasOwnProperty('m')) {
            return this.findIntersectionLineVerticalLine(line2, line1);
        }
        const {m: m1, b: b1, function: f} = line1;
        const {m: m2, b: b2} = line2;
        if (m1 === m2) {
            return null;
        }
        const x = (b2 - b1) / (m1 - m2);
        return {
            x: x, y: f(x)
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Special case of finding intersection of two lines where one is
     * completely vertical (all points have same y-coordinate).
     *
     * @param vertLine {VerticalLine}- the vertical line
     * @param otherLine {Line|VerticalLine} - second line
     * @returns {Object|null} - point where lines intersect or null if no such
     * point exists (e.g., both lines are vertical)
     */
    static findIntersectionLineVerticalLine(vertLine, otherLine) {
        if (otherLine.constructor.name === 'VerticalLine') {
            return null;
        }
        return {
            x: vertLine.x, y: otherLine.function(vertLine.x)
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Part of collision detection. Finds out whether point hits line segment.
     *
     * @param seg_1 {Object} - first point defining line segment
     * @param seg_2 {Object} - second point defining line segment
     * @param point {Object} - point to check
     * @returns {Boolean} - whether hit is found or not
     */
    static checkPointOnLineSegment(seg_1, seg_2, point) {
        const dxP = point.x - seg_1.x;
        const dyP = point.y - seg_1.y;
        const dx_1 = seg_2.x - seg_1.x;
        const dy_1 = seg_2.y - seg_1.y;

        //points are on same line if cross product equals 0 (care with precision)
        const cross = dxP * dy_1 - dyP * dx_1;
        if (!Helpers.isAlmostEqual(cross, 0)) {
            return false;
        }

        //check if point between the segment points
        if (Math.abs(dx_1) >= Math.abs(dy_1)) { //if line is 'more horizontal'
            return dx_1 > 0 ? seg_1.x <= point.x && point.x <= seg_2.x :
                seg_2.x <= point.x && point.x <= seg_1.x;
        } else {
            return dy_1 > 0 ? seg_1.y <= point.y && point.y <= seg_2.y :
                seg_2.y <= point.y && point.y <= seg_1.y;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Part of collision detection. Finds out whether two given line segments
     * hit each other.
     *
     * @param p0 {Object} - first point of first line segment
     * @param p1 {Object} - second point of first line segment
     * @param p2 {Object} - first point of second line segment
     * @param p3 {Object} - second point of second line segment
     * @param intersection {Object} - optional parameter into which to write the
     * intersection point
     * @returns {Boolean} - whether hit is found or not
     */
    static checkTwoLineSegmentsInteract(p0, p1, p2, p3, intersection) {
        const s1 = {
            x: p1.x - p0.x, y: p1.y - p0.y
        };
        const s2 = {
            x: p3.x - p2.x, y: p3.y - p2.y
        };
        const s = (-s1.y * (p0.x - p2.x) + s1.x * (p0.y - p2.y)) / (-s2.x * s1.y + s1.x * s2.y);
        const t = (s2.x * (p0.y - p2.y) - s2.y * (p0.x - p2.x)) / (-s2.x * s1.y + s1.x * s2.y);
        if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
            if (intersection) {
                intersection.x = p0.x + (t * s1.x);
                intersection.y = p0.y + (t * s1.y);
            }
            return true;
        }
        return false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Part of collision detection. Finds out whether a line segment (given by
     * its endpoints) intersects a circle.
     *
     * @param a {Object} - first line point
     * @param b {Object} - second line point
     * @param c {Object} - circle (by coordinates and radius)
     * @returns {Boolean} - whether hit is found or not
     */
    static checkIntersectionLineCircle(a, b, c) { //a, b -> rect, c -> circle
        //check if (inf) line and circle intersect
        const d = VectorCalculation.getDist2d(a, b);
        const alpha = (1 / d ** 2) * ((b.x - a.x) * (c.x - a.x) + (b.y - a.y) * (c.y - a.y));
        const m = { //nearest point to circle
            x: a.x + (b.x - a.x) * alpha, y: a.y + (b.y - a.y) * alpha
        };
        const mc = VectorCalculation.getDist2d(m, c);
        if (mc > c.rad) {
            return false;
        }

        //check if circle in segment
        const ma = VectorCalculation.getDist2d(m, a);
        const mb = VectorCalculation.getDist2d(m, b);
        if (ma <= d && mb <= d) {
            return true;
        }
        const ac = VectorCalculation.getDist2d(a, c);
        const bc = VectorCalculation.getDist2d(b, c);
        return (ac <= c.rad || bc <= c.rad);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets the intersections of a circle and a line where line is defined by
     * slope and y intersection.
     *
     * @param rad {Number} - radius of circle
     * @param xC {Number} - x coordinate of circle mid
     * @param yC {Number} - y coordinate of circle mid
     * @param slope {Number} - slope of line
     * @param y_0 {Number} - y interception of line
     * @returns {Array} - x and y coordinates as objects ({x:.., y:..}) of intersections
     */
    static findCircleLineIntersections(rad, xC, yC, slope, y_0) {
        const xCoords = this.findCircleLineIntersectionsXCoord(rad, xC, yC, slope, y_0);
        const result = [];
        for (const xCoord of xCoords) {
            result.push({
                x: xCoord, y: slope * xCoord + y_0
            })
        }
        return result;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets the x coordinates of intersections of a circle and a line.
     *
     * @param rad {Number} - radius of circle
     * @param xC {Number} - x coordinate of circle mid
     * @param yC {Number} - y coordinate of circle mid
     * @param slope {Number} - slope of line
     * @param y_0 {Number} - y interception of line
     * @returns {Array} - x coordinates of intersections
     */
    static findCircleLineIntersectionsXCoord(rad, xC, yC, slope, y_0) {
        const a = 1 + slope * slope;
        const b = -xC * 2 + (slope * (y_0 - yC)) * 2;
        const c = xC * xC + (y_0 - yC) * (y_0 - yC) - rad * rad;
        const d = b * b - 4 * a * c;

        if (d >= 0) {
            const intersections = [
                (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a),
                (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a)
            ];
            if (d === 0) {
                //only 1 intersection
                return [intersections[0]];
            }
            return intersections;
        }
        //no intersection
        return [];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets the intersections of a circle and a line where line is defined as
     * point and angle.
     *
     * @param rad {Number} - radius of circle
     * @param xC {Number} - x coordinate of circle mid
     * @param yC {Number} - y coordinate of circle mid
     * @param xL {Number} - x coordinate of point one line
     * @param yL {Number} - y coordinate of point one line
     * @param alpha {Number} - angle of line to x axis
     * @returns {Array} - x and y coordinates as objects ({x:.., y:..}) of intersections
     */
    static findCircleLineIntersectionsFromPointAngle(rad, xC, yC, xL, yL, alpha) {
        const {slope, y0} = this.getLineFromPointAngle(xL, yL, alpha);
        return this.findCircleLineIntersections(rad, xC, yC, slope, y0);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds out on which side of a line a given point lies. Order of line
     * points is important, as this defines the direction of the line. Result
     * to be interpreted as follows: -1 -> p is on left side of line, 1 -> p
     * is on right side of line.
     *
     * @param l1 {Object} - start point of line
     * @param l2 {Object} - end point of line
     * @param p {Object} - point to determine side of line for
     * @returns {Number} - side of line
     */
    static getSideOfLine(l1, l2, p) {
        return Math.sign((l2.x - l1.x) * (p.y - l1.y) - (l2.y - l1.y) * (p.x - l1.x));
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds out whether a point lies to the left of a defined line.
     *
     * @param p0 {Object} - first point on line
     * @param p1 {Object} - second point on line
     * @param p2 {Object} - point to find out for if it lies on the left or right of
     * line
     * @returns {Boolean} - whether p2 is left (or right, if false) of line
     */
    static isLeft(p0, p1, p2) {
        return ((p1.x - p0.x) * (p2.y - p0.y) - (p2.x - p0.x) * (p1.y - p0.y)) < 0;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Mirrors given points on a given line.
     *
     * @param points {Array} - points to mirror
     * @param first {Object} - first point to define line by
     * @param second {Object} - second point to define line by
     * @returns {Array} - new coordinates for points
     */
    static mirrorPointsOnLine(points, first, second) {
        //find out how to get offsets (some edge cases to consider)
        let getOffsets;
        if (first.x === second.x) { //edge cases, easy to find offsets
            getOffsets = (x) => {
                return {
                    xOffset: first.x - x, yOffset: 0
                };
            }
        } else if (first.y === second.y) {
            getOffsets = (x, y) => {
                return {
                    xOffset: 0, yOffset: first.y - y
                };
            }
        } else { //have to project to line to find offsets
            let lineVec, yShift = 0;
            if (first.x === 0 && first.y === 0) {
                lineVec = second;
            } else if (second.x === 0 && second.y === 0) {
                lineVec = first;
            } else {
                //get function and b of Line object
                const {function: lineFn, b} = this.createLinearFunctionByTwoPoints(
                    first,
                    second,
                    false
                );
                lineVec = { //guarantee to not be in origin
                    x: 1, y: lineFn(1) - b
                };
                yShift = b;
            }
            getOffsets = (x, y) => {
                const {x: projX, y: projY} = VectorCalculation.calcProjection(lineVec, {
                    x: x, y: y - yShift
                });
                return {
                    xOffset: projX - x, yOffset: projY + yShift - y
                };
            }
        }

        //no matter how offsets are gained, get new positions now
        return points.map(coords => {
            const {xOffset, yOffset} = getOffsets(coords.x, coords.y);
            return {
                x: coords.x + 2 * xOffset, y: coords.y + 2 * yOffset
            }
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds midpoints of line after shortening it a given amount in either or
     * both the direction of its first or second point.
     *
     * @param fromCoords {Object} - coordinates of first line midpoint
     * @param toCoords {Object} - coordinates of second line midpoint
     * @param fromDist {Number} - distance to shorten line from first point on
     * @param toDist {Number} - distance to shorten line from second point on
     * @param directionCheck {Boolean} - if true, return null if shortening
     * leads to a invalid line in the opposite direction.
     * @returns {Array|null} - new midpoints or null if shortening fails/leads
     * to invalid line and directionCheck is set
     */
    static shortenLine(fromCoords, toCoords, fromDist, toDist, directionCheck = false) {
        const lineMov = PointCalculation.createMovementBetweenTwoPoints(fromCoords, toCoords);
        const midFrom = fromDist > 0 ? lineMov.forward(fromDist) : fromCoords;
        const midTo = toDist > 0 ? lineMov.backward(toDist, toCoords) : toCoords;

        //check if midpoints are sane
        if (directionCheck) {
            const fromToVec = VectorCalculation.vectorizeLine(fromCoords, toCoords);
            const midVec = VectorCalculation.vectorizeLine(midFrom, midTo);
            if (!VectorCalculation.checkTwoVectorsPointSameDirection(fromToVec, midVec)) {
                return null;
            }
        }

        return [midFrom, midTo];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets the slope and y intersection of a line defined by angle and point.
     *
     * @param x {Number} - x coordinate
     * @param y {Number} - y coordinate
     * @param alpha {Number} - angle (rad)
     * @returns {Object} - slope and y intersection
     */
    static getLineFromPointAngle(x, y, alpha) {
        return {
            slope: Math.tan(alpha), y0: y - Math.tan(alpha) * x
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds normals of a line, than normalize those.
     *
     * @param p1 {Object} - first point of the line
     * @param p2 {Object} - second point of the line
     * @returns {Array} - the two unit normals (normalized normals) of the line
     */
    static findUnitNormals(p1, p2) {
        const normals = this.findNormals(p1, p2);
        return normals.map(normal => {
            return VectorCalculation.normalize(normal);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds normals for a given line.
     *
     * @param p1 {Object} - first point of the line
     * @param p2 {Object} - second point of the line
     * @returns {Array} - the two normals of the line
     */
    static findNormals(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return [
            {
                x: -dy, y: dx
            }, {
                x: dy, y: -dx
            }
        ];
    }
}