describe('InteractionDrawer Data RingsData', function () {

    beforeEach(function () {
        $('<svg id="draw-area" width="100%" height="600px"></svg>').appendTo('body');
        copyTestConfig = Helpers.deepCloneObject(interactionDrawerTestConfig);
        const copyJson = Helpers.deepCloneObject(interactionDrawerTestJson);
        structureInJson = copyJson.scene.structures[0];
        const interactionDrawer = new InteractionDrawer('draw-area', copyTestConfig);
        const inputJson = JSON.stringify(copyJson);
        interactionDrawer.addByJSON(inputJson);
        structure = interactionDrawer.sceneData.structuresData.structures['0'];
    });

    afterEach(function () {
        $('#draw-area').remove();
    });

    it(
        'tests the adding of json data to the RingsData object of a Structure object',
        async function () {
            const ringsData = structure.ringsData;
            expect(ringsData.atomsData.constructor.name).toEqual('AtomsData');
            expect(ringsData.edgesData.constructor.name).toEqual('EdgesData');
            expect(ringsData.spaceToRings).toEqual(copyTestConfig.spaceToRing +
                copyTestConfig.lineWidth);
            const rings = ringsData.rings;
            expect(Object.keys(rings).length).toEqual(structureInJson.rings.length);
            const alphaticRing = rings['4000000'];
            expect(alphaticRing.constructor.name).toEqual('Ring');
            expect(alphaticRing.aromatic).toEqual(false);
            const aromaticRings = ringsData.aromaticRings;
            expect(Object.keys(aromaticRings).length).toEqual(2);
            const aromaticRing = aromaticRings['4000002'];
            expect(aromaticRing.constructor.name).toEqual('Ring');
            checkBccs(ringsData.bccs);
            checkConnectedComponents(ringsData.connectedComponents);
            checkRingSystems(ringsData.ringSystems);
        }
    );

    function checkBccs(bccs) {
        const expectedBccs = {
            '1': [2000000],
            '2': [2000001],
            '3': [2000018],
            '4': [2000019],
            '5': [2000002],
            '6': [2000030, 2000032, 2000034, 2000033, 2000031, 2000029],
            '7': [2000028],
            '8': [2000005],
            '9': [2000004],
            '10': [2000017],
            '11': [
                2000023,
                2000008,
                2000009,
                2000015,
                2000016,
                2000011,
                2000010,
                2000020,
                2000007,
                2000006
            ],
            '12': [2000012],
            '13': [2000014],
            '14': [2000013],
            '15': [2000022, 2000027, 2000025, 2000024, 2000026, 2000021],
            '16': [2000003]
        };
        expect(bccs).toEqual(expectedBccs);
    }


    it('tests the retrieval of Ring object ids by ring system id', async function () {
        const ringsData = structure.ringsData;
        const ringIds = ringsData.getRingsInRingsystem([2]);
        expect(ringIds).toEqual(['4000002', '4000003']);
    });

    it('tests the retrieval of a Ring object by id', async function () {
        const ringsData = structure.ringsData;
        const id = 4000000;
        const ring = ringsData.getRing(id);
        expect(ring.constructor.name).toEqual('Ring');
        expect(ring.id).toEqual(id);
    });

    it('tests the retrieval of id of a ring system by all its atoms', async function () {
        const ringsData = structure.ringsData;
        const atomIds = [
            10021, 10024, 10026, 10027, 10025, 10023
        ];
        const atoms = [];
        for (const atomId of atomIds) {
            atoms.push(structure.atomsData.getAtom(atomId));
        }
        let ringSystemId = ringsData.getRingSystemMembership(atoms);
        expect(ringSystemId).toEqual(1);
        atoms.push(structure.atomsData.getAtom(10000));
        ringSystemId = ringsData.getRingSystemMembership(atoms);
        expect(ringSystemId).toEqual(undefined);
    });

    it(
        'tests the retrieval of ids of all rings given atoms that are a part of',
        async function () {
            const ringsData = structure.ringsData;
            const atomIds = [10021, 10016, 10000];
            const ringIds = ringsData.getRingsAffectedByAtoms(atomIds, false);
            expect(ringIds).toEqual(['4000000', '4000001']);
        }
    );

    it(
        'tests the retrieval of ids of all aromatic rings given atoms that are a part of',
        async function () {
            const ringsData = structure.ringsData;
            const atomIds = [10021, 10016, 10000];
            const ringIds = ringsData.getRingsAffectedByAtoms(atomIds, true);
            expect(ringIds).toEqual(['4000001']);
        }
    );

    it(
        'tests the retrieval of ids of all ring systems given atoms that are a part of',
        async function () {
            const ringsData = structure.ringsData;
            const atomIds = [10021, 10013, 10000];
            const ringSystemIds = ringsData.getRingSystemsAffectedByAtoms(atomIds);
            expect(ringSystemIds).toEqual(new Set(['1', '2']));
        }
    );

    it(
        'tests the retrieval of ids of all ring systems given edges that are a part of',
        async function () {
            const ringsData = structure.ringsData;
            const edgeIds = [{edgeId: 2000030}, {edgeId: 2000023}, {edgeId: 2000000}];
            const ringSystemIds = ringsData.getRingSystemsAffectedByEdges(edgeIds);
            expect(ringSystemIds).toEqual(new Set(['1', '2']));
        }
    );

    it('tests the setting of a ring system center', async function () {
        const ringsData = structure.ringsData;
        const newCenter = {x: 0, y: 0};
        ringsData.setRingSystemCenter(1, newCenter, false);
        const ringSystem = ringsData.ringSystems['1'];
        expect(ringSystem.tempCenter).toEqual(newCenter);
        expect(ringSystem.center).toEqual(newCenter);
    });

    it('tests the setting of a temporary ring system center', async function () {
        const ringsData = structure.ringsData;
        const newCenter = {x: 0, y: 0};
        ringsData.setRingSystemCenter(1, newCenter, true);
        const ringSystem = ringsData.ringSystems['1'];
        expect(ringSystem.tempCenter).toEqual(newCenter);
        expect(ringSystem.center.x).toBeCloseTo(-57.642);
        expect(ringSystem.center.y).toBeCloseTo(1.947);
    });

    it(
        'tests the updating of a ring system center based on new atom coordinates',
        async function () {
            const ringsData = structure.ringsData;
            const atomIds = [10021, 10024, 10026, 10027, 10025, 10023];
            const ringSystem = ringsData.ringSystems['1'];
            for (const atomId of atomIds) {
                const atom = structure.atomsData.getAtom(atomId);
                atom.coordinates.x += 1;
                atom.coordinates.y += 1;
            }
            ringsData.updateRingSystem(1, false);
            expect(ringSystem.center.x).toBeCloseTo(-56.642);
            expect(ringSystem.center.y).toBeCloseTo(2.947);
        }
    );

    it(
        'tests the updating of a ring system center based on new temporary atom coordinates',
        async function () {
            const ringsData = structure.ringsData;
            const atomIds = [10021, 10024, 10026, 10027, 10025, 10023];
            const ringSystem = ringsData.ringSystems['1'];
            for (const atomId of atomIds) {
                const atom = structure.atomsData.getAtom(atomId);
                atom.tempCoordinates.x += 1;
                atom.tempCoordinates.y += 1;
            }
            ringsData.updateRingSystem(1, true);
            expect(ringSystem.tempCenter.x).toBeCloseTo(-56.642);
            expect(ringSystem.tempCenter.y).toBeCloseTo(2.947);
        }
    );

    function checkConnectedComponents(connectedComponents) {
        const expectedConnectedComponents = [
            {
                atoms: [
                    10000,
                    10001,
                    10002,
                    10009,
                    10030,
                    10031,
                    10012,
                    10016,
                    10018,
                    10015,
                    10007,
                    10010,
                    10004,
                    10011,
                    10003,
                    10022,
                    10021,
                    10023,
                    10025,
                    10027,
                    10026,
                    10024,
                    10014,
                    10006,
                    10020,
                    10008,
                    10013,
                    10005,
                    10029,
                    10028,
                    10019,
                    10017
                ], edges: [
                    2000000,
                    2000001,
                    2000002,
                    2000018,
                    2000019,
                    2000003,
                    2000021,
                    2000026,
                    2000024,
                    2000013,
                    2000012,
                    2000006,
                    2000007,
                    2000004,
                    2000005,
                    2000028,
                    2000029,
                    2000031,
                    2000033,
                    2000034,
                    2000032,
                    2000030,
                    2000020,
                    2000010,
                    2000011,
                    2000016,
                    2000015,
                    2000009,
                    2000008,
                    2000023,
                    2000017,
                    2000014,
                    2000025,
                    2000027,
                    2000022
                ]
            }
        ];
        expect(connectedComponents).toEqual(expectedConnectedComponents);
    }

    function checkRingSystems(ringSystems) {
        const expectedRingSystems = {
            '1': {
                atoms: [10021, 10024, 10026, 10027, 10025, 10023],
                edges: [2000030, 2000032, 2000034, 2000033, 2000031, 2000029],
                outgoingEdges: [2000028],
                tempCenter: {x: -57.642555555555546, y: 1.9479999999999997},
                center: {x: -57.642555555555546, y: 1.9479999999999997}
            }, '2': {
                atoms: [10013, 10014, 10005, 10010, 10008, 10020, 10006, 10011, 10004],
                edges: [
                    2000023,
                    2000008,
                    2000009,
                    2000015,
                    2000016,
                    2000011,
                    2000010,
                    2000020,
                    2000007,
                    2000006
                ],
                outgoingEdges: [2000012, 2000017, 2000004],
                tempCenter: {x: 2.3626352114035907, y: 33.01622384801561},
                center: {x: 2.3626352114035907, y: 33.01622384801561}
            }, '3': {
                atoms: [10012, 10017, 10019, 10015, 10018, 10016],
                edges: [2000022, 2000027, 2000025, 2000024, 2000026, 2000021],
                outgoingEdges: [2000003, 2000013],
                tempCenter: {x: 33.29, y: -20.551999999999996},
                center: {x: 33.29, y: -20.551999999999996}
            }
        };
        const ringsSystemIds = ['1', '2', '3'];
        for (const id of ringsSystemIds) {
            const ringSystem = ringSystems[id];
            const expectedRingSystem = expectedRingSystems[id];
            expect(ringSystem.atoms).toEqual(expectedRingSystem.atoms);
            expect(ringSystem.edges).toEqual(expectedRingSystem.edges);
            expect(ringSystem.outgoingEdges).toEqual(expectedRingSystem.outgoingEdges);
            expect(ringSystem.tempCenter.x).toBeCloseTo(expectedRingSystem.tempCenter.x);
            expect(ringSystem.tempCenter.y).toBeCloseTo(expectedRingSystem.tempCenter.y);
            expect(ringSystem.center.x).toBeCloseTo(expectedRingSystem.center.x);
            expect(ringSystem.center.y).toBeCloseTo(expectedRingSystem.center.y);
        }
    }
});