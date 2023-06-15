/**
 * Creates data for different edge types for drawing.
 */
class EdgeBuilder {
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
     * Creates an object that holds all the relevant information to draw a
     * bond (i.e. "drawPoints": array of endpoints of lines, "midpoints": the
     * points in the middle of either end of the bond, "edgeCollisionPoints":
     * corners of a rectangle representing only (!) the drawn bond,
     * "selCollisionPoints": corners of a rectangle representing the bond's
     * surrounding selection shape, and "selWidth": the width of the bond's
     * surrounding selection shape). As a fail-safe, this function is allowed
     * to return null whenever an edge cannot be drawn (or should not be drawn
     * for aesthetic reasons). Such null return must then be caught (here that
     * is handled usually by letting the createEdgeUpdateFunction decide how to
     * proceed with such a draw information).
     *
     * @param from {Number} - atom id of the first atom involved in the bond
     * @param to {Number} - atom id of the second atom involved in the bond
     * @param structure {Structure} - Structure object which holds the bond
     * @param edge {Edge} - Edge object representing the bond
     * @param byTemp {Boolean} - whether to base bond creation on temporary
     * coordinates of involved atoms
     * @returns {null|Object} - draw information for the bond
     */
    createBondByType(from, to, structure, edge, byTemp) {
        const fromAtom = structure.atomsData.getAtom(from);
        const toAtom = structure.atomsData.getAtom(to);
        //directionCheck set to false. 1DFG has a strange ligand bond but looks ok otherwise. The
        //original PoseView draws that PDB despite that
        const midpoints = this.getEdgeMidPoints(fromAtom, toAtom, byTemp, false);
        if (!midpoints) {
            return null;
        }
        const [midFrom, midTo] = midpoints;
        switch (edge.type) {
            case 'single':
                if (edge.aromatic) {
                    if (edge.isAromaticNoRing()) {
                        return this.createOffsetDoubleBond(edge,
                            structure,
                            midFrom,
                            midTo,
                            byTemp,
                            true
                        );
                    } else {
                        return this.createSingleBondWithAromaticOffsets(midFrom,
                            midTo,
                            structure,
                            edge.aromaticRings,
                            byTemp
                        );
                    }
                } else {
                    return this.createSingleEdge(midFrom, midTo);
                }
            case 'double':
                if (edge.drawWithOffset) {
                    return this.createOffsetDoubleBond(edge,
                        structure,
                        midFrom,
                        midTo,
                        byTemp,
                        false
                    );
                }
                return this.createDoubleBond(midFrom, midTo);
            case 'triple':
                return this.createTripleBond(midFrom, midTo);
            case 'stereoFront':
                return this.createStereoFront(midFrom, midTo);
            case 'stereoFrontReverse':
                return this.createStereoFront(midTo, midFrom);
            case 'stereoBack':
                return this.createStereoBack(midFrom, midTo);
            case 'stereoBackReverse':
                return this.createStereoBack(midTo, midFrom);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates draw information to draw an edge, e.g. single bond.
     *
     * @param from {Object} - x- and y-coordinates of first involved object
     * @param to {Object} - x- and y-coordinates of second involved object
     * @returns {Object} - draw information for the bond
     */
    createSingleEdge(from, to) {
        const normals = LineCalculation.findUnitNormals(from, to);

        const bondWidth = this.opts.lineWidth;
        const selWidth = 2 * this.opts.edgeSelectorOffset + bondWidth;

        return {
            drawPoints: [[from, to]],
            midpoints: [from, to],
            edgeCollisionPoints: PolygonCalculation.createRectFromLine(from,
                to,
                normals,
                bondWidth / 2
            ),
            selCollisionPoints: PolygonCalculation.createRectFromLine(from,
                to,
                normals,
                selWidth / 2
            ),
            selWidth: selWidth
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Bonds connecting atoms represented by text labels are not allowed to
     * reach into a clear zone around such text (defined by this.opts.atomRadius).
     * Bonds (in this case interactions between structures) connected to
     * a structure circle should be shortened to end at the edge of the circle.
     * This function shortens such bonds accordingly and returns the new
     * midpoints to be used for drawing the bond.
     *
     * @param from {Object} - first atom or structure circle to connect
     * @param to {Object} - second atom or structure circle to connect
     * @param byTemp {Boolean} - whether temporary or real coordinates
     * shall be used
     * @param directionCheck {Boolean} - if true, return null if shortening
     * leads to a invalid line in the opposite direction.
     * @param forcedMinDist {Number} - a forced minimal distance to be kept
     * from the atom
     * @returns {Array} - the two new midpoints of the bond
     */
    getEdgeMidPoints(from, to, byTemp = false, directionCheck = false, forcedMinDist = 0) {
        const fromCoords = byTemp ? from.tempCoordinates : from.coordinates;
        const toCoords = byTemp ? to.tempCoordinates : to.coordinates;

        //check which label the edge has to keep a distance from or
        //if from/to is a structureCircle
        const mustKeepDistFrom = (from.label && !from.isLabel) || from.isStructureCircle;
        const mustKeepDistTo = (to.label && !to.isLabel) || to.isStructureCircle;

        //if no distances must be kept, just return original coordinates
        if (forcedMinDist <= 0 && !mustKeepDistFrom && !mustKeepDistTo) {
            return [fromCoords, toCoords];
        }

        //calculate new positions
        const fromRad = from.isStructureCircle ? from.rad : this.opts.atomRadius;
        const toRad = to.isStructureCircle ? to.rad : this.opts.atomRadius;
        const fromDist = mustKeepDistFrom ? Math.max(forcedMinDist, fromRad) : forcedMinDist;
        const toDist = mustKeepDistTo ? Math.max(forcedMinDist, toRad) : forcedMinDist;

        return LineCalculation.shortenLine(fromCoords, toCoords, fromDist, toDist, directionCheck);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates draw information to draw the first bond to be used for the
     * representation of an aromatic bond (the non-dashed one).
     *
     * @param from {Object} - x- and y-coordinates of first involved atom
     * @param to {Object} - x- and y-coordinates of second involved atom
     * @param structure {Structure} - the Structure object which holds the bond
     * @param aromRings {Array} - which aromatic rings the bond is included in
     * @param byTemp {Boolean} - whether to base bond creation on temporary
     * coordinates of involved atoms
     * @returns {Object} - draw information for the bond
     */
    createSingleBondWithAromaticOffsets(from, to, structure, aromRings, byTemp) {
        const normals = LineCalculation.findUnitNormals(from, to);

        let bondWidth = 2 * this.opts.lineWidth + this.opts.spaceToRing;
        let selWidth = 2 * this.opts.edgeSelectorOffset + bondWidth;

        const coordParam = byTemp ? 'tempCoordinates' : 'coordinates';
        let newFrom = from, newTo = to;
        if (aromRings.size === 1) {
            //find correct normal (the one that points inside the ring)
            const midPoint = PointCalculation.findEdgeMidpoint(from, to);
            let normal = normals[0];
            const proj = {
                x: midPoint.x + normal.x, y: midPoint.y + normal.y
            };
            const ring = structure.ringsData.getRing(aromRings.values().next().value);
            const ringCoords = ring.atoms.map(atom => {
                return atom[coordParam];
            });
            if (!PolygonCalculation.checkCollisionPolygonPoint(proj, ringCoords)) {
                normal = normals[1];
            }
            //move to real midpoint, add lineWidth for real distance
            const halfDist = (this.opts.spaceToRing + this.opts.lineWidth) / 2;
            newFrom = {
                x: from.x + halfDist * normal.x, y: from.y + halfDist * normal.y
            };
            newTo = {
                x: to.x + halfDist * normal.x, y: to.y + halfDist * normal.y
            };
        } else {
            const addedWidth = this.opts.lineWidth + this.opts.spaceToRing;
            bondWidth += addedWidth;
            selWidth += addedWidth;
        }

        return {
            drawPoints: [[from, to]],
            midpoints: [newFrom, newTo],
            edgeCollisionPoints: PolygonCalculation.createRectFromLine(newFrom,
                newTo,
                normals,
                bondWidth / 2
            ),
            selCollisionPoints: PolygonCalculation.createRectFromLine(newFrom,
                newTo,
                normals,
                selWidth / 2
            ),
            selWidth: selWidth
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates draw information to draw a double bond in a special way, s.t the
     * first bond is drawn like a single bond and the other bond is drawn on
     * the "less full" side of the bond (i.e., the side on which fewer
     * substituents lie) or preferable inside a ring as a shortened line.
     *
     * @param edge {Edge} - the Wdge object representing the bond
     * @param structure {Structure} - the Structure object holding the bond
     * @param fromCoords {Object} - x- and y-coordinates of first involved
     * atom
     * @param toCoords {Object} - x- and y-coordinates of second involved atom
     * @param byTemp {Boolean} - whether to base bond creation on temporary
     * coordinates of involved atoms
     * @returns {Object} - draw information for the bond
     */
    createOffsetDoubleBond(edge, structure, fromCoords, toCoords, byTemp, aromaticNoRing) {
        const {from, to, cyclic} = edge;

        const normals = LineCalculation.findUnitNormals(fromCoords, toCoords);
        const coordParam = byTemp ? 'tempCoordinates' : 'coordinates';

        //find the normal on previously determined side and get dist vector
        let normal = normals[0];
        const mid = PointCalculation.findEdgeMidpoint(fromCoords, toCoords);
        const proj = {
            x: mid.x + normal.x, y: mid.y + normal.y
        };
        const projSide = LineCalculation.getSideOfLine(fromCoords, toCoords, proj);
        //for cyclic edges, make sure that projected side is within ring
        if (cyclic) {
            const ring = structure.ringsData.getRing(edge.drawnInRing);
            const ringCoords = ring.atoms.map(atom => {
                return atom[coordParam];
            });
            if (!PolygonCalculation.checkCollisionPolygonPoint(proj, ringCoords)) {
                normal = normals[1];
            }
        } else {
            if (projSide !== this.fullerSize(structure,
                coordParam,
                edge,
                fromCoords,
                toCoords,
                aromaticNoRing
            )) {
                normal = normals[1];
            }
        }

        //add lineWidth bc to reach mid of other line, go through half of both
        const offset = this.opts.spaceBetweenDouble + this.opts.lineWidth;
        const innerLineInfo = LineCalculation.createInnerLine(fromCoords,
            toCoords,
            normal,
            offset,
            this.opts.cutoffAngleDouble
        );

        const [secondFrom, secondTo] = innerLineInfo.points;

        //midpoint is point between
        const midpointFrom = {
            x: (secondFrom.x + fromCoords.x) / 2, y: (secondFrom.y + fromCoords.y) / 2
        };
        const midpointTo = {
            x: (secondTo.x + toCoords.x) / 2, y: (secondTo.y + toCoords.y) / 2
        };

        //finalize return values
        const drawPoints = [[fromCoords, toCoords]];
        if (innerLineInfo.secondMakesSense) {
            drawPoints.push([secondFrom, secondTo]);
        }
        const bondWidth = this.opts.spaceBetweenDouble + this.opts.lineWidth * 2;
        const selWidth = 2 * this.opts.edgeSelectorOffset + bondWidth;

        return {
            drawPoints: drawPoints,
            midpoints: [midpointFrom, midpointTo],
            edgeCollisionPoints: PolygonCalculation.createRectFromLine(midpointFrom,
                midpointTo,
                normals,
                bondWidth / 2
            ),
            selCollisionPoints: PolygonCalculation.createRectFromLine(midpointFrom,
                midpointTo,
                normals,
                selWidth / 2
            ),
            selWidth: selWidth
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * For non cyclic edges, puts them on the fuller side.
     *
     * @param structure {Structure} - the Structure object holding the bond
     * @param coordParam {String} - 'tempCoordinates' or 'coordinates'
     * @param edge {Edge} - the Edge object representing the bond
     * @param fromCoords {Object} - x- and y-coordinates of first involved
     * atom
     * @param toCoords {Object} - x- and y-coordinates of second involved atom
     */
    fullerSize(structure, coordParam, edge, fromCoords, toCoords, aromaticNoRing) {
        const {from, to, cyclic} = edge;
        //fetch representation for neighbors on both side of edge
        const fromNbs = structure.atomsData.neighbors[from]
            .filter(({neighbor}) => {
                if (aromaticNoRing) {
                    const edge = structure.edgesData.getEdgeByAtomIds(from, neighbor);
                    return neighbor !== to && edge.isAromaticNoRing()
                }
                return neighbor !== to
            });
        const toNbs = structure.atomsData.neighbors[to].filter(({neighbor}) => {
            if (aromaticNoRing) {
                const edge = structure.edgesData.getEdgeByAtomIds(to, neighbor);
                return neighbor !== from && edge.isAromaticNoRing()
            }
            return neighbor !== from
        });
        const allNbCoordinates = [fromNbs, toNbs].flat()
            .map(nbInfo => {
                const atom = structure.atomsData.getAtom(nbInfo.neighbor);
                return {
                    coordinates: atom[coordParam], inRing: atom.isInRing
                };
            });

        //check for fuller side
        let nrSide_1 = 0, nrSide_2 = 0, side_1 = -1, side_2 = 1;
        allNbCoordinates.forEach(({coordinates: nbCoords}) => {
            const side = LineCalculation.getSideOfLine(fromCoords, toCoords, nbCoords);
            if (side === side_1) {
                nrSide_1++;
            } else if (side === side_2) {
                nrSide_2++;
            }
        });
        //place on fuller side
        return (nrSide_1 > nrSide_2) ? side_1 : side_2;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates draw information to draw a double bond.
     *
     * @param from {Object} - x- and y-coordinates of first involved atom
     * @param to {Object} - x- and y-coordinates of second involved atom
     * @returns {Object} - draw information for the bond
     */
    createDoubleBond(from, to) {
        const normals = LineCalculation.findUnitNormals(from, to);

        //add half line width bc go through half of other line to reach its mid
        const offset = (this.opts.spaceBetweenDouble) / 2 + this.opts.lineWidth / 2;

        const leftFrom = VectorCalculation.vectorAdd(from,
            VectorCalculation.scalarMult(normals[0], offset)
        );
        const leftTo = VectorCalculation.vectorAdd(to,
            VectorCalculation.scalarMult(normals[0], offset)
        );

        const rightFrom = VectorCalculation.vectorAdd(from,
            VectorCalculation.scalarMult(normals[1], offset)
        );
        const rightTo = VectorCalculation.vectorAdd(to,
            VectorCalculation.scalarMult(normals[1], offset)
        );

        const bondWidth = this.opts.spaceBetweenDouble + this.opts.lineWidth * 2;
        const selWidth = 2 * (this.opts.edgeSelectorOffset) + bondWidth;

        return {
            drawPoints: [[leftFrom, leftTo], [rightFrom, rightTo]],
            midpoints: [from, to],
            edgeCollisionPoints: PolygonCalculation.createRectFromLine(from,
                to,
                normals,
                bondWidth / 2
            ),
            selCollisionPoints: PolygonCalculation.createRectFromLine(from,
                to,
                normals,
                selWidth / 2
            ),
            selWidth: selWidth
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates draw information to draw a triple bond.
     *
     * @param from {Object} - x- and y-coordinates of first involved atom
     * @param to {Object} - x- and y-coordinates of second involved atom
     * @returns {Object} - draw information for the bond
     */
    createTripleBond(from, to) {
        const normals = LineCalculation.findUnitNormals(from, to);

        //two halves between two midpoints
        const offset = this.opts.spaceBetweenTriple + this.opts.lineWidth;

        const leftFrom = VectorCalculation.vectorAdd(from,
            VectorCalculation.scalarMult(normals[0], offset)
        );
        const leftTo = VectorCalculation.vectorAdd(to,
            VectorCalculation.scalarMult(normals[0], offset)
        );

        const rightFrom = VectorCalculation.vectorAdd(from,
            VectorCalculation.scalarMult(normals[1], offset)
        );
        const rightTo = VectorCalculation.vectorAdd(to,
            VectorCalculation.scalarMult(normals[1], offset)
        );

        const bondWidth = this.opts.spaceBetweenTriple * 2 + this.opts.lineWidth * 3;
        const selWidth = 2 * this.opts.edgeSelectorOffset + bondWidth;

        return {
            drawPoints: [
                [leftFrom, leftTo], [from, to], [rightFrom, rightTo]
            ],
            midpoints: [from, to],
            edgeCollisionPoints: PolygonCalculation.createRectFromLine(from,
                to,
                normals,
                bondWidth / 2
            ),
            selCollisionPoints: PolygonCalculation.createRectFromLine(from,
                to,
                normals,
                selWidth / 2
            ),
            selWidth: selWidth
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the draw information to draw a front-facing stereo bond between
     * two points, opening up towards the second point.
     *
     * @param from {Object} - x- and y-coordinates of first involved atom
     * @param to {Object} - x- and y-coordinates of second involved atom
     * @returns {Object} - draw information for the bond
     */
    createStereoFront(from, to) {
        const normals = LineCalculation.findUnitNormals(from, to);
        const baseSideOffset = this.opts.wedgeBaseWidth / 2;
        const fullSideOffset = this.opts.wedgeFullWidth / 2;

        const A = VectorCalculation.vectorAdd(from,
            VectorCalculation.scalarMult(normals[0], baseSideOffset)
        );
        const B = VectorCalculation.vectorAdd(from,
            VectorCalculation.scalarMult(normals[1], baseSideOffset)
        );
        const C = VectorCalculation.vectorAdd(to,
            VectorCalculation.scalarMult(normals[0], fullSideOffset)
        );
        const D = VectorCalculation.vectorAdd(to,
            VectorCalculation.scalarMult(normals[1], fullSideOffset)
        );

        const bondWidth = this.opts.lineWidth;
        const selWidth = 2 * (this.opts.edgeSelectorOffset) + bondWidth;

        return {
            drawPoints: [[B, A, C, D]],
            midpoints: [from, to],
            edgeCollisionPoints: [B, A, C, D],
            selCollisionPoints: PolygonCalculation.createRectFromLine(from,
                to,
                normals,
                selWidth / 2
            ),
            selWidth: selWidth
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the draw information to draw a back-facing stereo bond between
     * two points, opening up towards the second point. This is done by
     * creating multiple horizontal lines separated by free space of a certain
     * width defined by this.opts.wedgeSpacing.
     *
     * @param from {Object} - x- and y-coordinates of first involved atom
     * @param to {Object} - x- and y-coordinates of second involved atom
     * @returns {Object} - draw information for the bond
     */
    createStereoBack(from, to) {
        const wedgeWidth = this.opts.lineWidth;
        const wedgeSpacing = this.opts.wedgeSpacing;

        const normals = LineCalculation.findUnitNormals(from, to);
        const triangle = this.createTriangle(from, to);
        const [A, C, D] = triangle.drawPoints[0];
        const mid = {
            x: (C.x + D.x) / 2, y: (C.y + D.y) / 2
        };

        const {x: normalX, y: normalY} = normals[0]; //only need one normal
        const maxDist = Math.sqrt((mid.x - from.x) ** 2 + (mid.y - from.y) ** 2);

        //vector from A to mid between C and D
        const lineMov = PointCalculation.createMovementBetweenTwoPoints(A, mid);
        const ACVec = VectorCalculation.normalize({
            x: A.x - C.x, y: A.y - C.y
        });
        const ACNext = {
            x: A.x + ACVec.x, y: A.y + ACVec.y
        };
        const ACLine = LineCalculation.createLinearFunctionByTwoPoints(A, ACNext);

        let nextAddedDist = wedgeWidth / 2;
        let curDistance = nextAddedDist;
        const drawPoints = [];
        while (curDistance <= maxDist) {
            //move along line to next point
            const nextLinePoint = lineMov.forward(nextAddedDist);
            const proj = {
                x: nextLinePoint.x + normalX, y: nextLinePoint.y + normalY
            };
            const nextLine = LineCalculation.createLinearFunctionByTwoPoints(nextLinePoint, proj);
            //this is intersection point
            const firstLineNext = LineCalculation.findIntersectionTwoLines(ACLine, nextLine);

            //this is equivalent to the inverted offsets from nextLinePoint
            //to firstLineNext
            const offsetsToSecond = {
                x: nextLinePoint.x - firstLineNext.x, y: nextLinePoint.y - firstLineNext.y
            };
            const secondLineNext = {
                x: nextLinePoint.x + offsetsToSecond.x, y: nextLinePoint.y + offsetsToSecond.y
            };

            drawPoints.push([firstLineNext, secondLineNext]);

            nextAddedDist = wedgeWidth + wedgeSpacing;
            curDistance += nextAddedDist;
        }

        return {
            drawPoints: drawPoints,
            midpoints: triangle.midpoints,
            edgeCollisionPoints: triangle.edgeCollisionPoints,
            selCollisionPoints: triangle.selCollisionPoints,
            selWidth: triangle.selWidth
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates draw information to draw a triangle between two points, the
     * triangle opening up towards the second point.
     *
     * @param from {Object} - x- and y-coordinates of first involved atom
     * @param to {Object} - x- and y-coordinates of second involved atom
     * @returns {Object} - draw information for the triangle
     */
    createTriangle(from, to) {
        const normals = LineCalculation.findUnitNormals(from, to);
        const fullSideOffset = this.opts.wedgeFullWidth / 2;

        const C = VectorCalculation.vectorAdd(to,
            VectorCalculation.scalarMult(normals[0], fullSideOffset)
        );
        const D = VectorCalculation.vectorAdd(to,
            VectorCalculation.scalarMult(normals[1], fullSideOffset)
        );

        const bondWidth = this.opts.lineWidth;
        const selWidth = 2 * (this.opts.edgeSelectorOffset) + bondWidth;

        return {
            drawPoints: [[from, C, D]],
            midpoints: [from, to],
            edgeCollisionPoints: [from, C, D],
            selCollisionPoints: PolygonCalculation.createRectFromLine(from,
                to,
                normals,
                selWidth / 2
            ),
            selWidth: selWidth
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Determines on basis of current representation of the involved structures
     * whether to use coordinates of the atom(s) or the structure circle(s) to
     * draw a intermolecular bond. If both involved structures are currently
     * represented as structure circles also offset the coordinates according
     * to their order in intermolecularConnections so they don't overlap.
     *
     * @param id {Number} - id of the intermolecular connection
     * @param type {String} - type of the intermolecular connection
     * @param fromStructure {Object} - structure from where to draw connection
     * @param toStructure {Object} - structure to where to draw the connection
     * @param from {Number} - id of atom/ring from where to draw the connection
     * @param to {Number} - id of atom/ring to where to draw the connection
     * @param byTemp {Boolean} - whether to use temp coordinates
     * @return {Array} - fromCoords and toCoords of the connection
     *
     */
    getNewIntermolecularCoords(id, type, fromStructure, toStructure, from, to, byTemp = false) {
        if (fromStructure.representationsData.isCurRepresentation(StructureRepresentation.circle) &&
            toStructure.representationsData.isCurRepresentation(StructureRepresentation.circle)) {
            //add a offset to the connections so they do not overlap
            //reorder the structures so that the one with smaller index always is
            //'from' to have consistent results over multiple connections
            return this.getCoordsBetweenTwoStructureCircles(id,
                type,
                fromStructure,
                toStructure,
                byTemp
            );
        }

        let fromObj, toObj;
        const getRingCenter = (structure, ringId) => {
            const centroid = structure.ringsData.getRing(ringId).centroidInfo.centroid;
            return {
                coordinates: centroid, tempCoordinates: centroid
            }
        };

        if (fromStructure.representationsData.isCurRepresentation(StructureRepresentation.circle)) {
            fromObj = fromStructure.representationsData.structureCircle;
        } else {
            switch (type) {
                case 'distances':
                case 'interactions':
                    fromObj = this.sceneData.annotationsData.annotations[from];
                    break;
                case 'atomPairInteractions':
                    fromObj = fromStructure.atomsData.getAtom(from);
                    break;
                case 'cationPiStackings':
                case 'piStackings':
                    fromObj = getRingCenter(fromStructure, from);
            }
        }
        if (toStructure.representationsData.isCurRepresentation(StructureRepresentation.circle)) {
            toObj = toStructure.representationsData.structureCircle;
        } else {
            switch (type) {
                case 'distances':
                case 'interactions':
                    toObj = this.sceneData.annotationsData.annotations[to];
                    break;
                case 'atomPairInteractions':
                case 'cationPiStackings':
                    toObj = toStructure.atomsData.getAtom(to);
                    break;
                case 'piStackings':
                    toObj = getRingCenter(toStructure, to);
            }
        }
        //returns [{x,y}, {x,y}]
        return this.getEdgeMidPoints(fromObj, toObj, byTemp);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Calculates coordinates between two structure circles for drawing of
     * intermolecular edges.
     *
     * @param id {Number} - id of the intermolecular connection
     * @param type {String} - type of the intermolecular connection
     * @param fromStructure {Object} - structure from where to draw connection
     * @param toStructure {Object} - structure to where to draw the connection
     * @param byTemp {Boolean} - whether to use temp coordinates
     * @return {Array} - fromCoords and toCoords of the intermolecular connection
     */
    getCoordsBetweenTwoStructureCircles(id, type, fromStructure, toStructure, byTemp = false) {
        const [lowerStructure, higherStructure, swapped] = fromStructure.id < toStructure.id ? [
            fromStructure, toStructure, false
        ] : [toStructure, fromStructure, true];
        //radius defines the max available space to move the connections
        //just take the smaller one to have parallel lines in the end
        const lowerRad = lowerStructure.representationsData.structureCircle.rad;
        const higherRad = higherStructure.representationsData.structureCircle.rad;
        const maxSpace = Math.min(lowerRad, higherRad);
        //set this so that they barely not touch
        const maxDistBetweenConnections = this.opts.piPiRadius * 2.1;
        //since this.sceneData.structuresData.intermolecularConnections is ordered so that the
        // smaller id comes first
        const intermolecularOrder = this.sceneData.structuresData.intermolecularConnections
            [lowerStructure.id][higherStructure.id];
        const connectionCount = intermolecularOrder.length;
        const connectionIdx = intermolecularOrder.findIndex(elem => {
            return elem.type === type && elem.id == id;
        });
        //actual distance between connections and the space taken by all
        //connections (perpendicular to the connections)
        const [distBetween, space] = (maxSpace / (connectionCount - 1) >=
            maxDistBetweenConnections) ? [
            maxDistBetweenConnections, (connectionCount - 1) * maxDistBetweenConnections
        ] : [
            maxSpace / (connectionCount - 1), maxSpace
        ];
        //offset of connection from one end of the available space
        const offset = connectionIdx * distBetween;
        //structure circle midpoints
        const lowerMid = byTemp ?
            lowerStructure.representationsData.structureCircle.tempCoordinates :
            lowerStructure.representationsData.structureCircle.coordinates;
        const higherMid = byTemp ?
            higherStructure.representationsData.structureCircle.tempCoordinates :
            higherStructure.representationsData.structureCircle.coordinates;
        //find a parallel line where the connection is a section of
        const rotatedMid = PointCalculation.rotatePointAroundAnother(higherMid,
            lowerMid,
            90,
            false
        );
        const rotatedNormalizedVector = VectorCalculation.normalize(VectorCalculation.vectorizeLine(lowerMid,
            rotatedMid
        ));
        const distFromMid = space / 2 - offset;
        const directedDist = VectorCalculation.scalarMult(rotatedNormalizedVector, distFromMid);
        const [newFrom, newTo] = VectorCalculation.findParallelLineByDistVec(lowerMid,
            higherMid,
            directedDist
        );
        //endpoints are still inside the circle.
        //move points to the edge of the structure circle
        const distToCircleEdgeFrom = Math.sqrt(lowerRad ** 2 - distFromMid ** 2);
        const lowerCoords = PointCalculation.movePointTowardsAnother(newFrom,
            newTo,
            distToCircleEdgeFrom
        );
        const distToCircleEdgeTo = Math.sqrt(higherRad ** 2 - distFromMid ** 2);
        const higherCoords = PointCalculation.movePointTowardsAnother(newTo,
            newFrom,
            distToCircleEdgeTo
        );
        //swapped is necessary to determine where to draw the pi circle
        //when drawing cation pi connections
        return swapped ? [higherCoords, lowerCoords] : [lowerCoords, higherCoords];
    }
}