describe('InteractionDrawer History HistoryStep', function () {

    it('tests the adding of a Change object to a HistoryStep object', async function () {
        const historyStep = new HistoryStep();
        const change = new Change();
        historyStep.addChange(change);
        expect(historyStep.changes.length).toEqual(1);
    });

    it('tests the adding of multiple Change objects to a HistoryStep object', async function () {
        const historyStep = new HistoryStep();
        const change1 = new Change();
        const change2 = new Change();
        historyStep.addChanges([change1, change2]);
        expect(historyStep.changes.length).toEqual(2);
    });

    it('tests the adding of an action to a HistoryStep object', async function () {
        const historyStep = new HistoryStep();
        const action = 'test';
        historyStep.addAction(action);
        //actions is a set
        historyStep.addAction(action);
        expect(historyStep.actions.size).toEqual(1);
    });

    it('tests if a HistoryStep object has changes', async function () {
        const historyStep = new HistoryStep();
        const change = new Change();
        historyStep.addChange(change);
        expect(historyStep.hasChanges()).toEqual(true);
    });
});

describe('History', function () {

    it('tests the adding of HistoryStep object to a History object', async function () {
        const history = new History(true);
        const historyStep = new HistoryStep();
        history.addNewStep(historyStep);
        expect(history.steps.length).toEqual(1);
        expect(history.curStep).toEqual(0);
    });

    it('tests the removing of HistoryStep objects after the current one', async function () {
        const history = new History(true);
        const historyStep1 = new HistoryStep();
        const historyStep2 = new HistoryStep();
        const historyStep3 = new HistoryStep();
        history.addNewStep(historyStep1);
        history.addNewStep(historyStep2);
        history.addNewStep(historyStep3);
        expect(history.steps.length).toEqual(3);
        history.curStep = 1;
        history.removeFurtherSteps();
        expect(history.steps.length).toEqual(2);
    });

    it('tests getter of the current HistoryStep object', async function () {
        const history = new History(true);
        const historyStep = new HistoryStep();
        historyStep.addChange(1);
        history.addNewStep(historyStep);
        expect(history.getCurStep()).toEqual(historyStep);
    });

    it('tests whether any further steps exist after the current history step', async function () {
        const history = new History(true);
        expect(history.canAdvance()).toEqual(false);
        const historyStep = new HistoryStep();
        history.addNewStep(historyStep);
        history.curStep -= 1;
        expect(history.canAdvance()).toEqual(true);
    });

    it('tests HistoryStep advance functionality of History object', async function () {
        const history = new History(true);
        history.advance();
        expect(history.curStep).toEqual(0);
    });

    it('tests whether the history can be reverted by 1', async function () {
        const history = new History(true);
        expect(history.canRevert()).toEqual(false);
        const historyStep = new HistoryStep();
        history.addNewStep(historyStep);
        expect(history.canRevert()).toEqual(true);
    });

    it('tests the HistoryStep revert functionality of History object', async function () {
        const history = new History(true);
        history.revert();
        expect(history.curStep).toEqual(-2);
    });
});