/**
 * Class (for namespace purposes) containing static helper functions for
 * geometrically motivated calculations with respect to vectors.
 */
class VectorCalculation {
    /**
     * Calculates length of given vector.
     *
     * @param v1 {Object} - vector to calculate length for
     * @returns {Number} - length of the vector
     */
    static vectorLength(v1) {
        return Math.sqrt(v1.x ** 2 + v1.y ** 2);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Subtracts a vector from another.
     *
     * @param v1 {Object} - first vector
     * @param v2 {Object} - second vector
     * @returns {Object} - new vector
     */
    static vectorSubstract(v1, v2) {
        return {
            x: v1.x - v2.x, y: v1.y - v2.y
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds a vector to another.
     *
     * @param v1 {Object} - first vector
     * @param v2 {Object} - second vector
     * @returns {Object} - new vector
     */
    static vectorAdd(v1, v2) {
        return {
            x: v1.x + v2.x, y: v1.y + v2.y
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Performs scalar multiplication on a given vector.
     *
     * @param v1 {Object} - vector to scalar multiply
     * @param c {Number} - value to multiply by
     * @returns {Object} - new vector
     */
    static scalarMult(v1, c) {
        return {
            x: c * v1.x, y: c * v1.y
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Calculates dot product of two vectors.
     *
     * @param v1 {Object} - first vector
     * @param v2 {Object} - second vector
     * @returns {Number} - dot product of the two vectors
     */
    static dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Normalizes a given vector (to a vector of length 1).
     *
     * @param v {Object} - vector to normalize
     * @returns {Object} - normalized vector
     */
    static normalize(v) {
        const len = Math.sqrt(v.x ** 2 + v.y ** 2);
        return {
            x: v.x / len, y: v.y / len
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds out whether two given vectors point into the same direction.
     *
     * @param v1 {Object} - first vector
     * @param v2 {Object} - second vector
     * @returns {Boolean} - whether the vectors point in the same direction
     */
    static checkTwoVectorsPointSameDirection(v1, v2) {
        const normalized_1 = this.normalize(v1);
        const normalized_2 = this.normalize(v2);
        return Helpers.isAlmostEqual(this.dot(normalized_1, normalized_2), 1);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates vector based on line endpoints.
     *
     * @param from {Object} - first line endpoint
     * @param to {Object} - second line endpoint
     * @returns {Object} - line defined as vector
     */
    static vectorizeLine(from, to) {
        return {
            x: to.x - from.x, y: to.y - from.y
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets distance between two given vectors.
     *
     * @param v1 {Object} - first vector
     * @param v2 {Object} - second vector
     * @returns {Number} - distance between the vectors
     */
    static getDist2d(v1, v2) {
        return Math.sqrt((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds a perpendicular vector from a point on a given line to a
     * given point.
     *
     * @param p1 {Object} - x- and y-coordinates of first point on line
     * @param p2 {Object} - x- and y-coordinates of second point on line
     * @param p0 {Object} - x- and y-coordinates of point to get the vector to
     * @returns {Object} - x- and y-coordinates of perpendicular vector
     */
    static findPerpVecLineToPoint(p1, p2, p0) {
        return this.vectorSubstract(p0, this.findMinDistPointOnLineToPoint(p1, p2, p0))
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds the point on a line with minimal distance to a given point.
     *
     * @param p1 {Object} - x- and y-coordinates of first point on line
     * @param p2 {Object} - x- and y-coordinates of second point on line
     * @param p0 {Object} - x- and y-coordinates of given point
     * @returns {Object} - x- and y-coordinates of point on line
     */
    static findMinDistPointOnLineToPoint(p1, p2, p0) {
        const lineVec = this.normalize(this.vectorizeLine(p1, p2));
        return this.vectorAdd(p1,
            this.scalarMult(lineVec, this.dot(this.vectorSubstract(p0, p1), lineVec))
        )
    }

    /*----------------------------------------------------------------------*/

    /**
     * Determines the angle between two given vectors.
     *
     * @param v1 {Object} - first vector
     * @param v2 {Object} - second vector
     * @returns {Number} - angle between the vectors (in degrees)
     */
    static findAngleBetweenTwoVectors(v1, v2) {
        //must be rounded before application of acos, else can become NaN,
        //e.g. acos(-1) is 180 deg, but acos(-1.0000000001) is NaN
        return Math.acos(Helpers.round(this.dot(v1, v2) /
            (this.vectorLength(v1) * this.vectorLength(v2)), 6));
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds line parallel to given line, based on a distance vector between the
     * two lines.
     *
     * @param p1 {Object} - first endpoint of the line
     * @param p2 {Object} - second endpoint of the line
     * @param distVec {Object} - distances between lines (x and y)
     * @returns {Array} - the two endpoints of the second line
     */
    static findParallelLineByDistVec(p1, p2, distVec) {
        return [
            {
                x: p1.x + distVec.x, y: p1.y + distVec.y
            }, {
                x: p2.x + distVec.x, y: p2.y + distVec.y
            }
        ];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Determines the angle between two lines, defined by their endpoints.
     *
     * @param from_1 {Object} - first endpoint of first line
     * @param to_1 {Object} - second endpoint of first line
     * @param from_2 {Object} - first endpoint of second line
     * @param to_2 {Object} - second endpoint of second line
     * @returns {Number} - angle between the lines (in radians)
     */
    static findAngleBetweenLines(from_1, to_1, from_2, to_2) {
        //get vector representation of lines
        const p1Dir = this.vectorizeLine(from_1, to_1);
        const p2Dir = this.vectorizeLine(from_2, to_2);
        //use vector representation to get angle
        return this.findAngleBetweenTwoVectors(p1Dir, p2Dir);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Calculates the projection of a given point onto a given line (defined by
     * a vector).
     *
     * @param lineVec {Object} - vector defining a line
     * @param p {Object} - point to project onto the line
     * @returns {Object} - projected point
     */
    static calcProjection(lineVec, p) {
        return this.scalarMult(lineVec, this.dot(p, lineVec) / this.dot(lineVec, lineVec));
    }
}