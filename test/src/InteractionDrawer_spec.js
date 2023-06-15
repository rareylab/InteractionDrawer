describe('InteractionDrawer', function () {

    beforeEach(function () {
        $('<svg id="draw-area" width="100%" height="600px"></svg>').appendTo('body');
        const copyTestConfig = Helpers.deepCloneObject(interactionDrawerTestConfig);
        const copyJson = Helpers.deepCloneObject(interactionDrawerTestJson);

        interactionDrawer = new InteractionDrawer('draw-area', copyTestConfig);
        const inputJson = JSON.stringify(copyJson);
        interactionDrawer.addByJSON(inputJson);

        ringSystems = {'0': 3, '1': 0, '2': 0, '3': 0, '4': 1};
        jsonScene = copyJson.scene;
        svgComponent = interactionDrawer.svgComponent;
        structuresInJson = jsonScene.structures;
        nrOfStructuresInJson = structuresInJson.length;
        transformGroupsComponent = svgComponent.transformGroupsComponent;
    });

    afterEach(function () {
        $('#draw-area').remove();
    });

    it('tests the sceneData if scene was loaded by addByJSON', async function () {
        const sceneData = interactionDrawer.sceneData;
        const structuresInData = sceneData.structuresData.structures;
        expect(structuresInJson.length).toEqual(Object.keys(structuresInData).length);
        for (const structureInJson of structuresInJson) {
            const structureInData = structuresInData[structureInJson.id];
            expect(structureInJson.atoms.length)
                .toEqual(Object.keys(structureInData.atomsData.atoms).length);
            expect(structureInJson.bonds.length)
                .toEqual(Object.keys(structureInData.edgesData.edges).length);
            if (structureInJson.rings) {
                expect(structureInJson.rings.length)
                    .toEqual(Object.keys(structureInData.ringsData.rings).length);
            }
        }

        const intermolecularData = sceneData.intermolecularData;
        expect(jsonScene.atomPairInteractions.length)
            .toEqual(Object.keys(intermolecularData.atomPairInteractions).length);
        expect(jsonScene.cationPiStackings.length)
            .toEqual(Object.keys(intermolecularData.cationPiStackings).length);
        expect(jsonScene.piStackings.length)
            .toEqual(Object.keys(intermolecularData.piStackings).length);

        expect(jsonScene.hydrophobicContacts.length)
            .toEqual(Object.keys(sceneData.hydrophobicData.hydrophobicContacts).length);
        expect(jsonScene.annotations.length)
            .toEqual(Object.keys(sceneData.annotationsData.annotations).length);
    });


    it(
        'tests the atomGroupsComponent if groups for scene visualization were loaded by addByJSON',
        async function () {
            const atomGroupsComponent = transformGroupsComponent.atomGroupsComponent;
            expect(atomGroupsComponent.atomGroupDom._groups.length).toEqual(1);
            expect(atomGroupsComponent.atomSelGroupDom._groups.length).toEqual(1);
            expect(atomGroupsComponent.atomDbgGroupDom._groups.length).toEqual(1);
            const structuresWithAtomsInSvg = atomGroupsComponent.atomToSelMap;
            expect(Object.keys(structuresWithAtomsInSvg).length).toEqual(nrOfStructuresInJson);
            for (const structureInJson of structuresInJson) {
                const structureIdInJson = structureInJson.id;
                expect(Object.keys(structuresWithAtomsInSvg))
                    .toContain(structureIdInJson.toString());
                const structureWithAtomsInSvg = structuresWithAtomsInSvg[structureIdInJson];
                expect(Object.keys(structureWithAtomsInSvg.atomSels).length)
                    .toEqual(structureInJson.atoms.length);
                expect(Object.keys(structureWithAtomsInSvg.ringSysSels).length)
                    .toEqual(ringSystems[structureIdInJson]);
                expect(structureWithAtomsInSvg.debugSel._groups.length).toEqual(1);
                expect(structureWithAtomsInSvg.selectorSel._groups.length).toEqual(1);
                expect(structureWithAtomsInSvg.structureSel._groups.length).toEqual(1);
            }
        }
    );

    it(
        'tests the edgeGroupsComponent if groups for scene visualization were loaded by addByJSON',
        async function () {
            const edgeGroupsComponent = transformGroupsComponent.edgeGroupsComponent;
            expect(edgeGroupsComponent.defsComponent.defsDom._groups.length).toEqual(1);
            expect(edgeGroupsComponent.edgeGroupDom._groups.length).toEqual(1);
            expect(edgeGroupsComponent.edgeSelGroupDom._groups.length).toEqual(1);
            expect(edgeGroupsComponent.edgeDbgGroupDom._groups.length).toEqual(1);
            const structuresWithEdgesInSvg = edgeGroupsComponent.edgeToSelMap;
            const edgeGradientsInSvg = edgeGroupsComponent.edgeGradientMap;
            expect(Object.keys(structuresWithEdgesInSvg).length).toEqual(nrOfStructuresInJson);
            expect(Object.keys(edgeGradientsInSvg).length).toEqual(nrOfStructuresInJson);
            for (const structureInJson of structuresInJson) {
                const structureIdInJson = structureInJson.id;
                expect(Object.keys(structuresWithEdgesInSvg))
                    .toContain(structureIdInJson.toString());
                const nrOfBondsInJson = structureInJson.bonds.length;
                const edgesOfStructureInSvg = structuresWithEdgesInSvg[structureIdInJson];
                const gradientsOfStructureInSvg = edgeGradientsInSvg[structureIdInJson];
                expect(Object.keys(edgesOfStructureInSvg.edgeSels).length).toEqual(nrOfBondsInJson);
                expect(Object.keys(gradientsOfStructureInSvg).length).toEqual(nrOfBondsInJson);
                expect(Object.keys(edgesOfStructureInSvg.ringSysSels).length)
                    .toEqual(ringSystems[structureIdInJson]);
                expect(edgesOfStructureInSvg.debugSel._groups.length).toEqual(1);
                expect(edgesOfStructureInSvg.selectorSel._groups.length).toEqual(1);
                expect(edgesOfStructureInSvg.structureSel._groups.length).toEqual(1);
            }
        }
    );

    it(
        'tests the annotationGroupsComponent if groups for scene visualization were loaded by addByJSON',
        async function () {
            const annotationGroupsComponent = transformGroupsComponent.annotationGroupsComponent;
            expect(annotationGroupsComponent.annotationGroupDom._groups.length).toEqual(1);
            expect(annotationGroupsComponent.annotationSelGroupDom._groups.length).toEqual(1);
            const annotationsInSvg = annotationGroupsComponent.labelToSelMap;
            const annotationsInJson = jsonScene.annotations;
            expect(Object.keys(annotationsInSvg).length).toEqual(annotationsInJson.length);
            for (const annotationInJson of annotationsInJson) {
                const annotationIdInJson = annotationInJson.id;
                expect(Object.keys(annotationsInSvg)).toContain(annotationIdInJson.toString());
                const annotationInSvg = annotationsInSvg[annotationIdInJson];
                expect(annotationInSvg.labelSel._groups.length).toEqual(1);
                expect(annotationInSvg.mouseSels.length).toEqual(3);
                expect(annotationInSvg.selectorShapes.length).toEqual(3);
                const placementInfo = annotationInSvg.placementInfo;
                expect(placementInfo.x).toEqual(annotationInJson.coordinates.x);
                expect(placementInfo.y).toEqual(annotationInJson.coordinates.y);
                expect(annotationInSvg.structureId).toEqual(annotationInJson.belongsTo.id)
            }
        }
    );

    it(
        'tests the structureCircleGroupsComponent if groups for scene visualization were loaded by addByJSON',
        async function () {
            const structureCircleGroupsComponent = transformGroupsComponent.structureCircleGroupsComponent;
            expect(structureCircleGroupsComponent.structureCircleGroupDom._groups.length)
                .toEqual(1);
            expect(structureCircleGroupsComponent.structureCircleSelGroupDom._groups.length)
                .toEqual(1);
            const structureCirclesInSvg = structureCircleGroupsComponent.structureCircleToSelMap;
            expect(Object.keys(structureCirclesInSvg).length).toEqual(nrOfStructuresInJson);
            for (const structureCircleIdInSvg in structureCirclesInSvg) {
                const structureCircleInSvg = structureCirclesInSvg[structureCircleIdInSvg];
                expect(structureCircleInSvg.labelSel._groups.length).toEqual(1);
                expect(structureCircleInSvg.circleSel._groups.length).toEqual(1);
                expect(structureCircleInSvg.mouseSels.length).toEqual(1);
                expect(structureCircleInSvg.selectorSel._groups.length).toEqual(1);
                expect(structureCircleInSvg.selectorShapes.length).toEqual(1);
                expect(structureCircleInSvg.structureSel._groups.length).toEqual(1);
                expect(structureCircleInSvg.textSels.length).toEqual(3);
            }
        }
    );

    it(
        'tests the hydrophobicGroupsComponent if groups for scene visualization were loaded by addByJSON',
        async function () {
            const hydrophobicGroupsComponent = transformGroupsComponent.hydrophobicGroupsComponent;
            expect(hydrophobicGroupsComponent.hydrophobicGroupDom._groups.length).toEqual(1);
            expect(hydrophobicGroupsComponent.hydrophobicSelGroupDom._groups.length).toEqual(1);
            const structuresWithHydrophobicsInSvg = hydrophobicGroupsComponent.hydrophobicToSelMap;
            const hydrophobicsInJson = jsonScene.hydrophobicContacts;
            expect(Object.keys(structuresWithHydrophobicsInSvg).length).toEqual(1);
            const hydrophobicsOfStructureInSvg = structuresWithHydrophobicsInSvg['0'];
            expect(Object.keys(hydrophobicsOfStructureInSvg).length)
                .toEqual(hydrophobicsInJson.length);
            for (const hydrophobicInJson of hydrophobicsInJson) {
                const hydrophobicIdInJson = hydrophobicInJson.id;
                expect(Object.keys(hydrophobicsOfStructureInSvg))
                    .toContain(hydrophobicIdInJson.toString());
                const hydrophobicOfStructureInSvg = hydrophobicsOfStructureInSvg[hydrophobicIdInJson];
                expect(hydrophobicOfStructureInSvg.pathSel._groups.length).toEqual(1);
                expect(Object.keys(hydrophobicOfStructureInSvg.controlSels).length)
                    .toEqual(hydrophobicInJson.controlPoints.length);
            }
        }
    );

    it('tests the intermolecularGroupsComponent (cation pi) if groups for scene visualization were' +
        ' loaded by addByJSON', async function () {
        const intermolecularGroupsComponent = transformGroupsComponent.intermolecularGroupsComponent;
        expect(intermolecularGroupsComponent.cationpiGroupDom._groups.length).toEqual(1);
        expect(intermolecularGroupsComponent.cationpiSelGroupDom._groups.length).toEqual(1);
        const cationPiStackingsInSvg = intermolecularGroupsComponent.cationPiStackToSelMap;
        const cationPiStackingsInJson = jsonScene.cationPiStackings;
        expect(Object.keys(cationPiStackingsInSvg).length)
            .toEqual(cationPiStackingsInJson.length);
        for (const cationPiStackingInJson of cationPiStackingsInJson) {
            const cationPiStackingIdInJson = cationPiStackingInJson.id;
            expect(Object.keys(cationPiStackingsInSvg))
                .toContain(cationPiStackingIdInJson.toString());
            const cationPiStackingInSvg = cationPiStackingsInSvg[cationPiStackingIdInJson];
            expect(cationPiStackingInSvg.fromStructure)
                .toEqual(cationPiStackingInJson.fromStructure);
            expect(cationPiStackingInSvg.toStructure)
                .toEqual(cationPiStackingInJson.toStructure);
            expect(cationPiStackingInSvg.circleSel._groups.length).toEqual(1);
            expect(cationPiStackingInSvg.lineSels.length).toEqual(1);
            expect(cationPiStackingInSvg.mouseSel._groups.length).toEqual(1);
        }
    });

    it(
        'tests the intermolecularGroupsComponent (atom pair interaction) if groups for scene visualization were' +
        ' loaded by addByJSON',
        async function () {
            const intermolecularGroupsComponent = transformGroupsComponent.intermolecularGroupsComponent;
            expect(intermolecularGroupsComponent.atomPairInteractionGroupDom._groups.length)
                .toEqual(1);
            expect(intermolecularGroupsComponent.atomPairInteractionSelGroupDom._groups.length)
                .toEqual(1);
            const atomPairInteractionsInSvg = intermolecularGroupsComponent.atomPairInteractionToSelMap;
            const atomPairInteractionsInJson = jsonScene.atomPairInteractions;
            expect(Object.keys(atomPairInteractionsInSvg).length)
                .toEqual(atomPairInteractionsInJson.length);
            for (const atomPairInteractionInJson of atomPairInteractionsInJson) {
                const atomPairInteractionIdInJson = atomPairInteractionInJson.id;
                expect(Object.keys(atomPairInteractionsInSvg))
                    .toContain(atomPairInteractionIdInJson.toString());
                const atomPairInteractionInSvg = atomPairInteractionsInSvg[atomPairInteractionIdInJson];
                expect(atomPairInteractionInSvg.fromStructure)
                    .toEqual(atomPairInteractionInJson.fromStructure);
                expect(atomPairInteractionInSvg.toStructure)
                    .toEqual(atomPairInteractionInJson.toStructure);
                expect(atomPairInteractionInSvg.lineSels.length).toEqual(1);
                expect(atomPairInteractionInSvg.mouseSel._groups.length).toEqual(1);
            }
        }
    );

    it(
        'tests the intermolecularGroupsComponent (pi stacking) if groups for scene visualization were' +
        ' loaded by addByJSON',
        async function () {
            const intermolecularGroupsComponent = transformGroupsComponent.intermolecularGroupsComponent;
            expect(intermolecularGroupsComponent.pipiGroupDom._groups.length).toEqual(1);
            expect(intermolecularGroupsComponent.pipiSelGroupDom._groups.length).toEqual(1);
            const piStackingsInSvg = intermolecularGroupsComponent.piStackToSelMap;
            const piStackingsInJson = jsonScene.piStackings;
            expect(Object.keys(piStackingsInSvg).length).toEqual(piStackingsInJson.length);
            for (const piStackingInJson of piStackingsInJson) {
                const piStackingIdInJson = piStackingInJson.id;
                expect(Object.keys(piStackingsInSvg))
                    .toContain(piStackingIdInJson.toString());
                const piStackingInSvg = piStackingsInSvg[piStackingIdInJson];
                expect(piStackingInSvg.fromStructure).toEqual(piStackingInJson.fromStructure);
                expect(piStackingInSvg.toStructure).toEqual(piStackingInJson.toStructure);
                expect(piStackingInSvg.fromSel._groups.length).toEqual(1);
                expect(piStackingInSvg.toSel._groups.length).toEqual(1);
                expect(piStackingInSvg.lineSels.length).toEqual(1);
                expect(piStackingInSvg.mouseSel._groups.length).toEqual(1);
            }
        }
    );


    it(
        'tests the setting of new valid mouse interactions the overwriting old ones',
        async function () {
            const newInteractions = {
                'movement': [{'key': 2, 'modifiers': []}], 'notValid': [{'key': 0, 'modifiers': []}]
            };
            interactionDrawer.addMouseInteractions(newInteractions, true);
            const mouseInteractions = interactionDrawer.opts.buttons.mouse;
            expect(Object.keys(mouseInteractions).length).toEqual(1);
            expect('movement' in mouseInteractions).toEqual(true);
        }
    );

    it('tests the adding of new mouse interactions to existing ones', async function () {
        const oldMouseInteractions = {
            'rectSelect': [{'key': 1, 'modifiers': ['shift']}],
            'rotation': [{'key': 2, 'modifiers': []}],
            'freeSelect': [{'key': 7, 'modifiers': ['abc']}]
        };
        interactionDrawer.optsPreprocessor.opts.buttons.mouse = oldMouseInteractions;
        const newMouseInteractions = {
            'movement': [{'key': 50, 'modifiers': ['test']}],//new mode
            'rotation': [{'key': 100, 'modifiers': ['test']}],//secondary controls for rotation mode
            'rectSelect': [{'key': 1, 'modifiers': ['shift']}],//mode is already set like that
            'notValid': [{'key': 123, 'modifiers': ['test']}],//not a valid mode
            'lineMirror': [{'key': 13, 'modifiers': ['shift']}],
            'addStructure': [{'key': 13, 'modifiers': ['shift']}],
            'remove': [{'key': 7, 'modifiers': ['abc']}]
            //key+modifier combination already set in new or old interactions
            //(for lineMirror mode or freeSelect)
            //first mode is removed as consequence and second mode added
        };
        interactionDrawer.addMouseInteractions(newMouseInteractions);
        const mouseInteractions = interactionDrawer.optsPreprocessor.opts.buttons.mouse;
        expect(Object.keys(mouseInteractions).length).toEqual(7);
        expect(mouseInteractions.movement.length).toEqual(1);
        expect(mouseInteractions.movement[0]).toEqual(newMouseInteractions.movement[0]);
        expect(mouseInteractions.rotation.length).toEqual(2);
        expect(mouseInteractions.rotation[0]).toEqual(oldMouseInteractions.rotation[0]);
        expect(mouseInteractions.rotation[1]).toEqual(newMouseInteractions.rotation[0]);
        expect(mouseInteractions.rectSelect.length).toEqual(1);
        expect(mouseInteractions.rectSelect[0]).toEqual(oldMouseInteractions.rectSelect[0]);
        expect('notValid' in mouseInteractions).toEqual(false);
        expect(mouseInteractions.lineMirror.length).toEqual(0);
        expect(mouseInteractions.addStructure.length).toEqual(1);
        expect(mouseInteractions.remove.length).toEqual(1);
        expect(mouseInteractions.freeSelect.length).toEqual(0);
    });
});

