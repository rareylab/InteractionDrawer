describe('InteractionDrawer Data HydrophobicConnectionData', function () {

    beforeEach(function () {
        $('<svg id="draw-area" width="100%" height="600px"></svg>').appendTo('body');
        const copyTestConfig = Helpers.deepCloneObject(interactionDrawerTestConfig);
        const copyJson = Helpers.deepCloneObject(interactionDrawerTestJson);
        const interactionDrawer = new InteractionDrawer('draw-area', copyTestConfig);
        const inputJson = JSON.stringify(copyJson);
        interactionDrawer.addByJSON(inputJson);
        structure = interactionDrawer.sceneData.structuresData.structures['0'];
    });

    afterEach(function () {
        $('#draw-area').remove();
    });

    it(
        'tests the creation of the connection data object of a Structure object',
        async function () {
            const hydrophobicConnectionData = structure.hydrophobicConnectionData;
            expect(Object.keys(hydrophobicConnectionData.hydrophobicConts).length).toEqual(2);
            expect(hydrophobicConnectionData.hydrophobicConts['0'].constructor.name).toEqual(
                'Spline');
            expect(hydrophobicConnectionData.atomControlPointConnections).toEqual({
                '10002': {'1': new Set([0])},
                '10015': {'1': new Set([2])},
                '10017': {'1': new Set([1])},
                '10019': {'1': new Set([1])},
                '10021': {'0': new Set([1])},
                '10022': {'0': new Set([0])},
                '10023': {'0': new Set([2])},
                '10024': {'0': new Set([6])},
                '10025': {'0': new Set([3])},
                '10026': {'0': new Set([5])},
                '10027': {'0': new Set([4])}
            });
        }
    );

    it('tests the adding of a hydrophobic contact to a Structure object', async function () {
        const hydrophobicConnectionData = structure.hydrophobicConnectionData;
        hydrophobicConnectionData.addHydrophobicContact(2, new Spline(0, []));
        expect(Object.keys(hydrophobicConnectionData.hydrophobicConts).length).toEqual(3);
        expect(hydrophobicConnectionData.hydrophobicConts['2'].constructor.name).toEqual('Spline');
    });

    it('tests the linking of an atom to a control point', async function () {
        const hydrophobicConnectionData = structure.hydrophobicConnectionData;
        hydrophobicConnectionData.linkAtomToSplineControlPoint(10021, 0, 0);
        const controlPointIds = hydrophobicConnectionData.atomControlPointConnections['10021']['0'];
        expect(controlPointIds).toEqual(new Set([0, 1]))
    });

    it(
        'tests the removing of control points linked to a structure atom via hydrophobic contact',
        async function () {
            const hydrophobicConnectionData = structure.hydrophobicConnectionData;
            hydrophobicConnectionData.removeAtomToSplineControlPointLink(1);
            const atomControlPointConnections = hydrophobicConnectionData.atomControlPointConnections;
            expect(atomControlPointConnections['10002']['1'].size).toEqual(0);
            expect(atomControlPointConnections['10015']['1'].size).toEqual(0);
            expect(atomControlPointConnections['10017']['1'].size).toEqual(0);
            expect(atomControlPointConnections['10019']['1'].size).toEqual(0);
        }
    );

    it('tests the retrieval of control point ids', async function () {
        const hydrophobicConnectionData = structure.hydrophobicConnectionData;
        const controlPointIds = hydrophobicConnectionData.getSplineControlPointIds();
        expect(controlPointIds).toEqual({
            '0': new Set(['0', '1', '2', '3', '4', '5', '6']), '1': new Set(['0', '1', '2'])
        })
    });

    it('tests the retrieval of control point ids by atom ids', async function () {
        const hydrophobicConnectionData = structure.hydrophobicConnectionData;
        const controlPointIds = hydrophobicConnectionData.getSplineControlPointIdsForAtoms([
            10002, 10022
        ]);
        expect(controlPointIds).toEqual({0: new Set([0]), 1: new Set([0])})
    });
});