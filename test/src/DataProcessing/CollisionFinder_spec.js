describe('InteractionDrawer DataProcessing CollisionFinder', function () {

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

    it('tests annotation collision with no point or polygon given', async function () {
        checkAnnotationCollision(null, []);
    });

    it('tests annotation collision for a given point (hit)', async function () {
        const annotation = interactionDrawerTestJson.scene.annotations[0];
        const expected = {
            type: 'annotation', id: annotation.id, additionalInformation: {}, structureLink: 1
        };
        checkAnnotationCollision(expected, [annotation.coordinates]);
    });

    it('tests annotation collision for a given point (no hit because disabled)',
        async function () {
            const annotation = interactionDrawerTestJson.scene.annotations[0];
            checkAnnotationCollision(null, [annotation.coordinates], false, false);
        }
    );

    it('tests annotation collision for a given point (no hit because hidden)', async function () {
        const annotation = interactionDrawerTestJson.scene.annotations[0];
        checkAnnotationCollision(null, [annotation.coordinates], true, true);
    });

    it('tests annotation collision for a given polygon (hit)', async function () {
        const annotation = interactionDrawerTestJson.scene.annotations[0];
        const expected = {
            type: 'annotation', id: annotation.id, additionalInformation: {}, structureLink: 1
        };
        checkAnnotationCollision(expected, getPolygonAroundPoint(annotation.coordinates));
    });

    it('tests annotation collision for a given point (no hit)', async function () {
        checkAnnotationCollision(null, [{x: 0, y: 0}]);
    });

    it('tests annotation collision for a given polygon (no hit)', async function () {
        checkAnnotationCollision(null, getPolygonAroundPoint({x: 0, y: 0}));
    });

    function checkAnnotationCollision(expected, coordinates, hidden = false, enabled = true) {
        const collisionFinder = interactionDrawer.userInteractionHandler.hoverHandler.collisionFinder;
        const annotationInData = collisionFinder.sceneData.annotationsData.annotations[0];
        annotationInData.enabled = enabled;
        annotationInData.hidden = hidden;
        const hit = collisionFinder.findLastCollisionAnnotation(coordinates);
        expect(hit).toEqual(expected);
    }

    it('tests spline control points collision with no point or polygon given', async function () {
        checkSplineControlPointCollision(null, []);
    });

    it('tests spline control points collision for a given point (hit)', async function () {
        const hydrophobicContact = interactionDrawerTestJson.scene.hydrophobicContacts[0];
        const controlPoint = hydrophobicContact.controlPoints[0];
        const expected = {
            type: 'splineControlPoint',
            structureId: hydrophobicContact.belongsTo,
            hydrophobicId: hydrophobicContact.id,
            controlPointId: 0
        }
        checkSplineControlPointCollision(expected, [{x: controlPoint.x, y: controlPoint.y}]);
    });

    it('tests spline control points collision for a given point (no hit because disabled)',
        async function () {
            const hydrophobicContact = interactionDrawerTestJson.scene.hydrophobicContacts[0];
            const controlPoint = hydrophobicContact.controlPoints[0];
            checkSplineControlPointCollision(null, [
                {
                    x: controlPoint.x - 0.5, y: controlPoint.y - 0.5
                }
            ], false, false);
        }
    );

    it('tests spline control points collision for a given point (no hit because hidden)',
        async function () {
            const hydrophobicContact = interactionDrawerTestJson.scene.hydrophobicContacts[0];
            const controlPoint = hydrophobicContact.controlPoints[0];
            checkSplineControlPointCollision(null, [
                {
                    x: controlPoint.x - 0.5, y: controlPoint.y - 0.5
                }
            ], true, true);
        }
    );

    it('tests spline control points collision for a given polygon (hit)', async function () {
        const hydrophobicContact = interactionDrawerTestJson.scene.hydrophobicContacts[0];
        const controlPoint = hydrophobicContact.controlPoints[0];
        const expected = {
            type: 'splineControlPoint',
            structureId: hydrophobicContact.belongsTo,
            hydrophobicId: hydrophobicContact.id,
            controlPointId: 0
        }
        checkSplineControlPointCollision(expected, getPolygonAroundPoint(controlPoint));
    });

    it('tests spline control points collision with no point or polygon given', async function () {
        checkSplineControlPointCollision(null, [{x: 0, y: 0}]);
    });

    it('tests spline control points collision for a given polygon (no hit)', async function () {
        checkSplineControlPointCollision(null, getPolygonAroundPoint({x: 0, y: 0}));
    });

    function checkSplineControlPointCollision(expected,
        coordinates,
        hidden = false,
        enabled = true
    ) {
        const collisionFinder = interactionDrawer.userInteractionHandler.hoverHandler.collisionFinder;
        const hydrophobicContactInData = collisionFinder.sceneData.hydrophobicData.hydrophobicContacts[0];
        hydrophobicContactInData.enabled = enabled;
        hydrophobicContactInData.hidden = hidden;
        const hit = collisionFinder.findFirstCollisionSplines(coordinates);
        expect(hit).toEqual(expected);
    }

    it('tests spline path collision with no point or polygon given', async function () {
        checkSplinePathCollision(null, []);
    });

    it('tests spline path collision for a given point (hit)', async function () {
        const hydrophobicContact = interactionDrawerTestJson.scene.hydrophobicContacts[0];
        const controlPoint = hydrophobicContact.controlPoints[0];
        const expected = {
            type: 'splinePath',
            structureId: hydrophobicContact.belongsTo,
            hydrophobicId: '0',
            controlPointIds: ['0', '1', '2', '3', '4', '5', '6']
        }
        //the path between control points is curved
        checkSplinePathCollision(expected, {x: controlPoint.x - 0.5, y: controlPoint.y - 0.5});
    });

    it('tests spline path collision for a given point (no hit because disabled)',
        async function () {
            const hydrophobicContact = interactionDrawerTestJson.scene.hydrophobicContacts[0];
            const controlPoint = hydrophobicContact.controlPoints[0];
            checkSplinePathCollision(null, {x: controlPoint.x, y: controlPoint.y}, false, false);
        }
    );

    it('tests spline path collision for a given point (no hit because hidden)', async function () {
        const hydrophobicContact = interactionDrawerTestJson.scene.hydrophobicContacts[0];
        const controlPoint = hydrophobicContact.controlPoints[0];
        checkSplinePathCollision(null, {x: controlPoint.x, y: controlPoint.y}, true, true);
    });

    it('tests spline path collision for a given point (no hit)', async function () {
        checkSplinePathCollision(null, {x: 0, y: 0});
    });

    function checkSplinePathCollision(expected, coordinates, hidden = false, enabled = true) {
        const collisionFinder = interactionDrawer.userInteractionHandler.hoverHandler.collisionFinder;
        const hydrophobicContactInData = collisionFinder.sceneData.hydrophobicData.hydrophobicContacts[0];
        hydrophobicContactInData.enabled = enabled;
        hydrophobicContactInData.hidden = hidden;
        const hit = collisionFinder.findFirstCollisionSplinePath(coordinates);
        expect(hit).toEqual(expected);
    }

    it('tests structure collision with no point or polygon given', async function () {
        checkStructureCollision(null, []);
    });

    it('tests structure collision for a given point (no hit because structure disabled)',
        async function () {
            const structure = interactionDrawerTestJson.scene.structures[0];
            const atom = structure.atoms[0];
            checkStructureCollision(null, [atom.coordinates], false, false);
        }
    );

    it('tests structure collision for a given point (no hit because structure hidden)',
        async function () {
            const structure = interactionDrawerTestJson.scene.structures[0];
            const atom = structure.atoms[0];
            checkStructureCollision(null, [atom.coordinates], true, true);
        }
    );

    it('tests structure collision for a given point (atom hit)', async function () {
        const structure = interactionDrawerTestJson.scene.structures[0];
        const atom = structure.atoms[0];
        const expected = {
            structureType: 'ligand',
            structureId: structure.id,
            structureName: '4SP_A_1298',
            type: 'atom',
            id: atom.id,
            additionalInformation: {}
        };
        checkStructureCollision(expected, [atom.coordinates]);
    });

    it('tests structure collision for a given point (edge hit)', async function () {
        const structure = interactionDrawerTestJson.scene.structures[0];
        const atoms = structure.atoms;
        const atom1 = atoms[0];
        const atom2 = atoms[1];
        const expected = {
            structureId: structure.id, from: atom1.id, to: atom2.id, id: 2000000, type: 'edge'
        };
        checkStructureCollision(expected,
            [PointCalculation.findEdgeMidpoint(atom1.coordinates, atom2.coordinates)]
        );
    });

    it('tests structure collision for a given polygon (atom hit)', async function () {
        const structure = interactionDrawerTestJson.scene.structures[0];
        const atom = structure.atoms[0];
        const expected = {
            structureType: 'ligand',
            structureId: structure.id,
            structureName: '4SP_A_1298',
            type: 'atom',
            id: atom.id,
            additionalInformation: {}
        };
        checkStructureCollision(expected, getPolygonAroundPoint(atom.coordinates));
    });

    it('tests structure collision for a given point (no hit)', async function () {
        checkStructureCollision(null, [{x: 0, y: 0}]);
    });

    it('tests structure collision for a given polygon (no hit)', async function () {
        checkStructureCollision(null, getPolygonAroundPoint({x: 0, y: 0}));
    });

    it('tests structure circle collision for a given point (hit)', async function () {
        const structureInJson = interactionDrawerTestJson.scene.structures[0];
        const expected = {
            structureId: structureInJson.id, type: 'structureCircle', id: structureInJson.id
        };
        checkStructureCollision(expected, [], false, true, true);
    });

    it('tests structure circle collision for a given point (no hit because disabled)',
        async function () {
            checkStructureCollision(null, [], false, false, true);
        }
    );

    it('tests structure circle collision for a given point (no hit because hidden)',
        async function () {
            checkStructureCollision(null, [], true, true, true);
        }
    );

    function checkStructureCollision(expected,
        coordinates,
        hidden = false,
        enabled = true,
        structureCircle = false
    ) {
        const collisionFinder = interactionDrawer.userInteractionHandler.hoverHandler.collisionFinder;
        const structureInData = collisionFinder.sceneData.structuresData.structures[0];
        if (structureCircle) {
            structureInData.representationsData.currentRepresentation =
                StructureRepresentation.circle;
            coordinates = [structureInData.representationsData.structureCircle.coordinates];
        }
        structureInData.hidden = hidden;
        structureInData.enabled = enabled;
        const hit = collisionFinder.findFirstStructureCollision(coordinates);
        expect(hit).toEqual(expected);
    }

    it('tests intermolecular edge collision with no point or polygon given', async function () {
        const collisionFinder = interactionDrawer.userInteractionHandler.hoverHandler.collisionFinder;
        const hit = collisionFinder.findLastIntermolecularCollision([]);
        expect(hit).toEqual(null);
    });

    it('tests atom pair interaction collision for a given point (hit)', async function () {
        checkIntermolecularCollsion('atomPairInteractions',
            {x: 20.30, y: -58.05},
            {x: -8.65, y: -70.05},
            true
        );
    });

    it('tests atom pair interaction collision for a given point (no hit because disabled)',
        async function () {
            checkIntermolecularCollsion('atomPairInteractions',
                {x: 20.30, y: -58.05},
                {x: -8.65, y: -70.05},
                false,
                false,
                false
            );
        }
    );

    it('tests atom pair interaction collision for a given point (no hit because hidden)',
        async function () {
            checkIntermolecularCollsion('atomPairInteractions',
                {x: 20.30, y: -58.05},
                {x: -8.65, y: -70.05},
                false,
                true,
                true
            );
        }
    );

    it('tests pi stacking stacking collision for a given point (hit)', async function () {
        checkIntermolecularCollsion('piStackings',
            {x: 7.30, y: 24.44},
            {x: -53.38, y: 88.22},
            true
        );
    });

    it('tests pi stacking stacking collision for a given point (no hit because disabled)',
        async function () {
            checkIntermolecularCollsion('piStackings',
                {x: 7.30, y: 24.44},
                {x: -53.38, y: 88.22},
                false,
                false,
                false
            );
        }
    );

    it('tests pi stacking stacking collision for a given point (no hit because hidden)',
        async function () {
            checkIntermolecularCollsion('piStackings',
                {x: 7.30, y: 24.44},
                {x: -53.38, y: 88.22},
                false,
                true,
                true
            );
        }
    );

    it('tests cation pi stacking collision for a given point (hit)', async function () {
        checkIntermolecularCollsion('cationPiStackings',
            {x: 33.29, y: -20.55},
            {x: -8.65, y: -70.05},
            true
        );
    });

    it('tests cation pi stacking collision for a given point (no hit because disabled)',
        async function () {
            checkIntermolecularCollsion('cationPiStackings',
                {x: 33.29, y: -20.55},
                {x: -8.65, y: -70.05},
                false,
                false,
                false
            );
        }
    );

    it('tests cation pi stacking collision for a given point (no hit because hidden)',
        async function () {
            checkIntermolecularCollsion('cationPiStackings',
                {x: 33.29, y: -20.55},
                {x: -8.65, y: -70.05},
                false,
                true,
                true
            );
        }
    );

    function checkIntermolecularCollsion(type,
        from,
        to,
        collision,
        hidden = false,
        enabled = true
    ) {
        const collisionFinder = interactionDrawer.userInteractionHandler.hoverHandler.collisionFinder;
        const intermolecularInData = collisionFinder.sceneData.intermolecularData[type][0];
        intermolecularInData.enabled = enabled;
        intermolecularInData.hidden = hidden;
        const hit = collisionFinder.findLastIntermolecularCollision([
            PointCalculation.findEdgeMidpoint(from, to)
        ]);
        if (collision) {
            expect(hit).toEqual({
                type: type, id: 0, additionalInformation: {}
            });
        } else {
            expect(hit).toEqual(null);
        }
    }

    it('tests the general collision for a given point (no hit)', async function () {
        const collisionFinder = interactionDrawer.userInteractionHandler.hoverHandler.collisionFinder;
        const hit = collisionFinder.findCollisions([{x: 100, y: 100}]);
        expect(hit).toEqual({hitAtoms: {}, hitEdges: {}, hitStructureCircles: []});
    });

    it('tests the general collision for a given polygon (no hit)', async function () {
        const collisionFinder = interactionDrawer.userInteractionHandler.hoverHandler.collisionFinder;
        const hit = collisionFinder.findCollisions(getPolygonAroundPoint({x: 100, y: 100}, 25));
        expect(hit).toEqual({hitAtoms: {}, hitEdges: {}, hitStructureCircles: []});
    });

    it('tests the general edge collision with no point or polygon given', async function () {
        const collisionFinder = interactionDrawer.userInteractionHandler.hoverHandler.collisionFinder;
        const hit = collisionFinder.findCollisions([]);
        expect(hit).toEqual({hitAtoms: {}, hitEdges: {}, hitStructureCircles: []});
    });

    it('tests the general collision for a given point (structure circle hit)', async function () {
        const collisionFinder = interactionDrawer.userInteractionHandler.hoverHandler.collisionFinder;
        const hit = collisionFinder.findCollisions([{x: 0, y: 0}]);
        expect(hit).toEqual({hitAtoms: {}, hitEdges: {}, hitStructureCircles: ['0']});
    });

    it('tests the general collision for a given point (atom hit)', async function () {
        const collisionFinder = interactionDrawer.userInteractionHandler.hoverHandler.collisionFinder;
        const structure = interactionDrawerTestJson.scene.structures[0];
        const atom = structure.atoms[0];
        const hit = collisionFinder.findCollisions([atom.coordinates]);
        expect(hit).toEqual({hitAtoms: {'0': [atom.id]}, hitEdges: {}, hitStructureCircles: []});
    });

    it('tests the general collision for a given point (edge hit)', async function () {
        const collisionFinder = interactionDrawer.userInteractionHandler.hoverHandler.collisionFinder;
        const structure = interactionDrawerTestJson.scene.structures[0];
        const atoms = structure.atoms;
        const atom1 = atoms[0];
        const atom2 = atoms[1];
        const hit = collisionFinder.findCollisions([
            PointCalculation.findEdgeMidpoint(atom1.coordinates, atom2.coordinates)
        ]);
        expect(hit).toEqual({hitAtoms: {}, hitEdges: {'0': [2000000]}, hitStructureCircles: []});
    });

    it(
        'tests the general collision for a given polygon (atoms, edges, structure circle hit)',
        async function () {
            const collisionFinder = interactionDrawer.userInteractionHandler.hoverHandler.collisionFinder;
            const hit = collisionFinder.findCollisions(getPolygonAroundPoint({x: 0, y: 0}, 25));
            expect(hit).toEqual({
                hitAtoms: {'0': [10003, 10011]},
                hitEdges: {'0': [2000004, 2000007, 2000020]},
                hitStructureCircles: ['0']
            });
        }
    );

    it('tests the general collision for a given polygon (hit but hidden edges)', async function () {
        const collisionFinder = interactionDrawer.userInteractionHandler.hoverHandler.collisionFinder;
        const structureInData = collisionFinder.sceneData.structuresData.structures[0];
        const edge = structureInData.edgesData.getEdge(2000020);
        edge.hidden = true;
        const hit = collisionFinder.findCollisions(getPolygonAroundPoint({x: 0, y: 0}, 25));
        expect(hit).toEqual({
            hitAtoms: {'0': [10003, 10011]},
            hitEdges: {'0': [2000004, 2000007]},
            hitStructureCircles: ['0']
        });
    });

    function getPolygonAroundPoint(point, size = 1) {
        return [
            {x: point.x + size, y: point.y},
            {x: point.x - size, y: point.y},
            {x: point.x, y: point.y + size},
            {x: point.x, y: point.y - size}
        ]
    }
});