/**
 * Stores structural data about all intermolecular connections present in the scene.
 */
class IntermolecularData {
    /**
     * Contains objects for the storing of IntermolecularEdge objects of various types.
     */
    constructor() {
        this.atomPairInteractions = {};
        this.piStackings = {};
        this.cationPiStackings = {};
        this.distances = {};
        this.interactions = {};
        //sets of IntermolecularEdge object ids
        this.selectedIntermolecular = {
            atomPairInteractions: new Set(),
            piStackings: new Set(),
            cationPiStackings: new Set(),
            distances: new Set(),
            interactions: new Set()
        };
        this.intermolecularTypes = [
            'interactions', 'distances', 'atomPairInteractions', 'piStackings', 'cationPiStackings'
        ];
        this.ptopNames = ['distances', 'interactions'];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets the IntermolecularEdge (e.g. atom pair interaction, pi stacking,
     * cation pi stacking) object by type and id.
     *
     * @param type {IntermolecularType} - type of the connection
     * @param id {Number} - id of the connection
     * @return {Object} - the connection object
     */
    getIntermolecularByType(type, id) {
        if (this[type].hasOwnProperty(id)) {
            return this[type][id];
        }
        return null;
    }
}