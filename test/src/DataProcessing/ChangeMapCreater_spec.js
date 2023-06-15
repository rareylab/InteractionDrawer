describe('InteractionDrawer DataProcessing ChangeMapCreater', function () {

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

    it('tests the accumulation of new positions of annotations of given Ids based on a mirror' +
        ' operation on a given line', async function () {
        const changeMapCreater = interactionDrawer.userInteractionHandler.rotationHandler.changeMapCreater;
        const changeMap = {};
        //mirror on x axis
        changeMapCreater.createAnnotationMirrorMap([0],
            {x: -100, y: 0},
            {x: 100, y: 0},
            changeMap,
            InteractionMode.lineMirror
        );
        const changes = changeMap.annotationCoordinateChanges['0'];
        expect(changes.newCoords.x).toBeCloseTo(-35.255);
        expect(changes.newCoords.y).toBeCloseTo(124.982);
        expect(changes.interactionMode).toEqual(InteractionMode.lineMirror);
        expect(changes.oldStructureMid.x).toBeCloseTo(-6.470);
        expect(changes.oldStructureMid.y).toBeCloseTo(-98.071);
    });

    it('tests a mirror operation on given atoms based on a mirror line', async function () {
        const changeMapCreater = interactionDrawer.userInteractionHandler.rotationHandler.changeMapCreater;
        const changeMap = {};
        //mirror on x axis
        const atom = changeMapCreater.sceneData.structuresData.structures['0'].atomsData.getAtom(
            10000);
        changeMapCreater.createAtomMirrorMap({'0': [atom]},
            {x: -100, y: 0},
            {x: 100, y: 0},
            changeMap
        );
        const changes = changeMap.coordinateChanges['0'];
        expect(changes.newCoordinates['10000'].x).toBeCloseTo(33.290);
        expect(changes.newCoordinates['10000'].y).toBeCloseTo(50.552);
        expect(changes.isFlip).toEqual(true);
    });

    it('tests the accumulation of new positions of specified spline control points based on a' +
        ' mirror operation', async function () {
        const changeMapCreater = interactionDrawer.userInteractionHandler.rotationHandler.changeMapCreater;
        const changeMap = {};
        //mirror on x axis
        changeMapCreater.createSplineControlPointMirrorMap({'0': [0]},
            {x: -100, y: 0},
            {x: 100, y: 0},
            changeMap
        );
        const changes = changeMap.splineCoordinateChanges['0'];
        expect(changes['0'].x).toBeCloseTo(-35.10);
        expect(changes['0'].y).toBeCloseTo(-33.38);
    });

    it('tests the accumulation of new positions of specified spline control points into a' +
        ' change map', async function () {
        const changeMapCreater = interactionDrawer.userInteractionHandler.rotationHandler.changeMapCreater;
        const changeMap = {};
        changeMapCreater.createSplineControlPointUpdateMap({'0': [0]}, changeMap);
        const changes = changeMap.splineCoordinateChanges['0'];
        expect(changes['0'].x).toBeCloseTo(-35.10);
        expect(changes['0'].y).toBeCloseTo(33.38);
        expect(changes['0'].rad).toBeCloseTo(5);
        expect(changes['0'].enabled).toBeCloseTo(true);
    });

    it('tests the accumulation new positions of annotations of given Ids into a change maps' +
        ' (no rotation)', async function () {
        const changeMapCreater = interactionDrawer.userInteractionHandler.rotationHandler.changeMapCreater;
        const changeMap = {};
        const structure = changeMapCreater.sceneData.structuresData.structures['1'];
        structure.representationsData.currentRepresentation = StructureRepresentation.circle;
        const annotation = changeMapCreater.sceneData.annotationsData.annotations['0'];
        annotation.tempCoordinates = {x: 0, y: 0};
        changeMapCreater.createAnnotationUpdateMap(new Set([0]),
            [1],
            changeMap,
            InteractionMode.movement
        );
        const changes = changeMap.annotationCoordinateChanges['0'];
        expect(changes.newCoords.x).toBeCloseTo(0);
        expect(changes.newCoords.y).toBeCloseTo(0);
        expect(changes.interactionMode).toEqual(InteractionMode.movement);
        expect(changes.structureMoved).toEqual(true);
        expect(changes.oldStructureMid.x).toBeCloseTo(-6.470);
        expect(changes.oldStructureMid.y).toBeCloseTo(-98.071);
    });

    it('tests the accumulation new positions of annotations of given Ids into a change maps' +
        ' (full scene rotation with default representation)', async function () {
        const changeMapCreater = interactionDrawer.userInteractionHandler.rotationHandler.changeMapCreater;
        const changeMap = {};
        const rotation = changeMapCreater.interactionState.interaction.rotation;
        rotation.type = 'fullScene';
        rotation.curRotation = 180;
        const annotation = changeMapCreater.sceneData.annotationsData.annotations['1'];
        annotation.tempCoordinates = {x: 0, y: 0};
        //these values are set manually and are therefore independent of the browser size
        annotation.structureRepresentationInfo[StructureRepresentation.circle].coordinates =
            {x: 3, y: 3};
        changeMapCreater.sceneData.midCoords = {x: 0, y: 0};
        changeMapCreater.interactionState.transformParams.scale = 1;
        changeMapCreater.interactionState.transformParams.translate.x = 1;
        changeMapCreater.interactionState.transformParams.translate.y = 1;
        changeMapCreater.createAnnotationUpdateMap(new Set([1]),
            [],
            changeMap,
            InteractionMode.rotation
        );
        const changes = changeMap.annotationCoordinateChanges['1'];
        expect(changes.newCoords.x).toBeCloseTo(0);
        expect(changes.newCoords.y).toBeCloseTo(0);
        expect(changes.interactionMode).toEqual(InteractionMode.rotation);
        expect(changes.structureMoved).toEqual(false);
        expect(changes.oldStructureMid.x).toBeCloseTo(4.436);
        expect(changes.oldStructureMid.y).toBeCloseTo(-1.852);
        expect(changes.oldAltRotCoords.x).toEqual(3);
        expect(changes.oldAltRotCoords.y).toEqual(3);
        expect(changes.newAltRotCoords.x).toBeCloseTo(-7.87);
        expect(changes.newAltRotCoords.y).toBeCloseTo(4.70);
    });

    it('tests the accumulation new positions of annotations of given Ids into a change maps' +
        ' (full scene rotation with structure circle representation)', async function () {
        const changeMapCreater = interactionDrawer.userInteractionHandler.rotationHandler.changeMapCreater;
        const changeMap = {};
        const rotation = changeMapCreater.interactionState.interaction.rotation;
        rotation.type = 'fullScene';
        rotation.curRotation = 180;
        const annotation = changeMapCreater.sceneData.annotationsData.annotations['1'];
        annotation.tempCoordinates = {x: 0, y: 0};
        const structure = changeMapCreater.sceneData.structuresData.structures['0'];
        structure.representationsData.currentRepresentation = StructureRepresentation.circle;
        ///these values are set manually and are therefore independent of the browser size
        annotation.structureRepresentationInfo[StructureRepresentation.circle].coordinates =
            {x: 3, y: 3};
        changeMapCreater.sceneData.midCoords = {x: 0, y: 0};
        changeMapCreater.interactionState.transformParams.scale = 1;
        changeMapCreater.interactionState.transformParams.translate.x = 1;
        changeMapCreater.interactionState.transformParams.translate.y = 1;
        changeMapCreater.createAnnotationUpdateMap(new Set([1]),
            [],
            changeMap,
            InteractionMode.rotation
        );
        const changes = changeMap.annotationCoordinateChanges['1'];
        expect(changes.newCoords.x).toBeCloseTo(0);
        expect(changes.newCoords.y).toBeCloseTo(0);
        expect(changes.interactionMode).toEqual(InteractionMode.rotation);
        expect(changes.structureMoved).toEqual(false);
        expect(changes.oldStructureMid.x).toBeCloseTo(4.436);
        expect(changes.oldStructureMid.y).toBeCloseTo(-1.852);
        expect(changes.oldAltRotCoords.x).toBeCloseTo(-54.927);
        expect(changes.oldAltRotCoords.y).toBeCloseTo(36.465);
        expect(changes.newAltRotCoords.x).toBeCloseTo(52.926);
        expect(changes.newAltRotCoords.y).toBeCloseTo(-38.465);
    });

    it('tests the accumulation new positions of annotations of given Ids into a change maps' +
        ' (structure rotation with structure circle representation)', async function () {
        const changeMapCreater = interactionDrawer.userInteractionHandler.rotationHandler.changeMapCreater;
        const changeMap = {};
        const rotation = changeMapCreater.interactionState.interaction.rotation;
        rotation.type = 'singleStructure';
        rotation.curRotation = 180;
        const annotation = changeMapCreater.sceneData.annotationsData.annotations['1'];
        annotation.tempCoordinates = {x: 0, y: 0};
        const structure = changeMapCreater.sceneData.structuresData.structures['0'];
        structure.representationsData.currentRepresentation = StructureRepresentation.circle;
        changeMapCreater.createAnnotationUpdateMap(new Set([1]),
            [],
            changeMap,
            InteractionMode.rotation
        );
        const changes = changeMap.annotationCoordinateChanges['1'];
        expect(changes.newCoords.x).toBeCloseTo(0);
        expect(changes.newCoords.y).toBeCloseTo(0);
        expect(changes.interactionMode).toEqual(InteractionMode.rotation);
        expect(changes.structureMoved).toEqual(false);
        expect(changes.oldStructureMid.x).toBeCloseTo(4.436);
        expect(changes.oldStructureMid.y).toBeCloseTo(-1.852);
        expect(changes.oldAltRotCoords.x).toBeCloseTo(-54.927);
        expect(changes.oldAltRotCoords.y).toBeCloseTo(36.465);
        expect(changes.newAltRotCoords.x).toBeCloseTo(63.799);
        expect(changes.newAltRotCoords.y).toBeCloseTo(-40.169);
    });


    it('tests the creation a map to set (real) coordinates of all atoms of structures to' +
        ' previously updated temporary coordinates', async function () {
        const changeMapCreater = interactionDrawer.userInteractionHandler.rotationHandler.changeMapCreater;
        const atom = changeMapCreater.sceneData.structuresData.structures[4].atomsData.getAtom(10058);
        atom.tempCoordinates = {x: 0, y: 0}
        const changeMap = {};
        changeMapCreater.createTempCoordinateUpdateMapForFullStructures([4], changeMap);
        const coordinateChanges = changeMap.coordinateChanges['4'];
        expect(coordinateChanges.isFlip).toEqual(false);
        const newCoordinates = coordinateChanges.newCoordinates;
        expect(newCoordinates['10058'].x).toBeCloseTo(0);
        expect(newCoordinates['10058'].y).toBeCloseTo(0);
        expect(newCoordinates['10059'].x).toBeCloseTo(-43.728);
        expect(newCoordinates['10059'].y).toBeCloseTo(99.711);
        expect(newCoordinates['10060'].x).toBeCloseTo(-58.497);
        expect(newCoordinates['10060'].y).toBeCloseTo(102.331);
        expect(newCoordinates['10061'].x).toBeCloseTo(-38.611);
        expect(newCoordinates['10061'].y).toBeCloseTo(85.61);
        expect(newCoordinates['10062'].x).toBeCloseTo(-68.15);
        expect(newCoordinates['10062'].y).toBeCloseTo(90.849);
        expect(newCoordinates['10063'].x).toBeCloseTo(-48.264);
        expect(newCoordinates['10063'].y).toBeCloseTo(74.129);
        expect(newCoordinates['10064'].x).toBeCloseTo(-63.034);
        expect(newCoordinates['10064'].y).toBeCloseTo(76.749);
        expect(newCoordinates['10065'].x).toBeCloseTo(-39.19);
        expect(newCoordinates['10065'].y).toBeCloseTo(125.293);
    });

    it('tests the creation of a map to be used to set (real) coordinates of given atoms to' +
        ' previously updated temporary coordinates', async function () {
        const changeMapCreater = interactionDrawer.userInteractionHandler.rotationHandler.changeMapCreater;
        const atom = changeMapCreater.sceneData.structuresData.structures[0].atomsData.getAtom(10000);
        atom.tempCoordinates = {x: 0, y: 0}
        const changeMap = {};
        const expected = {
            coordinateChanges: {
                0: {
                    newCoordinates: {10000: {x: 0, y: 0}}, isFlip: false
                }
            }
        };
        changeMapCreater.createTempCoordinateUpdateMap({0: [10000]}, changeMap);
        expect(changeMap).toEqual(expected);
    });

    it('tests the creation of a map for structures which were moved in full applying offsets to' +
        ' temporary atom coordinates', async function () {
        const changeMapCreater = interactionDrawer.userInteractionHandler.rotationHandler.changeMapCreater;
        const changeMap = {};
        const structure = changeMapCreater.sceneData.structuresData.structures['4'];
        structure.curOffset = {x: 1, y: 1};
        changeMapCreater.interactionState.interaction.movement.fullStructures.push(4)
        const atom = changeMapCreater.sceneData.structuresData.structures[4].atomsData.getAtom(10058);
        atom.tempCoordinates = {x: 0, y: 0}
        changeMapCreater.createFullStructureUpdateMap(changeMap);
        const coordinateChanges = changeMap.coordinateChanges['4'];
        expect(coordinateChanges.isFlip).toEqual(false);
        const newCoordinates = coordinateChanges.newCoordinates;
        expect(newCoordinates['10058'].x).toBeCloseTo(1);
        expect(newCoordinates['10058'].y).toBeCloseTo(1);
        expect(newCoordinates['10059'].x).toBeCloseTo(-43.728 + 1);
        expect(newCoordinates['10059'].y).toBeCloseTo(99.711 + 1);
        expect(newCoordinates['10060'].x).toBeCloseTo(-58.497 + 1);
        expect(newCoordinates['10060'].y).toBeCloseTo(102.331 + 1);
        expect(newCoordinates['10061'].x).toBeCloseTo(-38.611 + 1);
        expect(newCoordinates['10061'].y).toBeCloseTo(85.61 + 1);
        expect(newCoordinates['10062'].x).toBeCloseTo(-68.15 + 1);
        expect(newCoordinates['10062'].y).toBeCloseTo(90.849 + 1);
        expect(newCoordinates['10063'].x).toBeCloseTo(-48.264 + 1);
        expect(newCoordinates['10063'].y).toBeCloseTo(74.129 + 1);
        expect(newCoordinates['10064'].x).toBeCloseTo(-63.034 + 1);
        expect(newCoordinates['10064'].y).toBeCloseTo(76.749 + 1);
        expect(newCoordinates['10065'].x).toBeCloseTo(-39.19 + 1);
        expect(newCoordinates['10065'].y).toBeCloseTo(125.293 + 1);
    });
});