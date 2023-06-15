describe('InteractionDrawer History Change', function () {

    it('tests the apply/revert functionality of a Change object', async function () {
        const change = new Change();
        const testArray = [2];
        const apply = (param) => {
            testArray.pop();
            testArray.push(param);
        };
        const revert = (param) => {
            testArray.pop();
            testArray.push(param);
        };
        change.bindApply(apply, 1);
        change.bindRevert(revert, 2);
        change.apply();
        expect(testArray).toEqual([1]);
        change.revert();
        expect(testArray).toEqual([2]);
        testArray.pop();
        const applyRevert = () => {
            testArray.push(5)
        };
        change.bindApplyRevert(applyRevert);
        change.apply();
        expect(testArray).toEqual([5]);
        change.revert();
        expect(testArray).toEqual([5, 5]);
    });
});

describe('DomChange', function () {

    it(
        'tests the apply/revert functionality of a DomChange object (apply: add)',
        async function () {
            const isAdd = true;
            const testArray = [];
            testDomChange(testArray, isAdd, 1, 0);
        }
    );

    it(
        'tests the apply/revert functionality of a DomChange object (apply: remove)',
        async function () {
            const isAdd = false;
            const testArray = [1];
            testDomChange(testArray, isAdd, 0, 1);
        }
    );

    function testDomChange(testArray, isAdd, expectedApply, expectedRevert) {
        const change = new DomChange(isAdd);
        expect(change.isAdd).toEqual(isAdd);
        const apply = () => {
            testArray.push(1);
        };
        const revert = () => {
            testArray.pop();
        };
        change.bindApplyRevert(apply, revert);
        change.apply();
        expect(testArray.length).toEqual(expectedApply);
        change.revert();
        expect(testArray.length).toEqual(expectedRevert);
    }
});