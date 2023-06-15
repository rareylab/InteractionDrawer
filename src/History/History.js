/**
 * Class to manage the drawer's history (keeping track of changes made).
 */
class History {
    /**
     * Creates a new instance.
     *
     * @param canClearScene {Boolean} - whether the drawer allows the history
     * to revert to its initial clean state (and thus emptying the scene)
     */
    constructor(canClearScene) {
        this.canClearScene = canClearScene;
        this.steps = [];
        this.curStep = -1;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds a step to the history's steps array.
     *
     * @param step {HistoryStep} - step to add to the history
     */
    addNewStep(step) {
        this.steps.push(step);
        this.curStep++;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes all steps from the history's steps array after the current step.
     */
    removeFurtherSteps() {
        this.steps = this.steps.slice(0, this.curStep + 1);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Get the current history step.
     *
     * @returns {HistoryStep} - the current history step
     */
    getCurStep() {
        return this.steps[this.curStep];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Check whether any further steps exist after the current history step.
     *
     * @returns {Boolean} - whether any further steps exist
     */
    canAdvance() {
        return this.curStep + 1 !== this.steps.length;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Advances the current history step by 1.
     */
    advance() {
        this.curStep++;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks whether the history can be reverted by 1.
     *
     * @returns {Boolean} - whether the history can be reverted
     */
    canRevert() {
        return this.curStep >= (this.canClearScene ? 0 : 1);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Reverts the current history step by 1.
     */
    revert() {
        this.curStep--;
    }
}

/*----------------------------------------------------------------------*/

/**
 * Class to represent a single step of the drawer's history.
 */
class HistoryStep {
    /**
     * Creates a new history step instance.
     */
    constructor() {
        this.changes = [];
        this.actions = new Set();
        this.opts;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds a change made during this history step.
     *
     * @param change {Change} - object detailing functions to execute to
     * perform/revert the desired change
     */
    addChange(change) {
        this.changes.push(change);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds multiple changes made during this history step.
     *
     * @param changes {Array} - array of Change objects detailing functions to
     * execute/revert the desired change
     */
    addChanges(changes) {
        Array.prototype.push.apply(this.changes, changes);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Mark in the actions array that a certain type of change happened during
     * this history step.
     *
     * @param action {String} - the type of action to mark
     */
    addAction(action) {
        this.actions.add(action);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks whether any changes were made during this history step.
     *
     * @returns {Boolean} - whether any changes were made
     */
    hasChanges() {
        return this.changes.length > 0;
    }
}