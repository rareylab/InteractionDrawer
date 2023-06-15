describe('InteractionDrawer Data Objects EdgeInterfaceBased', function () {

    beforeEach(function () {
        $('<svg id="draw-area" width="100%" height="600px"></svg>').appendTo('body');
        copyTestConfig = Helpers.deepCloneObject(interactionDrawerTestConfig);
        const copyJson = Helpers.deepCloneObject(interactionDrawerTestJson);
        copyJson.scene.structures[0].additionalInformation = {test: 'test'};
        const interactionDrawer = new InteractionDrawer('draw-area', copyTestConfig);
        const inputJson = JSON.stringify(copyJson);
        interactionDrawer.addByJSON(inputJson);
        structure = interactionDrawer.sceneData.structuresData.structures['0'];
        intermolecularData = interactionDrawer.sceneData.intermolecularData;
    });

    afterEach(function () {
        $('#draw-area').remove();
    });

    it('tests the creation of an EdgeInterface object (Edge)', async function () {
        const edge = structure.edgesData.edges[0];
        expect(edge.id).toEqual(2000000);
        expect(edge.from).toEqual(10000);
        expect(edge.to).toEqual(10001);
        expect(edge.enabled).toEqual(true);
        expect(edge.hidden).toEqual(false);
        expect(edge.wn).toEqual(0);
        expect(edge.tempHidden).toEqual(false);
        for (const info of [edge.drawInfo, edge.tempDrawInfo]) {
            const drawPoints = info.drawPoints;
            expect(drawPoints[0][0].x).toBeCloseTo(30.529);
            expect(drawPoints[0][0].y).toBeCloseTo(-53.271);
            expect(drawPoints[0][1].x).toBeCloseTo(24.035);
            expect(drawPoints[0][1].y).toBeCloseTo(-57.021);
            expect(drawPoints[1][0].x).toBeCloseTo(29.554);
            expect(drawPoints[1][0].y).toBeCloseTo(-51.582);
            expect(drawPoints[1][1].x).toBeCloseTo(23.060);
            expect(drawPoints[1][1].y).toBeCloseTo(-55.332);
            const midpoints = info.midpoints;
            expect(midpoints[0].x).toBeCloseTo(30.042);
            expect(midpoints[0].y).toBeCloseTo(-52.427);
            expect(midpoints[1].x).toBeCloseTo(23.547);
            expect(midpoints[1].y).toBeCloseTo(-56.176);
            const edgeCollisionPoints = info.edgeCollisionPoints;
            expect(edgeCollisionPoints[0].x).toBeCloseTo(30.692);
            expect(edgeCollisionPoints[0].y).toBeCloseTo(-53.552);
            expect(edgeCollisionPoints[1].x).toBeCloseTo(29.392);
            expect(edgeCollisionPoints[1].y).toBeCloseTo(-51.301);
            expect(edgeCollisionPoints[2].x).toBeCloseTo(22.897);
            expect(edgeCollisionPoints[2].y).toBeCloseTo(-55.051);
            expect(edgeCollisionPoints[3].x).toBeCloseTo(24.197);
            expect(edgeCollisionPoints[3].y).toBeCloseTo(-57.302);
            const selCollisionPoints = info.selCollisionPoints;
            expect(selCollisionPoints[0].x).toBeCloseTo(31.817);
            expect(selCollisionPoints[0].y).toBeCloseTo(-55.501);
            expect(selCollisionPoints[1].x).toBeCloseTo(28.267);
            expect(selCollisionPoints[1].y).toBeCloseTo(-49.352);
            expect(selCollisionPoints[2].x).toBeCloseTo(21.772);
            expect(selCollisionPoints[2].y).toBeCloseTo(-53.102);
            expect(selCollisionPoints[3].x).toBeCloseTo(25.322);
            expect(selCollisionPoints[3].y).toBeCloseTo(-59.251);
            expect(info.selWidth).toBeCloseTo(7.1);
        }
        expect(edge.type).toEqual('double');
        expect(edge.aromatic).toEqual(undefined);
        expect(edge.cyclic).toEqual(false);
        expect(edge.rings.size).toEqual(0);
        expect(edge.aromaticRings.size).toEqual(0);
        expect(edge.bcc).toEqual(1);
        expect(edge.ringSystem).toEqual(undefined);
        expect(edge.drawWithOffset).toEqual(false);
        expect(edge.drawnInRing).toEqual(undefined);
    });

    it(
        'tests the transfer of state of temporary parameters to their history relevant counterparts',
        async function () {
            const edge = structure.edgesData.edges[0];
            edge.tempDrawInfo = {};
            edge.tempHidden = true;
            expect(edge.tempDrawInfo).not.toEqual(edge.drawInfo);
            expect(edge.tempHidden).not.toEqual(edge.hidden);
            edge.transferTempInformation();
            expect(edge.tempDrawInfo).toEqual(edge.drawInfo);
            expect(edge.tempHidden).toEqual(edge.hidden);
        }
    );

    it(
        'tests the providing of relevant information to draw the bond in the draw area',
        async function () {
            const edge = structure.edgesData.edges[0];
            expect(edge.drawInfo).not.toEqual({});
            edge.setDrawInfo({}, true);
            expect(edge.tempDrawInfo).toEqual({});
            expect(edge.drawInfo).not.toEqual({});
            edge.setDrawInfo({}, false);
            expect(edge.drawInfo).toEqual({});
        }
    );

    it(
        'tests the retrieval of collision points for hit test on this edge (selector)',
        async function () {
            const edge = structure.edgesData.edges[0];
            const collisionPoints = edge.getCollisionPointsByMode('drawingOnly');
            expect(collisionPoints[0].x).toBeCloseTo(30.692);
        }
    );

    it(
        'tests the retrieval of collision points for hit test on this edge (selector)',
        async function () {
            const edge = structure.edgesData.edges[0];
            const collisionPoints = edge.getCollisionPointsByMode('selector');
            expect(collisionPoints[0].x).toBeCloseTo(31.817);
        }
    );

    it('tests the setting of edge hidden state', async function () {
        const edge = structure.edgesData.edges[0];
        expect(edge.drawInfo).not.toEqual({});
        edge.setHidden(true, true);
        expect(edge.tempHidden).toEqual(true);
        expect(edge.hidden).not.toEqual(true);
        edge.setHidden(true, false);
        expect(edge.hidden).toEqual(true);
    });

    it('tests the marking of a bond as part of a ring with given id', async function () {
        const edge = structure.edgesData.edges[0];
        expect(edge.rings.has(1)).toEqual(false);
        edge.addRing(1);
        expect(edge.rings.has(1)).toEqual(true);
    });

    it('tests the marking of a bond as part of an aromatic ring with given id', async function () {
        const edge = structure.edgesData.edges[0];
        expect(edge.aromaticRings.has(1)).toEqual(false);
        edge.addAromaticRing(1);
        expect(edge.aromaticRings.has(1)).toEqual(true);
    });

    it('tests if an edge is aromatic and not part of an aromatic ring', async function () {
        const edge = structure.edgesData.edges[0];
        edge.aromatic = false;
        expect(edge.aromaticRings.size).toEqual(0);
        expect(edge.cyclic).toEqual(false);
        expect(edge.isAromaticNoRing()).toEqual(false);
        edge.aromatic = true;
        expect(edge.isAromaticNoRing()).toEqual(true);
    });

    it('tests the deep cloning of a Edge object.', async function () {
        const edge = structure.edgesData.edges[0];
        const clonedEdge = edge.clone();
        expect(clonedEdge).not.toBe(edge);
        expect(edge.id).toEqual(clonedEdge.id);
        expect(edge.from).toEqual(clonedEdge.from);
        expect(edge.to).toEqual(clonedEdge.to);
        expect(edge.enabled).toEqual(clonedEdge.enabled);
        expect(edge.hidden).toEqual(clonedEdge.hidden);
        expect(edge.wn).toEqual(clonedEdge.wn);
        expect(edge.tempHidden).toEqual(clonedEdge.tempHidden);
        for (const info of [
            [edge.drawInfo, clonedEdge.drawInfo], [edge.tempDrawInfo, clonedEdge.tempDrawInfo]
        ]) {
            expect(info[0]).not.toBe(info[1]);
            const drawPoints = info[0].drawPoints;
            const clonedDrawPoints = info[1].drawPoints;
            expect(drawPoints).not.toBe(clonedDrawPoints);
            expect(drawPoints[0][0].x).toBeCloseTo(clonedDrawPoints[0][0].x);
            expect(drawPoints[0][0].y).toBeCloseTo(clonedDrawPoints[0][0].y);
            expect(drawPoints[0][1].x).toBeCloseTo(clonedDrawPoints[0][1].x);
            expect(drawPoints[0][1].y).toBeCloseTo(clonedDrawPoints[0][1].y);
            expect(drawPoints[1][0].x).toBeCloseTo(clonedDrawPoints[1][0].x);
            expect(drawPoints[1][0].y).toBeCloseTo(clonedDrawPoints[1][0].y);
            expect(drawPoints[1][1].x).toBeCloseTo(clonedDrawPoints[1][1].x);
            expect(drawPoints[1][1].y).toBeCloseTo(clonedDrawPoints[1][1].y);
            const midpoints = info[0].midpoints;
            const clonedMidpoints = info[1].midpoints;
            expect(midpoints).not.toBe(clonedMidpoints);
            expect(midpoints[0].x).toBeCloseTo(clonedMidpoints[0].x);
            expect(midpoints[0].y).toBeCloseTo(clonedMidpoints[0].y);
            expect(midpoints[1].x).toBeCloseTo(clonedMidpoints[1].x);
            expect(midpoints[1].y).toBeCloseTo(clonedMidpoints[1].y);
            const edgeCollisionPoints = info[0].edgeCollisionPoints;
            const clonedEdgeCollisionPoints = info[1].edgeCollisionPoints;
            expect(edgeCollisionPoints).not.toBe(clonedEdgeCollisionPoints);
            expect(edgeCollisionPoints[0].x).toBeCloseTo(clonedEdgeCollisionPoints[0].x);
            expect(edgeCollisionPoints[0].y).toBeCloseTo(clonedEdgeCollisionPoints[0].y);
            expect(edgeCollisionPoints[1].x).toBeCloseTo(clonedEdgeCollisionPoints[1].x);
            expect(edgeCollisionPoints[1].y).toBeCloseTo(clonedEdgeCollisionPoints[1].y);
            expect(edgeCollisionPoints[2].x).toBeCloseTo(clonedEdgeCollisionPoints[2].x);
            expect(edgeCollisionPoints[2].y).toBeCloseTo(clonedEdgeCollisionPoints[2].y);
            expect(edgeCollisionPoints[3].x).toBeCloseTo(clonedEdgeCollisionPoints[3].x);
            expect(edgeCollisionPoints[3].y).toBeCloseTo(clonedEdgeCollisionPoints[3].y);
            const selCollisionPoints = info[0].selCollisionPoints;
            const clonedSelCollisionPoints = info[1].selCollisionPoints;
            expect(selCollisionPoints).not.toBe(clonedSelCollisionPoints);
            expect(selCollisionPoints[0].x).toBeCloseTo(clonedSelCollisionPoints[0].x);
            expect(selCollisionPoints[0].y).toBeCloseTo(clonedSelCollisionPoints[0].y);
            expect(selCollisionPoints[1].x).toBeCloseTo(clonedSelCollisionPoints[1].x);
            expect(selCollisionPoints[1].y).toBeCloseTo(clonedSelCollisionPoints[1].y);
            expect(selCollisionPoints[2].x).toBeCloseTo(clonedSelCollisionPoints[2].x);
            expect(selCollisionPoints[2].y).toBeCloseTo(clonedSelCollisionPoints[2].y);
            expect(selCollisionPoints[3].x).toBeCloseTo(clonedSelCollisionPoints[3].x);
            expect(selCollisionPoints[3].y).toBeCloseTo(clonedSelCollisionPoints[3].y);
            expect(info[0].selWidth).toBeCloseTo(info[1].selWidth);
        }
        expect(edge.type).toEqual(clonedEdge.type);
        expect(edge.aromatic).toEqual(clonedEdge.aromatic);
        expect(edge.cyclic).toEqual(clonedEdge.cyclic);
        expect(edge.rings.size).toEqual(clonedEdge.rings.size);
        expect(edge.aromaticRings.size).toEqual(clonedEdge.aromaticRings.size);
        expect(edge.bcc).toEqual(clonedEdge.bcc);
        expect(edge.ringSystem).toEqual(clonedEdge.ringSystem);
        expect(edge.drawWithOffset).toEqual(clonedEdge.drawWithOffset);
        expect(edge.drawnInRing).toEqual(clonedEdge.drawnInRing);
    });

    it('tests the creation of an EdgeInterface object (IntermolecularEdge)', async function () {
        const edge = intermolecularData.atomPairInteractions['0'];
        expect(edge.id).toEqual(0);
        expect(edge.from).toEqual(10001);
        expect(edge.to).toEqual(10040);
        expect(edge.enabled).toEqual(true);
        expect(edge.hidden).toEqual(false);
        expect(edge.wn).toEqual(0);
        expect(edge.tempHidden).toEqual(false);
        for (const info of [edge.drawInfo, edge.tempDrawInfo]) {
            const drawPoints = info.drawPoints;
            expect(drawPoints[0][0].x).toBeCloseTo(16.835);
            expect(drawPoints[0][0].y).toBeCloseTo(-59.487);
            expect(drawPoints[0][1].x).toBeCloseTo(-5.189);
            expect(drawPoints[0][1].y).toBeCloseTo(-68.616);
            const midpoints = info.midpoints;
            expect(midpoints[0].x).toBeCloseTo(16.835);
            expect(midpoints[0].y).toBeCloseTo(-59.487);
            expect(midpoints[1].x).toBeCloseTo(-5.189);
            expect(midpoints[1].y).toBeCloseTo(-68.616);
            const edgeCollisionPoints = info.edgeCollisionPoints;
            expect(edgeCollisionPoints[0].x).toBeCloseTo(16.960);
            expect(edgeCollisionPoints[0].y).toBeCloseTo(-59.787);
            expect(edgeCollisionPoints[1].x).toBeCloseTo(16.711);
            expect(edgeCollisionPoints[1].y).toBeCloseTo(-59.187);
            expect(edgeCollisionPoints[2].x).toBeCloseTo(-5.314);
            expect(edgeCollisionPoints[2].y).toBeCloseTo(-68.316);
            const selCollisionPoints = info.selCollisionPoints;
            expect(selCollisionPoints[0].x).toBeCloseTo(17.821);
            expect(selCollisionPoints[0].y).toBeCloseTo(-61.866);
            expect(selCollisionPoints[1].x).toBeCloseTo(15.849);
            expect(selCollisionPoints[1].y).toBeCloseTo(-57.108);
            expect(selCollisionPoints[2].x).toBeCloseTo(-6.175);
            expect(selCollisionPoints[2].y).toBeCloseTo(-66.237);
            expect(info.selWidth).toBeCloseTo(5.15);
        }
        expect(edge.type).toEqual(undefined);
        expect(edge.fromStructure).toEqual(0);
        expect(edge.toStructure).toEqual(1);
        expect(edge.color).toEqual('rgb(102, 153, 255)');
        expect(edge.additionalInformation).toEqual({});
        expect(edge.selected).toEqual(false);
        expect(edge.tempSelected).toEqual(false);
    });

    it('tests the deep cloning of a IntermolecularEdge object.', async function () {
        const edge = intermolecularData.atomPairInteractions['0'];
        const clonedEdge = edge.clone();
        expect(clonedEdge).not.toBe(edge);
        expect(edge.id).toEqual(clonedEdge.id);
        expect(edge.from).toEqual(clonedEdge.from);
        expect(edge.to).toEqual(clonedEdge.to);
        expect(edge.enabled).toEqual(clonedEdge.enabled);
        expect(edge.hidden).toEqual(clonedEdge.hidden);
        expect(edge.wn).toEqual(clonedEdge.wn);
        expect(edge.tempHidden).toEqual(clonedEdge.tempHidden);
        for (const info of [
            [edge.drawInfo, clonedEdge.drawInfo], [edge.tempDrawInfo, clonedEdge.tempDrawInfo]
        ]) {
            expect(info[0]).not.toBe(info[1]);
            const drawPoints = info[0].drawPoints;
            const clonedDrawPoints = info[1].drawPoints;
            expect(drawPoints).not.toBe(clonedDrawPoints);
            expect(drawPoints[0][0].x).toBeCloseTo(clonedDrawPoints[0][0].x);
            expect(drawPoints[0][0].y).toBeCloseTo(clonedDrawPoints[0][0].y);
            expect(drawPoints[0][1].x).toBeCloseTo(clonedDrawPoints[0][1].x);
            expect(drawPoints[0][1].y).toBeCloseTo(clonedDrawPoints[0][1].y);
            const midpoints = info[0].midpoints;
            const clonedMidpoints = info[1].midpoints;
            expect(midpoints).not.toBe(clonedMidpoints);
            expect(midpoints[0].x).toBeCloseTo(clonedMidpoints[0].x);
            expect(midpoints[0].y).toBeCloseTo(clonedMidpoints[0].y);
            const edgeCollisionPoints = info[0].edgeCollisionPoints;
            const clonedEdgeCollisionPoints = info[1].edgeCollisionPoints;
            expect(edgeCollisionPoints).not.toBe(clonedEdgeCollisionPoints);
            expect(edgeCollisionPoints[0].x).toBeCloseTo(clonedEdgeCollisionPoints[0].x);
            expect(edgeCollisionPoints[0].y).toBeCloseTo(clonedEdgeCollisionPoints[0].y);
            expect(edgeCollisionPoints[1].x).toBeCloseTo(clonedEdgeCollisionPoints[1].x);
            expect(edgeCollisionPoints[1].y).toBeCloseTo(clonedEdgeCollisionPoints[1].y);
            expect(edgeCollisionPoints[2].x).toBeCloseTo(clonedEdgeCollisionPoints[2].x);
            expect(edgeCollisionPoints[2].y).toBeCloseTo(clonedEdgeCollisionPoints[2].y);
            const selCollisionPoints = info[0].selCollisionPoints;
            const clonedSelCollisionPoints = info[1].selCollisionPoints;
            expect(selCollisionPoints).not.toBe(clonedSelCollisionPoints);
            expect(selCollisionPoints[0].x).toBeCloseTo(clonedSelCollisionPoints[0].x);
            expect(selCollisionPoints[0].y).toBeCloseTo(clonedSelCollisionPoints[0].y);
            expect(selCollisionPoints[1].x).toBeCloseTo(clonedSelCollisionPoints[1].x);
            expect(selCollisionPoints[1].y).toBeCloseTo(clonedSelCollisionPoints[1].y);
            expect(selCollisionPoints[2].x).toBeCloseTo(clonedSelCollisionPoints[2].x);
            expect(selCollisionPoints[2].y).toBeCloseTo(clonedSelCollisionPoints[2].y);
            expect(info[0].selWidth).toBeCloseTo(info[1].selWidth);
        }
        expect(edge.type).toEqual(clonedEdge.type);
        expect(edge.fromStructure).toEqual(clonedEdge.fromStructure);
        expect(edge.toStructure).toEqual(clonedEdge.toStructure);
        expect(edge.color).toEqual(clonedEdge.color);
        expect(edge.additionalInformation).not.toBe(clonedEdge.additionalInformation);
        expect(edge.additionalInformation).toEqual({});
        expect(edge.selected).toEqual(clonedEdge.selected);
        expect(edge.tempSelected).toEqual(clonedEdge.tempSelected);
    });
});