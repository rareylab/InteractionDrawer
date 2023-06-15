describe('InteractionDrawer Data Objects TextLabelBased', function () {

    beforeEach(function () {
        $('<svg id="draw-area" width="100%" height="600px"></svg>').appendTo('body');
        copyTestConfig = Helpers.deepCloneObject(interactionDrawerTestConfig);
        const copyJson = Helpers.deepCloneObject(interactionDrawerTestJson);
        copyJson.scene.structures[0].additionalInformation = {test: 'test'};
        interactionDrawer = new InteractionDrawer('draw-area', copyTestConfig);
        const inputJson = JSON.stringify(copyJson);
        interactionDrawer.addByJSON(inputJson);
    });

    afterEach(function () {
        $('#draw-area').remove();
    });

    it('tests the movement of a text label by a certain offset', async function () {
        const structure = interactionDrawer.sceneData.structuresData.structures['0'];
        const atom = structure.atomsData.getAtom(10016);
        const coordinates = atom.coordinates;
        const x = coordinates.x;
        const y = coordinates.y;
        atom.addOffsetToCoords({x: 1, y: 1});
        expect(coordinates.x).toBeCloseTo(x + 1);
        expect(coordinates.y).toBeCloseTo(y + 1);
    });

    it('tests the adding of representation of draw limits', async function () {
        const structure = interactionDrawer.sceneData.structuresData.structures['0'];
        const atom = structure.atomsData.getAtom(10016);
        currentDrawLimits = atom.drawLimits[0];
        expect(currentDrawLimits.type).toEqual('atomPoint');
        expect(currentDrawLimits.limits.xMin).toBeCloseTo(20.3);
        expect(currentDrawLimits.limits.xMax).toBeCloseTo(20.3);
        expect(currentDrawLimits.limits.yMin).toBeCloseTo(-28.052);
        expect(currentDrawLimits.limits.yMax).toBeCloseTo(-28.052);
        expect(atom.globalDrawLimits.xMin).toBeCloseTo(20.3);
        expect(atom.globalDrawLimits.xMax).toBeCloseTo(20.3);
        expect(atom.globalDrawLimits.yMin).toBeCloseTo(-28.052);
        expect(atom.globalDrawLimits.yMax).toBeCloseTo(-28.052);
        const drawLimits = [
            {
                limits: {xMin: 1, xMax: -1, yMin: 1, yMax: -1},
                limits: {xMin: -2, xMax: -1, yMin: 1, yMax: 5},
                limits: {xMin: 1, xMax: 5, yMin: -3, yMax: -1}
            }
        ];
        atom.setDrawLimits(drawLimits);
        expect(atom.drawLimits[0]).toEqual({limits: {xMin: 1, xMax: 5, yMin: -3, yMax: -1}});
        expect(atom.globalDrawLimits).toEqual({xMin: 1, xMax: 5, yMin: -3, yMax: -1});
        expect(atom.surroundingRect).toEqual([
            {x: undefined, y: undefined},
            {x: undefined, y: undefined},
            {x: undefined, y: undefined},
            {x: undefined, y: undefined}
        ]);
        const rectBoundaries = [{limits: {xMin: -5, xMax: -1, yMin: 1, yMax: -1}}];
        atom.setDrawLimits(drawLimits, rectBoundaries);
        expect(atom.surroundingRect).toEqual([
            {x: -5, y: 1}, {x: -1, y: 1}, {x: -1, y: -1}, {x: -5, y: -1}
        ]);
    });

    it(
        'tests the adding of representation of the surrounding selector shape of the label (temp)',
        async function () {
            const structure = interactionDrawer.sceneData.structuresData.structures['0'];
            const atom = structure.atomsData.getAtom(10016);
            const selectorShape = [{type: 'test', coordinates: {x: 1, y: 1}}];
            atom.setSelectorShapes(selectorShape, true);
            expect(atom.tempSelectorShapes).toEqual(selectorShape);
        }
    );

    it(
        'tests the adding of representation of the surrounding selector shape of the label',
        async function () {
            const structure = interactionDrawer.sceneData.structuresData.structures['0'];
            const atom = structure.atomsData.getAtom(10016);
            const selectorShape = [{type: 'test', coordinates: {x: 1, y: 1}}];
            atom.setSelectorShapes(selectorShape);
            expect(atom.selectorShapes).toEqual(selectorShape);
        }
    );

    it(
        'tests whether the text label is hit by certain other draw elements (hit)',
        async function () {
            const polyVertices = [{x: 0.999, y: 0.999}];
            testHitFunction(polyVertices, true);
        }
    );

    it(
        'tests whether the text label is hit by certain other draw elements (no hit on border)',
        async function () {
            const polyVertices = [{x: 1, y: 1}];
            testHitFunction(polyVertices, false);
        }
    );

    it(
        'tests whether the text label is hit by certain other draw elements (no hit)',
        async function () {
            const polyVertices = [{x: 1.001, y: 1.001}];
            testHitFunction(polyVertices, false);
        }
    );

    function testHitFunction(polyVertices, expected) {
        const structure = interactionDrawer.sceneData.structuresData.structures['0'];
        const atom = structure.atomsData.getAtom(10016);
        atom.selectorShapes = [{type: 'test', coordinates: {x: 0, y: 0}}]
        atom.surroundingRect = [
            {x: 1, y: 1}, {x: -1, y: 1}, {x: -1, y: -1}, {x: 1, y: -1}
        ]
        const collisionFinder = interactionDrawer.userInteractionHandler.hoverHandler.collisionFinder;
        const {circleTest, polyTest} = collisionFinder.createCollisionChecksForPoints(polyVertices);
        const hit = atom.testHitFunctionsForSelection({
            circleHitFunction: circleTest, rectHitFunction: polyTest
        });
        expect(hit).toEqual(expected);
    }

    it('tests the creation of an TextLabel object (Atom with label)', async function () {
        const structure = interactionDrawer.sceneData.structuresData.structures['2'];
        const atom = structure.atomsData.getAtom(10050);
        expect(atom.id).toEqual(10050);
        expect(atom.element).toEqual('R');
        expect(atom.charge).toEqual(0);
        expect(atom.aromatic).toEqual(undefined);
        expect(atom.rings).toEqual(new Set([]));
        expect(atom.aromaticRings).toEqual(new Set([]));
        expect(atom.isInRing).toEqual(false);
        expect(atom.stereoCenter).toEqual(false);
        expect(atom.connectedComponent).toEqual(0);
        expect(atom.ringSystem).toEqual(undefined);
        expect(atom.hydrogenCount).toEqual(0);
        expect(atom.hydrogenOrientation).toEqual(undefined);
        expect(atom.tempHydrogenOrientation).toEqual(undefined);
        expect(atom.isLabel).toEqual(true);
        expect(atom.labelOrientation).toEqual('left');
        expect(atom.tempLabelOrientation).toEqual('left');
        expect(atom.wn).toEqual(0);
    });

    it('tests the creation of an TextLabel object (Atom)', async function () {
        const structure = interactionDrawer.sceneData.structuresData.structures['0'];
        const atom = structure.atomsData.getAtom(10016);
        expect(atom.id).toEqual(10016);
        expect(atom.additionalInformation).toEqual({});
        expect(atom.coordinates.x).toBeCloseTo(20.3);
        expect(atom.coordinates.y).toBeCloseTo(-28.052);
        expect(atom.tempCoordinates.x).toBeCloseTo(20.3);
        expect(atom.tempCoordinates.y).toBeCloseTo(-28.052);
        expect(atom.color).toEqual('rgb(34, 34, 34)');
        expect(atom.enabled).toEqual(true);
        const limits = atom.drawLimits[0].limits;
        const globalDrawLimits = atom.globalDrawLimits;
        expect(limits).not.toEqual(null);
        expect(limits.xMin).not.toEqual(undefined);
        expect(limits.xMax).not.toEqual(undefined);
        expect(limits.yMin).not.toEqual(undefined);
        expect(limits.yMax).not.toEqual(undefined);
        expect(globalDrawLimits).not.toEqual(null);
        expect(globalDrawLimits.xMin).not.toEqual(undefined);
        expect(globalDrawLimits.xMax).not.toEqual(undefined);
        expect(globalDrawLimits.yMin).not.toEqual(undefined);
        expect(globalDrawLimits.yMax).not.toEqual(undefined);
        expect(atom.surroundingRect.length).toEqual(4);
        expect(atom.selectorShapes.length).toEqual(1);
        expect(atom.tempSelectorShapes.length).toEqual(1);
        expect(atom.element).toEqual('C');
        expect(atom.charge).toEqual(0);
        expect(atom.aromatic).toEqual(true);
        expect(atom.rings).toEqual(new Set([4000001]));
        expect(atom.aromaticRings).toEqual(new Set(['4000001']));
        expect(atom.isInRing).toEqual(true);
        expect(atom.stereoCenter).toEqual(false);
        expect(atom.connectedComponent).toEqual(0);
        expect(atom.ringSystem).toEqual(3);
        expect(atom.hydrogenCount).toEqual(0);
        expect(atom.hydrogenOrientation).toEqual(undefined);
        expect(atom.tempHydrogenOrientation).toEqual(undefined);
        expect(atom.isLabel).toEqual(false);
        expect(atom.labelOrientation).toEqual(undefined);
        expect(atom.tempLabelOrientation).toEqual(undefined);
        expect(atom.wn).toEqual(0);
    });

    it('tests if the atom is a hydrogen', async function () {
        const structure = interactionDrawer.sceneData.structuresData.structures['0'];
        const atom = structure.atomsData.getAtom(10016);
        expect(atom.isHydrogen()).toEqual(false);
        atom.element = 'H';
        expect(atom.isHydrogen()).toEqual(true);
    });

    it('tests if the atom is a hydrogen', async function () {
        const structure = interactionDrawer.sceneData.structuresData.structures['0'];
        const atom = structure.atomsData.getAtom(10016);
        expect(atom.isHydrogen()).toEqual(false);
        atom.element = 'H';
        expect(atom.isHydrogen()).toEqual(true);
    });

    it('tests if the atom is a metal', async function () {
        const structure = interactionDrawer.sceneData.structuresData.structures['0'];
        const atom = structure.atomsData.getAtom(10016);
        expect(atom.isMetal()).toEqual(false);
        atom.element = 'Mg';
        expect(atom.isMetal()).toEqual(true);
    });

    it('tests the deep coping of an Atom object', async function () {
        const structure = interactionDrawer.sceneData.structuresData.structures['0'];
        const atom = structure.atomsData.getAtom(10016);
        const clone = atom.clone();
        expect(atom.id).toEqual(clone.id);
        expect(atom.additionalInformation).toEqual(clone.additionalInformation);
        expect(atom.additionalInformation).not.toBe(clone.additionalInformation);
        expect(atom.coordinates).not.toBe(clone.coordinates);
        expect(atom.coordinates.x).toBeCloseTo(clone.coordinates.x);
        expect(atom.coordinates.y).toBeCloseTo(clone.coordinates.y);
        expect(atom.tempCoordinates).not.toBe(clone.tempCoordinates);
        expect(atom.tempCoordinates.x).toBeCloseTo(clone.tempCoordinates.x);
        expect(atom.tempCoordinates.y).toBeCloseTo(clone.tempCoordinates.y);
        expect(atom.color).toEqual(clone.color);
        expect(atom.enabled).toEqual(clone.enabled);
        const limits = atom.drawLimits[0].limits;
        const cloneLimits = clone.drawLimits[0].limits;
        const globalDrawLimits = atom.globalDrawLimits;
        const cloneGlobalDrawLimits = clone.globalDrawLimits;
        expect(cloneLimits).not.toEqual(null);
        expect(limits).not.toBe(cloneLimits);
        expect(limits.xMin).toBeCloseTo(cloneLimits.xMin);
        expect(limits.xMax).toBeCloseTo(cloneLimits.xMax);
        expect(limits.yMin).toBeCloseTo(cloneLimits.yMin);
        expect(limits.yMax).toBeCloseTo(cloneLimits.yMax);
        expect(cloneGlobalDrawLimits).not.toEqual(null);
        expect(globalDrawLimits).not.toBe(cloneGlobalDrawLimits);
        expect(globalDrawLimits.xMin).toBeCloseTo(cloneGlobalDrawLimits.xMin);
        expect(globalDrawLimits.xMax).toBeCloseTo(cloneGlobalDrawLimits.xMax);
        expect(globalDrawLimits.yMin).toBeCloseTo(cloneGlobalDrawLimits.yMin);
        expect(globalDrawLimits.yMax).toBeCloseTo(cloneGlobalDrawLimits.yMax);
        expect(atom.surroundingRect.length).toEqual(clone.surroundingRect.length);
        expect(atom.selectorShapes.length).toEqual(clone.selectorShapes.length);
        expect(atom.tempSelectorShapes.length).toEqual(clone.tempSelectorShapes.length);
        expect(atom.surroundingRect).not.toBe(clone.surroundingRect);
        expect(atom.selectorShapes).not.toBe(clone.selectorShapes);
        expect(atom.surroundingRect).not.toBe(clone.surroundingRect);
        expect(atom.element).toEqual(clone.element);
        expect(atom.charge).toEqual(clone.charge);
        expect(atom.aromatic).toEqual(clone.aromatic);
        expect(atom.rings.length).toEqual(clone.rings.length);
        expect(atom.aromaticRings.length).toEqual(clone.aromaticRings.length);
        expect(atom.rings).not.toBe(clone.rings);
        expect(atom.aromaticRings).not.toBe(clone.aromaticRings);
        expect(clone.isInRing).toEqual(false);
        expect(atom.stereoCenter).toEqual(clone.stereoCenter);
        expect(atom.connectedComponent).toEqual(clone.connectedComponent);
        expect(atom.ringSystem).toEqual(clone.ringSystem);
        expect(atom.hydrogenCount).toEqual(clone.hydrogenCount);
        expect(atom.hydrogenOrientation).toEqual(clone.hydrogenOrientation);
        expect(atom.tempHydrogenOrientation).toEqual(clone.tempHydrogenOrientation);
        expect(atom.isLabel).toEqual(clone.isLabel);
        expect(atom.labelOrientation).toEqual(clone.labelOrientation);
        expect(atom.tempLabelOrientation).toEqual(clone.tempLabelOrientation);
        expect(atom.wn).toEqual(clone.wn);
    });

    it('tests the creation of an TextLabel object (Annotation)', async function () {
        const annotation = interactionDrawer.sceneData.annotationsData.annotations['1'];
        expect(annotation.id).toEqual(1);
        expect(annotation.label).toEqual('Ile10A');
        expect(annotation.additionalInformation).toEqual({});
        expect(annotation.coordinates.x).toBeCloseTo(-54.927);
        expect(annotation.coordinates.y).toBeCloseTo(36.465);
        expect(annotation.tempCoordinates.x).toBeCloseTo(-54.927);
        expect(annotation.tempCoordinates.y).toBeCloseTo(36.465);
        expect(annotation.color).toEqual('rgb(1, 154, 77)');
        expect(annotation.enabled).toEqual(true);
        const limits = annotation.drawLimits[0].limits;
        const globalDrawLimits = annotation.globalDrawLimits;
        expect(limits).not.toEqual(null);
        expect(limits.xMin).not.toEqual(undefined);
        expect(limits.xMax).not.toEqual(undefined);
        expect(limits.yMin).not.toEqual(undefined);
        expect(limits.yMax).not.toEqual(undefined);
        expect(globalDrawLimits).not.toEqual(null);
        expect(globalDrawLimits.xMin).not.toEqual(undefined);
        expect(globalDrawLimits.xMax).not.toEqual(undefined);
        expect(globalDrawLimits.yMin).not.toEqual(undefined);
        expect(globalDrawLimits.yMax).not.toEqual(undefined);
        expect(annotation.surroundingRect.length).toEqual(4);
        expect(annotation.selectorShapes.length).toEqual(3);
        expect(annotation.tempSelectorShapes.length).toEqual(3);
        expect(annotation.structureLink).toEqual(0);
        expect(annotation.atomLinks).toEqual([10022, 10021, 10023, 10025, 10027, 10026, 10024]);
        expect(annotation.isStructureLabel).toEqual(undefined);
        expect(annotation.structureRepresentationInfo['1'].coordinates.x).toBeCloseTo(-54.927);
        expect(annotation.structureRepresentationInfo['1'].coordinates.y).toBeCloseTo(36.465);
        expect(annotation.structureRepresentationInfo['2']).not.toEqual(undefined);
        expect(annotation.structureRepresentationInfo['2'].coordinates.x).not.toEqual(undefined);
        expect(annotation.structureRepresentationInfo['2'].coordinates.y).not.toEqual(undefined);
        expect(annotation.structureRepresentationInfo['2'].distToCircleMid).toBeCloseTo(25.3);
        expect(annotation.structureRepresentationInfo['2'].circleMidIsInside).toEqual(false);
    });

    it('tests the cloning of an TextLabel object (Annotation)', async function () {
        const annotation = interactionDrawer.sceneData.annotationsData.annotations['1'];
        const clone = annotation.clone()
        expect(annotation.id).toEqual(clone.id);
        expect(annotation.label).toEqual(clone.label);
        expect(annotation.additionalInformation).toEqual(clone.additionalInformation);
        expect(annotation.additionalInformation).not.toBe(clone.additionalInformation);
        expect(annotation.coordinates.x).toBeCloseTo(clone.coordinates.x);
        expect(annotation.coordinates.y).toBeCloseTo(clone.coordinates.y);
        expect(annotation.coordinates).not.toBe(clone.coordinates);
        expect(annotation.tempCoordinates.x).toBeCloseTo(clone.tempCoordinates.x);
        expect(annotation.tempCoordinates.y).toBeCloseTo(clone.tempCoordinates.y);
        expect(annotation.tempCoordinates).not.toBe(clone.tempCoordinates);
        expect(annotation.color).toEqual(clone.color);
        expect(annotation.enabled).toEqual(clone.enabled);
        const limits = annotation.drawLimits[0].limits;
        const clonedLimits = clone.drawLimits[0].limits;
        const globalDrawLimits = annotation.globalDrawLimits;
        const cloneGlobalDrawLimits = clone.globalDrawLimits;
        expect(clonedLimits).not.toEqual(null);
        expect(limits).not.toBe(clonedLimits);
        expect(limits.xMin).toBeCloseTo(clonedLimits.xMin);
        expect(limits.xMax).toBeCloseTo(clonedLimits.xMax);
        expect(limits.yMin).toBeCloseTo(clonedLimits.yMin);
        expect(limits.yMax).toBeCloseTo(clonedLimits.yMax);
        expect(cloneGlobalDrawLimits).not.toEqual(null);
        expect(globalDrawLimits).not.toBe(cloneGlobalDrawLimits);
        expect(globalDrawLimits.xMin).toBeCloseTo(cloneGlobalDrawLimits.xMin);
        expect(globalDrawLimits.xMax).toBeCloseTo(cloneGlobalDrawLimits.xMax);
        expect(globalDrawLimits.yMin).toBeCloseTo(cloneGlobalDrawLimits.yMin);
        expect(globalDrawLimits.yMax).toBeCloseTo(cloneGlobalDrawLimits.yMax);
        expect(annotation.surroundingRect.length).toEqual(clone.surroundingRect.length);
        expect(annotation.selectorShapes.length).toEqual(clone.selectorShapes.length);
        expect(annotation.tempSelectorShapes.length).toEqual(clone.tempSelectorShapes.length);
        expect(annotation.surroundingRect).not.toBe(clone.surroundingRect);
        expect(annotation.selectorShapes).not.toBe(clone.selectorShapes);
        expect(annotation.surroundingRect).not.toBe(clone.surroundingRect);
        expect(annotation.structureLink).toEqual(clone.structureLink);
        expect(annotation.atomLinks).toEqual(clone.atomLinks);
        expect(annotation.isStructureLabel).toEqual(clone.isStructureLabel);
        expect(clone.structureRepresentationInfo).toEqual({});
    });

    it('tests the marking of an atom as part of a ring', async function () {
        const structure = interactionDrawer.sceneData.structuresData.structures['0'];
        const atom = structure.atomsData.getAtom(10016);
        expect(atom.rings.has(1)).toEqual(false);
        atom.addRing(1);
        expect(atom.rings.has(1)).toEqual(true);
    });

    it('tests the marking of an atom as part of an aromatic ring', async function () {
        const structure = interactionDrawer.sceneData.structuresData.structures['0'];
        const atom = structure.atomsData.getAtom(10016);
        expect(atom.aromaticRings.has(1)).toEqual(false);
        atom.addAromaticRing(1);
        expect(atom.aromaticRings.has(1)).toEqual(true);
    });

    it('tests the setting of the hydrogen count of an atom', async function () {
        const structure = interactionDrawer.sceneData.structuresData.structures['0'];
        const atom = structure.atomsData.getAtom(10009);
        atom.calcHydrogenCount(structure.edgesData.getNrBondsFromAtom(atom.id, true));
        expect(atom.hydrogenCount).toEqual(0);
        atom.calcHydrogenCount(structure.edgesData.getNrBondsFromAtom(atom.id, false));
        expect(atom.hydrogenCount).toEqual(2);
    });

    it('tests the setting of the current hydrogen orientation of atom text', async function () {
        const structure = interactionDrawer.sceneData.structuresData.structures['3'];
        const atom = structure.atomsData.getAtom(10051);
        expect(atom.hydrogenOrientation).toEqual('up');
        atom.setHydrogenOrientation('left');
        expect(atom.hydrogenOrientation).toEqual('left');
    });

    it('tests the setting of the temporary hydrogen orientation of atom text', async function () {
        const structure = interactionDrawer.sceneData.structuresData.structures['3'];
        const atom = structure.atomsData.getAtom(10051);
        expect(atom.tempHydrogenOrientation).toEqual(undefined);
        atom.setTempHydrogenOrientation('left');
        expect(atom.tempHydrogenOrientation).toEqual('left');
    });

    it('tests the setting of current label amino acid label orientation', async function () {
        const structure = interactionDrawer.sceneData.structuresData.structures['3'];
        const atom = structure.atomsData.getAtom(10057);
        expect(atom.labelOrientation).toEqual('up');
        expect(atom.tempLabelOrientation).toEqual('up');
        atom.setLabelSide('left');
        expect(atom.labelOrientation).toEqual('left');
        expect(atom.tempLabelOrientation).toEqual('left');
    });

    it(
        'tests the setting of current label amino acid label orientation (temp)',
        async function () {
            const structure = interactionDrawer.sceneData.structuresData.structures['3'];
            const atom = structure.atomsData.getAtom(10057);
            expect(atom.tempLabelOrientation).toEqual('up');
            expect(atom.labelOrientation).toEqual('up');
            atom.setLabelSide('left', true);
            expect(atom.tempLabelOrientation).toEqual('left');
            expect(atom.labelOrientation).toEqual('up');
        }
    );

    it(
        'tests the calculation where the hydrogen representation should be drawn',
        async function () {
            const atomsData = interactionDrawer.sceneData.structuresData.structures['0'].atomsData;
            const atom = atomsData.getAtom(10000);
            const neighbor1 = atomsData.getAtom(10001);
            const neighbor2 = atomsData.getAtom(10002);
            const neighbor3 = atomsData.getAtom(10009);
            expect(atom.calcHydrogenOrientation([neighbor1, neighbor2, neighbor3])).toEqual('down');
            expect(atom.calcHydrogenOrientation([neighbor1, neighbor2, neighbor3], true)).toEqual(
                'down');
        }
    );

    it('tests the calculation where the label neighbors should be drawn', async function () {
        const atomsData = interactionDrawer.sceneData.structuresData.structures['0'].atomsData;
        const atom = atomsData.getAtom(10000);
        const neighbor1 = atomsData.getAtom(10001);
        const neighbor2 = atomsData.getAtom(10002);
        const neighbor3 = atomsData.getAtom(10009);
        expect(atom.calcLabelSide([neighbor1, neighbor2, neighbor3])).toEqual('up');
        expect(atom.calcLabelSide([neighbor1, neighbor2, neighbor3], true)).toEqual('up');
    });
});