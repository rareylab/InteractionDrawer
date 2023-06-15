/**
 * Class containing information on rings of larger structures (structure
 * objects), holding its atoms and bonds.
 */
class Ring {
    /**
     * Creates a new Ring object.
     *
     * @param id {Number} - internal id of ring inside structure
     * @param aromatic {Boolean} - whether the ring is aromatic or not
     * @param spaceToRing {Number} - space between first bond of a bond and
     * the inner bond of a double bond for this ring
     */
    constructor(id, aromatic, spaceToRing) {
        this.id = id;
        this.aromatic = aromatic;
        this.spaceToRing = spaceToRing;
        this.length = 0;

        this.edges = [];
        this.edgeIdToPos = {};
        this.atoms = []; //listed in order they appear in
        this.atomIdToPos = {};

        //updated parameters
        this.edgeNormals = {};
        this.edgePositions = {};

        //for correct assignment of double bonds to rings (load one up)
        this.doublePotential = 0;

        //used temporary variables on ring construction, moved to edge / atom
        //parameters on call of finalize()
        this._firstAddedEdge = null;
        this._atomIdsToEdges = {};
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds an edge (Edge object) to this ring.
     *
     * @param edge {Object} - Edge object to add
     */
    addEdge(edge) {
        if (!this._firstAddedEdge) {
            this._firstAddedEdge = edge;
        }
        const {from, to} = edge;
        if (!this._atomIdsToEdges.hasOwnProperty(from)) {
            this._atomIdsToEdges[from] = [];
        }
        this._atomIdsToEdges[from].push(edge);
        if (!this._atomIdsToEdges.hasOwnProperty(to)) {
            this._atomIdsToEdges[to] = [];
        }
        this._atomIdsToEdges[to].push(edge);
    }

    /*----------------------------------------------------------------------*/

    /**
     * From all added edges, infer the edge and atom order of the ring.
     */
    finalize(ringsData) {
        let count = 0;
        const atoms = this.atoms;
        const edges = this.edges;
        const atomIdToPos = this.atomIdToPos;
        const edgeIdToPos = this.edgeIdToPos;
        const addEdge = (edge) => {
            edges.push(edge);
            edgeIdToPos[edge.id] = count;
        };
        const addAtom = (atom) => {
            atoms.push(atom);
            atomIdToPos[atom.id] = count;
        };
        const addPair = (atom, edge) => {
            addEdge(edge);
            addAtom(atom);
            count++;
        };
        const firstAdded = this._firstAddedEdge;
        const firstId = firstAdded.from;
        addPair(ringsData.atomsData.getAtom(firstId), firstAdded);
        let curEdgeId = firstAdded.id;
        let nextId = firstAdded.to;
        //iterate edges in order (while finding such order)
        while (nextId !== firstId) {
            const possibleEdges = this._atomIdsToEdges[nextId];
            let nextEdge = possibleEdges[0];
            if (nextEdge.id === curEdgeId) {
                nextEdge = possibleEdges[1];
            }
            addPair(ringsData.atomsData.getAtom(nextId), nextEdge);
            curEdgeId = nextEdge.id;
            nextId = nextEdge.from === nextId ? nextEdge.to : nextEdge.from;
        }
        this.ringSystem = ringsData.getRingSystemMembership(atoms);
        this.length = edges.length;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates this ring based on new coordinates of its atoms.
     *
     * @param byTemp {Boolean} - whether to use temporary or non-temporary
     * coordinates of contained atoms for the update
     */
    update(byTemp = false) {
        this.findCentroid(byTemp);
        this.findEdgeNormals(byTemp);
        this.setAllAromaticPositions(byTemp);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Based on the order of edges within this ring, gets the edge appearing
     * next after a given edge (by its id) in this order.
     *
     * @param edgeId {Number} - id of edge for which to find the next edge
     * @returns {Edge} - the next edge
     */
    getNextEdge(edgeId) {
        const edgePos = this.edgeIdToPos[edgeId];
        const nextPos = (edgePos === this.edges.length - 1) ? 0 : edgePos + 1;
        return this.edges[nextPos];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Based on the order of edges within this ring, gets the edge appearing
     * before a given edge (by its id) in this order.
     *
     * @param edgeId {Number} - id of edge for which to find the previous edge
     * @returns {Edge} - the previous edge
     */
    getPreviousEdge(edgeId) {
        const edgePos = this.edgeIdToPos[edgeId];
        const prevPos = (edgePos === 0) ? this.edges.length - 1 : edgePos - 1;
        return this.edges[prevPos];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Marks this ring as aromatic or non-aromatic.
     *
     * @param aromatic {Boolean} - whether this ring is to be marked as
     * aromatic or not
     */
    setAromatic(aromatic) {
        this.aromatic = aromatic;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds the centroid of this ring and store its information to
     * this.centroidInfo
     *
     * @param byTemp {Boolean} - whether to calculate this centroid from
     * temporary or non-temporary coordinates of atoms contained within this
     * ring
     */
    findCentroid(byTemp) {
        const poly = byTemp ? this.atoms.map(atom => {
            return atom.tempCoordinates;
        }) : this.atoms.map(atom => {
            return atom.coordinates;
        });

        this.centroidInfo = PolygonCalculation.findCenterOfConvexPolygon(poly);
    }

    /*----------------------------------------------------------------------*/

    /**
     * For all edges of this ring, finds the edge normals that point inside the
     * ring.
     *
     * @param byTemp {Boolean} - whether to use temporary or non-temporary
     * coordinates of atoms contained in edges for this calculation
     */
    findEdgeNormals(byTemp) {
        const coordParam = byTemp ? 'tempCoordinates' : 'coordinates';
        this.edges.forEach(edge => {
            //relevant info for from atom
            const fromId = edge.from;
            const fromAtom = this.atoms[this.atomIdToPos[fromId]];
            const fromCoords = fromAtom[coordParam];
            //relevant info for to atom
            const toId = edge.to;
            const toAtom = this.atoms[this.atomIdToPos[toId]];
            const toCoords = toAtom[coordParam];

            //find normals and project first normal (as guess to point inside)
            const mid = PointCalculation.findEdgeMidpoint(fromCoords, toCoords);
            const normals = LineCalculation.findUnitNormals(fromCoords, toCoords);
            let normal = normals[0];
            const projMid = {
                x: mid.x + normal.x, y: mid.y + normal.y
            };

            //choose projected normal point that is inside of the circle
            const coords = this.atoms.map(atom => {
                return atom[coordParam];
            });
            if (!PolygonCalculation.checkCollisionPolygonPoint(projMid, coords)) {
                normal = normals[1];
            }

            Helpers.makeOrderedObjEntry(this.edgeNormals, fromId, toId, normal);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds the endpoints for all inner edges of edges of an aromatic ring.
     *
     * @param byTemp {Boolean} - whether to use temporary or non-temporary
     * coordinates of atoms of this ring for this calculation
     */
    setAllAromaticPositions(byTemp) {
        for (let i = 0, len = this.atoms.length; i < len; ++i) {
            const atomId = this.atoms[i].id;
            this.findInnerPosition(i, byTemp);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds the points of the inner edge for a specific edge by traversing the
     * rings atoms in order.
     *
     * @param atomIdx {Number} - current atom id to define current edge to
     * calculate positions for
     * @param byTemp {Boolean} - whether to use temporary or non-temporary
     * coordinates of atoms of this ring for this calculation
     */
    findInnerPosition(atomIdx, byTemp) {
        const curAtom = this.atoms[atomIdx];
        const curId = curAtom.id;
        const coordParam = byTemp ? 'tempCoordinates' : 'coordinates';

        const nextIdx = (atomIdx === this.atoms.length - 1) ? 0 : atomIdx + 1;
        const nextAtom = this.atoms[nextIdx];
        const nextId = nextAtom.id;
        const edgeNormal = this.getEdgeNormal(curId, nextId);

        const cur = curAtom[coordParam];
        const next = nextAtom[coordParam];
        const innerLineInfo = LineCalculation.createInnerLine(cur,
            next,
            edgeNormal,
            this.spaceToRing,
            60
        );
        Helpers.makeOrderedObjEntry(this.edgePositions, curId, nextId, innerLineInfo.points);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns the edge normal for an edge defined by its contained atoms (by
     * their ids) which points inside the ring.
     *
     * @param atomId_1 {Number} - first atom id
     * @param atomId_2 {Number} - second atom id
     * @returns {Object} - edge normal which points inside the ring
     */
    getEdgeNormal(atomId_1, atomId_2) {
        return Helpers.getOrderedObjEntry(this.edgeNormals, atomId_1, atomId_2);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns the positions by which to place the inner edge of an aromatic
     * edge inside this ring by an edge defined by its atoms (by atom ids).
     *
     * @param atomId_1 {Number} - first atom id
     * @param atomId_2 {Number} - second atom id
     * @returns {Array} - the two endpoints of the inner edge
     */
    getEdgePositions(atomId_1, atomId_2) {
        return Helpers.getOrderedObjEntry(this.edgePositions, atomId_1, atomId_2);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns the endpoints for the inner edge of a given edge
     * (by Edge object).
     *
     * @param edge {Edge} - the edge to find the inner edge points for
     * @returns {Object} - the positions of the inner edge, defined as 'from'
     * and 'to' in the same way as in the original edge to preserve direction
     */
    findInnerPositionsForEdge(edge) {
        const from = edge.from;
        const to = edge.to;
        const [fromInnerPos, toInnerPos] = this.getEdgePositions(from, to);
        return {
            from: fromInnerPos, to: toInnerPos
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Deep clone this Ring object.
     *
     * @returns {Ring} - the new Ring object
     */
    clone() {
        const clone = new Ring(this.id, this.aromatic, this.spaceToRing);
        //does forgo cloning creation parameters as they are never needed after
        clone.atomIdToPos = Object.assign({}, this.atomIdToPos);
        clone.atoms = [];
        this.atoms.forEach(atom => {
            clone.atoms.push(atom.clone());
        });
        const centroidInfo = this.centroidInfo;
        clone.centroidInfo = {
            centroid: Object.assign({}, centroidInfo.centroid), signedArea: centroidInfo.signedArea
        };
        clone.edgeIdToPos = Object.assign({}, this.edgeIdToPos);
        clone.edgeNormals = {};
        for (const edgeNormalId_1 in this.edgeNormals) {
            const edgeNormalsOfId_1 = this.edgeNormals[edgeNormalId_1];
            const edgeNormalObj = {};
            for (const edgeNormalId_2 in edgeNormalsOfId_1) {
                edgeNormalObj[edgeNormalId_2] =
                    Object.assign({}, edgeNormalsOfId_1[edgeNormalId_2]);
            }
            clone.edgeNormals[edgeNormalId_1] = edgeNormalObj;
        }
        clone.edges = [];
        this.edges.forEach(edge => {
            clone.edges.push(edge.clone());
        });
        clone.nrDoubles = this.nrDoubles;
        clone.length = this.length;
        return clone;
    }
}
