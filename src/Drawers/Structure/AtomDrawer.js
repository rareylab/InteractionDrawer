/**
 * Drawer that uses its own component for the visualization of structure atoms.
 */
class AtomDrawer {
    /**
     * Contains instances for configuration options,
     * data storage/access, draw area manipulation and all relevant components.
     * A selection callback can be set optionally.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     * @param atomGroupsComponent {Object} - component for atoms
     */
    constructor(opts, sceneData, atomGroupsComponent) {
        this.opts = opts;
        this.sceneData = sceneData;
        this.atomGroupsComponent = atomGroupsComponent;

        this.selectionCallback = null;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Draws the atoms of a structure into the draw area.
     *
     * @param structure {Structure} - Structure object which holds the atom
     * information
     * @param selectedAtoms {Array} - atom ids of atoms to immediately select
     */
    drawStructureAtoms(structure, selectedAtoms) {
        const structureId = structure.id;
        structure.atomsData.atoms.forEach(atom => {
            this.atomGroupsComponent.drawAtom(structure, atom);
            if (atom.isLabel) {
                this.atomGroupsComponent.anchorAtomLabel(structureId, atom);
            }
            this.updateAtomDrawLimits(structureId, atom.id, atom)
        });

        //apply user-defined selection for atoms
        if (selectedAtoms) {
            selectedAtoms.forEach(atomId => {
                if (structure.atomsData.getAtom(atomId)) { //avoid bad input
                    this.selectAtomDrawareaContainer(structureId, atomId);
                }
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the Change object to change the color of an atom to a new one.
     *
     * @param structureId {Number} - id of the structure the atom belongs to
     * @param atom {Atom} - Atom object representing the atom
     * @param oldColor {String} - previous color of the atom
     * @param newColor {String} - new color of the atom
     * @returns {Change} - Change object to apply/revert the recoloring
     */
    createColorChangeAtom(structureId, atom, oldColor, newColor) {
        const atomId = atom.id;
        const colorChange = new Change();
        let colorNew, colorOld;
        //even if atom is not explicitly drawn, its color info must change
        if (atom.element === 'C') {
            colorNew = () => {
                atom.color = newColor;
            };
            colorOld = () => {
                atom.color = oldColor;
            };
        } else {
            colorNew = () => {
                this.atomGroupsComponent.recolorAtom(structureId, atomId, newColor);
                atom.color = newColor;
            };
            colorOld = () => {
                this.atomGroupsComponent.recolorAtom(structureId, atomId, oldColor);
                atom.color = oldColor;
            };
        }
        colorChange.bindApply(colorNew);
        colorChange.bindRevert(colorOld);
        return colorChange;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes specified atoms in the draw area.
     *
     * @param remAtoms {Set} - ids of atoms to remove
     * @param remChanges {Array} - Change objects for the history step
     * @param markRequiredRecalcs {Function} - function to memory changes in
     * structure/scene boundaries
     * @returns {Set} - edges affected by this atoms that should be also removed
     */
    removeAtoms(remAtoms, remChanges, markRequiredRecalcs) {
        const remEdges = new Set();
        remAtoms.forEach(atomId => {
            const structureId = this.sceneData.structuresData.atomIdsToStructure[atomId];
            if (!this.sceneData.structuresData.structures.hasOwnProperty(structureId)) {
                return;
            }

            const structure = this.sceneData.structuresData.structures[structureId];
            const atom = structure.atomsData.getAtom(atomId);
            //filter nonsense or already removed
            if (!atom || !atom.enabled) {
                return;
            }
            const remChange = this.createAddChangeAtom(structure, atom, false);
            remChange.apply();
            remChanges.push(remChange);

            //check if atom defines the structure's boundaries
            const {coordinates: {x: atomX, y: atomY}} = atom;
            markRequiredRecalcs('xMin', atomX, structureId);
            markRequiredRecalcs('xMax', atomX, structureId);
            markRequiredRecalcs('yMin', atomY, structureId);
            markRequiredRecalcs('yMax', atomY, structureId);

            //on removing an atom, also remove all its outgoing edges
            const neighbors = structure.atomsData.neighbors[atomId];
            neighbors.forEach(({edgeId}) => {
                remEdges.add({structureId: structureId, edgeId: edgeId});
            });
        });
        return remEdges;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes specified carbon atoms in the draw area.
     *
     * @param remCarbonAtoms {Set} - ids of carbons to remove
     * @param remChanges {Array} - Change objects for the history step
     */
    removeCarbonAtoms(remCarbonAtoms, remChanges) {
        remCarbonAtoms.forEach(atomId => {
            const structureId = this.sceneData.structuresData.atomIdsToStructure[atomId];
            if (!this.sceneData.structuresData.structures.hasOwnProperty(structureId)) {
                return;
            }

            const structure = this.sceneData.structuresData.structures[structureId];
            let noEdges = true;
            const neighbors = structure.atomsData.neighbors[atomId];
            for (let i = 0, len = neighbors.length; i < len; ++i) {
                const edge = structure.edgesData.getEdge(neighbors[i].edgeId);
                if (edge.enabled) {
                    noEdges = false;
                    break;
                }
            }
            if (noEdges) {
                const atom = structure.atomsData.getAtom(atomId);
                const remChange = this.createAddChangeAtom(structure, atom, false);
                remChange.apply();
                remChanges.push(remChange);
            }
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the Change object to add/remove an atom.
     *
     * @param structure {Structure} - Structure object which holds the atom
     * @param atom {Atom} - Atom object representing the atom to add
     * @param isAdd {Boolean} - whether the change should add the atom as its
     * apply() or revert() function
     * @returns {DomChange} - Change object to apply/revert adding of the atom
     */
    createAddChangeAtom(structure, atom, isAdd) {
        const structureId = structure.id;
        const atomId = atom.id;
        const addChange = new DomChange(isAdd);
        const wasSelected = structure.atomsData.selectedAtoms.has(atomId);
        let linkedAnnotations = [];
        let linkedControlPoints = [];
        for (const annotationId in this.sceneData.annotationsData.annotations) {
            const annotation = this.sceneData.annotationsData.annotations[annotationId];
            if (annotation.atomLinks && annotation.atomLinks.includes(atomId)) {
                linkedAnnotations.push(annotation);
            }
        }
        for (const hydrophobicContactId in this.sceneData.hydrophobicData.hydrophobicContacts) {
            const hydrophobicContact =
                this.sceneData.hydrophobicData.hydrophobicContacts[hydrophobicContactId];
            hydrophobicContact.controlPoints.forEach((cp, idx) => {
                if (cp.atomLinks && cp.atomLinks.includes(atomId)) {
                    linkedControlPoints.push(cp);
                }
            });
        }
        const rem = () => {
            this.atomGroupsComponent.removeAtom(structureId, atomId, false);
            atom.enabled = false;
            atom.selected = false;
            structure.atomsData.selectedAtoms.delete(atomId);
            for (const controlPoint of linkedControlPoints) {
                controlPoint.atomLinks = controlPoint.atomLinks.filter(id => {
                    return id !== atom.id;
                });
            }
            for (const annotation of linkedAnnotations) {
                annotation.atomLinks = annotation.atomLinks.filter(id => {
                    return id !== atom.id;
                });
            }
        };
        const add = () => {
            this.atomGroupsComponent.redrawAtom(structureId, atom);
            atom.enabled = true;
            for (const controlPoint of linkedControlPoints) {
                controlPoint.atomLinks.push(atom.id);
            }
            for (const annotation of linkedAnnotations) {
                annotation.atomLinks.push(atom.id);
            }
        };
        addChange.bindApplyRevert(add, rem);
        return addChange;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Selects an atom in the draw area and mark it as selected in the atom's
     * Structure container.
     *
     * @param structureId {Number} - id of the structure the atom belongs to
     * @param atomId {Number} - id of the atom to select
     * @param executeCallback {Boolean} - whether to execute the selection callback
     */
    selectAtomDrawareaContainer(structureId, atomId, executeCallback = true) {
        if (!this.sceneData.structuresData.structures.hasOwnProperty(structureId)) {
            return;
        }
        const structure = this.sceneData.structuresData.structures[structureId];
        const atom = structure.atomsData.getAtom(atomId);
        structure.atomsData.selectAtom(atomId);
        this.atomGroupsComponent.selectAtom(structureId, atomId);
        if (executeCallback && this.selectionCallback) {
            this.selectionCallback({
                type: 'atom',
                selectionType: 'select',
                structureId: parseInt(structureId),
                structureName: structure.structureName,
                structureType: structure.structureType,
                atomId: parseInt(atomId),
                additionalInformation: atom.additionalInformation
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Selects an atom in the draw area.
     *
     * @param structureId {Number} - id of the structure the atom belongs to
     * @param atomId {Number} - id of the atom to select
     */
    selectAtomDrawarea(structureId, atomId) {
        this.atomGroupsComponent.selectAtom(structureId, atomId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * For given atoms (by id), updates temporary coordinates based on given
     * offsets.
     *
     * @param atomsToUpdate {Array} - ids of atoms to update
     * @param offset {Object} - x- and y-offsets to apply to temp coordinates
     */
    updateTempCoordsForAtoms(atomsToUpdate, offset) {
        for (const structureId in atomsToUpdate) {
            const structure = this.sceneData.structuresData.structures[structureId];
            atomsToUpdate[structureId].forEach(atomId => {
                const updateAtom = structure.atomsData.getAtom(atomId);
                updateAtom.addOffsetToCoords(offset, true);
            })
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves the draw elements associated with the representation of atoms given
     * by id in the draw area based on offsets between their last 'real' and
     * current temporary coordinates.
     *
     * @param atomsToUpdate {Object} - atom ids to move draw elements for
     */
    moveAtomsToTempCoordinates(atomsToUpdate) {
        for (const structureId in atomsToUpdate) {
            const structure = this.sceneData.structuresData.structures[structureId];
            atomsToUpdate[structureId].forEach(atomId => {
                const {coordinates, tempCoordinates} = structure.atomsData.getAtom(atomId);
                const offset = {
                    x: tempCoordinates.x - coordinates.x, y: tempCoordinates.y - coordinates.y
                };
                this.atomGroupsComponent.moveAtom(structureId, atomId, offset);
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves the draw elements associated with the representation of atoms not
     * part of any ring given by id in the draw area based on given offsets.
     *
     * @param atomsToUpdate {Array} - atom ids to move draw elements for
     * @param offset {Object} - x- and y-offsets to move draw elements by
     */
    moveNonRingAtomsByOffset(atomsToUpdate, offset) {
        for (const structureId in atomsToUpdate) {
            const structure = this.sceneData.structuresData.structures[structureId];
            atomsToUpdate[structureId].forEach(atomId => {
                if (!structure.atomsData.getAtom(atomId).isInRing) {
                    this.atomGroupsComponent.moveAtom(structureId, atomId, offset);
                }
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * When atoms are moved, the ideal placement of hydrogen labels around the
     * main text label can change. Here, creates the Change object to place the
     * hydrogen text on a given side of the main text.
     *
     * @param structureId {Number} - id of the structure the atom belongs to
     * @param atom {Atom} - Atom object representing the atom
     * @param newHorientation {String} - "left", "right", "up", or "down"
     * @returns {Change} - Change object to apply/revert placement of hydrogen
     * text
     */
    createHPlacementChange(structureId, atom, newHorientation) {
        const hChange = new Change();
        const oldHorientation = atom.hydrogenOrientation;
        const apply = () => {
            atom.setHydrogenOrientation(newHorientation);
            atom.setTempHydrogenOrientation(newHorientation);
            this.atomGroupsComponent.placeHByOrientation(structureId, atom, false);
        };
        const revert = () => {
            atom.setHydrogenOrientation(oldHorientation);
            atom.setTempHydrogenOrientation(oldHorientation);
            this.atomGroupsComponent.placeHByOrientation(structureId, atom, false);
        };
        hChange.bindApply(apply);
        hChange.bindRevert(revert);
        return hChange;
    }

    /*----------------------------------------------------------------------*/

    /**
     * For all structures, if two neighboring bonds are selected, also select
     * the atom between these bonds.
     */
    selectAtomsBetweenSelectedEdges() {
        for (const structureId in this.sceneData.structuresData.structures) {
            const structure = this.sceneData.structuresData.structures[structureId];
            structure.edgesData.selectedEdges.forEach(edgeId => {
                structure.edgesData.findAtomsToSelectOnEdgeSelect(edgeId)
                    .forEach(atomId => {
                        this.selectAtomDrawareaContainer(structureId, atomId);
                    });
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Selects an atom in the draw area and mark it as temporally (!) selected
     * in the atom's Structure container.
     *
     * @param structureId {Number} - id of the structure the atom belongs to
     * @param atomId {Number} - id of the atom to select
     */
    tempSelectAtom(structureId, atomId) {
        if (!this.sceneData.structuresData.structures.hasOwnProperty(structureId)) {
            return;
        }
        const structure = this.sceneData.structuresData.structures[structureId];
        structure.atomsData.tempSelectAtom(atomId);
        this.atomGroupsComponent.selectAtom(structureId, atomId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Unselects an atom in the draw area and remove its selection status inside
     * the Structure container it belongs to.
     *
     * @param structureId {Number} - id of the structure the atom belongs to
     * @param atomId {Number} - id of the atom to unselect
     * @param hover {Boolean} - whether the atom is to be shown as hovered
     * @param executeCallback {Boolean} - whether to execute the selection callback
     */
    unselectAtomDrawareaContainer(structureId, atomId, hover = false, executeCallback = true) {
        if (!this.sceneData.structuresData.structures.hasOwnProperty(structureId)) {
            return;
        }
        const structure = this.sceneData.structuresData.structures[structureId];
        const atom = structure.atomsData.getAtom(atomId);
        structure.atomsData.selectedAtoms.delete(atomId);
        if (hover) {
            this.atomGroupsComponent.hoverAtom(structureId, atomId);
        } else {
            this.atomGroupsComponent.unselectAtom(structureId, atomId);
        }
        if (executeCallback && this.selectionCallback) {
            this.selectionCallback({
                type: 'atom',
                selectionType: 'unselect',
                structureId: parseInt(structureId),
                structureName: structure.structureName,
                structureType: structure.structureType,
                atomId: parseInt(atomId),
                additionalInformation: atom.additionalInformation
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Unselects an atom in the draw area.
     *
     * @param structureId {Number} - id of the structure the atom belongs to
     * @param atomId {Number} - id of the atom to unselect
     */
    unselectAtomDrawarea(structureId, atomId) {
        this.atomGroupsComponent.unselectAtom(structureId, atomId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates temporary coordinates of an atom based on given offsets. Note the
     * updated atom in a provided container.
     *
     * @param structure {Structure} - Structure object holding the atom
     * @param atomId {Number} - id of the atom to update
     * @param offset {Object} - x- and y-offsets to apply to temp coordinates
     * @param tracker {StructureIdTracker} - container to note the updated atom
     * in
     */
    static updateTempCoordsForAtom(structure, atomId, offset, tracker) {
        if (tracker.hasID(structure.id, atomId)) return;
        //update temp coordinates and mark as updated
        const updateAtom = structure.atomsData.getAtom(atomId);
        updateAtom.addOffsetToCoords(offset, true);
        tracker.addID(structure.id, atomId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves the draw elements associated with the representation of atoms given
     * by id in the draw area based on given offsets.
     *
     * @param atomsToUpdate {Object} - atom ids to move draw elements for
     * @param offset {Object} - x- and y-offsets to move draw elements by
     */
    moveAtomsByOffset(atomsToUpdate, offset) {
        for (const structureId in atomsToUpdate) {
            atomsToUpdate[structureId].forEach(atomId => {
                this.atomGroupsComponent.moveAtom(structureId, atomId, offset)
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates bbox draw limits of all text elements making up the
     * representation of an atom.
     *
     * @param structureId {Number} - the unique id of the structure the atom
     * belongs to
     * @param atomId {Number} - id of Atom object to update limits for
     * @param atom {Atom} - Atom object to update limits for
     */
    updateAtomDrawLimits(structureId, atomId, atom) {
        atom.setSelectorShapes(this.atomGroupsComponent.getAtomSelShapes(structureId, atomId));
        atom.setDrawLimits(this.atomGroupsComponent.getAtomDrawLimits(structureId, atom));
    }

    /*----------------------------------------------------------------------*/

    /**
     * When atoms are moved, the ideal anchor side for labels representing
     * amino acids can change. Here, creates the Change object to re-anchor a
     * label on a new side.
     *
     * @param structureId {Number} - id of the structure the atom belongs to
     * @param atom {Atom} - Atom object representing the atom
     * @param newOrientation {String} - "left", "right", "up", or "down"
     * @returns {Change} - Change object to apply/revert the new anchoring
     */
    createAnchorPlacementChange(structureId, atom, newOrientation) {
        const anchorChange = new Change();
        const oldOrientation = atom.labelOrientation;
        const apply = () => {
            atom.setLabelSide(newOrientation, false);
            this.atomGroupsComponent.anchorAtomLabel(structureId, atom, oldOrientation);
        };
        const revert = () => {
            atom.setLabelSide(oldOrientation, false);
            this.atomGroupsComponent.anchorAtomLabel(structureId, atom, newOrientation);
        };
        anchorChange.bindApply(apply);
        anchorChange.bindRevert(revert);
        return anchorChange;
    };

    /*----------------------------------------------------------------------*/

    /**
     * Moves the draw elements associated with the representation of atoms by
     * individual offsets given in a map of offsets.
     *
     * @param offsetMap {Object} - map from structure ids to atom ids to
     * individual x- and y-offsets to move draw elements by
     */
    moveAtomsByOffsetMap(offsetMap) {
        for (const structureId in offsetMap) {
            const atomOffsets = offsetMap[structureId];
            for (const atomId in atomOffsets) {
                this.atomGroupsComponent.moveAtom(structureId, atomId, atomOffsets[atomId]);
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates temporary coordinates of atoms based on individual offsets given
     * in a map of offsets.
     *
     * @param offsetMap {Object} - map from structure ids to atom ids to
     * individual x- and y-offsets to apply to atom temp coordinates
     */
    updateTempCoordsForAtomsByOffsetMap(offsetMap) {
        for (const structureId in offsetMap) {
            const structure = this.sceneData.structuresData.structures[structureId];
            const atomOffsets = offsetMap[structureId];
            for (const atomId in atomOffsets) {
                const updateAtom = structure.atomsData.getAtom(atomId);
                updateAtom.addOffsetToCoords(atomOffsets[atomId], true);
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hovers an atom in the draw area.
     *
     * @param structureId {Number} - the unique id of the structure the atom
     * belongs to
     * @param atomId {Number} - the unique id of the atom to signal as hovered
     */
    hoverAtom(structureId, atomId) {
        this.atomGroupsComponent.hoverAtom(structureId, atomId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a number of structures specified by id, checks and, where necessary,
     * corrects the position of various atom text elements.
     *
     * @param structureIds {Array} - ids of structures to check
     */
    correctAtomTextPlacement(structureIds) {
        this.correctHPlacement(structureIds);
        this.correctLabelPlacement(structureIds);
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a number of structures specified by id, checks whether the optimal
     * hydrogen placement on included atoms has changed and corrects it where
     * necessary.
     *
     * @param structureIds {Array} - ids of structures to check
     */
    correctHPlacement(structureIds) {
        structureIds.forEach(structureId => {
            const structure = this.sceneData.structuresData.structures[structureId];
            const changedHs = structure.atomsData.findAtomsWithChangedHPlacement(true);
            for (const atomId in changedHs) {
                const hOrientation = changedHs[atomId];
                const atom = structure.atomsData.getAtom(atomId);
                atom.setTempHydrogenOrientation(hOrientation);
                this.atomGroupsComponent.placeHByOrientation(structureId, atom, true);
            }
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a number of structures specified by id, checks whether the optimal
     * anchoring of included atoms representing amino acid labels has changed
     * and corrects it where necessary.
     *
     * @param structureIds {Array} - ids of structures to check
     */
    correctLabelPlacement(structureIds) {
        structureIds.forEach(structureId => {
            const structure = this.sceneData.structuresData.structures[structureId];
            const changedLabels = structure.atomsData.findAtomsWithChangedAnchors(true);
            for (const atomId in changedLabels) {
                const atom = structure.atomsData.getAtom(atomId);
                const prevOrientation = atom.tempLabelOrientation;
                const newOrientation = changedLabels[atomId];
                atom.setLabelSide(newOrientation, true);
                this.atomGroupsComponent.anchorAtomLabel(structureId, atom, prevOrientation);
            }
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Rotates the atoms of a specific structure around a given midpoint.
     *
     * @param structureId {Number} - unique id of structure to rotate
     * @param angle {Number} - angle (in degrees!) to rotate by
     * @param midpoint {Object} - x- and y-coordinates of the point to rotate
     * the structure around. If none given, take midpoint of the structure's
     * bounding box
     */
    rotateStructureAtoms(structureId, angle, midpoint) {
        const structure = this.sceneData.structuresData.structures[structureId];

        const rotationOffsets = structure.calcAtomRotationOffsets(angle, true, midpoint);
        const offsetMap = {
            [structure.id]: rotationOffsets
        };
        //atom labels have to be oriented correctly, need new temp coordinates
        this.updateTempCoordsForAtomsByOffsetMap(offsetMap);
        this.moveAtomsByOffsetMap(offsetMap);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves structural skeleton (as groups) of ring system atoms by specified
     * offsets.
     *
     * @param structureId {Number} - id of structure containing the ring
     * system
     * @param ringSysId {Number} - id of ring systems to move skeleton of
     * @param xOffset {Number} - offset to move ring system by in x-direction
     * @param yOffset {Number} - offset to move ring system by in y-direction
     */
    moveRingAtomSkeleton(structureId, ringSysId, xOffset, yOffset) {
        this.atomGroupsComponent.moveRingAtomSkeleton(structureId, ringSysId, xOffset, yOffset);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets translations made for atoms of a certain ring system.
     *
     * @param structureId {Number} - id of structure containing the ring
     * system
     * @param ringSysId {Number} - id of ring systems to reset translations
     * for
     */
    resetRingAtomSkeletonTranslation(structureId, ringSysId) {
        this.atomGroupsComponent.resetRingAtomSkeletonTranslation(structureId, ringSysId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a (new) structure, adds new container groups to the svg for atoms.
     * Creates a new wrapper in the atom group. Further
     * prepares the mapping of selectors for later access. In the selector
     * map, the created groups are mapped also, so they may be hidden later.
     *
     * @param structure {Structure} - Structure object
     * @param structureId {structureId} - id of Structure object
     * @param debug {Boolean} - true if debug information shall be visualized
     */
    addAtomsToTrack(structure, structureId, debug) {
        this.atomGroupsComponent.addAtomsToTrack(structure, structureId, debug);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves structural atom skeleton (as groups) by specified offsets.
     *
     * @param structureId {Number} - id of structure to move skeleton of
     * @param xOffset {Number} - offset to move structure by in x-direction
     * @param yOffset {Number} - offset to move structure by in y-direction
     */
    moveAtomSkeleton(structureId, xOffset, yOffset) {
        this.atomGroupsComponent.moveAtomSkeleton(structureId, xOffset, yOffset);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets translations made for atoms of a certain structure.
     *
     * @param structureId {Number} - id of structure to reset translations for
     */
    resetAtomSkeletonTranslation(structureId) {
        this.atomGroupsComponent.resetAtomSkeletonTranslation(structureId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes all atoms of a structure from the DOM.
     *
     * @param structureId {Number} - the unique id of the structure to remove
     * its atoms from the DOM
     */
    removeStructureAtomsFromDOM(structureId) {
        this.atomGroupsComponent.removeStructureAtomsFromDOM(structureId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Remove all cached information for a given structure (by its id).
     *
     * @param structureId {Number} - id of structure to remove atom information
     * from.
     */
    purgeStructureAtomsFromCache(structureId) {
        this.atomGroupsComponent.purgeStructureAtomsFromCache(structureId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a previously removed structure, puts its detached atom DOM elements back
     * into previous positions.
     *
     * @param structureId {Number} - id of structure to add back
     */
    redrawStructureAtoms(structureId) {
        this.atomGroupsComponent.redrawStructureAtoms(structureId);
    }
}