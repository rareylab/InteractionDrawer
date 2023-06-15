/**
 * Drawer that uses its own component for the visualization of structure edges.
 */
class EdgeDrawer {
    /**
     * Contains instances for configuration options,
     * data storage/access, draw area manipulation and all relevant components.
     * A selection callback can be set optionally.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     * @param edgeGroupsComponent {Object} - component for edges
     */
    constructor(opts, sceneData, edgeGroupsComponent) {
        this.opts = opts;
        this.sceneData = sceneData;
        this.edgeGroupsComponent = edgeGroupsComponent;

        this.selectionCallback = null;
        this.edgeBuilder = new EdgeBuilder(opts, sceneData);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Draws the bonds of a structure into the draw area.
     *
     * @param structure {Structure} - Structure object which holds the bond
     * information
     * @param selectedEdges {Array} - bond ids of bonds to immediately select
     */
    drawStructureEdges(structure, selectedEdges) {
        structure.edgesData.edges.forEach(edge => {
            const fromAtom = structure.atomsData.getAtom(edge.from);
            const toAtom = structure.atomsData.getAtom(edge.to);
            const bondInfo = this.edgeBuilder.createBondByType(edge.from,
                edge.to,
                structure,
                edge,
                false
            );
            //only new draw possible, reject if edge not drawable
            if (!bondInfo) {
                return;
            }
            //does not matter where this happens, drawInfo is initialized with null
            edge.setDrawInfo(bondInfo, false);
            this.edgeGroupsComponent.drawEdge(structure, edge, fromAtom, toAtom, false);
            edge.setHidden(false, false);
        });

        //apply user-defined selection to edges
        if (selectedEdges) {
            selectedEdges.forEach(edgeId => {
                if (structure.edgesData.getEdge(edgeId)) { //avoid bad input
                    this.selectEdgeDrawareaContainer(structure.id, edgeId);
                }
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes specified edges in the draw area.
     *
     * @param remEdges {Set} - ids of edges to remove
     * @param remChanges {Array} - change objects for the history step
     * @returns {Set} - carbon atoms affected by this edges that should also
     * be removed
     */
    removeEdges(remEdges, remChanges) {
        const remCarbonAtoms = new Set();
        remEdges.forEach(removeEdges => {
            const structureId = removeEdges.structureId;
            const edgeId = removeEdges.edgeId;

            if (!this.sceneData.structuresData.structures.hasOwnProperty(structureId)) {
                return;
            }
            const structure = this.sceneData.structuresData.structures[structureId];
            const edge = structure.edgesData.getEdge(edgeId);
            if (!edge || !edge.enabled) {
                return;
            }
            const remChange = this.createAddChangeEdge(structure, edge, false);
            remChange.apply();
            remChanges.push(remChange);
            [edge.from, edge.to].forEach(atomId => {
                const atom = structure.atomsData.getAtom(atomId);
                if (atom.enabled && atom.element === 'C') {
                    remCarbonAtoms.add(atom.id);
                }
            });
        });
        return remCarbonAtoms;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the Change object to add/remove a bond.
     *
     * @param structure {Structure} - Structure object which holds the bond
     * @param edge {Edge} - Edge object representing the bond to add
     * @param isAdd {Boolean} - whether the change should add the bond as its
     * apply() or revert() function
     * @returns {DomChange} - Change object to apply/revert adding of the bond
     */
    createAddChangeEdge(structure, edge, isAdd) {
        const structureId = structure.id;
        const edgeId = edge.id;
        const addChange = new DomChange(isAdd);
        const wasSelected = structure.edgesData.selectedEdges.has(edgeId);
        const rem = () => {
            this.edgeGroupsComponent.removeEdge(structureId, edgeId, false);
            edge.enabled = false;
            edge.selected = false;
            structure.edgesData.selectedEdges.delete(edgeId);
        };
        const add = () => {
            this.edgeGroupsComponent.redrawEdge(structureId, edge);
            edge.enabled = true;
        };
        addChange.bindApplyRevert(add, rem);
        return addChange;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Selects a bond in the draw area and mark it as selected in the bond's
     * Structure container.
     *
     * @param structureId {Number} - id of the structure the bond belongs to
     * @param edgeId {Number} - id of the bond to select
     */
    selectEdgeDrawareaContainer(structureId, edgeId) {
        if (!this.sceneData.structuresData.structures.hasOwnProperty(structureId)) {
            return;
        }
        const structure = this.sceneData.structuresData.structures[structureId];
        structure.edgesData.selectEdge(edgeId);
        this.edgeGroupsComponent.selectEdge(structureId, edgeId);
        if (this.selectionCallback) {
            this.selectionCallback({
                type: 'edge',
                selectionType: 'select',
                structureId: parseInt(structureId),
                edgeId: parseInt(edgeId)
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Selects a bond in the draw area.
     *
     * @param structureId {Number} - id of the structure the bond belongs to
     * @param edgeId {Number} - id of the bond to select
     */
    selectEdgeDrawarea(structureId, edgeId) {
        this.edgeGroupsComponent.selectEdge(structureId, edgeId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates all bonds including given atoms (by ids) based on the new
     * temporary coordinates of these atoms.
     *
     * @param updatedAtoms {Object} - atom ids affected by interaction
     * @returns {Object} - edge change cases: how the representation of
     * bonds were updated (e.g., moved, hidden, ...)
     */
    moveAffectedEdgesToTempCoordinates(updatedAtoms) {
        const edgeChangeCases = {};
        for (const structureId in updatedAtoms) {
            const sEdgeChangeCases = {};
            const structure = this.sceneData.structuresData.structures[structureId];
            const edgesToMove = structure.edgesData.getEdgesAffectedByAtoms(updatedAtoms[structureId]);
            edgesToMove.forEach(edgeId => {
                const edge = structure.edgesData.getEdge(edgeId);
                if (!edge.enabled) {
                    return;
                }
                //create the information on how to draw the edge
                const edgeInfo = this.edgeBuilder.createBondByType(edge.from,
                    edge.to,
                    structure,
                    edge,
                    true
                );
                //from draw information create update function and changeCase
                const edgeUpdate = this.createEdgeUpdateFunction(structure, edge, edgeInfo, true);
                edgeUpdate.function();
                sEdgeChangeCases[edgeId] = edgeUpdate.changeCase;
            });
            edgeChangeCases[structureId] = sEdgeChangeCases;
        }
        return edgeChangeCases;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Determines what should happen to a bond based upon a newly calculated
     * draw info (which may be null in error case or not drawable scenarios).
     * Returns a function to apply this determined change and a changeCase to
     * indicate what type of change happened (so that objects that directly
     * rely on bonds, like aromatic edges, may be changed accordingly, e.g.,
     * hidden as well when the bond becomes hidden).
     *
     * @param structure {Structure} - Structure object which holds the bond
     * @param edge {Edge} - Edge object representing the bond
     * @param edgeInfo {Object} - draw information for the bond
     * @param byTemp {Boolean} - whether to base bond update on temporary
     * information
     * @param typeChanged {Boolean} - whether the type of the bond changed
     * during last update step
     * @returns {Object} - the function to perform the update (field
     * "function") and what exact type of change occurred (field "changeCase",
     * see EdgeChangeCase in Enums.js)
     */
    createEdgeUpdateFunction(structure, edge, edgeInfo, byTemp, typeChanged = false) {
        const structureId = structure.id;
        const edgeId = edge.id;
        const hiddenParam = byTemp ? 'tempHidden' : 'hidden';
        let updateFunction, changeCase;
        //edge should not be drawn
        if (!edgeInfo) {
            //edge is currently drawn -> remove representation
            if (!edge[hiddenParam]) {
                updateFunction = () => {
                    edge.setHidden(true, byTemp);
                    this.edgeGroupsComponent.removeEdge(structureId, edgeId, false);
                    changeCase = EdgeChangeCase.remove;
                };
                //edge is not drawn, no need to do anything
            } else {
                updateFunction = () => {
                };
                changeCase = EdgeChangeCase.pass;
            }
            //edge should be drawn
        } else {
            //edge is currently not drawn
            if (edge[hiddenParam]) {
                //edge has not been drawn before -> draw for first time
                if (!this.edgeGroupsComponent.wasEdgeDrawnBefore(structureId, edgeId)) {
                    const fromAtom = structure.atomsData.getAtom(edge.from);
                    const toAtom = structure.atomsData.getAtom(edge.to);
                    //the way things are set up, this only ever happens in temp update
                    updateFunction = () => {
                        this.edgeGroupsComponent.drawEdge(structure,
                            edge,
                            fromAtom,
                            toAtom,
                            byTemp
                        );
                        edge.setHidden(false, byTemp);
                    };
                    changeCase = EdgeChangeCase.draw;
                    //edge has been drawn before -> add representation back and move
                } else {
                    updateFunction = () => {
                        this.edgeGroupsComponent.redrawEdge(structureId, edge);
                        this.edgeGroupsComponent.moveEdge(structure, edge, byTemp, typeChanged);
                        edge.setHidden(false, byTemp);
                    };
                    changeCase = EdgeChangeCase.redraw;
                }
                //edge is currently drawn -> move edge representation
            } else {
                updateFunction = () => {
                    this.edgeGroupsComponent.moveEdge(structure, edge, byTemp, typeChanged);
                };
                changeCase = EdgeChangeCase.move;
            }
        }
        return {
            function: () => {
                edge.setDrawInfo(edgeInfo, byTemp);
                updateFunction();
            }, changeCase: changeCase
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates all non-cyclic bonds including given atoms (by ids) based on the
     * new temporary coordinates of these atoms.
     *
     * @param updatedAtoms {Object} - atom ids affected by interaction
     */
    moveAffectedNonCyclicEdgesToTempCoordinates(updatedAtoms) {
        for (const structureId in updatedAtoms) {
            const structure = this.sceneData.structuresData.structures[structureId];
            const edgesToMove = structure.edgesData.getEdgesAffectedByAtoms(updatedAtoms[structureId]);
            edgesToMove.forEach(edgeId => {
                const edge = structure.edgesData.getEdge(edgeId);
                if (!edge.enabled || edge.cyclic) {
                    return;
                }
                //create the information on how to draw the edge
                const edgeInfo = this.edgeBuilder.createBondByType(edge.from,
                    edge.to,
                    structure,
                    edge,
                    true
                );
                //update based on draw information
                this.createEdgeUpdateFunction(structure, edge, edgeInfo, true)
                    .function();
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the Change object to update the representation of a bond by
     * creating new draw information based on updated atom coordinates of the
     * atoms involved in the bond.
     *
     * @param structure {Structure} - Structure object which holds the bond
     * @param edge {Edge} - Edge object representing the bond
     * @param flipEdges {Set} - ids of stereo bonds that have to be flipped
     * @param edgeChangeCases {Object} - map from bond ids to log of how the
     * bond representation changes after immediate coordinate update and on
     * both apply and revert of the Change
     * @returns {Change} - Change object to apply/revert the bond update
     */
    updateEdgeCoordinates(structure, edge, flipEdges, edgeChangeCases) {
        const edgeId = edge.id;
        const edgeInfo = this.edgeBuilder.createBondByType(edge.from,
            edge.to,
            structure,
            edge,
            false
        );
        const oldEdgeInfo = edge.drawInfo;
        const wasFlipped = flipEdges.has(edgeId);
        //update the edge based on prev temp changes, this might be first draw
        const immediateUpdate = this.createEdgeUpdateFunction(structure,
            edge,
            edgeInfo,
            true,
            wasFlipped
        );
        immediateUpdate.function();
        //create full change from last recorded history point
        const edgeChange = new Change();
        const forwardUpdate = this.createEdgeUpdateFunction(structure,
            edge,
            edgeInfo,
            false,
            wasFlipped
        );
        //update the real draw info (missing from tempEdgeUpdate)
        edge.transferTempInformation();
        const backwardUpdate = this.createEdgeUpdateFunction(structure,
            edge,
            oldEdgeInfo,
            false,
            wasFlipped
        );
        //updates for angles
        let angleUpdateForward, angleUpdateBackward;
        if (edge.hidden) {
            angleUpdateForward = () => {
            };
            angleUpdateBackward = () => {
            };
        } else {
            const prevAngles = Object.assign({}, structure.edgesData.angles[edgeId]);
            //angles should be bundled in here
            structure.edgesData.calcRelevantAnglesForEdge(edgeId, true, false);
            const newAngles = Object.assign({}, structure.edgesData.angles[edgeId]);
            angleUpdateForward = () => {
                structure.edgesData.angles[edgeId] = Object.assign({}, newAngles);
            };
            angleUpdateBackward = () => {
                structure.edgesData.angles[edgeId] = Object.assign({}, prevAngles);
            }
        }
        edgeChangeCases[edgeId] = {
            immediate: immediateUpdate.changeCase,
            forward: forwardUpdate.changeCase,
            backward: backwardUpdate.changeCase
        };

        edgeChange.bindApply(() => {
            forwardUpdate.function();
            angleUpdateForward();
        });
        edgeChange.bindRevert(() => {
            backwardUpdate.function();
            angleUpdateBackward();
        });
        return edgeChange;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the Change object to change the type of a stereo bond to the
     * opposite type.
     *
     * @param edge {Edge} - Edge object representing the stereo bond
     * @returns {Change} - Change object to apply/revert type changing
     */
    createEdgeFlipChange(edge) {
        const flipChange = new Change();
        const type = edge.type;
        const newStereo = EdgeInfo.oppositeStereo(type);
        const apply = () => {
            edge.type = newStereo;
        };
        const revert = () => {
            edge.type = type;
        };
        flipChange.bindApply(apply);
        flipChange.bindRevert(revert);
        return flipChange;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Selects a bond in the draw area and mark it as temporarily (!) selected
     * in the bond's Structure container.
     *
     * @param structureId {Number} - id of the structure the bond belongs to
     * @param edgeId {Number} - id of the bond to select
     */
    tempSelectEdge(structureId, edgeId) {
        if (!this.sceneData.structuresData.structures.hasOwnProperty(structureId)) {
            return;
        }
        const structure = this.sceneData.structuresData.structures[structureId];
        structure.edgesData.tempSelectEdge(edgeId);
        this.edgeGroupsComponent.selectEdge(structureId, edgeId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Unselects a bond in the draw area and remove its selection status inside
     * the Structure container it belongs to.
     *
     * @param structureId {Number} - id of the structure the bond belongs to
     * @param edgeId {Number} - id of the bond to select
     * @param hover {Boolean} - whether the bond is to be shown as hovered
     * @param executeCallback {Boolean} - whether to execute the selection callback
     */
    unselectEdgeDrawareaContainer(
        structureId,
        edgeId,
        hover = false,
        executeCallback = true)
    {
        if (!this.sceneData.structuresData.structures.hasOwnProperty(structureId)) {
            return;
        }
        const structure = this.sceneData.structuresData.structures[structureId];
        structure.edgesData.selectedEdges.delete(edgeId);
        if (hover) {
            this.edgeGroupsComponent.hoverEdge(structureId, edgeId);
        } else {
            this.edgeGroupsComponent.unselectEdge(structureId, edgeId);
        }
        if (executeCallback && this.selectionCallback) {
            this.selectionCallback({
                type: 'edge',
                selectionType: 'unselect',
                structureId: parseInt(structureId),
                edgeId: parseInt(edgeId)
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Unselects a bond in the draw area.
     *
     * @param structureId {Number} - id of the structure the bond belongs to
     * @param edgeId {Number} - id of the bond to select
     */
    unselectEdgeDrawarea(structureId, edgeId) {
        this.edgeGroupsComponent.unselectEdge(structureId, edgeId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hovers an edge in the draw area.
     *
     * @param structureId {Number} - id of the structure the bond belongs to
     * @param edgeId {Number} - id of the bond to hover
     */
    hoverEdge(structureId, edgeId) {
        this.edgeGroupsComponent.hoverEdge(structureId, edgeId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * For specified structures, updates the debug text on bonds to new
     * positions based on updated temporary coordinates.
     *
     * @param structureIds {Array|Set} - ids of structures to update bond
     * debug text for
     */
    updateEdgeDebugTextPositions(structureIds) {
        for (const structureId of structureIds) {
            const structure = this.sceneData.structuresData.structures[structureId];
            structure.edgesData.edges.forEach(({id: edgeId, from, to}) => {
                this.edgeGroupsComponent.moveEdgeDebugText(structureId,
                    edgeId,
                    structure.atomsData.getAtom(from).tempCoordinates,
                    structure.atomsData.getAtom(to).tempCoordinates
                );
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the Change object to update the coloring of an edge.
     *
     * @param structureId {Number} - id of the structure the edge belongs to
     * @param edgeId {Number} - id of the edge to recolor
     * @param oldFromColor {String} - old edge color of start point of the gradient
     * @param oldToColor {String} - old edge color of end point of the gradient
     * @param newFromColor {String} - new edge color of start point of the gradient
     * @param newToColor {String} - new edge color of end point of the gradient
     * @returns {Change} - Change object to apply/revert the edge coloring update
     */
    createColorChangeEdge(structureId, edgeId, oldFromColor, oldToColor, newFromColor, newToColor) {
        //create edge color change based on inferred colors
        const edgeColorChange = new Change();
        const colorEdgeNew = () => {
            this.edgeGroupsComponent.recolorEdge(structureId, edgeId, newFromColor, newToColor);
        };
        const colorEdgeOld = () => {
            this.edgeGroupsComponent.recolorEdge(structureId, edgeId, oldFromColor, oldToColor);
        };
        edgeColorChange.bindApply(colorEdgeNew);
        edgeColorChange.bindRevert(colorEdgeOld);
        return edgeColorChange;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Rotate the EDGE skeleton of a structure (new atom positions to be set
     * separately).
     *
     * @param structureId {Number} - id of structure to move edge skeleton for
     * @param angle {Number} - angle to rotate by
     * @param origin {Object} - point to rotate around
     * @param isDeg {Boolean} - whether the provided angle is given in degrees
     * or radians
     */
    setRotationEdgeSkeleton(structureId, angle, origin, isDeg = true) {
        this.edgeGroupsComponent.setRotationEdgeSkeleton(structureId, angle, origin, isDeg);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Reset the rotation of an edge skeleton.
     *
     * @param structureId {Number} - id of structure to reset rotation for
     */
    resetEdgeSkeletonRotation(structureId) {
        this.edgeGroupsComponent.resetEdgeSkeletonRotation(structureId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * createEdgeUpdate() finds change cases for bonds, determining the type
     * of change applied (e.g., move or removal). Mimics this type of change on
     * the related aromatic bond and create a function to update the aromatic
     * bond accordingly.
     *
     * @param ring {Ring} - Ring object which holds the aromatic bond
     * @param edge {Edge} - Edge object representing the aromatic bond
     * @param structureId {Number} - id of the structure which holds the bond
     * @param changeCase {Number} - the type of change which applied to the
     * bond, see EdgeChangeCase in Enums.js
     * @returns {Function} - the function to perform the update
     */
    createAromaticEdgeUpdateFunction(ring, edge, structureId, changeCase) {
        const ringId = ring.id;
        const edgeId = edge.id;
        switch (changeCase) {
            case EdgeChangeCase.remove:
                return () => {
                    this.edgeGroupsComponent.removeAromaticRingEdge(structureId, edgeId, ringId);
                };
            case EdgeChangeCase.draw:
                return () => {
                    const innerPos = ring.findInnerPositionsForEdge(edge);
                    this.edgeGroupsComponent.drawAromaticRingEdge(structureId,
                        edgeId,
                        ringId,
                        innerPos.from,
                        innerPos.to
                    );
                };
            case EdgeChangeCase.redraw:
                return () => {
                    const innerPos = ring.findInnerPositionsForEdge(edge);
                    this.edgeGroupsComponent.redrawAromaticRingEdge(structureId, edgeId, ringId);
                    this.edgeGroupsComponent.moveAromaticRingEdge(structureId,
                        edgeId,
                        ringId,
                        innerPos.from,
                        innerPos.to
                    );
                };
            case EdgeChangeCase.move:
                return () => {
                    const innerPos = ring.findInnerPositionsForEdge(edge);
                    this.edgeGroupsComponent.moveAromaticRingEdge(structureId,
                        edgeId,
                        ringId,
                        innerPos.from,
                        innerPos.to
                    );
                };
            case EdgeChangeCase.pass:
            default:
                return () => {
                };
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * For all aromatic rings of a given Structure object, draws the aromatic
     * bonds next to the regular bonds of the ring.
     *
     * @param structure {Structure} - Structure object which holds the ring
     * information
     */
    drawAromaticEdgesForRings(structure) {
        Object.values(structure.ringsData.aromaticRings).forEach(ring => {
            ring.edges.forEach(ringEdge => {
                const innerPositions = ring.findInnerPositionsForEdge(ringEdge, false);
                this.edgeGroupsComponent.drawAromaticRingEdge(structure.id,
                    ringEdge.id,
                    ring.id,
                    innerPositions.from,
                    innerPositions.to
                );
            });
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves the aromatic bonds (i.e., the dashed bonds inside) of a ring to new
     * positions based on the temporary coordinate based movement on the bonds
     * they are associated with.
     *
     * @param structureId {Number} - id of the structure the bonds belong to
     * @param ring {Ring} - Ring object containing the edges to update
     * @param movedAromEdges {StructureIdTracker} - container to track which
     * aromatic bonds have already been updated
     * @param edgeChangeCases {Object} - how the representation of associated
     * bonds were updated (e.g., moved, hidden, ...), s.t. this update type can
     * be mimicked for the aromatic bonds
     */
    moveAromaticEdgesOfRingToTempCoordinates(structureId, ring, movedAromEdges, edgeChangeCases) {
        const ringId = ring.id;
        ring.edges.forEach(ringEdge => {
            const ringEdgeId = ringEdge.id;
            if (movedAromEdges.hasID(ringId, ringEdgeId)) return;
            //update according to update applied to corresponding edge
            if (edgeChangeCases.hasOwnProperty(ringEdgeId)) {
                this.createAromaticEdgeUpdateFunction(ring,
                    ringEdge,
                    structureId,
                    edgeChangeCases[ringEdgeId]
                )();
                //something happened to neighbor edge -> also move
            } else {
                const nextEid = ring.getNextEdge(ringEdgeId).id;
                const prevEid = ring.getPreviousEdge(ringEdgeId).id;
                if (edgeChangeCases.hasOwnProperty(nextEid) ||
                    edgeChangeCases.hasOwnProperty(prevEid)) {
                    this.createAromaticEdgeUpdateFunction(ring,
                        ringEdge,
                        structureId,
                        EdgeChangeCase.move
                    )();
                }
            }
            movedAromEdges.addID(ringId, ringEdgeId);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Change the color of aromatic bonds of a ring.
     *
     * @param structure {Structure} - structure the bond
     * belongs to
     * @param structureId {Number} - the unique id of the structure the bond
     * belongs to
     * @param ringId {Number} - the unique id of the ring
     * @param colorChanges {Array} - collects change objects for the history step
     */
    createColorChangesRingEdges(structure, structureId, ringId, colorChanges) {
        const ring = structure.ringsData.getRing(ringId);
        ring.edges.forEach(({id: edgeId}) => {
            const ringColorChange = new Change();
            const changeColor = () => {
                this.edgeGroupsComponent.recolorAromaticRingEdge(structureId, edgeId, ringId);
            };
            ringColorChange.bindApplyRevert(changeColor);
            ringColorChange.apply();
            colorChanges.push(ringColorChange);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves the aromatic bonds (i.e., the dashed bonds inside) of a all rings
     * including given atoms (by ids) based on the temporary coordinate based
     * movement on the bonds they are associated with.
     *
     * @param updatedAtoms {Array} - ids of atoms affected by interaction
     * @param edgeChangeCases {Object} - how the representation of associated
     * bonds were updated (e.g., moved, hidden, ...), s.t. this update type can
     * be mimicked for the aromatic bonds
     */
    moveAromaticEdgesToTempCoordinates(updatedAtoms, edgeChangeCases) {
        //edges can be in multiple rings, make sure to only move once
        const movedAromEdges = new StructureIdTracker();
        for (const structureId in updatedAtoms) {
            const structure = this.sceneData.structuresData.structures[structureId];
            structure.ringsData.getRingsAffectedByAtoms(updatedAtoms[structureId], true)
                .forEach(ringId => {
                    const ring = structure.ringsData.getRing(ringId);
                    ring.update(true);
                    this.moveAromaticEdgesOfRingToTempCoordinates(structureId,
                        ring,
                        movedAromEdges,
                        edgeChangeCases[structureId]
                    );
                });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves structural skeleton (as groups) of ring system edges by specified
     * offsets.
     *
     * @param structureId {Number} - id of structure containing the ring
     * system
     * @param ringSysId {Number} - id of ring systems to move skeleton of
     * @param xOffset {Number} - offset to move ring system by in x-direction
     * @param yOffset {Number} - offset to move ring system by in y-direction
     */
    moveRingEdgeSkeleton(structureId, ringSysId, xOffset, yOffset) {
        this.edgeGroupsComponent.moveRingEdgeSkeleton(structureId, ringSysId, xOffset, yOffset);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets translations made for edges of a certain ring system.
     *
     * @param structureId {Number} - id of structure containing the ring
     * system
     * @param ringSysId {Number} - id of ring systems to reset translations
     * for
     */
    resetRingEdgeSkeletonTranslation(structureId, ringSysId) {
        this.edgeGroupsComponent.resetRingEdgeSkeletonTranslation(structureId, ringSysId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a (new) structure, adds new container groups to the svg for edges.
     * Creates a new wrapper in the edge group. Further
     * prepares the mapping of selectors for later access. In the selector
     * map, the created groups are mapped also, so they may be hidden later.
     *
     * @param structure {Structure} - Structure object
     * @param structureId {structureId} - id of Structure object
     * @param debug {Boolean} - true if debug information shall be visualized
     */
    addEdgesToTrack(structure, structureId, debug) {
        this.edgeGroupsComponent.addEdgesToTrack(structure, structureId, debug);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves structural edge skeleton (as groups) by specified offsets.
     *
     * @param structureId {Number} - id of structure to move skeleton of
     * @param xOffset {Number} - offset to move structure by in x-direction
     * @param yOffset {Number} - offset to move structure by in y-direction
     */
    moveEdgeSkeleton(structureId, xOffset, yOffset) {
        this.edgeGroupsComponent.moveEdgeSkeleton(structureId, xOffset, yOffset);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets translations made for edges of a certain structure.
     *
     * @param structureId {Number} - id of structure to reset translations for
     */
    resetEdgeSkeletonTranslation(structureId) {
        this.edgeGroupsComponent.resetEdgeSkeletonTranslation(structureId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes edges of a structure from the DOM.
     *
     * @param structureId {Number} - the unique id of the structure to remove its
     * edges from DOM
     */
    removeStructureEdgesFromDOM(structureId) {
        this.edgeGroupsComponent.removeStructureEdgesFromDOM(structureId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes all cached edge information for a given structure (by its id).
     *
     * @param structureId {Number} - id of structure to remove information
     * about.
     */
    purgeStructureEdgesFromCache(structureId) {
        this.edgeGroupsComponent.purgeStructureEdgesFromCache(structureId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a previously removed structure, puts its detached edge DOM elements back
     * into previous positions.
     *
     * @param structureId {Number} - id of structure to add back
     */
    redrawStructureEdges(structureId) {
        this.edgeGroupsComponent.redrawStructureEdges(structureId);
    }
}