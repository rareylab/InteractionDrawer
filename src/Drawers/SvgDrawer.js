/**
 * Validates input JSON, manipulates the data and the draw area (components) with more specialized
 * drawers.
 * Most drawers manage their own component. Some drawers use other drawers
 * creating more complex drawings that consist of combinations of objects these drawers manage.
 * Performs also add, remove and move changes with respect to data and the draw area.
 */
class SvgDrawer {
    /**
     * Contains instances for configuration options, data storage/access, user interaction tracking
     * and draw area manipulation. A callback that will be executed on adding changes to
     * the scene can be set optionally.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     * @param interactionState {Object} - tracks user interactions
     * @param svgComponent {Object} - represents the draw area
     */
    constructor(opts, sceneData, interactionState, svgComponent) {
        this.opts = opts;
        this.sceneData = sceneData;
        this.interactionState = interactionState;
        this.svgComponent = svgComponent;

        this.viewerDrawer =
            new ViewerDrawer(this.opts, this.sceneData, this.interactionState, this.svgComponent);

        this.jsonValidator = new JsonValidator(this.sceneData);

        this.textLabelDrawer = new TextLabelDrawer(this.svgComponent);
        this.hydrophobicDrawer = new HydrophobicDrawer(this.opts,
            this.sceneData,
            this.svgComponent.transformGroupsComponent.hydrophobicGroupsComponent,
            this.jsonValidator
        );
        this.annotationDrawer = new AnnotationDrawer(this.opts,
            this.sceneData,
            this.svgComponent.transformGroupsComponent.annotationGroupsComponent,
            this.textLabelDrawer,
            this.jsonValidator
        );
        this.atomDrawer = new AtomDrawer(this.opts,
            this.sceneData,
            this.svgComponent.transformGroupsComponent.atomGroupsComponent
        );
        this.edgeDrawer = new EdgeDrawer(this.opts,
            this.sceneData,
            this.svgComponent.transformGroupsComponent.edgeGroupsComponent
        );
        this.ringDrawer =
            new RingDrawer(this.opts, this.sceneData, this.atomDrawer, this.edgeDrawer);
        this.intermolecularDrawer = new IntermolecularDrawer(this.opts,
            this.sceneData,
            this.svgComponent.transformGroupsComponent.intermolecularGroupsComponent,
            this.jsonValidator
        );
        this.structureCircleDrawer = new StructureCircleDrawer(this.opts,
            this.sceneData,
            this.svgComponent.transformGroupsComponent.structureCircleGroupsComponent,
            this.textLabelDrawer,
            this.annotationDrawer
        );
        this.structureDrawer = new StructureDrawer(this.opts,
            this.sceneData,
            this.svgComponent,
            this.viewerDrawer,
            this.atomDrawer,
            this.edgeDrawer,
            this.ringDrawer,
            this.structureCircleDrawer,
            this.jsonValidator
        );
        this.structureRepresentationDrawer = new StructureRepresentationDrawer(this.opts,
            this.sceneData,
            this.annotationDrawer,
            this.intermolecularDrawer,
            this.structureDrawer
        );

        this.historyDrawer = new HistoryDrawer(this.opts, this.sceneData, this.structureDrawer);

        this.preprocessCallback = null;
        this.removeCallback = null;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves atoms of a specified structure to new positions. In the following,
     * updates all bond draw elements that infer their positions from the moved
     * atoms. Returns the necessary Change objects to apply/revert these
     * coordinate changes.
     *
     * @param structureId {Number} - id of structure from which to move atoms
     * and bonds
     * @param newAtomCoords {Object} - map from atom ids to new coordinates
     * @param isFlip {Boolean} - whether the movement involves mirroring of
     * the structure and stereo bonds need to change
     * @param structureMaxes {BoundaryUpdateInfo} - log of how the boundaries
     * of the given structure change
     * @param globalMaxes {BoundaryUpdateInfo} - log of how the global
     * boundaries of the scene change
     * @returns {Object} - Change object array for the next history step and
     * information about affected intermolecular forces
     */
    applyCoordinateChanges(structureId, newAtomCoords, isFlip, structureMaxes, globalMaxes) {
        const structure = this.sceneData.structuresData.structures[structureId];

        const repAtoms = new Set(); //atoms that were really moved
        const repEdges = new Set(); //edges to reposition
        const flipEdges = new Set(); //edges moved by structure flipping
        const coordChanges = []; //bundles up all Change objects for history

        this.createApplyAtomChanges(structure,
            structureId,
            repAtoms,
            repEdges,
            flipEdges,
            coordChanges,
            newAtomCoords,
            isFlip
        );
        this.createApplyStereoAnnotationChange(structure, flipEdges, coordChanges);
        const edgeChangeCases = {};
        this.createApplyEdgeChanges(structure, repEdges, flipEdges, coordChanges, edgeChangeCases);
        this.createApplyHydrogenChanges(structureId, structure, coordChanges);
        this.createApplyAnnotationChanges(structureId, structure, coordChanges);
        this.createApplyAtomDrawLimitsChange(structureId,
            structure,
            repAtoms,
            coordChanges,
            structureMaxes,
            globalMaxes
        );
        this.createApplyAliphaticRingChanges(structure, repAtoms, coordChanges);
        this.createApplyAromaticRingChanges(structureId,
            structure,
            repAtoms,
            coordChanges,
            edgeChangeCases
        );
        const repAtomArr = [...repAtoms];
        this.createApplyRingCenterChanges(structure, repAtomArr, coordChanges);
        const affectedIntermolecular = {};
        this.collectAffectedIntermolecular(structure, repAtomArr, affectedIntermolecular);

        return {
            changes: coordChanges, ...affectedIntermolecular
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates and applies necessary atom movement changes and collects
     * subsequently corresponding edges of a specified structure by
     * checking for coordinate changes.
     *
     * @param structure {Object} - structure from which to move atoms
     * and bonds
     * @param structureId {Number} - id of structure from which to move atoms
     * and bonds
     * @param repAtoms {Set} - collects atoms that were really moved
     * @param repEdges {Set} - collects edges to reposition
     * @param flipEdges {Set} - ids of stereo bonds that have to be flipped
     * @param coordChanges {Array} - bundles up all movement changes
     * @param newAtomCoords {Object} - map from atom ids to new coordinates
     * @param isFlip {Boolean} - whether the movement involves mirroring of
     * the structure and stereo bonds need to change
     */
    createApplyAtomChanges(structure,
        structureId,
        repAtoms,
        repEdges,
        flipEdges,
        coordChanges,
        newAtomCoords,
        isFlip
    ) {
        const oldCoordMap = {};
        for (const atomId in newAtomCoords) {
            const atom = structure.atomsData.getAtom(atomId);
            if (!atom || !atom.enabled) {
                continue;
            }

            const newCoords = newAtomCoords[atomId];
            const oldCoords = atom.coordinates;

            if (!PointCalculation.coordsAlmostEqual(newCoords, oldCoords)) {
                const moveFn = (id, offsets) => {
                    const atomsToMove = {};
                    atomsToMove[structureId] = [id];
                    this.atomDrawer.moveAtomsByOffset(atomsToMove, offsets);
                };
                coordChanges.push(this.textLabelDrawer.updateTextLabelCoordinates(atom,
                    newCoords,
                    moveFn
                ));
                repAtoms.add(parseInt(atomId));
                oldCoordMap[atomId] = oldCoords;
                //find edges to move
                const neighbors = structure.atomsData.neighbors[atomId];
                neighbors.forEach(({edgeId}) => {
                    repEdges.add(edgeId);
                });
            }
            //find edges to flip (and thus, also move)
            const neighbors = structure.atomsData.neighbors[atomId];
            neighbors.forEach(({edgeId}) => {
                const type = structure.edgesData.getEdge(edgeId).type;
                if (isFlip && ([
                    'stereoFront', 'stereoBack', 'stereoFrontReverse', 'stereoBackReverse'
                ]
                    .includes(type))) {
                    flipEdges.add(edgeId);
                    //redraw here also on edges with unchanged coordinates
                    repEdges.add(edgeId);
                }
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates and applies stereo-annotation changes of edges if structure
     * was mirrored.
     *
     * @param structure {Structure} - structure from which to move annotations
     * @param flipEdges {Set} - ids of stereo bonds that have to be flipped
     * @param coordChanges {Array} - bundles up all movement changes
     */
    createApplyStereoAnnotationChange(structure, flipEdges, coordChanges) {
        flipEdges.forEach(edgeId => {
            const edge = structure.edgesData.getEdge(edgeId);
            if (!edge.enabled) {
                return;
            }
            const flipChange = this.edgeDrawer.createEdgeFlipChange(edge);
            flipChange.apply();
            coordChanges.push(flipChange);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Atoms were moved. Creates and applies necessary changes for corresponding edges.
     *
     * @param structure {Object} - structure from which to move atoms
     * and bonds
     * @param repEdges {Set} - collection of edges to reposition
     * @param flipEdges {Set} - ids of stereo bonds that have to be flipped
     * @param coordChanges {Array} - bundles up all movement changes
     * @param edgeChangeCases {Object} - map from bond ids to log of how the
     * bond representation changes after immediate coordinate update and on
     * both apply and revert of the Change
     */
    createApplyEdgeChanges(structure, repEdges, flipEdges, coordChanges, edgeChangeCases) {
        repEdges.forEach(edgeId => {
            const edge = structure.edgesData.getEdge(edgeId);
            if (!edge.enabled) {
                return;
            }
            coordChanges.push(this.edgeDrawer.updateEdgeCoordinates(structure,
                edge,
                flipEdges,
                edgeChangeCases
            ));
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks if positions of hydrogens need to be updated and applies changes.
     *
     * @param structureId {Object} - id of the structure from which to move atoms
     * and bonds
     * @param structure {Object} - structure from which to move atoms
     * and bonds
     * @param coordChanges {Array} - bundles up all movement changes
     */
    createApplyHydrogenChanges(structureId, structure, coordChanges) {
        const changedHs = structure.atomsData.findAtomsWithChangedHPlacement(false);
        for (const atomId in changedHs) {
            const atom = structure.atomsData.getAtom(atomId);
            const newHorientation = changedHs[atomId];
            const hChange = this.atomDrawer.createHPlacementChange(structureId,
                atom,
                newHorientation
            );
            //no need to redraw if temp changes have already set h right
            if (atom.tempHydrogenOrientation === newHorientation) {
                atom.setHydrogenOrientation(newHorientation);
            } else {
                hChange.apply();
            }
            coordChanges.push(hChange);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks if positions of annotations need to be updated and applies changes.
     *
     * @param structureId {Object} - id of the structure from which to move atoms
     * and bonds
     * @param structure {Object} - structure from which to move atoms
     * and bonds
     * @param coordChanges {Array} - bundles up all movement changes
     */
    createApplyAnnotationChanges(structureId, structure, coordChanges) {
        //check if positions of amino acid labels need to be updated
        const changedLabels = structure.atomsData.findAtomsWithChangedAnchors(false);
        for (const atomId in changedLabels) {
            const atom = structure.atomsData.getAtom(atomId);
            const newOrientation = changedLabels[atomId];
            const anchorChange = this.atomDrawer.createAnchorPlacementChange(structureId,
                atom,
                newOrientation
            );
            //no need to redraw if temp changes have replaced anchor already
            if (atom.tempLabelOrientation === newOrientation) {
                atom.setLabelSide(newOrientation, false);
            } else {
                anchorChange.apply();
            }
            coordChanges.push(anchorChange);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Setting of draw limits is based on all bounding boxes of the atom's
     * drawing, including for hydrogen, so can only happen now.
     *
     * @param structureId {Object} - id of the structure from which to move atoms
     * and bonds
     * @param structure {Object} - structure from which to move atoms
     * and bonds
     * @param repAtoms {Set} - collects atoms that were really moved
     * @param coordChanges {Array} - bundles up all movement changes
     * @param structureMaxes {BoundaryUpdateInfo} - log of how the boundaries
     * of the given structure change
     * @param globalMaxes {BoundaryUpdateInfo} - log of how the global
     * boundaries of the scene change
     */
    createApplyAtomDrawLimitsChange(structureId,
        structure,
        repAtoms,
        coordChanges,
        structureMaxes,
        globalMaxes
    ) {
        //function to update both limits simultaneously
        const updateBothMaxes = (prop, oldVal, newVal, largestIsLim) => {
            structureMaxes.updateMaxes(prop, oldVal, newVal, largestIsLim);
            globalMaxes.updateMaxes(prop, oldVal, newVal, largestIsLim);
        };
        repAtoms.forEach(atomId => {
            const atom = structure.atomsData.getAtom(atomId);

            //update draw limits and selector shapes
            const oldDrawLimits = Object.assign({}, atom.globalDrawLimits);
            this.atomDrawer.updateAtomDrawLimits(structureId, atomId, atom);
            const newDrawLimits = atom.globalDrawLimits;

            //update structure and global maxes based on new draw limits
            updateBothMaxes('xMin', oldDrawLimits.xMin, newDrawLimits.xMin, false);
            updateBothMaxes('xMax', oldDrawLimits.xMax, newDrawLimits.xMax, true);
            updateBothMaxes('yMin', oldDrawLimits.yMin, newDrawLimits.yMin, false);
            updateBothMaxes('yMax', oldDrawLimits.yMax, newDrawLimits.yMax, true);

            //change simple limit changes in history
            const limitChange = new Change();
            const changeLimits = () => {
                this.atomDrawer.updateAtomDrawLimits(structureId, atomId, atom);
            };
            limitChange.bindApplyRevert(changeLimits);
            coordChanges.push(limitChange);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates non aromatic rings as necessary for movements
     *
     * @param structure {Object} - structure from which to move atoms
     * and bonds
     * @param repAtoms {Set} - collects atoms that were really moved
     * @param coordChanges {Array} - bundles up all movement changes
     */
    createApplyAliphaticRingChanges(structure, repAtoms, coordChanges) {
        structure.ringsData.getRingsAffectedByAtoms(repAtoms, false).forEach(ringId => {
            const ring = structure.ringsData.getRing(ringId);
            const updateChange = new Change();
            updateChange.bindApplyRevert(() => {
                ring.update(false)
            });
            updateChange.apply();
            coordChanges.push(updateChange);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates aromatic rings as necessary for movement.
     *
     * @param structureId {Object} - id of the structure from which to move atoms
     * and bonds
     * @param structure {Object} - structure from which to move atoms
     * and bonds
     * @param repAtoms {Set} - collects atoms that were really moved
     * @param coordChanges {Array} - bundles up all movement changes
     * @param edgeChangeCases {Map} - map from bond ids to log of how the
     * bond representation changes after immediate coordinate update and on
     * both apply and revert of the change
     */
    createApplyAromaticRingChanges(structureId,
        structure,
        repAtoms,
        coordChanges,
        edgeChangeCases
    ) {
        structure.ringsData.getRingsAffectedByAtoms(repAtoms, true).forEach(ringId => {
            const ring = structure.ringsData.getRing(ringId);
            ring.edges.forEach(ringEdge => {
                const ringEdgeId = ringEdge.id;
                let immediate, forward, backward;

                if (edgeChangeCases.hasOwnProperty(ringEdgeId)) {
                    ({immediate, forward, backward} = edgeChangeCases[ringEdge.id]);
                } else {
                    const nextEdgeId = ring.getNextEdge(ringEdgeId).id;
                    const prevEdgeId = ring.getPreviousEdge(ringEdgeId).id;
                    if (!(edgeChangeCases.hasOwnProperty(nextEdgeId) ||
                        edgeChangeCases.hasOwnProperty(prevEdgeId))) {
                        return;
                    }
                    immediate = forward = backward = 'move';
                }

                this.edgeDrawer.createAromaticEdgeUpdateFunction(ring,
                    ringEdge,
                    structureId,
                    immediate,
                    false
                )();
                const ringEdgeChange = new Change();
                const forwardUpdate = this.edgeDrawer.createAromaticEdgeUpdateFunction(ring,
                    ringEdge,
                    structureId,
                    forward,
                    false
                );
                const backwardUpdate = this.edgeDrawer.createAromaticEdgeUpdateFunction(ring,
                    ringEdge,
                    structureId,
                    backward,
                    false
                );
                ringEdgeChange.bindApply(forwardUpdate);
                ringEdgeChange.bindRevert(backwardUpdate);
                coordChanges.push(ringEdgeChange);
            });
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates aromatic ring centers as necessary for movement.
     *
     * @param structure {Object} - structure from which to move atoms
     * and bonds
     * @param repAtomArr {Array} - collects atoms that were really moved
     * @param coordChanges {Array} - bundles up all movement changes
     */
    createApplyRingCenterChanges(structure, repAtomArr, coordChanges) {
        //update centers of ringsystems
        const affectedRingSystems = structure.ringsData.getRingSystemsAffectedByAtoms(repAtomArr);
        affectedRingSystems.forEach(ringSysId => {
            const ringSysChange = new Change();
            const ringSys = structure.ringsData.ringSystems[ringSysId];
            const oldCenter = Object.assign({}, ringSys.center);
            structure.ringsData.updateRingSystem(ringSysId, false);
            const newCenter = Object.assign({}, ringSys.center);
            const update = () => {
                structure.ringsData.setRingSystemCenter(ringSysId, newCenter, false);
            };
            const revert = () => {
                structure.ringsData.setRingSystemCenter(ringSysId, oldCenter, false);
            };
            ringSysChange.bindApply(update);
            ringSysChange.bindRevert(revert);
            coordChanges.push(ringSysChange);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Collects information about by movement affected intermolecular forces.
     *
     * @param structure {Object} - structure from which to move atoms
     * and bonds
     * @param repAtomArr {Array} - collects atoms that were really moved
     * @param affectedIntermolecular {Object} - information about by movement affected
     * intermolecular forces
     */
    collectAffectedIntermolecular(structure, repAtomArr, affectedIntermolecular) {
        if (this.interactionState.interaction.mode === InteractionMode.bondMirror ||
            this.interactionState.interaction.mode === InteractionMode.lineMirror) {
            affectedIntermolecular.affectedDistances =
                structure.intermolecularConnectionData.ids.distances;
            affectedIntermolecular.affectedInteractions =
                structure.intermolecularConnectionData.ids.interactions;
            affectedIntermolecular.affectedAtomPairInteractions =
                structure.intermolecularConnectionData.ids.atomPairInteractions;
            affectedIntermolecular.affectedPiStackings =
                structure.intermolecularConnectionData.ids.piStackings;
            affectedIntermolecular.affectedCationPiStackings =
                structure.intermolecularConnectionData.ids.cationPiStackings;
        } else {
            affectedIntermolecular.affectedDistances =
                structure.intermolecularConnectionData.ids.distances;
            affectedIntermolecular.affectedInteractions =
                structure.intermolecularConnectionData.ids.interactions;
            affectedIntermolecular.affectedAtomPairInteractions =
                structure.intermolecularConnectionData.getAtomPairInteractionsAffectedByAtoms(
                    repAtomArr, this.opts.moveFreedomLevel);
            affectedIntermolecular.affectedPiStackings =
                structure.intermolecularConnectionData.getPiStackingsAffectedByAtoms(repAtomArr);
            affectedIntermolecular.affectedCationPiStackings =
                structure.intermolecularConnectionData.getCationPiStackingsAffectedByAtoms(
                    repAtomArr);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Catch-all function to apply any sort of changes and one step in the history.
     * Creates a new history step array to which gradually new Change objects
     * are added. In the end, also update structural boundaries where necessary.
     *
     * @param colorChanges {Object} - new colors for atoms
     * @param coordinateChanges {Object} - new coordinates for atoms
     * @param splineCoordinateChanges {Object} - new coordinates for spline
     * control points
     * @param annotationCoordinateChanges {Object} - new coordinates for
     * annotations
     * @param remove {Object} - structures, atoms, bonds, annotations and
     * intermolecular interactions to remove from the draw area
     * @param add {Object} - new scene information
     */
    applySceneChanges({
        colorChanges,
        coordinateChanges,
        splineCoordinateChanges,
        annotationCoordinateChanges,
        remove,
        add
    }) {
        //accumulate changes and log what types of changes happen
        const historyStep = new HistoryStep();

        //initiate values to track through all change types
        const globalMaxes = new BoundaryUpdateInfo(this.sceneData.globalLimits);

        const addedStructureIds = [];
        if (add && add.scene) {
            this.applyAdd(add, historyStep, addedStructureIds, globalMaxes);
        }
        const changedStructureMaxes = {};
        if (remove) {
            this.applyRemove(remove, historyStep, changedStructureMaxes, globalMaxes);
        }

        const allCoordChanges = [];
        const intermolecularChanges = {
            atomPairInteractions: new Set(),
            piStackings: new Set(),
            cationPiStackings: new Set(),
            distances: new Set(),
            interactions: new Set()
        };
        if (coordinateChanges) {
            this.applyStructureMovement(coordinateChanges,
                allCoordChanges,
                intermolecularChanges,
                changedStructureMaxes,
                globalMaxes
            );
        }

        this.updateStructuresBoundaries(allCoordChanges,
            historyStep,
            changedStructureMaxes,
            globalMaxes
        );

        if (splineCoordinateChanges) {
            this.applyHydrophobicMovement(splineCoordinateChanges, allCoordChanges, globalMaxes);
        }

        if (annotationCoordinateChanges) {
            this.applyAnnotationMovement(annotationCoordinateChanges, allCoordChanges, globalMaxes);
        }

        this.applyIntermolecularMovement(intermolecularChanges, allCoordChanges);

        if (colorChanges) {
            this.applyColorChanges(colorChanges, historyStep);
        }

        //merge coordinate changes into history step, apply callback if necessary
        if (allCoordChanges.length) {
            historyStep.addChanges(allCoordChanges);
            historyStep.addAction('sceneChange');
        }

        //update global boundaries
        this.historyDrawer.setNewLimits(this.sceneData,
            globalMaxes,
            'globalLimits',
            'calcBoundaries',
            historyStep
        );

        //apply created history step to history
        if (historyStep.hasChanges()) {
            this.historyDrawer.applyStepToHistory(historyStep, addedStructureIds);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Applies any sort of add changes to scene. Sets a new history step to Array.
     *
     * @param add {Object} - new scene information
     * @param historyStep {Object} - new history step array to which new add
     * Change object is added
     * @param addedStructureIds {Array} - ids of added structures
     * @param globalMaxes {BoundaryUpdateInfo} - log of how the global
     * boundaries of the scene change
     */
    applyAdd(add, historyStep, addedStructureIds, globalMaxes) {
        this.sceneData.loadedJsonStrings.push(JSON.stringify(add));
        const scene = add.scene;
        if (this.preprocessCallback) {
            this.preprocessCallback(scene);
        }
        //gradually add structural units and accumulate changes
        const allAddChanges = [];
        if (scene.structures) {
            Array.prototype.push.apply(allAddChanges,
                this.structureDrawer.applyAddStructures(scene.structures,
                    globalMaxes,
                    addedStructureIds
                )
            );
        }
        if (scene.atomPairInteractions) {
            Array.prototype.push.apply(allAddChanges,
                this.intermolecularDrawer.applyAddIntermolecular(scene.atomPairInteractions,
                    'atomPairInteractions'
                )
            );
        }
        if (scene.piStackings) {
            Array.prototype.push.apply(allAddChanges,
                this.intermolecularDrawer.applyAddIntermolecular(scene.piStackings, 'piStackings')
            );
        }
        if (scene.cationPiStackings) {
            Array.prototype.push.apply(allAddChanges,
                this.intermolecularDrawer.applyAddIntermolecular(scene.cationPiStackings,
                    'cationPiStackings'
                )
            );
        }
        if (scene.distances) {
            Array.prototype.push.apply(allAddChanges,
                this.intermolecularDrawer.applyAddIntermolecular(scene.distances, 'distances')
            );
        }
        if (scene.interactions) {
            Array.prototype.push.apply(allAddChanges,
                this.intermolecularDrawer.applyAddIntermolecular(scene.interactions, 'interactions')
            );
        }
        if (scene.hydrophobicContacts) {
            Array.prototype.push.apply(allAddChanges,
                this.hydrophobicDrawer.applyAddHydrophobic(scene.hydrophobicContacts, globalMaxes)
            );
        }
        if (scene.annotations) {
            Array.prototype.push.apply(allAddChanges,
                this.annotationDrawer.applyAddAnnotations(scene.annotations, globalMaxes)
            );
        }
        //apply add changes to history step
        if (!allAddChanges.length) return;
        historyStep.addChanges(allAddChanges);
        historyStep.addAction('sceneChange');
        addedStructureIds.forEach(structureId => {
            //keep original structure for reset and SMARTS
            this.sceneData.structuresData.originalStructures[structureId] =
                this.sceneData.structuresData.structures[structureId].clone();
        });

        //set the initial representation of all added structures
        if (scene.structures) {
            this.structureRepresentationDrawer.setInitialStructureRepresentation(scene.structures);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes specified elements in the draw area.
     * Returns the necessary Change objects to apply/revert this removal.
     *
     * @param structures {Array|Set} - ids of structure to completely remove
     * @param atoms {Array|Set} - ids of atoms to remove
     * @param edges {Array|Set} - ids of bonds to remove
     * @param annotations {Array|Set} - ids of annotations to remove
     * @param atomPairInteractions {Array|Set} - ids of atom pair interactions to remove
     * @param piStackings {Array|Set} - ids of pi stackings to remove
     * @param cationPiStackings {Array|Set} - ids of cation pi stackings to remove
     * @param hydrophobicContacts {Array|Set} - ids of hydrophobic contacts to remove
     * Those are objects which have 'id' as key and can optional have specified
     * control points (key 'controlPoints', values as array of ids) to only remove
     * those
     * @param historyStep {Object} - new history step array to which new remove
     * Change object is added
     * @param changedStructureMaxes {Object} - log of how the boundaries
     * of the given structures change
     * @param globalMaxes {BoundaryUpdateInfo} - log of how the global
     * boundaries of the scene change
     * @returns {Array} - Change objects for the next history step
     */
    applyRemove({
        structures,
        atoms,
        edges,
        annotations,
        atomPairInteractions,
        piStackings,
        cationPiStackings,
        hydrophobicContacts
    }, historyStep, changedStructureMaxes, globalMaxes) {
        const removeCollector = new RemoveCollector(this.opts, this.sceneData);
        const {
            remStructures,
            remAtoms,
            remEdges,
            remAnnotations,
            remAtomPairInteractions,
            remPiStackings,
            remCationPiStackings,
            remHydrophobicContacts
        } = removeCollector.determineRemoveObjects({
            structures,
            atoms,
            edges,
            annotations,
            atomPairInteractions,
            piStackings,
            cationPiStackings,
            hydrophobicContacts
        });

        const remChanges = []; //bundle up changes

        const markRequiredRecalcs = (prop, val, strucId = undefined) => {
            if (!globalMaxes[prop].changeDir) {
                if (globalMaxes[prop].val === val) {
                    globalMaxes[prop].changeDir = -1;
                }
            }

            if (!strucId) {
                return;
            }

            if (!changedStructureMaxes.hasOwnProperty(strucId)) {
                changedStructureMaxes[strucId] =
                    new BoundaryUpdateInfo(this.sceneData.structuresData.structures[strucId].boundaries);
            }
            if (!changedStructureMaxes[strucId][prop].changeDir) {
                if (changedStructureMaxes[strucId][prop].val === val) {
                    changedStructureMaxes[strucId][prop].changeDir = -1;
                }
            }
        };
        this.structureDrawer.removeStructures(remStructures, remChanges, markRequiredRecalcs);
        const removedAtomEdges = this.atomDrawer.removeAtoms(remAtoms,
            remChanges,
            markRequiredRecalcs
        );
        Helpers.mergeIntoSet(remEdges, removedAtomEdges);
        const remCarbonAtoms = this.edgeDrawer.removeEdges(remEdges, remChanges);
        this.atomDrawer.removeCarbonAtoms(remCarbonAtoms, remChanges);
        this.annotationDrawer.removeAnnotations(remAnnotations, remChanges, markRequiredRecalcs);
        this.hydrophobicDrawer.removeHydrophobicContacts(remHydrophobicContacts,
            remChanges,
            markRequiredRecalcs
        );
        this.intermolecularDrawer.removeIntermolecular(remAtomPairInteractions,
            remChanges,
            'atomPairInteractions'
        );
        this.intermolecularDrawer.removeIntermolecular(remPiStackings, remChanges, 'piStackings');
        this.intermolecularDrawer.removeIntermolecular(remCationPiStackings,
            remChanges,
            'cationPiStackings'
        );
        if (remChanges.length) {
            historyStep.addChanges(remChanges);
            historyStep.addAction('sceneChange');
        }
        if (this.removeCallback) {
            this.removeCallback();
        }
        return remChanges;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves atoms of multiple structures to new positions. In the following,
     * updates all bond draw elements that infer their positions from the moved
     * atoms. Returns the necessary change objects to apply/revert these
     * coordinate changes. Collects data for movement of interactions.
     *
     * @param coordinateChanges {Object} - new coordinates for atoms
     * @param allCoordChanges {Array} - accumulate all types (structures, splines, annotations)
     * of coordinate changes for history
     * @param intermolecularChanges {Object} - contains the keys 'atomPairInteractions',
     * 'piStackings' and 'cationPiStackings' which contain the ids of
     * corresponding interactions to move.
     * @param changedStructureMaxes {Object} - log of how the boundaries
     * of the given structures change
     * @param globalMaxes {BoundaryUpdateInfo} - log of how the global
     * boundaries of the scene change
     */
    applyStructureMovement(coordinateChanges,
        allCoordChanges,
        intermolecularChanges,
        changedStructureMaxes,
        globalMaxes
    ) {
        for (const structureId in coordinateChanges) {
            if (!this.sceneData.structuresData.structuresInUse.has(parseInt(structureId))) {
                continue;
            }
            const {newCoordinates, isFlip} = coordinateChanges[structureId];
            const structureMaxes = changedStructureMaxes[structureId] ?
                changedStructureMaxes[structureId] :
                new BoundaryUpdateInfo(this.sceneData.structuresData.structures[structureId].boundaries);
            const {
                changes,
                affectedDistances,
                affectedInteractions,
                affectedAtomPairInteractions,
                affectedPiStackings,
                affectedCationPiStackings
            } = this.applyCoordinateChanges(structureId,
                newCoordinates,
                isFlip,
                structureMaxes,
                globalMaxes
            );
            if (!changes.length) {
                continue;
            }
            Array.prototype.push.apply(allCoordChanges, changes);
            intermolecularChanges.distances = new Set([
                ...intermolecularChanges.distances, ...affectedDistances
            ]);
            intermolecularChanges.interactions = new Set([
                ...intermolecularChanges.interactions, ...affectedInteractions
            ]);
            intermolecularChanges.atomPairInteractions = new Set([
                ...intermolecularChanges.atomPairInteractions, ...affectedAtomPairInteractions
            ]);
            intermolecularChanges.piStackings = new Set([
                ...intermolecularChanges.piStackings, ...affectedPiStackings
            ]);
            intermolecularChanges.cationPiStackings = new Set([
                ...intermolecularChanges.cationPiStackings, ...affectedCationPiStackings
            ]);
            changedStructureMaxes[structureId] = structureMaxes;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates boundaries of structures and update structure circles.
     *
     * @param allCoordChanges {Array} - accumulate all types (structures, splines, annotations)
     * of coordinate changes for history
     * @param historyStep {Object} - new history step array to which new remove
     * Change object is added
     * @param changedStructureMaxes {Object} - log of how the boundaries
     * of the given structures change
     * @param globalMaxes {BoundaryUpdateInfo} - log of how the global
     * boundaries of the scene change
     */
    updateStructuresBoundaries(allCoordChanges, historyStep, changedStructureMaxes, globalMaxes) {
        for (const structureId in changedStructureMaxes) {
            const structure = this.sceneData.structuresData.structures[structureId];
            this.historyDrawer.setNewLimits(structure,
                changedStructureMaxes[structureId],
                'boundaries',
                'calcBoundaries',
                historyStep
            );
            if (structure.representationsData.hasRepresentation(StructureRepresentation.circle)) {
                Array.prototype.push.apply(allCoordChanges,
                    this.structureCircleDrawer.applyCoordinateChangesStructureCircle(structure,
                        globalMaxes
                    )
                );
                const oldBounds = structure['boundaries'];
                const boundChanged = structure.addStructureCircleToBoundaries();
                if (boundChanged) {
                    this.historyDrawer.setNewLimitsToHistory(structure,
                        oldBounds,
                        'boundaries',
                        historyStep
                    );
                }
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates atom color.
     *
     * @param colorChanges {Object} - new colors for atoms
     * @param historyStep {Object} - new history step array to which new remove
     * Change object is added
     */
    applyColorChanges(colorChanges, historyStep) {
        const allColorChanges = [];
        for (const structureId in colorChanges) {
            if (!this.sceneData.structuresData.structuresInUse.has(parseInt(structureId))) {
                continue;
            }
            Array.prototype.push.apply(allColorChanges,
                this.structureDrawer.applyColorChanges(structureId, colorChanges[structureId])
            );
        }
        if (allColorChanges.length) {
            historyStep.addChanges(allColorChanges);
            historyStep.addAction('colorChange');
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves hydrophobic splines to new positions.
     *
     * @param splineCoordinateChanges {Object} - new coordinates for spline's
     * control points
     * @param allCoordChanges {Array} - accumulate all types (structures, splines, annotations)
     * of coordinate changes for history
     * @param globalMaxes {BoundaryUpdateInfo} - log of how the global
     * boundaries of the scene change
     */
    applyHydrophobicMovement(splineCoordinateChanges, allCoordChanges, globalMaxes) {
        for (const splineId in splineCoordinateChanges) {
            const spline = this.sceneData.hydrophobicData.hydrophobicContacts[splineId];
            const newControlPoints = splineCoordinateChanges[splineId];
            Array.prototype.push.apply(allCoordChanges,
                this.hydrophobicDrawer.applyCoordinateChangesSpline(splineId,
                    spline,
                    newControlPoints,
                    globalMaxes
                )
            );
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves annotation to new positions.
     *
     * @param annotationCoordinateChanges {Object} - new coordinates for
     * annotations
     * @param allCoordChanges {Array} - accumulate all types (structures, splines, annotations)
     * of coordinate changes for history
     * @param globalMaxes {BoundaryUpdateInfo} - log of how the global
     * boundaries of the scene change
     */
    applyAnnotationMovement(annotationCoordinateChanges, allCoordChanges, globalMaxes) {
        for (const labelId in annotationCoordinateChanges) {
            if (!this.sceneData.annotationsData.annotations.hasOwnProperty(labelId)) {
                continue;
            }
            Array.prototype.push.apply(allCoordChanges,
                this.annotationDrawer.applyCoordinateChangesAnnotation(labelId,
                    annotationCoordinateChanges[labelId],
                    globalMaxes
                )
            );
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves intermolecular edges to new positions.
     *
     * @param intermolecularChanges {Object} - contains the keys 'atomPairInteractions',
     * 'piStackings' and 'cationPiStackings' which contain the ids of
     * corresponding interactions to move.
     * @param allCoordChanges {Array} - accumulate all types (structures, splines, annotations)
     * of coordinate changes for history
     */
    applyIntermolecularMovement(intermolecularChanges, allCoordChanges) {
        if (Object.keys(intermolecularChanges).length > 0) {
            Array.prototype.push.apply(allCoordChanges,
                this.intermolecularDrawer.applyCoordinateChangesAllIntermolecular(
                    intermolecularChanges)
            );
        }
    }
}