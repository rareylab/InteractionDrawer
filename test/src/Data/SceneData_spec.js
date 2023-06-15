describe('InteractionDrawer Data SceneData', function () {

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

    it('tests the resetting of the SceneData object', async function () {
        const sceneData = interactionDrawer.sceneData;
        sceneData.reset();
        expect(sceneData.globalLimits).toEqual({
            xMin: Infinity,
            xMax: -Infinity,
            yMin: Infinity,
            yMax: -Infinity,
            width: Infinity,
            height: Infinity,
            mid: {
                x: undefined, y: undefined
            }
        });
        const structuresData = sceneData.structuresData;
        expect(structuresData.structures).toEqual({});
        expect(structuresData.originalStructures).toEqual({});
        expect(structuresData.atomIdsToStructure).toEqual({});
        expect(structuresData.structureLoaded).toEqual(false);
        expect(structuresData.structuresInUse.size).toEqual(0);
        expect(structuresData.addTimesToStructure).toEqual({});
        expect(structuresData.intermolecularConnections).toEqual({});
        const intermolecularData = sceneData.intermolecularData;
        expect(intermolecularData.atomPairInteractions).toEqual({});
        expect(intermolecularData.piStackings).toEqual({});
        expect(intermolecularData.cationPiStackings).toEqual({});
        const annotationsData = sceneData.annotationsData;
        expect(annotationsData.annotations).toEqual({});
        expect(annotationsData.originalAnnotations).toEqual({});
        const hydrophobicData = sceneData.hydrophobicData;
        expect(hydrophobicData.hydrophobicContacts).toEqual({});
        expect(hydrophobicData.originalHydrophobicContacts).toEqual({});
    });

    it('tests the setting of new global limits', async function () {
        const sceneData = interactionDrawer.sceneData;
        sceneData.setGlobalLimits(0, 2, 0, 2);
        expect(sceneData.globalLimits).toEqual({
            xMin: 0, xMax: 2, yMin: 0, yMax: 2, width: 2, height: 2, mid: {
                x: 1, y: 1
            }
        });
    });

    it('tests the setting of new global limits based on structure boundaries, splines,' +
        ' and annotations', async function () {
        const sceneData = interactionDrawer.sceneData;
        //these values are set manually and are therefore independent of the browser size
        for (const structureId in sceneData.structuresData.structures) {
            const structure = sceneData.structuresData.structures[structureId];
            structure.boundaries = {xMin: 0, xMax: 2, yMin: 0, yMax: 2};
            Object.values(structure.hydrophobicConnectionData.hydrophobicConts).forEach(spline => {
                spline.curveCoords = [{x: -3, y: 1}];
            });
        }

        for (const labelId in sceneData.annotationsData.annotations) {
            const annotation = sceneData.annotationsData.annotations[labelId];
            annotation.globalDrawLimits = {xMin: -1, xMax: 1, yMin: -1, yMax: 1};
        }
        sceneData.calcBoundaries();
        const globalLimits = sceneData.globalLimits;
        expect(globalLimits.xMin).toBeCloseTo(-3.65);
        expect(globalLimits.yMin).toEqual(-1);
        expect(globalLimits.xMax).toEqual(2);
        expect(globalLimits.yMax).toEqual(2);
        expect(globalLimits.mid.x).toBeCloseTo(-0.825);
        expect(globalLimits.mid.y).toBeCloseTo(0.5);
        expect(globalLimits.width).toBeCloseTo(5.65);
        expect(globalLimits.height).toEqual(3);
    });

    it('tests based on the width and height of the draw area the calculation of infos to' +
        ' produce nicely centered drawings', async function () {
        const sceneData = interactionDrawer.sceneData;
        sceneData.setInfoForDrawing(0, 100);
        expect(sceneData.drawAreaDim.width).toEqual(0);
        expect(sceneData.drawAreaDim.height).toEqual(100);
        expect(sceneData.midCoords.x).toEqual(0);
        expect(sceneData.midCoords.y).toEqual(50);
        expect(sceneData.idealMaxWidth).toEqual(-30);
        expect(sceneData.idealMaxHeight).toEqual(70);
        expect(sceneData.drawAreaMid.x).toEqual(0);
        expect(sceneData.drawAreaMid.y).toEqual(50);
    });

    it(
        'tests the creation a sub selection of jsons based on type parameter (0)',
        async function () {
            checkJsons(0, 3);
        }
    );

    it(
        'tests the creation a sub selection of jsons based on type parameter (1)',
        async function () {
            checkJsons(1, 1);
        }
    );

    it(
        'tests the creation a sub selection of jsons based on type parameter (2)',
        async function () {
            checkJsons(2, 2);
        }
    );

    function checkJsons(type, expected) {
        const sceneData = interactionDrawer.sceneData;
        interactionDrawer.addByJSON(JSON.stringify({scene: {annotations: [interactionDrawerTestJson.scene.annotations[0]]}}));
        interactionDrawer.addByJSON(JSON.stringify({scene: {structures: [interactionDrawerTestJson.scene.structures[1]]}}));
        const jsons = sceneData.getJsonByType(type);
        expect(jsons.length).toEqual(expected);
    }
});