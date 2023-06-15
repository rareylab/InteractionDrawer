/**
 * Drawer that uses other drawers for the visualization of the various types
 * of structure representation.
 */
class StructureRepresentationDrawer {
    /**
     * Contains instances for configuration options, data storage/access and draw area manipulation.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     * @param annotationDrawer {Object} - drawer for annotations
     * @param intermolecularDrawer {Object} - drawer for intermolecular edges
     * @param structureDrawer {Object} - drawer for structures
     */
    constructor(opts, sceneData, annotationDrawer, intermolecularDrawer, structureDrawer) {
        this.opts = opts;
        this.sceneData = sceneData;
        this.annotationDrawer = annotationDrawer;
        this.intermolecularDrawer = intermolecularDrawer;
        this.structureDrawer = structureDrawer;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets the initial representation of recently added structures.
     *
     * @param structureInfos {Array} - draw information for the different
     * added structures
     */
    setInitialStructureRepresentation(structureInfos) {
        structureInfos.forEach((structureInfo) => {
            if (!structureInfo.hasOwnProperty('id') ||
                !this.sceneData.structuresData.structures.hasOwnProperty(structureInfo.id)) {
                return;
            }
            const structure = this.sceneData.structuresData.structures[structureInfo.id];
            if (structureInfo.representation) {
                structure.representationsData.currentRepresentation = structureInfo.representation;
                this.changeStructureRepresentationByIds(structure.id, structureInfo.representation);
            } else {
                const representations = this.opts.allowedStructureRepresentations[structure.structureType] ||
                    this.opts.allowedStructureRepresentations.default;
                for (const rep of representations) {
                    if (structure.representationsData.hasRepresentation(rep)) {
                        this.changeStructureRepresentationByIds(structure.id, rep);
                        return
                    }
                }
            }
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Changes the representation of all structures with a specific structure type
     * to a given representation.
     *
     * @param structureType {String} - change the representation off all
     * structures with this type
     * @param representation {string|StructureRepresentation} - the representation
     * to display. Either give a value of a StructureRepresentation object (e.g.
     * 'StructureRepresentation.default') or a string which should be a valid key
     * of a StructureRepresentation object (e.g. 'default')
     */
    changeStructureRepresentationByType(structureType,
        representation = StructureRepresentation.default
    ) {
        if (StructureRepresentation.hasOwnProperty(representation)) {
            representation = StructureRepresentation[representation];
        } else if (!Object.values(StructureRepresentation).includes(representation)) {
            return;
        }

        const structures = Object.values(this.sceneData.structuresData.structures)
            .filter(struct => struct.structureType === structureType);
        const structureIds = structures.map(struct => struct.id);
        this.changeStructureRepresentationByIds(structureIds, representation);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Changes the representation of a structure to a given representation.
     *
     * @param structureId {(number|number[])} - id(s) of structure
     * @param representation {string|StructureRepresentation} - the representation
     * to display. Either give a value of a StructureRepresentation object (e.g.
     * 'StructureRepresentation.default') or a string which should be a valid key
     * of a StructureRepresentation object (e.g. 'default')
     */
    changeStructureRepresentationByIds(structureId,
        representation = StructureRepresentation.default
    ) {
        if (typeof representation === 'string' &&
            StructureRepresentation.hasOwnProperty(representation)) {
            representation = StructureRepresentation[representation];
        } else if (!Object.values(StructureRepresentation).includes(representation)) {
            console.log('representation ' + representation + ' is invalid');
            return;
        }

        if (Array.isArray(structureId)) {
            for (const id of structureId) {
                this.changeStructureRepresentationByIds(id, representation);
            }
            return;
        }

        if (this.sceneData.structuresData.structures.hasOwnProperty(structureId)) {
            const structure = this.sceneData.structuresData.structures[structureId];
            if (structure.representationsData.hasRepresentation(representation)) {
                if (structure.representationsData.curRepresentation() !== representation) {
                    this.structureDrawer.unselectStructure(structureId);
                    const annotationsToDeselect = Object.values(this.sceneData.annotationsData.annotations)
                        .filter(annotation => annotation.structureLink === structureId &&
                            annotation.isStructureLabel);
                    for (const annotation of annotationsToDeselect) {
                        this.annotationDrawer.unselectAnnotationDrawareaContainer(annotation.id,
                            false,
                            false
                        )
                    };
                }
                structure.representationsData.changeInternalRepresentation(representation);
                if (structure.hidden) {
                    return;
                }
                //show/hide svg elements
                const hiddenStructures = this.sceneData.structuresData.getHiddenStructures();
                this.structureDrawer.showHideStructureParts(structureId,
                    {full: true},
                    hiddenStructures,
                    true
                );
                if (representation === StructureRepresentation.default) {
                    this.hideStructureCircleRepresentation(structureId);
                } else if (representation === StructureRepresentation.circle) {
                    this.hideDefaultRepresentation(structureId);
                }
                this.updateAnnotationPositions(structureId, representation);

                //redraw intermolecular
                const {
                    distances, interactions, atomPairInteractions, piStackings, cationPiStackings
                } = structure.getConnectedElements();
                this.intermolecularDrawer.updateAllIntermolecular(distances,
                    interactions,
                    atomPairInteractions,
                    piStackings,
                    cationPiStackings,
                    true
                );
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates annotation positions after changing to a new structure representation.
     *
     * @param structureId {(number|number[])} - id(s) of structure
     * @param structureRepresentation {string|StructureRepresentation} - the representation
     * to display. Either give a value of a StructureRepresentation object (e.g.
     * 'StructureRepresentation.default') or a string which should be a valid key
     * of a StructureRepresentation object (e.g. 'default')
     */
    updateAnnotationPositions(structureId, structureRepresentation) {
        const annotationsToMove = Object.values(this.sceneData.annotationsData.annotations)
            .filter(annotation => annotation.structureLink === structureId &&
                !annotation.isStructureLabel);
        for (const annotation of annotationsToMove) {
            const offsets = VectorCalculation.vectorizeLine(annotation.coordinates,
                annotation.structureRepresentationInfo[structureRepresentation].coordinates
            );
            this.annotationDrawer.moveAnnotation(annotation.id, offsets, false);
            this.annotationDrawer.updateAnnotationLimitsSelectors(annotation);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hides the structure circle representation of a structure.
     *
     * @param structureId {(number|number[])} - id of structure
     */
    hideStructureCircleRepresentation(structureId) {
        const hideParts = {
            structureCircle: true
        };
        this.structureDrawer.showHideStructureParts(structureId, hideParts, [], false);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hides the by config set default representation of a structure.
     *
     * @param structureId {(number|number[])} - id of structure
     */
    hideDefaultRepresentation(structureId) {
        const hideParts = {
            atoms: true, bonds: true, hydrophobic: true
        };
        this.structureDrawer.showHideStructureParts(structureId, hideParts, [], false);
        this.annotationDrawer.hideAnnotations(Object.values(this.sceneData.annotationsData.annotations)
            .filter(annotation => annotation.structureLink === structureId &&
                annotation.isStructureLabel)
            .map(annotation => annotation.id));
        this.structureDrawer.updateVisibility();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Toggle the visibility of one or multiple structures, their interactions and
     * annotations.
     *
     * @param structureId {(number|number[])} - id(s) of structure
     * @param show {Boolean} - whether structure(s) should be shown (true) or
     * hidden (false)
     */
    changeStructureVisibility(structureId, show) {
        if (Array.isArray(structureId)) {
            for (const id of structureId) {
                this.changeStructureVisibility(id, show);
            }
            return;
        }

        if (!this.sceneData.structuresData.structuresInUse.has(structureId)) {
            return;
        }

        const structure = this.sceneData.structuresData.structures[structureId];

        if (show && structure.hidden) {
            structure.hidden = false;
            for (const hCont of
                Object.values(structure.hydrophobicConnectionData.hydrophobicConts)) {
                hCont.hidden = false;
            }
            for (const annotation of Object.values(this.sceneData.annotationsData.annotations)) {
                if (annotation.structureLink === structureId) {
                    annotation.hidden = false;
                }
            }
            this.changeStructureRepresentationByIds(structureId,
                structure.representationsData.curRepresentation()
            );
        } else if (!show && !structure.hidden) {
            this.structureDrawer.showHideStructureParts(structureId, {full: true}, [], false);
            structure.hidden = true;
            for (const hCont of
                Object.values(structure.hydrophobicConnectionData.hydrophobicConts)) {
                hCont.hidden = true;
            }
            for (const annotation of Object.values(this.sceneData.annotationsData.annotations)) {
                if (annotation.structureLink === structureId) {
                    annotation.hidden = true;
                }
            }
        }
    }
}