/**
 * Processes user interactions that remove objects from the draw area.
 */
class RemoveHandler {
    /**
     * Contains instances for the data storage/access, user interaction tracking,
     * draw area manipulation and configuration options.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     * @param interactionState {Object} - tracks user interactions
     * @param svgDrawer {Object} - updates the draw area
     */
    constructor(opts, sceneData, interactionState, svgDrawer) {
        this.opts = opts;
        this.sceneData = sceneData;
        this.interactionState = interactionState;
        this.svgDrawer = svgDrawer;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets all structures and intermolecular forces of the scene to the
     * state they were in when they were just added and set the history to
     * this first state. This discards the previous history and can not be
     * undone. This basically removes everything from the scene.
     */
    fullReset() {
        this.sceneData.structuresData.structuresInUse.forEach(structureId => {
            this.svgDrawer.structureDrawer.removeStructureDOMCache(structureId);
            const structure = this.sceneData.structuresData.structures[structureId];
            Object.keys(structure.hydrophobicConnectionData.hydrophobicConts).forEach(hId => {
                this.svgDrawer.hydrophobicDrawer.removeHydrophobicContactDOMCache(structureId, hId)
            });
        });
        const intermolecularData = this.sceneData.intermolecularData;
        Object.keys(intermolecularData.atomPairInteractions).forEach(atomPairInteractionId => {
            this.svgDrawer.intermolecularDrawer.removeIntermolecularDOMCache(atomPairInteractionId,
                'atomPairInteractions'
            );
        });
        Object.keys(intermolecularData.piStackings).forEach(piStackingId => {
            this.svgDrawer.intermolecularDrawer.removeIntermolecularDOMCache(piStackingId,
                'piStackings'
            );
        });
        Object.keys(intermolecularData.cationPiStackings).forEach(cationPiId => {
            this.svgDrawer.intermolecularDrawer.removeIntermolecularDOMCache(cationPiId,
                'cationPiStackings'
            );
        });
        Object.keys(intermolecularData.distances).forEach(distanceId => {
            this.svgDrawer.intermolecularDrawer.removeIntermolecularDOMCache(distanceId,
                'distances'
            );
        });
        Object.keys(intermolecularData.interactions).forEach(interactionId => {
            this.svgDrawer.intermolecularDrawer.removeIntermolecularDOMCache(interactionId,
                'interactions'
            );
        });
        Object.keys(this.sceneData.annotationsData.annotations).forEach(labelId => {
            this.svgDrawer.annotationDrawer.removeAnnotationDOMCache(labelId);
        });
        this.svgDrawer.viewerDrawer.reset();
        this.sceneData.reset();
        this.interactionState.reset();
        this.svgDrawer.historyDrawer.reset();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes all selected components from the draw area. What is removed is
     * determined by move freedom level, so if one atom of a structure/ring
     * is selected and move freedom level is set to structures/rings then the
     * whole structure/ring gets removed instead of the atom. If you want to
     * override this only for this action there is a optional parameter present.
     *
     * @param moveFreedomLevel {String} - determine the move freedom level
     * to use (structures, free, rings)
     */
    handleRemoveSelected(moveFreedomLevel = undefined) {
        const remove = {
            structures: new Set(), atoms: new Set(), edges: new Set()
        };
        for (const structure of Object.values(this.sceneData.structuresData.structures)) {
            Helpers.mergeIntoSet(remove.atoms, structure.atomsData.selectedAtoms);
            for (const edgeId of structure.edgesData.selectedEdges) {
                    remove.edges.add({structureId: structure.id, edgeId: edgeId});
            }
            if (structure.representationsData.selectedStructureCircle) {
                remove.structures.add(structure.id);
            }
        }
        this.correctRemoveByFreedomLevel(remove, moveFreedomLevel);
        this.svgDrawer.applySceneChanges({remove: remove});
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes all hovered components from the draw area. What is removed is
     * determined by move freedom level, so if one atom of a structure/ring
     * is selected and move freedom level is set to structures/rings then the
     * whole structure/ring gets removed instead of the atom. If you want to
     * override this only for this action there is a optional parameter present.
     *
     * @param moveFreedomLevel {String} - determine the move freedom level
     * to use (structures, free, rings)
     */
    handleRemoveHovered(moveFreedomLevel = undefined) {
        const remove = Object.assign({}, this.interactionState.interaction.remove);
        this.correctRemoveByFreedomLevel(remove, moveFreedomLevel);
        this.svgDrawer.applySceneChanges({remove: remove});
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes all components of the current scene.
     */
    removeCurrentScene() {
        const remove = {
            structures: new Set(),
            atoms: new Set(),
            edges: new Set(),
            annotations: new Set(),
            hydrophobicContacts: new Set(),
            atomPairInteractions: new Set(),
            piStackings: new Set(),
            cationPiStackings: new Set(),
            selected: false
        };
        remove.structures = new Set(Object.keys(this.sceneData.structuresData.structures));
        remove.annotations = new Set(Object.keys(this.sceneData.annotationsData.annotations));
        remove.hydrophobicContacts =
            new Set(Object.keys(this.sceneData.hydrophobicData.hydrophobicContacts));
        remove.atomPairInteractions =
            new Set(Object.keys(this.sceneData.intermolecularData.atomPairInteractions));
        remove.piStackings =
            new Set(Object.keys(this.sceneData.intermolecularData.piStackings));
        remove.cationPiStackings =
            new Set(Object.keys(this.sceneData.intermolecularData.cationPiStackings));
        this.svgDrawer.applySceneChanges({remove: remove});
    }

    /*----------------------------------------------------------------------*/

    /**
     * Determines which elements to remove based on the current or given
     * move freedom level.
     *
     * @param remove {Object} - the object to alter. Contains e.g. structure ids
     * or atom ids to remove. See JSDoc of function applyRemove() for more info
     * @param moveFreedomLevel {String} - determine the move freedom level
     * to use (structures, free, rings)
     */
    correctRemoveByFreedomLevel(remove, moveFreedomLevel = undefined) {
        const structuresData = this.sceneData.structuresData;
        switch (moveFreedomLevel || this.opts.moveFreedomLevel) {
            case 'structures':
                if (remove.hasOwnProperty('atoms')) {
                    for (const atomId of remove.atoms) {
                        if (structuresData.atomIdsToStructure.hasOwnProperty(atomId)) {
                            remove.structures.add(structuresData.atomIdsToStructure[atomId]);
                        }
                    }
                }
                if (remove.hasOwnProperty('edges')) {
                    for (const removeEdge of remove.edges) {
                        remove.structures.add(removeEdge.structureId);
                    }
                }
                break;
            case 'rings':
                const remAtoms = remove.atoms || new Set();
                const remEdges = remove.edges || new Set();
                for (const structure of Object.values(structuresData.structures)) {
                    const ringsystems = new Set();
                    Helpers.mergeIntoSet(ringsystems, structure
                        .ringsData.getRingSystemsAffectedByAtoms([...remAtoms]));
                    Helpers.mergeIntoSet(ringsystems, structure
                        .ringsData.getRingSystemsAffectedByEdges([...remEdges]));

                    ringsystems.forEach(sysId => {
                        const sys = structure.ringsData.ringSystems[sysId];
                        Helpers.mergeIntoSet(remAtoms, sys.atoms);
                    })
                }
                remove.atoms = remAtoms;
                break;
            case 'free':
                break;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds an point feature from the scene by its NGL name.
     *
     * @param nglFeatureName {String} - NGL name of the query point to remove
     */
    removeGeominePoint(nglFeatureName) {
        const annotationsData = this.sceneData.annotationsData;
        const annotations = annotationsData.annotations;
        for (const annotationId in annotations) {
            const annotation = annotations[annotationId];
            const additionalInformation = annotation.additionalInformation;
            if (additionalInformation && additionalInformation.nglFeatureName &&
                additionalInformation.nglFeatureName === nglFeatureName) {
                this.svgDrawer.annotationDrawer.removeAnnotationDataView(parseInt(annotationId));
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds an query point to point constraint from the scene.
     *
     * @param nglFeatureName {String} - NGL name of the query point to point constraint
     * to remove
     */
    removeGeomineQueryPointToPointConstraint(nglFeatureName) {
        const intermolecularData = this.sceneData.intermolecularData;
        for (const ptopName of intermolecularData.ptopNames) {
            const intermolecularEdges = intermolecularData[ptopName];
            for (const intermolecularId in intermolecularEdges) {
                const intermolecularEdge = intermolecularEdges[intermolecularId];
                const additionalInformation = intermolecularEdge.additionalInformation;
                if (additionalInformation && additionalInformation.nglFeatureName &&
                    additionalInformation.nglFeatureName === nglFeatureName) {
                    this.svgDrawer.intermolecularDrawer.removeGeomineQueryPointToPointConstraintDataView(parseInt(intermolecularId),
                        ptopName
                    );
                }
            }
        }
    }
}
