/**
 * Contains the data of the current scene (i.e. the input JSONs and the data extracted out of
 * those).
 */
class SceneData {
    /**
     * Contains an instance for the configuration options and sets the object to default state.
     */
    constructor(opts) {
        this.opts = opts;
        this.reset();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets many important containers for structural information to their
     * default (often empty) state. Useful when resetting the scene.
     */
    reset() {
        //with graph structures that track relevant coordinates etc
        this.structuresData = new StructuresData();
        this.intermolecularData = new IntermolecularData();
        this.annotationsData = new AnnotationsData();
        this.hydrophobicData = new HydrophobicData();

        //global limits of structures, used to center the view
        this.globalLimits = {
            xMin: Infinity,
            xMax: -Infinity,
            yMin: Infinity,
            yMax: -Infinity,
            width: Infinity,
            height: Infinity,
            mid: {
                x: undefined, y: undefined
            }
        };

        //all previously added json. Used for a reset of the scene
        this.loadedJsonStrings = [];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets the global boundaries of the scene to new values.
     *
     * @param xMin {Number} - new minimum x-coordinate of the bounding box of
     * the scene
     * @param xMax {Number} - new maximum x-coordinate of the bounding box of
     * the scene
     * @param yMin {Number} - new minimum y-coordinate of the bounding box of
     * the scene
     * @param yMax {Number} - new maximum y-coordinate of the bounding box of
     * the scene
     */
    setGlobalLimits(xMin, xMax, yMin, yMax) {
        this.globalLimits = {
            xMin: xMin, xMax: xMax, yMin: yMin, yMax: yMax, mid: {
                x: (xMin + xMax) / 2, y: (yMin + yMax) / 2
            }, width: xMax - xMin, height: yMax - yMin
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets the global boundaries of the scene based on structure boundaries,
     * splines, and annotations. To optimize performance, allows the setting
     * of fixed values for boundaries which do not have to be looked at
     * during further comparisons.
     *
     * @param limits {Object} - fixed values for known boundaries (xMin,
     * xMax, yMin, yMax)
     */
    calcBoundaries(limits = undefined) {
        const xMinSet = limits && limits.xMin;
        const xMaxSet = limits && limits.xMax;
        const yMinSet = limits && limits.yMin;
        const yMaxSet = limits && limits.yMax;
        let newXmin = xMinSet ? limits.xMin : Infinity;
        let newXmax = xMaxSet ? limits.xMax : -Infinity;
        let newYmin = yMinSet ? limits.yMin : Infinity;
        let newYmax = yMaxSet ? limits.yMax : -Infinity;

        const updateLimits = (xMin, xMax, yMin, yMax) => {
            if (!xMinSet && xMin < newXmin) {
                newXmin = xMin;
            }
            if (!xMaxSet && xMax > newXmax) {
                newXmax = xMax;
            }
            if (!yMinSet && yMin < newYmin) {
                newYmin = yMin;
            }
            if (!yMaxSet && yMax > newYmax) {
                newYmax = yMax;
            }
        };

        for (const structureId in this.structuresData.structures) {
            const structure = this.structuresData.structures[structureId];
            //setting by structure boundaries
            const {boundaries: {xMin, xMax, yMin, yMax}} = structure;
            updateLimits(xMin, xMax, yMin, yMax);

            //setting by spline boundaries
            Object.values(structure.hydrophobicConnectionData.hydrophobicConts).forEach(spline => {
                const rad = this.opts.lineWidth;
                spline.getCurveCoords(false).forEach(({x, y}) => {
                    updateLimits(x - rad, x + rad, y - rad, y + rad);
                });
            });
        }

        for (const labelId in this.annotationsData.annotations) {
            const annotation = this.annotationsData.annotations[labelId];
            const {globalDrawLimits: {xMin, xMax, yMin, yMax}} = annotation;
            updateLimits(xMin, xMax, yMin, yMax);
        }

        this.setGlobalLimits(newXmin, newXmax, newYmin, newYmax);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Based on width and height of the draw area provided to the drawer to
     * build its scenes in, eludes vital information to produce nicely centered
     * drawings.
     *
     * @param width {Number} - new width of the draw area
     * @param height {Number} - new height of the draw area
     */
    setInfoForDrawing(width, height) {
        this.drawAreaDim = {
            width: width, height: height
        };
        this.midCoords = {
            x: width / 2, y: height / 2
        };
        this.idealMaxWidth = width - 2 * this.opts.drawAreaPadding;
        this.idealMaxHeight = height - 2 * this.opts.drawAreaPadding;
        this.drawAreaMid = {
            x: this.drawAreaDim.width / 2, y: this.drawAreaDim.height / 2
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns a sub selection of jsons based on type parameter.
     *
     * @param type {Number} - defines which previously added jsons to return
     * 0: load all,
     * 1: only load the first added json,
     * 2: only load jsons containing at least one structure
     */
    getJsonByType(type) {
        let jsonStrings;
        if (type === 0) {
            jsonStrings = this.loadedJsonStrings.slice();
        } else if (type === 1) {
            jsonStrings = this.loadedJsonStrings.slice(0, 1);
        } else if (type === 2) {
            jsonStrings = this.loadedJsonStrings.slice()
                .filter(jString => {
                    const scene = JSON.parse(jString).scene;
                    return scene.structures && scene.structures[0];
                });
        }
        return jsonStrings;
    }
}