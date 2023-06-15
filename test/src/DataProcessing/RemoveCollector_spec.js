describe('InteractionDrawer DataProcessing RemoveCollector', function () {

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

    it('tests the determination of which items should be removed from the draw area removing a' +
        ' complete structure', async function () {
        const removeCollector = new RemoveCollector(interactionDrawer.opts,
            interactionDrawer.sceneData
        );
        const {
            remStructures,
            remAtoms,
            remEdges,
            remAnnotations,
            remAtomPairInteractions,
            remPiStackings,
            remCationPiStackings,
            remHydrophobicContacts
        } = removeCollector.determineRemoveObjects({
            atoms: [10000], structures: [0]
        });
        expect(remStructures).toEqual(new Set([0]));
        //the atom will be removed, because the corresponding structure is already given
        expect(remAtoms).toEqual(new Set());
        expect(remEdges).toEqual(new Set());
        expect(remAnnotations).toEqual(new Set([1, 2, 3, 4, 5]));
        expect(remAtomPairInteractions).toEqual(new Set(['0', '1', '2', '3', '4']));
        expect(remPiStackings).toEqual(new Set(['0']));
        expect(remCationPiStackings).toEqual(new Set(['0']));
        expect(remHydrophobicContacts).toEqual(new Set([{id: '0'}, {id: '1'}]));
    });

    it('tests the determination of which items should be removed from the draw area removing an' +
        ' atom with an interaction', async function () {
        const removeCollector = new RemoveCollector(interactionDrawer.opts,
            interactionDrawer.sceneData
        );
        const {
            remStructures,
            remAtoms,
            remEdges,
            remAnnotations,
            remAtomPairInteractions,
            remPiStackings,
            remCationPiStackings,
            remHydrophobicContacts
        } = removeCollector.determineRemoveObjects({
            atoms: [10001]
        });
        expect(remStructures).toEqual(new Set());
        expect(remAtoms).toEqual(new Set([10001]));
        expect(remEdges).toEqual(new Set());
        expect(remAnnotations).toEqual(new Set());
        expect(remAtomPairInteractions).toEqual(new Set(['0']));
        expect(remPiStackings).toEqual(new Set());
        expect(remCationPiStackings).toEqual(new Set());
        expect(remHydrophobicContacts).toEqual(new Set());
    });
});