/**
 * Class to log a specific change made to certain aspects of a drawing scene
 * via provided callbacks (to do/undo this change). Callbacks are bound to the
 * apply() and revert() functions of this object.
 */
class Change {
    /**
     * Creates a new Change object.
     */
    constructor() {
        this.apply = () => {
        };
        this.revert = () => {
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Binds function to execute the change to this.apply().
     *
     * @param callbackFn {Function} - callback to execute change
     * @param params {Object} - optional parameter, to be used in provided
     * callbacks.
     */
    bindApply(callbackFn, params = null) {
        if (params) {
            this.apply = () => callbackFn(params);
        } else {
            this.apply = callbackFn;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Binds function to undo the change to this.revert().
     *
     * @param callbackFn {Function} - callback to undo change
     * @param params {Object} - optional parameter, to be used in provided
     * callbacks.
     */
    bindRevert(callbackFn, params = null) {
        if (params) {
            this.revert = () => callbackFn(params);
        } else {
            this.revert = callbackFn;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Shorthand to bind function to both this.apply() and this.revert().
     *
     * @param callbackFn {Function} - callback to both execute and undo change
     */
    bindApplyRevert(callbackFn) {
        this.bindApply(callbackFn);
        this.bindRevert(callbackFn);
    }
}

/*----------------------------------------------------------------------*/

/**
 * Special type of change which affects changes to the DOM.
 */
class DomChange {
    /**
     * Creates a new DomChange object.
     *
     * @param isAdd {Boolean} - whether this change adds an element to the
     * DOM, or is a removal change
     */
    constructor(isAdd) {
        this.isAdd = isAdd;
        this.apply = () => {
        };
        this.revert = () => {
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Binds functions to add/remove elements from the DOM. Association of
     * callbacks to this.apply() or this.remove() is decided by the this.isAdd
     * parameter.
     *
     * @param addCallback {Function} - callback to add element to the DOM
     * @param remCallback {Function} - callback to remove element from DOM
     */
    bindApplyRevert(addCallback, remCallback) {
        const add = () => {
            addCallback();
        };
        const remove = () => {
            remCallback();
        };

        this.apply = this.isAdd ? add : remove;
        this.revert = this.isAdd ? remove : add;
    }
}