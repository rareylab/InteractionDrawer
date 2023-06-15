/**
 * Class representing a simple line in the form f(x) = m*x+b.
 */
class Line {
    /**
     * Creates a new Line object.
     *
     * @param m - slope of the line
     * @param b - y-intercept of the line
     */
    constructor(m, b) {
        this.m = m;
        this.b = b;
        this.function = (x) => {
            return m * x + b;
        }
    }
}