/**
 * Class (for namespace purposes) containing static helper functions for
 * geometrically motivated calculations with respect to polygons.
 */
class PolygonCalculation {
    /**
     * Creates the vertices of a rectangle based on its starts and ends (x and
     * y). Primary use is to convert a bounding box (e.g. through getBBox())
     * into a form that can be used for collision / drawing.
     *
     * @param startX {Number} - x-coordinate where rectangle starts
     * @param endX {Number} - x-coordinate where rectangle ends
     * @param startY {Number} - y-coordinate where rectangle starts
     * @param endY {Number} - y-coordinate where rectangle ends
     * @returns {Array} - the four vertices of the rectangle
     */
    static createRectByBoundaries(startX, endX, startY, endY) {
        const rectPoints = [];
        rectPoints.push({
            x: startX, y: startY
        });
        rectPoints.push({
            x: endX, y: startY
        });
        rectPoints.push({
            x: endX, y: endY
        });
        rectPoints.push({
            x: startX, y: endY
        });
        return rectPoints;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Part of collision detection. Finds out whether point hits a path of
     * edges, defined by the points along this path.
     *
     * @param pathPoints {Array} - points along a path of edges
     * @param pathWidth {Number} - width of edges along the path
     * @param point {Object} - point to check
     * @returns {Boolean} - whether hit is found or not
     */
    static checkCollisionPointPath(pathPoints, pathWidth, point) {
        const len = pathPoints.length;
        if (len <= 1) return false;
        for (let i = 0; i < len; ++i) {
            if (i === len - 1) return false;
            const first = pathPoints[i];
            const second = pathPoints[i + 1];
            const normals = LineCalculation.findUnitNormals(first, second);
            const rect = this.createRectFromLine(first, second, normals, pathWidth);
            if (this.checkCollisionPolygonPoint(point, rect)) return true;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Part of collision detection. Finds out whether a point lies within a
     * polygon (defined by its edges).
     *
     * @param point {Object} - point to check
     * @param polyEdges {Array} - edges of the polygon
     * @returns {Boolean} - whether hit is found or not
     */
    static checkCollisionPolygonPoint(point, polyEdges) {
        //check point inside polygon
        const windingNr = this.calcWindingNumber(point, polyEdges);
        return windingNr !== 0;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Part of collision detection. Finds out whether two polygons (defined by
     * their vertices) hit each other, either by collision of their edges or
     * when one polygon lies completely within the other.
     *
     * @param poly1Vertices {Array} - vertices of first polygon
     * @param poly2Vertices {Array} - vertices of second polygon
     * @returns {Boolean} - whether hit is found or not
     */
    static checkCollisionTwoPolygons(poly1Vertices, poly2Vertices) {
        const poly1Len = poly1Vertices.length;
        const poly2Len = poly2Vertices.length;
        //sanity check
        if (poly1Len === 0 || poly2Len === 0) {
            return false;
        }
        //check if either polygon is COMPLETELY WITHIN the other (enough to
        //just check one point)
        const vertexInFirst = poly1Vertices[0];
        const vertexInSecond = poly2Vertices[0];

        //check if one vertex from first polygon is in the other polygon
        let windingNrFirst = 0;
        if (poly2Len > 2) {
            windingNrFirst = this.calcWindingNumber(vertexInFirst, poly2Vertices);
        }
        //check if one vertex from second polygon is in the first polygon
        let windingNrSecond = 0;
        if (poly1Len > 2) {
            windingNrSecond = this.calcWindingNumber(vertexInSecond, poly1Vertices);
        }

        if (windingNrFirst !== 0 || windingNrSecond !== 0) {
            return true;
        }

        //check intersection of edges (if possible)
        if (poly1Len === 1 && poly2Len === 1) {
            return vertexInFirst.x === vertexInSecond.x && vertexInFirst.y === vertexInSecond.y;
        }

        if (this.polygonCollision(poly1Vertices,
            poly1Len,
            poly2Vertices,
            poly2Len,
            vertexInFirst,
            vertexInSecond
        )) {
            return true;
        }
        return false;
    }

    static polygonCollision(poly1Vertices,
        poly1Len,
        poly2Vertices,
        poly2Len,
        vertexInFirst,
        vertexInSecond
    ) {
        //function for next index
        const getNextIdx = (idx, arrLen) => {
            return (idx === arrLen - 1) ? 0 : idx + 1;
        };
        if (poly1Len === 1) { //poly2Len > 1
            for (let poly2FirstIdx = 0; poly2FirstIdx < poly2Len; ++poly2FirstIdx) {
                const poly2NextIdx = getNextIdx(poly2FirstIdx, poly2Len);
                const poly2First = poly2Vertices[poly2FirstIdx];
                const poly2Second = poly2Vertices[poly2NextIdx];
                if (LineCalculation.checkPointOnLineSegment(poly2First,
                    poly2Second,
                    vertexInFirst
                )) {
                    return true;
                }
            }
        } else if (poly2Len === 1) { //poly1Len > 1
            for (let poly1FirstIdx = 0; poly1FirstIdx < poly1Len; ++poly1FirstIdx) {
                const poly1NextIdx = getNextIdx(poly1FirstIdx, poly1Len);
                const poly1First = poly1Vertices[poly1FirstIdx];
                const poly1Second = poly1Vertices[poly1NextIdx];
                if (LineCalculation.checkPointOnLineSegment(poly1First,
                    poly1Second,
                    vertexInSecond
                )) {
                    return true;
                }
            }
        } else { //both length > 1
            for (let poly1FirstIdx = 0; poly1FirstIdx < poly1Len; ++poly1FirstIdx) {
                const poly1SecondIdx = getNextIdx(poly1FirstIdx, poly1Len);
                const poly1First = poly1Vertices[poly1FirstIdx];
                const poly1Second = poly1Vertices[poly1SecondIdx];

                for (let poly2FirstIdx = 0; poly2FirstIdx < poly2Len; ++poly2FirstIdx) {
                    const poly2SecondIdx = getNextIdx(poly2FirstIdx, poly2Len);
                    const poly2First = poly2Vertices[poly2FirstIdx];
                    const poly2Second = poly2Vertices[poly2SecondIdx];
                    if (LineCalculation.checkTwoLineSegmentsInteract(poly1First,
                        poly1Second,
                        poly2First,
                        poly2Second
                    )) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Part of collision detection. Finds out whether a line segment (given by
     * its endpoints) hits a rectangle (intersection or fully inside).
     *
     * @param l1 {Object} - first line point
     * @param l2 {Object} - second line point
     * @param rectPoints {Array} - coordinates of rectangle vertices
     */
    static checkIntersectionLineRectangle(l1, l2, rectPoints) {
        const len = rectPoints.length;
        for (let i = 0; i < len; ++i) {
            const r1 = rectPoints[i];
            const r2 = i === len - 1 ? rectPoints[0] : rectPoints[i + 1];
            if (LineCalculation.checkTwoLineSegmentsInteract(l1, l2, r1, r2)) {
                return true;
            }
        }
        return this.calcWindingNumber(l2, rectPoints) !== 0;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the vertices of a polygon based on a given line and the width of
     * such a line.
     *
     * @param from {Object} - first point defining the line
     * @param to {Object} - second point defining the line
     * @param normals {Array} - the two normals of the line
     * @param sideOffset {Number} - width of the line
     * @returns {Array} - the four vertices of the rectangle
     */
    static createRectFromLine(from, to, normals, sideOffset) {
        const firstNormal = normals[0];
        const secondNormal = normals[1];
        const firstSideX = firstNormal.x * sideOffset;
        const firstSideY = firstNormal.y * sideOffset;
        const secondSideX = secondNormal.x * sideOffset;
        const secondSideY = secondNormal.y * sideOffset;

        const p1 = {
            x: from.x + firstSideX, y: from.y + firstSideY
        };
        const p2 = {
            x: from.x + secondSideX, y: from.y + secondSideY
        };
        const p3 = {
            x: to.x + secondSideX, y: to.y + secondSideY
        };
        const p4 = {
            x: to.x + firstSideX, y: to.y + firstSideY
        };
        return [p1, p2, p3, p4];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Calculates bounding rectangle coordinates.
     *
     * @param height {Number} - rectangle height
     * @param width {Number} - rectangle width
     * @param coords {Number} - middle coordinate of rectangle
     * @returns {Object} - bounding rectangle coordinates
     */
    static boundingRectangle({height, width, coords}) {
        return {
            xMin: coords.x - width / 2,
            xMax: coords.x + width / 2,
            yMin: coords.y - height / 2,
            yMax: coords.y + height / 2
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets the edge of a rectangle by position.
     *
     * @param xMax {Number} - max x-coordinate of the rectangle
     * @param xMin {Number} - min x-coordinate of the rectangle
     * @param yMax {Number} - max y-coordinate of the rectangle
     * @param yMin {Number} - min y-coordinate of the rectangle
     * @param position {RelativePosition} - position of the edge. E.g.
     * above means top edge. Note that this should only hold one position
     * so aboveLeft will get invalid results.
     * @returns {Array} - x- and y-coordinates of the corner points defining
     * the edge or null if position is e.g. inside/same.
     */
    static getRectangleEdgeByPosition({xMax, xMin, yMax, yMin}, position) {
        switch (position) {
            case RelativePosition.below:
                return [
                    {
                        x: xMin, y: yMin
                    }, {
                        x: xMax, y: yMin
                    }
                ];
            case RelativePosition.above:
                return [
                    {
                        x: xMin, y: yMax
                    }, {
                        x: xMax, y: yMax
                    }
                ];
            case RelativePosition.left:
                return [
                    {
                        x: xMin, y: yMin
                    }, {
                        x: xMin, y: yMax
                    }
                ];
            case RelativePosition.right:
                return [
                    {
                        x: xMax, y: yMin
                    }, {
                        x: xMax, y: yMax
                    }
                ];
            default:
                return null;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets the corner of a rectangle by position.
     *
     * @param xMax {Number} - max x-coordinate of the rectangle
     * @param xMin {Number} - min x-coordinate of the rectangle
     * @param yMax {Number} - max y-coordinate of the rectangle
     * @param yMin {Number} - min y-coordinate of the rectangle
     * @param position {RelativePosition} - position of the corner. E.g.
     * aboveLeft means top left corner
     * @returns {Object} - x- and y-coordinates of the corner or null if
     * position is e.g. only above
     */
    static getRectangleCornerByPosition({xMax, xMin, yMax, yMin}, position) {
        const corner = {
            x: undefined, y: undefined
        };

        if (position & RelativePosition.below) {
            corner.y = yMin
        } else if (position & RelativePosition.above) {
            corner.y = yMax
        } else {
            return null;
        }

        if (position & RelativePosition.left) {
            corner.x = xMin
        } else if (position & RelativePosition.right) {
            corner.x = xMax
        } else {
            return null;
        }

        return corner;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Converts a axis aligned rectangle given by its mid, height and width
     * to maxes
     *
     * @param mid {Object} - x- and y-coordinates of the rectangle mid
     * @param height {Number} - height of the rectangle
     * @param width {Number} - width of the rectangle
     * @returns {Object} - maxes (xMin, xMax, yMin, yMax) of
     * the rectangle
     */
    static convertRectangleMidDimensionsToMaxes(mid, {height, width}) {
        return {
            xMin: mid.x - width / 2,
            xMax: mid.x + width / 2,
            yMin: mid.y - height / 2,
            yMax: mid.y + height / 2
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Part of collision detection. Finds out whether a polygon (defined by its
     * edges) and a circle interact in any way (either if an edge of the
     * polygon hits the circle, or when the circle lies completely within the
     * polygon.
     *
     * @param circle {Object} - circle (by coordinates and radius)
     * @param polyEdges {Array} - edges of the polygon
     * @returns {Boolean} - whether hit is found or not
     */
    static checkCollisionPolygonCircle(circle, polyEdges) {
        //check circle center inside polygon
        const windingNr = this.calcWindingNumber(circle, polyEdges);
        if (windingNr !== 0) {
            return true;
        }

        //check intersection of edges
        for (let firstIdx = 0, len = polyEdges.length; firstIdx < len; ++firstIdx) {
            const secondIdx = (firstIdx === polyEdges.length - 1) ? 0 : firstIdx + 1;
            const first = polyEdges[firstIdx];
            const second = polyEdges[secondIdx];
            if (LineCalculation.checkIntersectionLineCircle(first, second, circle)) {
                return true;
            }
        }
        return false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds out whether a point lies within a polygon (defined by its edges) by
     * calculating the point's Winding Number in respect to the polygon. If the
     * Winding Number is equal 0, the point is outside the polygon, otherwise,
     * inside it.
     *
     * @param point {Object} - point to calculate Winding Number for
     * @param polyEdges {Array} - edges of the polygon
     * @returns {Number} - winding number of the point in respect to the
     * polygon -> equals 0 if point lies outside of polygon
     */
    static calcWindingNumber(point, polyEdges) {
        let wn = 0;

        for (let firstIdx = 0, len = polyEdges.length; firstIdx < len; ++firstIdx) {
            const secondIdx = (firstIdx === polyEdges.length - 1) ? 0 : firstIdx + 1;
            const first = polyEdges[firstIdx];
            const second = polyEdges[secondIdx];

            if (second.y <= point.y) {
                if (first.y > point.y && !LineCalculation.isLeft(second, first, point)) {
                    wn++;
                }
            } else {
                if (first.y <= point.y && LineCalculation.isLeft(second, first, point)) {
                    wn--;
                }
            }
        }

        return wn;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets the closest point on the outer lines of a axis aligned rectangle
     * to a given point.
     *
     * @param givenPoint {Object} - x- and y-coordinates of given point
     * @param xMax {Number} - max x-coordinate of the rectangle
     * @param xMin {Number} - min x-coordinate of the rectangle
     * @param yMax {Number} - max y-coordinate of the rectangle
     * @param yMin {Number} - min y-coordinate of the rectangle
     * @returns {Object} - key "point" holds the calculated point, key "dist"
     * the distance to that point key "isInside" is true, if the point is
     * inside (on edge is outside) the rectangle and key "relativePosition"
     * with the relative position of the rectangle
     */
    static getClosestPointOnRectangle(givenPoint, {xMax, xMin, yMax, yMin}) {
        let position = RelativePosition.inside;
        if (givenPoint.y <= yMin) {
            position |= RelativePosition.below;
        } else if (givenPoint.y >= yMax) {
            position |= RelativePosition.above;
        }
        if (givenPoint.x <= xMin) {
            position |= RelativePosition.left;
        } else if (givenPoint.x >= xMax) {
            position |= RelativePosition.right;
        }

        if (position === RelativePosition.inside) {
            //given point is inside. Find closest edge
            let edgeCoord, isX;
            let dist = Infinity;
            [xMin, xMax, yMin, yMax].forEach((val, idx) => {
                const curIsX = idx < 2;
                const curDist = Math.abs(val - (curIsX ? givenPoint.x : givenPoint.y));
                if (curDist < dist) {
                    dist = curDist;
                    edgeCoord = val;
                    isX = curIsX;
                }
            });
            const point = isX ? {x: edgeCoord, y: givenPoint.y} : {x: givenPoint.x, y: edgeCoord};
            return {
                point: point, dist: dist, isInside: true, relativePosition: position
            }
        }

        const point = {};

        if (position & RelativePosition.below) {
            point.y = yMin;
        } else if (position & RelativePosition.above) {
            point.y = yMax;
        } else {
            point.y = givenPoint.y;
        }

        if (position & RelativePosition.left) {
            point.x = xMin;
        } else if (position & RelativePosition.right) {
            point.x = xMax;
        } else {
            point.x = givenPoint.x;
        }

        return {
            point: point,
            dist: VectorCalculation.getDist2d(point, givenPoint),
            isInside: false,
            relativePosition: position
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets the relative position of one point to a axis aligned rectangle.
     * The rectangle has to be defined by its maxes.
     *
     * @param givenPoint {Object} - x- and y-coordinates of given point
     * @param xMax {Number} - max x-coordinate of the rectangle
     * @param xMin {Number} - min x-coordinate of the rectangle
     * @param yMax {Number} - max y-coordinate of the rectangle
     * @param yMin {Number} - min y-coordinate of the rectangle
     * @param onEdgeIsInside {Boolean} - whether the point should be marked
     * as inside the rectangle if it is exactly on one edge
     * @returns {RelativePosition} - relative position of the point to the
     * rectangle
     */
    static getRelativePositionPointRectangle(givenPoint,
        {xMax, xMin, yMax, yMin},
        onEdgeIsInside = true
    ) {
        let position = RelativePosition.inside;

        if (onEdgeIsInside) {
            if (givenPoint.y < yMin) {
                position |= RelativePosition.below;
            } else if (givenPoint.y > yMax) {
                position |= RelativePosition.above;
            }
            if (givenPoint.x < xMin) {
                position |= RelativePosition.left;
            } else if (givenPoint.x > xMax) {
                position |= RelativePosition.right;
            }
        } else {
            if (givenPoint.y <= yMin) {
                position |= RelativePosition.below;
            } else if (givenPoint.y >= yMax) {
                position |= RelativePosition.above;
            }
            if (givenPoint.x <= xMin) {
                position |= RelativePosition.left;
            } else if (givenPoint.x >= xMax) {
                position |= RelativePosition.right;
            }
        }
        return position;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Rotates a axis aligned rectangle around a point. The rectangle stays
     * axis aligned in this process. Rotate the rectangle in such a way, that
     * 1. the midpoint is rotated by a given angle.
     * 2. the shortest distance from the rectangle edges to the given point
     *    remains the same.
     *
     * Further differentiate two cases: The point to rotate about should be
     * inside the final rectangle or not.
     *
     * @param rectangleMid {Object} - x- and y-coordinates of the mid of the
     * rectangle to rotated
     * @param rectangleMaxes {Object} - xMin, xMax, yMin and yMax value
     * of the rectangle
     * @param origin {Object} - x- and y-coordinates of the point to rotate
     * around
     * @param angle {Number} - angle by which to rotate (clockwise)
     * @param dist {Number} - distance of the rectangle to origin
     * @param isInside {Boolean} - whether origin should be inside of the
     * final rectangle
     * @param isRadian {Boolean} - whether angle is given in radians (true) or
     * degrees (false)
     * @returns {Object} - x- and y-coordinates of the rotated rectangle mid
     */
    static rotateRectangleAroundPoint(rectangleMid,
        rectangleMaxes,
        origin,
        angle,
        dist,
        isInside,
        isRadian = false
    ) {
        //The basic idea behind this algorithm is as follows.
        //
        //The algorithm can be split into two different preconditions. The
        //first one is if the point to rotate around should be outside of the
        //rectangle and the second one is if the point should be inside. This
        //is defined by param isInside.
        //
        //First let's have a look at the algorithm when isInside is false.
        //
        //First rotate the the mid of the rectangle by the given angle.
        //Then move that rotated point on the line defined by the rotated point
        //and origin (the point rotated around), so that the rectangle
        //has just one intersection with the circle defined by origin and
        //the defined distance (dist).
        //
        //To get the vector to move the rotated point by for this to happen
        //we need to look at two cases. One case is when the final intersection
        //point of the rectangle and the circle lies at one of the edge of the
        //rectangle and the other one is when the intersection is a corner of
        //the rectangle.
        //
        //First case (intersection on edge):
        //To detect this case we need to define the possible intersection
        //points which lie on the circle and are directly above, below,
        //left or right of the circle mid. Then with help of the relative
        //position of the rotated mid to the circle mid we can exclude
        //at least two of the possible intersection because if the relative
        //position is e.g. above-left, then it is impossible that the
        //intersection is below or right of the circle mid.
        //After that we define a line parallel to the line defined by the
        //circle mid and the rotated mid on which the possible intersection
        //lies on (for each of the two intersections separately).
        //Now if the parallel line through a possible intersection at relative
        //position "x" has a intersection with the edge of the rectangle that
        //has a relative position to the rectangle mid that is opposite to "x",
        //then this case can be applied and we have to move the rectangle mid
        //by the vector defined by the direction and distance of that possible
        //intersection to the edge intersection.
        //
        //Second case (intersection on corner):
        //If the first case is not applied than this has to. So no further
        //detection needed.
        //First get the corner of the rectangle which lies on the same relative
        //position of the rectangle mid as the circle mid has to the rectangle
        //mid, because if the circle mid is e.g. below-right of the rectangle
        //mid then the rectangle corner that will intersect with the circle at
        //final position is the bottom right corner (if first case is false).
        //Then find a parallel to the line defined by the rotated point and the
        //circle mid where the found corner lies on. Now find the intersection
        //with that parallel line and the circle that is closest to the rotated
        //point. Finally move the rectangle by the vector defined by the
        //direction and distance from the corner to that parallel-circle
        //intersection.
        //Note that there will always be a parallel-circle intersection
        //because if there would be none, then the first case would be true
        //and we would not even get to this point in the algorithm.
        //
        //
        //Now let's have a look at the the algorithm when isInside is true.
        //
        //The goal here is to position the final rectangle in a way, that the
        //distance from origin to the closest edge of the rectangle equals the
        //given dist parameter.
        //Here we have a simple approach where the rectangle just moves in a
        //rectangular shape around the origin while it rotates. Note that this
        //might not be the best solution from a user perspective but it is
        //sufficient enough because this case barely occurs. A better solution
        //would be to have the rectangle move in a ellipse shape around the
        //mid. So if you have the time feel free to make an upgrade here.
        //
        //Because movement occurs only in a rectangular shape the intersection
        //point of the final rectangle and the circle defined by origin and
        //dist is either directly below, above, right or left of origin.
        //And we can reduce that further down to two possible final
        //intersections. Those are the opposite of the relative position of
        //the rotated mid to the origin because the origin is inside the
        //rectangle.
        //To find this intersection points we can use the exact same algorithm
        //as for the first case of the first part of the algorithm
        //(isInside = false) only use other possible intersections.
        //This should always yield two possible final intersections of the
        //rectangle and the circle. For each one evaluate the distance of the
        //final rectangle mid to the origin and pick the one which is closest.

        const {xMax, xMin, yMax, yMin} = rectangleMaxes;
        const width = xMax - xMin;
        const height = yMax - yMin;
        //get rotated point that defines (together with origin) a line
        //on which new midpoint lies
        const rotatedMid = PointCalculation.rotatePointAroundAnother(rectangleMid,
            origin,
            angle,
            isRadian
        );
        if (width === 0 || height === 0) return rotatedMid;

        //those are just plain rotated and not the final
        const rotatedMaxes = this.convertRectangleMidDimensionsToMaxes(rotatedMid, {height, width});
        //get relative position to origin
        let positionRotatedMid = PointCalculation.getRelativePositionPointPoint(origin, rotatedMid);
        //special case 1
        if (positionRotatedMid === RelativePosition.same) {
            return rotatedMid;
        }

        //special case 2
        //It does not matter here if left or right / above or below because it
        //would get the same final results.
        if (positionRotatedMid === RelativePosition.above || positionRotatedMid ===
            RelativePosition.below) {
            positionRotatedMid |= RelativePosition.left
        } else if (positionRotatedMid === RelativePosition.left || positionRotatedMid ===
            RelativePosition.right) {
            positionRotatedMid |= RelativePosition.above
        }

        //first check if the final rectangle has a intersection with the circle
        //defined by origin and distance at a edge instead of a corner.
        const checkEdgeIntersects = (posPosition, recEdgePosition) => {
            //get the possible intersection point (directly above, below
            //right or left of the circle mid
            const circleEdgePoint = PointCalculation.getPointByRelativePosition(origin,
                posPosition,
                dist
            );
            //line parallel to line defined by origin and the rotated rectangle
            //mid that goes through circleEdgePoint
            const [p1, p2] = VectorCalculation.findParallelLineByDistVec(origin,
                rotatedMid,
                VectorCalculation.findPerpVecLineToPoint(origin, rotatedMid, circleEdgePoint)
            );
            //corners of the rectangle that define a line by position relative to
            //rotatedMid
            const [re1, re2] = PolygonCalculation.getRectangleEdgeByPosition(rotatedMaxes,
                recEdgePosition
            );
            //intersection of previous defined lines (parallel and line
            //through corners)
            const intersection = LineCalculation.findIntersectionTwoLines(LineCalculation.createLinearFunctionByTwoPoints(p1,
                p2
            ), LineCalculation.createLinearFunctionByTwoPoints(re1, re2));
            //relative position of previous intersection relative to the
            //rotated rectangle.
            const intersectionPos = PolygonCalculation.getRelativePositionPointRectangle(intersection,
                rotatedMaxes
            );
            //if this is true than the intersection is between the previously
            //defined corners and tho the final rectangle will have an
            //intersection with the circle at an edge instead of a corner.
            //RelativePosition.inside is used to mitigate rounding errors
            if (intersectionPos === recEdgePosition || intersectionPos ===
                RelativePosition.inside) {
                //move the rotated mid by that direction and distance so
                //that the edge of rectangle (defined by re1/re2) will
                //intersect with the circle at circleEdgePoint and
                //return the final rectangle mid
                const moveVec = VectorCalculation
                    .vectorSubstract(circleEdgePoint, intersection);
                return VectorCalculation.vectorAdd(rotatedMid, moveVec);
            } else {
                //Intersection is at a corner of the rectangle. Continue
                return null;
            }
        };

        //for when isInside is true
        const possibleMids = [];
        let mindist = Infinity;

        for (const position of [
            RelativePosition.below,
            RelativePosition.above,
            RelativePosition.left,
            RelativePosition.right
        ]) {
            if (!isInside && positionRotatedMid & position) {
                const finalMid = checkEdgeIntersects(position,
                    this.invertRelativePosition(position)
                );
                if (finalMid) return finalMid;
            } else if (isInside && this.invertRelativePosition(positionRotatedMid) & position) {
                const finalMid = checkEdgeIntersects(position, position);
                const finalRectangleMaxes = finalMid ?
                    this.getRelativePositionPointRectangle(origin,
                        this.convertRectangleMidDimensionsToMaxes(finalMid, {height, width})
                    ) : undefined;
                if (finalRectangleMaxes === RelativePosition.inside) {
                    const distToOrigin = VectorCalculation.getDist2d(origin, finalMid);
                    if (distToOrigin < mindist) mindist = distToOrigin;
                    possibleMids.push({
                        point: finalMid, distToOrigin: distToOrigin
                    })
                }
            }
        }

        if (isInside) {
            for (const {point, distToOrigin} of Object.values(possibleMids)) {
                if (distToOrigin === mindist) return point;
            }
            //fallback
            return rotatedMid;
        }

        //corner of rotated rectangle to origin. This corner will eventually
        //be the corner that lies on the defined circle
        const intersectingCorner = this.getRectangleCornerByPosition(rotatedMaxes,
            this.invertRelativePosition(positionRotatedMid)
        );
        //line through intersectingCorner parallel to the line on which the
        //final midpoint should lie
        const [parallelP1, parallelP2] = VectorCalculation.findParallelLineByDistVec(origin,
            rotatedMid,
            VectorCalculation.findPerpVecLineToPoint(origin, rotatedMid, intersectingCorner)
        );
        const parallelLine = LineCalculation.createLinearFunctionByTwoPoints(parallelP1,
            parallelP2
        );
        //find intersection of parallelLine to the circle defined by origin
        //and dist. Use the closest to the rotatedMid.
        //since we tested before if the final intersection of the
        //rectangle and the circle lies on the edge and that was false at
        //this point in code, there will always be two intersection points
        //so there is no need to validate that intersectionPoint is defined
        const intersections = LineCalculation.findCircleLineIntersections(dist,
            origin.x,
            origin.y,
            parallelLine.m,
            parallelLine.b
        );
        const {point: intersectionPoint} = PointCalculation.getClosestPoint(rotatedMid,
            intersections
        );
        //move the rectangle (here: rotatedMid) so that the corner
        //of the rectangle at inverted positionRotatedMid lies
        //on top of the intersectionPoint
        const moveVec = VectorCalculation
            .vectorSubstract(intersectionPoint, intersectingCorner);
        return VectorCalculation.vectorAdd(rotatedMid, moveVec);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Inverts a relative position. Examples of what outcomes to expect:
     * above --> below
     * right --> left
     * belowRight --> aboveLeft
     * inside --> inside (!!SPECIAL CASE!!).
     *
     * @param position {RelativePosition} - position to invert
     * @returns {RelativePosition} - inverted position
     */
    static invertRelativePosition(position) {
        if (position & RelativePosition.below || position & RelativePosition.above) {
            position ^= RelativePosition.below ^ RelativePosition.above;
        }

        if (position & RelativePosition.left || position & RelativePosition.right) {
            position ^= RelativePosition.left ^ RelativePosition.right;
        }

        return position;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds the centroid of a convex (!) polygon (can be approximated by convex
     * hull).
     *
     * @param polyVertices {Array} - vertices of the polygon
     * @returns {Object} - centroid coordinates and signed area of the polygon
     */
    static findCenterOfConvexPolygon(polyVertices) {
        const centroid = {
            x: 0, y: 0
        };

        let signedArea = 0;

        let i = 0;
        const addPoint = (p1, p2) => {
            const a = p1.x * p2.y - p2.x * p1.y;
            signedArea += a;
            centroid.x += (p1.x + p2.x) * a;
            centroid.y += (p1.y + p2.y) * a;
        };
        for (const len = polyVertices.length - 1; i < len; ++i) {
            addPoint(polyVertices[i], polyVertices[i + 1]);
        }
        addPoint(polyVertices[i], polyVertices[0]);

        signedArea *= 0.5;
        centroid.x /= (6 * signedArea);
        centroid.y /= (6 * signedArea);

        return {
            centroid: centroid, signedArea: signedArea
        }
    }
}