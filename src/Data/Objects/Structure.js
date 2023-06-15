/**
 * Class containing information on an entire structure, holding its
 * atoms, bonds and information on which intermolecular forces affect which
 * parts of the structure.
 */
class Structure {
    /**
     * Creates a new Structure object.
     *
     * @param id {Number} - internal id of structure
     * @param structureName {String} - optional name of structure
     * @param structureType {String} - optional type of structure
     * @param structureLabel {String} - label of the structure. This might
     * differ (e.g. be shorter) than the name and is displayed in the structure
     * circle representation.
     * @param spaceToRings {Number} - space between first bond of a bond and
     * the inner bond of a double bond for all rings of this structure
     * @param additionalInformation {Object} - custom additional information
     * that is saved but does not belong to the drawer itself
     */
    constructor(id,
        structureName,
        structureType,
        structureLabel,
        spaceToRings,
        additionalInformation
    ) {
        this.id = id; //may be assigned by drawer if not given directly
        this.hidden = false;
        this.enabled = true;
        this.structureName = structureName;
        this.structureType = structureType || 'default';
        this.structureLabel = structureLabel;
        this.additionalInformation = additionalInformation;
        this.spaceToRings = spaceToRings;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Extends the Structure object by actual draw information. Missing
     * information has to be calculated.
     *
     * @param atomInfos {Array} - objects defining atoms of the structure
     * @param edgeInfos {Array} - objects defining bonds of the structure
     * @param ringInfos {Array} - objects defining rings of the structure
     * @param stereoCenterInfos {Array} - objects defining which atoms of
     * the structure are stereo centers (optional, otherwise inferred from
     * bond types)
     * @param ringSystemInfos {Array} - objects defining the ring system of
     * the structure (optional, otherwise found by DFS)
     */
    addStructureInfo(atomInfos, edgeInfos, {
        ringInfos, stereoCenterInfos, ringSystemInfos
    }) {
        //global properties of structure
        this.curOffset = {x: 0, y: 0}; //given in px
        this.boundaries = undefined;
        //large elements containing multiple atoms / edges
        this.atomsData = new AtomsData();
        this.atomsData.addAtomInfo(atomInfos, stereoCenterInfos);
        this.edgesData = new EdgesData(this.atomsData);
        this.edgesData.addEdgeInfo(edgeInfos);
        this.edgesData.postProcessEdges();
        this.edgesData.postProcessAtomsByEdges(stereoCenterInfos);
        this.atomsData.postProcessAtoms();
        this.ringsData = new RingsData(this.atomsData, this.edgesData, this.spaceToRings);
        this.ringsData.addRingInfo(ringInfos, ringSystemInfos);
        this.representationsData = new RepresentationsData(this.structureType);
        //related objects, noted for movement
        this.annotationConnectionData = new AnnotationConnectionData();
        this.hydrophobicConnectionData = new HydrophobicConnectionData();
        this.intermolecularConnectionData =
            new IntermolecularConnectionData(this.ringsData);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Splits structure into two parts on acyclic bond by DFS.
     *
     * @param edgeId {Number} - id of edge to split structure on
     * @returns {Array|undefined} - atom ids of the two parts of the structure,
     * or undefined for bad input (including cyclic edges)
     */
    splitStructureOnBond(edgeId) {
        const edge = this.edgesData.getEdge(edgeId);
        if (edge.cyclic) {
            return;
        }
        const {from, to} = edge;
        const firstSubset = [];
        const secondSubset = [];
        const fillFirst = (atom) => {
            firstSubset.push(atom.id);
        };
        const fillSecond = (atom) => {
            secondSubset.push(atom.id);
        };
        const structureVisitor = new StructureVisitor(this.atomsData, this.edgesData);
        structureVisitor.dfs({
            atomCallback: fillFirst, startIds: [from], excludedAtoms: new Set([to])
        });
        structureVisitor.dfs({
            atomCallback: fillSecond, startIds: [to], excludedAtoms: new Set([from])
        });

        return [firstSubset, secondSubset];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets ids of atoms to move based on a given atom (by id) which is
     * currently affected by some form of interaction. This decision is based
     * on the defined move freedom level.
     *
     * @param atomId {Number} - id of atom affected by interaction
     * @param moveFreedomLevel {String} - freedom level defining the size of
     * units of the structure which can be moved at one. Either 'free',
     * 'rings', or 'structures'
     * @returns {Array} - ids of atoms to move
     */
    getMoveUnitForAtom(atomId, moveFreedomLevel) {
        switch (moveFreedomLevel) {
            case 'free':
                return [atomId];
            case 'rings':
                const ringSystem = this.atomsData.getAtom(atomId).ringSystem;
                if (!ringSystem) return [atomId];
                return this.ringsData.ringSystems[ringSystem].atoms;
            case 'structures':
                return this.atomsData.atomIds.slice();
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Get ids of atoms to move based on a given edge (by id) which is
     * currently affected by some form of interaction. This decision is based
     * on the defined move freedom level.
     *
     * @param edgeId {Number} - id of edge affected by interaction
     * @param moveFreedomLevel {String} - freedom level defining the size of
     * units of the structure which can be moved at one. Either 'free',
     * 'rings', or 'structures'
     * @returns {Array} - ids of atoms to move
     */
    getMoveUnitForEdge(edgeId, moveFreedomLevel) {
        const edge = this.edgesData.getEdge(edgeId);
        const moveUnit = new Set(this.getMoveUnitForAtom(edge.from, moveFreedomLevel)
            .concat(this.getMoveUnitForAtom(edge.to, moveFreedomLevel)));
        return Array.from(moveUnit);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds all non-molecular elements which are in some connected to this
     * structure (either as bonds or elements that belong to the structure).
     *
     * @returns {Object} - the connected elements by type
     */
    getConnectedElements() {
        return {
            annotations: this.annotationConnectionData.annotations,
            distances: this.intermolecularConnectionData.ids.distances,
            interactions: this.intermolecularConnectionData.ids.interactions,
            atomPairInteractions: this.intermolecularConnectionData.ids.atomPairInteractions,
            piStackings: this.intermolecularConnectionData.ids.piStackings,
            cationPiStackings: this.intermolecularConnectionData.ids.cationPiStackings,
            splineControlPoints: this.hydrophobicConnectionData.getSplineControlPointIds()
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds all non-molecular (bond) elements which are connected to given
     * atoms of this structure.
     *
     * @param atomArr {Array} - atoms ids to look up connections for
     * @param moveFreedomLevel {String} - freedom level defining the size of
     * units of the structure which can be moved at one. Either 'free',
     * 'rings', or 'structures'
     * @returns {Object} - the connected elements by type
     */
    getConnectedElementsForAtoms(atomArr, moveFreedomLevel) {
        if (atomArr.length === this.atomsData.atoms.length) {
            return this.getConnectedElements();
        }
        const atomPairInteractions = this.intermolecularConnectionData.getAtomPairInteractionsAffectedByAtoms(
            atomArr, moveFreedomLevel);
        const affectedRingSystems = this.ringsData.getRingSystemsAffectedByAtoms(atomArr);
        const piStackings = this.intermolecularConnectionData.getPiStackingsAffectedByAtoms(atomArr,
            affectedRingSystems
        );
        const cationPiStackings = this.intermolecularConnectionData.getCationPiStackingsAffectedByAtoms(atomArr,
            affectedRingSystems
        );
        const annotations = this.annotationConnectionData.getAnnotationsForAtoms(atomArr);
        const splineControlPoints = this.hydrophobicConnectionData.getSplineControlPointIdsForAtoms(
            atomArr);
        return {
            atomPairInteractions: atomPairInteractions,
            piStackings: piStackings,
            cationPiStackings: cationPiStackings,
            annotations: annotations,
            splineControlPoints: splineControlPoints
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns true if at least one atom, bond or structure circle is selected,
     * either by normal selection, temp selection or both.
     *
     * @param type {Number} - whether to just check normal selection (0),
     * temp selection (1) or both (2)
     */
    isSelected(type = 2) {
        return ((type === 1 || type === 2) && (this.atomsData.tempSelectedAtoms.size !== 0 ||
            this.edgesData.tempSelectedEdges.size !== 0 ||
            this.representationsData.tempSelectedStructureCircle)) || ((type === 0 || type === 2) &&
            (this.atomsData.selectedAtoms.size !== 0 || this.edgesData.selectedEdges.size !== 0 ||
                this.representationsData.selectedStructureCircle))
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the tracked offsets applied to this structure.
     */
    resetCurOffset() {
        this.curOffset = {
            x: 0, y: 0
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates given boundaries for given draw limits.
     *
     * @param drawLimits {Object} - bounding box limits of a certain object.
     * Must contain 'xMin', 'xMax', 'yMin', and 'yMax'
     * @param boundaries {Object} - current boundaries which should be updated
     * with parameters from drawLimits. Must contain 'xMin', 'xMax',
     * 'yMin', and 'yMax'
     * @returns {Boolean} - whether the boundaries have changed
     */
    static calcBoundariesStep(drawLimits, boundaries) {
        const {xMin, xMax, yMin, yMax} = drawLimits;
        let changed = false;
        if (xMin < boundaries.xMin) {
            boundaries.xMin = xMin;
            changed = true;
        }
        if (xMax > boundaries.xMax) {
            boundaries.xMax = xMax;
            changed = true;
        }
        if (yMin < boundaries.yMin) {
            boundaries.yMin = yMin;
            changed = true;
        }
        if (yMax > boundaries.yMax) {
            boundaries.yMax = yMax;
            changed = true;
        }
        return changed;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Given certain bounding box limits of the structure, finds remaining such
     * limits for this structure.
     *
     * @param forcedLimits {Object} - bounding box limits of the structure
     * which are already known for sure. Can specify 'xMin', 'xMax',
     * 'yMin', and 'yMax'
     */
    calcBoundaries(forcedLimits = undefined) {
        const newBoundaries = {
            xMin: Infinity, xMax: -Infinity, yMin: Infinity, yMax: -Infinity
        };

        if (this.enabled) {
            this.atomsData.atoms.forEach(atom => {
                if (!atom.enabled) {
                    return
                }
                Structure.calcBoundariesStep(atom.globalDrawLimits, newBoundaries);
            });
        }

        this.setLimits({...newBoundaries, ...forcedLimits});
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets bounding box boundaries for this structure.
     *
     * @param boundingBox {Object} - bounding box limits of the structure.
     * Contains specify 'xMin', 'xMax', 'yMin', and 'yMax'
     */
    setLimits(boundingBox) {
        const {xMin, xMax, yMin, yMax} = boundingBox;
        const mid = PointCalculation.findGeometricCenter(this.atomsData.atoms.map(atom => {
            return atom.coordinates;
        }));
        const maxDist = Math.max(...this.atomsData.atoms.map(atom => {
            return VectorCalculation.getDist2d(atom.coordinates, mid)
        }));
        this.boundaries = {
            xMin: xMin,
            xMax: xMax,
            yMin: yMin,
            yMax: yMax,
            mid: mid,
            maxDist: maxDist,
            width: xMax - xMin,
            height: yMax - yMin
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns bounding box limits of this structure.
     *
     * @returns {Object} - bounding box limits, containing fields 'xMin',
     * 'xMax', 'yMin', and 'yMax'
     */
    getLimits() {
        return this.boundaries;
    }

    /*----------------------------------------------------------------------*/

    /**
     * For the structure circle of the structure, calculates the necessary
     * offset to move it such that it rotates some angle around a rotation point.
     *
     * @param angle {Number} - angle to rotate
     * @param isDeg {Boolean} - is angle given in degree (false -> angle is
     * radian)
     * @param rotationPoint {Object} - point to rotate around - if none is
     * given, rotate around own midpoint
     * @param byTemp {Boolean} - if temporary coordinates should be used for
     * calculation
     * @returns {Object} - x and y values of offset
     */
    calcStructureCircleRotationOffset(angle, isDeg, rotationPoint, byTemp = true) {
        const mid = rotationPoint ? rotationPoint : this.boundaries.mid;
        const circleMid = byTemp ? this.representationsData.structureCircle.tempCoordinates :
            this.representationsData.structureCircle.coordinates;

        const rotatedCoords = PointCalculation.rotatePointAroundAnother(circleMid,
            mid,
            angle,
            !isDeg
        );
        return {
            x: rotatedCoords.x - circleMid.x, y: rotatedCoords.y - circleMid.y
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds the boundaries of the structure circle to the structure boundaries.
     * This is needed because it might be possible that the circle is larger than the
     * drawn structure.
     *
     * @returns {Boolean} - true if that changed the boundaries, else false
     */
    addStructureCircleToBoundaries() {
        if (!this.enabled) {
            return false;
        }

        const newBoundaries = Object.assign({}, this.boundaries);

        const changed = Structure.calcBoundariesStep(this.representationsData.structureCircle.drawLimits,
            newBoundaries
        );

        if (changed) {
            this.setLimits(newBoundaries);
            return true;
        } else {
            return false;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * For each atom of the structure, calculates the necessary offsets to move
     * the atom such that it rotates some angle around a rotation point.
     *
     * @param angle {Number} - angle to rotate
     * @param isDeg {Boolean} - is angle given in degree (false -> angle is
     * radian)
     * @param rotationPoint {Object} - point to rotate around - if none is
     * given, rotate around own midpoint
     * @param filter - callback to filter out atoms if only subset of atoms
     * should be rotated
     * @returns {Object} - map of atom ids to offsets
     */
    calcAtomRotationOffsets(angle, isDeg, rotationPoint, filter) {
        const mid = rotationPoint ? rotationPoint : this.boundaries.mid;

        const atomsToRotate = filter ? this.atomsData.atoms.filter(atom => {
            return filter(atom)
        }) : this.atomsData.atoms;
        const atomCoords = atomsToRotate.map(atom => {
            return atom.tempCoordinates;
        });

        const rotatedCoords = PointCalculation.rotatePointsAroundMid(atomCoords, angle, mid, isDeg);

        const offsetMap = {};
        atomsToRotate.forEach(({id: atomId, tempCoordinates}, idx) => {
            const rotatedCoord = rotatedCoords[idx];
            offsetMap[atomId] = {
                x: rotatedCoord.x - tempCoordinates.x, y: rotatedCoord.y - tempCoordinates.y
            }
        });
        return offsetMap;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Deep clone this Structure object.
     *
     * @returns {Structure} - the new Structure object
     */
    clone() {
        const clone = new Structure(this.id,
            this.structureName,
            this.structureType,
            this.structureLabel,
            this.spaceToRings,
            Object.assign({}, this.additionalInformation)
        );
        clone.atomsData = new AtomsData();
        clone.edgesData = new EdgesData(this.atomsData);
        clone.ringsData = new RingsData(this.atomsData, this.edgesData, this.spaceToRings);
        clone.representationsData = new RepresentationsData(this.structureType);
        clone.annotationConnectionData = new AnnotationConnectionData();
        clone.hydrophobicConnectionData = new HydrophobicConnectionData();
        clone.intermolecularConnectionData =
            new IntermolecularConnectionData(clone.ringsData);
        clone.edgesData.angles = Object.assign({}, this.edgesData.angles);
        clone.atomsData.atoms = [];
        clone.atomsData.atomById = {};
        this.atomsData.atoms.forEach(atom => {
            const atomClone = atom.clone();
            clone.atomsData.atoms.push(atomClone);
            clone.atomsData.atomById[atomClone.id] = atomClone;
        });
        clone.ringsData.bccs = JSON.parse(JSON.stringify(this.ringsData.bccs));
        clone.ringsData.ringSystems = JSON.parse(JSON.stringify(this.ringsData.ringSystems));
        clone.boundaries = Object.assign({}, this.boundaries);
        clone.curOffset = Object.assign({}, this.curOffset);
        clone.edgesData.edges = [];
        clone.edgesData.edgeById = {};
        clone.edgesData.edgeByAtoms = {};
        this.edgesData.edges.forEach(edge => {
            const edgeClone = edge.clone();
            clone.edgesData.edges.push(edgeClone);
            const {id: edgeId, to, from} = edgeClone;
            clone.edgesData.edgeById[edgeId] = edgeClone;
            const toIsSmaller = (to < from);
            const smaller = toIsSmaller ? to : from;
            const larger = toIsSmaller ? from : to;
            if (!clone.edgesData.edgeByAtoms.hasOwnProperty(smaller)) {
                clone.edgesData.edgeByAtoms[smaller] = {};
            }
            clone.edgesData.edgeByAtoms[smaller][larger] = edgeClone;
        });
        clone.atomsData.neighbors = Object.assign({}, this.atomsData.neighbors);
        clone.ringsData.rings = {};
        clone.ringsData.aromaticRings = {};
        for (const ringId in this.ringsData.rings) {
            const ring = this.ringsData.getRing(ringId);
            const ringClone = ring.clone();
            clone.ringsData.rings[ringId] = ringClone;
            if (ringClone.aromatic) {
                clone.ringsData.aromaticRings[ringId] = ringClone;
            }
        }
        clone.atomsData.selectedAtoms = new Set(this.atomsData.selectedAtoms);
        clone.edgesData.selectedEdges = new Set(this.edgesData.selectedEdges);
        clone.atomsData.tempSelectedAtoms = new Set(this.atomsData.tempSelectedAtoms);
        clone.edgesData.tempSelectedEdges = new Set(this.edgesData.tempSelectedEdges);
        clone.hydrophobicConnectionData.hydrophobicConts = {};
        for (const hId in this.hydrophobicConnectionData.hydrophobicConts) {
            clone.hydrophobicConnectionData.hydrophobicConts[hId] =
                this.hydrophobicConnectionData.hydrophobicConts[hId].clone();
        }
        return clone;
    }
}
