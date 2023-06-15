/**
 * Drawer that uses its own component for the visualization of hydrophobic contacts.
 */
class HydrophobicDrawer {
    /**
     * Contains instances for json validation, configuration options,
     * data storage/access, draw area manipulation and all relevant components.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     * @param hydrophobicGroupsComponent {Object} - component for hydrophobic contacts
     * @param jsonValidator {Object} - validates input JSON
     */
    constructor(opts, sceneData, hydrophobicGroupsComponent, jsonValidator) {
        this.opts = opts;
        this.sceneData = sceneData;
        this.hydrophobicGroupsComponent = hydrophobicGroupsComponent;
        this.jsonValidator = jsonValidator;
        this.closestObjectFinder = new ClosestObjectFinder(opts, sceneData);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds the individual components of different hydrophobic contacts based on
     * the "hydrophobicContacts" field of provided scene draw information and
     * link hydrophobic contacts to the structures they belong to. Returns the
     * necessary Change objects to remove and re-add these components.
     *
     * @param hydrophobicInfos {Array} - draw information for the different
     * hydrophobic contacts to be added to the scene
     * @param globalMaxes {BoundaryUpdateInfo} - log of how the global
     * boundaries of the scene change
     * @returns {undefined|Array} - Change objects for the next history step
     */
    applyAddHydrophobic(hydrophobicInfos, globalMaxes) {
        const jsonKey = 'hydrophobicContacts';
        if (this.jsonValidator.checkJSONStructureArray(hydrophobicInfos, jsonKey, true).error) {
            return;
        }
        //apply add for each given info
        const addChanges = [];
        hydrophobicInfos.forEach((hydrophobicInfo, i) => {
            if (this.jsonValidator.hydrophobicJSONerror(hydrophobicInfo, i, jsonKey)) {
                return;
            }
            const structure = this.sceneData.structuresData.structures[hydrophobicInfo.belongsTo];
            if (!this.sceneData.hydrophobicData.hydrophobicContacts.hasOwnProperty(hydrophobicInfo.id)) {
                this.addNewControlPoint(structure, hydrophobicInfo, globalMaxes, addChanges);
            } else {
                this.extendExistingControlPoint(structure,
                    hydrophobicInfo,
                    globalMaxes,
                    addChanges
                );
            }
        });
        return addChanges
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates and adds a new spline to the draw area.
     *
     * @param structure {Object} - structure the control point belongs to
     * @param hydrophobicInfo {Array} - draw information for a hydrophobic contact
     * to be added to the scene
     * @param globalMaxes {BoundaryUpdateInfo} - log of how the global
     * boundaries of the scene change
     * @param addChanges {Array} - collects this drawing change for the history
     */
    addNewControlPoint(structure, hydrophobicInfo, globalMaxes, addChanges) {
        const {
            id: hId, belongsTo: structureId, controlPoints, controlPointsInsertId
        } = hydrophobicInfo;
        //create spline and reference in memory
        const spline = new Spline(structureId);
        spline.addControlPointsFromData(controlPoints, this.opts.atomSelectorRadius);
        //link control points to atoms
        controlPoints.forEach(({atomLinks, x, y}, cpId) => {
            if (!atomLinks || atomLinks.length === 0) {
                const atom = this.closestObjectFinder.getClosestEnabledAtom({x: x, y: y},
                    [structure.id]
                );
                atomLinks = [atom.id];
                spline.controlPoints[cpId].atomLinks = atomLinks;
            }
            new Set(atomLinks).forEach(atomLink => {
                structure.hydrophobicConnectionData.linkAtomToSplineControlPoint(atomLink,
                    hId,
                    cpId
                );
            });
        });
        structure.hydrophobicConnectionData.addHydrophobicContact(hId, spline);
        this.hydrophobicGroupsComponent.drawHydrophobicContact(structureId,
            hId,
            spline.controlPoints,
            spline.createSplinePath(false)
        );
        //for setting of limits
        spline.getCurveCoords(false).forEach(({x, y}) => {
            const rad = this.opts.lineWidth;
            globalMaxes.setMaxesAdd(x - rad, x + rad, y - rad, y + rad);
        });
        addChanges.push(this.createAddRemoveChangeHydrophobic(structureId, hId));
        this.sceneData.hydrophobicData.hydrophobicContacts[hId] = spline;
        this.sceneData.hydrophobicData.originalHydrophobicContacts[hId] = spline.clone();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Extends an existing spline with respect to data and draw area..
     *
     * @param structure {Object} - structure the control point belongs to
     * @param hydrophobicInfo {Array} - draw information for a hydrophobic contact
     * to be added to the scene
     * @param globalMaxes {BoundaryUpdateInfo} - log of how the global
     * boundaries of the scene change
     * @param addChanges {Array} - collects this drawing change for the history
     */
    extendExistingControlPoint(structure, hydrophobicInfo, globalMaxes, addChanges) {
        const {
            id: hId, belongsTo: structureId, controlPoints, controlPointsInsertId
        } = hydrophobicInfo;
        const spline = this.sceneData.hydrophobicData.hydrophobicContacts[hId];
        const insertId = controlPointsInsertId !== undefined ? controlPointsInsertId :
            this.sceneData.hydrophobicData.hydrophobicContacts[hId].controlPoints.length;
        spline.addControlPointsFromData(controlPoints, this.opts.atomSelectorRadius, insertId);

        spline.controlPoints.forEach(({atomLinks, x, y}, cpId) => {
            if (!atomLinks || atomLinks.length === 0) {
                const atom = this.closestObjectFinder.getClosestEnabledAtom({x: x, y: y},
                    [structure.id]
                );
                atomLinks = [atom.id];
                spline.controlPoints[cpId].atomLinks = atomLinks;
            }
            new Set(atomLinks).forEach(atomLink => {
                structure.hydrophobicConnectionData.linkAtomToSplineControlPoint(atomLink,
                    hId,
                    cpId
                );
            });
        });
        this.sceneData.hydrophobicData.originalHydrophobicContacts[hId].addControlPointsFromData(Object.assign([], controlPoints),
            this.opts.atomSelectorRadius,
            insertId
        );
        this.hydrophobicGroupsComponent.addHydrophobicControlPoints(structureId,
            hId,
            controlPoints,
            insertId
        );
        this.updateSplineRepresentation(hId);
        spline.getCurveCoords(false).forEach(({x, y}) => {
            const rad = this.opts.lineWidth;
            globalMaxes.setMaxesAdd(x - rad, x + rad, y - rad, y + rad);
        });
        for (let i = insertId; i < insertId + controlPoints.length; i++) {
            addChanges.push(this.createAddRemoveChangeHydrophobicControlPoint(
                structureId,
                hId,
                i,
                true,
                spline.controlPoints[i]
            ));
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the Change object to remove/re-add a hydrophobic contact.
     *
     * @param structureId {Number} - id of the structure the hydrophobic
     * contact belongs to
     * @param hydrophobicId {Number} - id of the hydrophobic contact to
     * remove/re-add
     * @param isAdd {Boolean} - whether the change should add the hydrophobic
     * contact as its apply() or revert() function
     * @returns {Change} - Change object to apply/revert removal
     */
    createAddRemoveChangeHydrophobic(structureId, hydrophobicId, isAdd = true) {
        const hydrophobicChange = new Change();
        const remove = () => {
            this.sceneData.hydrophobicData.hydrophobicContacts[hydrophobicId].enabled = false;
            this.hydrophobicGroupsComponent.removeHydrophobicContactFromDOM(structureId,
                hydrophobicId
            );
        };
        const readd = () => {
            this.sceneData.hydrophobicData.hydrophobicContacts[hydrophobicId].enabled = true;
            this.hydrophobicGroupsComponent.redrawHydrophobicContact(structureId, hydrophobicId);
        };
        if (isAdd) {
            hydrophobicChange.bindApply(readd);
            hydrophobicChange.bindRevert(remove);
        } else {
            hydrophobicChange.bindApply(remove);
            hydrophobicChange.bindRevert(readd);
        }
        return hydrophobicChange;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the Change object to remove/re-add a single control point from a
     * hydrophobic contact. Connsiders that the array index of previously added
     * control points can change upon adding further control points, e.g. 0 becomes
     * 1. Therefore, the control point index is redetermined by coordinates.
     *
     * @param structureId {Number} - id of the structure the hydrophobic
     * contact belongs to
     * @param hydrophobicId {Number} - id of the hydrophobic contact to
     * remove/re-add a control point from
     * @param controlPointId {Number} - id of the control point of the
     * hydrophobic contact to remove/re-add
     * @param isAdd {Boolean} - whether the change should add the control
     * point as its apply() or revert() function
     * @param controlPoint {Object} - the corresponding control point
     * @returns {Change} - Change object to apply/revert removal
     */
    createAddRemoveChangeHydrophobicControlPoint(structureId,
        hydrophobicId,
        controlPointId,
        isAdd ,
        controlPoint = undefined
    ) {
        const hydrophobicChange = new Change();
        const remove = () => {
            const hContact = this.sceneData.hydrophobicData.hydrophobicContacts[hydrophobicId];
            let cPoint;
            let tempCpoint;
            let idxCorrected = false;
            for (let idx = 0; idx < hContact.controlPoints.length; idx++) {
                cPoint = hContact.controlPoints[idx];
                tempCpoint = hContact.tempControlPoints[idx];
                if (Helpers.isAlmostEqual(controlPoint.x, cPoint.x) &&
                    Helpers.isAlmostEqual(controlPoint.y, cPoint.y)) {
                    controlPointId = idx;
                    idxCorrected = true;
                    break;
                }
            }
            if (!idxCorrected) {
                cPoint = hContact.controlPoints[controlPointId];
                tempCpoint = hContact.tempControlPoints[controlPointId];
            }
            cPoint.enabled = false;
            tempCpoint.enabled = false;
            this.hydrophobicGroupsComponent.removeHydrophobicControlPoint(structureId,
                hydrophobicId,
                controlPointId
            );
            this.updateSplineRepresentation(hydrophobicId);
        };
        const readd = () => {
            const hContact = this.sceneData.hydrophobicData.hydrophobicContacts[hydrophobicId];
            let cPoint;
            let tempCpoint;
            let idxCorrected = false;
            for (let idx = 0; idx < hContact.controlPoints.length; idx++) {
                cPoint = hContact.controlPoints[idx];
                tempCpoint = hContact.tempControlPoints[idx];
                if (Helpers.isAlmostEqual(controlPoint.x, cPoint.x) &&
                    Helpers.isAlmostEqual(controlPoint.y, cPoint.y)) {
                    controlPointId = idx;
                    idxCorrected = true;
                    break;
                }
            }
            if (!idxCorrected) {
                cPoint = hContact.controlPoints[controlPointId];
                tempCpoint = hContact.tempControlPoints[controlPointId];
            }
            cPoint.enabled = true;
            tempCpoint.enabled = true;
            this.hydrophobicGroupsComponent.redrawHydrophobicControlPoint(structureId,
                hydrophobicId,
                controlPointId
            );
            this.updateSplineRepresentation(hydrophobicId);
        };
        if (isAdd) {
            hydrophobicChange.bindApply(readd);
            hydrophobicChange.bindRevert(remove);
        } else {
            hydrophobicChange.bindApply(remove);
            hydrophobicChange.bindRevert(readd);
        }
        return hydrophobicChange;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Triggers the update of a specific spline representing a hydrophobic
     * contact.
     *
     * @param hydrophobicId {Number} - id of the hydrophobic contact
     */
    updateSplineRepresentation(hydrophobicId) {
        const spline = this.sceneData.hydrophobicData.hydrophobicContacts[hydrophobicId];
        const splinePath = spline.createSplinePath(true);
        const controlPoints = spline.getControlPoints(true);
        this.hydrophobicGroupsComponent.updateHydrophobicContact(spline.structureLink,
            hydrophobicId,
            controlPoints,
            splinePath
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets the coordinates of control points of a single spline to new values.
     * Returns the necessary Change objects to apply/revert these coordinate
     * changes.
     *
     * @param hydrophobicId {Number} - id of the spline
     * @param spline {Spline} - Spline object representing the spline
     * @param newControlPoints {Object} - map from control point ids to new
     * coordinates
     * @param globalMaxes {BoundaryUpdateInfo} - log of how the global
     * boundaries of the scene change
     * @returns {Array} - Change objects for the next history step
     */
    applyCoordinateChangesSpline(hydrophobicId, spline, newControlPoints, globalMaxes) {
        const splineChanges = [];
        const oldControlPoints = spline.getControlPoints(false);
        let updateNeeded = false;
        for (const pointId in newControlPoints) {
            //control point update
            const oldInfo = Object.assign({}, oldControlPoints[pointId]);
            const newInfo = Object.assign({}, newControlPoints[pointId]);
            if (PointCalculation.coordsAlmostEqual(oldInfo, newInfo)) {
                continue;
            }
            updateNeeded = true;
            const pointChange = new Change();
            const setPointNew = () => {
                spline.setControlPoint(pointId, newInfo, false);
            };
            const setPointOld = () => {
                spline.setControlPoint(pointId, oldInfo, false);
            };
            pointChange.bindApply(setPointNew);
            pointChange.bindRevert(setPointOld);
            pointChange.apply();
            splineChanges.push(pointChange);
        }
        if (!updateNeeded) return splineChanges; //no changes made
        //update the spline path based on new control points
        const updateChange = new Change();
        const oldCurveCoords = spline.getCurveCoords(false);
        const updateSpline = () => {
            const splinePath = spline.createSplinePath(false);
            const controlPoints = spline.getControlPoints(false);
            this.hydrophobicGroupsComponent.updateHydrophobicContact(spline.structureLink,
                hydrophobicId,
                controlPoints,
                splinePath
            );
        };
        updateChange.bindApplyRevert(updateSpline);
        updateChange.apply();
        splineChanges.push(updateChange);
        //update coordinates based on all the curve coords
        const newCurveCoords = spline.getCurveCoords(false);
        let xMinSet = false, xMaxSet = false, yMinSet = false, yMaxSet = false;
        const rad = this.opts.lineWidth;
        newCurveCoords.forEach(({x, y}) => {
            if (globalMaxes.updateMaxesLim('xMin', x - rad, false)) {
                xMinSet = true;
            }
            if (globalMaxes.updateMaxesLim('xMax', x + rad, true)) {
                xMaxSet = true;
            }
            if (globalMaxes.updateMaxesLim('yMin', y - rad, false)) {
                yMinSet = true;
            }
            if (globalMaxes.updateMaxesLim('yMax', y + rad, true)) {
                yMaxSet = true;
            }
        });
        oldCurveCoords.forEach(({x, y}) => {
            if (!xMinSet) {
                globalMaxes.updateMaxesNeg('xMin', x - rad, false);
            }
            if (!xMaxSet) {
                globalMaxes.updateMaxesNeg('xMax', x + rad, true);
            }
            if (!yMinSet) {
                globalMaxes.updateMaxesNeg('yMin', y - rad, false);
            }
            if (!yMaxSet) {
                globalMaxes.updateMaxesNeg('yMax', y + rad, true);
            }
        });
        return splineChanges;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes specified hydrophobic contacts (or parts of those) in the draw area.
     *
     * @param remHydrophobicContacts {Set} - ids of hydrophobic contacts to
     * remove. Those are objects which have 'id' as key and can optional have
     * specified control points (key 'controlPoints', values as array of ids)
     * to only remove those
     * @param remChanges {Array} - change objects for the history step
     * @param markRequiredRecalcs {Function} - function to memory changes in
     * structure/scene boundaries
     */
    removeHydrophobicContacts(remHydrophobicContacts, remChanges, markRequiredRecalcs) {
        remHydrophobicContacts
            .forEach(({id: hydroId, controlPoints: cpIds}) => {
                if (!this.sceneData.hydrophobicData.hydrophobicContacts.hasOwnProperty(hydroId)) {
                    return;
                }

                const hydro = this.sceneData.hydrophobicData.hydrophobicContacts[hydroId];
                //filter already removed
                if (!hydro.enabled) {
                    return;
                }
                const rad = this.opts.lineWidth;
                hydro.getCurveCoords(false).forEach(({x, y}) => {
                    markRequiredRecalcs('xMin', x - rad);
                    markRequiredRecalcs('xMax', x + rad);
                    markRequiredRecalcs('yMin', y - rad);
                    markRequiredRecalcs('yMax', y + rad);
                });

                if (cpIds) {
                    for (const cpId of cpIds) {
                        if (!hydro.controlPoints.hasOwnProperty(cpId) ||
                            !hydro.controlPoints[cpId].enabled) {
                            continue;
                        }
                        const remChange = this.createAddRemoveChangeHydrophobicControlPoint(hydro.structureLink,
                            hydroId,
                            cpId,
                            false,
                            hydro.controlPoints[cpId]
                        );
                        remChange.apply();
                        remChanges.push(remChange);
                    }
                } else {
                    const remChange = this.createAddRemoveChangeHydrophobic(hydro.structureLink,
                        hydroId,
                        false
                    );
                    remChange.apply();
                    remChanges.push(remChange);
                }
            });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Instructs the draw layer to unselect (= hide selection shapes) all
     * currently highlighted spline control points.
     */
    unselectAllSplines() {
        for (const structureId in this.sceneData.structuresData.structures) {
            const structure = this.sceneData.structuresData.structures[structureId];
            for (const hydrophobicId in structure.hydrophobicConnectionData.hydrophobicConts) {
                structure.hydrophobicConnectionData.hydrophobicConts[hydrophobicId]
                    .getControlPoints(false).forEach((_, idx) => {
                    this.hydrophobicGroupsComponent.unselectHydrophobicControlPoint(structureId,
                        hydrophobicId,
                        idx
                    );
                });
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Rotates given spline control points (by id) of a spline around a given
     * midpoint, then updates the spline accordingly.
     *
     * @param splineId {Number} - id of the spline the control points belong
     * to
     * @param controlPointIds {Array} - ids of control points to rotate
     * @param angle {Number} - angle (in degree) to rotate by
     * @param midpoint {Object} - x- and y-coordinates of the point to rotate
     * the spline control points around
     */
    rotateSplineControlPoints(splineId, controlPointIds, angle, midpoint) {
        const spline = this.sceneData.hydrophobicData.hydrophobicContacts[splineId];
        spline.rotateControlPoints(controlPointIds, angle, true, midpoint, true);
        this.updateSplineRepresentation(splineId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Remove hydrophobic contact from the DOM and the views cache.
     *
     * @param structureId {Number} - id of the structure the hydrophobic contact belongs
     * to
     * @param hId {Number} - id of hydrophobic contact
     */
    removeHydrophobicContactDOMCache(structureId, hId) {
        this.hydrophobicGroupsComponent.removeHydrophobicContactFromDOM(structureId, hId);
        this.hydrophobicGroupsComponent.purgeHydrophobicContactFromCache(structureId, hId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hovers a control point of a hydrophobic contact.
     *
     * @param structureId {Number} - id of the structure the hydrophobic contact belongs
     * to
     * @param hydrophobicId {Number} - id of hydrophobic contact
     * @param controlPointId {Number} - id of control point
     */
    hoverHydrophobicControlPoint(structureId, hydrophobicId, controlPointId) {
        this.hydrophobicGroupsComponent.hoverHydrophobicControlPoint(structureId,
            hydrophobicId,
            controlPointId
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hovers all control points of a hydrophobic contact.
     *
     * @param structureId {Number} - id of the structure the hydrophobic contact belongs
     * to
     * @param hydrophobicId {Number} - id of hydrophobic contact
     */
    hoverAllHydrophobicControlPoints(structureId, hydrophobicId) {
        this.hydrophobicGroupsComponent.hoverAllHydrophobicControlPoints(structureId,
            hydrophobicId
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Move spline control points based on a given offset-
     *
     * @param controlPoints {Number} - ids of control points
     * @param offset {Object} - offset for movement
     */
    moveSplineControlPoints(controlPoints, offset) {
        for (const splineId in controlPoints) {
            const spline = this.sceneData.hydrophobicData.hydrophobicContacts[splineId];
            controlPoints[splineId].forEach(cpId => {
                spline.updateControlPoint(cpId, offset, true);
            });
            this.updateSplineRepresentation(splineId);
        }
    }
}