describe('InteractionDrawer Data EdgesData', function () {

    beforeEach(function () {
        $('<svg id="draw-area" width="100%" height="600px"></svg>').appendTo('body');
        const copyTestConfig = Helpers.deepCloneObject(interactionDrawerTestConfig);
        const copyJson = Helpers.deepCloneObject(interactionDrawerTestJson);
        const interactionDrawer = new InteractionDrawer('draw-area', copyTestConfig);
        const inputJson = JSON.stringify(copyJson);
        interactionDrawer.addByJSON(inputJson);
        structureInJson = copyJson.scene.structures[3];
        structure = interactionDrawer.sceneData.structuresData.structures['3'];
    });

    afterEach(function () {
        $('#draw-area').remove();
    });

    it(
        'tests the adding of json data to the EdgesData object of a Structure object',
        async function () {
            const edgesInJson = structureInJson.bonds;
            const edgesData = structure.edgesData;
            checkEdgeNeighbours(edgesData.edgeNeighbors);
            checkEdgeIdxByIdMap(edgesData.edgeIdxById);
            checkEdgeIdByIdxMap(edgesData.edgeIdByIdx);
            expect(edgesData.edges.length).toEqual(edgesInJson.length);
            expect(Object.keys(edgesData.edgeByAtoms).length).toEqual(3);
            expect(edgesData.edgeByAtoms['10051']['10052'].constructor.name).toEqual('Edge');
            expect(Object.keys(edgesData.edgeById).length).toEqual(edgesInJson.length);
            expect(edgesData.edgeById['2000052'].constructor.name).toEqual('Edge');
            expect(edgesData.selectedEdges.size).toEqual(0);
            expect(edgesData.tempSelectedEdges.size).toEqual(0);
            expect(edgesData.avgEdgeLength).toBeCloseTo(15.0);
            checkAngles(edgesData, edgesInJson);
        }
    );

    it('tests the stereo center and hydrogen count postprocessing', async function () {
        const structureAtomsInJson = structureInJson.atoms;
        structureAtomsInJson[0].hydrogenCount = 'missing';
        structureAtomsInJson[1].hydrogenCount = 'missing';
        structureAtomsInJson[3].hydrogenCount = 'missing';
        const atomsData = structure.atomsData;
        const atomWithHydrogen = atomsData.atomById['10051'];
        const atomWithStereoCenter = atomsData.atomById['10052'];
        const atomWithNothing = atomsData.atomById['10054'];
        //set hydrogenCount for all Hs drawn without a bond (e.g. NH) excluding hydrogens of Cs
        expect(atomWithHydrogen.hydrogenCount).toEqual(1);
        expect(atomWithHydrogen.stereoCenter).toEqual(false);
        expect(atomWithStereoCenter.hydrogenCount).toEqual(0);
        expect(atomWithStereoCenter.stereoCenter).toEqual(true);
        expect(atomWithNothing.hydrogenCount).toEqual(0);
        expect(atomWithNothing.stereoCenter).toEqual(false);
    });

    function checkEdgeNeighbours(edgeNeighbors) {
        const expectedNeighbours = {
            '2000052': new Set([2000053]),
            '2000053': new Set([2000052, 2000054, 2000055]),
            '2000054': new Set([2000053, 2000055]),
            '2000055': new Set([2000053, 2000054, 2000056, 2000057]),
            '2000056': new Set([2000055, 2000057]),
            '2000057': new Set([2000055, 2000056])
        };
        expect(edgeNeighbors).toEqual(expectedNeighbours);
    }

    function checkEdgeIdxByIdMap(edgeIdxById) {
        const expectedIdxByIdMap = {
            '2000052': 0, '2000053': 1, '2000054': 2, '2000055': 3, '2000056': 4, '2000057': 5
        };
        expect(edgeIdxById).toEqual(expectedIdxByIdMap);
    }

    function checkEdgeIdByIdxMap(edgeIdByIdx) {
        const expectedIdByIdxMap = {
            '0': 2000052, '1': 2000053, '2': 2000054, '3': 2000055, '4': 2000056, '5': 2000057
        };
        expect(edgeIdByIdx).toEqual(expectedIdByIdxMap);
    }

    function checkAngles(edgesData, edgesInJson) {
        expect(Object.keys(edgesData.angles).length).toEqual(edgesInJson.length);
        const anglesFromEdge = edgesData.angles[2000055];
        expect(Object.keys(anglesFromEdge).length).toEqual(4)
        expect(anglesFromEdge['2000053']).toBeCloseTo(240.004);
        expect(anglesFromEdge['2000054']).toBeCloseTo(120.005);
        expect(anglesFromEdge['2000056']).toBeCloseTo(120.002);
        expect(anglesFromEdge['2000057']).toBeCloseTo(240.004);
    }

    it('tests the retrieval of an Edge object by Id', async function () {
        const edgesData = structure.edgesData;
        const edge = edgesData.getEdge(2000052);
        expect(edge.id).toEqual(2000052);
    });

    it('tests the calculation of the length of an edge', async function () {
        const edgesData = structure.edgesData;
        const length = edgesData.getEdgeLength(2000052);
        expect(length).toBeCloseTo(15.0);
    });

    it('tests the retrieval of atoms by given edge ids', async function () {
        const edgesData = structure.edgesData;
        const atomIds = edgesData.getAtomsByEdges([2000052, 2000053]);
        expect(atomIds).toEqual([10051, 10055, 10052]);
    });

    it('tests the retrieval of ids of all edges that are set for drawing', async function () {
        const edgesData = structure.edgesData;
        expect(edgesData.getAllEnabledEdges().length).toEqual(6);
        edgesData.getEdge(2000052).enabled = false;
        expect(edgesData.getAllEnabledEdges().length).toEqual(5);
    });

    it('tests the marking of an edge as selected in internal selection set', async function () {
        const edgesData = structure.edgesData;
        edgesData.selectEdge(2000052);
        expect(edgesData.selectedEdges.has(2000052)).toEqual(true);
    });

    it(
        'tests the temporary marking of an edge as selected in internal selection set',
        async function () {
            const edgesData = structure.edgesData;
            edgesData.tempSelectEdge(2000052);
            expect(edgesData.tempSelectedEdges.has(2000052)).toEqual(true);
        }
    );

    it('tests the retrieval of an edge by ids of its atoms', async function () {
        const edgesData = structure.edgesData;
        const edge = edgesData.getEdgeByAtomIds(10055, 10051);
        expect(edge.id).toEqual(2000052);
    });

    it('tests the retrieval of bonds with atoms affected by an interaction', async function () {
        const edgesData = structure.edgesData;
        const edgeIds = edgesData.getEdgesAffectedByAtoms([10055, 10052]);
        expect(edgeIds).toEqual(new Set([2000052, 2000053, 2000054, 2000055]));
    });

    it('tests whether neighboring edges are already selected upon edge select', async function () {
        const edgesData = structure.edgesData;
        edgesData.selectEdge(2000053);
        const atomIds = edgesData.findAtomsToSelectOnEdgeSelect(2000052);
        expect(atomIds).toEqual([10051]);
    });

    it('tests the retrieval of all edge atoms which are currently selected', async function () {
        const edgesData = structure.edgesData;
        edgesData.selectEdge(2000053);
        edgesData.selectEdge(2000052);
        structure.atomsData.selectAtom(10056);
        const atomIds = edgesData.getAtomsAffectedBySelection();
        expect(atomIds).toEqual([10051, 10052, 10055, 10056]);
    });
});