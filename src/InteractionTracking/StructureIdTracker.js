/**
 * Class representing a container to track which unique ids belong to certain
 * outer (structure) ids.
 */
class StructureIdTracker {
    /**
     * Create a new StructureIdTracker object.
     */
    constructor() {
        this.container = {};
    }

    /*----------------------------------------------------------------------*/

    /**
     * Check if anything is currently tracked in the container.
     */
    hasEntries() {
        return Object.keys(this.container).length > 0;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Note that a unique id belongs to a given structure id.
     *
     * @param structureId {Number} - structure id the given id belongs to
     * @param id {Number} - the unique id
     */
    addID(structureId, id) {
        if (!this.container.hasOwnProperty(structureId)) {
            this.container[structureId] = new Set();
        }
        this.container[structureId].add(id);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Check if a unique id belongs to a given structure id.
     *
     * @param structureId {Number} - structure id the given id belongs to
     * @param id {Number} - the unique id
     */
    hasID(structureId, id) {
        if (!this.container.hasOwnProperty(structureId)) {
            return false;
        }
        return this.container[structureId].has(id);
    }
}