//tests also InteractionObject
describe('InteractionDrawer InteractionTracking InteractionState', function () {

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

    it('tests the resetting of an non default state InteractionState and InteractionObject',
        async function () {
            const defaultInteractionState = new InteractionState({}, {});
            const modifiedInteractionState = new InteractionState({}, {});
            modifyInteractionState(modifiedInteractionState);
            modifiedInteractionState.reset();
            checkInteractionState(modifiedInteractionState, defaultInteractionState);
        }
    );

    function modifyInteractionState(interactionState) {
        //modify everything that would be affected by reset
        interactionState.transformParams = {
            scale: 2, translate: {
                x: 1, y: 1
            }, centerTranslate: {
                x: 1, y: 1
            }
        };
        interactionState.selectionPoints.push(1);
        interactionState.interaction.movement = {
            canMove: null,
            didMove: null,
            fullStructures: null,
            partialStructures: null,
            ringSystems: null,
            individualAtoms: null,
            annotations: null,
            splineControlPoints: null,
            atomPairInteractions: null,
            piStackings: null,
            cationPiStackings: null
        };
        interactionState.interaction.rotation = {
            curRotation: null,
            type: null,
            structures: null,
            annotations: null,
            splineControlPoints: null,
            atomPairInteractions: null,
            piStackings: null,
            cationPiStackings: null
        };
        interactionState.interaction.scaledRotation = {
            rememberedAngle: null
        };
        interactionState.interaction.mirror = {
            edge: {
                structureId: null, edgeId: null
            }, side: null, atomsSmall: null, atomsLarge: null
        };
        interactionState.interaction.lineMirror.curStructureId = undefined;
        interactionState.interaction.lineMirror.annotations = null;
        interactionState.interaction.lineMirror.splineControlPoints = null;
        interactionState.interaction.remove = {
            structures: new Set(),
            atoms: null,
            edges: null,
            annotations: null,
            hydrophobicContacts: null,
            atomPairInteractions: null,
            piStackings: null,
            cationPiStackings: null,
            selected: null
        };
        interactionState.interaction.addIntermolecular = {
            endpoints: {
                first: null, second: null
            }, from: null, to: null, fromHydrophobic: {
                hydrophobicContactId: null, controlPointId: null
            }, toHydrophobic: {
                hydrophobicContactId: null, controlPointId: null
            }, fromStructure: null, toStructure: null
        };
        interactionState.interaction.addAnnotation.coords = null;
        interactionState.interaction.selectionCandidates = null;
    }

    function checkInteractionState(modifiedInteractionState, defaultInteractionState) {
        const modifiedInteractionObject = modifiedInteractionState.interaction;
        const defaultInteractionObject = defaultInteractionState.interaction;
        expect(modifiedInteractionState.transformParams)
            .toEqual(defaultInteractionState.transformParams);
        expect(modifiedInteractionState.selectionPoints)
            .toEqual(defaultInteractionState.selectionPoints);
        expect(modifiedInteractionObject.movement).toEqual(defaultInteractionObject.movement);
        expect(modifiedInteractionObject.rotation).toEqual(defaultInteractionObject.rotation);
        expect(modifiedInteractionObject.scaledRotation)
            .toEqual(defaultInteractionObject.scaledRotation);
        expect(modifiedInteractionObject.mirror).toEqual(defaultInteractionObject.mirror);
        expect(modifiedInteractionObject.lineMirror)
            .toEqual(defaultInteractionObject.lineMirror);
        expect(modifiedInteractionObject.remove).toEqual(defaultInteractionObject.remove);
        expect(modifiedInteractionObject.addIntermolecular)
            .toEqual(defaultInteractionObject.addIntermolecular);
        expect(modifiedInteractionObject.addAnnotation)
            .toEqual(defaultInteractionObject.addAnnotation);
        expect(modifiedInteractionObject.selectionCandidates)
            .toEqual(defaultInteractionObject.selectionCandidates);
    }

    it('tests the adding of potential candidates for selection', async function () {
        const interactionObject = new InteractionObject();
        interactionObject.addSelectionCandidate(1, 2, 'atomPairInteraction');
        expect(interactionObject.selectionCandidates).toEqual({
            '1': [
                {
                    id: 2, type: 'atomPairInteraction'
                }
            ]
        });
        interactionObject.addSelectionCandidate(1, 3, 'atomPairInteraction');
        expect(interactionObject.selectionCandidates)
            .toEqual({
                '1': [
                    {id: 2, type: 'atomPairInteraction'}, {id: 3, type: 'atomPairInteraction'}
                ]
            });
    });

    it('tests the setting of info relevant for all types of mouse interaction', async function () {
        const interactionState = new InteractionState({}, {});
        interactionState.setMouseDefaultInteractionState();
        expect(interactionState.cursorPos).toEqual(null);
        expect(interactionState.mirrorLineInfo).toEqual({
            endpoints: {
                first: undefined, second: undefined
            }, structure: undefined
        });
        expect(interactionState.addIntermolecularType)
            .toEqual(IntermolecularType.atomPairInteraction);
    });

    it('tests the setting of valid type of what intermolecular interaction gets added during the' +
        ' addIntermolecular mode', async function () {
        const interactionState = new InteractionState({}, {});
        interactionState.setAddIntermolecularType('hydrophobicContact');
        expect(interactionState.addIntermolecularType)
            .toEqual(IntermolecularType.hydrophobicContact);
    });

    it('tests the setting of invalid type of what intermolecular interaction gets added during the' +
        ' addIntermolecular mode', async function () {
        const interactionState = new InteractionState({}, {});
        interactionState.setMouseDefaultInteractionState();
        interactionState.setAddIntermolecularType('invalidType');
        expect(interactionState.addIntermolecularType)
            .toEqual(IntermolecularType.atomPairInteraction);
    });

    it('tests the alternation between mirror modes', async function () {
        const copyTestConfig = Helpers.deepCloneObject(interactionDrawerProcessedDefaultConfig);
        const interactionState = new InteractionState(copyTestConfig, {});
        interactionState.setDefaultInteraction('lineMirror');
        interactionState.setNextLineMirrorMode();
        expect(interactionState.interaction.lineMirror.curMode)
            .toEqual(InteractionMode.mirrorSelect);
        expect(interactionState.opts.defaultInteraction).toEqual(InteractionMode.mirrorSelect);
        expect(interactionState.interaction.mode).toEqual(InteractionMode.mirrorSelect);
        interactionState.setNextLineMirrorMode();
        expect(interactionState.interaction.lineMirror.curMode).toEqual(InteractionMode.lineMirror);
        expect(interactionState.opts.defaultInteraction).toEqual(InteractionMode.lineMirror);
        expect(interactionState.interaction.mode).toEqual(InteractionMode.lineMirror);
    });

    it('tests the setting of invalid default interaction mode', async function () {
        setAndCheckDefaultInteraction('invalidMode',
            true,
            InteractionMode.movement,
            undefined,
            false
        );
    });

    it('tests the setting of non allowed default interaction mode', async function () {
        setAndCheckDefaultInteraction('addAnnotationInput',
            true,
            InteractionMode.movement,
            undefined,
            true
        );
    });

    it('tests the setting of valid and allowed default interaction mode', async function () {
        setAndCheckDefaultInteraction('rotation',
            true,
            InteractionMode.rotation,
            InteractionMode.rotation,
            false
        );
    });

    it('tests the setting of valid and allowed default interaction mode (directSet for current mode' +
        ' off)', async function () {
        setAndCheckDefaultInteraction('rotation',
            false,
            InteractionMode.rotation,
            undefined,
            false
        );
    });

    function setAndCheckDefaultInteraction(setMode,
        changeCurrent,
        expectedDefault,
        expectedCurrent,
        deactivateInteractions
    ) {
        const copyTestConfig = Helpers.deepCloneObject(interactionDrawerProcessedDefaultConfig);
        const interactionState = new InteractionState(copyTestConfig, {});
        if (deactivateInteractions) {
            interactionState.opts.allowedInteraction = [];
        }
        interactionState.setDefaultInteraction(setMode, changeCurrent);
        expect(interactionState.opts.defaultInteraction).toEqual(expectedDefault);
        expect(interactionState.interaction.mode).toEqual(expectedCurrent);
    }

    it('tests the direct setting of current interaction mode', async function () {
        const copyTestConfig = Helpers.deepCloneObject(interactionDrawerProcessedDefaultConfig);
        const interactionState = new InteractionState(copyTestConfig, {});
        interactionState.setInteractionMode(InteractionMode.rotation);
        expect(interactionState.interaction.mode).toEqual(InteractionMode.rotation);
    });

    it('tests the noting of elements to be affected by the edge mirror interaction mode',
        async function () {
            const interactionState = new InteractionState({}, {});
            interactionState.setInteractionEdgeMirror(0, 1);
            const mirror = interactionState.interaction.mirror;
            expect(mirror.edge).toEqual({structureId: 0, edgeId: 1});
            expect(mirror.side).toEqual('small');
            expect(mirror.atomsSmall).toEqual([]);
            expect(mirror.atomsLarge).toEqual([]);

        }
    );

    it('tests the noting of elements to be affected by the rotation interaction mode',
        async function () {
            interactionDrawer.interactionState.setInteractionRotation(0);
            const rotation = interactionDrawer.interactionState.interaction.rotation;
            expect(rotation.type).toEqual('singleStructure');
            expect(rotation.structures).toEqual([0]);
            expect(rotation.annotations).toEqual(new Set([1, 2, 3, 4, 5]));
            expect(rotation.atomPairInteractions).toEqual(new Set([0, 1, 2, 3, 4]));
            expect(rotation.piStackings).toEqual(new Set([0]));
            expect(rotation.cationPiStackings).toEqual(new Set([0]));
            expect(rotation.splineControlPoints)
                .toEqual({
                    '0': new Set(['0', '1', '2', '3', '4', '5', '6']), '1': new Set(['0', '1', '2'])
                });
        }
    );

    it('tests the noting of elements to be affected by the line mirror interaction mode',
        async function () {
            interactionDrawer.interactionState.setInteractionLineMirror(0);
            const lineMirror = interactionDrawer.interactionState.interaction.lineMirror;
            expect(lineMirror.curStructureId).toEqual(0);
            expect(lineMirror.annotations).toEqual(new Set([1, 2, 3, 4, 5]));
            expect(lineMirror.splineControlPoints)
                .toEqual({
                    '0': new Set(['0', '1', '2', '3', '4', '5', '6']), '1': new Set(['0', '1', '2'])
                });
        }
    );

    it(
        'tests the noting of elements to be affected by the rotation interaction mode (entire scene)',
        async function () {
            interactionDrawer.interactionState.setInteractionRotationFullScene();
            const rotation = interactionDrawer.interactionState.interaction.rotation;
            expect(rotation.type).toEqual('fullScene');
            expect(rotation.structures).toEqual(['0', '1', '2', '3', '4']);
            expect(rotation.annotations).toEqual(new Set(['0', '1', '2', '3', '4', '5']));
            expect(rotation.atomPairInteractions).toEqual(new Set(['0', '1', '2', '3', '4']));
            expect(rotation.piStackings).toEqual(new Set(['0']));
            expect(rotation.cationPiStackings).toEqual(new Set(['0']));
            expect(rotation.splineControlPoints)
                .toEqual({
                    '0': new Set(['0', '1', '2', '3', '4', '5', '6']), '1': new Set(['0', '1', '2'])
                });
        }
    );

    it('tests the noting of elements to be affected by the movement interaction mode (atom is' +
        ' moved, moveFreedomLevel "structures")', async function () {
        //tests also getAffectedStructuresNoFreedom
        checkFullStructureMovement(10000, 'atom');
    });

    it('tests the noting of elements to be affected by the movement interaction mode (edge is' +
        ' moved, moveFreedomLevel "structures")', async function () {
        //tests also getAffectedStructuresNoFreedom
        checkFullStructureMovement(2000000, 'edge');
    });

    it('tests the noting of elements to be affected by the movement interaction mode' +
        ' (structureCircle is hovered, moveFreedomLevel "structures")', async function () {
        //tests also getAffectedStructuresNoFreedom
        checkFullStructureMovement(10000, 'structureCircle');
    });

    it('tests the noting of elements to be affected by the movement interaction mode (atom of' +
        ' ring with hydrophobic contact, interaction and annotations is moved,' +
        ' moveFreedomLevel "rings")', async function () {
        //tests also getAffectedRingsFreedom
        const elementToCheck = {
            type: 'atom',
            id: 10016,
            expectedAtoms: [
                10012, 10017, 10019, 10015, 10018, 10016
            ],
            mode: 'rings',
            expectedAnnotations: new Set([3, 4, 5]),
            expectedSplineControlPoints: {'1': new Set([1, 2])}
        };
        const interactionDrawer = setupDrawer(elementToCheck.mode);
        interactionDrawer.interactionState.setInteractionMovement(0,
            elementToCheck.id,
            elementToCheck.type,
            false
        );
        const movement = interactionDrawer.interactionState.interaction.movement;
        expect(movement.fullStructures).toEqual([]);
        expect(movement.partialStructures).toEqual([0]);
        expect(movement.ringSystems).toEqual({'0': ['3']});
        expect(movement.individualAtoms).toEqual({'0': elementToCheck.expectedAtoms});
        expect(movement.annotations).toEqual(elementToCheck.expectedAnnotations);
        expect(movement.atomPairInteractions).toEqual(new Set());
        expect(movement.piStackings).toEqual(new Set());
        expect(movement.cationPiStackings).toEqual(new Set([0]));
        //control point 0 does not belong to the ring
        expect(movement.splineControlPoints)
            .toEqual(elementToCheck.expectedSplineControlPoints);
    });

    it('tests the noting of elements to be affected by the movement interaction mode (atom of ring' +
        ' is moved, moveFreedomLevel "full")', async function () {
        //tests also getAffectedFullFreedom
        const elementToCheck = {
            type: 'atom',
            id: 10016,
            expectedAtoms: [10016],
            mode: 'full',
            expectedAnnotations: new Set([5]),
            expectedSplineControlPoints: {}
        };
        const interactionDrawer = setupDrawer(elementToCheck.mode);
        interactionDrawer.interactionState.setInteractionMovement(0,
            elementToCheck.id,
            elementToCheck.type,
            false
        );
        const movement = interactionDrawer.interactionState.interaction.movement;
        expect(movement.fullStructures).toEqual([]);
        expect(movement.partialStructures).toEqual([0]);
        expect(movement.ringSystems).toEqual({'0': ['3']});
        expect(movement.individualAtoms).toEqual({'0': elementToCheck.expectedAtoms});
        expect(movement.annotations).toEqual(elementToCheck.expectedAnnotations);
        expect(movement.atomPairInteractions).toEqual(new Set());
        expect(movement.piStackings).toEqual(new Set());
        expect(movement.cationPiStackings).toEqual(new Set([0]));
        //control point 0 does not belong to the ring
        expect(movement.splineControlPoints)
            .toEqual(elementToCheck.expectedSplineControlPoints);
    });

    it('tests the noting of elements to be affected by the movement interaction mode (edge of' +
        ' ring with hydrophobic contact, interaction and annotations is moved,' +
        ' moveFreedomLevel "rings")', async function () {
        //tests also getAffectedRingsFreedom
        const elementToCheck = {
            type: 'edge',
            id: 2000021,
            expectedAtoms: [
                10012, 10017, 10019, 10015, 10018, 10016
            ],
            mode: 'rings',
            expectedAnnotations: new Set([3, 4, 5]),
            expectedSplineControlPoints: {'1': new Set([1, 2])}
        };
        const interactionDrawer = setupDrawer(elementToCheck.mode);
        interactionDrawer.interactionState.setInteractionMovement(0,
            elementToCheck.id,
            elementToCheck.type,
            false
        );
        const movement = interactionDrawer.interactionState.interaction.movement;
        expect(movement.fullStructures).toEqual([]);
        expect(movement.partialStructures).toEqual([0]);
        expect(movement.ringSystems).toEqual({'0': ['3']});
        expect(movement.individualAtoms).toEqual({'0': elementToCheck.expectedAtoms});
        expect(movement.annotations).toEqual(elementToCheck.expectedAnnotations);
        expect(movement.atomPairInteractions).toEqual(new Set());
        expect(movement.piStackings).toEqual(new Set());
        expect(movement.cationPiStackings).toEqual(new Set([0]));
        //control point 0 does not belong to the ring
        expect(movement.splineControlPoints)
            .toEqual(elementToCheck.expectedSplineControlPoints);
    });

    it('tests the noting of elements to be affected by the movement interaction mode (edge of ring' +
        ' is moved, moveFreedomLevel "full")', async function () {
        //tests also getAffectedFullFreedom
        const elementToCheck = {
            type: 'edge', id: 2000021, expectedAtoms: [
                10012, 10016
            ], mode: 'full', expectedAnnotations: new Set([5]), expectedSplineControlPoints: {}
        };
        const interactionDrawer = setupDrawer(elementToCheck.mode);
        interactionDrawer.interactionState.setInteractionMovement(0,
            elementToCheck.id,
            elementToCheck.type,
            false
        );
        const movement = interactionDrawer.interactionState.interaction.movement;
        expect(movement.fullStructures).toEqual([]);
        expect(movement.partialStructures).toEqual([0]);
        expect(movement.ringSystems).toEqual({'0': ['3']});
        expect(movement.individualAtoms).toEqual({'0': elementToCheck.expectedAtoms});
        expect(movement.annotations).toEqual(elementToCheck.expectedAnnotations);
        expect(movement.atomPairInteractions).toEqual(new Set());
        expect(movement.piStackings).toEqual(new Set());
        expect(movement.cationPiStackings).toEqual(new Set([0]));
        //control point 0 does not belong to the ring
        expect(movement.splineControlPoints)
            .toEqual(elementToCheck.expectedSplineControlPoints);
    });

    it('tests the noting of elements to be affected by the movement interaction mode (non ring' +
        ' atom with interaction is hovered, moveFreedomLevel "rings")', async function () {
        //tests also getAffectedRingsFreedom
        checkAtomMovement('rings')
    });

    it('tests the noting of elements to be affected by the movement interaction mode (non ring' +
        ' atom with interaction is hovered, moveFreedomLevel "full")', async function () {
        //tests also getAffectedFullFreedom
        checkAtomMovement('full')
    });

    it(
        'tests the noting of elements to be affected by the movement interaction mode (non ring' +
        ' edge with hydrophobic contact and annotations is hovered, moveFreedomLevel "rings")',
        async function () {
            //tests also getAffectedRingsFreedom
            checkEdgeMovement('rings')
        }
    );

    it('tests the noting of elements to be affected by the movement interaction mode (non ring' +
        ' edge with hydrophobic contact and annotations is hovered, moveFreedomLevel "full")',
        async function () {
            //tests also getAffectedFullFreedom
            checkEdgeMovement('full')
        }
    );

    function checkAtomMovement(moveFreedomLevel) {
        const interactionDrawer = setupDrawer(moveFreedomLevel);
        interactionDrawer.interactionState.setInteractionMovement(2, 10047, 'atom', false);
        const movement = interactionDrawer.interactionState.interaction.movement;
        expect(movement.fullStructures).toEqual([]);
        expect(movement.partialStructures).toEqual([2]);
        expect(movement.ringSystems).toEqual({'2': []});
        expect(movement.individualAtoms).toEqual({
            '2': [10047]
        });
        expect(movement.annotations).toEqual(new Set());
        expect(movement.atomPairInteractions).toEqual(new Set([1]));
        expect(movement.piStackings).toEqual(new Set());
        expect(movement.cationPiStackings).toEqual(new Set([]));
        //control point 0 does not belong to the ring
        expect(movement.splineControlPoints).toEqual({});
    }

    function checkEdgeMovement(moveFreedomLevel) {
        const interactionDrawer = setupDrawer(moveFreedomLevel);
        interactionDrawer.interactionState.setInteractionMovement(0, 2000001, 'edge', false);
        const movement = interactionDrawer.interactionState.interaction.movement;
        expect(movement.fullStructures).toEqual([]);
        expect(movement.partialStructures).toEqual([0]);
        expect(movement.ringSystems).toEqual({'0': []});
        expect(movement.individualAtoms).toEqual({
            '0': [10000, 10002]
        });
        expect(movement.annotations).toEqual(new Set([3, 4]));
        expect(movement.atomPairInteractions).toEqual(new Set([]));
        expect(movement.piStackings).toEqual(new Set());
        expect(movement.cationPiStackings).toEqual(new Set([]));
        //control point 0 does not belong to the ring
        expect(movement.splineControlPoints).toEqual({'1': new Set([0])});
    }

    function checkFullStructureMovement(id, type) {
        interactionDrawer.interactionState.setInteractionMovement(0, id, type, false);
        const movement = interactionDrawer.interactionState.interaction.movement;
        expect(movement.fullStructures).toEqual([0]);
        expect(movement.partialStructures).toEqual([]);
        expect(movement.ringSystems).toEqual({'0': ['1', '2', '3']});
        expect(movement.individualAtoms).toEqual({
            '0': [
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
            ]
        });
        expect(movement.annotations).toEqual(new Set([1, 2, 3, 4, 5]));
        expect(movement.atomPairInteractions).toEqual(new Set([0, 1, 2, 3, 4]));
        expect(movement.piStackings).toEqual(new Set([0]));
        expect(movement.cationPiStackings).toEqual(new Set([0]));
        expect(movement.splineControlPoints).toEqual({
            '0': new Set(['0', '1', '2', '3', '4', '5', '6']), '1': new Set(['0', '1', '2'])
        });
    }

    it('tests the determination whether a structure specified by id is (not) fully affected by an' +
        ' interaction', async function () {
        const fullStructures = [];
        const partialStructures = [];
        const affectedAtoms = [
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
        ];
        interactionDrawer.interactionState.checkFullStructureAffectedByAtoms(0,
            affectedAtoms,
            fullStructures,
            partialStructures
        );
        expect(partialStructures).toEqual([]);
        expect(fullStructures).toEqual([0]);
        affectedAtoms.pop();
        interactionDrawer.interactionState.checkFullStructureAffectedByAtoms(0,
            affectedAtoms,
            fullStructures,
            partialStructures
        );
        expect(partialStructures).toEqual([0]);
    });

    it('tests the calculation of parameters to be used in rotation (fullScene)', async function () {
        checkRotationParameters('fullScene');
    });

    it('tests the calculation of parameters to be used in rotation (singleStructure)',
        async function () {
            checkRotationParameters('singleStructure');
        }
    );

    function checkRotationParameters(rotationType) {
        interactionDrawer.interactionState.interaction.start = {x: 1, y: 0};
        interactionDrawer.interactionState.interaction.rotation =
            {structures: [0], type: rotationType};
        interactionDrawer.sceneData.structuresData.structures[0].getLimits().mid = {x: 0, y: 0};
        interactionDrawer.sceneData.midCoords = {x: 0, y: 0};
        interactionDrawer.interactionState.transformParams = {
            scale: 1, translate: {
                x: 0, y: 0
            }, centerTranslate: {
                x: 0, y: 0
            }
        };
        const parameters = interactionDrawer.interactionState.getRotationParameters({x: 0, y: 1});
        expect(parameters.scaledMid.x).toBeCloseTo(0);
        expect(parameters.scaledMid.y).toBeCloseTo(0);
        expect(parameters.angle).toBeCloseTo(90);
    }

    it('tests the handling of given offsets for movement that exceeds required minimum movement' +
        ' specified', async function () {
        checkMovementPossible(2, {x: 1, y: 1}, false);
    });

    it('tests the handling of given offsets for movement that not exceeds required minimum movement' +
        ' specified', async function () {
        checkMovementPossible(1, {x: 1, y: 1}, true);
    });

    function checkMovementPossible(grace, offsets, expected) {
        const interaction = interactionDrawer.interactionState.interaction;
        interaction.grace = grace;
        interaction.movement.canMove = false;
        const canMove = interactionDrawer.interactionState.decideMovementPossible(offsets);
        //1.41 vs grace
        expect(canMove).toEqual(expected);
    }

    function setupDrawer(moveFreedomLevel = 'structures') {
        $('<svg id="draw-area" width="100%" height="600px"></svg>').appendTo('body');
        const copyTestConfig = Helpers.deepCloneObject(interactionDrawerTestConfig);
        const copyJson = Helpers.deepCloneObject(interactionDrawerTestJson);
        copyTestConfig.moveFreedomLevel = moveFreedomLevel;
        const interactionDrawer = new InteractionDrawer('draw-area', copyTestConfig);
        const inputJson = JSON.stringify(copyJson);
        interactionDrawer.addByJSON(inputJson);
        return interactionDrawer;
    }

    it(
        'tests the calculation of offsets between the noted start of user interaction updated) and the' +
        ' current cursor position (scale 2)',
        async function () {
            const interactionState = new InteractionState({}, {});
            interactionState.interaction.start = {x: 0.5, y: 0.5};
            interactionState.transformParams.scale = 2;
            const offsets = interactionState.getOffsetsToInteractionStart({
                x: 1, y: 1
            });
            expect(offsets.x).toBeCloseTo(0.25);
            expect(offsets.y).toBeCloseTo(0.25);
        }
    );

    it('tests the creation and scaling of the selection rectangle based on current translation' +
        ' parameters (default)', async function () {
        const expectedCornerPoints = [
            {x: 0, y: 1}, {x: 1, y: 1}, {x: 1, y: 0}, {x: 0, y: 0}
        ];
        checkSelectionRectangle(1, {x: 0, y: 0}, expectedCornerPoints)
    });

    it('tests the creation and scaling of the selection rectangle based on current translation' +
        ' parameters (scale 2)', async function () {
        const expectedCornerPoints = [
            {x: 0, y: 0.5}, {x: 0.5, y: 0.5}, {x: 0.5, y: 0}, {x: 0, y: 0}
        ];
        checkSelectionRectangle(2, {x: 0, y: 0}, expectedCornerPoints)
    });

    it('tests the creation and scaling of the selection rectangle based on current translation' +
        ' parameters (scale 2, translate x=1)', async function () {
        const expectedCornerPoints = [
            {x: -1, y: 0.5}, {x: -0.5, y: 0.5}, {x: -0.5, y: 0}, {x: -1, y: 0}
        ];
        checkSelectionRectangle(2, {x: 1, y: 0}, expectedCornerPoints)
    });

    function checkSelectionRectangle(scale, translate, expectedCornerPoints) {
        const interactionState = new InteractionState({}, {});
        interactionState.transformParams.scale = scale;
        interactionState.transformParams.translate = translate;
        const cornerPoints = interactionState.createRectSelection({x: 0, y: 1}, {x: 1, y: 0});
        expect(cornerPoints[0]).toEqual(expectedCornerPoints[0]);
        expect(cornerPoints[1]).toEqual(expectedCornerPoints[1]);
        expect(cornerPoints[2]).toEqual(expectedCornerPoints[2]);
        expect(cornerPoints[3]).toEqual(expectedCornerPoints[3]);
    }

    it('tests the translation of a scaled position in the draw area to pixel coordinates',
        async function () {
            const interactionState = new InteractionState({}, {});
            interactionState.transformParams.scale = 2;
            interactionState.transformParams.translate = {x: 1, y: 0};
            const coordinates = interactionState.getTransformedCoordinates({x: 1, y: 1});
            expect(coordinates).toEqual({x: 4, y: 2});
        }
    );

    it('tests the translation of pixel coordinates to a scaled position in the draw area ',
        async function () {
            const interactionState = new InteractionState({}, {});
            interactionState.transformParams.scale = 2;
            interactionState.transformParams.translate = {x: 1, y: 0};
            const coordinates = interactionState.getRealCoordinates({x: 4, y: 2});
            expect(coordinates).toEqual({x: 1, y: 1});
        }
    );
});