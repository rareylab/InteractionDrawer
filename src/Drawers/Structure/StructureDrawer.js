/**
 * Drawer that uses other drawers for the visualization of structures.
 */
class StructureDrawer {
    /**
     * Contains instances for JSON validation, configuration options,
     * data storage/access and draw area manipulation.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     * @param svgComponent {Object} - represents the draw area
     * @param viewerDrawer {Object} - drawer for the viewer and viewer control related objects
     * @param atomDrawer {Object} - drawer for atoms
     * @param edgeDrawer {Object} - drawer for edges
     * @param ringDrawer {Object} - drawer for rings
     * @param structureCircleDrawer {Object} - drawer for structure circle representation
     * @param jsonValidator {Object} - validates input JSON
     */
    constructor(opts,
        sceneData,
        svgComponent,
        viewerDrawer,
        atomDrawer,
        edgeDrawer,
        ringDrawer,
        structureCircleDrawer,
        jsonValidator
    ) {
        this.opts = opts;
        this.sceneData = sceneData;
        this.svgComponent = svgComponent;
        this.transformGroupsComponent = svgComponent.transformGroupsComponent;
        this.viewerDrawer = viewerDrawer;
        this.atomDrawer = atomDrawer;
        this.edgeDrawer = edgeDrawer;
        this.ringDrawer = ringDrawer;
        this.structureCircleDrawer = structureCircleDrawer;
        this.jsonValidator = jsonValidator;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds the individual components of different structures based on the
     * "structures" field of provided scene draw information. Returns the
     * necessary Change objects to remove and re-add these components.
     *
     * @param structureInfos {Array} - draw information for the different
     * structures to be added to the scene
     * @param globalMaxes {BoundaryUpdateInfo} - log of how the global
     * boundaries of the scene change
     * @param addedStructureIds {Array} - log of which structures are newly
     * added to the scene
     * @returns {undefined|Array} - Change objects for the next history step
     */
    applyAddStructures(structureInfos, globalMaxes, addedStructureIds) {
        if (this.jsonValidator.checkJSONStructureArray(structureInfos, 'structures', true).error) {
            return;
        }
        const addChanges = [];
        structureInfos.forEach((structureInfo, i) => {
            //sanity check on structure structure (NOT nested for atoms etc.)
            if (this.jsonValidator.structureJSONerror(structureInfo, i)) {
                return;
            }
            //application of the different fields
            Array.prototype.push.apply(addChanges,
                this.applyAddStructure(structureInfo, i, globalMaxes, addedStructureIds)
            );
        });
        return addChanges;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds the individual components for a single structure based on given draw
     * information. Returns the necessary Change objects to remove and re-add
     * these components.
     *
     * @param structureInfo {Object} - draw information for the different
     * parts of the structure to be added to the scene
     * @param i {Number} - array position in structureInfos
     * @param curLimits {BoundaryUpdateInfo} - log of how the global
     * boundaries of the scene change
     * @param addedStructureIds {Array} - log of which structures are newly
     * added to the scene
     * @returns {undefined|Array} - Change objects for the next history step
     */
    applyAddStructure(structureInfo, i, curLimits, addedStructureIds) {
        if (this.jsonValidator.structureNestedJSONerror(structureInfo, i)) {
            return;
        }
        //JSON okay, internally create structure and draw it to SVG
        const addChanges = [];
        const structure = this.createStructureData(structureInfo, addedStructureIds);
        //set to good scale so atom representations are drawn well
        const scaleSuggestion = this.viewerDrawer.suggestDrawScaling();
        const currentScale = this.viewerDrawer.interactionState.transformParams.scale;
        if (scaleSuggestion.rescale) {
            this.viewerDrawer.scale(scaleSuggestion.scale);
        }
        this.createNewStructure(structure, structureInfo, curLimits, addChanges);
        //if scene was scaled for drawing, scale back
        if (scaleSuggestion.rescale) {
            this.viewerDrawer.scale(currentScale);
        }
        return addChanges;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates a new structure instance.
     *
     * @param structureInfo {Object} - draw information for the different
     * parts of the structure to be added to the scene
     * @param addedStructureIds {Array} - log of which structures are newly
     * added to the scene
     * @returns {Structure} - new structure instance
     */
    createStructureData(structureInfo, addedStructureIds) {
        //create the structure and add to memory
        const structureId = structureInfo.id;
        const structure = new Structure(structureId,
            structureInfo.structureName,
            structureInfo.structureType,
            structureInfo.structureLabel,
            this.opts.spaceToRing + this.opts.lineWidth,
            structureInfo.additionalInformation
        );
        structure.addStructureInfo(structureInfo.atoms, structureInfo.bonds, {
            ringInfos: structureInfo.rings,
            stereoCenterInfos: structureInfo.stereoCenters,
            ringSystemInfos: structureInfo.ringsystems
        });
        structure.atomsData.atoms.forEach(atom => { //give color to atoms
            if (!atom.color) {
                const upcaseElem = atom.element.toUpperCase();
                atom.color = (upcaseElem in this.opts.colors) ? this.opts.colors[upcaseElem] :
                    this.opts.colors.DEFAULT;
            }
            this.sceneData.structuresData.atomIdsToStructure[atom.id] = structureId;
        });
        structure.representationsData.addAlternativeRepresentations(this.opts.allowedStructureRepresentations);
        this.sceneData.structuresData.structures[structureId] = structure;
        this.sceneData.structuresData.structuresInUse.add(structureId);
        addedStructureIds.push(structureId);
        this.addStructureToTrack(structure);
        return structure;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Draws a new structure.
     *
     * @param structure {Object} - structure instance
     * @param structureInfo {Object} - draw information for the different
     * parts of the structure to be added to the scene
     * @param curLimits {BoundaryUpdateInfo} - log of how the global
     * boundaries of the scene change
     * @param addChanges {Object} - collects this drawing step as Change object for the history
     */
    createNewStructure(structure, structureInfo, curLimits, addChanges) {
        //draw structure elements step by step
        this.atomDrawer.drawStructureAtoms(structure, structureInfo.selectedAtoms);
        structure.calcBoundaries(); //boundaries need atom draw info
        if (structure.representationsData.hasRepresentation(StructureRepresentation.circle)) {
            this.structureCircleDrawer.applyAddStructureCircle(structure, curLimits);
            structure.addStructureCircleToBoundaries();
        }
        if (structureInfo.afterAdd) { //user-defined post-processing
            structureInfo.afterAdd(structure);
        }
        structure.edgesData.finishEdgeLabeling(); //everything of structure is known, finish build
        this.edgeDrawer.drawStructureEdges(structure, structureInfo.selectedEdges);
        this.edgeDrawer.drawAromaticEdgesForRings(structure);
        //change to remove/readd entire structure, not atom by atom
        addChanges.push(this.createAddRemoveStructureChange(structureInfo.id));

        //change global boundaries as necessary
        const structLimits = structure.boundaries;
        curLimits.setMaxesAdd(structLimits.xMin,
            structLimits.xMax,
            structLimits.yMin,
            structLimits.yMax
        );

        //change if no structure had been loaded before
        if (!this.sceneData.structuresData.structureLoaded) {
            const on = () => {
                this.sceneData.structuresData.structureLoaded = true;
            };
            const off = () => {
                this.sceneData.structuresData.structureLoaded = false;
            };
            const loadChange = new Change();
            loadChange.bindApply(on);
            loadChange.bindRevert(off);
            loadChange.apply();
            addChanges.push(loadChange);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the Change object to remove/re-add a structure.
     *
     * @param structureId {Number} - id of the structure to remove/re-add
     * @param isAdd {Boolean} - whether the re-add function should bind to
     * apply (true) or revert
     * @returns {Change} - Change object to apply/revert removal
     */
    createAddRemoveStructureChange(structureId, isAdd = true) {
        const remStructure = () => {
            this.sceneData.structuresData.structures[structureId].enabled = false;
            this.unselectStructure(structureId);
            this.removeStructureFromDOM(structureId);
        };
        const addStructure = () => {
            this.sceneData.structuresData.structures[structureId].enabled = true;
            this.redrawStructure(structureId);
        };
        const structChange = new Change();
        if (isAdd) {
            structChange.bindApply(addStructure);
            structChange.bindRevert(remStructure);
        } else {
            structChange.bindApply(remStructure);
            structChange.bindRevert(addStructure);
        }
        return structChange;
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a specified structure, recolors atoms and gradients of adjacent bonds
     * by supplying new colors. Returns the necessary Change objects to
     * apply/revert this recoloring.
     *
     * @param structureId {Number} - id of structure for which to recolor
     * atoms and bonds
     * @param newAtomColors {Object} - map from atom ids to new CSS colors
     * @returns {Array} - Change objects for the next history step
     */
    applyColorChanges(structureId, newAtomColors) {
        const structure = this.sceneData.structuresData.structures[structureId];

        const recEdges = {}; //keep track of necessary recoloring for edges
        const recAtoms = new Set(); //atoms that actually changed colors
        const colorChanges = []; //bundle up changes

        for (const atomId in newAtomColors) {
            const atom = structure.atomsData.getAtom(atomId);
            if (!atom || !atom.enabled) {
                continue;
            }
            //create color change based on old and new color
            const oldColor = atom.color;
            const newColor = newAtomColors[atomId];
            if (oldColor === newColor) {
                continue;
            }
            colorChanges.push(this.atomDrawer.createColorChangeAtom(structureId,
                atom,
                oldColor,
                newColor
            ));
            //check which edges have to be color changed
            structure.atomsData.neighbors[atomId].forEach(({edgeId}) => {
                const edge = structure.edgesData.getEdge(edgeId);
                if (!edge.enabled) {
                    return;
                }
                if (!recEdges.hasOwnProperty(edgeId)) {
                    recEdges[edgeId] = {
                        from: undefined, to: undefined
                    };
                }
                if (edge.from === parseInt(atomId)) {
                    recEdges[edgeId].from = newColor;
                } else {
                    recEdges[edgeId].to = newColor;
                }
            });
            recAtoms.add(parseInt(atomId));
        }

        for (const edgeId in recEdges) {
            const edge = structure.edgesData.getEdge(edgeId);
            //find out how to color the edge based on recEdges map
            const newColors = recEdges[edgeId];
            let oldFromColor, newFromColor, oldToColor, newToColor;
            if (newColors.from) {
                oldFromColor = structure.atomsData.getAtom(edge.from).color;
                newFromColor = newColors.from;
            }
            if (newColors.to) {
                oldToColor = structure.atomsData.getAtom(edge.to).color;
                newToColor = newColors.to;
            }
            colorChanges.push(this.edgeDrawer.createColorChangeEdge(structureId,
                edgeId,
                oldFromColor,
                oldToColor,
                newFromColor,
                newToColor
            ));
        }

        //go through with changes until here
        colorChanges.forEach(change => {
            change.apply();
        });

        structure.ringsData.getRingsAffectedByAtoms(recAtoms, true).forEach(ringId => {
            this.edgeDrawer.createColorChangesRingEdges(structure,
                structureId,
                ringId,
                colorChanges
            );
        });

        return colorChanges;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes specified structures in the draw area.
     *
     * @param remStructures {Set} - ids of structures to remove
     * @param remChanges {Array} - Change objects for the history step
     * @param markRequiredRecalcs {Function} - function to memory changes in
     * structure/scene boundaries
     */
    removeStructures(remStructures, remChanges, markRequiredRecalcs) {
        remStructures.forEach(structureId => {
            if (!this.sceneData.structuresData.structures.hasOwnProperty(structureId)) {
                return;
            }

            const structure = this.sceneData.structuresData.structures[structureId];
            //filter already removed
            if (!structure.enabled) {
                return;
            }
            const {xMin, xMax, yMin, yMax} = structure.boundaries;
            markRequiredRecalcs('xMin', xMin, structureId);
            markRequiredRecalcs('xMax', xMax, structureId);
            markRequiredRecalcs('yMin', yMin, structureId);
            markRequiredRecalcs('yMax', yMax, structureId);
            const remChange = this.createAddRemoveStructureChange(structureId, false);
            remChange.apply();
            remChanges.push(remChange);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Unselects all currently selected elements of a structure.
     *
     * @param structureId {Number} - id of structure to unselect
     * @param executeCallback {Boolean} - whether to execute the selection callback
     */
    unselectStructure(structureId, executeCallback = true) {
        const structure = this.sceneData.structuresData.structures[structureId];
        //reset atom selections
        structure.atomsData.selectedAtoms.forEach(atomId => {
            this.atomDrawer.unselectAtomDrawareaContainer(
                structureId,
                atomId,
                false,
                executeCallback
            );
            structure.atomsData.getAtom(atomId).wn = 0;
        });
        structure.atomsData.selectedAtoms.clear();
        //reset edge selections
        structure.edgesData.selectedEdges.forEach(edgeId => {
            this.edgeDrawer.unselectEdgeDrawareaContainer(
                structureId,
                edgeId,
                false,
                executeCallback
            );
            structure.edgesData.getEdge(edgeId).wn = 0;
        });
        structure.edgesData.selectedEdges.clear();
        //reset structure circle selection
        if (structure.representationsData.hasRepresentation(StructureRepresentation.circle) &&
            structure.representationsData.selectedStructureCircle) {
            this.structureCircleDrawer.unselectStructureCircleDrawareaContainer(
                structureId,
                executeCallback
            );
            structure.representationsData.selectedStructureCircle = false;
            structure.representationsData.structureCircle.wn = 0;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Unselects all currently selected elements.
     *
     * @param executeCallback {Boolean} - whether to execute the selection callback
     */
    resetSelections(executeCallback = true) {
        for (const structureId in this.sceneData.structuresData.structures) {
            this.unselectStructure(structureId, executeCallback);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Fully selects any temporarily selected atoms and bonds, committing them
     * to structure and firing callbacks only now.
     */
    applyTempSelection() {
        for (const structureId in this.sceneData.structuresData.structures) {
            const structure = this.sceneData.structuresData.structures[structureId];
            structure.atomsData.tempSelectedAtoms.forEach(atomId => {
                this.atomDrawer.selectAtomDrawareaContainer(structureId, atomId);
            });
            structure.edgesData.tempSelectedEdges.forEach(edgeId => {
                this.edgeDrawer.selectEdgeDrawareaContainer(structureId, edgeId);
            });
            if (structure.representationsData.hasRepresentation(StructureRepresentation.circle) &&
                structure.representationsData.tempSelectedStructureCircle) {
                this.structureCircleDrawer.selectStructureCircleDrawareaContainer(structureId);
            }
        }
        this.clearTempSelections();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Empties the data structures associated with temporary selections.
     */
    clearTempSelections() {
        for (const structureId in this.sceneData.structuresData.structures) {
            const structure = this.sceneData.structuresData.structures[structureId];
            structure.atomsData.tempSelectedAtoms.clear();
            structure.edgesData.tempSelectedEdges.clear();
            if (structure.representationsData.hasRepresentation(StructureRepresentation.circle)) {
                structure.representationsData.tempSelectedStructureCircle = false;
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Unselects selections marked as temp selected in the draw area and clears
     * associated data structures.
     */
    resetTempSelections() {
        for (const structureId in this.sceneData.structuresData.structures) {
            const structure = this.sceneData.structuresData.structures[structureId];
            //reset temp atom selections
            structure.atomsData.tempSelectedAtoms.forEach(atomId => {
                this.atomDrawer.unselectAtomDrawarea(structureId, atomId);
            });
            //reset temp edge selections
            structure.edgesData.tempSelectedEdges.forEach(edgeId => {
                this.edgeDrawer.unselectEdgeDrawarea(structureId, edgeId);
            });
            if (structure.representationsData.hasRepresentation(StructureRepresentation.circle) &&
                structure.representationsData.tempSelectedStructureCircle) {
                this.structureCircleDrawer.unselectStructureCircleDrawareaContainer(structureId);
            }
        }
        this.clearTempSelections();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Selects all atoms, bonds and structure circles in the draw area which are
     * part of a structure specified by id.
     *
     * @param structureId {Number} - unique id of the structure to select
     */
    selectStructure(structureId) {
        if (!this.sceneData.structuresData.structures.hasOwnProperty(structureId)) {
            return;
        }
        const structure = this.sceneData.structuresData.structures[structureId];
        structure.atomsData.atoms.forEach(({id: atomId}) => {
            this.atomDrawer.selectAtomDrawareaContainer(structureId, atomId);
        });
        structure.edgesData.edges.forEach(({id: edgeId}) => {
            this.edgeDrawer.selectEdgeDrawareaContainer(structureId, edgeId);
        });
        if (structure.representationsData.hasRepresentation(StructureRepresentation.circle)) {
            this.structureCircleDrawer.selectStructureCircleDrawareaContainer(structureId);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a (new) structure, adds new container groups to the svg.
     * Creates a new wrapper in both the atom and the edge group. Further
     * prepares the mapping of selectors for later access. In the selector
     * map, the created groups are mapped also, so they may be hidden later.
     *
     * @param structure {Structure} - Structure object
     */
    addStructureToTrack(structure) {
        const structureId = structure.id;
        const debug = this.opts.debug.atoms;
        this.atomDrawer.addAtomsToTrack(structure, structureId, debug);
        this.edgeDrawer.addEdgesToTrack(structure, structureId, debug);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves structural skeleton (as groups) by specified offsets.
     *
     * @param structureId {Number} - id of structure to move skeleton of
     * @param xOffset {Number} - offset to move structure by in x-direction
     * @param yOffset {Number} - offset to move structure by in y-direction
     */
    moveFullSkeleton(structureId, xOffset, yOffset) {
        this.atomDrawer.moveAtomSkeleton(structureId, xOffset, yOffset);
        this.edgeDrawer.moveEdgeSkeleton(structureId, xOffset, yOffset);
        this.structureCircleDrawer.moveStructureCircleSkeleton(structureId, xOffset, yOffset);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets translations made for a certain structure.
     *
     * @param structureId {Number} - id of structure to reset translations for
     */
    resetFullSkeletonTranslation(structureId) {
        this.atomDrawer.resetAtomSkeletonTranslation(structureId);
        this.edgeDrawer.resetEdgeSkeletonTranslation(structureId);
        this.structureCircleDrawer.resetStructureCircleSkeletonTranslation(structureId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes structure from the DOM and the cache.
     *
     * @param structureId {Number} - id of structure to remove
     */
    removeStructureDOMCache(structureId) {
        this.removeStructureFromDOM(structureId);
        this.purgeStructureFromCache(structureId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Detaches the group elements of a structure from the DOM by calling
     * remove() for atoms, edges and gradients. These exist now in memory as
     * detached trees - this is generally a bad thing, but this way the
     * entire structure can quickly be reattached. As long as the structure may
     * have to be reloaded anyway by the history, it stays in memory. If it
     * becomes irrelevant, it is then purged from memory by calling
     * this.purgeStructureFromCache() - make sure this always does happen.
     *
     * @param structureId {Number} - the unique id of the structure to remove
     * from the DOM
     */
    removeStructureFromDOM(structureId) {
        this.atomDrawer.removeStructureAtomsFromDOM(structureId);
        this.edgeDrawer.removeStructureEdgesFromDOM(structureId);
        this.structureCircleDrawer.removeStructureCirclesFromDOM(structureId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes all cached information for a given structure (by its id).
     *
     * @param structureId {Number} - id of structure to remove information
     * about.
     */
    purgeStructureFromCache(structureId) {
        this.atomDrawer.purgeStructureAtomsFromCache(structureId);
        this.edgeDrawer.purgeStructureEdgesFromCache(structureId);
        this.structureCircleDrawer.purgeStructureCirclesFromCache(structureId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a previously removed structure, puts its detached DOM elements back
     * into previous positions.
     *
     * @param structureId {Number} - id of structure to add back
     */
    redrawStructure(structureId) {
        this.atomDrawer.redrawStructureAtoms(structureId);
        this.edgeDrawer.redrawStructureEdges(structureId);
        this.structureCircleDrawer.redrawStructureCircles(structureId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Shows parts of a structure or the full structure. Also hides the
     * selectors.
     *
     * @param structureId {Number} - id of structure to show
     * @param structureParts {Object} - which parts of the structure to show/hide. Parts can
     * contain "full, atoms, bonds, structureCircle, hydrophobic, atomPairInteractions,
     * piStackings, cationPiStackings, label" as keys and true (show) or false
     * (do not change visibility) as values
     * @param hiddenStructures {Array} - ids of structures which are currently
     * completely hidden in the draw area
     * @param show {Boolean} - set true if structure parts shall be shown otherwise false
     */
    showHideStructureParts(structureId, structureParts, hiddenStructures, show) {
        this.transformGroupsComponent.showHideStructureParts(structureId,
            structureParts,
            hiddenStructures,
            show
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates visibility of objects in the draw area.
     */
    updateVisibility() {
        this.transformGroupsComponent.updateVisibility();
    }
}