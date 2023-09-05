/**
 * Component that manages SVG groups for the drawing of annotations.
 */
class AnnotationGroupsComponent {
    /**
     * Contains all relevant D3 selectors and instances for configuration options and drawing utils.
     * Creates containers for the caching of draw element selectors.
     *
     * @param opts {Object} - configuration parameters
     * @param utils {Object} - by components commonly used generic functions for drawing
     * @param annotationGroupDom {Object} - D3 selector of the annotations group
     * @param annotationSelGroupDom {Object} - D3 selector of the selection shape group
     */
    constructor(opts, utils, annotationGroupDom, annotationSelGroupDom) {
        this.opts = opts;
        this.utils = utils;
        this.annotationGroupDom = annotationGroupDom;
        this.annotationSelGroupDom = annotationSelGroupDom;

        //Annotation object id -> selector
        this.labelToSelMap = {};
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the text representation for a label within the SVG.
     *
     * @param labelId {Number} - the unique id of the label
     * @param label {String} - the text to show in the SVG
     * @param coordinates {Object} - the position of the center of the text (x-
     * and y-coordinates)
     * @param color {String} - valid CSS color for the text
     * @param structureId {Number} - id of structure to which this label belongs
     */
    drawLabel({id: labelId, label, coordinates, color, additionalInformation},
        structureId = undefined
    ) {
        const sels = {};
        const {
            sel: labelSel, x, y, width
        } = this.utils.text.placeCenteredText(this.annotationGroupDom, label, coordinates, color);
        if (this.opts.geomineMode && additionalInformation &&
            additionalInformation.nglFeatureType) {
            const styles = {
                'fill': additionalInformation.backgroundColor,
                'opacity': additionalInformation.opacity
            };
            if (additionalInformation.nglFeatureType !== 'point' &&
                additionalInformation.nglFeatureType !== 'angle') {
                styles['stroke'] = this.opts.colors.DEFAULT;
                styles['stroke-width'] = 0.5;
            }
            sels.backgroundSel = this.utils.circle.addCircleToSvg(this.annotationSelGroupDom,
                '',
                coordinates,
                additionalInformation.backgroundRadius,
                styles
            );
            if (additionalInformation.nglFeatureType === 'angle' ||
                additionalInformation.nglFeatureType === 'point') {
                sels.backgroundSel.lower();
            }
        }
        sels.labelSel = labelSel;
        const {mouseSels, selectorShapes} = this.utils.selector.drawTextLabelSelectors(label,
            coordinates,
            width,
            this.annotationSelGroupDom,
            ''
        );
        if (this.opts.geomineMode && additionalInformation &&
            additionalInformation.nglFeatureType &&
            (additionalInformation.nglFeatureType === 'angle' ||
            additionalInformation.nglFeatureType === 'point')) {
            mouseSels[0].lower();
        }
        sels.mouseSels = mouseSels;
        sels.selectorShapes = selectorShapes;
        sels.placementInfo = {
            x: x, y: y
        };
        sels.structureId = structureId;
        this.labelToSelMap[labelId] = sels;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Applies movement to a label's text element following given offsets.
     *
     * @param labelId {Number} - the unique id of the label
     * @param xOffset {Number} - offset to move in x-direction
     * @param yOffset {Number} - offset to move in y-direction
     */
    moveLabel(labelId, {x: xOffset, y: yOffset}) {
        const {
            labelSel, backgroundSel, mouseSels, placementInfo, selectorShapes
        } = this.labelToSelMap[labelId];
        this.utils.text.moveTextByPlacementInfo(labelSel, placementInfo, xOffset, yOffset);
        this.utils.selector.moveAllSelectors(mouseSels, selectorShapes, xOffset, yOffset);
        if (this.opts.geomineMode && backgroundSel) {
            const newPosition = selectorShapes[0].coordinates;
            this.utils.circle.moveCircleElement(backgroundSel.node(), newPosition.x, newPosition.y);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Detaches the text element of a label from the DOM.
     *
     * @param labelId {Number} - the unique id of the label
     */
    removeLabelFromDOM(labelId) {
        const {labelSel, backgroundSel, mouseSels} = this.labelToSelMap[labelId];
        labelSel.remove();
        if (this.opts.geomineMode && backgroundSel) {
            backgroundSel.remove();
        }
        mouseSels.forEach(mouseSel => {
            mouseSel.remove();
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Reattaches the text element of a label to the DOM (to be called after
     * application of removeLabelFromDOM()).
     *
     * @param labelId {Number} - the unique id of the label
     */
    redrawLabel(labelId) {
        const {labelSel, backgroundSel, mouseSels} = this.labelToSelMap[labelId];
        this.annotationGroupDom.node().appendChild(labelSel.node());
        if (this.opts.geomineMode && backgroundSel) {
            this.annotationSelGroupDom.node().appendChild(backgroundSel.node());
        }
        mouseSels.forEach(mouseSel => {
            this.annotationSelGroupDom.node().appendChild(mouseSel.node());
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes all cached information for a label's text element.
     *
     * @param labelId {Number} - the unique id of the label
     */
    purgeLabelFromCache(labelId) {
        delete this.labelToSelMap[labelId];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Retrieves the saved bbox draw limits of the text element of a label.
     *
     * @param labelId {Number} - the unique id of the label
     * @returns {Array} - array of objects detailing draw limits
     */
    getLabelDrawLimits(labelId) {
        return [
            {
                limits: BaseUtils.convertBBoxToMaxes(BaseUtils.getSelBBox(this.labelToSelMap[labelId].labelSel))
            }
        ];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Retrieves the saved bbox of the text element of a label.
     *
     * @param labelId {Number} - the unique id of the label
     * @returns {Array} - array of objects detailing bbox
     */
    getLabelBBox(labelId) {
        return BaseUtils.getSelBBox(this.labelToSelMap[labelId].labelSel);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Retrieves information on the selector shape around a label.
     *
     * @param labelId {Number} - the unique id of the label
     * @returns {Array} - array containing an object describing the shape
     */
    getLabelSelShapes(labelId) {
        return this.labelToSelMap[labelId].selectorShapes;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Indicates that a label is hovered by the user by switching the color of
     * its corresponding selection shape to the hover color.
     *
     * @param labelId {Number} - the unique id of the label
     */
    hoverLabel(labelId) {
        const labelSels = this.labelToSelMap[labelId];
        this.utils.selector.switchTextLabelSelectorStatus(labelSels, SelectorStatus.hover);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Selects an annotation in the draw area by switching the color of its
     * corresponding selection shape to the selection color.
     *
     * @param labelId {Number} - the unique id of the annotation to select
     */
    selectLabel(labelId) {
        const labelSels = this.labelToSelMap[labelId];
        this.utils.selector.switchTextLabelSelectorStatus(labelSels, SelectorStatus.select);
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a previously hovered label, removes color from its corresponding
     * selection shape.
     *
     * @param labelId {Number} - the unique id of the label
     */
    unselectLabel(labelId) {
        const labelSels = this.labelToSelMap[labelId];
        this.utils.selector.switchTextLabelSelectorStatus(labelSels, SelectorStatus.unselect);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Changes the color of an annotation's corresponding selection shape.
     *
     * @param labelId {Number} - the unique id of the label
     * @param color {String} - valid CSS color
     */
    recolorAnnotationSelector(labelId, color) {
        const labelSels = this.labelToSelMap[labelId];
        this.utils.selector.switchTextLabelSelectorColor(labelSels, color);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hides annotations by changing the corresponding display properties of the
     * svg elements. Also hides the selectors.
     *
     * @param labelIds {Array} - id of labels to hide
     */
    hideAnnotations(labelIds) {
        for (const [labelId, labelObj] of Object.entries(this.labelToSelMap)) {
            if (labelIds.includes(parseInt(labelId))) {
                labelObj.labelSel.classed('ia-drawer-hide-elem', true);
                if (this.opts.geomineMode && labelObj.backgroundSel) {
                    labelObj.backgroundSel.classed('ia-drawer-hide-elem', true);
                }
                for (const mouseSel of labelObj.mouseSels) {
                    mouseSel.classed('ia-drawer-hide-elem', true);
                }
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Shows/hides annotations by changing the corresponding display
     * properties of the svg elements. Also hides the selectors.
     *
     * @param full {Boolean} - set visibility of all annotations
     * @param label {Boolean} - toggles the visibility if set true
     * @param structureId {Number} - id of structure to show/hide annotations from
     * @param visibilityClass {String} - CSS class for show/hide
     */
    setVisibility(full, label, structureId, visibilityClass) {
        if (full || label) {
            for (const labelObj of Object.values(this.labelToSelMap)) {
                if (labelObj.structureId === structureId) {
                    labelObj.labelSel.classed(visibilityClass, true);
                    if (this.opts.geomineMode && labelObj.backgroundSel) {
                        labelObj.backgroundSel.classed(visibilityClass, true);
                    }
                    for (const mouseSel of labelObj.mouseSels) {
                        mouseSel.classed(visibilityClass, true);
                    }
                }
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Converts annotation bbox object to object of minima
     * and maxima.
     *
     * @param id {Number} - id of Annotation object
     * @returns {Object} - minima and maxima of the bbox
     */
    getAnnotationMinMax(id) {
        return BaseUtils.convertBBoxToMaxes(this.getLabelBBox(id));
    }
}
