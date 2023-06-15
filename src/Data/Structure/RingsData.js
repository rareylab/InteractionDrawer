/**
 * Stores data about all rings of one specific structure present in the scene.
 */
class RingsData {
    /**
     * Contains instances with data about atoms and edges of the structure.
     *
     * @param atomsData {AtomsData} - data about atoms of one structure in the scene
     * @param edgesData {EdgesData} - data about edges of one structure in the scene
     * @param spaceToRings {Number} - space between first bond of a bond and
     * the inner bond of a double bond for the created rings
     */
    constructor(atomsData, edgesData, spaceToRings) {
        this.atomsData = atomsData;
        this.edgesData = edgesData;
        this.spaceToRings = spaceToRings;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds rings data to a structure setting up further data containers.
     *
     * @param ringInfos {Array} - objects defining rings of the structure
     * @param ringSystemInfos {Array} - objects defining the ring system of
     * the structure (optional, otherwise found by DFS)
     */
    addRingInfo(ringInfos, ringSystemInfos) {
        //id of Ring object -> Ring object
        this.rings = {};
        this.aromaticRings = {};
        this.bccs = {};
        this.connectedComponents = [];

        //find connected and bi-connected components
        this.classifyBasedOnEdges();
        //get rings systems for rings movement, pi-stacking
        if (ringSystemInfos) {
            this.deduceRingSystemsFromInfo(ringSystemInfos);
        } else {
            this.deduceRingSystemsFromBCCs();
        }
        Object.keys(this.ringSystems).forEach(ringSystemId => {
            this.updateRingSystem(ringSystemId, false);
        });
        Object.values(this.ringSystems).forEach(({atoms: atomIds}) => {
            atomIds.forEach(atomId => {
                this.atomsData.getAtom(atomId).isInRing = true;
            });
        });
        //needs connected components from previous step + isInRing from atoms
        if (ringInfos) {
            this.createRings(ringInfos);
            this.setAromaticRings();
            this.decideRingsForDoubleBonds();
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds a Ring object belonging to the structure by its id.
     *
     * @param ringId {Number} - id of Ring object to find
     * @returns {Ring} - Ring object with specified id
     */
    getRing(ringId) {
        return this.rings[ringId];
    }

    /*----------------------------------------------------------------------*/

    /**
     * From given ring system info, finds out which atoms and edges are part of
     * this ring systems and further which edges leaves this ring system to
     * other parts of the structure.
     *
     * @param ringSystemInfo {Object} - info on the ring systems of this
     * structure (ids and contained atoms)
     */
    deduceRingSystemsFromInfo(ringSystemInfo) {
        const ringSystems = {};
        const seenEdges = new Set();
        ringSystemInfo.forEach(({id: ringSysId, atoms: atomIds}) => {
            const edges = [];
            const outgoingEdges = [];
            const atomSet = new Set(atomIds);
            atomIds.forEach(atomId => {
                this.atomsData.getAtom(atomId).ringSystem = ringSysId;
                this.atomsData.neighbors[atomId].forEach(({edgeId}) => {
                    if (seenEdges.has(edgeId)) {
                        return;
                    }
                    const {from, to} = this.edgesData.getEdge(edgeId);
                    if (atomSet.has(from) && atomSet.has(to)) {
                        this.edgesData.getEdge(edgeId).ringSystem = ringSysId;
                        edges.push(edgeId);
                    } else {
                        outgoingEdges.push(edgeId);
                    }
                    seenEdges.add(edgeId);
                });
            });
            ringSystems[ringSysId] = {
                atoms: atomIds, edges: edges, outgoingEdges: outgoingEdges
            };
        });
        this.ringSystems = ringSystems;
    }

    /*----------------------------------------------------------------------*/

    /**
     * From calculated bccs, derives which atoms/edges are part of ring systems
     * and which edges leave such ring systems to other parts of the structure.
     */
    deduceRingSystemsFromBCCs() {
        const ringSystems = {};
        let ringSystemId = 1;
        for (const bccStr in this.bccs) {
            const bccId = parseInt(bccStr);
            const bcc = this.bccs[bccId];
            if (bcc.length <= 1) continue;
            const atoms = new Set();
            const edges = new Set();
            const outgoingEdges = new Set();
            const findOutgoing = (atomId) => {
                this.atomsData.neighbors[atomId].forEach(({edgeId}) => {
                    if (this.edgesData.getEdge(edgeId).bcc !== bccId) {
                        outgoingEdges.add(edgeId);
                    }
                });
            };
            bcc.forEach(edgeId => {
                const edge = this.edgesData.getEdge(edgeId);
                edge.ringSystem = ringSystemId;
                const {from, to} = edge;
                if (!atoms.has(from)) {
                    this.atomsData.getAtom(from).ringSystem = ringSystemId;
                    atoms.add(from);
                    findOutgoing(from)
                }
                if (!atoms.has(to)) {
                    this.atomsData.getAtom(to).ringSystem = ringSystemId;
                    atoms.add(to);
                    findOutgoing(to);
                }
                edges.add(edgeId);
            });
            ringSystems[ringSystemId] = {
                atoms: [...atoms], edges: [...edges], outgoingEdges: [...outgoingEdges]
            };
            ringSystemId++;
        }
        this.ringSystems = ringSystems;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates Ring objects for required ring information of this structure,
     * based on given ring info.
     *
     * @param ringInfos {Object} - object containing information on this
     * structure's rings (id, edges, and atoms), can be undefined
     */
    createRings(ringInfos) {
        const ringEdgesUnknown = new Set();
        //add ring information to atoms and edges
        ringInfos.forEach(({
            id: ringId, edges: ringEdges, atoms: ringAtoms
        }) => {
            if (ringEdges) {
                this.getRingFromInfo(ringId, ringEdges, ringAtoms);
            } else {
                if (ringAtoms) {
                    ringAtoms.forEach(atomId => {
                        this.atomsData.getAtom(atomId).addRing(ringId);
                    });
                }
                ringEdgesUnknown.add(ringId);
            }
        });
        if (ringEdgesUnknown.size) {
            this.findEdgesByDfs(ringEdgesUnknown)
        }
        for (const ringId in this.rings) {
            const ring = this.rings[ringId];
            ring.finalize(this); //immutable changes
            ring.update(); //mutable changes, gets called to fix representation
            if (ring.aromatic) {
                ring.atoms.forEach(atom => {
                    atom.addAromaticRing(ringId);
                });
                ring.edges.forEach(edge => {
                    edge.addAromaticRing(ringId);
                });
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates a Ring object and adds ring information to atoms and edges.
     *
     * @param ringId {Number} - id of the ring
     * @param ringEdges {Array} - edge ids of edges of this ring
     * @param ringAtoms {Array} - atom ids of atoms of this ring
     */
    getRingFromInfo(ringId, ringEdges, ringAtoms) {
        const ring = new Ring(ringId, true, this.spaceToRings);
        ringEdges.forEach(edgeId => {
            const edge = this.edgesData.getEdge(edgeId);
            ring.addEdge(edge);
            edge.addRing(ringId);
        });
        if (!ringAtoms) {
            ringAtoms = this.edgesData.getAtomsByEdges(ringEdges);
        }
        ringAtoms.forEach(atomId => {
            const atom = this.atomsData.getAtom(atomId);
            atom.addRing(ringId);
            ring.aromatic = ring.aromatic && atom.aromatic;
        });
        this.rings[ringId] = ring;
    }

    /*----------------------------------------------------------------------*/

    /**
     * For rings with only known atoms, finds edges by dfs.
     *
     * @param ringEdgesUnknown {Array} - ring ids of rings with unknown edges
     */
    findEdgesByDfs(ringEdgesUnknown) {
        const addEdgeToRings = (fromId, toId, edge) => {
            const fromAtom = this.atomsData.getAtom(fromId);
            const toAtom = this.atomsData.getAtom(toId);
            const sharedRings = [...fromAtom.rings].filter(ringId => {
                return toAtom.rings.has(ringId);
            });

            const aromatic = edge.aromatic;
            sharedRings.forEach(ringId => {
                if (!ringEdgesUnknown.has(ringId)) {
                    return;
                }
                let ring;
                if (!this.rings.hasOwnProperty(ringId)) {
                    ring = new Ring(ringId, aromatic, this.spaceToRings);
                    this.rings[ringId] = ring;
                } else {
                    ring = this.rings[ringId];
                    if (!aromatic) {
                        ring.setAromatic(false);
                    }
                }
                ring.addEdge(edge);
                edge.addRing(ringId);
            });
        };
        const structureVisitor = new StructureVisitor(this.atomsData, this.edgesData);
        //make sure to actually see all the edges
        structureVisitor.dfs({
            edgeCallback: addEdgeToRings, backEdgeCallback: addEdgeToRings
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * From created rings, transfers all aromatic rings into their own
     * container.
     */
    setAromaticRings() {
        for (const ringId in this.rings) {
            const ring = this.getRing(ringId);
            if (ring.aromatic) {
                this.aromaticRings[ringId] = ring;
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * For all double bonds contained in this structure which are part of
     * rings, decides inside which ring the inner bond should be drawn, trying
     * to fill the same rings as much as possible.
     */
    decideRingsForDoubleBonds() {
        const offsetDoubles = [];
        this.edgesData.edges.forEach(edge => {
            if (edge.type === 'double') {
                const drawWithOffset = this.edgesData.decideDrawWithOffset(edge);
                edge.drawWithOffset = drawWithOffset;
                if (drawWithOffset) {
                    offsetDoubles.push(edge);
                }
            }
        });
        if (offsetDoubles.length) {
            const left = [];
            offsetDoubles.forEach(edge => {
                if (!edge.cyclic) { //decided by neighbor positions only
                    return;
                }
                const ringIds = edge.rings;
                if (ringIds.size === 1) {
                    const ringId = ringIds.values().next().value;
                    this.rings[ringId].doublePotential++;
                    edge.drawnInRing = ringId;
                } else {
                    left.push(edge);
                    edge.rings.forEach(ringId => {
                        this.rings[ringId].doublePotential++;
                    });
                }
            });
            left.forEach(edge => { //cyclic edges with undecided ring
                let best = -Infinity, inRing = undefined, bestRingLen = Infinity;
                edge.rings.forEach(ringId => {
                    const ring = this.rings[ringId];
                    if (ring.length > 6 && bestRingLen <= 6) {
                        return;
                    }
                    const nrDoubles = ring.doublePotential;
                    if (nrDoubles > best) {
                        best = nrDoubles;
                        inRing = ringId;
                        bestRingLen = ring.length;
                    }
                });
                edge.drawnInRing = inRing;
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * By DFS, finds bccs and connected components of this structure and marks
     * bonds as cyclic or not.
     */
    classifyBasedOnEdges() {
        const d = {}, low = {};
        this.atomsData.atoms.forEach(({id: atomId}) => {
            d[atomId] = 0;
            low[atomId] = 0;
        });
        const bccs = this.bccs;
        const connectedComponents = this.connectedComponents;

        let curBcc = 1, time = 0, curEdges = [], connectedComponent, curCc = 0;
        const dfsVisit = (atomId, parentId) => {
            time++;
            d[atomId] = time;
            low[atomId] = time;
            const atom = this.atomsData.getAtom(atomId);
            connectedComponent.atoms.push(atomId);
            atom.connectedComponent = curCc;
            this.atomsData.neighbors[atomId].forEach(({neighbor: nbId, edgeId}) => {
                if (d[nbId] === 0) {
                    connectedComponent.edges.push(edgeId);
                    curEdges.push(edgeId);
                    dfsVisit(nbId, atomId);
                    low[atomId] = Math.min(low[atomId], low[nbId]);
                    if (low[nbId] >= d[atomId]) {
                        let addEdgeId, bcc = [];
                        do {
                            addEdgeId = curEdges.pop();
                            this.edgesData.getEdge(addEdgeId).bcc = curBcc;
                            bcc.push(addEdgeId);
                        } while (addEdgeId !== edgeId);
                        bccs[curBcc] = bcc;
                        curBcc++;
                        //stricter criterion for finding acyclic edges
                        if (low[nbId] > d[atomId]) {
                            this.edgesData.getEdgeByAtomIds(atomId, nbId).cyclic = false;
                        }
                    }
                } else if (parentId && parentId !== nbId && d[nbId] < d[atomId]) {
                    connectedComponent.edges.push(edgeId);
                    curEdges.push(edgeId);
                    low[atomId] = Math.min(low[atomId], d[nbId]);
                }
            });
        };
        this.atomsData.atoms.forEach(({id: atomId}) => {
            if (connectedComponent && connectedComponent.atoms.length > 0) {
                connectedComponents.push(connectedComponent);
                curCc++;
            }
            connectedComponent = {
                atoms: [], edges: []
            };
            if (d[atomId] === 0) {
                dfsVisit(atomId);
            }
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates ring systems (i.e., their centers) based on new coordinates of
     * atoms within such systems. Also update all rings which are part
     * of the ring systems.
     *
     * @param ringSystemId {Number} - ring system to update
     * @param byTemp {Boolean} - whether to use temporary or non-temporary
     * coordinates of contained atoms for the update
     */
    updateRingSystem(ringSystemId, byTemp = false) {
        const coordParam = byTemp ? 'tempCoordinates' : 'coordinates';
        const ringSystem = this.ringSystems[ringSystemId];
        const convexHull = PointCalculation.findConvexHull(ringSystem.atoms.map(atomId => {
            return this.atomsData.getAtom(atomId)[coordParam];
        }));
        const newCenter = PolygonCalculation.findCenterOfConvexPolygon(convexHull).centroid;
        this.setRingSystemCenter(ringSystemId, newCenter, byTemp);
        for (const ring of Object.values(this.rings)) {
            if (ring.ringSystem == ringSystemId) {
                ring.update(byTemp);
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Directly sets the center information of a ring system to new coordinates.
     *
     * @param ringSystemId {Number} - ring system to update
     * @param newCenter {Object} - x- and y-coordinates of the new center
     * @param byTemp {Boolean} - whether to update only temporary center
     * information
     */
    setRingSystemCenter(ringSystemId, newCenter, byTemp = false) {
        const ringSystem = this.ringSystems[ringSystemId];
        ringSystem.tempCenter = newCenter;
        if (!byTemp) {
            ringSystem.center = newCenter;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds all rings which are in a given set of ring systems.
     *
     * @param ringSystemsIds {Array|Set} - ids of ring systems
     * @returns {Array} - ids of rings in given ring systems
     */
    getRingsInRingsystem(ringSystemsIds) {
        const ringIds = [];
        for (const [ringId, ring] of Object.entries(this.rings)) {
            ringSystemsIds.forEach(ringSysId => {
                if (ring.ringSystem === parseInt(ringSysId)) {
                    ringIds.push(ringId)
                }
            });
        }
        return ringIds;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns the id of the ring system containing all of the given atoms.
     *
     * @param atoms {Array} - array of Atom objects
     * @return {Number} - id of found ring system or undefined
     */
    getRingSystemMembership(atoms) {
        let ringSysId = undefined;
        for (const [sysId, sys] of Object.entries(this.ringSystems)) {
            if (Object.values(atoms).every(atom => sys.atoms.includes(atom.id))) {
                ringSysId = parseInt(sysId);
                break;
            }
        }
        return ringSysId;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Given any number of atoms by their ids, finds ids of all the rings these
     * atoms are a part of.
     *
     * @param atomIds {Set|Array} - atom ids of which to get shared rings
     * @param aromatic {Boolean} - if this flag is set, only return shared
     * aromatic rings
     * @returns {Array} - shared ring ids
     */
    getRingsAffectedByAtoms(atomIds, aromatic) {
        if (Array.isArray(atomIds)) {
            atomIds = new Set(atomIds);
        }
        const ringsToCheck = aromatic ? this.aromaticRings : this.rings;
        const affectedRings = [];

        for (const ringId in ringsToCheck) {
            const ringAtoms = ringsToCheck[ringId].atoms;
            if (ringAtoms.some(ringAtom => {
                return atomIds.has(ringAtom.id);
            })) {
                affectedRings.push(ringId);
            }
        }

        return affectedRings;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Given any number of atoms by their ids, finds ids of all the ring
     * systems these atoms are a part of.
     *
     * @param atomIds {Array} - atom ids of which to get shared rings
     * @returns {Set} - shared ring system ids
     */
    getRingSystemsAffectedByAtoms(atomIds) {
        return new Set(Object.keys(this.ringSystems)
            .filter(ringSysId => {
                const ringSysAtoms = new Set(this.ringSystems[ringSysId].atoms);
                return atomIds.some(atomId => {
                    return ringSysAtoms.has(atomId);
                });
            }));
    }

    /*----------------------------------------------------------------------*/

    /**
     * Given any number of edges by their ids, finds ids of all the ring
     * systems these edges are a part of.
     *
     * @param edges {Array} - edge of which to get shared rings
     * @returns {Set} - shared ring system ids
     */
    getRingSystemsAffectedByEdges(edges) {
        return new Set(Object.keys(this.ringSystems)
            .filter(ringSysId => {
                const ringSysEdges = new Set(this.ringSystems[ringSysId].edges);
                return edges.some(edge => {
                    return ringSysEdges.has(edge.edgeId);
                });
            }));
    }
}