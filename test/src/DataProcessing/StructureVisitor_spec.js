describe('InteractionDrawer DataProcessing StructureVisitor', function () {

    beforeEach(function () {
        $('<svg id="draw-area" width="100%" height="600px"></svg>').appendTo('body');
        const copyTestConfig = Helpers.deepCloneObject(interactionDrawerTestConfig);
        const copyJson = Helpers.deepCloneObject(interactionDrawerTestJson);
        interactionDrawer = new InteractionDrawer('draw-area', copyTestConfig);
        const inputJson = JSON.stringify(copyJson);
        interactionDrawer.addByJSON(inputJson);
    });

    afterEach(function () {
        $('#draw-area').remove();
    });

    it('tests the DFS over the atoms of a structure and atom callback', async function () {
        const structure = interactionDrawer.sceneData.structuresData.structures[1];
        const structureVisitor = new StructureVisitor(structure.atomsData, structure.edgesData);
        const atoms = [];
        const atomCallback = (atom) => {
            atoms.push(atom.id);
            return true;
        };
        structureVisitor.dfs({atomCallback: atomCallback});
        for (const atom of interactionDrawerTestJson.scene.structures[1].atoms) {
            expect(atoms.includes(atom.id)).toEqual(true);
        }
    });

    it('tests the DFS over the edges of a structure and edge callback', async function () {
        const structure = interactionDrawer.sceneData.structuresData.structures[1];
        const structureVisitor = new StructureVisitor(structure.atomsData, structure.edgesData);
        const edges = [];
        const edgeCallback = (atomId, nbId, edge) => {
            edges.push(edge.id);
            return true;
        };
        structureVisitor.dfs({edgeCallback: edgeCallback});
        for (const bond of interactionDrawerTestJson.scene.structures[1].bonds) {
            expect(edges.includes(bond.id)).toEqual(true);
        }
    });

    it(
        'tests the DFS with excluded atoms over the atoms of a structure and atom callback',
        async function () {
            const structure = interactionDrawer.sceneData.structuresData.structures[0];
            const structureVisitor = new StructureVisitor(structure.atomsData, structure.edgesData);
            const atoms = [];
            const atomCallback = (atom) => {
                atoms.push(atom.id);
                return true;
            };
            const structureAtomsInJson = interactionDrawerTestJson.scene.structures[0].atoms;
            const excludedAtomId = structureAtomsInJson[1].id;
            //exclude terminal oxygen of functional group
            structureVisitor.dfs({
                atomCallback: atomCallback, excludedAtoms: new Set([excludedAtomId])
            });
            for (const atom of structureAtomsInJson) {
                if (atom.id === excludedAtomId) {
                    expect(atoms.includes(atom.id)).toEqual(false);
                } else {
                    expect(atoms.includes(atom.id)).toEqual(true);
                }
            }
        }
    );

    it('tests the DFS over the edges of a structure and backedges callback', async function () {
        const structure = interactionDrawer.sceneData.structuresData.structures[0];
        const structureVisitor = new StructureVisitor(structure.atomsData, structure.edgesData);
        const backEdges = [];
        const backEdgeCallback = (atomId, nbId, edge) => {
            backEdges.push(edge.id);
            return true;
        };
        structureVisitor.dfs({backEdgeCallback: backEdgeCallback});
        //see ring edges
        expect(backEdges).toEqual([2000030, 2000008, 2000023, 2000022]);
    });

    it('tests the DFS over a structure and newStartCallback callback', async function () {
        const structure = interactionDrawer.sceneData.structuresData.structures[0];
        const structureVisitor = new StructureVisitor(structure.atomsData, structure.edgesData);
        const structureAtomsInJson = interactionDrawerTestJson.scene.structures[0].atoms;
        const atoms = [];
        const newStartCallback = (atom) => {
            atoms.push(atom.id);
            return true;
        };
        structureVisitor.dfs({newStartCallback: newStartCallback});
        expect(atoms.includes(structureAtomsInJson[0].id)).toEqual(true);
    });

    it(
        'tests the DFS over a structure with custom start atom id and newStartCallback callback',
        async function () {
            const structure = interactionDrawer.sceneData.structuresData.structures[0];
            const structureVisitor = new StructureVisitor(structure.atomsData, structure.edgesData);
            const structureAtomsInJson = interactionDrawerTestJson.scene.structures[0].atoms;
            const atoms = [];
            const newStartCallback = (atom) => {
                atoms.push(atom.id);
                return true;
            };
            const newStartId = structureAtomsInJson[1].id;
            structureVisitor.dfs({newStartCallback: newStartCallback, startIds: [newStartId]});
            expect(atoms.includes(newStartId)).toEqual(true);
        }
    );

    it('tests the callback at the end of DFS', async function () {
        const structure = interactionDrawer.sceneData.structuresData.structures[0];
        const structureVisitor = new StructureVisitor(structure.atomsData, structure.edgesData);
        const structureInJson = interactionDrawerTestJson.scene.structures[0];
        const finalizeCallback = (atomVisited, edgeVisited) => {
            expect(Object.keys(atomVisited).length).toEqual(structureInJson.atoms.length);
            for (const visited of Object.values(atomVisited)) {
                expect(visited).toEqual(true);
            }
            expect(edgeVisited.size).toEqual(structureInJson.bonds.length);
        };
        structureVisitor.dfs({finalizeCallback: finalizeCallback});
    });

    it('tests the multiEdgeVisitCallback of DFS', async function () {
        const structure = interactionDrawer.sceneData.structuresData.structures[0];
        const structureVisitor = new StructureVisitor(structure.atomsData, structure.edgesData);
        const edges = [];
        const multiEdgeVisitCallback = (atomId, nbId, edge) => {
            edges.push(edge.id);
        };
        structureVisitor.dfs({multiEdgeVisitCallback: multiEdgeVisitCallback});
        expect(edges).toEqual([2000030, 2000023, 2000008, 2000022]);
    });
});