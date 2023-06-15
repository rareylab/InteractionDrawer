/**
 * Stores data about all edges of one structure present in the scene.
 */
class EdgesData {
    /**
     * Contains instances with data about atoms.
     */
    constructor(atomsData) {
        this.atomsData = atomsData;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds edges data to a structure setting up further data containers.
     *
     * @param edgeInfos {Array} - objects defining bonds of the structure
     */
    addEdgeInfo(edgeInfos) {
        //Edge objects
        this.edges = [];
        //Atom object ids -> Atom object id -> Edge object
        this.edgeByAtoms = {};
        //Edge object id -> index in edgeInfos
        this.edgeIdxById = {}; //for e.g. XOR
        //index in edgeInfos -> Edge object id
        this.edgeIdByIdx = {};
        //Edge object id -> Edge object
        this.edgeById = {};
        //Edge object id -> Edge object ids
        this.edgeNeighbors = {}; //Sets to memorize if edges are next to each other
        //Edge object id -> Edge object id -> angle
        this.angles = {}; //angles between neighboring edges
        //Edge object ids
        this.selectedEdges = new Set();
        //Edge object ids
        this.tempSelectedEdges = new Set();

        this.avgEdgeLength = 0;
        let accEdgeLength = 0;
        edgeInfos && edgeInfos.forEach((edgeInfo, idx) => {
            const edge = new Edge(edgeInfo);
            this.edges.push(edge);
            const {id: edgeId, to, from} = edge;
            this.edgeById[edgeId] = edge;
            this.edgeIdxById[edgeId] = idx;
            this.edgeIdByIdx[idx] = edgeId;
            this.atomsData.neighbors[to].push({
                neighbor: from, edgeId: edgeId
            });
            this.atomsData.neighbors[from].push({
                neighbor: to, edgeId: edgeId
            });
            const toIsSmaller = (to < from);
            const smaller = toIsSmaller ? to : from;
            const larger = toIsSmaller ? from : to;
            if (!this.edgeByAtoms.hasOwnProperty(smaller)) {
                this.edgeByAtoms[smaller] = {};
            }
            this.edgeByAtoms[smaller][larger] = edge;
            this.edgeNeighbors[edgeId] = new Set();
            this.angles[edgeId] = {};
            accEdgeLength += this.getEdgeLength(edgeId);
        });
        this.avgEdgeLength = accEdgeLength / this.edges.length;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Does some postprocessing of edge data after adding it.
     */
    postProcessEdges() {
        this.edges.forEach(({id: edgeId}) => {
            this.calcEdgeNeighborInfo(edgeId);
        });
        //needs neighbors
        this.edges.forEach(({id: edgeId}) => {
            this.calcRelevantAnglesForEdge(edgeId);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Does some postprocessing of edge data after adding it, e.g. with respect to
     * stereo centers.
     *
     * @param stereoCenterInfos {Array} - objects defining which atoms of
     * the structure are stereo centers (optional, otherwise inferred from
     * bond types)
     */
    postProcessAtomsByEdges(stereoCenterInfos) {
        this.atomsData.atoms.forEach(atom => {
            const atomId = atom.id;
            const neighbors = this.atomsData.neighbors[atomId];
            if (atom.hydrogenCount === 'missing') {
                atom.calcHydrogenCount(this.getNrBondsFromAtom(atomId, true));
            }
            const neighborEdges = [];
            neighbors.forEach(({neighbor: nbId, edgeId}) => {
                neighborEdges.push(this.getEdge(edgeId));
            });
            //if stereo centers not given by user, deduce them here
            if (!stereoCenterInfos) {
                EdgesData.deduceAtomStereoByEdges(atom, atomId, neighborEdges)
            }
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Deduces the stereo center property based on neighbour edge types.
     *
     * @param atom {Array} - Atom object
     * @param atomId {Array} - id of this Atom object
     * @param neighborEdges {Array} - neighbour edges of this atom
     */
    static deduceAtomStereoByEdges(atom, atomId, neighborEdges) {
        for (const edge of neighborEdges) {
            const type = edge.type;
            if (type === 'stereoBack' || type === 'stereoFront') {
                if (edge.from === atomId) {
                    atom.stereoCenter = true;
                    break;
                }
            } else if (type === 'stereoBackReverse' || type === 'stereoFrontReverse') {
                if (edge.to === atomId) {
                    atom.stereoCenter = true;
                    break;
                }
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns an Edge object belonging to this structure by its id.
     *
     * @param edgeId {Number}- id of Edge object to find
     * @returns {Edge} - Edge object of specified id
     */
    getEdge(edgeId) {
        return this.edgeById[edgeId];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Extends info on which atoms are neighbors of each other in the
     * this.neighbors object based on an edge (by id).
     *
     * @param edgeId {Number} - id of edge to extend neighbor information by
     */
    calcEdgeNeighborInfo(edgeId) {
        const {from, to} = this.getEdge(edgeId);
        let edgeNeighborIds = this.atomsData.neighbors[from].map(nb => {
            return nb.edgeId;
        });
        edgeNeighborIds = edgeNeighborIds.concat(this.atomsData.neighbors[to].map(nb => {
            return nb.edgeId;
        }));
        const edgeNeighborSet = new Set(edgeNeighborIds);
        edgeNeighborSet.delete(edgeId);
        this.edgeNeighbors[edgeId] = edgeNeighborSet;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Calculates angles from an edge (given by its id) towards neighboring
     * edges if not calculated before (or force calculation via override
     * parameter) and write these into the this.angles object
     *
     * @param edgeId {Number} - id of edge to calculate angles for
     * @param override {Boolean} - whether angles should still be calculated
     * for which an entry in this.angles already exists
     * @param byTemp {Boolean} - whether angle changes are only temporary or
     * to be committed to the drawer's history
     */
    calcRelevantAnglesForEdge(edgeId, override = false, byTemp = false) {
        const {from, to} = this.getEdge(edgeId);
        const angles = this.angles[edgeId];

        this.edgeNeighbors[edgeId].forEach(secondEdgeId => {
            if (angles.hasOwnProperty(secondEdgeId) && !override) {
                return;
            }
            //get all necessary coordinates
            const {from: from2, to: to2} = this.getEdge(secondEdgeId);

            //firstOtherId belongs to edge by edgeId
            let sharedAtomId, firstOtherId, secondOtherId;
            if (from === from2) {
                sharedAtomId = from;
                firstOtherId = to;
                secondOtherId = to2;
            } else if (from === to2) {
                sharedAtomId = from;
                firstOtherId = to;
                secondOtherId = from2;
            } else if (to === from2) {
                sharedAtomId = to;
                firstOtherId = from;
                secondOtherId = to2;
            } else { //to === to2
                sharedAtomId = to;
                firstOtherId = from;
                secondOtherId = from2;
            }

            const coordParam = byTemp ? 'tempCoordinates' : 'coordinates';
            const sharedCoords = this.atomsData.getAtom(sharedAtomId)[coordParam];
            const firstOtherCoords = this.atomsData.getAtom(firstOtherId)[coordParam];
            const secondOtherCoords = this.atomsData.getAtom(secondOtherId)[coordParam];

            //calc angle based on coordinates (define as two lines)
            const edgeAngle = AngleCalculation.radianToDegree(VectorCalculation.findAngleBetweenLines(sharedCoords,
                firstOtherCoords,
                sharedCoords,
                secondOtherCoords
            ));
            //set angles, other direction via shortcut
            if (LineCalculation.isLeft(sharedCoords, firstOtherCoords, secondOtherCoords)) {
                angles[secondEdgeId] = 360 - edgeAngle;
                this.angles[secondEdgeId][edgeId] = edgeAngle;
            } else {
                angles[secondEdgeId] = edgeAngle;
                this.angles[secondEdgeId][edgeId] = 360 - edgeAngle;
            }
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets length of Edge with given id.
     *
     * @param edgeId {Number}- id of Edge object to find length for
     * @returns {Number} - length of edge
     */
    getEdgeLength(edgeId) {
        const {from, to} = this.getEdge(edgeId);
        const fromCoords = this.atomsData.getAtom(from).coordinates;
        const toCoords = this.atomsData.getAtom(to).coordinates;
        return VectorCalculation.getDist2d(fromCoords, toCoords);
    }

    /*----------------------------------------------------------------------*/

    /**
     * For an atom specified by its id, finds the number of bonds outgoing from
     * this atom (can include atom pair interactions, based on bond types and the
     * atom's element).
     *
     * @param atomId {Number} - id of atom to find number of outgoing bonds for
     * @param includeExplHs {Boolean} - whether hydrogen bonds to atoms
     * without explicit representation should be counted
     * @returns {Number} - number of outgoing bonds from the queried atom
     */
    getNrBondsFromAtom(atomId, includeExplHs = true) {
        const nbs = includeExplHs ? this.atomsData.neighbors[atomId] :
            this.atomsData.getNonHNeighbors(atomId);
        return nbs.reduce((bondCount, nb) => {
            const edge = this.getEdge(nb.edgeId);
            let bondVal;
            switch (edge.type) {
                case 'double':
                    bondVal = 2;
                    break;
                case 'triple':
                    bondVal = 3;
                    break;
                default:
                    bondVal = 1;
                    break;
            }
            return bondCount + bondVal;
        }, 0);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets (unique!) atom ids references by 'from' and 'to' parameters in edge
     * objects belonging to this structure referenced by their (edge) ids.
     *
     * @param edgeIds {Array} - ids of edge objects to query
     * @param asSet {Boolean} - whether to return atom ids as set (or, if set
     * to false, as an Array)
     * @returns {Set|Array} - unique atom ids belonging to queried Edge objects
     */
    getAtomsByEdges(edgeIds, asSet = false) {
        const atomSet = edgeIds.reduce((atomSet, edgeId) => {
            const {from, to} = this.getEdge(edgeId);
            return [from, to].reduce((atomSet, atomId) => {
                return atomSet.add(atomId);
            }, atomSet)
        }, new Set());
        if (asSet) {
            return atomSet;
        } else {
            return [...atomSet];
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds ids of all edges for which currently representations exist in the
     * draw area (INCLUDING hidden representations).
     *
     * @returns {Array} - drawn edges by their ids
     */
    getAllEnabledEdges() {
        return this.edges.filter(edge => {
            return edge.enabled;
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Marks edge as selected in internal selection Set.
     *
     * @param edgeId {Number} - id of edge to mark
     */
    selectEdge(edgeId) {
        this.selectedEdges.add(edgeId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Marks edge as selected in internal selection Set, but only for temporary
     * means not to be committed into the drawer's history.
     *
     * @param edgeId {Number} - id of edge to mark
     */
    tempSelectEdge(edgeId) {
        this.tempSelectedEdges.add(edgeId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds Edge object which contains given atom ids in its 'from' and 'to'
     * fields.
     *
     * @param atom1Id {Number} - first atom id
     * @param atom2Id {Number} - second atom id
     * @returns {Edge} - Edge object containing atom ids
     */
    getEdgeByAtomIds(atom1Id, atom2Id) {
        const firstIsSmaller = atom1Id < atom2Id;
        const smaller = firstIsSmaller ? atom1Id : atom2Id;
        const larger = firstIsSmaller ? atom2Id : atom1Id;
        return this.edgeByAtoms[smaller][larger];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Double bonds might have to be drawn with offset or straight, finds out
     * which is the case here.
     *
     * @param edge {Edge} - Edge object representing the double bond
     * @returns {Boolean} - whether the second bond has to be drawn with offset
     * (or straight)
     */
    decideDrawWithOffset(edge) {
        const edgeId = edge.id;

        if (edge.cyclic) {
            return true;
        }
        const {from, to} = edge;
        const fromAtom = this.atomsData.getAtom(from);
        const toAtom = this.atomsData.getAtom(to);
        const nbsFrom = this.atomsData.neighbors[from];
        const nbsTo = this.atomsData.neighbors[to];
        const nrNbsFrom = nbsFrom.length;
        const nrNbsTo = nbsTo.length;

        //criterion to decide if edge can be straight
        const canDrawStraight = (ptAtom, nrNbsPt, nbsPt, nrNbsOther) => {
            //case 1: double bond to terminal atom
            if (nrNbsPt === 1) {
                if (ptAtom.element !== 'C') {
                    return true;
                }
                if (nrNbsOther === 1 || nrNbsOther > 2) {
                    return true;
                }
                //case 2: double bond after other double bond (must be directly on
                //line)
            } else if (nrNbsPt === 2) {
                let remNeighbor = nbsPt[0];
                if (remNeighbor.edgeId === edgeId) {
                    remNeighbor = nbsPt[1];
                }
                const remEdge = this.getEdge(remNeighbor.edgeId);
                //TODO: works well in practice, but maybe not precise enough
                if (edge.type === 'double' && remEdge.type === 'double') {
                    return true;
                }
            }
            return false;
        };

        //check criterion from both edge sides
        return !canDrawStraight(fromAtom, nrNbsFrom, nbsFrom, nrNbsTo) &&
            !canDrawStraight(toAtom, nrNbsTo, nbsTo, nrNbsFrom)
    }

    /*----------------------------------------------------------------------*/

    /**
     * Given an array of atoms affected by an interaction (by their ids), finds
     * out which bonds must then be updated.
     *
     * @param atomArr {Array} - ids of atom affected by interaction
     * @returns {Set} - ids of bonds that must be updated
     */
    getEdgesAffectedByAtoms(atomArr) {
        const affectedEdges = new Set();
        atomArr.forEach(atomId => {
            this.atomsData.neighbors[atomId].forEach(({edgeId}) => {
                affectedEdges.add(edgeId);
            });
        });
        return affectedEdges;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Some values (like for now only correct edge labeling) may be unknown
     * until all user specified functions are run on adding structures. This
     * function finishes the structure based on such user input.
     */
    finishEdgeLabeling() {
        this.atomsData.atoms.forEach(atom => {
            if (atom.stereoCenter) {
                this.atomsData.stereoSubstituentOrders[atom.id] = {};
                this.decideSubstituentOrder(atom);
            }
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Decides the order of substituents around a stereo center.
     *
     * @param atomID {Number} - atom id of stereo center
     * @param atomCoords {Number} - coordinates of stereo center
     * @returns {Object} - orders of substituents as seen from the direction of
     * each such substituent, given a direction as either 'clockwise' or
     * 'counterclockwise'
     */
    decideSubstituentOrder({id: atomID, coordinates: atomCoords}) {
        const neighbors = this.atomsData.neighbors[atomID];
        const {down: neighborDown, up: neighborUp} = this.getStereoBondsInfoOfNeighbors(neighbors);
        if (neighborDown === undefined && neighborUp === undefined) {
            console.log('No stereo bonds given for atom:', atomID);
            return;
        }
        //when neighborUp exists always take this, SD might have special case
        const {neighborID: a, edgeID: aEdgeID} = neighborUp !== undefined ? neighborUp :
            neighborDown;
        const dir = neighborDown === undefined ? 'counterclockwise' : 'clockwise';
        const otherNeighbors = this.getPositionInfoOfOtherNeighbors(neighbors,
            atomCoords,
            a,
            aEdgeID
        );
        this.setSubstituentOrderForAtom(atomID, a, dir, otherNeighbors);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks how stereo-centers are represented by the drawer
     */
    getStereoBondsInfoOfNeighbors(neighbors) {
        const nrOfNeighbors = neighbors.length;
        let neighborDown, neighborUp;
        for (let i = 0; i < nrOfNeighbors; ++i) {
            const {neighbor: neighborID, edgeId: edgeID} = neighbors[i];
            const type = this.getEdge(edgeID).type;
            if (type === 'stereoFront' || type === 'stereoFrontReverse') {
                neighborUp = {
                    neighborID: neighborID, edgeID: edgeID
                }
            } else if (type === 'stereoBack' || type === 'stereoBackReverse') {
                neighborDown = {
                    neighborID: neighborID, edgeID: edgeID
                };

            }
            if (neighborDown && neighborUp) {
                break;
            }
        }
        return {down: neighborDown, up: neighborUp};
    }

    getPositionInfoOfOtherNeighbors(neighbors, atomCoords, a, aEdgeID) {
        const aCoords = this.atomsData.getAtom(a).coordinates;
        const otherNeighbors = [];
        neighbors.forEach(({neighbor: nextNeighborID, edgeId: nextEdgeID}) => {
            if (nextNeighborID === a) {
                return;
            }
            const nextCoords = this.atomsData.getAtom(nextNeighborID).coordinates;
            //side: -1 -> is on left side of line, 1 -> is on right side of line
            otherNeighbors.push({
                id: nextNeighborID,
                angle: this.angles[aEdgeID][nextEdgeID],
                side: LineCalculation.getSideOfLine(atomCoords, aCoords, nextCoords)
            });
        });
        return otherNeighbors;
    }

    setSubstituentOrderForAtom(atomID, a, dir, otherNeighbors) {
        const order = otherNeighbors.sort((a, b) => {
            if (a.side === -1) {
                if (b.side === 1) {
                    return -1;
                }
                return a.angle - b.angle;
            }
            if (b.side === -1) {
                return 1;
            }
            return b.angle - a.angle;
        }).map(obj => {
            return obj.id;
        });
        const b = order[0];
        const c = order[1];
        const d = order[2];
        if (d) {
            this.atomsData.stereoSubstituentOrders[atomID] = {
                direction: dir, orders: {
                    [a]: [b, c, d], [b]: [d, c, a], [c]: [b, d, a], [d]: [a, c, b]
                }
            };
        } else {
            this.atomsData.stereoSubstituentOrders[atomID] = {
                direction: dir, orders: {
                    [a]: [b, c], [b]: [c, a], [c]: [b, a]
                }
            };
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * When selecting an edge, finds out whether neighboring edges are also
     * selected. Return ids of unselected atoms between given edge (by its id)
     * and such neighboring edges.
     *
     * @param edgeId {Number} - id of edge to be selected
     * @returns {Array} - ids of atoms to subsequently select
     */
    findAtomsToSelectOnEdgeSelect(edgeId) {
        const {from, to} = this.getEdge(edgeId);
        const selAtoms = this.atomsData.selectedAtoms;
        const selEdges = this.selectedEdges;
        const atomsToSelect = [];
        const checkForSelection = (atomId => {
            if (selAtoms.has(atomId)) {
                return;
            }
            const nbs = this.atomsData.neighbors[atomId];
            for (let i = 0, len = nbs.length; i < len; ++i) {
                const nbEdgeId = nbs[i].edgeId;
                if (nbEdgeId === edgeId) {
                    continue;
                }
                if (selEdges.has(nbEdgeId)) {
                    atomsToSelect.push(atomId);
                    return;
                }
            }
        });
        checkForSelection(from);
        checkForSelection(to);
        return atomsToSelect;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds ids of all atoms which are currently selected or part if selected
     * edges.
     *
     * @returns {Array} - affected atoms by their ids
     */
    getAtomsAffectedBySelection() {
        if (this.atomsData.selectedAtoms.size === this.atomsData.atoms.length) {
            return this.atomsData.atomIds.slice();
        }
        const edgeAffected = this.getAtomsByEdges([...this.selectedEdges], true);
        return [...new Set([...edgeAffected, ...this.atomsData.selectedAtoms])];
    }
}