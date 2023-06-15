describe('InteractionDrawer Data RepresentationsData', function () {

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
        'tests the creation of the RepresentationsData object of a Structure object',
        async function () {
            const representationsData = structure.representationsData;
            expect(representationsData.structureType).toEqual('ligand');
            expect(representationsData.currentRepresentation)
                .toEqual(StructureRepresentation.default);
            expect(representationsData.representations.has(StructureRepresentation.default))
                .toEqual(true);
        }
    );

    it('tests if a structure has the default representation', async function () {
        const representationsData = structure.representationsData;
        expect(representationsData.hasRepresentation(StructureRepresentation.circle))
            .toEqual(true);
        expect(representationsData.hasRepresentation(StructureRepresentation.default))
            .toEqual(true);
    });

    it('tests the adding of a new representation', async function () {
        const representationsData = structure.representationsData;
        representationsData.addAlternativeRepresentations({ligand: [StructureRepresentation.circle]});
        expect(representationsData.hasRepresentation(StructureRepresentation.circle)).toEqual(true);
        expect(representationsData.hasRepresentation(StructureRepresentation.default))
            .toEqual(true);
        expect(representationsData.structureCircle).toEqual({});
        expect(representationsData.selectedStructureCircle).toEqual(false);
        expect(representationsData.tempSelectedStructureCircle).toEqual(false);
    });

    it('tests the changing of the structure representation', async function () {
        const representationsData = structure.representationsData;
        representationsData.addAlternativeRepresentations({ligand: [StructureRepresentation.circle]});
        expect(representationsData.isCurRepresentation(StructureRepresentation.circle)).toEqual(
            false);
        expect(representationsData.isCurRepresentation(StructureRepresentation.default)).toEqual(
            true);
        representationsData.changeInternalRepresentation(StructureRepresentation.circle);
        expect(representationsData.isCurRepresentation(StructureRepresentation.circle))
            .toEqual(true);
        expect(representationsData.isCurRepresentation(StructureRepresentation.default)).toEqual(
            false);
        expect(representationsData.curRepresentation()).toEqual(StructureRepresentation.circle);
    });

    it(
        'tests the setting of the selection status of the structure circle representation',
        async function () {
            const representationsData = structure.representationsData;
            representationsData.addAlternativeRepresentations({ligand: [StructureRepresentation.circle]});
            expect(representationsData.selectedStructureCircle).toEqual(false);
            representationsData.selectStructureCircle();
            expect(representationsData.selectedStructureCircle).toEqual(true);
        }
    );

    it(
        'tests the setting of the temporary selection status of the structure circle representation',
        async function () {
            const representationsData = structure.representationsData;
            representationsData.addAlternativeRepresentations({ligand: [StructureRepresentation.circle]});
            expect(representationsData.tempSelectedStructureCircle).toEqual(false);
            representationsData.tempSelectStructureCircle();
            expect(representationsData.tempSelectedStructureCircle).toEqual(true);
        }
    );
});