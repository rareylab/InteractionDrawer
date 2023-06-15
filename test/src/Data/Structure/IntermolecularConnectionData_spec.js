describe('InteractionDrawer Data IntermolecularConnectionData', function () {

    beforeEach(function () {
        $('<svg id="draw-area" width="100%" height="600px"></svg>').appendTo('body');
        copyTestConfig = Helpers.deepCloneObject(interactionDrawerTestConfig);
        const copyJson = Helpers.deepCloneObject(interactionDrawerTestJson);
        const interactionDrawer = new InteractionDrawer('draw-area', copyTestConfig);
        const inputJson = JSON.stringify(copyJson);
        interactionDrawer.addByJSON(inputJson);
        structure = interactionDrawer.sceneData.structuresData.structures['0'];
    });

    afterEach(function () {
        $('#draw-area').remove();
    });

    it('tests the creation of the connection data object of a Structure object',
        async function () {
            const intermolecularConnectionData = structure.intermolecularConnectionData;
            expect(intermolecularConnectionData.ids).toEqual({
                atomPairInteractions: new Set([0, 1, 2, 3, 4]),
                piStackings: new Set([0]),
                cationPiStackings: new Set([0]),
                distances: new Set([]),
                interactions: new Set([])
            });
            expect(intermolecularConnectionData.connections).toEqual({
                atomPairInteractions: {
                    atom: {
                        '10001': [0], '10005': [1], '10028': [2], '10029': [3], '10030': [4]
                    }
                },
                piStackings: {ring: {'4000002': [0]}},
                cationPiStackings: {atom: {}, ring: {'4000001': [0]}},
                distances: {annotation: {}},
                interactions: {annotation: {}}
            });
        }
    );

    it(
        'tests the memorizing of an intermolecular edge connection to a Structure object (atom pair interaction)',
        async function () {
            checkIntermolecularEdgeAdd(0, 1, 'atomPairInteractions', 'atom');
        }
    );

    it(
        'tests the memorizing of an intermolecular edge connection to a Structure object (pi cation)',
        async function () {
            checkIntermolecularEdgeAdd(0, 1, 'cationPiStackings', 'ring');
        }
    );

    it(
        'tests the memorizing of an intermolecular edge connection to a Structure object (pi pi)',
        async function () {
            checkIntermolecularEdgeAdd(0, 1, 'piStackings', 'ring');
        }
    );

    function checkIntermolecularEdgeAdd(startId, edgeId, edgeType, startType) {
        const intermolecularConnectionData = structure.intermolecularConnectionData;
        intermolecularConnectionData.addIntermolecularConnection(startId,
            edgeId,
            edgeType,
            startType
        );
        expect(intermolecularConnectionData.ids[edgeType].has(edgeId)).toEqual(true);
        expect(intermolecularConnectionData.connections[edgeType][startType][startId])
            .toEqual([edgeId]);
    }

    it(
        'tests the determination of atom pair interactions affected atom ids (moveFreedomLevel structures)',
        async function () {
            checkAtomPairInteractionsAffectedByAtoms('structures', [0, 1, 2, 3, 4]);
        }
    );

    it(
        'tests the determination of atom pair interactions affected by atom ids (moveFreedomLevel free)',
        async function () {
            checkAtomPairInteractionsAffectedByAtoms('free', [0, 1]);
        }
    );

    function checkAtomPairInteractionsAffectedByAtoms(moveFreedomLevel, expected) {
        const intermolecularConnectionData = structure.intermolecularConnectionData;
        const affectedAtomPairInteractions = intermolecularConnectionData.getAtomPairInteractionsAffectedByAtoms(
            [
                10001, 10005
            ], moveFreedomLevel);
        expect(affectedAtomPairInteractions).toEqual(new Set(expected));
    }

    it('tests the determination of pi stackings affected by atom ids', async function () {
        checkPiStackingsAffectedByAtoms([10004], [0]);
    });

    it('tests the determination of pi stackings affected by atom ids (ringsystem given)',
        async function () {
            checkPiStackingsAffectedByAtoms([10004], [0], [2]);
        }
    );

    function checkPiStackingsAffectedByAtoms(atomIds, expected, ringsystems) {
        const intermolecularConnectionData = structure.intermolecularConnectionData;
        const affectedPiStackings = intermolecularConnectionData.getPiStackingsAffectedByAtoms(atomIds,
            ringsystems
        );
        expect(affectedPiStackings).toEqual(new Set(expected));
    }

    it(
        'tests the determination of cation pi stackings affected by atom ids (ring atom given)',
        async function () {
            checkCationPiStackingsAffectedByAtoms([10016], [0]);
        }
    );

    it(
        'tests the determination of cation pi stackings affected by atom ids (ring atom and ringsystem given)',
        async function () {
            checkCationPiStackingsAffectedByAtoms([10016], [0], [3]);
        }
    );

    function checkCationPiStackingsAffectedByAtoms(atomIds, expected, ringsystems) {
        const intermolecularConnectionData = structure.intermolecularConnectionData;
        const affectedCationPiStackings = intermolecularConnectionData.getCationPiStackingsAffectedByAtoms(atomIds,
            ringsystems
        );
        expect(affectedCationPiStackings).toEqual(new Set(expected));
    }
});