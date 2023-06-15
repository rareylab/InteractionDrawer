/**
 * Drawer that manipulates generic text labels in the draw area.
 */
class TextLabelDrawer {
    /**
     * Contains instance of relevant component.
     *
     * @param svgComponent {Object} - represents the draw area
     */
    constructor(svgComponent) {
        this.svgComponent = svgComponent;
        this.transformGroupsComponent = svgComponent.transformGroupsComponent;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Generic function to move a text label (of atoms, structure circle
     * annotations) to new coordinates. Return the Change object to apply/revert
     * this coordinate change.
     *
     * @param label {Object} - the text label's container object
     * @param newCoords {Object} - x- and y-coordinates of the new position
     * @param moveFn {Function} - function to move the text label inside the
     * draw area
     * @returns {Change} - Change object to apply/revert movement
     */
    updateTextLabelCoordinates(label, newCoords, moveFn) {
        const {id: labelId, coordinates: oldCoords} = label;

        const curOffsets = {
            x: newCoords.x - label.tempCoordinates.x, y: newCoords.y - label.tempCoordinates.y
        };
        const fullOffsets = {
            x: newCoords.x - oldCoords.x, y: newCoords.y - oldCoords.y
        };
        const invertedOffsets = {
            x: -fullOffsets.x, y: -fullOffsets.y
        };

        //for NOW: update coordinates in relation to previous temp movement
        label.tempCoordinates = Object.assign({}, newCoords);
        label.coordinates = Object.assign({}, newCoords);
        moveFn(labelId, curOffsets);

        //for HISTORY: add change based on full movements since last step
        const coordChange = new Change();
        const moveToNew = () => {
            label.tempCoordinates = Object.assign({}, newCoords);
            label.coordinates = Object.assign({}, newCoords);
            moveFn(labelId, fullOffsets);
        };
        const moveBack = () => {
            label.tempCoordinates = Object.assign({}, oldCoords);
            label.coordinates = Object.assign({}, oldCoords);
            moveFn(labelId, invertedOffsets);
        };
        coordChange.bindApply(moveToNew);
        coordChange.bindRevert(moveBack);
        return coordChange;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Calculates the height and width of a text element.
     *
     * @param text {String} - text of the text element. Can be omitted if only
     * the height is of interest
     * @return {Object} - key "height" and "width" with values taken from
     * getBBox()
     */
    getTextDimensions(text = 'Test') {
        return this.transformGroupsComponent.getTextDimensions(text);
    }
}