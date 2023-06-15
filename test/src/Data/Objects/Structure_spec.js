describe('InteractionDrawer Data Objects Structure', function () {

    beforeEach(function () {
        $('<svg id="draw-area" width="100%" height="600px"></svg>').appendTo('body');
        copyTestConfig = Helpers.deepCloneObject(interactionDrawerTestConfig);
        const copyJson = Helpers.deepCloneObject(interactionDrawerTestJson);
        copyJson.scene.structures[0].additionalInformation = {test: 'test'};
        const interactionDrawer = new InteractionDrawer('draw-area', copyTestConfig);
        const inputJson = JSON.stringify(copyJson);
        interactionDrawer.addByJSON(inputJson);
        structure = interactionDrawer.sceneData.structuresData.structures['0'];
    });

    afterEach(function () {
        $('#draw-area').remove();
    });

    it('tests the creation of a Structure object', async function () {
        expect(structure.id).toEqual(0);
        expect(structure.hidden).toEqual(false);
        expect(structure.enabled).toEqual(true);
        expect(structure.structureName).toEqual('4SP_A_1298');
        expect(structure.structureType).toEqual('ligand');
        expect(structure.structureLabel).toEqual('4SP_A_1298');
        expect(structure.spaceToRings).toEqual(copyTestConfig.spaceToRing +
            copyTestConfig.lineWidth);
        expect(structure.additionalInformation).toEqual({test: 'test'});
    });

    it('tests the adding of json data to a Structure object', async function () {
        expect(structure.curOffset).toEqual({x: 0, y: 0});
        const boundaries = structure.boundaries;
        expect(structure.boundaries).not.toEqual(undefined);
        expect(boundaries.xMax).not.toEqual(undefined);
        expect(boundaries.yMin).not.toEqual(undefined);
        expect(boundaries.yMax).not.toEqual(undefined);
        expect(boundaries.mid.x).not.toEqual(undefined);
        expect(boundaries.mid.y).not.toEqual(undefined);
        expect(boundaries.maxDist).not.toEqual(undefined);
        expect(boundaries.width).not.toEqual(undefined);
        expect(boundaries.height).not.toEqual(undefined);
        expect(structure.atomsData.constructor.name).toEqual('AtomsData');
        expect(structure.edgesData.constructor.name).toEqual('EdgesData');
        expect(structure.ringsData.constructor.name).toEqual('RingsData');
        expect(structure.representationsData.constructor.name).toEqual('RepresentationsData');
        expect(structure.annotationConnectionData.constructor.name).toEqual(
            'AnnotationConnectionData');
        expect(structure.hydrophobicConnectionData.constructor.name).toEqual(
            'HydrophobicConnectionData');
        expect(structure.intermolecularConnectionData.constructor.name).toEqual(
            'IntermolecularConnectionData');
    });

    it('tests the splitting of structure into two parts on acyclic bond', async function () {
        const atomIdsOfParts = structure.splitStructureOnBond(2000003);
        expect(atomIdsOfParts).toEqual([
            [10000, 10001, 10002, 10009, 10030, 10031], [
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
            ]
        ]);
    });

    it('tests ids of atoms to move based on a given atom which is currently affected by some' +
        ' form of interaction (free)', async function () {
        const atomIds = structure.getMoveUnitForAtom(10000, 'free');
        expect(atomIds).toEqual([10000]);
    });

    it('tests ids of atoms to move based on a given atom which is currently affected by some' +
        ' form of interaction (rings)', async function () {
        const atomIds = structure.getMoveUnitForAtom(10004, 'rings');
        //ringsystem of 2 rings
        expect(atomIds).toEqual([
            10013, 10014, 10005, 10010, 10008, 10020, 10006, 10011, 10004
        ]);
    });

    it('tests ids of atoms to move based on a given atom which is currently affected by some' +
        ' form of interaction (structures)', async function () {
        const atomIds = structure.getMoveUnitForAtom(10000, 'structures');
        expect(atomIds).toEqual([
            10000,
            10001,
            10002,
            10003,
            10004,
            10005,
            10006,
            10007,
            10008,
            10009,
            10010,
            10011,
            10012,
            10013,
            10014,
            10015,
            10016,
            10017,
            10018,
            10019,
            10020,
            10021,
            10022,
            10023,
            10024,
            10025,
            10026,
            10027,
            10028,
            10029,
            10030,
            10031
        ]);
    });

    it('tests ids of atoms to move based on a given edge which is currently affected by some' +
        ' form of interaction (free)', async function () {
        const atomIds = structure.getMoveUnitForEdge(2000000, 'free');
        expect(atomIds).toEqual([10000, 10001]);
    });

    it('tests ids of atoms to move based on a given edge which is currently affected by some' +
        ' form of interaction (rings)', async function () {
        const atomIds = structure.getMoveUnitForEdge(2000006, 'rings');
        expect(atomIds).toEqual([
            10013, 10014, 10005, 10010, 10008, 10020, 10006, 10011, 10004
        ]);
    });

    it('tests ids of atoms to move based on a given edge which is currently affected by some' +
        ' form of interaction (structures)', async function () {
        const atomIds = structure.getMoveUnitForEdge(2000000, 'structures');
        expect(atomIds).toEqual([
            10000,
            10001,
            10002,
            10003,
            10004,
            10005,
            10006,
            10007,
            10008,
            10009,
            10010,
            10011,
            10012,
            10013,
            10014,
            10015,
            10016,
            10017,
            10018,
            10019,
            10020,
            10021,
            10022,
            10023,
            10024,
            10025,
            10026,
            10027,
            10028,
            10029,
            10030,
            10031
        ]);
    });

    it('tests the retrieval of all non-molecular elements which are connected to this' +
        ' structure', async function () {
        const connectedElements = structure.getConnectedElements();
        console.log(connectedElements)
        expect(connectedElements.annotations).toEqual(new Set([1, 2, 3, 4, 5]));
        expect(connectedElements.atomPairInteractions).toEqual(new Set([0, 1, 2, 3, 4]));
        expect(connectedElements.piStackings).toEqual(new Set([0]));
        expect(connectedElements.cationPiStackings).toEqual(new Set([0]));
        expect(connectedElements.splineControlPoints).toEqual({
            '0': new Set(['0', '1', '2', '3', '4', '5', '6']), '1': new Set(['0', '1', '2'])
        });
    });

    it('tests the retrieval of all non-molecular (bond) elements which are connected to' +
        ' given atoms', async function () {
        const connectedElements = structure.getConnectedElementsForAtoms([
            10001, 10013, 10018, 10022
        ], 'free');
        console.log(connectedElements)
        expect(connectedElements.annotations).toEqual(new Set([1, 2]));
        expect(connectedElements.atomPairInteractions).toEqual(new Set([0]));
        expect(connectedElements.piStackings).toEqual(new Set([0]));
        expect(connectedElements.cationPiStackings).toEqual(new Set([0]));
        expect(connectedElements.splineControlPoints).toEqual({'0': new Set([0])});
    });

    it('tests if at least one atom, bond or structure circle is selected (normal selection)',
        async function () {
            structure.atomsData.selectedAtoms.add(10000);
            expect(structure.isSelected(0)).toEqual(true);
            structure.atomsData.selectedAtoms = new Set();
            structure.atomsData.tempSelectedAtoms.add(10000);
            expect(structure.isSelected(0)).toEqual(false);
            structure.atomsData.tempSelectedAtoms = new Set();
        }
    );

    it('tests if at least one atom, bond or structure circle is selected (temp selection)',
        async function () {
            structure.atomsData.tempSelectedAtoms.add(10000);
            expect(structure.isSelected(1)).toEqual(true);
            structure.atomsData.tempSelectedAtoms = new Set();
            structure.atomsData.selectedAtoms.add(10000);
            expect(structure.isSelected(1)).toEqual(false);
            structure.atomsData.selectedAtoms = new Set();
        }
    );

    it('tests if at least one atom, bond or structure circle is selected' +
        ' (normal and temp selection)', async function () {
        structure.atomsData.tempSelectedAtoms.add(10000);
        expect(structure.isSelected(2)).toEqual(true);
        structure.atomsData.tempSelectedAtoms = new Set();
        structure.atomsData.selectedAtoms.add(10000);
        expect(structure.isSelected(2)).toEqual(true);
        structure.atomsData.selectedAtoms.clear();
    });

    it('tests the reset of tracked offsets applied to this structure', async function () {
        const resetedOffset = {
            x: 0, y: 0
        };
        structure.curOffset = {
            x: 1, y: 1
        };
        expect(structure.curOffset).not.toEqual(resetedOffset);
        structure.resetCurOffset();
        expect(structure.curOffset).toEqual(resetedOffset);
    });

    it('tests the updating of given boundaries for given draw limits', async function () {
        const boundariesToUpdate = {
            xMin: 0, xMax: 0, yMin: 0, yMax: 0
        };
        const newDrawLimits = {
            xMin: -1, xMax: 1, yMin: 1, yMax: 1
        };
        const changed = Structure.calcBoundariesStep(newDrawLimits, boundariesToUpdate);
        expect(changed).toEqual(true);
        expect(boundariesToUpdate).toEqual({
            xMin: -1, xMax: 1, yMin: 0, yMax: 1
        });
    });

    it('tests the calculation of bounding box limits of a structure', async function () {
        //these values are set manually and are therefore independent of the browser size
        structure.boundaries = {
            xMin: 0, xMax: 0, yMin: 0, yMax: 0, mid: 0, maxDist: 0, width: 0, height: 0
        }
        structure.atomsData.atoms.forEach(atom => {
            if (!atom.enabled) {
                return
            }
            atom.globalDrawLimits = {xMin: -1, xMax: 1, yMin: -1, yMax: 1};
        });
        structure.atomsData.atoms[0].globalDrawLimits = {xMin: -2, xMax: 1, yMin: -1, yMax: 1};
        structure.calcBoundaries();
        const boundaries = structure.boundaries;
        expect(boundaries.xMin).toEqual(-2);
        expect(boundaries.xMax).toEqual(1);
        expect(boundaries.yMin).toEqual(-1);
        expect(boundaries.yMax).toEqual(1);
        expect(boundaries.mid.x).toBeCloseTo(4.436);
        expect(boundaries.mid.y).toBeCloseTo(-1.85);
        expect(boundaries.maxDist).toBeCloseTo(77.92);
        expect(boundaries.width).toEqual(3);
        expect(boundaries.height).toEqual(2);
        expect(boundaries).toEqual(structure.getLimits());
    });

    it(
        'tests the calculation of the rotation offset of the structure circle of the structure',
        async function () {
            const currentMid = structure.boundaries.mid;
            let rotationOffset = structure.calcStructureCircleRotationOffset(180,
                true,
                {x: currentMid.x - 1, y: currentMid.y - 1},
                false
            );
            expect(rotationOffset.x).toBeCloseTo(-2);
            expect(rotationOffset.y).toBeCloseTo(-2);
            rotationOffset = structure.calcStructureCircleRotationOffset(180, true);
            expect(rotationOffset.x).toBeCloseTo(0);
            expect(rotationOffset.y).toBeCloseTo(0);
        }
    );

    it('tests the adding the boundaries of the structure circle to the structure boundaries',
        async function () {
            structure.boundaries = {
                xMin: 0, xMax: 1, yMin: 0, yMax: 1
            };
            structure.representationsData.structureCircle.drawLimits = {
                xMin: -1, xMax: 1, yMin: -1, yMax: 1
            }
            expect(structure.addStructureCircleToBoundaries()).toEqual(true);
            const newBoundaries = structure.boundaries;
            //sets structure circle boundaries since the ones of the structure are smaller
            expect(newBoundaries.xMin).toEqual(-1);
            expect(newBoundaries.xMax).toEqual(1);
            expect(newBoundaries.yMin).toEqual(-1);
            expect(newBoundaries.yMax).toEqual(1);
            expect(newBoundaries.mid.x).toBeCloseTo(4.436);
            expect(newBoundaries.mid.y).toBeCloseTo(-1.85);
            expect(newBoundaries.maxDist).toBeCloseTo(77.92);
            expect(newBoundaries.width).toEqual(2);
            expect(newBoundaries.height).toEqual(2);
        }
    );

    it('tests the calculation of the necessary offsets to move the atom such that it rotates' +
        ' some angle around a rotation point', async function () {
        const currentMid = structure.boundaries.mid;
        let rotationOffsets = structure.calcAtomRotationOffsets(180,
            true,
            {x: currentMid.x - 1, y: currentMid.y - 1},
            false
        );
        expect(rotationOffsets['10000'].x).toBeCloseTo(-59.707);
        expect(rotationOffsets['10000'].y).toBeCloseTo(95.399);
        rotationOffsets = structure.calcAtomRotationOffsets(180, true);
        expect(rotationOffsets['10000'].x).toBeCloseTo(-57.707);
        expect(rotationOffsets['10000'].y).toBeCloseTo(97.399);
    });

    it('tests the deep cloning of a Structure object', async function () {
        const clonedStructure = structure.clone();
        expect(clonedStructure).not.toBe(structure);
        expect(clonedStructure.id).toEqual(structure.id);
        expect(clonedStructure.hidden).toEqual(structure.hidden);
        expect(clonedStructure.enabled).toEqual(structure.enabled);
        expect(clonedStructure.structureName).toEqual(structure.structureName);
        expect(clonedStructure.structureType).toEqual(structure.structureType);
        expect(clonedStructure.structureLabel).toEqual(structure.structureLabel);
        expect(clonedStructure.spaceToRings).toEqual(structure.spaceToRings);
        expect(clonedStructure.additionalInformation).not.toBe(structure.additionalInformation);
        expect(clonedStructure.additionalInformation).toEqual(structure.additionalInformation);
    });
});