describe('InteractionDrawer Data AtomsData', function () {

    beforeEach(function () {
        $('<svg id="draw-area" width="100%" height="600px"></svg>').appendTo('body');
        const copyTestConfig = Helpers.deepCloneObject(interactionDrawerTestConfig);
        const copyJson = Helpers.deepCloneObject(interactionDrawerTestJson);
        const interactionDrawer = new InteractionDrawer('draw-area', copyTestConfig);
        const inputJson = JSON.stringify(copyJson);
        interactionDrawer.addByJSON(inputJson);
        structureInJson = copyJson.scene.structures[3];
        structure = interactionDrawer.sceneData.structuresData.structures['3'];
    });

    afterEach(function () {
        $('#draw-area').remove();
    });

    it(
        'tests the adding of json data to the AtomsData object of a Structure object',
        async function () {
            const atomsInJson = structureInJson.atoms;
            const atomsData = structure.atomsData;
            checkAtomNeighbours(atomsData.neighbors);
            checkAtomIdxByIdMap(atomsData.atomIdxById);
            checkAtomIdByIdxMap(atomsData.atomIdByIdx);
            expect(atomsData.atomIds.length).toEqual(atomsInJson.length);
            expect(atomsData.atoms.length).toEqual(atomsInJson.length);
            expect(atomsData.atoms[0].constructor.name).toEqual('Atom');
            expect(Object.keys(atomsData.atomById).length).toEqual(atomsInJson.length);
            expect(atomsData.atomById[10051].constructor.name).toEqual('Atom');
            expect(atomsData.selectedAtoms.size).toEqual(0);
            expect(atomsData.tempSelectedAtoms.size).toEqual(0);
            expect(Object.keys(atomsData.stereoSubstituentOrders).length).toEqual(1);
            expect(atomsData.stereoSubstituentOrders).toEqual({
                10052: {
                    direction: 'clockwise', orders: {
                        '10051': [10057, 10053], '10053': [10051, 10057], '10057': [10051, 10053]
                    }
                }
            });
        }
    );

    function checkAtomNeighbours(neighbors) {
        const expectedNeighbours = {
            '10051': [{neighbor: 10055, edgeId: 2000052}, {neighbor: 10052, edgeId: 2000053}],
            '10052': [
                {neighbor: 10051, edgeId: 2000053},
                {neighbor: 10057, edgeId: 2000054},
                {neighbor: 10053, edgeId: 2000055}
            ],
            '10053': [
                {neighbor: 10052, edgeId: 2000055},
                {neighbor: 10054, edgeId: 2000056},
                {neighbor: 10056, edgeId: 2000057}
            ],
            '10054': [{neighbor: 10053, edgeId: 2000056}],
            '10055': [{neighbor: 10051, edgeId: 2000052}],
            '10056': [{neighbor: 10053, edgeId: 2000057}],
            '10057': [{neighbor: 10052, edgeId: 2000054}]
        };
        expect(neighbors).toEqual(expectedNeighbours);
    }

    function checkAtomIdxByIdMap(atomIdxById) {
        const expectedIdxByIdMap = {
            '10051': 0, '10052': 1, '10053': 2, '10054': 3, '10055': 4, '10056': 5, '10057': 6
        };
        expect(atomIdxById).toEqual(expectedIdxByIdMap);
    }

    function checkAtomIdByIdxMap(atomIdByIdx) {
        const expectedIdByIdxMap = {
            '0': 10051, '1': 10052, '2': 10053, '3': 10054, '4': 10055, '5': 10056, '6': 10057
        };
        expect(atomIdByIdx).toEqual(expectedIdByIdxMap);
    }

    it('tests the retrieval of an Atom object by Id', async function () {
        const atomsData = structure.atomsData;
        const atom = atomsData.getAtom(10051);
        expect(atom.id).toEqual(10051);
    });

    it('tests the retrieval atom objects of atoms which are neighbors', async function () {
        const atomsData = structure.atomsData;
        const atoms = atomsData.getNonHNeighbors(10051);
        expect(atoms[0].neighbor).toEqual(10055);
        expect(atoms[1].neighbor).toEqual(10052);
    });

    it('tests the retrieval of ids of all atoms that are set for drawing', async function () {
        const atomsData = structure.atomsData;
        expect(atomsData.getAllDrawnAtoms().length).toEqual(7);
        expect(atomsData.getAllEnabledAtoms().length).toEqual(7);
        atomsData.getAtom(10051).enabled = false;
        expect(atomsData.getAllDrawnAtoms().length).toEqual(6);
        expect(atomsData.getAllEnabledAtoms().length).toEqual(6);
    });

    it(
        'tests that an interaction on a given subset of atoms affects not all atoms of the structure',
        async function () {
            const atomsData = structure.atomsData;
            const atoms = [10051, 10052, 10053, 10054, 10055];
            expect(atomsData.isFullStructureAffected(atoms)).toEqual(false);
        }
    );

    it(
        'tests that an interaction on a given subset of atoms affects all atoms of the structure',
        async function () {
            const atomsData = structure.atomsData;
            const atoms = [10051, 10052, 10053, 10054, 10055, 10056, 10057];
            expect(atomsData.isFullStructureAffected(atoms)).toEqual(true);
        }
    );

    it('tests the marking of an atom as selected in internal selection set', async function () {
        const atomsData = structure.atomsData;
        atomsData.selectAtom(10051);
        expect(atomsData.selectedAtoms.has(10051)).toEqual(true);
    });

    it(
        'tests the temporary marking of an atom as selected in internal selection set',
        async function () {
            const atomsData = structure.atomsData;
            atomsData.tempSelectAtom(10051);
            expect(atomsData.tempSelectedAtoms.has(10051)).toEqual(true);
        }
    );

    it(
        'tests whether the placement of atom hydrogens for this structures atoms must be altered',
        async function () {
            checkHydrogenPosition(false, 'coordinates');
        }
    );

    it('tests whether the placement of atom hydrogens for this structures atoms must be altered ' +
        '(tempCoordinates)', async function () {
        checkHydrogenPosition(true, 'tempCoordinates');
    });

    function checkHydrogenPosition(byTemp, coordParam) {
        const atomsData = structure.atomsData;
        const atomWithHydrogen = atomsData.getAtom(10051);
        const neighborAtom = atomsData.getAtom(10052);
        atomWithHydrogen.tempHydrogenOrientation = atomWithHydrogen.hydrogenOrientation;
        neighborAtom.tempHydrogenOrientation = neighborAtom.hydrogenOrientation;
        //put neighborAtom there where the hydrogen is
        neighborAtom[coordParam].x = atomWithHydrogen[coordParam].x;
        neighborAtom[coordParam].y = atomWithHydrogen[coordParam].y - 1;
        const changedAtoms = atomsData.findAtomsWithChangedHPlacement(byTemp);
        //up is the direction towards side, so it means the down side of atomWithHydrogen
        expect(changedAtoms).toEqual({'10051': 'right'});
    }

    it(
        'tests whether the placement of atom labels for this structures atoms must be altered',
        async function () {
            checkLabelPosition(false, 'coordinates');
        }
    );

    it('tests whether the placement of atom labels for this structures atoms must be altered ' +
        '(tempCoordinates)', async function () {
        checkLabelPosition(true, 'tempCoordinates');
    });

    function checkLabelPosition(byTemp, coordParam) {
        const atomsData = structure.atomsData;
        const atomWithLabel = atomsData.getAtom(10057);
        const neighborAtom = atomsData.getAtom(10052);
        atomWithLabel.labelOrientation = atomWithLabel.labelOrientation;
        neighborAtom.tempLabelOrientation = neighborAtom.tempLabelOrientation;
        //put neighborAtom there where the label is
        neighborAtom[coordParam].x = atomWithLabel[coordParam].x;
        neighborAtom[coordParam].y = atomWithLabel[coordParam].y + 1;
        const changedAtoms = atomsData.findAtomsWithChangedAnchors(byTemp);
        expect(changedAtoms).toEqual({'10057': 'down'});
    }
});