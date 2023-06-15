describe('InteractionDrawer Json JsonPreprocessor', function () {

    beforeEach(function () {
        $('<svg id="draw-area" width="100%" height="600px"></svg>').appendTo('body');
        const copyJson = Helpers.deepCloneObject(interactionDrawerTestJson);
        const copyTestConfig = Helpers.deepCloneObject(interactionDrawerTestConfig);
        interactionDrawer = new InteractionDrawer('draw-area', copyTestConfig);
        const inputJson = JSON.stringify(copyJson);
        interactionDrawer.addByJSON(inputJson);
        copyJson2 = Helpers.deepCloneObject(interactionDrawerTestJson);
        inputJson2 = JSON.stringify(copyJson);
        jsonPreprocessor = interactionDrawer.userInteractionHandler.addHandler.jsonPreprocessor;
    });

    afterEach(function () {
        $('#draw-area').remove();
    });

    it(
        'tests the preprocessing of ids of added json based on those of already loaded ones',
        async function () {
            const adaptedJsonString = jsonPreprocessor.prepJsonUIds(inputJson2);
            const adaptedJsonObj = JSON.parse(adaptedJsonString);
            const adaptedJsonObjScene = adaptedJsonObj.scene;
            const copyJsonScene = copyJson2.scene;
            checkNewIds(adaptedJsonObjScene, copyJsonScene, 'structures');
            checkNewIds(adaptedJsonObjScene, copyJsonScene, 'annotations');
            checkNewIds(adaptedJsonObjScene, copyJsonScene, 'hydrophobicContacts');
            checkNewIds(adaptedJsonObjScene, copyJsonScene, 'atomPairInteractions');
            checkNewIds(adaptedJsonObjScene, copyJsonScene, 'piStackings');
            checkNewIds(adaptedJsonObjScene, copyJsonScene, 'cationPiStackings');
        }
    );

    function checkNewIds(output, input, type) {
        expect(output[type][0].id).toEqual(input[type].slice(-1)[0].id + 1);
    }

    it(
        'tests the preprocessing of coordinates of added json based on those of already loaded ones',
        async function () {
            const moveXY = jsonPreprocessor.getMoveXY(copyJson2);
            const adaptedJsonString = jsonPreprocessor.prepJsonCoordinates(inputJson2);
            const adaptedJsonObj = JSON.parse(adaptedJsonString);
            expect(adaptedJsonObj).not.toEqual(copyJson2);
            const exampleAnnoationInput = copyJson2.scene.annotations[0];
            const exampleAnnoationOutput = adaptedJsonObj.scene.annotations[0];
            expect(exampleAnnoationInput.coordinates.x - moveXY[0])
                .toBeCloseTo(exampleAnnoationOutput.coordinates.x);
            expect(exampleAnnoationInput.coordinates.y - moveXY[1])
                .toBeCloseTo(exampleAnnoationOutput.coordinates.y);
        }
    );
});