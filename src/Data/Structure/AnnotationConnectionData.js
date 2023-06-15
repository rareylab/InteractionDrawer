/**
 * Stores data about all annotations of one structure present in the scene.
 */
class AnnotationConnectionData {
    /**
     * Contains instances with data about Annotation objects connected to this structure.
     */
    constructor() {
        //Annotation object ids
        this.annotations = new Set();
        //Atom object id -> Annotation objects ids
        this.atomAnnotationConnections = {};
    }

    /*----------------------------------------------------------------------*/

    /**
     * Gets the annotations linked to given atom ids.
     *
     * @param atomArr {Array} - atom ids to find linked annotations for
     */
    getAnnotationsForAtoms(atomArr) {
        const annotations = new Set();
        for (const atomId of atomArr) {
            if (!this.atomAnnotationConnections.hasOwnProperty(atomId)) {
                continue;
            }
            Helpers.mergeIntoSet(annotations, this.atomAnnotationConnections[atomId]);
        }
        return annotations;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Memorizes that an annotation (by id) belongs to this structure.
     *
     * @param annotationId {Number} - id of annotation
     */
    addAnnotation(annotationId) {
        this.annotations.add(annotationId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Memorizes that an annotation is linked to an atom of the structure
     * (consequently, interaction that affects the atom must also affect this
     * annotation).
     *
     * @param atomId {Number} - unique id of the atom to link to
     * @param annotationId {Number} - unique id of the linked annotation
     */
    linkAtomToAnnotation(atomId, annotationId) {
        if (!this.atomAnnotationConnections.hasOwnProperty(atomId)) {
            this.atomAnnotationConnections[atomId] = new Set();
        }
        this.atomAnnotationConnections[atomId].add(annotationId);
    }
}