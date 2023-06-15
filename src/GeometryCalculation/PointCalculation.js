/**
 * Class (for namespace purposes) containing static helper functions for
 * geometrically motivated calculations with respect to points.
 */
class PointCalculation {
    /**
     * Rotates a single point around an origin point by some given angle.
     *
     * @param point {Object}- the point to rotate
     * @param origin {Object} - the point to rotate around
     * @param angle {Number} - angle by which to rotate (clockwise)
     * @param isRadian {Boolean} - whether angle is given in radians or
     * degrees (will always convert to radians)
     * @returns {Object} - rotated point
     */
    static rotatePointAroundAnother(point, origin, angle, isRadian) {
        const radian = isRadian ? angle : AngleCalculation.degreeToRadian(angle);
        const sin = Math.sin(radian);
        const cos = Math.cos(radian);
        return this.rotatePointAroundAnotherSinCosKnown(point, origin, sin, cos);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets the point in an array with minimum distance to a given point.
     *
     * @param givenPoint {Object} - x- and y-coordinates of point
     * @param points {Array} - coordinates of points to find closest from
     * @returns {Object} - id of the closest point in the array to the
     * given point and the corresponding point (keys: "id" and "point").
     * If given array is empty returns undefined for both
     */
    static getClosestPoint(givenPoint, points) {
        const closest = {
            id: undefined, dist: Infinity, point: undefined
        };
        points.forEach((point, idx) => {
            const dist = VectorCalculation.getDist2d(givenPoint, point);
            if (dist < closest.dist) {
                closest.id = idx;
                closest.dist = dist;
                closest.point = point;
            }
        });
        return {
            id: closest.id, point: closest.point
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Rotates given points around a given rotation point.
     *
     * @param points {Array} - points to rotate
     * @param angle {Number} - angle by which to rotate (clockwise)
     * @param rotationPoint {Object} - point to rotate around
     * @param isDeg {Boolean} - whether angle is given in degree or radians
     * (will always convert to radians)
     * @returns {Array} - new coordinates for points
     */
    static rotatePointsAroundMid(points, angle, rotationPoint, isDeg = false) {
        const radian = isDeg ? AngleCalculation.degreeToRadian(angle) : angle;
        const sin = Math.sin(radian);
        const cos = Math.cos(radian);
        return points.map(point => {
            return (this.rotatePointAroundAnotherSinCosKnown(point, rotationPoint, sin, cos));
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Rotates a single point around an origin point by some given angle.
     * Optimize performance if many points are to be rotated with the same
     * angle, so sin and cos do not have to be constantly computed.
     *
     * @param point {Object}- the point to rotate
     * @param origin {Object} - the point to rotate around
     * @param sin {Number} - sine based on radian of rotation angle
     * @param cos {Number} - cosine based on radian of rotation angle
     */
    static rotatePointAroundAnotherSinCosKnown(point, origin, sin, cos) {
        const rotPoint = Object.assign({}, point);
        rotPoint.x -= origin.x;
        rotPoint.y -= origin.y;

        const newX = rotPoint.x * cos - rotPoint.y * sin;
        const newY = rotPoint.y * cos + rotPoint.x * sin;

        rotPoint.x = newX + origin.x;
        rotPoint.y = newY + origin.y;
        return rotPoint;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Part of collision detection, checks whether point hits circle.
     *
     * @param point {Object} - point to check
     * @param center {Object} - center point of circle
     * @param rad {Number} - radius of circle
     * @returns {Boolean} - whether hit is found or not
     */
    static checkPointInCircle(point, center, rad) {
        const d = Math.sqrt((point.x - center.x) ** 2 + (point.y - center.y) ** 2);
        return d ** 2 < rad ** 2;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets the relative position of one point to another.
     *
     * @param fixedPoint {Object} - x- and y-coordinates of fixed point
     * @param relativePoint {Object} - x- and y-coordinates of relative point.
     * This returned position is the relative position of this point to the
     * other (so if result is below that means this point is below the first
     * one)
     * @returns {RelativePosition} - relative position of the points
     */
    static getRelativePositionPointPoint(fixedPoint, relativePoint) {
        let position = RelativePosition.same;
        if (fixedPoint.x < relativePoint.x) {
            position |= RelativePosition.right;
        } else if (fixedPoint.x > relativePoint.x) {
            position |= RelativePosition.left;
        }
        if (fixedPoint.y < relativePoint.y) {
            position |= RelativePosition.above;
        } else if (fixedPoint.y > relativePoint.y) {
            position |= RelativePosition.below;
        }
        return position;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds the side of a given point offering the most free space based on the
     * coordinates of relevant neighboring points. This is done by extending
     * infinite lines to each side and then finding the side on which these
     * lines have the smallest angle to any line spanned between the point and
     * a neighboring point.
     *
     * @param center {Object} - x- and y-coordinates of the point to check
     * @param neighbors {Array} - x- and y-coordinates of neighboring points
     * @param permitUpDown {Boolean} - whether direction can be 'up' or
     * 'down' (sometimes this should be suppressed for cleaner drawing)
     * @returns {String} - the side with most free space -> 'left', 'right',
     * 'up' or 'down'
     */
    static findSideMostSpace(center, neighbors, permitUpDown = true) {
        if (neighbors.length === 0) {
            return 'right';
        }

        let maxFreeAngle = 0; //find largest smallest angle
        const testDir = (coord, dir) => {
            const dirPoint = Object.assign({}, center);
            if (dir === 1) {
                dirPoint[coord] += 10;
            } else {
                dirPoint[coord] -= 10;
            }
            //calc angles between line defined by dirPoint and line defined by
            //all possible neighbors, then minimize over these vectors
            let possibleAngle = 360;

            neighbors.forEach(point => {
                const angleToNb = AngleCalculation.radianToDegree(VectorCalculation.findAngleBetweenLines(center,
                    dirPoint,
                    center,
                    point
                ));
                if (angleToNb < possibleAngle) {
                    possibleAngle = angleToNb;
                }
            });
            //check if this is the globally smallest angle
            if (possibleAngle > maxFreeAngle) {
                maxFreeAngle = possibleAngle;
                return true;
            }
            return false;
        };

        //can shortcut if only 'left' and 'right' allowed
        if (!permitUpDown) {
            testDir('x', 1, 'right');
            if (Math.round(maxFreeAngle) >= 60) {
                return 'right';
            }
            return 'left';
        }
        //if all directions allowed: need to perform full check
        let bestDirection;
        testDir('x', 1, 'right');
        bestDirection = 'right';
        if (testDir('x', -1, 'left')) {
            bestDirection = 'left';
        }
        if (testDir('y', 1, 'down')) {
            bestDirection = 'down';
        }
        if (testDir('y', -1, 'up')) {
            bestDirection = 'up';
        }
        return bestDirection;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets a point at a position relative to a given point that is a defined
     * distance away. Note that by positions with more than one attribute
     * (e.g aboveLeft) this will return a point with 45 degrees to either
     * axis.
     *
     * @param givenPoint {Object} - x- and y-coordinates of given point
     * @param position {RelativePosition} - position to get the point for
     * @param distance {Number} - distance of returned point to givenPoint
     * @returns {Object} - x- and y-coordinates of the new point
     */
    static getPointByRelativePosition(givenPoint, position, distance) {
        const vec = {x: 0, y: 0};
        if (position & RelativePosition.above) {
            vec.y = 1
        }
        if (position & RelativePosition.below) {
            vec.y = -1
        }
        if (position & RelativePosition.right) {
            vec.x = 1
        }
        if (position & RelativePosition.left) {
            vec.x = -1
        }
        return VectorCalculation.vectorAdd(givenPoint,
            VectorCalculation.scalarMult(VectorCalculation.normalize(vec), distance)
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves a single point a specified number of units (can be negative)
     * towards another point.
     *
     * @param point {Object} - the point to move
     * @param to {Object} - the point in which direction to move
     * @param units {Number} - how many units to move
     * @returns {Object} - x- and y-coordinates of moved point
     */
    static movePointTowardsAnother(point, to, units) {
        const vec = VectorCalculation.scalarMult(VectorCalculation.normalize(VectorCalculation.vectorizeLine(point,
            to
        )), units);
        return {
            x: vec.x + point.x, y: vec.y + point.y
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Vector based movement along the line between two points. Move forward =
     * move toward (x1, y1). Move backward = move toward (x0, y0). Based on
     * current point (starts at (x0, y0), passing start point overrides this).
     *
     * @param x0 {Number} - x coordinate of current point
     * @param y0 {Number} - y coordinate of current point
     * @param x1 {Number} - x coordinate of other point
     * @param y1 {Number} - y coordinate of other point
     * @returns {Object} - container of forward() and backward() functions
     */
    static createMovementBetweenTwoPoints({x: x0, y: y0}, {x: x1, y: y1}) {
        const lineVec = VectorCalculation.normalize({
            x: x1 - x0, y: y1 - y0
        });
        let curPoint = {
            x: x0, y: y0
        };
        const setStartPoint = (startPoint) => {
            if (startPoint) {
                curPoint = {
                    x: startPoint.x, y: startPoint.y
                };
            }
        };
        const moveForward = (distance, startPoint) => {
            if (distance === undefined) {
                distance = 1;
            }
            setStartPoint(startPoint);
            curPoint.x += distance * lineVec.x;
            curPoint.y += distance * lineVec.y;
            return Object.assign({}, curPoint);
        };
        const moveBackward = (distance, startPoint) => {
            if (distance === undefined) {
                distance = 1;
            }
            setStartPoint(startPoint);
            curPoint.x -= distance * lineVec.x;
            curPoint.y -= distance * lineVec.y;
            return Object.assign({}, curPoint);
        };
        return {
            forward: moveForward, backward: moveBackward
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Andrew's algorithm to find the convex hull of a number of given points.
     *
     * @param points {Array} - the points to create a convex hull around
     * @returns {Array} - points on the convex hull
     */
    static findConvexHull(points) {
        const len = points.length;
        if (len < 3) return points;
        const cross = (a, b, o) => {
            return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
        };
        //sort by x-, then y-coordinate
        points.sort((a, b) => {
            return a.x === b.x ? a.y - b.y : a.x - b.x;
        });
        //build lower and upper parts of convex hull
        const lower = [];
        for (let i = 0; i < len; ++i) {
            while (lower.length >= 2 &&
            cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
                lower.pop();
            }
            lower.push(points[i]);
        }
        const upper = [];
        for (let i = len - 1; i >= 0; --i) {
            while (upper.length >= 2 &&
            cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
                upper.pop();
            }
            upper.push(points[i]);
        }

        upper.pop();
        lower.pop();
        return lower.concat(upper);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets distance between two points by given x- and y-distances.
     *
     * @param xDist {Number} - distance between points in x-direction
     * @param yDist {Number} - distance between points in y-direction
     * @returns {Number} - actual distance between points
     */
    static getDist2dByDists(xDist, yDist) {
        return Math.sqrt(xDist ** 2 + yDist ** 2);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds the point in the middle of two given points.
     *
     * @param p1 {Object} - first point
     * @param p2 {Object} - second point
     * @returns {Object} - the midpoint
     */
    static findEdgeMidpoint(p1, p2) {
        return {
            x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds the geometric center of given 2D-points
     *
     * @param points {Array} - array containing x and y coordinates as
     * objects.
     * @returns {Object} - center coordinates (x and y)
     */
    static findGeometricCenter(points) {
        const pointCount = points.length;
        if (pointCount === 0) return null;

        const center = {
            x: 0, y: 0
        };

        for (const point of points) {
            center.x += point.x;
            center.y += point.y;
        }

        center.x = center.x / pointCount;
        center.y = center.y / pointCount;

        return center;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Translates global (cursor) position to a local position inside some DOM
     * element (SVG draw area, canvas...)
     *
     * @param x {Number} - x-coordinate of current position (clientX)
     * @param y {Number} - y-coordinate of current position (clientY)
     * @param xMin {Number} - start of element, x-coordinate
     * @param yMin {Number} - start of element, y-coordinate
     * @returns {Object} - coordinates of position in element's coordinate
     * system
     */
    static getCoordinatesInElement({x, y}, {x: xMin, y: yMin}) {
        return {
            x: x - xMin, y: y - yMin
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks if two coordinate objects do not differ by more than a given
     * tolerance (checking both x- and y-parameter).
     *
     * @param coord1 {Object} - first coordinates to compare
     * @param coord2 {Object} - second coordinates to compare
     * @param tolerance {Number} - allowed tolerance values may differ by
     * @returns {Boolean} - whether the two values are within the specified
     * tolerance
     */
    static coordsAlmostEqual(coord1, coord2, tolerance = 0.000001) {
        return (Helpers.isAlmostEqual(coord1.x, coord2.x, tolerance) &&
            Helpers.isAlmostEqual(coord1.y, coord2.y, tolerance));
    }
}