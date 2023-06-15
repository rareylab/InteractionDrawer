/**
 * Component that manages SVG group for the drawing of the edit form.
 */
class EditStructureFormComponent {
    /**
     * Contains all relevant D3 selectors.
     *
     * @param editStructureFormDom {Object} - D3 selector of the edit form
     */
    constructor(editStructureFormDom) {
        this.editStructureFormDom = editStructureFormDom;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hides the form that allows editing of objects.
     */
    hideEditForm() {
        const formElements = this.editStructureFormDom;
        formElements.shown = false;
        formElements.foreignObject.style('display', 'none');
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns user defined info from the edit form.
     *
     * @return {Object} - info of the edit form
     */
    getData() {
        const formData = {};
        const formElements = this.editStructureFormDom;
        formData.label = formElements.labelInput.value ;
        formData.representation = parseInt(formElements.representationInput.value);
        return formData;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Opens the form that allows the edititng of objects. Set x and y so that the
     * form is completely in visible (in draw area). This will fail if the form is to large
     * to fit at all. In this case the user has to zoom. Note that is is impossible for the form
     * to be out of view area on top or left because the 'cursorCoords' define the top left corner
     * of the form.
     *
     * @param x {Number} - x coordinate of cursor
     * @param y {Number} - y coordinate of cursor
     * @param globalLimits {Object} - fixed values for known boundaries (xMin, xMax, yMin, yMax)
     * @param data {Object} - data of the object to edit
     */
    open(x, y, globalLimits, data) {
        const formElements = this.editStructureFormDom;
        const foreignObj = formElements.foreignObject;
        formElements.shown = true;

        const {xMax, yMax} = globalLimits;
        const foreignWidth = parseFloat(foreignObj.style('width'));
        const foreignHeight = parseFloat(foreignObj.style('height'));

        if (x + foreignWidth > xMax) {
            x = xMax - foreignWidth;
        }
        if (y + foreignHeight > yMax) {
            y = yMax - foreignHeight;
        }

        foreignObj
            .style('display', null)
            .attr('x', x)
            .attr('y', y);
        formElements.labelInput.value = data.label;
        formElements.representationInput.value = parseInt(data.representation);
        formElements.labelInput.focus();
    }
}