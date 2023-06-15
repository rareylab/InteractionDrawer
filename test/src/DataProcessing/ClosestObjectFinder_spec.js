describe('InteractionDrawer DataProcessing ClosestObjectFinder', function () {

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

    it('tests the determination of closest structure to a given point', async function () {
        checkClosestStructure({x: 4.436, y: -1.85, id: 0}, undefined, false, {x: 0, y: 0});
    });

    it(
        'tests the determination of closest structure to a given point (closest structure is disabled)',
        async function () {
            checkClosestStructure({x: -6.470, y: -98.071, id: 1},
                undefined,
                false,
                {x: 0, y: 0},
                false,
                false
            );
        }
    );

    it(
        'tests the determination of closest structure to a given point (closest structure is hidden)',
        async function () {
            checkClosestStructure({x: -6.470, y: -98.071, id: 1},
                undefined,
                false,
                {x: 0, y: 0},
                true,
                true
            );
        }
    );

    it('tests the determination of closest structure to a given point limited by id',
        async function () {
            checkClosestStructure({x: -6.470, y: -98.071, id: 1}, [1], false, {x: 0, y: 0});
        }
    );

    it('tests the determination of closest structure circle to a given point', async function () {
        checkClosestStructure({x: -16.788, y: 7.009, id: 0}, undefined, true, {x: 0, y: 0});
    });

    it('tests the determination of closest structure circle to a given point limited by id',
        async function () {
            checkClosestStructure({x: -5.351, y: -81.107, id: 1}, [1], true, {x: 0, y: 0});
        }
    );

    it('tests the determination of closest structure circle to a given point (closest structure is' +
        ' disabled)', async function () {
        checkClosestStructure({x: -5.351, y: -81.107, id: 1},
            undefined,
            true,
            {x: 0, y: 0},
            false,
            false
        );
    });

    it('tests the determination of closest structure circle to a given point (closest structure is' +
        ' hidden)', async function () {
        checkClosestStructure({x: -5.351, y: -81.107, id: 1},
            undefined,
            true,
            {x: 0, y: 0},
            true,
            true
        );
    });

    function checkClosestStructure(expected,
        ids,
        structureCircle,
        coordinates,
        enabled = true,
        hidden = false
    ) {
        const closestObjectFinder = interactionDrawer.userInteractionHandler.addHandler.closestObjectFinder;
        const structures = closestObjectFinder.sceneData.structuresData.structures;
        const expectedStructureInData = structures[expected.id];
        const structureInData = structures[0];
        if (structureCircle) {
            expectedStructureInData.representationsData.currentRepresentation =
                StructureRepresentation.circle;
            structureInData.representationsData.currentRepresentation =
                StructureRepresentation.circle;
        }
        //structure 0 should be found near {x: 0, y: 0} first without changing its hidden or
        //enabled state
        structureInData.enabled = enabled;
        structureInData.hidden = hidden;
        const hit = closestObjectFinder.getClosestEnabledStructure(coordinates,
            ids,
            structureCircle
        );
        expect(hit.structure).toEqual(expectedStructureInData);
        expect(hit.closestCoords.x).toBeCloseTo(expected.x);
        expect(hit.closestCoords.y).toBeCloseTo(expected.y);
    }

    it('tests the determination of closest atom to a given point', async function () {
        checkClosestAtom({structureId: 0, atomId: 10004}, undefined, 2, {x: 0, y: 0});
    });

    it(
        'tests the determination of closest atom to a given point (closest structure is disabled)',
        async function () {
            checkClosestAtom({structureId: 1, atomId: 10040},
                undefined,
                2,
                {x: 0, y: 0},
                false,
                false
            );
        }
    );

    it(
        'tests the determination of closest atom to a given point (closest structure is hidden)',
        async function () {
            checkClosestAtom({structureId: 1, atomId: 10040},
                undefined,
                2,
                {x: 0, y: 0},
                true,
                true
            );
        }
    );

    it('tests the determination of closest atom to a given point limited by id', async function () {
        checkClosestAtom({structureId: 1, atomId: 10040}, [1], 2, {x: 0, y: 0});
    });

    it('tests the determination of closest atom to a given point (structureCircle = 1)',
        async function () {
            //if a structure is represented as structure circle and this is set to
            //1, then the mid of the circle will be taken as atom coords of that
            //structure
            checkClosestAtom({structureId: 0, atomId: 10004}, undefined, 1, {x: 0, y: 0});
        }
    );

    it(
        'tests the determination of closest atom to a given point limited by id (structureCircle = 1)',
        async function () {
            //if a structure is represented as structure circle and this is set to
            //1, then the mid of the circle will be taken as atom coords of that
            //structure
            checkClosestAtom({structureId: 1, atomId: 10040}, [1, 2, 3, 4], 1, {x: 0, y: 0});
        }
    );

    it('tests the determination of closest atom to a given point (structureCircle = 3)',
        async function () {
            //if this is set to 3 atoms of structures which are currently
            //represented as circles will not be included in the search
            checkClosestAtom({structureId: 1, atomId: 10040}, undefined, 3, {x: 0, y: 0});
        }
    );

    it(
        'tests the determination of closest atom to a given point limited by id (structureCircle = 3)',
        async function () {
            checkClosestAtom({structureId: 2, atomId: 10046}, [2, 3, 4], 3, {x: 0, y: 0});
        }
    );

    function checkClosestAtom(expected,
        ids,
        structureCircle,
        coordinates,
        enabled = true,
        hidden = false
    ) {
        const closestObjectFinder = interactionDrawer.userInteractionHandler.addHandler.closestObjectFinder;
        const structures = closestObjectFinder.sceneData.structuresData.structures;
        const expectedStructureInData = structures[expected.structureId];
        const structureInData = structures[0];
        const atom = expectedStructureInData.atomsData.getAtom(expected.atomId)
        if (structureCircle === 1 || structureCircle === 3) {
            structureInData.representationsData.currentRepresentation =
                StructureRepresentation.circle;
        }
        structureInData.enabled = enabled;
        structureInData.hidden = hidden;
        const hit = closestObjectFinder.getClosestEnabledAtom(coordinates, ids, structureCircle);
        expect(hit).toEqual(atom);
    }

    it('tests the determination of closest ring to a given point', async function () {
        checkClosestRing({structureId: 0, ringId: 4000002}, undefined, false, {x: 0, y: 0});
    });

    it(
        'tests the determination of closest ring to a given point (closest structure is disabled)',
        async function () {
            checkClosestRing({structureId: 4, ringId: 4000004},
                undefined,
                false,
                {x: 0, y: 0},
                false,
                false
            );
        }
    );

    it(
        'tests the determination of closest ring to a given point (closest structure is hidden)',
        async function () {
            checkClosestRing({structureId: 4, ringId: 4000004},
                undefined,
                false,
                {x: 0, y: 0},
                true,
                true
            );
        }
    );

    it('tests the determination of closest ring to a given point limited by id', async function () {
        checkClosestRing({structureId: 4, ringId: 4000004}, [1, 2, 3, 4], false, {x: 0, y: 0});
    });

    it('tests the determination of closest ring to a given point (structureCircle = true)',
        async function () {
            checkClosestRing({structureId: 0, ringId: 4000002}, undefined, true, {x: 0, y: 0});
        }
    );

    it('tests the determination of closest ring to a given point limited by id (structureCircle =' +
        ' true)', async function () {
        checkClosestRing({structureId: 4, ringId: 4000004}, [1, 2, 3, 4], true, {x: 0, y: 0});
    });

    function checkClosestRing(expected,
        ids,
        structureCircle,
        coordinates,
        enabled = true,
        hidden = false
    ) {
        const closestObjectFinder = interactionDrawer.userInteractionHandler.addHandler.closestObjectFinder;
        const structures = closestObjectFinder.sceneData.structuresData.structures;
        const expectedStructureInData = structures[expected.structureId];
        const structureInData = structures[0];
        const ring = expectedStructureInData.ringsData.getRing(expected.ringId)
        if (structureCircle) {
            expectedStructureInData.representationsData.currentRepresentation =
                StructureRepresentation.circle;
            structureInData.representationsData.currentRepresentation =
                StructureRepresentation.circle;
        }
        structureInData.enabled = enabled;
        structureInData.hidden = hidden;
        const hit = closestObjectFinder.getClosestEnabledRing(coordinates, ids, structureCircle);
        expect(hit).toEqual(ring);
    }

    it('tests the determination of closest spline control point to a given point',
        async function () {
            checkClosestSplineControlPoint({hydrophobicContactId: '0', controlPointId: 2},
                undefined,
                false,
                {x: -78, y: 17}
            );
        }
    );

    it(
        'tests the determination of closest spline control point to a given point limited by id',
        async function () {
            const closestObjectFinder = interactionDrawer.userInteractionHandler.addHandler.closestObjectFinder;
            const hit = closestObjectFinder.getClosestEnabledSplineControlPoint({x: -78, y: 17},
                false,
                [1]
            );
            expect(hit).toEqual(undefined);
        }
    );

    it(
        'tests the determination of closest spline control point to a given point (endpoints only)',
        async function () {
            checkClosestSplineControlPoint({hydrophobicContactId: '0', controlPointId: 0},
                undefined,
                true,
                {x: -78, y: 17}
            );
        }
    );

    it('tests the determination of closest spline control point to a given point (closest' +
        ' hydrophobic contact is disabled)', async function () {
        checkClosestSplineControlPoint({hydrophobicContactId: '1', controlPointId: 2},
            undefined,
            false,
            {x: -78, y: 17},
            false,
            false
        );
    });

    it('tests the determination of closest spline control point to a given point (closest' +
        ' hydrophobic contact is hidden)', async function () {
        checkClosestSplineControlPoint({hydrophobicContactId: '1', controlPointId: 2},
            undefined,
            false,
            {x: -78, y: 17},
            true,
            true
        );
    });

    function checkClosestSplineControlPoint(expected,
        ids,
        endpointsOnly,
        coordinates,
        enabled = true,
        hidden = false
    ) {
        const closestObjectFinder = interactionDrawer.userInteractionHandler.addHandler.closestObjectFinder;
        const hydrophobicContacts = closestObjectFinder.sceneData.hydrophobicData.hydrophobicContacts;
        const expectedContactInData = hydrophobicContacts[expected.hydrophobicContactId];
        const expectedControlPointInData = expectedContactInData.controlPoints[expected.controlPointId];
        hydrophobicContacts['0'].enabled = enabled;
        hydrophobicContacts['0'].hidden = hidden;
        const hit = closestObjectFinder.getClosestEnabledSplineControlPoint(coordinates,
            endpointsOnly,
            ids
        );
        expect(hit).toEqual({
            hydrophobicContactId: expected.hydrophobicContactId,
            controlPointId: expected.controlPointId,
            controlPoint: expectedControlPointInData
        });
    }
});