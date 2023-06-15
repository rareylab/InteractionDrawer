/**
 * Drawer that uses other drawers and its own component for the visualization
 * of various intermolecular edges.
 */
class IntermolecularDrawer {
    /**
     * Contains instances for json validation, configuration options,
     * data storage/access, draw area manipulation and all relevant components.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     * @param intermolecularGroupsComponent {Object} - component for intermolecular edges
     * @param jsonValidator {Object} - validates input JSON
     */
    constructor(opts, sceneData, intermolecularGroupsComponent, jsonValidator) {
        this.opts = opts;
        this.sceneData = sceneData;
        this.intermolecularGroupsComponent = intermolecularGroupsComponent;
        this.jsonValidator = jsonValidator;

        this.selectionCallback = null;
        this.edgeBuilder = new EdgeBuilder(opts, sceneData);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates the coordinates of intermolecular forces based on previously
     * set new positions of their related elements. Returns the necessary change
     * objects to apply/revert these coordinate changes.
     *
     * @param intermolecularChanges {Object} - contains the keys 'atomPairInteractions',
     * 'piStackings' and 'cationPiStackings' which contain the ids of
     * corresponding interactions to move
     * @returns {Array} - change objects for the next history step
     */
    applyCoordinateChangesAllIntermolecular({
        distances, interactions, atomPairInteractions, piStackings, cationPiStackings
    }) {
        const intermolecularChanges = [];
        Array.prototype.push.apply(intermolecularChanges,
            this.applyCoordinateChangesIntermolecular(distances, 'distances')
        );
        Array.prototype.push.apply(intermolecularChanges,
            this.applyCoordinateChangesIntermolecular(interactions, 'interactions')
        );
        Array.prototype.push.apply(intermolecularChanges,
            this.applyCoordinateChangesIntermolecular(atomPairInteractions, 'atomPairInteractions')
        );
        Array.prototype.push.apply(intermolecularChanges,
            this.applyCoordinateChangesIntermolecular(piStackings, 'piStackings')
        );
        Array.prototype.push.apply(intermolecularChanges,
            this.applyCoordinateChangesIntermolecular(cationPiStackings, 'cationPiStackings')
        );
        return intermolecularChanges;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates the coordinates of cation-pi stacking interactions based on the
     * previously set new position for the connected atom and the new position
     * of the center of the connected ring system. Returns the necessary change
     * objects to apply/revert these coordinate changes.
     *
     * @param interactionIds {Set} - ids of interactions to move
     * @param type {String} - identifier of the intermolecular edge
     * @returns {Array} - change objects for the next history step
     */
    applyCoordinateChangesIntermolecular(interactionIds, type) {
        const container = this.sceneData.intermolecularData[type];
        const interactionChanges = [];
        interactionIds.forEach(interactionId => {
            this.updateSingleIntermolecular(interactionId, type, true);
            const moveToNew = () => {
                this.updateSingleIntermolecular(interactionId, type, true);
            };
            if (type === 'atomPairInteractions') {
                const atomPairInteraction = container[interactionId];
                atomPairInteraction.transferTempHidden();
            }
            const moveBack = () => {
                this.updateSingleIntermolecular(interactionId, type, true);
            };
            const interactionChange = new Change();
            interactionChange.bindApply(moveToNew);
            interactionChange.bindRevert(moveBack);
            if (type === 'cationPiStackings' || type === 'piStackings') {
                interactionChange.apply();
            }
            interactionChanges.push(interactionChange);
        });
        return interactionChanges;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds the individual components of different interactions based on the
     * fields of provided scene draw information and link interactions
     * to the endpoints they connect. Returns the necessary change objects to
     * remove and re-add these components.
     *
     * @param interactionInfos {Array} - draw information for the different
     * interaction to be added to the scene
     * @param type {String} - identifier of the intermolecular edge
     * @returns {undefined|Array} - change objects for the next history step
     */
    applyAddIntermolecular(interactionInfos, type) {
        if (this.jsonValidator.checkJSONStructureArray(interactionInfos, type, true).error) {
            return;
        }
        //apply add for each given info
        const addChanges = [];
        interactionInfos.forEach((interactionInfo, i) => {
            interactionInfo.fromStruct =
                this.sceneData.structuresData.structures[interactionInfo.fromStructure];
            interactionInfo.toStruct =
                this.sceneData.structuresData.structures[interactionInfo.toStructure];
            if (this.jsonValidator.intermolecularMolJSONerror(interactionInfo, i, type)) {
                return;
            }
            //destructure required draw information
            if (type === 'atomPairInteractions') {
                interactionInfo.fromObj =
                    interactionInfo.fromStruct.atomsData.getAtom(interactionInfo.from);
                interactionInfo.toObj =
                    interactionInfo.toStruct.atomsData.getAtom(interactionInfo.to);
            } else if (type === 'piStackings') {
                interactionInfo.fromObj =
                    interactionInfo.fromStruct.ringsData.getRing(interactionInfo.from);
                interactionInfo.toObj =
                    interactionInfo.toStruct.ringsData.getRing(interactionInfo.to);
            } else if (type === 'cationPiStackings') {
                interactionInfo.fromObj =
                    interactionInfo.fromStruct.ringsData.getRing(interactionInfo.from);
                interactionInfo.toObj =
                    interactionInfo.toStruct.atomsData.getAtom(interactionInfo.to);
            } else if (type === 'distances' || type === 'interactions') {
                const annotations = this.sceneData.annotationsData.annotations;
                interactionInfo.fromObj = annotations[interactionInfo.from];
                interactionInfo.toObj = annotations[interactionInfo.to];
            }
            if (this.jsonValidator.intermolecularEndPointJSONerror(interactionInfo, i, type)) {
                return;
            }
            IntermolecularDrawer.memorizeConnectionsInStructure(interactionInfo, type);

            this.createNewIntermolecular(interactionInfo, type, addChanges);
        });
        return addChanges;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Memorizes which structure parts are connected by an intermolecular edge.
     *
     * @param interactionInfo {Array} - draw information for an interaction to be added to the scene
     * @param type {String} - identifier of the intermolecular edge
     */
    static memorizeConnectionsInStructure(interactionInfo, type) {
        const {
            fromStruct: fromStruct, toStruct: toStruct, from: from, to: to, id: interactionId
        } = interactionInfo;
        if (type === 'atomPairInteractions') {
            fromStruct.intermolecularConnectionData.addIntermolecularConnection(from,
                interactionId,
                type,
                'atom'
            );
            toStruct.intermolecularConnectionData.addIntermolecularConnection(to,
                interactionId,
                type,
                'atom'
            );
        } else if (type === 'piStackings') {
            fromStruct.intermolecularConnectionData.addIntermolecularConnection(from,
                interactionId,
                type,
                'ring'
            );
            toStruct.intermolecularConnectionData.addIntermolecularConnection(to,
                interactionId,
                type,
                'ring'
            );
        } else if (type === 'cationPiStackings') {
            fromStruct.intermolecularConnectionData.addIntermolecularConnection(from,
                interactionId,
                type,
                'ring'
            );
            toStruct.intermolecularConnectionData.addIntermolecularConnection(to,
                interactionId,
                type,
                'atom'
            );
        } else if (type === 'distances' || type === 'interactions') {
            fromStruct.intermolecularConnectionData.addIntermolecularConnection(from,
                interactionId,
                type,
                'annotation'
            );
            toStruct.intermolecularConnectionData.addIntermolecularConnection(to,
                interactionId,
                type,
                'annotation'
            );
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates a new instance and draws the intermolecular edge.
     *
     * @param interactionInfo {Array} - draw information for an interaction to be added to the scene
     * @param type {String} - identifier of the intermolecular edge
     * @param addChanges {Array} - collects this drawing change for the history
     */
    createNewIntermolecular(interactionInfo, type, addChanges) {
        const {
            fromStruct: fromStruct,
            toStruct: toStruct,
            from: from,
            to: to,
            id: interactionId,
            fromStructure: fromStructure,
            toStructure: toStructure,
            additionalInformation: additionalInformation
        } = interactionInfo;
        const color = this.getIntermolecularColor(interactionInfo, type);
        //create bond and fill it with initial draw information
        const newInteraction = new IntermolecularEdge(interactionId,
            from,
            to,
            fromStructure,
            toStructure,
            color,
            additionalInformation
        );
        this.sceneData.intermolecularData[type][interactionId] = newInteraction;
        this.calcIntermolecularConnectionOrder(type, interactionId, false);
        const midpoints = this.edgeBuilder.getNewIntermolecularCoords(interactionId,
            type,
            fromStruct,
            toStruct,
            from,
            to
        );
        const [midFrom, midTo] = midpoints;
        const interactionRep = this.edgeBuilder.createSingleEdge(midFrom, midTo);
        if (!interactionRep) { //no space to draw
            return;
        }
        newInteraction.setDrawInfo(interactionRep, false);
        newInteraction.setHidden(false, false);
        this.intermolecularGroupsComponent.drawIntermolecular(newInteraction, interactionRep, type);
        addChanges.push(this.createRemoveChangeIntermolecular(interactionId, type));
    }

    /*----------------------------------------------------------------------*/

    /**
     * Determines the color of a new intermolecular edge.
     *
     * @param interactionInfo {Array} - draw information for an interaction to be added to the scene
     * @param type {String} - identifier of the intermolecular edge
     */

    getIntermolecularColor(interactionInfo, type) {
        const colors = this.opts.colors;
        if (type === 'atomPairInteractions') {
            const structures = this.sceneData.structuresData.structures;
            const fromAtomsData = structures[interactionInfo.fromStructure].atomsData;
            const toAtomsData = structures[interactionInfo.toStructure].atomsData;
            const fromAtom = fromAtomsData.getAtom(interactionInfo.from);
            const toAtom = toAtomsData.getAtom(interactionInfo.to);
            if (fromAtom.isMetal() || toAtom.isMetal()) {
                return colors.metalInteractions;
            } else if ((fromAtom.charge > 0 && toAtom.charge < 0) ||
                (fromAtom.charge < 0 && toAtom.charge > 0)) {
                return colors.ionicInteractions;
            }
        }
        return colors[type];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Binds functions for adding and removing of an interaction to a Change object
     *
     * @param change {Change} - change oObject to apply/revert removal
     * @param readd {Boolean} - function for the readding of an interaction
     * @param remove {Boolean} - function for the removing of an interaction
     * @param isAdd {Boolean} - whether the change should add the interaction
     * as its apply() or revert() function
     */
    static bindCreateRemoveChangeInteraction(change, readd, remove, isAdd) {
        if (isAdd) {
            change.bindApply(readd);
            change.bindRevert(remove);
        } else {
            change.bindApply(remove);
            change.bindRevert(readd);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the Change object to remove/re-add a cation-pi stacking
     * interaction.
     *
     * @param interactionId {Number} - id of the interaction to remove/re-add
     * @param type {String} - identifier of the intermolecular edge
     * @param isAdd {Boolean} - whether the change should add the interaction
     * as its apply() or revert() function
     * @returns {Change} - Change object to apply/revert removal
     */
    createRemoveChangeIntermolecular(interactionId, type, isAdd = true) {
        const interactionChange = new Change();
        const remove = () => {
            if (this.sceneData.intermolecularData.selectedIntermolecular[type].has(
                parseInt(interactionId))) {
                this.sceneData.intermolecularData.selectedIntermolecular[type].delete(
                    parseInt(interactionId));
                const container = this.sceneData.intermolecularData[type];
                const interaction = container[interactionId];
                interaction.selected = false;
            }
            this.sceneData.intermolecularData[type][interactionId].enabled = false;
            this.intermolecularGroupsComponent.removeIntermolecularFromDOM(interactionId, type);
            this.calcIntermolecularConnectionOrder(type, interactionId, true, false);
        };
        const readd = () => {
            this.sceneData.intermolecularData[type][interactionId].enabled = true;
            this.intermolecularGroupsComponent.redrawIntermolecular(interactionId, type);
            this.calcIntermolecularConnectionOrder(type, interactionId);
        };
        IntermolecularDrawer.bindCreateRemoveChangeInteraction(interactionChange,
            readd,
            remove,
            isAdd
        );
        return interactionChange;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds/Removes a intermolecular connection to/from intermolecularConnections
     * and recalculates the order to draw those connections if both involved
     * structures are represented as structure circles.
     *
     * @param type {String} - identifier of the intermolecular edge
     * @param id {Number} - id of the connection
     * @param add {Boolean} - add (true, default) or remove (false) the connection
     * @param update {Boolean} - whether to update the draw elements of all
     * connections between the two structures involved in this connection
     */
    calcIntermolecularConnectionOrder(type, id, update = true, add = true) {
        let {
            fromStructure, toStructure
        } = this.sceneData.intermolecularData.getIntermolecularByType(type, id);
        if (fromStructure > toStructure) {
            [fromStructure, toStructure] = [toStructure, fromStructure];
        }
        const connections = this.sceneData.structuresData.intermolecularConnections;
        if (!connections.hasOwnProperty(fromStructure)) {
            connections[fromStructure] = {};
        }
        if (!connections[fromStructure].hasOwnProperty(toStructure)) {
            connections[fromStructure][toStructure] = [];
        }
        const connectionArr = connections[fromStructure][toStructure];
        if (add) {
            connectionArr.push({
                type: type, id: id
            })
        } else {
            let removeId;
            connectionArr.forEach((con, idx) => {
                if (con.type === type && con.id == id) {
                    removeId = idx;
                }
            });
            if (removeId !== undefined) {
                connectionArr.splice(removeId, 1);
            }
        }
        //order the array so that (cation) pi stackings are far away from each
        //other because they are drawn with circles on at least one structure
        //and we want max distance between those circles so they do not overlap.
        const piIdx = [];
        const hIdx = [];
        connectionArr.forEach((con, idx) => {
            if (con.type === 'piStackings' || con.type === 'cationPiStacking') {
                piIdx.push(idx);
            } else {
                hIdx.push(idx);
            }
        });
        if (piIdx.length > 1) {
            const sortedArr = [];
            //how much elements between each (cation) pi
            const hBetween = Math.floor(hIdx.length / (piIdx.length - 1));
            //how much gaps between each (cation) pi are one larger than hBetween
            let extraH = hIdx.length % (piIdx.length - 1);
            let hCount = 0;

            sortedArr.push(connectionArr[piIdx.pop()]);
            for (let i = 1; i < connectionArr.length; i++) {
                if (hCount < hBetween) {
                    sortedArr.push(connectionArr[hIdx.pop()]);
                    hCount++;
                } else if (hCount === hBetween && extraH > 0) {
                    sortedArr.push(connectionArr[hIdx.pop()]);
                    hCount++;
                    extraH--;
                } else {
                    sortedArr.push(connectionArr[piIdx.pop()]);
                    hCount = 0;
                }
            }
            this.sceneData.structuresData.intermolecularConnections[fromStructure][toStructure] =
                sortedArr;
        }
        if (update) {
            this.updateIntermolecularConnections(fromStructure, toStructure);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates intermolecular connections between two structures which
     * representations are both structure circle. This is done after such
     * connections are removed.
     *
     * @param from {Number} - structure id of first structure involved
     * @param to {Number} - structure id of second structure involved
     */
    updateIntermolecularConnections(from, to) {
        if (!this.sceneData.structuresData.structures.hasOwnProperty(from) ||
            !this.sceneData.structuresData.structures.hasOwnProperty(to) ||
            this.sceneData.structuresData.structures[from].representationsData.curRepresentation() !==
            StructureRepresentation.circle ||
            this.sceneData.structuresData.structures[to].representationsData.curRepresentation() !==
            StructureRepresentation.circle) {
            return;
        }
        const fromStructure = this.sceneData.structuresData.structures[from];
        const toStructure = this.sceneData.structuresData.structures[to];

        const {
            distances: fromDistances,
            interactions: fromInteractions,
            atomPairInteractions: fromAtomPairInteractions,
            piStackings: fromPiStackings,
            cationPiStackings: fromCationPiStackings
        } = fromStructure.getConnectedElements();
        const {
            distances: toDistances,
            interactions: toInteractions,
            atomPairInteractions: toAtomPairInteractions,
            piStackings: toPiStackings,
            cationPiStackings: toCationPiStackings
        } = toStructure.getConnectedElements();
        this.updateAllIntermolecular(Helpers.getIntersectionOfTwoSets(fromDistances, toDistances),
            Helpers.getIntersectionOfTwoSets(fromInteractions, toInteractions),
            Helpers.getIntersectionOfTwoSets(fromAtomPairInteractions, toAtomPairInteractions),
            Helpers.getIntersectionOfTwoSets(fromPiStackings, toPiStackings),
            Helpers.getIntersectionOfTwoSets(fromCationPiStackings, toCationPiStackings),
            true
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates intermolecular coordinates based on
     * coordinates of the involved atom/structureCircle and center information
     * of the involved ring system/structureCircle.
     *
     * @param intermolecularIds {Array} - intermolecular ids for coordinates updated
     * @param type {String} - identifier of the intermolecular edge
     * @param updateDrawInfo {Boolean} - whether to upgrade the draw info
     * of the intermolecular edge
     * @param byTemp {Boolean} - whether to use temp coordinates
     */
    updateAllIntermolecularOfType(intermolecularIds, type, updateDrawInfo = false, byTemp = false) {
        intermolecularIds.forEach(interactionId => {
            this.updateSingleIntermolecular(interactionId, type, updateDrawInfo, byTemp);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates coordinates of all intermolecular types.
     *
     * @param updateDrawInfo {Boolean} - whether to upgrade the draw info
     * of the intermolecular edge
     * @param byTemp {Boolean} - whether to use temp coordinates.
     */
    updateAllIntermolecular(distances,
        interactions,
        atomPairInteractions,
        piStackings,
        cationPiStackings,
        updateDrawInfo = false,
        byTemp = false
    ) {
        this.updateAllIntermolecularOfType(distances, 'distances', updateDrawInfo, byTemp);
        this.updateAllIntermolecularOfType(interactions, 'interactions', updateDrawInfo, byTemp);
        this.updateAllIntermolecularOfType(atomPairInteractions,
            'atomPairInteractions',
            updateDrawInfo,
            byTemp
        );
        this.updateAllIntermolecularOfType(piStackings, 'piStackings', updateDrawInfo, byTemp);
        this.updateAllIntermolecularOfType(cationPiStackings,
            'cationPiStackings',
            updateDrawInfo,
            byTemp
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Update coordinates of endpoints of one intermolecular endpoints.
     *
     * @param interactionId {Number} - ids of the cation pi stacking to move
     * @param type {String} - identifier of the intermolecular edge
     * @param updateDrawInfo {Boolean} - whether to upgrade this intermolecular
     * draw info
     * @param byTemp {Boolean} - whether to use temp coordinates
     */
    updateSingleIntermolecular(interactionId, type, updateDrawInfo = false, byTemp = false) {
        const interaction = this.sceneData.intermolecularData[type][interactionId];
        const {
            from: from, to: to, fromStructure: fromStructureId, toStructure: toStructureId
        } = interaction;
        const fromStructure = this.sceneData.structuresData.structures[fromStructureId];
        const toStructure = this.sceneData.structuresData.structures[toStructureId];
        if (fromStructure && toStructure) {
            const midpoints = this.edgeBuilder.getNewIntermolecularCoords(interactionId,
                type,
                fromStructure,
                toStructure,
                from,
                to,
                byTemp
            );
            const [midFrom, midTo] = midpoints;
            const interactionInfo = this.edgeBuilder.createSingleEdge(midFrom, midTo);
            if (type === 'atomPairInteractions') {
                this.createUpdateAtomPairInteraction(interactionId, interactionInfo, byTemp, type)();
            } else {
                this.intermolecularGroupsComponent.moveIntermolecular(interactionId,
                    interactionInfo,
                    type
                );
            }
            if (updateDrawInfo) {
                interaction.setDrawInfo(interactionInfo, byTemp);
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Similar to createEdgeUpdateFunction(), determines what should happen to a
     * atom pair interaction based on newly calculated bond draw information.
     *
     * @param atomPairInteractionId {Number} - id of the atom pair interaction
     * @param atomPairInteractionInfo {Object} - draw information for the atom pair interaction
     * @param byTemp {Boolean} - whether to base atom pair interaction update on
     * temporary visibility information
     * @returns {Function} - the function to perform the update
     */
    createUpdateAtomPairInteraction(atomPairInteractionId, atomPairInteractionInfo, byTemp, type) {
        const atomPairInteraction = this.sceneData.intermolecularData[type][atomPairInteractionId];
        const hiddenParam = byTemp ? 'tempHidden' : 'hidden';
        if (!atomPairInteractionInfo) {
            if (!atomPairInteraction[hiddenParam]) { //remove representation
                return () => {
                    atomPairInteraction.setHidden(true, byTemp);
                    this.intermolecularGroupsComponent.removeIntermolecularFromDOM(atomPairInteractionId,
                        type
                    );
                }
            } else { //else no need to do anything
                return () => {
                };
            }
        } else {
            if (atomPairInteraction[hiddenParam]) {
                if (!this.intermolecularGroupsComponent.wasAtomPairInteractionDrawnBefore(
                    atomPairInteractionId)) {
                    return () => {
                        atomPairInteraction.setHidden(false, byTemp);
                        this.intermolecularGroupsComponent.drawIntermolecular(atomPairInteraction,
                            atomPairInteractionInfo,
                            type
                        );
                    }
                } else {
                    return () => {
                        atomPairInteraction.setHidden(false, byTemp);
                        this.intermolecularGroupsComponent.redrawIntermolecular(atomPairInteractionId,
                            type
                        );
                        this.intermolecularGroupsComponent.moveIntermolecular(atomPairInteractionId,
                            atomPairInteractionInfo,
                            type
                        );
                    }
                }
            } else {
                return () => {
                    this.intermolecularGroupsComponent.moveIntermolecular(atomPairInteractionId,
                        atomPairInteractionInfo,
                        type
                    );
                }
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes specified interactions in the draw area.
     *
     * @param remInteractions {Set} - ids of interactions to remove
     * @param remChanges {Array} - change objects for the history step
     * @param type {String} - identifier of the intermolecular edge
     */
    removeIntermolecular(remInteractions, remChanges, type) {
        const container = this.sceneData.intermolecularData[type];
        remInteractions.forEach(interactionId => {
            if (!container.hasOwnProperty(interactionId) || !container[interactionId].enabled) {
                return;
            }
            const remChange = this.createRemoveChangeIntermolecular(interactionId, type, false);
            remChange.apply();
            remChanges.push(remChange);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates temporary coordinates for atoms of a structure which are part of
     * cation-pi or atom pair interactions to still allow proper update of these
     * interactions during movement of structures by composite layers.
     *
     * @param structureId {Number} - id of structure moved by composite layers
     * @param offset {Object} - x- and y-offsets structure is moved by
     * @param changedAtomIds {StructureIdTracker} - tracker of which atoms'
     * temporary coordinates are changed during movement
     * @param connectionType {String} - name of the intermolecular connection
     */
    updateTempCoordsForIntermolecularAtom(structureId, offset, changedAtomIds, connectionType) {
        const structure = this.sceneData.structuresData.structures[structureId];
        Object.keys(structure.intermolecularConnectionData.connections[connectionType].atom)
            .forEach(atomId => {
                AtomDrawer.updateTempCoordsForAtom(structure,
                    parseInt(atomId),
                    offset,
                    changedAtomIds
                );
            });
    };

    /*----------------------------------------------------------------------*/

    /**
     * For a structure specified by id, note in a provided container which ring
     * systems have to be updated based on connected aromatic ring interactions,
     * i. e. pi-pi and cation-pi
     * @param structureId {Number} - id of the structure
     * @param changedRingSys {StructureIdTracker} - container to mark ring
     * @param type {String} - identifier of the intermolecular edge
     * systems to update in
     */
    findRingSystemsToTempUpdateIntermolecular(structureId, changedRingSys, type) {
        const structure = this.sceneData.structuresData.structures[structureId];
        const ringIds = Object.keys(structure.intermolecularConnectionData.connections[type].ring);
        ringIds.forEach(ringId => {
            RingDrawer.markRingSystemForTempUpdate(structureId,
                parseInt(structure.ringsData.getRing(ringId).ringSystem),
                changedRingSys
            );
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Selects an interaction in the draw area and mark it as selected in the
     * interactions's container.
     *
     * @param interactionId {Number} - id of the interaction to unselect
     * @param type {String} - identifier of the intermolecular edge
     * @param executeCallback {Boolean} - whether to execute the selection callback
     */
    selectIntermolecularDrawareaContainer(interactionId, type, executeCallback = true) {
        const container = this.sceneData.intermolecularData[type];
        if (!container.hasOwnProperty(interactionId)) {
            return;
        }
        const interaction = container[interactionId];
        this.sceneData.intermolecularData.selectedIntermolecular[type].add(interactionId);
        interaction.selected = true;
        this.intermolecularGroupsComponent.selectIntermolecular(interactionId, type);
        if (executeCallback && this.selectionCallback) {
            this.selectionCallback({
                type: type,
                selectionType: 'select',
                interactionId: parseInt(interactionId),
                additionalInformation: interaction.additionalInformation
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Unselects an interaction in the draw area and remove its selection status inside
     * the interaction's container.
     *
     * @param interactionId {Number} - id of the interaction to unselect
     * @param type {String} - identifier of the intermolecular edge
     * @param hover {Boolean} - whether interaction is to be shown as hovered
     * @param executeCallback {Boolean} - whether to execute the selection callback
     */
    unselectIntermolecularDrawareaContainer(interactionId,
        type,
        hover = false,
        executeCallback = true
    ) {
        const container = this.sceneData.intermolecularData[type];
        if (!container.hasOwnProperty(interactionId)) {
            return;
        }
        const interaction = container[interactionId];
        this.sceneData.intermolecularData.selectedIntermolecular[type].delete(parseInt(interactionId));
        interaction.selected = false;
        if (hover) {
            this.intermolecularGroupsComponent.hoverIntermolecular(interactionId, type);
        } else {
            this.intermolecularGroupsComponent.unselectIntermolecular(interactionId, type);
        }
        if (executeCallback && this.selectionCallback) {
            this.selectionCallback({
                type: type,
                selectionType: 'unselect',
                interactionId: parseInt(interactionId),
                additionalInformation: interaction.additionalInformation
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Instructs the draw layer to unselect all currently hovered intermolecular
     * interactions (atom pair interactions, pi stackings, and cation pi stackings).
     */
    unselectAllIntermolecular() {
        for (const type of this.sceneData.intermolecularData.intermolecularTypes) {
            for (const intermolecularId in this.sceneData.intermolecularData[type]) {
                if (!this.sceneData.intermolecularData.selectedIntermolecular[type].has(parseInt(
                    intermolecularId))) {
                    this.intermolecularGroupsComponent.unselectIntermolecular(intermolecularId,
                        type
                    )
                }
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes an intermolecular edge from the DOM and the view cache.
     *
     * @param interactionId {Number} - id of the interaction to remove
     * @param type {String} - identifier of the intermolecular edge
     */
    removeIntermolecularDOMCache(interactionId, type) {
        this.intermolecularGroupsComponent.removeIntermolecularFromDOM(interactionId, type);
        this.intermolecularGroupsComponent.purgeIntermolecularFromCache(interactionId, type);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hovers an intermolecular edge.
     *
     * @param interactionId {Number} - id of the interaction to hover
     * @param type {String} - identifier of the intermolecular edge
     */
    hoverIntermolecular(interactionId, type) {
        this.intermolecularGroupsComponent.hoverIntermolecular(interactionId, type);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Unselects an intermolecular edge in the draw area only.
     *
     * @param intermolecularId {Number} - id of the intermolecular edge to unselect
     * @param type {String} - identifier of the intermolecular edge
     */
    unselectIntermolecularDrawarea(intermolecularId, type) {
        this.intermolecularGroupsComponent.unselectIntermolecular(intermolecularId, type);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Selects an intermolecular edge in the draw area only.
     *
     * @param intermolecularId {Number} - id of the intermolecular edge to select
     * @param type {String} - identifier of the intermolecular edge
     */
    selectIntermolecularDrawarea(intermolecularId, type) {
        this.intermolecularGroupsComponent.selectIntermolecular(intermolecularId, type);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes an intermolecular edge from the draw area and data.
     *
     * @param intermolecularId {Number} - id of the intermolecular edge to remove
     * @param type {String} - identifier of the intermolecular edge
     */
    removeGeomineQueryPointToPointConstraintDataView(intermolecularId, type) {
        const intermolecularData = this.sceneData.intermolecularData;
        const intermolecularEdge = intermolecularData[type][intermolecularId];
        const fromStructureId = intermolecularEdge.fromStructure;
        const toStructureId = intermolecularEdge.toStructure;
        const fromStructure = this.sceneData.structuresData.structures[fromStructureId];
        const intermolecularConnectionDataFrom = fromStructure.intermolecularConnectionData;
        intermolecularConnectionDataFrom.ids[type].delete(intermolecularId);
        const connectionsFrom = intermolecularConnectionDataFrom.connections;
        delete connectionsFrom[type].annotation[intermolecularEdge.from];
        const toStructure = this.sceneData.structuresData.structures[toStructureId];
        const intermolecularConnectionDataTo = toStructure.intermolecularConnectionData;
        intermolecularConnectionDataTo.ids[type].delete(intermolecularId);
        const connectionsTo = intermolecularConnectionDataTo.connections;
        delete connectionsTo[type].annotation[intermolecularEdge.to];
        this.removeIntermolecularDOMCache(intermolecularId, type);
        intermolecularData.selectedIntermolecular[type].delete(intermolecularId);
        delete intermolecularData[type][intermolecularId];
    }
}