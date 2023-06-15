/**
 * Stores data about all annotations present in the scene.
 */
class AnnotationsData {
    /**
     * Contains objects for the storing of Annotation objects.
     */
    constructor() {
        //Annotation object id -> Annotation Object
        this.annotations = {};
        this.originalAnnotations = {};
        //Annotation object ids
        this.selectedAnnotations = new Set();
    }
}