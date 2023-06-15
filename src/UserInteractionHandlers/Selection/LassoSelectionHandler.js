/**
 * Processes selection user interactions with the draw area via the lasso selector.
 */
class LassoSelectionHandler {
    /**
     * Contains instances for the data storage/access, user interaction tracking,
     * draw area manipulation, mouse click handling of the lasso selector and
     * configuration options.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     * @param interactionState {Object} - tracks user interactions
     * @param svgDrawer {Object} - updates the draw area
     * @param clickSelectionHandler {Object} - processes selection user
     * interactions with the draw area
     */
    constructor(opts, sceneData, interactionState, svgDrawer, clickSelectionHandler) {
        this.opts = opts;
        this.sceneData = sceneData;
        this.interactionState = interactionState;
        this.svgDrawer = svgDrawer;
        this.clickSelectionHandler = clickSelectionHandler;

        this.collisionFinder = new CollisionFinder(opts, sceneData);
        this.multiSelectionCallback = null;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Continuous update of the lasso selector. Adds given cursor coordinates
     * as new point to the underlying polygon and update its inferred closing
     * bond. Then, update winding numbers logged on bonds and atoms based on
     * added and removed edges of the polygon and infer collision from these
     * winding numbers. Select elements based on collisions.
     *
     * @param drawAreaCoords {Object} - x- and y-coordinates of current
     * cursor screen position translated to position in draw area
     */
    handleFreeSelection(drawAreaCoords) {
        //other than rect selector, earlier selection always remains relevant,
        //just the 'closing line' of polygon changes. the selection based on
        //this closing line is removed in each step of the free selection and
        //logged as 'uncertain' hits in this.interactionState.interaction.selectionCandidates
        this.clickSelectionHandler.iterateSelectionCandidates({
            atomCallback: (structure, atomId) => {
                this.svgDrawer.atomDrawer.unselectAtomDrawarea(structure.id, atomId);
            }, edgeCallback: (structure, edgeId) => {
                this.svgDrawer.edgeDrawer.unselectEdgeDrawarea(structure.id, edgeId);
            }, structureCircleCallback: (structure, id) => {
                this.svgDrawer.structureCircleDrawer.unselectStructureCircleDrawarea(id);
            }, annotationCallback: () => {}, intermolecularCallback: () => {}
        });
        this.interactionState.interaction.resetSelectionCandidates();
        this.svgDrawer.viewerDrawer.addToFreeSelector(drawAreaCoords);
        const realCoords = this.interactionState.getRealCoordinates(drawAreaCoords);
        //fetch last point added and first point added
        const selectedPoints = this.interactionState.selectionPoints;
        const firstPoint = selectedPoints[0];
        const lastPoint = selectedPoints[this.interactionState.selectionPoints.length - 1];
        //higher-order functions to create line-based collision checks
        const createCircleHitFn = (p1, p2) => {
            return (circle) => {
                return LineCalculation.checkIntersectionLineCircle(p1, p2, circle);
            };
        };
        const createRectHitFn = (p1, p2) => {
            return (rect) => {
                return PolygonCalculation.checkIntersectionLineRectangle(p1, p2, rect);
            };
        };
        //perform the actual hit testing and move hits to containers
        for (const structureId in this.sceneData.structuresData.structures) {
            const structure = this.sceneData.structuresData.structures[structureId];
            if (!structure.hidden && structure.enabled) {
                this.performLassoHitTesting(structureId,
                    firstPoint,
                    lastPoint,
                    realCoords,
                    createCircleHitFn,
                    createRectHitFn
                );
            }
        }
        //finalize new path
        this.interactionState.selectionPoints.push(realCoords);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finalizes selection by lasso selector.
     */
    handleFreeSelectionEnd() {
        this.svgDrawer.viewerDrawer.clearSelector();
        //apply candidates to temp selection
        this.clickSelectionHandler.iterateSelectionCandidates({
            atomCallback: (structure, id) => {
                this.svgDrawer.atomDrawer.tempSelectAtom(structure.id, id);
            }, edgeCallback: (structure, id) => {
                this.svgDrawer.edgeDrawer.tempSelectEdge(structure.id, id);
            }, structureCircleCallback: (structure, id) => {
                this.svgDrawer.structureCircleDrawer.tempSelectStructureCircle(id);
            }, annotationCallback: () => {}, intermolecularCallback: () => {}
        });
        this.svgDrawer.structureDrawer.applyTempSelection();
        this.svgDrawer.atomDrawer.selectAtomsBetweenSelectedEdges(); //needs to be called last!
        if (this.multiSelectionCallback) {
            this.multiSelectionCallback();
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Performs the actual hit testing of the lasso selection and moves hits to containers.
     *
     * @param structureId {Number} - id of hit structure
     * @param firstPoint {Object} - first point of lasso
     * @param lastPoint {Object} - last point of lasso
     * @param realCoords {Object} - new x- and y-coordinates of current cursor screen position
     * @param createCircleHitFn {Function} - checks if line hits a circle
     * @param createRectHitFn {Function} - checks if line hits a rectangle
     */
    performLassoHitTesting(structureId,
        firstPoint,
        lastPoint,
        realCoords,
        createCircleHitFn,
        createRectHitFn
    ) {
        const structure = this.sceneData.structuresData.structures[structureId];
        if (structure.representationsData.isCurRepresentation(StructureRepresentation.default)) {
            this.checkNewAtomsHit(structure,
                structureId,
                firstPoint,
                lastPoint,
                realCoords,
                createCircleHitFn,
                createRectHitFn
            );
            this.checkNewEdgesHit(structure, structureId, firstPoint, lastPoint, realCoords);
        } else if (structure.representationsData.hasRepresentation(StructureRepresentation.circle) &&
            structure.representationsData.isCurRepresentation(StructureRepresentation.circle)) {
            this.checkNewStructureCirclesHit(structure,
                structureId,
                firstPoint,
                lastPoint,
                realCoords,
                createCircleHitFn
            )
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks if any NEW atoms are hit by lasso selector.
     *
     * @param structure {Structure} - hit structure
     * @param structureId {Number} - id of hit structure
     * @param firstPoint {Object} - first point of lasso
     * @param lastPoint {Object} - last point of lasso
     * @param realCoords {Object} - new x- and y-coordinates of current cursor screen position
     * @param createCircleHitFn {Function} - checks if line hits a circle
     * @param createRectHitFn {Function} - checks if line hits a rectangle
     */
    checkNewAtomsHit(structure,
        structureId,
        firstPoint,
        lastPoint,
        realCoords,
        createCircleHitFn,
        createRectHitFn
    ) {
        structure.atomsData.getAllDrawnAtoms().forEach(atom => {
            const {id: atomId, coordinates: coords} = atom;
            //already (NOT TEMP) selected atoms stay selected
            if (structure.atomsData.tempSelectedAtoms.has(atomId)) {
                return;
            }
            //intersection check with new line
            if (atom.testHitFunctionsForSelection({
                circleHitFunction: createCircleHitFn(lastPoint, realCoords),
                rectHitFunction: createRectHitFn(lastPoint, realCoords)
            })) {
                this.svgDrawer.atomDrawer.tempSelectAtom(structureId, atomId);
                return; //real hit, done here
            }
            //check if atom is now fully inside selector
            const reverse = LassoSelectionHandler.changeWindingNumber(lastPoint,
                firstPoint,
                coords
            );
            const add_1 = LassoSelectionHandler.changeWindingNumber(lastPoint, realCoords, coords);
            const add_2 = LassoSelectionHandler.changeWindingNumber(realCoords, firstPoint, coords);
            atom.wn = atom.wn - reverse + add_1 + add_2;
            //if fully in or hit with 'closing line', confirm temp hit
            if (atom.wn !== 0 || atom.testHitFunctionsForSelection({
                circleHitFunction: createCircleHitFn(realCoords, firstPoint),
                rectHitFunction: createRectHitFn(realCoords, firstPoint)
            })) {
                this.interactionState.interaction.addSelectionCandidate(structureId,
                    atomId,
                    'atom'
                );
                this.svgDrawer.atomDrawer.selectAtomDrawarea(structureId, atomId);
            }
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks if any NEW edges are hit by lasso selector.
     *
     * @param structure {Structure} - hit structure
     * @param structureId {Number} - id of hit structure
     * @param firstPoint {Object} - first point of lasso
     * @param lastPoint {Object} - last point of lasso
     * @param realCoords {Object} - new x- and y-coordinates of current cursor screen position
     */
    checkNewEdgesHit(structure, structureId, firstPoint, lastPoint, realCoords) {
        structure.edgesData.getAllEnabledEdges().forEach(edge => {
            const edgeId = edge.id;
            //already (NOT TEMP) selected edges stay selected
            if (structure.edgesData.tempSelectedEdges.has(edgeId)) {
                return;
            }
            const edgeMid = PointCalculation.findEdgeMidpoint(structure.atomsData.getAtom(edge.from).coordinates,
                structure.atomsData.getAtom(edge.to).coordinates
            );

            if (this.handleHitsWithEdges(structureId,
                edgeId,
                edge,
                edgeMid,
                lastPoint,
                realCoords,
                (structureId, edgeId) => {
                    this.svgDrawer.edgeDrawer.tempSelectEdge(structureId, edgeId);
                }
            )) {
                return;
            }

            //check if edge is now fully inside selector
            const checkPoint = edgeMid;
            const reverse = LassoSelectionHandler.changeWindingNumber(lastPoint,
                firstPoint,
                checkPoint
            );
            const add_1 = LassoSelectionHandler.changeWindingNumber(lastPoint,
                realCoords,
                checkPoint
            );
            const add_2 = LassoSelectionHandler.changeWindingNumber(realCoords,
                firstPoint,
                checkPoint
            );
            edge.wn = edge.wn - reverse + add_1 + add_2;

            //if fully in or hit with 'closing line', confirm temp hit
            if (edge.wn !== 0 || this.handleHitsWithEdges(structureId,
                edgeId,
                edge,
                edgeMid,
                realCoords,
                firstPoint,
                () => {
                }
            )) {
                this.interactionState.interaction.addSelectionCandidate(structureId,
                    edgeId,
                    'edge'
                );
                this.svgDrawer.edgeDrawer.selectEdgeDrawarea(structureId, edgeId);
            }
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks if any NEW structure circles are hit by lasso selector.
     *
     * @param structure {Structure} - hit structure
     * @param structureId {Number} - id of hit structure
     * @param firstPoint {Object} - first point of lasso
     * @param lastPoint {Object} - last point of lasso
     * @param realCoords {Object} - new x- and y-coordinates of current cursor screen position
     * @param createCircleHitFn {Function} - checks if line hits a circle
     */
    checkNewStructureCirclesHit(structure,
        structureId,
        firstPoint,
        lastPoint,
        realCoords,
        createCircleHitFn
    ) {
        const structureCircle = structure.representationsData.structureCircle;
        const coords = structureCircle.coordinates;
        //already (NOT TEMP) selected structure circles stay selected
        if (!structure.representationsData.tempSelectedStructureCircle) {
            //intersection check with new line
            if (this.collisionFinder.testForStructureCircleCollision(structureId,
                createCircleHitFn(lastPoint, realCoords)
            )) {
                this.svgDrawer.structureCircleDrawer.tempSelectStructureCircle(structureId);
                //real hit, done here
            } else {
                //check if structureCircle is now fully inside selector
                const reverse = LassoSelectionHandler.changeWindingNumber(lastPoint,
                    firstPoint,
                    coords
                );
                const add_1 = LassoSelectionHandler.changeWindingNumber(lastPoint,
                    realCoords,
                    coords
                );
                const add_2 = LassoSelectionHandler.changeWindingNumber(realCoords,
                    firstPoint,
                    coords
                );
                structureCircle.wn = structureCircle.wn - reverse + add_1 + add_2;
                //if fully in or hit with 'closing line', confirm temp hit
                if (structureCircle.wn !== 0 ||
                    this.collisionFinder.testForStructureCircleCollision(structureId,
                        createCircleHitFn(realCoords, firstPoint)
                    )) {
                    this.interactionState.interaction.addSelectionCandidate(structureId,
                        structureId,
                        'structureCircle'
                    );
                    this.svgDrawer.structureCircleDrawer.selectStructureCircleDrawarea(structureId);
                }
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * If edge is not shown, try to guess if it would be hit otherwise,
     * do proper collision checks.
     *
     * @param structureId {Number} - id of hit structure
     * @param edgeId {Number} - id of hit edge
     * @param edge {Object} - hit edge
     * @param edgeMid {Object} - clicked point to check
     * @param p1 {Object} - first point defining line segment
     * @param p2 {Object} - second point defining line segment
     * @param callback {Object} - callback executed when edge is hit
     */
    handleHitsWithEdges(structureId, edgeId, edge, edgeMid, p1, p2, callback) {
        const edgeHidden = edge.hidden;
        if (edgeHidden) {
            if (LineCalculation.checkPointOnLineSegment(p1, p2, edgeMid)) {
                return true;
            }
        } else {
            const edgePoints = edge.getCollisionPointsByMode(this.opts.handleCollisionWith);
            const edgeLen = edgePoints.length;
            for (let idx_1 = 0; idx_1 < edgeLen; ++idx_1) {
                const idx_2 = idx_1 === edgeLen - 1 ? 0 : idx_1 + 1;
                const edgeP1 = edgePoints[idx_1];
                const edgeP2 = edgePoints[idx_2];
                if (LineCalculation.checkTwoLineSegmentsInteract(edgeP1, edgeP2, p1, p2)) {
                    callback(structureId, edgeId);
                    return true;
                }
            }
        }
        return false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Uses isLeft property to update winding number for atoms.
     */
    static changeWindingNumber(first, second, point) {
        if (second.y <= point.y) {
            if (first.y > point.y && !LineCalculation.isLeft(second, first, point)) {
                return 1;
            }
        } else {
            if (first.y <= point.y && LineCalculation.isLeft(second, first, point)) {
                return -1;
            }
        }
        return 0;
    }
}