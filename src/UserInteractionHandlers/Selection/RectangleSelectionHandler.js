/**
 * Processes selection user interactions with the draw area via the rectangle selector.
 */
class RectangleSelectionHandler {
    /**
     * Contains instances for the data storage/access, user interaction tracking,
     * draw area manipulation, mouse click handling of the rectangle selector and
     * configuration options
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

        this.collisionFinder = new CollisionFinder(opts, sceneData);
        this.multiSelectionCallback = null;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates rectangular selector based on new cursor coordinates (rectangle
     * will have original start coordinates where the user interaction began
     * and new coordinates as opposite corners). Then, based on collision
     * detection with the created rectangle, select atoms and bonds which touch
     * it.
     *
     * @param drawAreaCoords {Object} - x- and y-coordinates of current
     * cursor screen position translated to position in draw area
     */
    handleRectSelection(drawAreaCoords) {
        //old selection is discarded, all redone completely as rect can flip anywhere
        this.svgDrawer.structureDrawer.resetTempSelections();
        //build and draw points for rect selection
        const {
            scale, translate: {x: translateX, y: translateY}
        } = this.interactionState.transformParams;
        const rectPoints = this.interactionState.createRectSelection(this.interactionState.interaction.start,
            drawAreaCoords
        );
        const drawnRectPoints = rectPoints.map(rectPoint => {
            return {
                x: (rectPoint.x + translateX) * scale, y: (rectPoint.y + translateY) * scale
            };
        });
        this.svgDrawer.viewerDrawer.drawRectSelector(drawnRectPoints);
        //find collisions of rect with atoms, select hits
        const {hitAtoms, hitEdges, hitStructureCircles} = this.collisionFinder.findCollisions(
            rectPoints);
        for (const structureId in hitAtoms) {
            const structure = this.sceneData.structuresData.structures[structureId];
            if (structure.representationsData.isCurRepresentation(StructureRepresentation.default)) {
                hitAtoms[structureId].forEach(atomId => {
                    this.svgDrawer.atomDrawer.tempSelectAtom(structureId, atomId);
                });
            }
        }
        //find collisions of rect with edges, select hits
        for (const structureId in hitEdges) {
            const structure = this.sceneData.structuresData.structures[structureId];
            if (structure.representationsData.isCurRepresentation(StructureRepresentation.default)) {
                hitEdges[structureId].forEach(edgeId => {
                    this.svgDrawer.edgeDrawer.tempSelectEdge(structureId, edgeId);
                });
            }
        }
        for (const structureId of hitStructureCircles) {
            const structure = this.sceneData.structuresData.structures[structureId];
            if (structure.representationsData.hasRepresentation(StructureRepresentation.circle) &&
                structure.representationsData.isCurRepresentation(StructureRepresentation.circle)) {
                this.svgDrawer.structureCircleDrawer.tempSelectStructureCircle(structureId);
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finalizes selection by rectangular selector.
     */
    handleRectSelectionEnd() {
        this.svgDrawer.viewerDrawer.clearSelector();
        this.svgDrawer.structureDrawer.applyTempSelection();
        this.svgDrawer.atomDrawer.selectAtomsBetweenSelectedEdges();
        if (this.multiSelectionCallback) {
            this.multiSelectionCallback();
        }
    }
}