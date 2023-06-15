/**
 * Searches structural data for the closest draw object of a certain type to a given point.
 */
class ClosestObjectFinder {
    /**
     * Contains instance for the data storage/access and configuration options.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     */
    constructor(opts, sceneData) {
        this.opts = opts;
        this.sceneData = sceneData;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds the closest structure (by its geometric center) that is enabled and
     * is not hidden to a given point.
     *
     * @param coords {Object} - contains x- and y-coordinates of point
     * @param structureIds {Array} - optional. Limit the search to structures
     * with this ids only
     * @param structureCircleHandling {Boolean} - how to determine the nearest
     * structure. If a structure is represented as structure circle and this is
     * set to true, then the closest point of the edge of the circle will be
     * taken as coords of that structure instead of the geometric center
     * @return {Object} - contains the Structure object or undefined as value of
     * key 'structure' and the x- and y-coordinates of the closest structure
     * (either geometric center or point on edge of structure circle) as
     * key 'closestCoords'
     */
    getClosestEnabledStructure(coords, structureIds = undefined, structureCircleHandling = false) {
        structureIds =
            (structureIds || Object.keys(this.sceneData.structuresData.structures)).map(Number);
        const structures = Object.values(this.sceneData.structuresData.structures)
            .filter(structure => structure.enabled && !structure.hidden &&
                structureIds.includes(structure.id) &&
                (!structureCircleHandling || structure.representationsData.curRepresentation() !==
                    StructureRepresentation.circle));
        const closestNonCircle = structures[PointCalculation.getClosestPoint(coords,
            structures.map(structure => structure.boundaries.mid)
        ).id];
        const closestNonCircleObj = {
            structure: closestNonCircle,
            closestCoords: closestNonCircle ? closestNonCircle.boundaries.mid : undefined
        };

        if (!structureCircleHandling) {
            return closestNonCircleObj;
        } else {
            const circleStructures = Object.values(this.sceneData.structuresData.structures)
                .filter(structure => structure.enabled && !structure.hidden &&
                    structureIds.includes(structure.id) &&
                    structure.representationsData.isCurRepresentation(StructureRepresentation.circle))
                .map(structure => {
                    return {
                        structure: structure,
                        closestCoords: PointCalculation.movePointTowardsAnother(structure.boundaries.mid,
                            coords,
                            structure.representationsData.structureCircle.rad
                        )
                    }
                });
            const closestCircleObj = circleStructures[PointCalculation.getClosestPoint(coords,
                circleStructures.map(val => val.closestCoords)
            ).id];

            if (!closestCircleObj) {
                return closestNonCircleObj;
            } else if (!closestNonCircleObj.structure) {
                return closestCircleObj;
            } else if (0 === PointCalculation.getClosestPoint(coords, [
                closestNonCircleObj.closestCoords, closestCircleObj.closestCoords
            ]).id) {
                return closestNonCircleObj;
            } else {
                return closestCircleObj;
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds the closest atom that is enabled and which structure is not hidden
     * to a given point.
     *
     * @param coords {Object} - contains x- and y-coordinates of point
     * @param structureIds {Array} - optional. Limit the search to structures
     * with this ids only
     * @param structureCircleHandling {Number} - how to determine the nearest
     * atom. If a structure is represented as structure circle and this is set to
     * 1, then the mid of the circle will be taken as atom coords of that
     * structure. If this is set to 2 then the actual coordinates of all atoms are
     * taken. If this is set to 3 atoms of structures which are currently
     * represented as circles will not be included in the search
     * @return {Object} - Atom object or undefined
     */
    getClosestEnabledAtom(coords, structureIds = undefined, structureCircleHandling = 2) {
        structureIds =
            (structureIds || Object.keys(this.sceneData.structuresData.structures)).map(Number);
        const atoms = [];
        Object.values(this.sceneData.structuresData.structures)
            .filter(structure => structure.enabled && !structure.hidden &&
                structureIds.includes(structure.id) && (structureCircleHandling === 2 ||
                    structure.representationsData.curRepresentation() !==
                    StructureRepresentation.circle))
            .map(structure => Object.values(structure.atomsData.atoms))
            .forEach(structureAtoms => {
                atoms.push(...structureAtoms);
            });
        atoms.filter(atom => atom.enabled);
        const closestAtom = atoms[PointCalculation
            .getClosestPoint(coords, atoms.map(atom => atom.coordinates)).id];

        if (structureCircleHandling === 2 || structureCircleHandling === 3) {
            return closestAtom;
        } else {
            const closestStructureObj = this.getClosestEnabledStructure(coords,
                Object.values(this.sceneData.structuresData.structures)
                    .filter(structure => structure.enabled && !structure.hidden &&
                        structureIds.includes(structure.id) &&
                        structure.representationsData.isCurRepresentation(StructureRepresentation.circle))
                    .map(structure => structure.id),
                true
            );

            if (!closestStructureObj.structure) {
                return closestAtom;
            } else if (!closestAtom) {
                return this.getClosestEnabledAtom(coords, [closestStructureObj.structure.id]);
            } else if (0 === PointCalculation.getClosestPoint(coords,
                [closestAtom.coordinates, closestStructureObj.closestCoords]
            ).id) {
                return closestAtom;
            } else {
                return this.getClosestEnabledAtom(coords, [closestStructureObj.structure.id]);
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds the ring that is enabled and which structure is not hidden,
     * which center is closest to a given point.
     *
     * @param coords {Object} - contains x- and y-coordinates of point
     * @param structureIds {Array} - optional. Limit the search to structures
     * with this ids only
     * @param structureCircleHandling {Boolean} - how to determine the nearest
     * ring. If a structure is represented as structure circle and this is set to
     * true, then the mid of the circle will be taken as ring coords of that
     * structure if the structure has at least one ring
     * @return {Object} - Ring object or undefined
     */
    getClosestEnabledRing(coords, structureIds = undefined, structureCircleHandling = false) {
        structureIds =
            (structureIds || Object.keys(this.sceneData.structuresData.structures)).map(Number);
        const rings = [];
        Object.values(this.sceneData.structuresData.structures)
            .filter(structure => structure.enabled && !structure.hidden &&
                structureIds.includes(structure.id) &&
                (!structureCircleHandling || structure.representationsData.curRepresentation() !==
                    StructureRepresentation.circle))
            .map(structure => Object.values(structure.ringsData.rings))
            .forEach(structureRings => {
                rings.push(...structureRings);
            });
        rings.filter(ring => {
            return Object.values(ring.atoms)
                .filter(atom => atom.enabled).length !== 0;
        });

        const closestRing = rings[PointCalculation.getClosestPoint(coords,
            rings.map(ring => ring.centroidInfo.centroid)
        ).id];

        if (!structureCircleHandling) {
            return closestRing;
        } else {
            const closestStructureObj = this.getClosestEnabledStructure(coords,
                Object.values(this.sceneData.structuresData.structures)
                    .filter(structure => structure.enabled && !structure.hidden &&
                        structureIds.includes(structure.id) &&
                        structure.representationsData.isCurRepresentation(StructureRepresentation.circle) &&
                        Object.keys(structure.ringsData.rings).length !== 0)
                    .map(structure => structure.id),
                true
            );

            if (!closestStructureObj.structure) {
                return closestRing;
            } else if (!closestRing) {
                return this.getClosestEnabledRing(coords, [closestStructureObj.structure.id]);
            } else if (0 === PointCalculation.getClosestPoint(coords, [
                closestRing.centroidInfo.centroid, closestStructureObj.closestCoords
            ]).id) {
                return closestRing;
            } else {
                return this.getClosestEnabledRing(coords, [closestStructureObj.structure.id]);
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds the control point that is enabled and not hidden of hydrophobic
     * contact which is closest to a given point and which linked structures
     * current representation is not circle.
     *
     * @param coords {Object} - contains x- and y-coordinates of point
     * @param endpointsOnly {Boolean} - limits the search to the endpoints of
     * the splines only
     * @param structureIds {Array} - optional. Limit the search to structures
     * with this ids only
     * @return {Object} - undefined or object containing 'hydrophobicContactId',
     * 'controlPointId' and the 'controlPoint'
     */
    getClosestEnabledSplineControlPoint(coords, endpointsOnly = false, structureIds = undefined) {
        structureIds =
            (structureIds || Object.keys(this.sceneData.structuresData.structures)).map(Number);
        const controlPoints = [];
        for (const [hydroId, hydroContact] of
            Object.entries(this.sceneData.hydrophobicData.hydrophobicContacts)) {
            const structureLink = hydroContact.structureLink;
            if (!hydroContact.enabled || hydroContact.hidden ||
                !structureIds.includes(structureLink) ||
                this.sceneData.structuresData.structures[structureLink]
                    .representationsData.isCurRepresentation(StructureRepresentation.circle)) {
                continue;
            }

            const points = [];
            hydroContact.controlPoints.forEach((cp, idx) => {
                if (!cp.enabled) {
                    return;
                }

                points.push({
                    hydrophobicContactId: hydroId, controlPointId: idx, controlPoint: cp
                });
            });
            if (endpointsOnly) {
                const pointsLength = points.length;
                switch (pointsLength) {
                    case 0:
                        break;
                    case 1:
                        controlPoints.push(points[0]);
                        break;
                    default:
                        controlPoints.push(points[0]);
                        controlPoints.push(points[pointsLength - 1]);
                }
            } else {
                controlPoints.push(...points);
            }
        }
        return controlPoints[PointCalculation.getClosestPoint(coords,
            controlPoints.map(points => points.controlPoint)
        ).id];
    }
}