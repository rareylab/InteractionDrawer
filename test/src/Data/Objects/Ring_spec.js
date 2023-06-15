describe('InteractionDrawer Data Objects Ring', function () {

    beforeEach(function () {
        $('<svg id="draw-area" width="100%" height="600px"></svg>').appendTo('body');
        copyTestConfig = Helpers.deepCloneObject(interactionDrawerTestConfig);
        const copyJson = Helpers.deepCloneObject(interactionDrawerTestJson);
        copyJson.scene.structures[0].additionalInformation = {test: 'test'};
        const interactionDrawer = new InteractionDrawer('draw-area', copyTestConfig);
        const inputJson = JSON.stringify(copyJson);
        interactionDrawer.addByJSON(inputJson);
        structure = interactionDrawer.sceneData.structuresData.structures['0'];
    });

    afterEach(function () {
        $('#draw-area').remove();
    });

    it('tests the creation of an EdgeInterface object (Edge)', async function () {
        const ring = structure.ringsData.rings['4000000'];
        expect(ring.id).toEqual(4000000);
        expect(ring.aromatic).toEqual(false);
        console.log(ring.aromatic)
        expect(ring.spaceToRing).toBeCloseTo(1.95);
        expect(ring.length).toEqual(6);
        expect(ring.edges.length).toEqual(6);
        expect(ring.edges[0].id).toEqual(2000029);
        expect(ring.edges[5].id).toEqual(2000030);
        expect(ring.edgeIdToPos).toEqual({
            2000029: 0, 2000030: 5, 2000031: 1, 2000032: 4, 2000033: 2, 2000034: 3
        });
        expect(ring.atoms.length).toEqual(6);
        expect(ring.atoms[0].id).toEqual(10021);
        expect(ring.atoms[5].id).toEqual(10024);
        expect(ring.atomIdToPos).toEqual({
            10021: 0, 10023: 1, 10024: 5, 10025: 2, 10026: 4, 10027: 3
        });
        expect(ring.edgeNormals['10021']['10023'].x).toBeCloseTo(-0.499);
        expect(ring.edgeNormals['10021']['10023'].y).toBeCloseTo(-0.866);
        expect(ring.edgeNormals['10021']['10024'].x).toBeCloseTo(-1);
        expect(ring.edgeNormals['10021']['10024'].y).toBeCloseTo(0);
        expect(ring.edgeNormals['10023']['10025'].x).toBeCloseTo(0.500);
        expect(ring.edgeNormals['10023']['10025'].y).toBeCloseTo(-0.866);
        expect(ring.edgeNormals['10024']['10026'].x).toBeCloseTo(-0.499);
        expect(ring.edgeNormals['10024']['10026'].y).toBeCloseTo(0.866);
        expect(ring.edgeNormals['10025']['10027'].x).toBeCloseTo(1);
        expect(ring.edgeNormals['10025']['10027'].y).toBeCloseTo(0);
        expect(ring.edgeNormals['10024']['10026'].x).toBeCloseTo(-0.499);
        expect(ring.edgeNormals['10024']['10026'].y).toBeCloseTo(0.866);
        expect(ring.edgeNormals['10026']['10027'].x).toBeCloseTo(0.500);
        expect(ring.edgeNormals['10026']['10027'].y).toBeCloseTo(0.866);
        expect(ring.edgePositions['10021']['10023'][0].x).toBeCloseTo(-46.601);
        expect(ring.edgePositions['10021']['10023'][0].y).toBeCloseTo(8.322);
        expect(ring.edgePositions['10021']['10023'][1].x).toBeCloseTo(-57.642);
        expect(ring.edgePositions['10021']['10023'][1].y).toBeCloseTo(14.696);
        expect(ring.edgePositions['10021']['10024'][0].x).toBeCloseTo(-46.602);
        expect(ring.edgePositions['10021']['10024'][0].y).toBeCloseTo(-4.426);
        expect(ring.edgePositions['10021']['10024'][1].x).toBeCloseTo(-46.602);
        expect(ring.edgePositions['10021']['10024'][1].y).toBeCloseTo(8.322);
        expect(ring.edgePositions['10023']['10025'][0].x).toBeCloseTo(-57.642);
        expect(ring.edgePositions['10023']['10025'][0].y).toBeCloseTo(14.696);
        expect(ring.edgePositions['10023']['10025'][1].x).toBeCloseTo(-68.682);
        expect(ring.edgePositions['10023']['10025'][1].y).toBeCloseTo(8.322);
        expect(ring.edgePositions['10024']['10026'][0].x).toBeCloseTo(-57.642);
        expect(ring.edgePositions['10024']['10026'][0].y).toBeCloseTo(-10.800);
        expect(ring.edgePositions['10024']['10026'][1].x).toBeCloseTo(-46.601);
        expect(ring.edgePositions['10024']['10026'][1].y).toBeCloseTo(-4.426);
        expect(ring.edgePositions['10025']['10027'][0].x).toBeCloseTo(-68.682);
        expect(ring.edgePositions['10025']['10027'][0].y).toBeCloseTo(8.322);
        expect(ring.edgePositions['10025']['10027'][1].x).toBeCloseTo(-68.682);
        expect(ring.edgePositions['10025']['10027'][1].y).toBeCloseTo(-4.426);
        expect(ring.edgePositions['10026']['10027'][0].x).toBeCloseTo(-68.682);
        expect(ring.edgePositions['10026']['10027'][0].y).toBeCloseTo(-4.426);
        expect(ring.edgePositions['10026']['10027'][1].x).toBeCloseTo(-57.642);
        expect(ring.edgePositions['10026']['10027'][1].y).toBeCloseTo(-10.800);
        expect(ring._firstAddedEdge.id).toEqual(2000029);
        expect(Object.keys(ring._atomIdsToEdges)).toEqual([
            '10021', '10023', '10024', '10025', '10026', '10027'
        ]);
        expect(ring.centroidInfo.centroid.x).toBeCloseTo(-57.642);
        expect(ring.centroidInfo.centroid.y).toBeCloseTo(1.947);
        expect(ring.centroidInfo.signedArea).toBeCloseTo(584.572);
    });

    it('tests the deep cloning of a Ring object.', async function () {
        const ring = structure.ringsData.rings['4000000'];
        const clonedRing = ring.clone();
        expect(ring.id).toEqual(clonedRing.id);
        expect(ring.aromatic).toEqual(clonedRing.aromatic);
        expect(ring.spaceToRing).toBeCloseTo(clonedRing.spaceToRing);
        expect(ring.length).toEqual(clonedRing.length);
        expect(ring.edges.length).toEqual(clonedRing.edges.length);
        expect(ring.edges[0]).not.toBe(clonedRing.edges[0]);
        expect(ring.edges[0].id).toEqual(clonedRing.edges[0].id);
        expect(ring.edges.length).toEqual(clonedRing.edges.length);
        expect(ring.edgeIdToPos).not.toBe(clonedRing.edgeIdToPos);
        expect(ring.edgeIdToPos).toEqual(clonedRing.edgeIdToPos);
        expect(ring.atoms.length).toEqual(6);
        expect(ring.atoms[0]).not.toBe(clonedRing.atoms[0]);
        expect(ring.atoms[0].id).toEqual(clonedRing.atoms[0].id);
        expect(ring.atoms.length).toEqual(clonedRing.atoms.length);
        expect(ring.atomIdToPos).toEqual(clonedRing.atomIdToPos);
        expect(ring.edgeNormals).not.toBe(clonedRing.edgeNormals);
        expect(ring.edgeNormals['10021']).not.toBe(clonedRing.edgeNormals['10021']);
        expect(ring.edgeNormals['10021']['10023']).not
            .toBe(clonedRing.edgeNormals['10021']['10023']);
        expect(ring.edgeNormals['10021']['10023'].x)
            .toBeCloseTo(clonedRing.edgeNormals['10021']['10023'].x);
        expect(ring.edgeNormals['10021']['10023'].y)
            .toBeCloseTo(clonedRing.edgeNormals['10021']['10023'].y);
        expect(ring.edgePositions).not.toBe(clonedRing.edgePositions);
        expect(clonedRing.edgePositions).toEqual({});
        expect(clonedRing._firstAddedEdge).toEqual(null);
        expect(ring.centroidInfo).not.toBe(clonedRing.centroidInfo);
        expect(ring.centroidInfo.centroid).not.toBe(clonedRing.centroidInfo.centroid);
        expect(ring.centroidInfo.centroid.x).toBeCloseTo(clonedRing.centroidInfo.centroid.x);
        expect(ring.centroidInfo.centroid.y).toBeCloseTo(clonedRing.centroidInfo.centroid.y);
        expect(ring.centroidInfo.signedArea).toBeCloseTo(clonedRing.centroidInfo.signedArea);
    });

    it('tests the adding of an Edge object to a ring', async function () {
        const ring = structure.ringsData.rings['4000000'];
        const edge = new Edge({type: 'single', id: 55555, from: 11111, to: 22222, aromatic: true});
        ring.addEdge(edge);
        expect(ring._atomIdsToEdges['11111'][0].id).toEqual(55555);
        expect(ring._atomIdsToEdges['22222'][0].id).toEqual(55555);
    });

    it('tests the retrieval of edge appearing next after a given edge', async function () {
        const ring = structure.ringsData.rings['4000000'];
        const edge = ring.getNextEdge(2000029);
        expect(edge.id).toEqual(2000031);
    });

    it('tests the retrieval of edge appearing before a given edge', async function () {
        const ring = structure.ringsData.rings['4000000'];
        const edge = ring.getPreviousEdge(2000029);
        expect(edge.id).toEqual(2000030);
    });

    it('tests the marking of a ring as aromatic', async function () {
        const ring = structure.ringsData.rings['4000000'];
        expect(ring.aromatic).toEqual(false);
        ring.setAromatic(true);
        expect(ring.aromatic).toEqual(true);
    });

    it('tests the retrieval of edge normal for an edge defined by its atoms', async function () {
        const ring = structure.ringsData.rings['4000000'];
        const edgeNormal = ring.getEdgeNormal(10026, 10027);
        expect(edgeNormal.x).toBeCloseTo(0.5);
        expect(edgeNormal.y).toBeCloseTo(0.866);
    });

    it('tests the retrieval of inner aromatic edge positions', async function () {
        const ring = structure.ringsData.rings['4000000'];
        const positions = ring.getEdgePositions(10024, 10026);
        expect(positions[0].x).toBeCloseTo(-57.642);
        expect(positions[0].y).toBeCloseTo(-10.800);
        expect(positions[1].x).toBeCloseTo(-46.601);
        expect(positions[1].y).toBeCloseTo(-4.426);
    });

    it('tests the retrieval of endpoints for the inner edge of a given edge', async function () {
        const ring = structure.ringsData.rings['4000000'];
        const positions = ring.findInnerPositionsForEdge(ring.edges[0]);
        expect(positions.from.x).toBeCloseTo(-46.601);
        expect(positions.from.y).toBeCloseTo(8.322);
        expect(positions.to.x).toBeCloseTo(-57.642);
        expect(positions.to.y).toBeCloseTo(14.696);
    });
});