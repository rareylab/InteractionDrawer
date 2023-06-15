describe('InteractionDrawer Utils Helpers', function () {

    it('tests the deep clone creation of an array containing multiple objects', async function () {
        const array = [{a: 'test'}, {b: 'test'}, {c: 'test'}];
        const clone = Helpers.cloneArrayOfObjects(array);
        expect(clone).not.toBe(array);
    });

    it('tests hex color to rgb color conversion', async function () {
        const rgb = Helpers.hexToRgb('#32a852');
        expect(rgb).toEqual('rgb(50, 168, 82)');
    });

    it('tests rgb color to hex color conversion', async function () {
        const hex = Helpers.rgbToHex('rgb(50, 168, 82)');
        expect(hex).toEqual('#32a852');
    });

    it('tests em to px conversion based on the px font size of a parent', async function () {
        const px = Helpers.emToPx(4, 2);
        expect(px).toEqual(8);
    });

    it('tests px to pt conversion', async function () {
        const px = Helpers.ptToPx(7.5);
        expect(px).toEqual(10);
    });

    it('tests em conversion of config option string', async function () {
        checkOptStringConversion(4, 8, '2em');
    });

    it('tests /px conversion of config option string', async function () {
        checkOptStringConversion(1, 4, '4px');
    });

    it('tests pt conversion of config option string', async function () {
        checkOptStringConversion(1, 10, '7.5pt');
    });

    function checkOptStringConversion(parentFontSize, expected, optString) {
        const converted = Helpers.convertOptStringToPx(parentFontSize, optString);
        expect(converted).toEqual(expected);
    }

    it('tests creation of a new object with filtered fields', async function () {
        const obj = {a: 'test', b: 'test'};
        const newObj = Helpers.filterObjectByKeys(obj, ['a']);
        expect(obj).not.toBe(newObj);
        expect(Object.keys(newObj).length).toEqual(1);
        expect(newObj.a).toEqual('test');
    });

    it(
        'tests the creation of all possible combinations of elements within a given array (max 1000)',
        async function () {
            checkArrayCombinations(0,
                1000,
                [[1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3], [1, 2, 3]]
            );
        }
    );

    it(
        'tests the creation of all possible combinations of elements within a given array (max 1)',
        async function () {
            checkArrayCombinations(0, 1, [[1], [2], [3]]);
        }
    );

    function checkArrayCombinations(min, max, expected) {
        const array = [1, 2, 3];
        const combinations = Helpers.findAllCombinations(array, min, max);
        expect(combinations).toEqual(expected);
    }

    it('tests the merging of entries of a given array into a given set', async function () {
        const array = [1, 2, 3, 4];
        checkIntoSetMerging(array);
    });

    it('tests the merging of entries of a given array into a given set', async function () {
        const set = new Set([1, 2, 3, 4]);
        checkIntoSetMerging(set);
    });

    function checkIntoSetMerging(container) {
        const set = new Set([1]);
        Helpers.mergeIntoSet(set, container);
        const expectedSet = new Set([1, 2, 3, 4]);
        expect(set).toEqual(expectedSet);
    }

    it('tests the merging of entries of a given array into a given set', async function () {
        const array = [2, 3];
        checkFromSetDeletion(array);
    });

    it('tests the merging of entries of a given array into a given set', async function () {
        const set = new Set([2, 3]);
        checkFromSetDeletion(set);
    });

    function checkFromSetDeletion(container) {
        const set = new Set([1, 2, 3]);
        Helpers.deleteFromSet(set, container);
        const expectedSet = new Set([1]);
        expect(set).toEqual(expectedSet);
    }

    it('tests whether two sets are unique of each other (no element of one set contained within' +
        ' the other)', async function () {
        const set = new Set([2, 3]);
        checkSetsUniqueness(set, true);
    });

    it('tests whether two sets are not unique of each other (no element of one set contained' +
        ' within the other)', async function () {
        const set = new Set([2, 4]);
        checkSetsUniqueness(set, false);
    });


    function checkSetsUniqueness(set1, expected) {
        const set2 = new Set([1, 4]);
        const unique = Helpers.areSetsUnique(set1, set2);
        expect(unique).toBe(expected);
    }

    it('tests whether two sets contain exactly the same elements', async function () {
        const set = new Set([
            1, 4
        ]);
        checkSetsAreSame(set, true);
    });

    it('tests whether two sets do not contain exactly the same elements', async function () {
        const set = new Set([2, 4]);
        checkSetsAreSame(set, false);
    });

    it(
        'tests whether two sets contain exactly the same elements but having differnt lengths',
        async function () {
            const set = new Set([1, 4, 5]);
            checkSetsAreSame(set, false);
        }
    );

    function checkSetsAreSame(set1, expected) {
        const set2 = new Set([1, 4]);
        const unique = Helpers.areSetsTheSame(set1, set2);
        expect(unique).toBe(expected);
    }

    it('tests the calculation the symmetric difference of two sets', async function () {
        const set1 = new Set([2, 4]);
        const set2 = new Set([1, 4]);
        const set3 = Helpers.getUniqueEntriesOfTwoSets(set1, set2);
        const expectedSet = new Set([1, 2]);
        expect(set3).toEqual(expectedSet);
    });

    it('tests the calculation of the intersection of two sets', async function () {
        const set1 = new Set([2, 4]);
        const set2 = new Set([1, 4]);
        const set3 = Helpers.getIntersectionOfTwoSets(set1, set2);
        const expectedSet = new Set([4]);
        expect(set3).toEqual(expectedSet);
    });

    it('tests the rounding of a value to a given decimal precision', async function () {
        const roundedValue = Helpers.round(1.1234567, 3);
        expect(roundedValue).toEqual(1.124);
    });

    it('tests the creation of a nested entry inside an object given two keys (inverted kes)',
        async function () {
            checkOrderedObjEntryCreation(2, 1)
        }
    );

    it('tests the creation of a nested entry inside an object given two keys', async function () {
        checkOrderedObjEntryCreation(1, 2)
    });

    function checkOrderedObjEntryCreation(key1, key2) {
        const obj = {};
        Helpers.makeOrderedObjEntry(obj, key1, key2, 'test');
        expect(obj).toEqual({1: {2: 'test'}});
    }

    it('tests the searching of entry in nested object of depth 2 (inverted keyd)',
        async function () {
            checkOrderedObjEntrySearch(2, 1);
        }
    );

    it('tests the searching of entry in nested object of depth 2', async function () {
        checkOrderedObjEntrySearch(1, 2);
    });

    function checkOrderedObjEntrySearch(key1, key2) {
        const obj = {1: {2: 'test'}};
        const entry = Helpers.getOrderedObjEntry(obj, key1, key2);
        expect(entry).toEqual('test');
    }

    it('given two sets of two values tests the finding of a common value', async function () {
        expect(Helpers.findShared(1, 2, 1, 3)).toEqual({shared: 1, leftFirst: 2, leftSecond: 3});
        expect(Helpers.findShared(1, 1, 1, 3)).toEqual({shared: 1, leftFirst: 1, leftSecond: 3});
        expect(Helpers.findShared(1, 1, 1, 1)).toEqual({shared: 1, leftFirst: 1, leftSecond: 1});
    });

    it('given two sets of two values tests the finding of a common value', async function () {
        const stringArray = ['test1', 'test2', 'test3'];
        const concatString = Helpers.orderedStringFromArr(stringArray);
        expect(concatString).toEqual('test1, test2 and test3.');
    });

    it(
        'tests the translation of polygon (defined by its coordinates) to a not existing path (svg)',
        async function () {
            checkSvgPathCreation('', 'M0 0 L1 1 L1 0 L 0 0')
        }
    );

    it(
        'tests the translation of polygon (defined by its coordinates) to a existing path (svg)',
        async function () {
            checkSvgPathCreation('...', '...M0 0 L1 1 L1 0 L 0 0')
        }
    );

    function checkSvgPathCreation(startPath, expected) {
        const coordinates = [{x: 0, y: 0}, {x: 1, y: 1}, {x: 1, y: 0}];
        const stringPath = Helpers.addFormToPath(coordinates, startPath);
        expect(stringPath).toEqual(expected);
    }

    it('tests that two values do not differ by more than a given tolerance (default)',
        async function () {
            expect(Helpers.isAlmostEqual(1.000001, 1.0000005)).toEqual(true);
        }
    );

    it('tests that two values do not differ by more than a given tolerance' +
        ' (tolerance=difference)', async function () {
        expect(Helpers.isAlmostEqual(1, 2, 1)).toEqual(false);
    });

    it('tests that two values do not differ by more than a given tolerance (to low)',
        async function () {
            expect(Helpers.isAlmostEqual(1, 2, 0.5)).toEqual(false);
        }
    );

    it('tests the deep cloning of an object', async function () {
        const obj = {a: 'test', b: [{c: 'test'}]};
        const clone = Helpers.deepCloneObject(obj);
        expect(clone).not.toBe(obj);
    });
});