describe('InteractionDrawer InteractionTracking BoundaryUpdateInfo', function () {

    beforeEach(function () {
        globalLimits = {
            xMin: 0, xMax: 1, yMin: 0, yMax: 1
        };
        boundaryUpdateInfo = new BoundaryUpdateInfo(globalLimits);
    });

    it(
        'tests the marking of boundaries changes based on old and new boundaries',
        async function () {
            expect(boundaryUpdateInfo.xMin).toEqual({changeDir: 0, val: 0});
            expect(boundaryUpdateInfo.xMax).toEqual({changeDir: 0, val: 1});
            expect(boundaryUpdateInfo.yMin).toEqual({changeDir: 0, val: 0});
            expect(boundaryUpdateInfo.yMax).toEqual({changeDir: 0, val: 1});
            const newGlobalLimits = {
                xMin: 0, xMax: 2, yMin: 0, yMax: 2
            };
            boundaryUpdateInfo.updateMaxesByLimits(globalLimits, newGlobalLimits);
            //changeDir: 0 -> no change, 1 -> new max/min was found
            //-1 -> uncertain about current max/min, marked for required recalculation
            expect(boundaryUpdateInfo.xMin).toEqual({changeDir: 1, val: 0});
            expect(boundaryUpdateInfo.xMax).toEqual({changeDir: 1, val: 2});
            expect(boundaryUpdateInfo.yMin).toEqual({changeDir: 1, val: 0});
            expect(boundaryUpdateInfo.yMax).toEqual({changeDir: 1, val: 2});
        }
    );

    it('tests the setting of boundaries based on new boundaries', async function () {
        boundaryUpdateInfo.setMaxesAdd(1, 2, -1, 0);
        expect(boundaryUpdateInfo.xMin.val).toEqual(0); // 1 is not smaller than 0
        expect(boundaryUpdateInfo.xMax.val).toEqual(2); // 2 ist larger than 1
        expect(boundaryUpdateInfo.yMin.val).toEqual(-1); // -1 is smaller than 0
        expect(boundaryUpdateInfo.yMax.val).toEqual(1); // 0 is not larger than 1
    });

    it(
        'tests the marking of changes to a specific boundary based on its old and new value',
        async function () {
            expect(boundaryUpdateInfo.xMax).toEqual({changeDir: 0, val: 1});
            boundaryUpdateInfo.updateMaxes('xMax', globalLimits.yMax, 2, true);
            expect(boundaryUpdateInfo.xMax).toEqual({changeDir: 1, val: 2});
        }
    );

    it('tests the marking of not valid changes to a specific boundary based on its old and new' +
        ' value', async function () {
        expect(boundaryUpdateInfo.xMax).toEqual({changeDir: 0, val: 1});
        boundaryUpdateInfo.updateMaxes('xMax', globalLimits.yMax, 0, true);
        expect(boundaryUpdateInfo.xMax).toEqual({changeDir: -1, val: 1});
    });

    it('tests the setting of a new maximum/minimum of a boundary and marking of the corresponding' +
        ' changeDir', async function () {
        const toUpdate = boundaryUpdateInfo.updateMaxesLim('xMax', 2, true);
        expect(toUpdate).toEqual(true);
        expect(boundaryUpdateInfo.xMax.changeDir).toEqual(1);
    });

    it('tests the setting of a new and not valid maximum/minimum of a boundary and marking of the' +
        ' corresponding changeDir', async function () {
        const toUpdate = boundaryUpdateInfo.updateMaxesLim('xMax', 0, true);
        expect(toUpdate).toEqual(false);
        expect(boundaryUpdateInfo.xMax.changeDir).toEqual(0);
    });

    it('tests the setting of a not valid maximum/minimum of a boundary and marking of the' +
        ' corresponding changeDir', async function () {
        //tests if changeDir is 0 and if val did not change
        boundaryUpdateInfo.updateMaxesNeg('xMax', 1, true);
        expect(boundaryUpdateInfo.xMax.changeDir).toEqual(-1);
    });

    it('tests the updating of tracking information for a certain boundary', async function () {
        boundaryUpdateInfo.setMaxesLim('xMax', 2);
        expect(boundaryUpdateInfo.xMax.val).toEqual(2);
    });

    it('tests the marking of a certain boundary for necessary recalculation', async function () {
        boundaryUpdateInfo.setMaxesNeg('xMax');
        expect(boundaryUpdateInfo.xMax.changeDir).toEqual(-1);
    });
});