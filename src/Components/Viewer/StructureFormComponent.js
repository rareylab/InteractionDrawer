/**
 * Component that manages SVG group for the drawing of the add structure form.
 */
class StructureFormComponent {
    /**
     * Contains all relevant D3 selectors.
     *
     * @param addStructureFormDom {Object} - D3 selector of the add structure form
     */
    constructor(addStructureFormDom) {
        this.addStructureFormDom = addStructureFormDom;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hides the form that allows adding of new structures.
     */
    hideStructureAddForm() {
        const formElements = this.addStructureFormDom;
        formElements.shown = false;
        formElements.foreignObject.style('display', 'none');
        formElements.select.value = 'WATER';
        formElements.tagInput.value = '';
        formElements.select.disabled = false;
        formElements.input.value = '';
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns user defined info from the structure form.
     *
     * @return {Object} - info of the add structure form
     */
    getData() {
        const formData = {};
        const formElements = this.addStructureFormDom;
        formData.structure = formElements.select.value
        if (formData.structure) {
            formData.tag = formElements.tagInput.value;
        }
        formData.input = formElements.input.value;
        return formData;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Opens the form that allows the adding of new structures. Set x and y so that the
     * form is completely in visible (in draw area). This will fail if the form is to large
     * to fit at all. In this case the user has to zoom. Note that is is impossible for the form
     * to be out of view area on top or left because the 'cursorCoords' define the top left corner
     * of the form.
     *
     * @param x {Number} - x coordinate of cursor
     * @param y {Number} - y coordinate of cursor
     * @param globalLimits {Object} - fixed values for known boundaries (xMin, xMax, yMin, yMax)
     */
    open(x, y, globalLimits) {
        const formElements = this.addStructureFormDom;
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
        formElements.select.focus();
    }
}