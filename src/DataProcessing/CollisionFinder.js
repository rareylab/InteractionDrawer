/**
 * Searches structural data for the colliding draw object of a certain type to a given point or
 * polygon.
 */
class CollisionFinder {
    /**
     * Contains instance for the data storage/access and configuration options.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     */
    constructor(opts, sceneData) {
        this.opts = opts;
        this.sceneData = sceneData;
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a given polygon or point, checks annotations for collision and report
     * the such found collision (if any is found). The lastly added annotation is
     * always returned based on Id for the case that different annotations are
     * located on top of each other.
     *
     * @param polyVertices {Array} - points of the polygon to check for
     * collisions. Can just contain a single point
     * @returns {null|Object} - null if no collision is found, else the lastly added
     * hit (logging Id of annotation as field "label")
     */
    findLastCollisionAnnotation(polyVertices) {
        if (polyVertices.length === 0) {
            return null;
        }
        const {circleTest, polyTest} = this.createCollisionChecksForPoints(polyVertices);
        const annotations = this.sceneData.annotationsData.annotations;
        const labelIds = Object.keys(annotations).reverse();
        for (const labelId of labelIds) {
            const annotation = this.sceneData.annotationsData.annotations[labelId];
            const displayed = !annotation.isStructureLabel ||
                !this.sceneData.structuresData.structures.hasOwnProperty(annotation.structureLink) ||
                !this.sceneData.structuresData.structures[annotation.structureLink].representationsData.isCurRepresentation(
                    StructureRepresentation.circle);
            if (!annotation.hidden && annotation.enabled && displayed) {
                if (annotation.testHitFunctionsForSelection({
                    circleHitFunction: circleTest, rectHitFunction: polyTest
                })) {
                    if (this.opts.geomineMode && (!annotation.additionalInformation ||
                        !annotation.additionalInformation.nglFeatureType ||
                        annotation.additionalInformation.nglFeatureType === 'surface')) {
                        return null;
                    }
                    return {
                        type: 'annotation',
                        id: parseInt(labelId),
                        structureLink: parseInt(annotation.structureLink),
                        additionalInformation: annotation.additionalInformation
                    };
                }
            }
        }
        return null;
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a given polygon or point, checks spline control points for collision
     * and report the first such found collision (if any is found).
     *
     * @param polyVertices {Array} - points of the polygon to check for
     * collisions. Can just contain a single point
     * @returns {null|Object} - null if no collision is found, else the first
     * hit (logging structureId, id of spline, and control point id)
     */
    findFirstCollisionSplines(polyVertices) {
        if (this.opts.geomineMode || polyVertices.length === 0) {
            return null;
        }
        const {circleTest} = this.createCollisionChecksForPoints(polyVertices);

        for (const structureId in this.sceneData.structuresData.structures) {
            const structure = this.sceneData.structuresData.structures[structureId];
            for (const hIdx in structure.hydrophobicConnectionData.hydrophobicConts) {
                const spline = structure.hydrophobicConnectionData.hydrophobicConts[hIdx];
                if (!spline.hidden && spline.enabled) {
                    const cPs = spline.getControlPoints(true);
                    for (let cIdx = 0, cLen = cPs.length; cIdx < cLen; ++cIdx) {
                        if (!cPs[cIdx].enabled) {
                            continue;
                        }
                        const circle = cPs[cIdx];
                        if (circleTest(circle)) {
                            return {
                                type: 'splineControlPoint',
                                structureId: parseInt(structureId),
                                hydrophobicId: parseInt(hIdx),
                                controlPointId: cIdx
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a given point, checks the paths of splines (through the coordinates
     * of points along this path) for collision and report the first such
     * collision (if any is found).
     *
     * @param interactionPoint {Object} - point to check for collisions
     * @returns {null|Object} - null if no collision is found, else the first
     * hit (logging structureId, id of spline and all control points of this
     * spline)
     */
    findFirstCollisionSplinePath(interactionPoint) {
        let hit = null;
        if (this.opts.geomineMode) {
            return hit;
        }
        for (const structureId in this.sceneData.structuresData.structures) {
            const structure = this.sceneData.structuresData.structures[structureId];
            for (const hIdx in structure.hydrophobicConnectionData.hydrophobicConts) {
                const spline = structure.hydrophobicConnectionData.hydrophobicConts[hIdx];
                if (!spline.hidden && spline.enabled) {
                    if (PolygonCalculation.checkCollisionPointPath(spline
                        .getCurveCoords(true), this.opts.lineWidth, interactionPoint)) {
                        const cpIds = Object.keys(spline.getControlPoints(true));
                        hit = {
                            type: 'splinePath',
                            structureId: parseInt(structureId),
                            hydrophobicId: hIdx,
                            controlPointIds: cpIds
                        }
                    }
                }
            }
        }
        return hit;
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a given polygon or point, check atoms bonds and alternative structure
     * representations for collision and report the first such found collision
     * (if any is found).
     *
     * @param polyVertices {Array} - points of the polygon to check for
     * collisions. Can just contain a single point
     * @returns {null|Object} - null if no collision is found, else the first
     * hit (logging type of hit, structureId of Structure which contains the
     * hit element and id of hit element)
     */
    findFirstStructureCollision(polyVertices) {
        if (polyVertices.length === 0) {
            return null;
        }

        const {circleTest, polyTest} = this.createCollisionChecksForPoints(polyVertices);

        for (const structureId in this.sceneData.structuresData.structures) {
            const structure = this.sceneData.structuresData.structures[structureId];
            if (!structure.hidden && structure.enabled) {
                if (!this.opts.geomineMode &&
                    structure.representationsData.isCurRepresentation(StructureRepresentation.circle) &&
                    this.testForStructureCircleCollision(structureId, circleTest)) {
                    return {
                        type: 'structureCircle',
                        structureId: parseInt(structureId),
                        id: parseInt(structureId)
                    };
                }
                if (structure.representationsData.isCurRepresentation(StructureRepresentation.default)) {
                    for (const atom of structure.atomsData.getAllEnabledAtoms()) {
                        if (atom.testHitFunctionsForSelection({
                            circleHitFunction: circleTest, rectHitFunction: polyTest
                        })) {
                            const element = atom.element;
                            if (this.opts.geomineMode && (element === 'R' || atom.isHydrogen())) {
                                return null;
                            }
                            return {
                                type: 'atom',
                                structureId: parseInt(structureId),
                                structureName: structure.structureName,
                                structureType: structure.structureType,
                                id: atom.id,
                                additionalInformation: atom.additionalInformation
                            };
                        }
                    }
                }
                if (!this.opts.geomineMode &&
                    structure.representationsData.isCurRepresentation(StructureRepresentation.default)) {
                    for (const edge of structure.edgesData.getAllEnabledEdges()) {
                        //careful with hidden edges
                        const selectorPoints = edge.hidden ? [
                            PointCalculation.findEdgeMidpoint(
                                structure.atomsData.getAtom(edge.from).coordinates,
                                structure.atomsData.getAtom(edge.to).coordinates
                            )
                        ] : edge.getCollisionPointsByMode(this.opts.handleCollisionWith);
                        if (edge.enabled && polyTest(selectorPoints)) {
                            return {
                                type: 'edge',
                                structureId: parseInt(structureId),
                                id: edge.id,
                                from: edge.from,
                                to: edge.to
                            };
                        }
                    }
                }
            }
        }
        return null;
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a given polygon or point, checks intermolecular (atom pair interaction,
     * pi stackings, pi cation stackings) representations for collision
     * and report the last such found collision (if any is found).
     *
     * @param polyVertices {Array} - points of the polygon to check for
     * collisions. Can just contain a single point
     * @returns {null|Object} - null if no collision is found, else the last
     * hit (logging type of hit, and id of hit element)
     */
    findLastIntermolecularCollision(polyVertices) {
        if (polyVertices.length === 0) {
            return null;
        }

        const {polyTest} = this.createCollisionChecksForPoints(polyVertices);

        for (const type of this.sceneData.intermolecularData.intermolecularTypes) {
            for (const [id, interaction] of
                Object.entries(this.sceneData.intermolecularData[type]).reverse()) {
                if (!interaction.hidden && interaction.enabled) {
                    //careful with hidden edges
                    const selectorPoints = interaction
                        .getCollisionPointsByMode(this.opts.handleCollisionWith);
                    if (polyTest(selectorPoints)) {
                        return {
                            id: parseInt(id),
                            type: type,
                            additionalInformation: interaction.additionalInformation
                        };
                    }
                }
            }
        }

        return null;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates necessary test functions for collision detection for a given
     * array of polygon points. Most notably fills in different geometrical
     * check functions if only a single point is given.
     *
     * @param polyVertices {Array} - points of the polygon to check for
     * collisions. Can just contain a single point
     * @returns {Object} - collision test functions to check whether the given
     * points collide with an input circle (field "circleTest") or with an
     * input polygon (field "polyTest")
     */
    createCollisionChecksForPoints(polyVertices) {
        let circleTestFn, polyTestFn;
        if (polyVertices.length === 1) { //hits with single point
            const singlePoint = polyVertices[0];
            circleTestFn = (circle) => {
                return PointCalculation.checkPointInCircle(singlePoint, circle, circle.rad);
            };
            polyTestFn = (poly) => {
                return PolygonCalculation.checkCollisionPolygonPoint(singlePoint, poly);
            };
        } else { //hits with multiple points
            circleTestFn = (circle) => {
                return PolygonCalculation.checkCollisionPolygonCircle(circle, polyVertices);
            };
            polyTestFn = (otherPoly) => {
                return PolygonCalculation.checkCollisionTwoPolygons(polyVertices, otherPoly);
            };
        }

        return {
            circleTest: circleTestFn, polyTest: polyTestFn
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Tests whether a selector shape of a structure circle passes a circle
     * collision check function.
     *
     * @param structureId {Object} - the Structure the structure circle
     * belongs to
     * @param circleHitFunction {Function} - function to hit test circle
     * elements
     */
    testForStructureCircleCollision(structureId, circleHitFunction) {
        const structure = this.sceneData.structuresData.structures[structureId];
        const selShapes = structure.representationsData.structureCircle.selectorShapes;
        for (const selShape of selShapes) {
            const {coordinates: {x, y}, rad} = selShape;
            const circle = {
                x: x, y: y, rad: rad
            };
            if (circleHitFunction(circle)) {
                return true;
            }
        }
        return false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks which atoms, bonds and structure circles a given polygon or point
     * collides with.
     *
     * @param polyVertices {Array} - points of the polygon to check for
     * collisions. Can just contain a single point
     * @returns {Object} - log which atoms edges and structure circles
     * are hit in which structures
     */
    findCollisions(polyVertices) {
        if (polyVertices.length === 0) {
            return {
                hitAtoms: {}, hitEdges: {}, hitStructureCircles: []
            }
        }

        const {circleTest, polyTest} = this.createCollisionChecksForPoints(polyVertices);

        const hitAtoms = {};
        const hitEdges = {};
        const hitStructureCircles = [];
        for (const structureId in this.sceneData.structuresData.structures) {
            const structure = this.sceneData.structuresData.structures[structureId];
            if (!structure.hidden && structure.enabled) {
                structure.atomsData.getAllEnabledAtoms().forEach(atom => {
                    if (atom.testHitFunctionsForSelection({
                        circleHitFunction: circleTest, rectHitFunction: polyTest
                    })) {
                        if (!hitAtoms.hasOwnProperty(structureId)) {
                            hitAtoms[structureId] = [];
                        }
                        hitAtoms[structureId].push(atom.id);
                    }
                });

                structure.edgesData.getAllEnabledEdges().forEach(edge => {
                    //careful with hidden edges
                    const selectorPoints = edge.hidden ? [
                        PointCalculation.findEdgeMidpoint(
                            structure.atomsData.getAtom(edge.from).coordinates,
                            structure.atomsData.getAtom(edge.to).coordinates
                        )
                    ] : edge.getCollisionPointsByMode(this.opts.handleCollisionWith);
                    if (polyTest(selectorPoints)) {
                        if (!hitEdges.hasOwnProperty(structureId)) {
                            hitEdges[structureId] = [];
                        }
                        hitEdges[structureId].push(edge.id);
                    }
                });

                if (structure.representationsData.hasRepresentation(StructureRepresentation.circle) &&
                    this.testForStructureCircleCollision(structureId, circleTest)) {
                    hitStructureCircles.push(structureId);
                }
            }
        }

        return {
            hitAtoms: hitAtoms, hitEdges: hitEdges, hitStructureCircles: hitStructureCircles
        }
    }
}
