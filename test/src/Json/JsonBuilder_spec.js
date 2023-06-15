describe('InteractionDrawer Json JsonBuilder', function () {

    beforeEach(function () {
        $('<svg id="draw-area" width="100%" height="600px"></svg>').appendTo('body');
        const copyJson = Helpers.deepCloneObject(interactionDrawerTestJson);
        const copyTestConfig = Helpers.deepCloneObject(interactionDrawerTestConfig);
        interactionDrawer = new InteractionDrawer('draw-area', copyTestConfig);
        const inputJson = JSON.stringify(copyJson);
        interactionDrawer.addByJSON(inputJson);
    });

    afterEach(function () {
        $('#draw-area').remove();
    });

    it('tests the preprocessed and exported json of the current scene', async function () {
        const exported = interactionDrawer.svgDrawer.historyDrawer.jsonBuilder.getJson();
        expect(JSON.parse(exported)).toEqual(interactionDrawerTestJsonProcessed);
    });
});