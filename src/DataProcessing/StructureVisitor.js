/**
 * Does DFS over the data of a structure executing callbacks.
 */
class StructureVisitor {
    /**
     * Contains atom and edge data of a structure.
     *
     * @param atomsData {AtomsData} - atom data of a structure
     * @param edgesData {EdgesData} - edge data of a structure
     */
    constructor(atomsData, edgesData) {
        this.atomsData = atomsData;
        this.edgesData = edgesData;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Generic function to do DFS over the atoms of this structure. Executes
     * callback on each traversed atom. Optional parameters to define callbacks
     * at many different points of the DFS, to exclude certain atoms, and to
     * determine order of traversal.
     *
     * @param atomCallback {Function} - callback to execute on atom visits
     * @param edgeCallback {Function} - callback to execute on edge visits
     * @param backEdgeCallback {Function} - callback to execute on back edges
     * (unvisited edges back to visited atoms)
     * @param newStartCallback {Function} - callback to execute when DFS
     * starts over (on new connected component)
     * @param finalizeCallback {Function} - callback at the end of DFS
     * @param multiEdgeVisitCallback {Function} - callback on edges which
     * have already been visited
     * @param determineNbSorting {Function} - callback to sort neighbors of
     * atoms
     * @param startIds {Array} - optionally defined DFS start points. Defaults
     * to all atom ids of the structure
     * @param excludedAtoms {Set} - atoms to exclude from DFS visits
     */
    dfs({
        atomCallback,
        edgeCallback,
        backEdgeCallback,
        newStartCallback,
        finalizeCallback,
        multiEdgeVisitCallback,
        determineNbSorting,
        startIds,
        excludedAtoms
    } = {}) {
        const visited = {};
        const edgeVisited = new Set();
        this.atomsData.atoms.forEach(({id: atomId}) => {
            visited[atomId] = (!!excludedAtoms && excludedAtoms.has(atomId));
        });
        const backedges = new Set();

        const dfsVisit = (atomId, parentId) => {
            visited[atomId] = true;
            if (atomCallback) {
                const atom = this.atomsData.getAtom(atomId);
                const parent = this.atomsData.getAtom(parentId);
                if (atomCallback(atom, parent) === false) {
                    return;
                }
            }

            let neighborSorting;
            if (determineNbSorting) {
                const atom = this.atomsData.getAtom(atomId);
                const parent = this.atomsData.getAtom(parentId);
                neighborSorting = determineNbSorting(atom, parent);
            }
            const sortedNeighbors = neighborSorting ?
                this.atomsData.neighbors[atomId].sort(neighborSorting) :
                this.atomsData.neighbors[atomId];
            sortedNeighbors.forEach(({neighbor: nbId, edgeId}) => {
                if (nbId === parentId) { //parent id may be undefined
                    return;
                }
                //mark unseen edges, return to prevent double callbacks
                if (edgeVisited.has(edgeId)) {
                    if (multiEdgeVisitCallback) {
                        multiEdgeVisitCallback(atomId, nbId, this.edgesData.getEdge(edgeId));
                    }
                    return;
                } else {
                    edgeVisited.add(edgeId);
                }

                //proceed on unseen neighbors and/or do callbacks on edges/back edges
                if (!visited[nbId]) {
                    if (edgeCallback) {
                        const edge = this.edgesData.getEdge(edgeId);
                        if (edgeCallback(atomId, nbId, edge) === false) {
                            return;
                        }
                    }
                    dfsVisit(nbId, atomId);
                } else if (backEdgeCallback) {
                    const edge = this.edgesData.getEdge(edgeId);
                    //back edge, so no further recursion and no return value
                    backEdgeCallback(atomId, nbId, edge);
                    backedges.add(edgeId);
                }
            });
        };

        if (!startIds) {
            startIds = [this.atomsData.atoms[0].id];
        }
        let i = 0;
        startIds.forEach(atomId => {
            if (!this.atomsData.atomById.hasOwnProperty(atomId)) {
                console.log(`Can not start from atom: ${atomId} ` +
                    `(no such atom exists in structure).`);
                return;
            }
            if (!visited[atomId]) {
                if (newStartCallback) {
                    const atom = this.atomsData.getAtom(atomId);
                    newStartCallback(atom, i++);
                }
                dfsVisit(atomId, undefined);
            }
        });

        if (finalizeCallback) {
            finalizeCallback(visited, edgeVisited);
        }
    }
}