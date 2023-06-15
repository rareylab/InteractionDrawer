/**
 * Class (for namespace purposes) containing static helper functions for
 * geometrically motivated calculations with respect to angles.
 */
class AngleCalculation {
    /**
     * Converts an angle value from degrees to radians.
     *
     * @param degree {Number} - angle value in degree
     * @returns {Number} - angle value in radian
     */
    static degreeToRadian(degree) {
        return degree * Math.PI / 180;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Converts an angle value from radians to degrees.
     *
     * @param radian {Number} - angle value in radian
     * @returns {Number} - angle value in degree
     */
    static radianToDegree(radian) {
        return radian * 180 / Math.PI;
    }
}