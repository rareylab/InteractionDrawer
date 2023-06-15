describe('InteractionDrawer Data StructuresData', function () {

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

    it('tests the creation of the StructuresData object', async function () {
        const structuresData = interactionDrawer.sceneData.structuresData;
        expect(Object.keys(structuresData.structures).length).toEqual(5);
        expect(structuresData.structures['0'].constructor.name).toEqual('Structure');
        expect(Object.keys(structuresData.originalStructures).length).toEqual(5);
        expect(structuresData.originalStructures['0'].constructor.name).toEqual('Structure');
        expect(structuresData.atomIdsToStructure).toEqual({
            '10000': 0,
            '10001': 0,
            '10002': 0,
            '10003': 0,
            '10004': 0,
            '10005': 0,
            '10006': 0,
            '10007': 0,
            '10008': 0,
            '10009': 0,
            '10010': 0,
            '10011': 0,
            '10012': 0,
            '10013': 0,
            '10014': 0,
            '10015': 0,
            '10016': 0,
            '10017': 0,
            '10018': 0,
            '10019': 0,
            '10020': 0,
            '10021': 0,
            '10022': 0,
            '10023': 0,
            '10024': 0,
            '10025': 0,
            '10026': 0,
            '10027': 0,
            '10028': 0,
            '10029': 0,
            '10030': 0,
            '10031': 0,
            '10032': 1,
            '10033': 1,
            '10034': 1,
            '10035': 1,
            '10036': 1,
            '10037': 1,
            '10038': 1,
            '10039': 1,
            '10040': 1,
            '10041': 1,
            '10042': 1,
            '10043': 2,
            '10044': 2,
            '10045': 2,
            '10046': 2,
            '10047': 2,
            '10048': 2,
            '10049': 2,
            '10050': 2,
            '10051': 3,
            '10052': 3,
            '10053': 3,
            '10054': 3,
            '10055': 3,
            '10056': 3,
            '10057': 3,
            '10058': 4,
            '10059': 4,
            '10060': 4,
            '10061': 4,
            '10062': 4,
            '10063': 4,
            '10064': 4,
            '10065': 4
        });
        expect(structuresData.structureLoaded).toEqual(true);
        expect(structuresData.structuresInUse).toEqual(new Set([0, 1, 2, 3, 4]));
        expect(structuresData.addTimesToStructure).toEqual({0: [0, 1, 2, 3, 4]});
        expect(structuresData.intermolecularConnections).toEqual({
            '0': {
                '1': [
                    {type: 'atomPairInteractions', id: 0},
                    {type: 'atomPairInteractions', id: 4},
                    {type: 'cationPiStackings', id: 0}
                ],
                '2': [{type: 'atomPairInteractions', id: 1}, {type: 'atomPairInteractions', id: 2}],
                '3': [{type: 'atomPairInteractions', id: 3}],
                '4': [{type: 'piStackings', id: 0}]
            }
        });
    });

    it('tests the retrieval of ids of atoms and bonds of a non existing structure',
        async function () {
            const structuresData = interactionDrawer.sceneData.structuresData;
            const ids = structuresData.getIdsForStructure(10);
            expect(ids).toEqual(null);
        }
    );

    it('tests the retrieval of ids of atoms and bonds of a structure by its id',
        async function () {
            const structuresData = interactionDrawer.sceneData.structuresData;
            const ids = structuresData.getIdsForStructure(4);
            expect(ids).toEqual({
                atoms: [10058, 10059, 10060, 10061, 10062, 10063, 10064, 10065],
                edges: [2000058, 2000059, 2000060, 2000061, 2000062, 2000063, 2000064, 2000065]
            });
        }
    );

    it('tests the retrieval of ids of hidden structures', async function () {
        const structuresData = interactionDrawer.sceneData.structuresData;
        expect(structuresData.getHiddenStructures()).toEqual([]);
        structuresData.structures[0].hidden = true;
        expect(structuresData.getHiddenStructures()).toEqual([0]);
    });

    it('tests that a structure with given id contains certain edges and atoms', async function () {
        const structuresData = interactionDrawer.sceneData.structuresData;
        const hasElements = structuresData.structureHasElements([{id: 10000}], [{id: 2000000}], 0);
        expect(hasElements).toEqual(true);
    });

    it('tests that a structure with given id contains acertain edges but not a certain atom',
        async function () {
            const structuresData = interactionDrawer.sceneData.structuresData;
            const hasElements = structuresData.structureHasElements([{id: 12345678}],
                [{id: 2000000}],
                0
            );
            expect(hasElements).toEqual(false);
        }
    );

    it('tests that a structure with given id contains a certain atom but not an edge',
        async function () {
            const structuresData = interactionDrawer.sceneData.structuresData;
            const hasElements = structuresData.structureHasElements([{id: 10000}],
                [{id: 12345678}],
                0
            );
            expect(hasElements).toEqual(false);
        }
    );

    it('tests the retrieval all structure ids and their names that are currently loaded',
        async function () {
            const structuresData = interactionDrawer.sceneData.structuresData;
            const loadedStructuresInfo = structuresData.getStructures();
            expect(loadedStructuresInfo).toEqual([
                {
                    id: 0, name: '4SP_A_1298', enabled: true, hidden: false
                },
                {id: 1, name: 'ASP-86-A', enabled: true, hidden: false},
                {id: 2, name: 'LEU-83-A', enabled: true, hidden: false},
                {id: 3, name: 'GLU-81-A', enabled: true, hidden: false},
                {id: 4, name: 'PHE-80-A', enabled: true, hidden: false}
            ]);
        }
    );

    it('tests the retrieval of all additional information of atoms and structures',
        async function () {
            const expected = {
                atoms: [
                    {
                        additionalInformation: {}, atomId: 10000, structureId: 0
                    }
                ], structures: [
                    {additionalInformation: {test: 'test'}, structureId: 0},
                    {additionalInformation: {}, structureId: 1},
                    {additionalInformation: {}, structureId: 2},
                    {additionalInformation: {}, structureId: 3},
                    {additionalInformation: {}, structureId: 4}
                ], nrOfAtoms: 66
            }
            const structuresData = interactionDrawer.sceneData.structuresData;
            structuresData.structures[0].additionalInformation =
                expected.structures[0].additionalInformation;
            const info = structuresData.getAdditionalInformation(false);
            expect(info.structures).toEqual(expected.structures);
            expect(info.atoms[0]).toEqual(expected.atoms[0]);
            expect(info.atoms.length).toEqual(expected.nrOfAtoms);
        }
    );

    it('tests the retrieval of all additional information of selected atoms and structures' +
        ' (nothing is selected)', async function () {
        const structuresData = interactionDrawer.sceneData.structuresData;
        const info = structuresData.getAdditionalInformation(true);
        expect(info.structures).toEqual([]);
        expect(info.atoms[0]).toEqual(undefined);
        expect(info.atoms.length).toEqual(0);
    });

    it('tests the retrieval of all additional information of selected atoms and structures' +
        ' (structure atom is selected)', async function () {
        const expected = {
            atoms: [
                {
                    additionalInformation: {}, atomId: 10000, structureId: 0
                }
            ], structures: [{additionalInformation: {test: 'test'}, structureId: 0}], nrOfAtoms: 1
        }
        const structuresData = interactionDrawer.sceneData.structuresData;
        const structure = structuresData.structures[0];
        structure.atomsData.selectedAtoms = new Set([10000]);
        structure.additionalInformation = expected.structures[0].additionalInformation;
        const info = structuresData.getAdditionalInformation(true);
        expect(info.structures).toEqual(expected.structures);
        expect(info.atoms[0]).toEqual(expected.atoms[0]);
        expect(info.atoms.length).toEqual(expected.nrOfAtoms);
    });

    it('tests the retrieval of all additional information of selected atoms and structures' +
        ' (structure circle is selected)', async function () {
        const expected = {
            atoms: [
                {
                    additionalInformation: {}, atomId: 10000, structureId: 0
                }
            ], structures: [{additionalInformation: {test: 'test'}, structureId: 0}], nrOfAtoms: 32
        }
        const structuresData = interactionDrawer.sceneData.structuresData;
        const structure = structuresData.structures[0];
        structure.representationsData.selectedStructureCircle = true;
        structure.additionalInformation = expected.structures[0].additionalInformation;
        const info = structuresData.getAdditionalInformation(true);
        expect(info.structures).toEqual(expected.structures);
        expect(info.atoms[0]).toEqual(expected.atoms[0]);
        expect(info.atoms.length).toEqual(expected.nrOfAtoms);
    });
});