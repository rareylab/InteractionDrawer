/**
 * Component that manages a SVG group for the drawing of viewer control related elements like
 * the mirror line.
 */
class InteractionElementsGroupComponent {
    /**
     * Contains all relevant D3 selectors and instances for configuration options and drawing utils.
     *
     * @param opts {Object} - configuration parameters
     * @param utils {Object} - by components commonly used generic functions for drawing
     * @param interactionElementsGroupDom {Object} - D3 selector of the interactions elements group
     * @param svgId {String} - DOM id of the SVG
     */
    constructor(opts, utils, interactionElementsGroupDom, svgId) {
        this.opts = opts;
        this.utils = utils;
        this.interactionElementsGroupDom = interactionElementsGroupDom;
        this.svgId = svgId;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Appends all interaction elements, e.g. mirror line.
     */
    appendInteractionElements() {
        const mirrorLineDom = this.appendMirrorLine();
        this.mirrorLineComponent = new MirrorLineComponent(this.utils, mirrorLineDom);

        const addIntermolecularLineDom = this.appendIntermolecularLine();
        this.intermolecularLineComponent =
            new IntermolecularLineComponent(this.utils, addIntermolecularLineDom);

        const addAnnotationFormDom = this.appendAnnotationForm();
        this.annotationFormComponent = new AnnotationFormComponent(addAnnotationFormDom);

        const addStructureFormDom = this.appendStructureForm();
        this.structureFormComponent = new StructureFormComponent(addStructureFormDom);

        const editAnnotationFormDom = this.appendEditAnnotationForm();
        this.editAnnotationFormComponent = new EditAnnotationFormComponent(editAnnotationFormDom);

        const editAtomFormDom = this.appendEditAtomForm();
        this.editAtomFormComponent = new EditAtomFormComponent(editAtomFormDom);

        const editEdgeFormDom = this.appendEditEdgeForm();
        this.editEdgeFormComponent = new EditEdgeFormComponent(editEdgeFormDom);

        const editStructureFormDom = this.appendEditStructureForm();
        this.editStructureFormComponent = new EditStructureFormComponent(editStructureFormDom);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Draws the mirror line in front of everything.
     */
    appendMirrorLine() {
        return this.interactionElementsGroupDom.append('line')
            .attr('id', this.svgId + '_mirrorLine')
            .style('stroke', this.opts.colors.MIRROR)
            .style('stroke-width', this.opts.mirrorLineWidth + 'px');
    }

    /*----------------------------------------------------------------------*/

    /**
     * Draws the add intermolecular line in front of everything.
     */
    appendIntermolecularLine() {
        return this.interactionElementsGroupDom.append('line')
            .attr('id', this.svgId + '_addIntermolecularLine')
            .style('stroke-width', this.opts.lineWidth + 'px');
    }

    /*----------------------------------------------------------------------*/

    /**
     * Draws the edit form div in front of everything.
     */
    appendEditEdgeForm() {
        const editEdgeFormDom = {};
        editEdgeFormDom.foreignObject =
            this.interactionElementsGroupDom.append('foreignObject')
                .attr('id', this.svgId + '_editEdgeForeign');
        const textSize = this.opts.textSize;
        editEdgeFormDom.foreignObject
            .append("xhtml:div")
            .attr('id', this.svgId + '_editEdgeWrapper')
            .style('border', '1px solid gray')
            .style('background-color', 'whitesmoke')
            .style('font-size', textSize + 'px')
            .style('display', 'inline-block')
            .style('cursor', 'default')
            .html('<div style="' + 'display:flex;' + 'justify-content:space-around;' + 'padding:' +
                textSize / 2 + 'px">' +

                '<label for="' + this.svgId + '_editEdgeType" ' + 'id="' + this.svgId +
                '_editEdgeTypeLabel" ' + 'style="' + 'display:flex;' + 'white-space:nowrap;' +
                'margin:auto ' + textSize / 2 + 'px">' + 'Type:' + '</label>' +

                '<select title="Set the bond type." ' + 'id="' + this.svgId + '_editEdgeType" ' +
                'autocomplete="off" ' + 'style="margin:auto ' + textSize / 2 + 'px">' +
                '<option class="h6" value="aromatic" selected>Aromatic</option>' +
                '<option class="h6" value="double" selected>Double</option>' +
                '<option class="h6" value="triple" selected>Triple</option>' +
                '<option class="h6" value="single" selected>Single</option>' +
                '<option class="h6" value="stereoBack" selected>Stereo back</option>' +
                '<option class="h6" value="stereoBackReverse" selected>Stereo back reverse</option>' +
                '<option class="h6" value="stereoFront" selected>Stereo front</option>' +
                '<option class="h6" value="stereoFrontReverse" selected>Stereo front reverse</option>' +
                '</select>' +

                '</div>' +

                '<div style="' + 'display:flex;' + 'justify-content:flex-end;' + 'padding:' +
                textSize / 2 + 'px">' +

                '<button type="button" ' + 'id="' + this.svgId + '_editEdgeInputEdit" ' +
                'style="padding:0;' + 'margin:auto ' + textSize / 2 + 'px">' + 'Edit' + '</button>' +

                '<button type="button" ' + 'id="' + this.svgId + '_editEdgeInputCancel" ' +
                'style="padding:0;' + 'margin:auto ' + textSize / 2 + 'px">' + 'Cancel' +
                '</button>' +

                '</div>');
        //add html elements to container
        editEdgeFormDom.wrapperDiv =
            document.getElementById(this.svgId + '_editEdgeWrapper');
        editEdgeFormDom.typeSelect =
            document.getElementById(this.svgId + '_editEdgeType');
        editEdgeFormDom.editBtn =
            document.getElementById(this.svgId + '_editEdgeInputEdit');
        editEdgeFormDom.cancelBtn =
            document.getElementById(this.svgId + '_editEdgeInputCancel');
        //Set the foreignObject width and height.
        const wrapperBounding = editEdgeFormDom.wrapperDiv.getBoundingClientRect();
        editEdgeFormDom.foreignObject
            .attr('height', wrapperBounding.height)
            .attr('width', wrapperBounding.width);
        //hide the form after everything is calculated.
        editEdgeFormDom.foreignObject.style('display', 'none');
        return editEdgeFormDom;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Draws the edit form div in front of everything.
     */
    appendEditAtomForm() {
        const editAtomFormDom = {};
        editAtomFormDom.foreignObject =
            this.interactionElementsGroupDom.append('foreignObject')
                .attr('id', this.svgId + '_editAtomForeign');
        const textSize = this.opts.textSize;
        editAtomFormDom.foreignObject
            .append("xhtml:div")
            .attr('id', this.svgId + '_editAtomWrapper')
            .style('border', '1px solid gray')
            .style('background-color', 'whitesmoke')
            .style('font-size', textSize + 'px')
            .style('display', 'inline-block')
            .style('cursor', 'default')
            .html('<div style="' + 'display:flex;' + 'justify-content:space-between;' + 'padding:' +
                textSize / 2 + 'px">' +

                '<label for="' + this.svgId + '_editAtomLabelInput" ' + 'id="' + this.svgId +
                '_editAtomLabelInputLabel" ' + 'style="' + 'display:flex;' + 'white-space:nowrap;' +
                'margin:auto ' + textSize / 2 + 'px">' + 'Label:' + '</label>' +

                '<input title="Set a text label for the atom. Not that text labels are not drawn for carbon atoms" ' +
                'type="text" ' + 'id="' + this.svgId + '_editAtomLabelInput" ' +
                'autocomplete="off" ' + 'style="width:16ch; margin:auto ' +
                textSize / 2 + 'px">' +

                '</div>' +

                '<div style="' + 'display:flex;' + 'justify-content:space-between;' + 'padding:' +
                textSize / 2 + 'px">' +

                '<label for="' + this.svgId + '_editAtomElementInput" ' + 'id="' + this.svgId +
                '_editAtomElementInputLabel" ' + 'style="' + 'display:flex;' + 'white-space:nowrap;' +
                'margin:auto ' + textSize / 2 + 'px">' + 'Element:' + '</label>' +

                '<input title="Set an element for the atom. This is important for internal processes, like the creation of gradient colors of bonds." ' +
                'type="text" ' + 'id="' + this.svgId + '_editAtomElementInput" ' +
                'autocomplete="off" ' + 'style="width:16ch; margin:auto ' +
                textSize / 2 + 'px">' +

                '</div>' +

                '<div style="' + 'display:flex;' + 'justify-content:space-between;' + 'padding:' +
                textSize / 2 + 'px">' +

                '<label for="' + this.svgId + '_editAtomChargeInput" ' + 'id="' + this.svgId +
                '_editAtomChargeInputLabel" ' + 'style="' + 'display:flex;' + 'white-space:nowrap;' +
                'margin:auto ' + textSize / 2 + 'px">' + 'Charge:' + '</label>' +

                '<input step="0.01" type="number" title="Set a charge for the atom." ' +
                ' ' + 'id="' + this.svgId + '_editAtomChargeInput" ' +
                'autocomplete="off" ' + 'style="width:16ch; margin:auto ' +
                textSize / 2 + 'px">' +

                '</div>' +

                '<div style="' + 'display:flex;' + 'justify-content:space-between;' + 'padding:' +
                textSize / 2 + 'px">' +

                '<label for="' + this.svgId + '_editAtomHInput" ' + 'id="' + this.svgId +
                '_editAtomHInputLabel" ' + 'style="' + 'display:flex;' + 'white-space:nowrap;' +
                'margin:auto ' + textSize / 2 + 'px">' + 'Implicit H:' + '</label>' +

                '<input min="0" type="number" title="Set the number of implicitly drawn hydrogen atoms." ' +
                ' ' + 'id="' + this.svgId + '_editAtomHInput" ' +
                'autocomplete="off" ' + 'style="width:16ch; margin:auto ' +
                textSize / 2 + 'px">' +

                '</div>' +

                '<div style="' + 'display:flex;' + 'justify-content:flex-end;' + 'padding:' +
                textSize / 2 + 'px">' +

                '<button type="button" ' + 'id="' + this.svgId + '_editAtomInputEdit" ' +
                'style="padding:0;' + 'margin:auto ' + textSize / 2 + 'px">' + 'Edit' + '</button>' +

                '<button type="button" ' + 'id="' + this.svgId + '_editAtomInputCancel" ' +
                'style="padding:0;' + 'margin:auto ' + textSize / 2 + 'px">' + 'Cancel' +
                '</button>' +

                '</div>');
        //add html elements to container
        editAtomFormDom.wrapperDiv =
            document.getElementById(this.svgId + '_editAtomWrapper');
        editAtomFormDom.labelInput =
            document.getElementById(this.svgId + '_editAtomLabelInput');
        editAtomFormDom.elementInput =
            document.getElementById(this.svgId + '_editAtomElementInput');
        editAtomFormDom.chargeInput =
            document.getElementById(this.svgId + '_editAtomChargeInput');
        editAtomFormDom.hInput =
            document.getElementById(this.svgId + '_editAtomHInput');
        editAtomFormDom.editBtn =
            document.getElementById(this.svgId + '_editAtomInputEdit');
        editAtomFormDom.cancelBtn =
            document.getElementById(this.svgId + '_editAtomInputCancel');
        //Set the foreignObject width and height.
        const wrapperBounding = editAtomFormDom.wrapperDiv.getBoundingClientRect();
        editAtomFormDom.foreignObject
            .attr('height', wrapperBounding.height)
            .attr('width', wrapperBounding.width);
        //hide the form after everything is calculated.
        editAtomFormDom.foreignObject.style('display', 'none');
        return editAtomFormDom;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Draws the edit form div in front of everything.
     */
    appendEditStructureForm() {
        const editStructureFormDom = {};
        editStructureFormDom.foreignObject =
            this.interactionElementsGroupDom.append('foreignObject')
                .attr('id', this.svgId + '_editStructureForeign');
        const textSize = this.opts.textSize;
        editStructureFormDom.foreignObject
            .append("xhtml:div")
            .attr('id', this.svgId + '_editStructureWrapper')
            .style('border', '1px solid gray')
            .style('background-color', 'whitesmoke')
            .style('font-size', textSize + 'px')
            .style('display', 'inline-block')
            .style('cursor', 'default')
            .html('<div style="' + 'display:flex;' + 'justify-content:space-between;' + 'padding:' +
                textSize / 2 + 'px">' +

                '<label for="' + this.svgId + '_editStructureLabelInput" ' + 'id="' + this.svgId +
                '_editStructureLabelInputLabel" ' + 'style="' + 'display:flex;' + 'white-space:nowrap;' +
                'margin:auto ' + textSize / 2 + 'px">' + 'Circle label:' + '</label>' +

                '<input title="Set the text label shown by the structure circle representation." ' +
                'type="text" ' + 'id="' + this.svgId + '_editStructureLabelInput" ' +
                'size="8" autocomplete="off" ' + 'style="width:16ch; margin:auto ' + textSize / 2 + 'px">' +

                '</div>' +

                '<div style="' + 'display:flex;' + 'justify-content:space-between;' + 'padding:' +
                textSize / 2 + 'px">' +

                '<label for="' + this.svgId + '_editEdgeType" ' + 'id="' + this.svgId +
                '_editEdgeTypeLabel" ' + 'style="' + 'display:flex;' + 'white-space:nowrap;' +
                'margin:auto ' + textSize / 2 + 'px">' + 'Type:' + '</label>' +

                '<select title="Set the structure representation type." ' + 'id="' + this.svgId + '_editStructureRepresentationInput" ' +
                'autocomplete="off" ' + 'style="width:16ch; margin:auto ' + textSize / 2 + 'px">' +
                '<option class="h6" value="1" selected>IUPAC</option>' +
                '<option class="h6" value="2">Circle</option>' +
                '</select>' +

                '</div>' +

                '<div style="' + 'display:flex;' + 'justify-content:flex-end;' + 'padding:' +
                textSize / 2 + 'px">' +

                '<button type="button" ' + 'id="' + this.svgId + '_editStructureInputEdit" ' +
                'style="padding:0;' + 'margin:auto ' + textSize / 2 + 'px">' + 'Edit' + '</button>' +

                '<button type="button" ' + 'id="' + this.svgId + '_editStructureInputCancel" ' +
                'style="padding:0;' + 'margin:auto ' + textSize / 2 + 'px">' + 'Cancel' +
                '</button>' +

                '</div>');
        //add html elements to container
        editStructureFormDom.wrapperDiv =
            document.getElementById(this.svgId + '_editStructureWrapper');
        editStructureFormDom.labelInput =
            document.getElementById(this.svgId + '_editStructureLabelInput');
        editStructureFormDom.representationInput =
            document.getElementById(this.svgId + '_editStructureRepresentationInput');
        editStructureFormDom.editBtn =
            document.getElementById(this.svgId + '_editStructureInputEdit');
        editStructureFormDom.cancelBtn =
            document.getElementById(this.svgId + '_editStructureInputCancel');
        //Set the foreignObject width and height.
        const wrapperBounding = editStructureFormDom.wrapperDiv.getBoundingClientRect();
        editStructureFormDom.foreignObject
            .attr('height', wrapperBounding.height)
            .attr('width', wrapperBounding.width);
        //hide the form after everything is calculated.
        editStructureFormDom.foreignObject.style('display', 'none');
        return editStructureFormDom;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Draws the edit form div in front of everything.
     */
    appendEditAnnotationForm() {
        const editAnnotationFormDom = {};
        editAnnotationFormDom.foreignObject =
            this.interactionElementsGroupDom.append('foreignObject')
                .attr('id', this.svgId + '_editAnnotationForeign');
        const textSize = this.opts.textSize;
        editAnnotationFormDom.foreignObject
            .append("xhtml:div")
            .attr('id', this.svgId + '_editAnnotationWrapper')
            .style('border', '1px solid gray')
            .style('background-color', 'whitesmoke')
            .style('font-size', textSize + 'px')
            .style('display', 'inline-block')
            .style('cursor', 'default')
            .html('<div style="' + 'display:flex;' + 'justify-content:space-around;' + 'padding:' +
                textSize / 2 + 'px">' +

                '<label for="' + this.svgId + '_editAnnotationInput" ' + 'id="' + this.svgId +
                '_editAnnotationInputLabel" ' + 'style="' + 'display:flex;' + 'white-space:nowrap;' +
                'margin:auto ' + textSize / 2 + 'px">' + 'Annotation:' + '</label>' +

                '<input title="Set the text of the annotation." ' +
                'type="text" ' + 'id="' + this.svgId + '_editAnnotationInput" ' +
                'size="8" autocomplete="off" ' + 'style="margin:auto ' + textSize / 2 + 'px">' +

                '</div>' +

                '<div style="' + 'display:flex;' + 'justify-content:flex-end;' + 'padding:' +
                textSize / 2 + 'px">' +

                '<button type="button" ' + 'id="' + this.svgId + '_editAnnotationInputEdit" ' +
                'style="padding:0;' + 'margin:auto ' + textSize / 2 + 'px">' + 'Edit' + '</button>' +

                '<button type="button" ' + 'id="' + this.svgId + '_editAnnotationInputCancel" ' +
                'style="padding:0;' + 'margin:auto ' + textSize / 2 + 'px">' + 'Cancel' +
                '</button>' +

                '</div>');
        //add html elements to container
        editAnnotationFormDom.wrapperDiv =
            document.getElementById(this.svgId + '_editAnnotationWrapper');
        editAnnotationFormDom.textInput =
            document.getElementById(this.svgId + '_editAnnotationInput');
        editAnnotationFormDom.editBtn =
            document.getElementById(this.svgId + '_editAnnotationInputEdit');
        editAnnotationFormDom.cancelBtn =
            document.getElementById(this.svgId + '_editAnnotationInputCancel');
        //Set the foreignObject width and height.
        const wrapperBounding = editAnnotationFormDom.wrapperDiv.getBoundingClientRect();
        editAnnotationFormDom.foreignObject
            .attr('height', wrapperBounding.height)
            .attr('width', wrapperBounding.width);
        //hide the form after everything is calculated.
        editAnnotationFormDom.foreignObject.style('display', 'none');
        return editAnnotationFormDom;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Draws the add annotation input div in front of everything.
     */
    appendAnnotationForm() {
        const addAnnotationFormDom = {};
        addAnnotationFormDom.foreignObject =
            this.interactionElementsGroupDom.append('foreignObject')
                .attr('id', this.svgId + '_addAnnotationForeign');
        const textSize = this.opts.textSize;
        addAnnotationFormDom.foreignObject
            .append("xhtml:div")
            .attr('id', this.svgId + '_addAnnotationWrapper')
            .style('border', '1px solid gray')
            .style('background-color', 'whitesmoke')
            .style('font-size', textSize + 'px')
            .style('display', 'inline-block')
            .style('cursor', 'default')
            .html('<div style="' + 'display:flex;' + 'justify-content:space-around;' + 'padding:' +
                textSize / 2 + 'px">' +

                '<label for="' + this.svgId + '_addAnnotationInput" ' + 'id="' + this.svgId +
                '_addAnnotationInputLabel" ' + 'style="' + 'display:flex;' + 'white-space:nowrap;' +
                'margin:auto ' + textSize / 2 + 'px">' + 'Annotation:' + '</label>' +

                '<input title="Set the text of the annotation." ' +
                'type="text" ' + 'id="' + this.svgId + '_addAnnotationInput" ' +
                'size="8" autocomplete="off" ' + 'style="margin:auto ' + textSize / 2 + 'px">' +

                '</div>' +

                '<div style="' + 'display:flex;' + 'justify-content:flex-end;' + 'padding:' +
                textSize / 2 + 'px">' +

                '<button type="button" ' + 'id="' + this.svgId + '_addAnnotationInputAdd" ' +
                'style="padding:0;' + 'margin:auto ' + textSize / 2 + 'px">' + 'Add' + '</button>' +

                '<button type="button" ' + 'id="' + this.svgId + '_addAnnotationInputCancel" ' +
                'style="padding:0;' + 'margin:auto ' + textSize / 2 + 'px">' + 'Cancel' +
                '</button>' +

                '</div>' +

                '<div style="display:flex;' + 'border-top:1px solid grey;' +
                'justify-content:center;' + 'padding:' + textSize / 2 + 'px">' +

                '<input type="checkbox" ' + 'id="' + this.svgId + '_addAnnotationSnap" ' +
                'title="Links the annotation to the nearest structure and atoms, such that a mode' +
                ' action that targets a structure also affects the annotation."' +
                'autocomplete="off" ' + 'style="' +
                'display: inline-block;' +
                'width: auto;' +
                'margin: 0px 1px;' +
                'vertical-align: text-top;'+
                + 'margin:auto ' + textSize / 2 + 'px" ' + 'checked>' +

                '<label for="' + this.svgId + '_addAnnotationSnap" ' + 'id="' + this.svgId +
                '_addAnnotationSnapLabel" ' + 'style="' + 'display:flex;' + 'margin:auto ' +
                textSize / 2 + 'px">' + 'Snap to nearest structure' + '</label>' +

                '</div>' +

                '<div style="display:flex;' + 'border-top:1px solid grey;' +
                'justify-content:space-around;' + 'padding:' + textSize / 2 + 'px">' +

                '<label for="' + this.svgId + '_addAnnotationColor" ' + 'id="' + this.svgId +
                '_addAnnotationColorLabel" ' + 'style="' + 'display:flex;' + 'white-space:nowrap;' +
                'margin:auto ' + textSize / 2 + 'px">' + 'Color:' + '</label>' +

                '<input type="color" ' + 'id="' + this.svgId + '_addAnnotationColor" ' + 'value="' +
                Helpers.rgbToHex(this.opts.colors.DEFAULT) + '" ' + 'autocomplete="off" ' +
                'style="border:none; margin:auto ' + textSize / 2 + 'px">' +

                '</div>' +

                '<div style="display:flex;' + 'justify-content:space-around;' + 'padding:' +
                textSize / 2 + 'px">' +

                '<button type="button" ' + 'id="' + this.svgId + '_addAnnotationColorDefault" ' +
                'style="padding:0;' + 'margin:auto ' + textSize / 2 + 'px">' + 'Default Color' +
                '</button>' +

                '<button type="button" ' + 'id="' + this.svgId +
                '_addAnnotationColorHydrophobic" ' + 'style="padding:0;' + 'margin:auto ' +
                textSize / 2 + 'px">' + 'Hydrophobic Color' + '</button>' +

                '</div>');
        //add html elements to container
        addAnnotationFormDom.wrapperDiv =
            document.getElementById(this.svgId + '_addAnnotationWrapper');
        addAnnotationFormDom.textInput =
            document.getElementById(this.svgId + '_addAnnotationInput');
        addAnnotationFormDom.addBtn =
            document.getElementById(this.svgId + '_addAnnotationInputAdd');
        addAnnotationFormDom.cancelBtn =
            document.getElementById(this.svgId + '_addAnnotationInputCancel');
        addAnnotationFormDom.snapCbox = document.getElementById(this.svgId + '_addAnnotationSnap');
        addAnnotationFormDom.colorInput =
            document.getElementById(this.svgId + '_addAnnotationColor');
        addAnnotationFormDom.defaultColorBtn =
            document.getElementById(this.svgId + '_addAnnotationColorDefault');
        addAnnotationFormDom.hydrophobicColorBtn = document
            .getElementById(this.svgId + '_addAnnotationColorHydrophobic');
        //Set the foreignObject width and height.
        const wrapperBounding = addAnnotationFormDom.wrapperDiv.getBoundingClientRect();
        addAnnotationFormDom.foreignObject
            .attr('height', wrapperBounding.height)
            .attr('width', wrapperBounding.width);
        //Scale the color input to match the height of the text input.
        const textInputHeight = window
            .getComputedStyle(addAnnotationFormDom.textInput).height;
        const colorOldHeight = addAnnotationFormDom.colorInput
            .getBoundingClientRect().height;
        addAnnotationFormDom.colorInput.style.height = textInputHeight;
        const colorHeightChangeRatio = addAnnotationFormDom.colorInput
            .getBoundingClientRect().height / colorOldHeight;
        const colorOldWidth = parseInt(window.getComputedStyle(addAnnotationFormDom.colorInput)
            .width.split('px')[0]);
        const colorNewWidth = colorHeightChangeRatio * colorOldWidth;
        addAnnotationFormDom.colorInput.style.width = colorNewWidth + 'px';
        //Scale the snap checkbox with scale factor of the color input.
        addAnnotationFormDom.snapCbox.style.transform = "scale(" + colorHeightChangeRatio + ")";
        //hide the form after everything is calculated.
        addAnnotationFormDom.foreignObject.style('display', 'none');
        return addAnnotationFormDom;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Draws the add structure input div in front of everything.
     */
    appendStructureForm() {
        const addStructureFormDom = {};
        addStructureFormDom.foreignObject =
            this.interactionElementsGroupDom.append('foreignObject')
                .attr('id', this.svgId + '_addStructureForeign');
        const textSize = this.opts.textSize;
        addStructureFormDom.foreignObject
            .append("xhtml:div")
            .attr('id', this.svgId + '_addStructureWrapper')
            .style('border', '1px solid gray')
            .style('background-color', 'whitesmoke')
            .style('font-size', textSize + 'px')
            .style('display', 'inline-block')
            .style('cursor', 'default')
            .html('<div style="' + 'display:flex;' + 'justify-content:space-around;' + 'padding:' +
                textSize / 2 + 'px">' +

                '<label for="' + this.svgId + '_addStructureSelect" ' + 'id="' + this.svgId +
                '_addStructureSelectLabel" ' + 'style="' + 'display:flex;' + 'white-space:nowrap;' +
                'margin:auto ' + textSize / 2 + 'px">' + 'Structure:' + '</label>' +

                '<select ' + 'id="' + this.svgId + '_addStructureSelect" ' +
                'autocomplete="off" ' + 'style="margin:auto ' + textSize / 2 + 'px">' +
                '<optgroup class="h6" label="Other">' +
                '<option class="h6" value="WATER" selected>Water</option>' +
                '</optgroup>' +
                '<optgroup class="h6" label="Amico acids">' +
                '<option class="h6" value="BACKBONE">All - Backbone</option>' +
                '<option class="h6" value="ARGSIDECHAIN">Arginine - Sidechain</option>' +
                '<option class="h6" value="ARGCOMPLETE">Arginine - Complete</option>' +
                '<option class="h6" value="ASNSIDECHAIN">Asparagine - Sidechain</option>' +
                '<option class="h6" value="ASNCOMPLETE">Asparagine - Complete</option>' +
                '<option class="h6" value="ASPSIDECHAIN">Aspartic acid - Sidechain</option>' +
                '<option class="h6" value="ASPCOMPLETE">Aspartic acid - Complete</option>' +
                '<option class="h6" value="CYSSIDECHAIN">Cysteine - Sidechain</option>' +
                '<option class="h6" value="CYSCOMPLETE">Cysteine - Complete</option>' +
                '<option class="h6" value="GLNSIDECHAIN">Glutamine - Sidechain</option>' +
                '<option class="h6" value="GLNCOMPLETE">Glutamine - Complete</option>' +
                '<option class="h6" value="GLUSIDECHAIN">Glutamic acid - Sidechain</option>' +
                '<option class="h6" value="GLUCOMPLETE">Glutamic acid - Complete</option>' +
                '<option class="h6" value="HISSIDECHAIN">Histidine - Sidechain</option>' +
                '<option class="h6" value="HISCOMPLETE">Histidine - Complete</option>' +
                '<option class="h6" value="LYSSIDECHAIN">Lysine - Sidechain</option>' +
                '<option class="h6" value="LYSCOMPLETE">Lysine - Complete</option>' +
                '<option class="h6" value="PHESIDECHAIN">Phenylalanine - Sidechain</option>' +
                '<option class="h6" value="PHECOMPLETE">Phenylalanine - Complete</option>' +
                '<option class="h6" value="SERSIDECHAIN">Serine - Sidechain</option>' +
                '<option class="h6" value="SERCOMPLETE">Serine - Complete</option>' +
                '<option class="h6" value="THRSIDECHAIN">Threonine - Sidechain</option>' +
                '<option class="h6" value="THRCOMPLETE">Threonine - Complete</option>' +
                '<option class="h6" value="TRPSIDECHAIN">Tryptophan - Sidechain</option>' +
                '<option class="h6" value="TRPCOMPLETE">Tryptophan - Complete</option>' +
                '<option class="h6" value="TYRSIDECHAIN">Tyrosine - Sidechain</option>' +
                '<option class="h6" value="TYRCOMPLETE">Tyrosine - Complete</option>' +
                '<optgroup class="h6" label="Nucleic acids">' +
                '<option class="h6" value="A">Adenosine</option>' +
                '<option class="h6" value="C">Cytidine</option>' +
                '<option class="h6" value="G">Guanosine</option>' +
                '<option class="h6" value="U">Uridine</option>' +
                '<option class="h6" value="DA">Deoxyadenosine</option>' +
                '<option class="h6" value="DC">Deoxycytidine</option>' +
                '<option class="h6" value="DG">Deoxyguanosine</option>' +
                '<option class="h6" value="DT">Deoxythymidine</option>' +
                '</optgroup>' +
                '<optgroup class="h6" label="Metal">' +
                '<option class="h6" value="FE">Fe</option>' +
                '<option class="h6" value="CA">Ca</option>' +
                '<option class="h6" value="CO">Co</option>' +
                '<option class="h6" value="CU">Cu</option>' +
                '<option class="h6" value="MG">Mg</option>' +
                '<option class="h6" value="MN">Mn</option>' +
                '<option class="h6" value="NI">Ni</option>' +
                '<option class="h6" value="ZN">Zn</option>' +
                '</optgroup>' +
                '</select>' +

                '</div>' +

                '<div style="' + 'display:flex;' + 'justify-content:left;' + 'padding:' +
                textSize / 2 + 'px">' +
                
                '<label for="' + this.svgId + '_addSmilesInput" ' + 'id="' + this.svgId +
                '_addSmilesInputLabel" ' + 'style="' + 'display:flex;' + 'white-space:nowrap;' +
                'margin:auto ' + textSize / 2 + 'px">' + 'Or SMILES:' + '</label>' +

                '<input title="Enter a SMILES." ' + 'type="text" ' + 'id="' + this.svgId +
                '_addSmilesInput" ' + 'autocomplete="off" ' + 'style="width:100%;margin:auto ' +
                textSize / 2 + 'px">' +

                '</div>' +

                '<div style="' + 'display:flex;' + 'justify-content:flex-end;' + 'padding:' +
                textSize / 2 + 'px">' +

                '<button type="button" ' + 'id="' + this.svgId + '_addStructureSelectAdd" ' +
                'style="padding:0;' + 'margin:auto ' + textSize / 2 + 'px">' + 'Add' + '</button>' +

                '<button type="button" ' + 'id="' + this.svgId + '_addStructureSelectCancel" ' +
                'style="padding:0;' + 'margin:auto ' + textSize / 2 + 'px">' + 'Cancel' +
                '</button>' +

                '</div>' +

                '<div style="display:flex;' + 'border-top:1px solid grey;' +
                'justify-content:center;' + 'padding:' + textSize / 2 + 'px">' +

                '<label for="' + this.svgId + '_addStructureTag" ' + 'id="' + this.svgId +
                '_addStructureTagLabel" ' + 'style="' + 'display:flex;' + 'margin:auto ' +
                textSize / 2 + 'px">' + 'Name' + '</label>' +

                '<input title="Set a custom name for the structure that will be shown instead of the' +
                ' automatically generated default name." type="text" ' + 'id="' + this.svgId + '_addStructureTag" size="6" ' +
                'autocomplete="off" ' + 'style="margin:auto ' + textSize / 2 + 'px" ' + '>' +
                '</div>');
        //add html elements to container
        addStructureFormDom.wrapperDiv =
            document.getElementById(this.svgId + '_addStructureWrapper');
        addStructureFormDom.select =
            document.getElementById(this.svgId + '_addStructureSelect');
        addStructureFormDom.input =
            document.getElementById(this.svgId + '_addSmilesInput');
        addStructureFormDom.addBtn =
            document.getElementById(this.svgId + '_addStructureSelectAdd');
        addStructureFormDom.cancelBtn =
            document.getElementById(this.svgId + '_addStructureSelectCancel');
        addStructureFormDom.tagInput = document.getElementById(this.svgId + '_addStructureTag');
        //Set the foreignObject width and height.
        const wrapperBounding = addStructureFormDom.wrapperDiv.getBoundingClientRect();
        addStructureFormDom.foreignObject
            .attr('height', wrapperBounding.height)
            .attr('width', wrapperBounding.width);
        //hide the form after everything is calculated.
        addStructureFormDom.foreignObject.style('display', 'none');
        return addStructureFormDom;
    }
}