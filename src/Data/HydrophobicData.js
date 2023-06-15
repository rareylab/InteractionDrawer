/**
 * Stores data about all hydrophobic contacts (Spline objects) present in the scene.
 */
class HydrophobicData {
    /**
     * Contains objects for the storing of Spline objects for of hydrophobic contacts.
     */
    constructor() {
        //id of hydrophobic contact -> Spline
        this.hydrophobicContacts = {};
        this.originalHydrophobicContacts = {};
    }
}