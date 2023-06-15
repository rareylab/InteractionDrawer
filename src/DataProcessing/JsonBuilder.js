/**
 * Converts currently stored structural data data to JSON that represents the scene.
 */
class JsonBuilder {
    /**
     * Contains instances for data access and configuration options.
     *
     * @param sceneData {Object} - data storage
     * @param opts {Object} - configuration options for the drawer
     */
    constructor(sceneData, opts) {
        this.sceneData = sceneData;
        this.opts = opts;

        const options = {
            explicitHydrogens: true,
            compactDrawing: false,
        };
        this.smilesDrawer = new SmilesDrawer.Drawer(options);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Accumulate the internal structural data of the scene into a string in
     * the same JSON format that is used in the drawer's input.
     *
     * @param enabled {Boolean} - return only not removed elements
     * @param defaultCoords {Boolean} - return circle representation coordinates for annotations
     * @returns {String} - structural data in JSON format
     */
    getJson(enabled = false, defaultCoords = false) {
        const structureInfo = this.getStructureJson(enabled);
        const [atomPairInteractionInfo, piPiInfo, cationPiInfo] =
            this.getIntermolecularJson(enabled);
        const hydrophobicInfo = this.getHydrophobicJson(enabled);
        const annotationInfo = this.getAnnotationJson(enabled, defaultCoords);
        return JSON.stringify({
            scene: {
                structures: structureInfo,
                atomPairInteractions: atomPairInteractionInfo,
                piStackings: piPiInfo,
                cationPiStackings: cationPiInfo,
                hydrophobicContacts: hydrophobicInfo,
                annotations: annotationInfo
            }
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Accumulate the internal structural data of the scene and the config
     * into a string in the same JSON format that is used in the drawer's input.
     *
     * @param enabled {Boolean} - return only not removed elements
     * @param defaultCoords {Boolean} - return circle representation coordinates for annotations
     * @returns {String} - structural data in JSON format
     */
    getJsonWithConfig(enabled = false, defaultCoords = false) {
        const structureInfo = this.getStructureJson(enabled);
        const [atomPairInteractionInfo, piPiInfo, cationPiInfo] =
            this.getIntermolecularJson(enabled);
        const hydrophobicInfo = this.getHydrophobicJson(enabled);
        const annotationInfo = this.getAnnotationJson(enabled, defaultCoords);
        return JSON.stringify({
            opts: this.opts,
            diagram: {
                scene: {
                    structures: structureInfo,
                    atomPairInteractions: atomPairInteractionInfo,
                    piStackings: piPiInfo,
                    cationPiStackings: cationPiInfo,
                    hydrophobicContacts: hydrophobicInfo,
                    annotations: annotationInfo
                }
            }
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Accumulate the internal structural data for structures in the same JSON
     * format that is used in the drawer's input.
     *
     * @param enabled {Boolean} - return only not removed elements
     * @returns {Array} - structural data of structures in JSON format
     */
    getStructureJson(enabled = false) {
        const structureInfo = [];
        Object.values(this.sceneData.structuresData.structures).forEach(structure => {
            if (enabled && !structure.enabled) {
                return;
            }
            const atomInfo = [];
            structure.atomsData.atoms.forEach(atom => {
                if (atom.enabled) {
                    atomInfo.push({
                        id: atom.id,
                        label: atom.label,
                        stereoCenter: atom.stereoCenter,
                        element: atom.element,
                        charge: atom.charge,
                        hydrogenCount: atom.hydrogenCount,
                        coordinates: Object.assign({}, atom.coordinates),
                        aromatic: atom.aromatic,
                        additionalInformation: atom.additionalInformation
                    });
                }
            });
            const edgeInfo = [];
            structure.edgesData.edges.forEach(edge => {
                if (edge.enabled) {
                    edgeInfo.push({
                        id: edge.id,
                        from: edge.from,
                        to: edge.to,
                        type: edge.type,
                        aromatic: edge.aromatic
                    });
                }
            });
            const ringInfo = [];
            //edges could be added for rings
            for (const ringId in structure.ringsData.rings) {
                const ring = structure.ringsData.getRing(ringId);
                ringInfo.push({
                    id: ring.id, atoms: ring.atoms.map(atom => {
                        return atom.id;
                    })
                });
            }
            //ring system info could be added
            structureInfo.push({
                id: structure.id,
                structureName: structure.structureName,
                structureLabel: structure.structureLabel,
                structureType: structure.structureType,
                representation: structure.representationsData.currentRepresentation,
                additionalInformation: structure.additionalInformation,
                atoms: atomInfo,
                bonds: edgeInfo,
                rings: ringInfo,
                selectedAtoms: [...structure.atomsData.selectedAtoms],
                selectedEdges: [...structure.edgesData.selectedEdges]
            });
        });
        return structureInfo;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Accumulate the internal structural data for intermolecular forces in
     * the same JSON format that is used in the drawer's input.
     *
     * @param enabled {Boolean} - return only not removed elements
     * @returns {Array} - structural data of intermolecular forces in JSON format
     */
    getIntermolecularJson(enabled = false) {
        const intermolecularData = this.sceneData.intermolecularData;
        const atomPairInteractionInfo = [];
        Object.entries(intermolecularData.atomPairInteractions)
            .forEach(([atomPairInteractionId, atomPairInteraction]) => {
                if (enabled && !atomPairInteraction.enabled) {
                    return;
                }
                atomPairInteractionInfo.push({
                    id: parseInt(atomPairInteractionId),
                    fromStructure: atomPairInteraction.fromStructure,
                    toStructure: atomPairInteraction.toStructure,
                    from: atomPairInteraction.from,
                    to: atomPairInteraction.to,
                    additionalInformation: atomPairInteraction.additionalInformation
                });
            });
        //get necessary pi stacking data
        const piPiInfo = [];
        Object.entries(intermolecularData.piStackings).forEach(([piStackId, piStacking]) => {
            if (enabled && !piStacking.enabled) {
                return;
            }
            piPiInfo.push({
                id: parseInt(piStackId),
                fromStructure: piStacking.fromStructure,
                toStructure: piStacking.toStructure,
                from: piStacking.from,
                to: piStacking.to,
                additionalInformation: piStacking.additionalInformation
            });
        });
        //get necessary cation-pi stacking data
        const cationPiInfo = [];
        Object.entries(intermolecularData.cationPiStackings).forEach(([catPiId, catPiStacking]) => {
            if (enabled && !catPiStacking.enabled) {
                return;
            }
            cationPiInfo.push({
                id: parseInt(catPiId),
                fromStructure: catPiStacking.fromStructure,
                toStructure: catPiStacking.toStructure,
                from: catPiStacking.from,
                to: catPiStacking.to,
                additionalInformation: catPiStacking.additionalInformation
            });
        });
        return [atomPairInteractionInfo, piPiInfo, cationPiInfo];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Accumulate the internal structural data for hydrophobic contacts in
     * the same JSON format that is used in the drawer's input.
     *
     * @param enabled {Boolean} - return only not removed elements
     * @returns {Array} - structural data of hydrophobic contacts in JSON format
     */
    getHydrophobicJson(enabled = false) {
        const hydrophobicInfo = [];
        Object.entries(this.sceneData.hydrophobicData.hydrophobicContacts)
            .forEach(([hydrophobicId, hydrophobicContact]) => {
                if (enabled && !hydrophobicContact.enabled) {
                    return;
                }
                let controlPoints = hydrophobicContact.controlPoints;
                if (enabled) {
                    controlPoints = hydrophobicContact.controlPoints.filter(cp => cp.enabled);
                }
                controlPoints = controlPoints.map(({
                    x, y, atomLinks
                }) => {
                    return {
                        x: x, y: y, atomLinks: atomLinks
                    }
                });
                hydrophobicInfo.push({
                    id: parseInt(hydrophobicId),
                    belongsTo: hydrophobicContact.structureLink,
                    controlPoints: controlPoints
                });
            });
        return hydrophobicInfo;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Accumulate the internal structural data for annotations in
     * the same JSON format that is used in the drawer's input.
     *
     * @param enabled {Boolean} - return only not removed elements
     * @param defaultCoords {Boolean} - return only default representation coordinates for
     * annotations
     * @returns {Array} - structural data of annotations in JSON format
     */
    getAnnotationJson(enabled = false, defaultCoords = false) {
        const annotationsInfo = [];
        Object.values(this.sceneData.annotationsData.annotations).forEach(annotation => {
            if (enabled && !annotation.enabled) {
                return;
            }
            const annotationInfo = {
                id: annotation.id,
                label: annotation.label,
                isStructureLabel: annotation.isStructureLabel,
                additionalInformation: annotation.additionalInformation
            };

            if (annotation.color !== this.opts.colors.DEFAULT) {
                annotationInfo.color = annotation.color;
            }

            let coordinates = annotation.coordinates;

            if (annotation.belongsToStructure) {
                annotationInfo.belongsTo = {
                    type: annotation.type,
                    id: annotation.structureLink,
                    atomLinks: annotation.atomLinks
                };
                const structureID = annotation.structureLink;
                const structures = this.sceneData.structuresData.structures;
                const structure = structures[structureID.toString()];
                //take non circle representation coordinates if other representations are set
                if (defaultCoords &&
                    !structure.representationsData.isCurRepresentation(
                        StructureRepresentation.default) &&
                    annotation.structureRepresentationInfo[StructureRepresentation.default]) {
                    coordinates =
                        annotation.structureRepresentationInfo[
                            StructureRepresentation.default].coordinates;
                }
            }
            annotationInfo.coordinates = coordinates;
            annotationsInfo.push(annotationInfo);
        });
        return annotationsInfo;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Converts a SMILES expression to a structure JSON readable by the library.
     *
     * @param smilesString {String} - SMILES of the structure
     * @returns {Object} - structure data in JSON format
     */
    getJsonBySmiles(smilesString) {
        const {
            success, atomInfo, edgeInfo, ringInfo, unclearStereoEdges, stereoCenters
        } = this.translateInput(smilesString);
        const unassignedStereoCenters = new Set(stereoCenters);
        if (success) {
            //to resolve SmilesDrawer ambiguities with stereo centers
            while (unclearStereoEdges.size) {
                unclearStereoEdges.forEach(edgeId => {
                    for (const edge of edgeInfo) {
                        if (edge.id === edgeId) {
                            let cleared = false;
                            //from is the stereo center, edge: from -> to
                            if (!unassignedStereoCenters.has(edge.to)) {
                                edge.type = edge.type === 'down' ? 'stereoBack' : 'stereoFront';
                                unassignedStereoCenters.delete(edge.from);
                                cleared = true;
                                //to is the stereo center, edge: to -> from
                            } else if (!unassignedStereoCenters.has(edge.from)) {
                                edge.type = edge.type === 'down' ? 'stereoBackReverse' :
                                    'stereoFrontReverse';
                                unassignedStereoCenters.delete(edge.to);
                                cleared = true;
                            }
                            if (cleared) {
                                unclearStereoEdges.delete(edgeId);
                            }
                        }
                    }
                });
            }
            for (const atomId of stereoCenters) {
                for (const atom of atomInfo) {
                    if (atom.id === atomId) {
                        atom.stereoCenter = true;
                    }
                }
            }
            return {
                scene: {
                    structures: [
                        {
                            structureName: 'Custom',
                            structureLabel: 'Custom',
                            structureType: 'residue',
                            id: 0,
                            atoms: atomInfo,
                            bonds: edgeInfo,
                            rings: ringInfo
                        }
                    ]
                }
            };
        } else {
            console.log('smiles parsing not successful');
            return null;
        }
    }

    translateInput(smilesString){
        let res = {
            success: false,
            atomInfo: null,
            edgeInfo: null,
        };
        const drawnAtomIds = new Set();
        //to resolve SmilesDrawer stereo ambiguity
        const unclearStereoEdges = new Set();
        const stereoCenters = new Set();
        SmilesDrawer.parse(smilesString, tree => {
            //to initiate construction of drawer graph etc
            this.smilesDrawer.draw(tree, null, null, true); //set to info only mode
            const {vertices: graphVertices, edges: graphEdges} =
                this.getSmilesDrawerGraphData();
            let atoms = [];
            let rings = {};
            for (const idx in graphVertices) {
                const {
                    id,
                    position: {x: xPos, y: yPos},
                    neighbours: neighbours,
                    value,
                    positioned
                } = graphVertices[idx];
                if (!positioned) {
                    continue;
                }
                const isAromatic = value.isPartOfAromaticRing;
                const atomRings = value.rings;
                const element = value.element;
                const atom = {
                    id: id,
                    element: element,
                    label: element === 'C' ? null : element,
                    charge: (value.bracket && value.bracket.charge)
                        ? value.bracket.charge
                        : 0,
                    hydrogenCount: (value.bracket && value.bracket.hcount)
                        ? value.bracket.hcount
                        : 'missing',
                    coordinates: {
                        x: xPos,
                        y: yPos,
                    },
                    aromatic: isAromatic,
                }
                if (element === 'H') {
                    const {
                        position: {x: xNeighbourPos, y: yNeighbourPos}
                    } = graphVertices[neighbours[0]];
                    const move = PointCalculation.createMovementBetweenTwoPoints(
                        {x: xNeighbourPos, y: yNeighbourPos},
                        {x: xPos, y: yPos}
                    );
                    const newHCoords = move.forward(VectorCalculation.getDist2d(
                        {x: xNeighbourPos, y: yNeighbourPos},
                        {x: xPos, y: yPos}
                    ) * 0.75);
                    atom.coordinates.x = newHCoords.x;
                    atom.coordinates.y = newHCoords.y;
                }
                atoms.push(atom);
                atomRings.forEach(ringId => {
                    if (!rings.hasOwnProperty(ringId)) {
                        rings[ringId] = {
                            id: ringId,
                            atoms: [id],
                        };
                    } else {
                        const ring = rings[ringId];
                        ring.atoms.push(id);
                    }
                });
                drawnAtomIds.add(id);
                if (value.isStereoCenter) {
                    stereoCenters.add(id);
                }
            }

            let edges = [];
            for (const idx in graphEdges){
                const {id, sourceId, targetId, bondType, wedge,
                    isPartOfAromaticRing} = graphEdges[idx];
                if (!drawnAtomIds.has(sourceId)
                    || !drawnAtomIds.has(targetId)) {
                    continue;
                }
                let type, valid = true;
                if (!wedge) {
                    switch (bondType) {
                        case '-':
                        case '/':
                        case '\\':
                        case ':':
                            type = 'single';
                            break;
                        case '=':
                            type = 'double';
                            break;
                        case '#':
                            type = 'triple';
                            break;
                        default: //includes (or limited to?) case '.'
                            valid = false;
                    }
                } else {
                    unclearStereoEdges.add(id);
                    if (wedge === 'up') {
                        type = 'up';
                    } else { //wedge === 'down'
                        type = 'down';
                    }
                }
                if (!valid){
                    continue;
                }
                edges.push({
                    id: id,
                    from: sourceId,
                    to: targetId,
                    type: type,
                    aromatic: isPartOfAromaticRing,
                });
            }

            res = {
                success: true,
                atomInfo: atoms,
                edgeInfo: edges,
                ringInfo: Object.values(rings),
                stereoCenters: stereoCenters,
                unclearStereoEdges: unclearStereoEdges,
            };
        }, err => {
            console.log('-----------------');
            console.log('smiles drawer error:');
            console.log(err);
            console.log('-----------------');
        });
        return res;
    }

    /*----------------------------------------------------------------------*/

    getSmilesDrawerGraphData(){
        const sd = this.smilesDrawer;
        //next part is what smilesDrawer.draw() only does if infoOnly is set to false
        sd.position(); // Restore the ring information (removes bridged rings and replaces them with the original, multiple, rings)

        sd.restoreRingInformation(); // Atoms bonded to the same ring atom

        sd.resolvePrimaryOverlaps();
        let overlapScore = sd.getOverlapScore();
        sd.totalOverlapScore = sd.getOverlapScore().total;

        for (var o = 0; o < sd.opts.overlapResolutionIterations; o++) {
            for (var i = 0; i < sd.graph.edges.length; i++) {
                let edge = sd.graph.edges[i];

                if (sd.isEdgeRotatable(edge)) {
                    let subTreeDepthA = sd.graph.getTreeDepth(edge.sourceId, edge.targetId);
                    let subTreeDepthB = sd.graph.getTreeDepth(edge.targetId, edge.sourceId); // Only rotate the shorter subtree

                    let a = edge.targetId;
                    let b = edge.sourceId;

                    if (subTreeDepthA > subTreeDepthB) {
                        a = edge.sourceId;
                        b = edge.targetId;
                    }

                    let subTreeOverlap = sd.getSubtreeOverlapScore(b, a, overlapScore.vertexScores);

                    if (subTreeOverlap.value > sd.opts.overlapSensitivity) {
                        let vertexA = sd.graph.vertices[a];
                        let vertexB = sd.graph.vertices[b];
                        let neighboursB = vertexB.getNeighbours(a);

                        if (neighboursB.length === 1) {
                            let neighbour = sd.graph.vertices[neighboursB[0]];
                            let angle = neighbour.position.getRotateAwayFromAngle(vertexA.position, vertexB.position, 2.0944);
                            sd.rotateSubtree(neighbour.id, vertexB.id, angle, vertexB.position); // If the new overlap is bigger, undo change

                            let newTotalOverlapScore = sd.getOverlapScore().total;

                            if (newTotalOverlapScore > sd.totalOverlapScore) {
                                sd.rotateSubtree(neighbour.id, vertexB.id, -angle, vertexB.position);
                            } else {
                                sd.totalOverlapScore = newTotalOverlapScore;
                            }
                        } else if (neighboursB.length === 2) {
                            // Switch places / sides
                            // If vertex a is in a ring, do nothing
                            if (vertexB.value.rings.length !== 0 && vertexA.value.rings.length !== 0) {
                                continue;
                            }

                            let neighbourA = sd.graph.vertices[neighboursB[0]];
                            let neighbourB = sd.graph.vertices[neighboursB[1]];

                            if (neighbourA.value.rings.length === 1 && neighbourB.value.rings.length === 1) {
                                // Both neighbours in same ring. TODO: does this create problems with wedges? (up = down and vice versa?)
                                if (neighbourA.value.rings[0] !== neighbourB.value.rings[0]) {
                                    continue;
                                } // TODO: Rotate circle

                            } else if (neighbourA.value.rings.length !== 0 || neighbourB.value.rings.length !== 0) {
                                continue;
                            } else {
                                let angleA = neighbourA.position.getRotateAwayFromAngle(vertexA.position, vertexB.position, 2.0944);
                                let angleB = neighbourB.position.getRotateAwayFromAngle(vertexA.position, vertexB.position, 2.0944);
                                sd.rotateSubtree(neighbourA.id, vertexB.id, angleA, vertexB.position);
                                sd.rotateSubtree(neighbourB.id, vertexB.id, angleB, vertexB.position);
                                let newTotalOverlapScore = sd.getOverlapScore().total;

                                if (newTotalOverlapScore > sd.totalOverlapScore) {
                                    sd.rotateSubtree(neighbourA.id, vertexB.id, -angleA, vertexB.position);
                                    sd.rotateSubtree(neighbourB.id, vertexB.id, -angleB, vertexB.position);
                                } else {
                                    sd.totalOverlapScore = newTotalOverlapScore;
                                }
                            }
                        }

                        overlapScore = sd.getOverlapScore();
                    }
                }
            }
        }

        sd.resolveSecondaryOverlaps(overlapScore.scores);

        if (sd.opts.isomeric) {
            sd.annotateStereochemistry();
        } // Initialize pseudo elements or shortcuts


        if (sd.opts.compactDrawing && sd.opts.atomVisualization === 'default') {
            sd.initPseudoElements();
        }

        sd.rotateDrawing(); // Set the canvas to the appropriate size

        return sd.graph;
    }
}