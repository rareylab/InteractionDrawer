/**
 * Drawer that uses scene JSON and change objects for manipulation of the draw area
 * in context of the browsing of the history.
 */
class HistoryDrawer {
    /**
     * Contains instances for configuration options and data storage/access, draw area manipulation.
     * Sets up the history and the possibility to add optional callbacks.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     * @param structureDrawer {Object} - drawer for structures
     */
    constructor(opts, sceneData, structureDrawer) {
        this.opts = opts;
        this.sceneData = sceneData;
        this.structureDrawer = structureDrawer;

        this.history = new History(opts.historyCanClearScene);
        this.jsonBuilder = new JsonBuilder(sceneData, opts);
        //optionally set by the user
        this.sceneChangeCallback = null;
        this.colorCallback = null;
        this.optsCallback = null;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds a new step to the drawer's history.
     *
     * @param historyStep {HistoryStep} - object detailing the next history
     * step so far
     * @param addedStructureIds {Array} - ids of structure objects added in
     * last history step (can and often will be empty)
     */
    applyStepToHistory(historyStep, addedStructureIds) {
        const curStep = this.history.curStep;
        for (const time in this.sceneData.structuresData.addTimesToStructure) {
            if (time > curStep) {
                this.sceneData.structuresData.addTimesToStructure[time].forEach(structureId => {
                    this.removeStructureFromOtherStructures(structureId);
                    delete this.sceneData.structuresData.structures[structureId];
                    delete this.sceneData.structuresData.originalStructures[structureId];
                    this.sceneData.structuresData.structuresInUse.delete(structureId);
                    this.structureDrawer.purgeStructureFromCache(structureId);
                });
                delete this.sceneData.structuresData.addTimesToStructure[time];
            }
        }
        //structure purge done here, add changes to track in history
        if (addedStructureIds.length > 0) {
            this.sceneData.structuresData.addTimesToStructure[curStep + 1] = addedStructureIds;
        }
        this.history.removeFurtherSteps();
        historyStep.opts = Helpers.deepCloneObject(this.opts);
        this.history.addNewStep(historyStep);
        //call callbacks where necessary
        this.execActionBasedCallbacks(this.history.getCurStep().actions);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Executes the bound sceneChangeCallback with JSON string data detailing
     * the current state of the scene.
     */
    callSceneChangeCallback() {
        if (this.sceneChangeCallback) {
            this.sceneChangeCallback(this.jsonBuilder.getJson());
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Executes the bound colorCallback with JSON string data detailing the
     * current state of the scene.
     */
    callColorCallback() {
        if (this.colorCallback) {
            this.colorCallback(this.jsonBuilder.getJson());
        }
    };

    /*----------------------------------------------------------------------*/

    /**
     * Based on an 'actions' set describing how the scene changed during a
     * recent change, calls necessary callbacks bound to the drawer.
     *
     * @param actions {Set} - actions performed on the scene during recent
     * change
     */
    execActionBasedCallbacks(actions) {
        actions.forEach(action => {
            if (action === 'sceneChange') {
                this.callSceneChangeCallback();
            } else if (action === 'colorChange') {
                this.callColorCallback();
            }
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets back the history by one step, reverting all changes made in that
     * step.
     */
    revertHistory() {
        if (!this.history.canRevert()) {
            return;
        }

        const {changes: lastChanges, actions} = this.history.getCurStep();
        lastChanges.forEach(change => {
            change.revert();
        });
        this.execActionBasedCallbacks(actions);

        this.history.revert();
        if (this.optsCallback) {
            this.optsCallback(this.history.getCurStep().opts);
        }
        let emptyScene = true;
        for (const structureId in this.sceneData.structuresData.structures) {
            const structure = this.sceneData.structuresData.structures[structureId];
            if (!structure.hidden && structure.enabled) {
                emptyScene = false
            }
        }
        if (emptyScene && this.history.canRevert()) {
            const {changes: lastChanges, actions} = this.history.getCurStep();
            lastChanges.forEach(change => {
                change.revert();
            });
            this.execActionBasedCallbacks(actions);

            this.history.revert();
            if (this.optsCallback) {
                this.optsCallback(this.history.getCurStep().opts);
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Advances the history by one step, applying all changes made in that step.
     */
    advanceHistory() {
        if (!this.history.canAdvance()) {
            return;
        }

        this.history.advance();

        const {changes: nextChanges, actions, opts} = this.history.getCurStep();
        nextChanges.forEach(change => {
            change.apply();
        });
        this.execActionBasedCallbacks(actions);
        if (this.optsCallback) {
            this.optsCallback(opts);
        }
        let emptyScene = true;
        for (const structureId in this.sceneData.structuresData.structures) {
            const structure = this.sceneData.structuresData.structures[structureId];
            if (!structure.hidden && structure.enabled) {
                emptyScene = false
            }
        }
        if (emptyScene && this.history.canAdvance()) {
            this.history.advance();

            const {changes: nextChanges, actions, opts} = this.history.getCurStep();
            nextChanges.forEach(change => {
                change.apply();
            });
            this.execActionBasedCallbacks(actions);
            if (this.optsCallback) {
                this.optsCallback(opts);
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * On a given structural container (Structure or InteractionDrawer), updates
     * its boundary information based on logged change information.
     *
     * @param structure {Structure/SceneData} - container to
     * update boundaries for
     * @param maxes {BoundaryUpdateInfo} - information on how boundaries of
     * this structure have changed during the last history step
     * @param boundaryName {String} - name of the class field containing the
     * boundary information
     * @param setBoundFnName {String} - name of the class field containing
     * the function to set boundary information
     * @param historyStep {HistoryStep} - object detailing the next history
     * step so far
     */
    setNewLimits(structure, maxes, boundaryName, setBoundFnName, historyStep) {
        let changed = false;
        for (const limitId in maxes) {
            if (maxes[limitId].changeDir) {
                changed = true;
                break;
            }
        }
        if (!changed) {
            return;
        }

        const oldBounds = structure[boundaryName];
        structure[setBoundFnName]();
        this.setNewLimitsToHistory(structure, oldBounds, boundaryName, historyStep);
    }

    /*----------------------------------------------------------------------*/

    /**
     * On a given structural container (Structure or InteractionDrawer), logs its
     * updated boundary information to a given history.
     *
     * @param structure {Structure} - structure container to
     * update boundaries for
     * @param oldBounds {Object} - old boundaries of the structure. Has to contain
     * xMin, xMax, yMin, and yMax
     * @param boundaryName {String} - name of the class field containing the
     * boundary information
     * @param historyStep {HistoryStep} - object detailing the next history
     * step so far
     */
    setNewLimitsToHistory(structure, oldBounds, boundaryName, historyStep) {
        const newBounds = structure[boundaryName];
        const boundChange = new Change();
        const setNew = () => {
            structure[boundaryName] = newBounds;
        };
        const reset = () => {
            structure[boundaryName] = oldBounds;
        };
        boundChange.bindApply(setNew);
        boundChange.bindRevert(reset);
        historyStep.addChange(boundChange);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Cleanup step that removes e.g. connection data of one structure from all other structures.
     * E.g. if an added structure and interaction are removed by browsing back in the history and
     * another structure is added afterwards removing the first two objects from the history.
     *
     * @param structureId {Number} - id of the structure
     */
    removeStructureFromOtherStructures(structureId) {
        const structure = this.sceneData.structuresData.structures[structureId];
        const {
            distances,
            interactions,
            atomPairInteractions,
            piStackings,
            cationPiStackings
        } = structure.getConnectedElements();
        for (const otherStructureId in this.sceneData.structuresData.structures) {
            const otherStructure = this.sceneData.structuresData.structures[otherStructureId];
            if (parseInt(structureId) === parseInt(otherStructureId)) {
                continue;
            }
            for (const interactionId of atomPairInteractions) {
                otherStructure.intermolecularConnectionData.ids.atomPairInteractions.delete(
                    interactionId
                );
            }
            for (const interactionId of atomPairInteractions) {
                otherStructure.intermolecularConnectionData.ids.atomPairInteractions.delete(
                    interactionId
                );
            }
            for (const interactionId of cationPiStackings) {
                otherStructure.intermolecularConnectionData.ids.cationPiStackings.delete(
                    interactionId
                );
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the history.
     */
    reset() {
        this.history = new History(this.opts.historyCanClearScene);
    }
}