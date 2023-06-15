describe('InteractionDrawer Json JsonValidator', function () {

    beforeEach(function () {
        $('<svg id="draw-area" width="100%" height="600px"></svg>').appendTo('body');
        copyJson = Helpers.deepCloneObject(interactionDrawerTestJson);
        interactionDrawer = new InteractionDrawer('draw-area');
        jsonScene = copyJson.scene;
        sceneData = interactionDrawer.sceneData;
        svgComponent = interactionDrawer.svgComponent;
        transformGroupsComponent = svgComponent.transformGroupsComponent;
    });

    afterEach(function () {
        $('#draw-area').remove();
    });

    it(
        'tests the loading error of annotation whose json entry is not an object',
        async function () {
            jsonScene.annotations[0] = [];
            const expected = 'Skipped drawing of annotation at Array position 0: Not an Object.';
            checkJsonError(expected);
            checkAnnotationNotInDataView('0');
        }
    );

    it('tests the loading error of annotation with non unique id', async function () {
        jsonScene.annotations[1].id = 0;
        const expected = 'Skipped drawing of annotation at Array position 1: ID is not unique!';
        checkJsonError(expected);
        const nrOfValidAnnotations = jsonScene.annotations.length - 1;
        expect(Object.keys(sceneData.annotationsData.annotations).length)
            .toEqual(nrOfValidAnnotations);
        expect(Object.keys(transformGroupsComponent.annotationGroupsComponent.labelToSelMap).length)
            .toEqual(nrOfValidAnnotations);
    });

    it('tests the loading error of annotation with missing fields', async function () {
        //some fields may be optional
        const annotation = jsonScene.annotations[0];
        for (const field in annotation) {
            delete annotation[field];
        }
        const expected = 'Skipped drawing of annotation at Array position 0: Missing the' +
            ' following fields: "id", "label" and "coordinates".';
        checkJsonError(expected);
        checkAnnotationNotInDataView('0');
    });

    it('tests the loading error of annotation with fields of wrong type', async function () {
        //some fields may be optional
        const annotation = jsonScene.annotations[0];
        for (const field in annotation) {
            annotation[field] = [];
        }
        const expected = 'Skipped drawing of annotation at Array position 0: Fields have wrong type:' +
            ' "id" (should be Number), "label" (should be String), "coordinates"' +
            ' (should be Object), "belongsTo" (should be Object), "isStructureLabel"' +
            ' (should be Boolean) and "additionalInformation" (should be Object).';
        checkJsonError(expected);
        checkAnnotationNotInDataView('0');
    });

    it(
        'tests the loading error of annotation with fields of wrong type (belongsTo)',
        async function () {
            //some fields may be optional
            const belongsToData = jsonScene.annotations[0].belongsTo;
            for (const field in belongsToData) {
                belongsToData[field] = {};
            }
            const expected = 'Skipped drawing of annotation at Array position 0: Fields have wrong type:' +
                ' "belongsTo": "type" (should be String) and "belongsTo": "id" (should be Number).';
            checkJsonError(expected);
            checkAnnotationNotInDataView('0');
        }
    );

    it(
        'tests the loading error of annotation with fields of wrong type (coordinates)',
        async function () {
            //some fields may be optional
            const coordinatesData = jsonScene.annotations[0].coordinates;
            for (const field in coordinatesData) {
                coordinatesData[field] = {};
            }
            const expected = 'Skipped drawing of annotation at Array position 0: Fields have wrong type:' +
                ' "coordinates": "x" (should be Number) and "coordinates": "y" (should be Number).';
            checkJsonError(expected);
            checkAnnotationNotInDataView('0');
        }
    );

    it(
        'tests the loading error of annotation whose corresponding structure is missing',
        async function () {
            jsonScene.annotations[0].belongsTo.id = 100;
            const expected = 'Skipped drawing of annotation at Array position 0: Field "belongsTo":' +
                ' "id" does not match any structure!';
            checkJsonError(expected);
            checkAnnotationNotInDataView('0');
        }
    );

    it('tests the loading error of annotation with wrong structure type', async function () {
        jsonScene.annotations[0].belongsTo.type = 'notValid';
        const expected = 'Skipped drawing of annotation at Array position 0: Field "belongsTo":' +
            ' "type" must match either "structure" or "structureSpline"!';
        checkJsonError(expected);
        checkAnnotationNotInDataView('0');
    });

    it('tests the loading error of annotation with non existing atom links', async function () {
        jsonScene.annotations[1].belongsTo.atomLinks.push(1111111);
        const expected = 'Skipped drawing of annotation at Array position 1: Field "belongsTo":' +
            ' "atomLinks" contains references to non-existing atom (position 7)';
        checkJsonError(expected);
        checkAnnotationNotInDataView('1');
    });

    function checkAnnotationNotInDataView(annotationId) {
        expect(annotationId in sceneData.annotationsData.annotations).toEqual(false);
        expect(annotationId in transformGroupsComponent.annotationGroupsComponent.labelToSelMap)
            .toEqual(false);
    }

    it(
        'tests the loading error of hydrophobic contact whose json entry is not an object',
        async function () {
            jsonScene.hydrophobicContacts[0] = [];
            const expected = 'Skipped drawing of hydrophobic contact at Array position 0: Not an Object.';
            checkJsonError(expected);
            checkHydrophobicNotInDataView('0', false)
        }
    );

    it('tests the loading error of hydrophobic contact with non unique id', async function () {
        jsonScene.hydrophobicContacts[1].id = 0;
        const expected = undefined;
        //prevents the unique id error message because we can add control points to a existing
        //hydrophobic contact
        checkJsonError(expected);
        const nrOfValidHydrophobics = jsonScene.hydrophobicContacts.length - 1;
        expect(Object.keys(sceneData.hydrophobicData.hydrophobicContacts).length)
            .toEqual(nrOfValidHydrophobics);
        expect(Object.keys(transformGroupsComponent.hydrophobicGroupsComponent.hydrophobicToSelMap['0']).length)
            .toEqual(nrOfValidHydrophobics);
    });

    it('tests the loading error of hydrophobic contact with missing fields', async function () {
        //some fields may be optional
        const hydrophobic = jsonScene.hydrophobicContacts[0];
        for (const field in hydrophobic) {
            delete hydrophobic[field];
        }
        const expected = 'Skipped drawing of hydrophobic contact at Array position 0: Missing the' +
            ' following fields: "id", "belongsTo" and "controlPoints".';
        checkJsonError(expected);
        checkHydrophobicNotInDataView('0');
    });

    it(
        'tests the loading error of hydrophobic contact with fields of wrong type',
        async function () {
            //some fields may be optional
            const hydrophobic = jsonScene.hydrophobicContacts[0];
            hydrophobic.id = [];
            hydrophobic.belongsTo = [];
            hydrophobic.controlPoints = {};
            const expected = 'Skipped drawing of hydrophobic contact at Array position 0: Fields have' +
                ' wrong type: "id" (should be Number), "belongsTo" (should be Number) and' +
                ' "controlPoints" (should be Array).';
            checkJsonError(expected);
            checkHydrophobicNotInDataView('0');
        }
    );

    it(
        'tests the loading error of hydrophobic contact with fields of wrong type (controlPoints)',
        async function () {
            //some fields may be optional
            const controlPointData = jsonScene.hydrophobicContacts[0].controlPoints[0];
            for (const field in controlPointData) {
                controlPointData[field] = {};
            }
            const expected = 'Skipped drawing of hydrophobic contact at Array position 0: Fields have' +
                ' wrong type: "controlPoints": "[0]": "x" (should be Number), "controlPoints": "[0]":' +
                ' "y" (should be Number) and "controlPoints": "[0]": "atomLinks" (should be Array).';
            checkJsonError(expected);
            checkHydrophobicNotInDataView('0');
        }
    );

    it(
        'tests the loading error of hydrophobic contact whose corresponding structure is missing',
        async function () {
            jsonScene.hydrophobicContacts[0].belongsTo = 100;
            const expected = 'Skipped drawing of hydrophobic contact at Array position 0: Field' +
                ' "belongsTo" does not refer to a valid structure!';
            checkJsonError(expected);
            checkHydrophobicNotInDataView('0');
        }
    );

    it(
        'tests the loading error of hydrophobic contact with non existing atom links',
        async function () {
            jsonScene.hydrophobicContacts[0].controlPoints[0].atomLinks.push(1111111);
            const expected = 'Skipped drawing of hydrophobic contact at Array position 0: Field' +
                ' "control points": "[0]": "atomLinks" contains references to non-existing atom' +
                ' (position 1)!';
            checkJsonError(expected);
            checkHydrophobicNotInDataView('0');
        }
    );

    function checkHydrophobicNotInDataView(hydrophobicId) {
        expect(hydrophobicId in sceneData.hydrophobicData.hydrophobicContacts).toEqual(false);
        expect(hydrophobicId in
            transformGroupsComponent.hydrophobicGroupsComponent.hydrophobicToSelMap['0'])
            .toEqual(false);
    }

    it('tests the loading error of structures that are not in an array', async function () {
        jsonScene.structures = {};
        const expected = 'Skipped drawing of structures: must be given in form of an Array!';
        checkJsonError(expected);
        checkStructureNotInDataView('0');
        checkStructureNotInDataView('1');
        checkStructureNotInDataView('2');
        checkStructureNotInDataView('3');
        checkStructureNotInDataView('4');
    });

    it('tests the loading error of structure atoms that are not in an array', async function () {
        jsonScene.structures[0].atoms = {};
        const expected = 'Skipped drawing of structure at Array position 0:' +
            ' Field atoms is not an Array!';
        const jsonValidator = interactionDrawer.svgDrawer.jsonValidator;
        const inputJson = JSON.stringify(copyJson);
        interactionDrawer.addByJSON(inputJson);
        const error = jsonValidator.errorLogger[0];
        //to long error message cause of missing atom ids in bonds ecc.
        expect(error).toMatch(expected);
        checkStructureNotInDataView('0');
    });

    it('tests the loading error of structure bonds that are not in an array', async function () {
        jsonScene.structures[0].bonds = {};
        const expected = 'Skipped drawing of structure at Array position 0:' +
            ' Field bonds is not an Array!';
        checkJsonError(expected);
        checkStructureNotInDataView('0');
    });

    it('tests the loading error of structure whose json entry is not an object', async function () {
        jsonScene.structures[0] = [];
        const expected = 'Skipped drawing of structure at Array position 0: Not an Object.';
        checkJsonError(expected);
        checkStructureNotInDataView('0');
    });

    it('tests the loading error of structure with non uniqe id', async function () {
        jsonScene.structures[1].id = 0;
        const expected = 'Skipped drawing of structure at Array position 1: ID is not unique!';
        const nrOfValidStructures = jsonScene.structures.length - 1;
        checkJsonError(expected);
        expect(Object.keys(sceneData.structuresData.structures).length)
            .toEqual(nrOfValidStructures);
        expect(Object.keys(transformGroupsComponent.atomGroupsComponent.atomToSelMap).length)
            .toEqual(nrOfValidStructures);
        expect(Object.keys(transformGroupsComponent.edgeGroupsComponent.edgeToSelMap).length)
            .toEqual(nrOfValidStructures);
        expect(Object.keys(transformGroupsComponent.structureCircleGroupsComponent.structureCircleToSelMap).length)
            .toEqual(nrOfValidStructures);
    });

    it('tests the loading error of structure with missing fields', async function () {
        //some fields may be optional
        const structure = jsonScene.structures[0];
        for (const field in structure) {
            delete structure[field];
        }
        const expected = 'Skipped drawing of structure at Array position 0: Missing the' +
            ' following fields: "id".';
        checkJsonError(expected);
        checkStructureNotInDataView('0');
    });

    it('tests the loading error of structure rings with missing fields', async function () {
        //some fields may be optional
        const ring = jsonScene.structures[0].rings[0];
        for (const field in ring) {
            delete ring[field];
        }
        const expected = 'Skipped drawing of structure at Array position 0: Field rings at position' +
            ' 0: Missing the following fields: "id" and "atoms".';
        checkJsonError(expected);
        checkStructureNotInDataView('0');
    });

    it('tests the loading error of structure rings with wrong field types', async function () {
        //some fields may be optional
        const ring = jsonScene.structures[0].rings[0];
        for (const field in ring) {
            ring[field] = {};
        }
        const expected = 'Skipped drawing of structure at Array position 0: Field rings at position' +
            ' 0: Fields have wrong type: "id" (should be Number) and "atoms" (should be Array).';
        checkJsonError(expected);
        checkStructureNotInDataView('0');
    });

    it('tests the loading error of structure atoms with missing fields', async function () {
        //some fields may be optional
        const atom = jsonScene.structures[0].atoms[0];
        for (const field in atom) {
            delete atom[field];
        }
        const expected = 'Skipped drawing of structure at Array position 0: Field atoms at position' +
            ' 0: Missing the following fields: "id", "element", "label" and "coordinates". Field' +
            ' "bonds" at position 0: Field "from" does not match any atom! Field "bonds" at' +
            ' position 1: Field "from" does not match any atom! Field "bonds" at position 2:' +
            ' Field "from" does not match any atom! Field "bonds" at position 3: Field "from"' +
            ' does not match any atom!';
        checkJsonError(expected);
        checkStructureNotInDataView('0');
    });

    it('tests the loading error of structure atoms with wrong field types', async function () {
        //some fields may be optional
        const atom = jsonScene.structures[0].atoms[0];
        for (const field in atom) {
            atom[field] = [];
        }
        const expected = 'Skipped drawing of structure at Array position 0: Field atoms at position' +
            ' 0: Fields have wrong type: "id" (should be Number), "element" (should be String),' +
            ' "label" (should be String|null), "coordinates" (should be Object), "charge"' +
            ' (should be Number), "hydrogenCount" (should be Number|"missing") and' +
            ' "additionalInformation" (should be Object). Field "bonds" at position 0:' +
            ' Field "from" does not match any atom! Field "bonds" at position 1: Field' +
            ' "from" does not match any atom! Field "bonds" at position 2: Field "from"' +
            ' does not match any atom! Field "bonds" at position 3: Field "from" does not' +
            ' match any atom!';
        checkJsonError(expected);
        checkStructureNotInDataView('0');
    });

    it(
        'tests the loading error of structure atoms with wrong field types (coordinates)',
        async function () {
            //some fields may be optional
            const coordinatesData = jsonScene.structures[0].atoms[0].coordinates;
            for (const field in coordinatesData) {
                coordinatesData[field] = [];
            }
            const expected = 'Skipped drawing of structure at Array position 0: Field atoms at position' +
                ' 0: Fields have wrong type: "coordinates": "x" (should be Number) and "coordinates":' +
                ' "y" (should be Number). Field "bonds" at position 0: Field "from" does not match' +
                ' any atom! Field "bonds" at position 1: Field "from" does not match any atom! Field' +
                ' "bonds" at position 2: Field "from" does not match any atom! Field "bonds" at' +
                ' position 3: Field "from" does not match any atom!';
            checkJsonError(expected);
            checkStructureNotInDataView('0');
        }
    );

    it('tests the loading error of structure bonds with missing fields', async function () {
        //some fields may be optional
        const bond = jsonScene.structures[0].bonds[0];
        for (const field in bond) {
            delete bond[field];
        }
        const expected = 'Skipped drawing of structure at Array position 0: Field "bonds"' +
            ' at position 0: Missing the following fields: "id", "from", "to" and "type".';
        checkJsonError(expected);
        checkStructureNotInDataView('0');
    });

    it('tests the loading error of structure bonds with wrong field types', async function () {
        //some fields may be optional
        const bond = jsonScene.structures[0].bonds[0];
        for (const field in bond) {
            bond[field] = [];
        }
        const expected = 'Skipped drawing of structure at Array position 0: Field "bonds" at' +
            ' position 0: Fields have wrong type: "id" (should be Number), "from"' +
            ' (should be Number), "to" (should be Number) and "type"' +
            ' (should be "single|double|triple|stereoFront|stereoBack|stereoFrontReverse|' +
            'stereoBackReverse|up|down").';
        checkJsonError(expected);
        checkStructureNotInDataView('0');
    });

    it('tests the loading error of structure with fields of wrong type', async function () {
        //some fields may be optional
        const structure = jsonScene.structures[0];
        for (const field in structure) {
            structure[field] = {};
        }
        const expected = 'Skipped drawing of structure at Array position 0: Fields have wrong type:' +
            ' "id" (should be Number), "structureLabel" (should be String), "structureName"' +
            ' (should be String) and "structureType" (should be String).';
        checkJsonError(expected);
        checkStructureNotInDataView('0');
    });

    it('tests the loading error of structure bonds with non existing atom id', async function () {
        const bond = jsonScene.structures[0].bonds[0];
        bond.from = 121212;
        const expected = 'Skipped drawing of structure at Array position 0: Field "bonds" at' +
            ' position 0: Field "from" does not match any atom!';
        checkJsonError(expected);
        checkStructureNotInDataView('0');
    });

    it('tests the loading error of structure bonds with same from/to atom ids', async function () {
        const bond = jsonScene.structures[0].bonds[0];
        bond.from = bond.to;
        const expected = 'Skipped drawing of structure at Array position 0: Field "bonds" at ' +
            'position 0: Fields "from" and "to" are the same!';
        checkJsonError(expected);
        checkStructureNotInDataView('0');
    });

    it('tests the loading error of structure rings with non existing atom id', async function () {
        //some fields may be optional
        const ring = jsonScene.structures[0].rings[0];
        ring.atoms.push(12121212);
        const expected = 'Skipped drawing of structure at Array position 0: Field rings at position' +
            ' 0: Given atoms do not match any atom (at positions 6).';
        checkJsonError(expected);
        checkStructureNotInDataView('0');
    });

    function checkStructureNotInDataView(structureId) {
        expect(structureId in sceneData.structuresData.structures).toEqual(false);
        expect(structureId in transformGroupsComponent.atomGroupsComponent.atomToSelMap)
            .toEqual(false);
        expect(structureId in transformGroupsComponent.edgeGroupsComponent.edgeToSelMap)
            .toEqual(false);
        expect(structureId in
            transformGroupsComponent.structureCircleGroupsComponent.structureCircleToSelMap)
            .toEqual(false);
    }

    it('tests the loading error of cation pi whose json entry is not an object', async function () {
        jsonScene.cationPiStackings[0] = [];
        const expected = 'Skipped drawing of cation pi stacking interaction at Array' +
            ' position 0: Not an Object.';
        checkJsonError(expected);
        checkCationPiNotInDataView('0');
    });

    it('tests the loading error of cation pi with non unique id', async function () {
        jsonScene.cationPiStackings.push(jsonScene.cationPiStackings[0]);
        const expected = 'Skipped drawing of cation pi stacking interaction at Array position 1:' +
            ' ID is not unique!';
        const nrOfValidCatPiStacking = jsonScene.cationPiStackings.length - 1;
        checkJsonError(expected);
        expect(Object.keys(sceneData.intermolecularData.cationPiStackings).length)
            .toEqual(nrOfValidCatPiStacking);
        expect(Object.keys(transformGroupsComponent.intermolecularGroupsComponent.cationPiStackToSelMap).length)
            .toEqual(nrOfValidCatPiStacking);
    });

    it('tests the loading error of cation pi stacking with missing fields', async function () {
        //some fields may be optional
        const cationPi = jsonScene.cationPiStackings[0];
        for (const field in cationPi) {
            delete cationPi[field];
        }
        const expected = 'Skipped drawing of cation pi stacking interaction at Array position 0:' +
            ' Missing the following fields: "id", "fromStructure", "toStructure", "from" and' +
            ' "to".';
        checkJsonError(expected);
        checkCationPiNotInDataView('0');
    });

    it(
        'tests the loading error of cation pi stacking with fields of wrong type',
        async function () {
            const catPiStacking = jsonScene.cationPiStackings[0];
            for (const field in catPiStacking) {
                catPiStacking[field] = [];
            }
            const expected = 'Skipped drawing of cation pi stacking interaction at Array position 0:' +
                ' Fields have wrong type: "id" (should be Number), "fromStructure" (should be' +
                ' Number), "toStructure" (should be Number), "from" (should be Number), "to"' +
                ' (should be Number) and "additionalInformation" (should be Object).';
            checkJsonError(expected);
            checkCationPiNotInDataView('0');
        }
    );

    it(
        'tests the loading error of cation pi stacking whose corresponding structures do not exist',
        async function () {
            const catPiStacking = jsonScene.cationPiStackings[0];
            catPiStacking.fromStructure = 11111;
            catPiStacking.toStructure = 11111;
            const expected = 'Skipped drawing of cation pi stacking interaction at Array position' +
                ' 0: Field "fromStructure" does not refer to a valid structure! Field' +
                ' "toStructure" does not refer to a valid structure!';
            checkJsonError(expected);
            checkCationPiNotInDataView('0');
        }
    );

    it(
        'tests the loading error of cation pi stacking whose endpoints are the same',
        async function () {
            //can not be the same because always from -> ring center to -> atom, 4000001 (to) is not
            //an atom
            const catPiStacking = jsonScene.cationPiStackings[0];
            catPiStacking.toStructure = catPiStacking.fromStructure;
            catPiStacking.to = catPiStacking.from;
            const expected = 'Skipped drawing of cation pi stacking interaction at Array position 0:' +
                ' Structure 0 does not contain an interaction endpoint with with ID 4000001!';
            checkJsonError(expected);
            checkCationPiNotInDataView('0');
        }
    );

    function checkCationPiNotInDataView(cationPiId) {
        expect(cationPiId in sceneData.intermolecularData.cationPiStackings).toEqual(false);
        expect(cationPiId in
            transformGroupsComponent.intermolecularGroupsComponent.cationPiStackToSelMap)
            .toEqual(false);
    }

    it(
        'tests the loading error of pi stacking whose json entry is not an object',
        async function () {
            jsonScene.piStackings[0] = [];
            const expected = 'Skipped drawing of pi stacking interaction at Array position 0: Not' +
                ' an Object.';
            checkJsonError(expected);
            checkPiStackingInDataView('0');
        }
    );

    it('tests the loading error of pi stacking with non unique id', async function () {
        jsonScene.piStackings.push(jsonScene.piStackings[0]);
        const expected = 'Skipped drawing of pi stacking interaction at Array position 1:' +
            ' ID is not unique!';
        const nrOfValidPiStacking = jsonScene.piStackings.length - 1;
        checkJsonError(expected);
        expect(Object.keys(sceneData.intermolecularData.piStackings).length)
            .toEqual(nrOfValidPiStacking);
        expect(Object.keys(transformGroupsComponent.intermolecularGroupsComponent.piStackToSelMap).length)
            .toEqual(nrOfValidPiStacking);
    });

    it('tests the loading error of pi stacking with missing fields', async function () {
        //some fields may be optional
        const piStacking = jsonScene.piStackings[0];
        for (const field in piStacking) {
            delete piStacking[field];
        }
        const expected = 'Skipped drawing of pi stacking interaction at Array position 0: Missing' +
            ' the following fields: "id", "fromStructure", "toStructure", "from" and "to".';
        checkJsonError(expected);
        checkPiStackingInDataView('0');
    });

    it('tests the loading error of pi stacking with fields of wrong type', async function () {
        const piStacking = jsonScene.piStackings[0];
        for (const field in piStacking) {
            piStacking[field] = [];
        }
        const expected = 'Skipped drawing of pi stacking interaction at Array position 0: Fields have wrong' +
            ' type: "id" (should be Number), "fromStructure" (should be Number), "toStructure"' +
            ' (should be Number), "from" (should be Number), "to" (should be Number) ' +
            'and "additionalInformation" (should be Object).';
        checkJsonError(expected);
        checkPiStackingInDataView('0');
    });

    it(
        'tests the loading error of pi stacking whose corresponding structures do not exist',
        async function () {
            const piStacking = jsonScene.piStackings[0];
            piStacking.fromStructure = 11111;
            piStacking.toStructure = 11111;
            const expected = 'Skipped drawing of pi stacking interaction at Array position 0: Field' +
                ' "fromStructure" does not refer to a valid structure! Field "toStructure"' +
                ' does not refer to a valid structure!';
            checkJsonError(expected);
            checkPiStackingInDataView('0');
        }
    );

    it('tests the loading error of pi stacking whose endpoints are the same', async function () {
        const piStacking = jsonScene.piStackings[0];
        piStacking.fromStructure = piStacking.toStructure;
        piStacking.from = piStacking.to;
        const expected = 'Skipped drawing of pi stacking interaction at Array position 0:' +
            ' The two given endpoint ids are the same!';
        checkJsonError(expected);
        checkPiStackingInDataView('0');
    });

    function checkPiStackingInDataView(piStackingId) {
        expect(piStackingId in sceneData.intermolecularData.piStackings).toEqual(false);
        expect(piStackingId in
            transformGroupsComponent.intermolecularGroupsComponent.piStackToSelMap)
            .toEqual(false);
    }

    it(
        'tests the error of atom pair interaction whose json entry is not an object',
        async function () {
            jsonScene.atomPairInteractions[0] = [];
            const expected = 'Skipped drawing of atom pair interaction at Array position 0: Not an Object.';
            checkJsonError(expected);
            checkAtomPairInteractionNotInDataView('0');
        }
    );

    it('tests the loading error of atom pair interaction with non unique id', async function () {
        jsonScene.atomPairInteractions[1].id = 0;
        const expected = 'Skipped drawing of atom pair interaction at Array position 1: ID is not unique!';
        const nrOfValidAtomPairInteractions = jsonScene.atomPairInteractions.length - 1;
        checkJsonError(expected);
        expect(Object.keys(sceneData.intermolecularData.atomPairInteractions).length).toEqual(
            nrOfValidAtomPairInteractions);
        expect(Object.keys(transformGroupsComponent.intermolecularGroupsComponent.atomPairInteractionToSelMap).length)
            .toEqual(nrOfValidAtomPairInteractions);
    });

    it('tests the loading error of atom pair interaction with missing fields', async function () {
        //some fields may be optional
        const atomPairInteraction = jsonScene.atomPairInteractions[0];
        for (const field in atomPairInteraction) {
            delete atomPairInteraction[field];
        }
        const expected = 'Skipped drawing of atom pair interaction at Array position 0: Missing the' +
            ' following fields: "id", "fromStructure", "toStructure", "from" and "to".';
        checkJsonError(expected);
        checkAtomPairInteractionNotInDataView('0');
    });

    it(
        'tests the loading error of atom pair interaction with fields of wrong type',
        async function () {
            const atomPairInteraction = jsonScene.atomPairInteractions[0];
            for (const field in atomPairInteraction) {
                atomPairInteraction[field] = [];
            }
            const expected = 'Skipped drawing of atom pair interaction at Array position 0: Fields have wrong' +
                ' type: "id" (should be Number), "fromStructure" (should be Number), "toStructure"' +
                ' (should be Number), "from" (should be Number), "to" (should be Number)' +
                ' and "additionalInformation" (should be Object).';
            checkJsonError(expected);
            checkAtomPairInteractionNotInDataView('0');
        }
    );

    it(
        'tests the loading error of atom pair interaction whose corresponding structures do not exist',
        async function () {
            const hydrogenBond = jsonScene.atomPairInteractions[0];
            hydrogenBond.fromStructure = 11111;
            hydrogenBond.toStructure = 11111;
            const expected = 'Skipped drawing of atom pair interaction at Array position 0: Field' +
                ' "fromStructure" does not refer to a valid structure! Field "toStructure"' +
                ' does not refer to a valid structure!';
            checkJsonError(expected);
            checkAtomPairInteractionNotInDataView('0');
        }
    );

    it(
        'tests the loading error of atom pair interaction whose endpoints are the same',
        async function () {
            const hydrogenBond = jsonScene.atomPairInteractions[0];
            hydrogenBond.fromStructure = hydrogenBond.toStructure;
            hydrogenBond.from = hydrogenBond.to;
            const expected = 'Skipped drawing of atom pair interaction at Array position 0: The two given' +
                ' endpoint ids are the same!';
            checkJsonError(expected);
            checkAtomPairInteractionNotInDataView('0');
        }
    );

    function checkAtomPairInteractionNotInDataView(atomPairInteractionId) {
        expect(atomPairInteractionId in sceneData.intermolecularData.atomPairInteractions).toEqual(
            false);
        expect(atomPairInteractionId in
            transformGroupsComponent.intermolecularGroupsComponent.atomPairInteractionToSelMap)
            .toEqual(false);
    }

    function checkJsonError(expectedMessage) {
        const jsonValidator = interactionDrawer.svgDrawer.jsonValidator;
        const inputJson = JSON.stringify(copyJson);
        interactionDrawer.addByJSON(inputJson);
        const error = jsonValidator.errorLogger[0];
        expect(error).toEqual(expectedMessage);
    }
});