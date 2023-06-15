/**
 * Processes mirroring user interactions (bond/line mirror) of objects in the draw area.
 */
class MirrorHandler {
    /**
     * Contains instances for the data storage/access, user interaction tracking,
     * draw area manipulation, rotation of drawn objects and configuration options.
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

        this.changeMapCreater = new ChangeMapCreater(opts, sceneData, interactionState);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Mirrors all elements affected by the line mirror interaction mode based
     * on the current configuration of the mirror line and commit changes to
     * the scene and the drawer's history.
     */
    performLineMirror() {
        const changeMap = {};
        //get information on the line to mirror on
        const {endpoints: {first, second}} = this.interactionState.mirrorLineInfo;
        //find out what to mirror
        const {
            curStructureId, annotations, splineControlPoints
        } = this.interactionState.interaction.lineMirror;
        if (curStructureId !== undefined) {
            const structureMap = {
                [curStructureId]: this.sceneData.structuresData.structures[curStructureId].atomsData.atoms
            };
            this.changeMapCreater.createAtomMirrorMap(structureMap, first, second, changeMap);
            this.changeMapCreater.createAnnotationMirrorMap([...annotations],
                first,
                second,
                changeMap,
                InteractionMode.lineMirror
            );
        }
        this.changeMapCreater.createSplineControlPointMirrorMap(splineControlPoints,
            first,
            second,
            changeMap
        );
        this.svgDrawer.applySceneChanges(changeMap);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Performs a mirror operation on a bond as part of the bond mirror
     * interaction mode. This first splits the structure on the given bond and
     * then, on consecutive executions, alternately mirrors both parts of the
     * structure on the bond.
     *
     * @param structureId {Number} - id of the structure the bond belongs to
     * @param edgeId {Number} - id of the bond to mirror on
     */
    mirrorOnEdge(structureId, edgeId) {
        const structure = this.sceneData.structuresData.structures[structureId];
        const edge = structure.edgesData.getEdge(edgeId);
        if (edge.cyclic) { //edge flip only applicable on non-cyclic bonds
            return;
        }

        let {side, atomsSmall, atomsLarge} = this.interactionState.interaction.mirror;
        let atomsToMirror;
        const determineSides = () => {
            const [firstSubset, secondSubset] = structure.splitStructureOnBond(edgeId);
            const firstIsLarger = (firstSubset.length > secondSubset.length);
            const smallerSet = firstIsLarger ? secondSubset : firstSubset;
            const largerSet = firstIsLarger ? firstSubset : secondSubset;
            atomsSmall = smallerSet;
            atomsLarge = largerSet;
        };
        if (side === 'small') {
            if (atomsSmall.length === 0) {
                determineSides();
            }
            atomsToMirror = (atomsSmall.length === 1) ? atomsLarge : atomsSmall;
        } else if (side === 'large') {
            if (atomsLarge.length === 0) {
                determineSides();
            }
            atomsToMirror = (atomsLarge.length === 1) ? atomsSmall : atomsLarge;
        }
        const fromCoords = structure.atomsData.getAtom(edge.from).coordinates;
        const toCoords = structure.atomsData.getAtom(edge.to).coordinates;
        const type = edge.type;
        if (type === 'stereoBack' || type === 'stereoFront') {
            atomsToMirror = atomsToMirror.filter(atomId => {
                return atomId !== edge.to;
            });
        } else if (type === 'stereoBackReverse' || type === 'stereoFrontReverse') {
            atomsToMirror = atomsToMirror.filter(atomId => {
                return atomId !== edge.from;
            });
        }
        //find elements to mirror
        const structureMap = {
            [structureId]: atomsToMirror.map(atomId => {
                return structure.atomsData.getAtom(atomId);
            })
        };
        const annotations = [
            ...structure.annotationConnectionData.getAnnotationsForAtoms(atomsToMirror)
        ];
        const annotationsUpdRepInfo = [...structure.annotationConnectionData.annotations]
            .filter(annotation => !annotations.includes(annotation));
        const splineControlPoints = structure.hydrophobicConnectionData.getSplineControlPointIdsForAtoms(
            atomsToMirror);
        //execute mirroring
        const changeMap = {};
        this.changeMapCreater.createAtomMirrorMap(structureMap, fromCoords, toCoords, changeMap);
        this.changeMapCreater.createAnnotationMirrorMap(annotations,
            fromCoords,
            toCoords,
            changeMap,
            InteractionMode.bondMirror
        );
        this.changeMapCreater.createAnnotationMirrorMap(annotationsUpdRepInfo,
            fromCoords,
            toCoords,
            changeMap,
            InteractionMode.bondMirror,
            true
        );
        this.changeMapCreater.createSplineControlPointMirrorMap(splineControlPoints,
            fromCoords,
            toCoords,
            changeMap
        );
        this.svgDrawer.applySceneChanges(changeMap);
        //set side for next mirror on the same (!) bond
        this.interactionState.interaction.mirror.side = (side === 'small') ? 'large' : 'small';
    }
}