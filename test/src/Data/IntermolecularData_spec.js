describe('InteractionDrawer Data IntermolecularData', function () {

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

    it(
        'tests the intermolecular edge getter by type and id (atom pair interaction)',
        async function () {
            checkIntermolecularEdge('atomPairInteractions');

        }
    );

    it('tests the intermolecular edge getter by type and id (pi stacking)', async function () {
        checkIntermolecularEdge('piStackings');

    });

    it(
        'tests the intermolecular edge getter by type and id (pi cation stacking)',
        async function () {
            checkIntermolecularEdge('cationPiStackings');
        }
    );

    function checkIntermolecularEdge(type) {
        const intermolecularData = interactionDrawer.sceneData.intermolecularData;
        const intermolecularEdge = intermolecularData.getIntermolecularByType(type, 0);
        expect(intermolecularEdge).not.toEqual(null);
    }
});