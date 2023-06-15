/**
 * Component that manages SVG group for the drawing of the add annotation form.
 */
class AnnotationFormComponent {
    /**
     * Contains all relevant D3 selectors.
     *
     * @param addAnnotationFormDom {Object} - D3 selector of the add annotation form
     */
    constructor(addAnnotationFormDom) {
        this.addAnnotationFormDom = addAnnotationFormDom;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets the color for new annotations.
     *
     * @param color {String} - rpg color for new annotation.
     */
    setInputColor(color) {
        this.addAnnotationFormDom.colorInput.value = Helpers.rgbToHex(color);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hides the form that allows adding of new annotations.
     */
    hideAnnotationAddForm() {
        const formElements = this.addAnnotationFormDom;
        formElements.shown = false;
        formElements.foreignObject.style('display', 'none');
        formElements.textInput.value = '';
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns user defined info from the annotation form.
     *
     * @return {Object} - info of the add annotation form
     */
    getData() {
        const formData = {};
        const formElements = this.addAnnotationFormDom;
        formData.text = formElements.textInput.value;
        if (formData.text) {
            formData.snap = formElements.snapCbox.checked;
            formData.color = formElements.colorInput.value;
        }
        return formData;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Opens the form that allows the adding of new annotations. Set x and y so that the
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
        const formElements = this.addAnnotationFormDom;
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
        formElements.textInput.focus();
    }
}