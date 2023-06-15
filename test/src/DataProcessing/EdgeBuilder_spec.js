describe('InteractionDrawer DataProcessing EdgeBuilder', function () {

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

    it('tests the collection of relevant information to draw a double bond from data',
        async function () {
            const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
            const structure = edgeBuilder.sceneData.structuresData.structures['0'];
            const edge = structure.edgesData.getEdge(2000000);
            const drawInfo = edgeBuilder.createBondByType(10000, 10001, structure, edge, false);
            const expected = {
                drawPoints: [
                    [{x: 30.529, y: -53.271}, {x: 24.035, y: -57.021}],
                    [{x: 29.554, y: -51.582}, {x: 23.060, y: -55.332}]
                ],
                midpoints: [{x: 30.042, y: -52.427}, {x: 23.547, y: -56.176}],
                edgeCollisionPoints: [
                    {x: 30.692, y: -53.552},
                    {x: 29.392, y: -51.301},
                    {x: 22.897, y: -55.051},
                    {x: 24.197, y: -57.302}
                ],
                selCollisionPoints: [
                    {x: 31.817, y: -55.501},
                    {x: 28.267, y: -49.352},
                    {x: 21.772, y: -53.102},
                    {x: 25.322, y: -59.251}
                ],
                selWidth: 7.1
            };
            checkEdge(drawInfo, expected);
        }
    );

    it('tests the collection of relevant information to draw a single bond from data',
        async function () {
            const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
            const structure = edgeBuilder.sceneData.structuresData.structures['0'];
            const edge = structure.edgesData.getEdge(2000002);
            const drawInfo = edgeBuilder.createBondByType(10000, 10009, structure, edge, false);
            const expected = {
                drawPoints: [[{x: 35.165, y: -53.799}, {x: 38.914, y: -60.294}]],
                midpoints: [{x: 35.165, y: -53.799}, {x: 38.914, y: -60.294}],
                edgeCollisionPoints: [
                    {x: 35.446, y: -53.637},
                    {x: 34.883, y: -53.962},
                    {x: 38.633, y: -60.456},
                    {x: 39.196, y: -60.131}
                ],
                selCollisionPoints: [
                    {x: 37.395, y: -52.512},
                    {x: 32.935, y: -55.087},
                    {x: 36.684, y: -61.581},
                    {x: 41.144, y: -59.006}
                ],
                selWidth: 5.15
            };
            checkEdge(drawInfo, expected, edge.type);
        }
    );

    it('tests the collection of relevant information to draw a aromatic bond from data',
        async function () {
            const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
            const structure = edgeBuilder.sceneData.structuresData.structures['0'];
            const edge = structure.edgesData.getEdge(2000006);
            const drawInfo = edgeBuilder.createBondByType(10004, 10010, structure, edge, false);
            const expected = {
                drawPoints: [[{x: 10.556, y: 11.322}, {x: 20.3, y: 16.948}]],
                midpoints: [{x: 10.069, y: 12.167}, {x: 19.812, y: 17.792}],
                edgeCollisionPoints: [
                    {x: 9.419, y: 13.293},
                    {x: 10.719, y: 11.041},
                    {x: 20.462, y: 16.666},
                    {x: 19.162, y: 18.918}
                ],
                selCollisionPoints: [
                    {x: 8.294, y: 15.241},
                    {x: 11.844, y: 9.092},
                    {x: 21.587, y: 14.717},
                    {x: 18.037, y: 20.866}
                ],
                selWidth: 7.1
            };
            checkEdge(drawInfo, expected, edge.type);
        }
    );

    it('tests the collection of relevant information to draw a triple bond', async function () {
        const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
        const drawInfo = edgeBuilder.createTripleBond({x: 0, y: 0}, {x: 0, y: 1});
        const expected = {
            drawPoints: [
                [{x: -1.4, y: 0}, {x: -1.4, y: 1}],
                [{x: 0, y: 0}, {x: 0, y: 1}],
                [{x: 1.4, y: 0}, {x: 1.4, y: 1}]
            ], midpoints: [{x: 0, y: 0}, {x: 0, y: 1}], edgeCollisionPoints: [
                {x: -1.725, y: 0}, {x: 1.725, y: 0}, {x: 1.725, y: 1}, {x: -1.725, y: 1}
            ], selCollisionPoints: [
                {x: -3.975, y: 0}, {x: 3.975, y: 0}, {x: 3.975, y: 1}, {x: -3.975, y: 1}
            ], selWidth: 7.95
        };
        checkEdge(drawInfo, expected, 'triple');
    });

    it('tests the collection of relevant information to draw a stereoBack bond', async function () {
        const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
        const drawInfo = edgeBuilder.createStereoBack({x: 0, y: 0}, {x: 0, y: 2});
        const expected = {
            drawPoints: [
                [{x: -0.203, y: 0.325}, {x: 0.203, y: 0.325}],
                [{x: -1.234, y: 1.974}, {x: 1.23, y: 1.974}]
            ],
            midpoints: [{x: 0, y: 0}, {x: 0, y: 2}],
            edgeCollisionPoints: [{x: 0, y: 0}, {x: -1.25, y: 2}, {x: 1.25, y: 2}],
            selCollisionPoints: [
                {x: -2.575, y: 0}, {x: 2.575, y: 0}, {x: 2.575, y: 2}, {x: -2.575, y: 2}
            ],
            selWidth: 5.15
        };
        checkEdge(drawInfo, expected, 'stereoBack');
    });

    it('tests the collection of relevant information to draw a stereoBackReverse bond',
        async function () {
            const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
            const drawInfo = edgeBuilder.createStereoBack({x: 0, y: 2}, {x: 0, y: 0});
            const expected = {
                drawPoints: [
                    [{x: 0.203, y: 1.675}, {x: -0.203, y: 1.675}],
                    [{x: 1.234, y: 0.024}, {x: -1.234, y: 0.024}]
                ],
                midpoints: [{x: 0, y: 2}, {x: 0, y: 0}],
                edgeCollisionPoints: [{x: 0, y: 2}, {x: 1.25, y: 0}, {x: -1.25, y: 0}],
                selCollisionPoints: [
                    {x: 2.575, y: 2}, {x: -2.575, y: 2}, {x: -2.575, y: 0}, {x: 2.575, y: 0}
                ],
                selWidth: 5.15
            };
            checkEdge(drawInfo, expected, 'stereoBack')
        }
    );

    it('tests the collection of relevant information to draw a stereoFront bond',
        async function () {
            const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
            const drawInfo = edgeBuilder.createStereoFront({x: 0, y: 0}, {x: 0, y: 2});
            const expected = {
                drawPoints: [
                    [{x: 0.15, y: 0}, {x: -0.15, y: 0}], [{x: -1.25, y: 2}, {x: 1.25, y: 2}]
                ], midpoints: [{x: 0, y: 0}, {x: 0, y: 2}], edgeCollisionPoints: [
                    {x: 0.15, y: 0}, {x: -0.15, y: 0}, {x: -1.25, y: 2}, {x: 1.25, y: 2}
                ], selCollisionPoints: [
                    {x: -2.575, y: 0}, {x: 2.575, y: 0}, {x: 2.575, y: 2}, {x: -2.575, y: 2}
                ], selWidth: 5.15
            };
            checkEdge(drawInfo, expected, 'stereoFront');
        }
    );

    it('tests the collection of relevant information to draw a stereoFrontReverse bond',
        async function () {
            const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
            const drawInfo = edgeBuilder.createStereoFront({x: 0, y: 2}, {x: 0, y: 0});
            const expected = {
                drawPoints: [
                    [{x: -0.15, y: 2}, {x: 0.15, y: 2}], [{x: -1.25, y: 0}, {x: 1.25, y: 0}]
                ], midpoints: [{x: 0, y: 2}, {x: 0, y: 0}], edgeCollisionPoints: [
                    {x: -0.15, y: 2}, {x: 0.15, y: 2}, {x: 1.25, y: 0}, {x: -1.25, y: 0}
                ], selCollisionPoints: [
                    {x: 2.575, y: 2}, {x: -2.575, y: 2}, {x: -2.575, y: 0}, {x: 2.575, y: 0}
                ], selWidth: 5.15
            };
            checkEdge(drawInfo, expected, 'stereoFront');
        }
    );

    it(
        'tests the calculation of coordinates for drawing of intermolecular edge (atom pair interaction, 2x default representation)',
        async function () {
            const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
            const structures = edgeBuilder.sceneData.structuresData.structures;
            const coordinates = edgeBuilder.getNewIntermolecularCoords(0,
                'atomPairInteractions',
                structures['0'],
                structures['1'],
                10001,
                10040,
                false
            );
            expect(coordinates[0].x).toBeCloseTo(16.835);
            expect(coordinates[0].y).toBeCloseTo(-59.487);
            expect(coordinates[1].x).toBeCloseTo(-5.189);
            expect(coordinates[1].y).toBeCloseTo(-68.616);
        }
    );

    it(
        'tests the calculation of coordinates for drawing of intermolecular edge (cation pi stackings, 2x default representation)',
        async function () {
            const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
            const structures = edgeBuilder.sceneData.structuresData.structures;
            const coordinates = edgeBuilder.getNewIntermolecularCoords(0,
                'cationPiStackings',
                structures['0'],
                structures['1'],
                4000001,
                10040,
                false
            );
            expect(coordinates[0].x).toBeCloseTo(33.29);
            expect(coordinates[0].y).toBeCloseTo(-20.552);
            expect(coordinates[1].x).toBeCloseTo(-6.229);
            expect(coordinates[1].y).toBeCloseTo(-67.190);
        }
    );

    it(
        'tests the calculation of coordinates for drawing of intermolecular edge (pi stackings, 2x default representation)',
        async function () {
            const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
            const structures = edgeBuilder.sceneData.structuresData.structures;
            const coordinates = edgeBuilder.getNewIntermolecularCoords(0,
                'piStackings',
                structures['0'],
                structures['4'],
                4000002,
                4000004,
                false
            );
            expect(coordinates[0].x).toBeCloseTo(7.309);
            expect(coordinates[0].y).toBeCloseTo(24.448);
            expect(coordinates[1].x).toBeCloseTo(-53.380);
            expect(coordinates[1].y).toBeCloseTo(88.229);
        }
    );

    it(
        'tests the calculation of coordinates for drawing of intermolecular edge (atom pair interaction, default + structure circle representation)',
        async function () {
            const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
            const structures = edgeBuilder.sceneData.structuresData.structures;
            structures['0'].representationsData.currentRepresentation =
                StructureRepresentation.circle;
            const coordinates = edgeBuilder.getNewIntermolecularCoords(0,
                'atomPairInteractions',
                structures['0'],
                structures['1'],
                10001,
                10040,
                false
            );
            expect(coordinates[0].x).toBeCloseTo(0.100);
            expect(coordinates[0].y).toBeCloseTo(-24.439);
            expect(coordinates[1].x).toBeCloseTo(-7.947);
            expect(coordinates[1].y).toBeCloseTo(-66.369);
        }
    );

    it(
        'tests the calculation of coordinates for drawing of intermolecular edge (cation pi stacking, default + structure circle representation)',
        async function () {
            const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
            const structures = edgeBuilder.sceneData.structuresData.structures;
            structures['0'].representationsData.currentRepresentation =
                StructureRepresentation.circle;
            const coordinates = edgeBuilder.getNewIntermolecularCoords(0,
                'cationPiStackings',
                structures['0'],
                structures['1'],
                4000001,
                10040,
                false
            );
            expect(coordinates[0].x).toBeCloseTo(0.100);
            expect(coordinates[0].y).toBeCloseTo(-24.439);
            expect(coordinates[1].x).toBeCloseTo(-7.947);
            expect(coordinates[1].y).toBeCloseTo(-66.369);
        }
    );

    it(
        'tests the calculation of coordinates for drawing of intermolecular edge (pi stacking, default + structure circle representation)',
        async function () {
            const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
            const structures = edgeBuilder.sceneData.structuresData.structures;
            structures['0'].representationsData.currentRepresentation =
                StructureRepresentation.circle;
            const coordinates = edgeBuilder.getNewIntermolecularCoords(0,
                'piStackings',
                structures['0'],
                structures['4'],
                4000002,
                4000004,
                false
            );
            expect(coordinates[0].x).toBeCloseTo(-7.987);
            expect(coordinates[0].y).toBeCloseTo(17.503);
            expect(coordinates[1].x).toBeCloseTo(-53.380);
            expect(coordinates[1].y).toBeCloseTo(88.229);
        }
    );

    it(
        'tests the calculation of coordinates for drawing of intermolecular edge (atom pair interaction, 2x structure circle representation)',
        async function () {
            const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
            const structures = edgeBuilder.sceneData.structuresData.structures;
            structures['0'].representationsData.currentRepresentation =
                StructureRepresentation.circle;
            structures['1'].representationsData.currentRepresentation =
                StructureRepresentation.circle;
            const coordinates = edgeBuilder.getNewIntermolecularCoords(0,
                'atomPairInteractions',
                structures['0'],
                structures['1'],
                10001,
                10040,
                false
            );
            expect(coordinates[0].x).toBeCloseTo(9.827);
            expect(coordinates[0].y).toBeCloseTo(-24.211);
            expect(coordinates[1].x).toBeCloseTo(3.051);
            expect(coordinates[1].y).toBeCloseTo(-83.987);
        }
    );

    it(
        'tests the calculation of coordinates for drawing of intermolecular edge (cation pi stacking, 2x structure circle representation)',
        async function () {
            const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
            const structures = edgeBuilder.sceneData.structuresData.structures;
            structures['0'].representationsData.currentRepresentation =
                StructureRepresentation.circle;
            structures['1'].representationsData.currentRepresentation =
                StructureRepresentation.circle;
            const coordinates = edgeBuilder.getNewIntermolecularCoords(0,
                'cationPiStackings',
                structures['0'],
                structures['1'],
                4000001,
                10040,
                false
            );
            expect(coordinates[0].x).toBeCloseTo(-5.822);
            expect(coordinates[0].y).toBeCloseTo(-22.437);
            expect(coordinates[1].x).toBeCloseTo(-12.598);
            expect(coordinates[1].y).toBeCloseTo(-82.213);
        }
    );

    it(
        'tests the calculation of coordinates for drawing of intermolecular edge (pi stacking, 2x structure circle representation)',
        async function () {
            const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
            const structures = edgeBuilder.sceneData.structuresData.structures;
            structures['0'].representationsData.currentRepresentation =
                StructureRepresentation.circle;
            structures['4'].representationsData.currentRepresentation =
                StructureRepresentation.circle;
            const coordinates = edgeBuilder.getNewIntermolecularCoords(0,
                'piStackings',
                structures['0'],
                structures['4'],
                4000002,
                4000004,
                false
            );
            expect(coordinates[0].x).toBeCloseTo(-6.641);
            expect(coordinates[0].y).toBeCloseTo(18.304);
            expect(coordinates[1].x).toBeCloseTo(-41.005);
            expect(coordinates[1].y).toBeCloseTo(80.834);
        }
    );

    it(
        'tests the calculation of coordinates for drawing of intermolecular edge (atom pair interaction, 2x default representation, temp coordinates)',
        async function () {
            const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
            const structures = edgeBuilder.sceneData.structuresData.structures;
            const structureFrom = structures['0'];
            const structureTo = structures['1'];
            structureFrom.atomsData.getAtom(10001).tempCoordinates = {x: 0, y: 0};
            structureTo.atomsData.getAtom(10040).tempCoordinates = {x: 0, y: 5};
            const coordinates = edgeBuilder.getNewIntermolecularCoords(0,
                'atomPairInteractions',
                structureFrom,
                structureTo,
                10001,
                10040,
                true
            );
            expect(coordinates[0].x).toBeCloseTo(0);
            expect(coordinates[0].y).toBeCloseTo(3.75);
            expect(coordinates[1].x).toBeCloseTo(0);
            expect(coordinates[1].y).toBeCloseTo(1.25);
        }
    );

    it(
        'tests the calculation of coordinates for drawing of intermolecular edge (cation pi stacking, default + structure circle representation)',
        async function () {
            const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
            const structures = edgeBuilder.sceneData.structuresData.structures;
            const structureFrom = structures['0'];
            const structureTo = structures['1'];
            structureFrom.representationsData.currentRepresentation =
                StructureRepresentation.circle;
            structureFrom.representationsData.structureCircle.tempCoordinates = {x: 0, y: 0};
            structureTo.atomsData.getAtom(10040).tempCoordinates = {x: 0, y: 50};
            const coordinates = edgeBuilder.getNewIntermolecularCoords(0,
                'cationPiStackings',
                structureFrom,
                structureTo,
                4000001,
                10040,
                true
            );
            expect(coordinates[0].x).toBeCloseTo(0);
            expect(coordinates[0].y).toBeCloseTo(23);
            expect(coordinates[1].x).toBeCloseTo(0);
            expect(coordinates[1].y).toBeCloseTo(46.25);
        }
    );

    it(
        'tests the calculation of coordinates for drawing of intermolecular edge (pi stacking, 2x structure circle representation, temp coordinates)',
        async function () {
            const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
            const structures = edgeBuilder.sceneData.structuresData.structures;
            const structureFrom = structures['0'];
            const structureTo = structures['4'];
            structureFrom.representationsData.currentRepresentation =
                StructureRepresentation.circle;
            structureTo.representationsData.currentRepresentation = StructureRepresentation.circle;
            structureFrom.representationsData.structureCircle.tempCoordinates = {x: 0, y: 0};
            structureTo.representationsData.structureCircle.tempCoordinates = {x: 0, y: 50};
            const coordinates = edgeBuilder.getNewIntermolecularCoords(0,
                'piStackings',
                structureFrom,
                structureTo,
                4000002,
                4000004,
                true
            );
            //radii 23 and 17
            expect(coordinates[0].x).toBeCloseTo(0);
            expect(coordinates[0].y).toBeCloseTo(23);
            expect(coordinates[1].x).toBeCloseTo(0);
            expect(coordinates[1].y).toBeCloseTo(33);
        }
    );

    it('tests the calculation of edge midpoints', async function () {
        const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
        const structure = edgeBuilder.sceneData.structuresData.structures['0'];
        const from = structure.atomsData.getAtom(10000);
        const to = structure.atomsData.getAtom(10009);
        const midPoints = edgeBuilder.getEdgeMidPoints(from, to, false, false, 0);
        expect(midPoints[0].x).toBeCloseTo(35.165);
        expect(midPoints[0].y).toBeCloseTo(-53.799);
        expect(midPoints[1].x).toBeCloseTo(38.914);
        expect(midPoints[1].y).toBeCloseTo(-60.294);
    });

    it('tests the calculation of edge midpoints (directionCheck false)', async function () {
        const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
        const structure = edgeBuilder.sceneData.structuresData.structures['0'];
        const from = structure.atomsData.getAtom(10000);
        const to = structure.atomsData.getAtom(10009);
        //atom radius is 3.75
        from.coordinates = {x: 0, y: 0};
        to.coordinates = {x: 0, y: 3.75};
        const midPoints = edgeBuilder.getEdgeMidPoints(from, to, false, true, 0);
        expect(midPoints).toEqual(null)
    });

    it('tests the calculation of edge midpoints (forcedMinDist set)', async function () {
        const edgeBuilder = interactionDrawer.svgDrawer.edgeDrawer.edgeBuilder;
        const structure = edgeBuilder.sceneData.structuresData.structures['0'];
        const from = structure.atomsData.getAtom(10000);
        const to = structure.atomsData.getAtom(10009);
        //atom radius is 3.75
        from.coordinates = {x: 0, y: 0};
        to.coordinates = {x: 0, y: 5};
        const midPoints = edgeBuilder.getEdgeMidPoints(from, to, false, false, 10);
        expect(midPoints[0].x).toBeCloseTo(0);
        expect(midPoints[0].y).toBeCloseTo(10);
        expect(midPoints[1].x).toBeCloseTo(0);
        expect(midPoints[1].y).toBeCloseTo(-5);
    });

    function checkEdge(drawInfo, expected, type) {
        expect(drawInfo.selWidth).toBeCloseTo(drawInfo.selWidth);
        checkLinePoints(drawInfo, expected, type);
        checkEdgeCollisionPoints(drawInfo, expected, type);
        checkSelCollisionPoints(drawInfo, expected, type);
    }

    function checkLinePoints(drawInfo, expected, type) {
        const line1DrawPoints = drawInfo.drawPoints[0];
        const expectedLine1DrawPoints = expected.drawPoints[0];
        expect(line1DrawPoints[0].x).toBeCloseTo(expectedLine1DrawPoints[0].x);
        expect(line1DrawPoints[0].y).toBeCloseTo(expectedLine1DrawPoints[0].y);
        expect(line1DrawPoints[1].x).toBeCloseTo(expectedLine1DrawPoints[1].x);
        expect(line1DrawPoints[1].y).toBeCloseTo(expectedLine1DrawPoints[1].y);
        if (type === 'double' || type === 'stereoBack') {
            const line2DrawPoints = drawInfo.drawPoints[1];
            const expectedLine2DrawPoints = expected.drawPoints[1];
            expect(line2DrawPoints[0].x).toBeCloseTo(expectedLine2DrawPoints[0].x);
            expect(line2DrawPoints[0].y).toBeCloseTo(expectedLine2DrawPoints[0].y);
            expect(line2DrawPoints[1].x).toBeCloseTo(expectedLine2DrawPoints[1].x);
            expect(line2DrawPoints[1].y).toBeCloseTo(expectedLine2DrawPoints[1].y);
        }
        if (type === 'triple') {
            const line3DrawPoints = drawInfo.drawPoints[2];
            const expectedLine3DrawPoints = expected.drawPoints[2];
            expect(line3DrawPoints[0].x).toBeCloseTo(expectedLine3DrawPoints[0].x);
            expect(line3DrawPoints[0].y).toBeCloseTo(expectedLine3DrawPoints[0].y);
            expect(line3DrawPoints[1].x).toBeCloseTo(expectedLine3DrawPoints[1].x);
            expect(line3DrawPoints[1].y).toBeCloseTo(expectedLine3DrawPoints[1].y);
        }
        const line1MidPoint = drawInfo.midpoints[0];
        const expectedLine1MidPoint = expected.midpoints[0];
        expect(line1MidPoint.x).toBeCloseTo(expectedLine1MidPoint.x);
        expect(line1MidPoint.y).toBeCloseTo(expectedLine1MidPoint.y);
        if (type === 'double') {
            const line2MidPoint = drawInfo.midpoints[1];
            const expectedLine2MidPoint = expected.midpoints[1];
            expect(line2MidPoint.x).toBeCloseTo(expectedLine2MidPoint.x);
            expect(line2MidPoint.y).toBeCloseTo(expectedLine2MidPoint.y);
        }
    }

    function checkEdgeCollisionPoints(drawInfo, expected, type) {
        const collisionPoint1Edge = drawInfo.edgeCollisionPoints[0];
        const expectedCollisionPoint1Edge = expected.edgeCollisionPoints[0];
        expect(collisionPoint1Edge.x).toBeCloseTo(expectedCollisionPoint1Edge.x);
        expect(collisionPoint1Edge.y).toBeCloseTo(expectedCollisionPoint1Edge.y);
        const collisionPoint2Edge = drawInfo.edgeCollisionPoints[1];
        const expectedCollisionPoint2Edge = expected.edgeCollisionPoints[1];
        expect(collisionPoint2Edge.x).toBeCloseTo(expectedCollisionPoint2Edge.x);
        expect(collisionPoint2Edge.y).toBeCloseTo(expectedCollisionPoint2Edge.y);
        if (type === 'double' || type === 'stereoBack' || type === 'stereoFront') {
            const collisionPoint3Edge = drawInfo.edgeCollisionPoints[2];
            const expectedCollisionPoint3Edge = expected.edgeCollisionPoints[2];
            expect(collisionPoint3Edge.x).toBeCloseTo(expectedCollisionPoint3Edge.x);
            expect(collisionPoint3Edge.y).toBeCloseTo(expectedCollisionPoint3Edge.y);
        }
        if (type === 'double' || type === 'stereoFront') {
            const collisionPoint4Edge = drawInfo.edgeCollisionPoints[3];
            const expectedCollisionPoint4Edge = expected.edgeCollisionPoints[3];
            expect(collisionPoint4Edge.x).toBeCloseTo(expectedCollisionPoint4Edge.x);
            expect(collisionPoint4Edge.y).toBeCloseTo(expectedCollisionPoint4Edge.y);
        }
    }

    function checkSelCollisionPoints(drawInfo, expected, type) {
        const collisionPoint1Sel = drawInfo.selCollisionPoints[0];
        const expectedCollisionPoint1Sel = expected.selCollisionPoints[0];
        expect(collisionPoint1Sel.x).toBeCloseTo(expectedCollisionPoint1Sel.x);
        expect(collisionPoint1Sel.y).toBeCloseTo(expectedCollisionPoint1Sel.y);
        const collisionPoint2Sel = drawInfo.selCollisionPoints[1];
        const expectedCollisionPoint2Sel = expected.selCollisionPoints[1];
        expect(collisionPoint2Sel.x).toBeCloseTo(expectedCollisionPoint2Sel.x);
        expect(collisionPoint2Sel.y).toBeCloseTo(expectedCollisionPoint2Sel.y);
        if (type === 'double' || type === 'stereoBack' || type === 'stereoFront') {
            const collisionPoint3Sel = drawInfo.selCollisionPoints[2];
            const expectedCollisionPoint3Sel = expected.selCollisionPoints[2];
            expect(collisionPoint3Sel.x).toBeCloseTo(expectedCollisionPoint3Sel.x);
            expect(collisionPoint3Sel.y).toBeCloseTo(expectedCollisionPoint3Sel.y);
            const collisionPoint4Sel = drawInfo.selCollisionPoints[3];
            const expectedCollisionPoint4Sel = expected.selCollisionPoints[3];
            expect(collisionPoint4Sel.x).toBeCloseTo(expectedCollisionPoint4Sel.x);
            expect(collisionPoint4Sel.y).toBeCloseTo(expectedCollisionPoint4Sel.y)
        }
    }
});