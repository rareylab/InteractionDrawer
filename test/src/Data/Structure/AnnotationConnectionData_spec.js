describe('InteractionDrawer Data AnnotationConnectionData', function () {

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
        'tests the creation of the connection data object of a Structure object',
        async function () {
            const annotationConnectionData = structure.annotationConnectionData;
            expect(annotationConnectionData.annotations).toEqual(new Set([1, 2, 3, 4, 5]));
            expect(annotationConnectionData.atomAnnotationConnections).toEqual({
                '10002': new Set([3, 4]),
                '10015': new Set([3, 4]),
                '10016': new Set([5]),
                '10017': new Set([3, 4]),
                '10019': new Set([3, 4]),
                '10021': new Set([1, 2]),
                '10022': new Set([1, 2]),
                '10023': new Set([1, 2]),
                '10024': new Set([1, 2]),
                '10025': new Set([1, 2]),
                '10026': new Set([1, 2]),
                '10027': new Set([1, 2])
            });
        }
    );

    it('tests the retrieval of annotations linked to given atom ids', async function () {
        const annotationConnectionData = structure.annotationConnectionData;
        const annotations = annotationConnectionData.getAnnotationsForAtoms([10002, 10021]);
        expect(annotations).toEqual(new Set([3, 4, 1, 2]));
    });

    it('tests the adding of an annotation to a structure', async function () {
        const annotationConnectionData = structure.annotationConnectionData;
        annotationConnectionData.addAnnotation(10);
        expect(annotationConnectionData.annotations.has(10)).toEqual(true);
    });

    it('tests the linking of an already linked atom to an annotation', async function () {
        const annotationConnectionData = structure.annotationConnectionData;
        annotationConnectionData.linkAtomToAnnotation(10002, 5);
        expect(annotationConnectionData.atomAnnotationConnections['10002']).toEqual(new Set([
            3, 4, 5
        ]));
    });

    it('tests the linking of an unlinked atom to an annotation', async function () {
        const annotationConnectionData = structure.annotationConnectionData;
        annotationConnectionData.linkAtomToAnnotation(10000, 5);
        expect(annotationConnectionData.atomAnnotationConnections['10000']).toEqual(new Set([5]));
    });
});