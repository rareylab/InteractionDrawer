/**
 * Component that manages SVG groups for the drawing of structure circles.
 */
class StructureCircleGroupsComponent {
    /**
     * Contains all relevant D3 selectors and instances for configuration options and drawing utils.
     * Creates containers for the caching of draw element selectors.
     *
     * @param opts {Object} - configuration parameters
     * @param utils {Object} - by components commonly used generic functions for drawing
     * @param structureCircleGroupDom {Object} - D3 selector of the structure circle group
     * @param structureCircleSelGroupDom {Object} - D3 selector of the selection shape group
     * @param svgId {String} - DOM id of the SVG
     */
    constructor(opts, utils, structureCircleGroupDom, structureCircleSelGroupDom, svgId) {
        this.opts = opts;
        this.utils = utils;
        this.structureCircleGroupDom = structureCircleGroupDom;
        this.structureCircleSelGroupDom = structureCircleSelGroupDom;
        this.svgId = svgId;

        //Structure object id -> structureSel/selectorShapes -> selectors
        this.structureCircleToSelMap = {};
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the circle representation as alternative representation
     * of a structure within the SVG. Each circle contains the name of the
     * structure if present.
     *
     * @param structure {Object} - the Structure object
     */
    drawStructureCircle(structure) {
        const structureId = structure.id;
        const structureMid = structure.boundaries.mid;
        const structureCircleGroupDom = this.structureCircleGroupDom;

        //extract styles
        const {
            rad, textColor, circleCss
        } = this.opts.structureCircleOpts[structure.structureType] ||
        this.opts.structureCircleOpts["default"];

        //add structure wrapper for circle
        const circleWrapperId = this.svgId + '_s_' + structureId + '_sc';
        const circleWrapper = GroupUtils.addGroupToSvg(structureCircleGroupDom, circleWrapperId);

        //add svg circle element
        const circle = this.utils.circle.addCircleToSvg(circleWrapper,
            '',
            structureMid,
            rad,
            circleCss
        );

        //add text wrapper
        const textWrapperId = circleWrapperId + '_text';
        const textWrapper = GroupUtils.addGroupToSvg(circleWrapper, textWrapperId);

        //split label to show multiple lines in the circle
        const labels = this.determineStructureCircleTextSplits(structure);

        //add text
        const labelSels = [];
        for (const label of labels) {
            labelSels.push(this.utils.text.placeText(textWrapper, label, structureMid, textColor));
        }
        //position text
        const finalizedLabels = this.finalizeStructureCircleLabelPosition(structure, labelSels);

        //add structure wrapper for selection
        const selectionWrapperId = this.svgId + '_s_' + structureId + '_scS';
        const selectionWrapper = GroupUtils.addGroupToSvg(this.structureCircleSelGroupDom,
            selectionWrapperId
        );

        //add selectors for selection
        const {
            sel: mouseSel, selectorShape: selectorShape
        } = this.utils.selector.drawCircleSelectionShape(selectionWrapper,
            undefined,
            structureMid,
            rad * 1.15
        );

        //add the d3 selectors to the drawer
        this.structureCircleToSelMap[structureId] = {
            circleSel: circle,
            circlePlacementInfo: {
                x: structureMid.x, y: structureMid.y
            },
            labelSel: textWrapper,
            textSels: finalizedLabels.map(value => value.sel),
            textPlacementInfos: finalizedLabels.map(value => ({x: value.x, y: value.y})),
            selectorShapes: [selectorShape],
            mouseSels: [mouseSel],
            structureSel: circleWrapper,
            selectorSel: selectionWrapper
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Splits the label of the structure to show rows in the structure circle.
     * Splits either automatically by generating equal sized chunks (note that
     * this may be not the best decision since some letters are wider than
     * others) or splits at the first occurrences of a value in a array.
     * Parameters can be set for each specific structure type in the config.
     *
     * @param structure {Object} - the Structure object which label to split
     * @returns {Array} - array containing the split label
     */
    determineStructureCircleTextSplits(structure) {
        const label = structure.structureLabel;
        if (!label) {
            return [];
        }
        const circleStyles = this.opts.structureCircleOpts[structure.structureType] ||
            this.opts.structureCircleOpts['default'];
        const maxLines = circleStyles.labelMaxLines;
        if (maxLines > 3) { //max 3 are implemented
            throw "labelMaxLines in config/opts is " + maxLines + " but is limited to 3."
        }
        const lines = [];

        if (circleStyles.labelAutoSplit) { //automatically split to equal size chunks
            const minLineChars = circleStyles.labelAutoSplitMinCharsPerLine;
            const labelLength = label.length;
            let lineLength = labelLength;
            let lineCount = 1;
            //determine number of lines
            while (lineCount < maxLines && lineLength > minLineChars) {
                lineCount++;
                lineLength = Math.ceil(labelLength / lineCount);
            }
            //split label into lines
            for (let i = 0, offset = 0; i < lineCount; i++, offset += lineLength) {
                lines.push(label.substr(offset, lineLength));
            }
        } else { //split at defined chars
            const splitChars = circleStyles.labelManualLineBreakChars;
            const includeSplitChars = circleStyles.labelManualIncludeSplitChar;
            let line = "";
            for (let i = 0; i < label.length; i++) {
                if (lines.length === maxLines - 1) {
                    lines.push(label.slice(i));
                    line = "";
                    break;
                }

                const currChar = label[i];
                if (splitChars.includes(currChar)) {
                    if (includeSplitChars[lines.length]) {
                        line += currChar
                    }
                    lines.push(line);
                    line = "";
                } else {
                    line += currChar;
                }
            }
            if (line !== "") {
                lines.push(line);
            }
        }

        return lines;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Splits the label of the structure to show rows in the structure circle.
     * Splits either automatically by generating equal sized chunks (note that
     * this may be not the best decision since some letters are wider than
     * others) or splits at the first occurrences of a value in a array.
     * Parameters can be set for each specific structure type in the config.
     *
     * @param structure {Object} - the Structure object which label to split
     * @param labelSels {Object} - the Structure object which label to split
     * @returns {Array} - array containing the split label
     */
    finalizeStructureCircleLabelPosition(structure, labelSels) {
        const circleStyles = this.opts.structureCircleOpts[structure.structureType] ||
            this.opts.structureCircleOpts['default'];
        const sameFontSize = circleStyles.labelSameFontSize;
        //make the rad a little bit smaller so the text does not collide with
        //the circle border
        const circleRad = circleStyles.rad * 0.95;
        const circleMid = structure.boundaries.mid;
        const movedLabels = [];
        if (labelSels.length === 1) {
            //Only one row. Just scale the text. No movement

            const sel = labelSels[0];
            //set the font-size to 1 so we can use the return value directly as
            //the new font-size
            sel.attr('font-size', 1 + 'px');
            const scale = this.calcScaleStructureCircleLabel(sel,
                circleMid,
                circleRad,
                circleRad,
                true
            );
            sel.attr('font-size', scale + 'px');
            movedLabels.push({sel: sel})
        } else if (labelSels.length === 2) {
            //scale both texts and move one text up and one text down

            //we want to add some space in the middle of the texts
            const midSpace = circleRad * .1;

            const selTop = labelSels[0];
            const selBot = labelSels[1];

            //calculate scaling and set font-size
            selTop.attr('font-size', 1 + 'px');
            const scaleTop = this.calcScaleStructureCircleLabel(selTop,
                circleMid,
                circleRad,
                circleRad - midSpace
            );
            selBot.attr('font-size', 1 + 'px');
            const scaleBot = this.calcScaleStructureCircleLabel(selBot,
                circleMid,
                circleRad,
                circleRad - midSpace
            );

            let scale;
            if (sameFontSize) {
                scale = Math.min(scaleTop, scaleBot);
            }
            selTop.attr('font-size', (scale || scaleTop) + 'px');
            selBot.attr('font-size', (scale || scaleBot) + 'px');

            //translate on y axis
            const oldTopY = parseFloat(selTop.attr('y'));
            selTop.attr('y', function () {
                const bbox = this.getBBox();
                return oldTopY - bbox.height / 2 - midSpace / 2;
            });
            const oldBotY = parseFloat(selBot.attr('y'));
            selBot.attr('y', function () {
                const bbox = this.getBBox();
                return oldBotY + bbox.height / 2 + midSpace / 2;
            });

            movedLabels.push({sel: selTop});
            movedLabels.push({sel: selBot});
        } else if (labelSels.length === 3) {
            //scale both texts and move one text up and one text down

            //we want to add some space in between the texts
            const spaceBetween = circleRad * .025;

            const selTop = labelSels[0];
            const selMid = labelSels[1];
            const selBot = labelSels[2];

            //set the font-size to 1 so we can use the return value directly as
            //the new font-size
            selTop.attr('font-size', 1 + 'px');
            selMid.attr('font-size', 1 + 'px');
            selBot.attr('font-size', 1 + 'px');

            //first calculate the size of the mid text because the space of the
            //other two may depend on this. Also give it a max height, so the
            //top and bottom texts may have the same min vertical space.
            //This is done by slicing of 10% (by radius) of the circles top and
            //bot, subtracting the spaceBetween and dividing by 3 (for the
            //3 texts we have). Although it might not be optimal for every case,
            //this heuristic works well in testing.
            const maxMidHeight = (circleRad * .8 - 2 * spaceBetween) / 3;
            const scaleMid = this.calcScaleStructureCircleLabel(selMid,
                circleMid,
                circleRad,
                circleRad,
                true,
                maxMidHeight
            );
            //set font-size of mid and calculate available space for top and bottom
            selMid.attr('font-size', scaleMid + 'px');
            let midHeight = selMid.node().getBBox().height;
            //available height for top and bottom
            const availableHeight = circleRad - midHeight / 2 - spaceBetween;

            const scaleTop = this.calcScaleStructureCircleLabel(selTop,
                circleMid,
                circleRad,
                availableHeight
            );
            const scaleBot = this.calcScaleStructureCircleLabel(selBot,
                circleMid,
                circleRad,
                availableHeight
            );

            let scale;
            if (sameFontSize) {
                scale = Math.min(scaleTop, scaleBot, scaleMid);
                selMid.attr('font-size', scale + 'px');
                midHeight = selMid.node().getBBox().height;
            }
            selTop.attr('font-size', (scale || scaleTop) + 'px');
            selBot.attr('font-size', (scale || scaleBot) + 'px');

            //translate on y axis
            const oldTopY = parseFloat(selTop.attr('y'));
            selTop.attr('y', function () {
                const bbox = this.getBBox();
                return oldTopY - bbox.height / 2 - midHeight / 2 - spaceBetween;
            });
            const oldBotY = parseFloat(selBot.attr('y'));
            selBot.attr('y', function () {
                const bbox = this.getBBox();
                return oldBotY + bbox.height / 2 + midHeight / 2 + spaceBetween;
            });

            movedLabels.push({sel: selTop});
            movedLabels.push({sel: selMid});
            movedLabels.push({sel: selBot});
        }
        for (let i = 0; i < movedLabels.length; i++) {
            const sel = movedLabels[i].sel;
            movedLabels[i] = TextUtils.centerText(sel, {
                x: parseFloat(sel.attr('x')), y: parseFloat(sel.attr('y'))
            });
        }
        return movedLabels;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Calculates a scale parameter to scale (part of) a label of a structure
     * circle to fit inside the circle.
     * This works by define a triangle within the structure circle where the
     * the final height of the text is the opposite (a) and half the final width
     * is the adjacent (b). We know the ratio of this two because it is the same
     * as the current aspect ration of the text. We can derive tha angle alpha
     * from that. We also know the Point A of the triangle (see code). To
     * get the length of the hypotenuse we just need to calculate the intersections
     * of the structure circle with the line defined by A and alpha. From that
     * intersections we take the left-most point (because that is how the
     * triangle is defined inside the circle) and its distance to A.
     * Now we got enough information to calculate a and b.
     *
     * @param sel {Object} - the D3 element which holds the label
     * @param circleMid {Object} - the midpoints of the circle.
     * @param circleRad {Number} - the radius of the structure circle. If you
     * you prefer some space to the edge of the circle consider taking only
     * a percentage of the radius
     * @param availableYspace {Number} - the space to top or bottom that is
     * available (e.g. with 2 label and free space between this should be
     * "circle radius - freeSpace / 2")
     * @param isYcentered {Boolean} - true if the text is in the center of the
     * circle because then we must define a as half the text height
     * @param maxHeight {Number} - define a max height of the text
     * @returns {Number} - array containing the split label
     */
    calcScaleStructureCircleLabel(sel,
        circleMid,
        circleRad,
        availableYspace,
        isYcentered = false,
        maxHeight = undefined
    ) {
        const node = sel.node();
        const bbox = node.getBBox();
        const b = bbox.width / 2;
        const a = isYcentered ? bbox.height / 2 : bbox.height;
        if (b === 0) { //abort if there is not label
            return 1;
        }

        //angle alpha in triangle;
        const alpha = Math.atan(a / b);
        //point A in the triangle
        const pointA = {
            x: circleMid.x, y: circleMid.y + circleRad - availableYspace
        };
        const intersections = LineCalculation.findCircleLineIntersectionsFromPointAngle(circleRad,
            circleMid.x,
            circleMid.y,
            pointA.x,
            pointA.y,
            alpha
        );
        //only take the intersection on the left side since that is
        //how the triangle is defined
        intersections.sort(function (a, b) {
            return a.x - b.x;
        });
        const hypotenuseLength = VectorCalculation.getDist2d(intersections[0], pointA);
        let newHeight = hypotenuseLength * Math.sin(alpha);
        if (maxHeight) {
            newHeight = Math.min(newHeight, maxHeight);
        }
        //Do not produce larger texts than defined in config
        return this.utils.base.round(Math.min(newHeight / a, this.opts.textSize));
    }

    /*----------------------------------------------------------------------*/

    /**
     * Applies movement to a structureCircle following given offsets.
     *
     * @param structureId {Number} - the unique id of the label
     * @param xOffset {Number} - offset to move in x-direction
     * @param yOffset {Number} - offset to move in y-direction
     */
    moveStructureCircle(structureId, {
        x: xOffset, y: yOffset
    }) {
        const {
            circleSel, textSels, mouseSels, circlePlacementInfo, textPlacementInfos, selectorShapes
        } = this.structureCircleToSelMap[structureId];
        for (let i = 0; i < textSels.length; i++) {
            this.utils.text.moveTextByPlacementInfo(textSels[i],
                textPlacementInfos[i],
                xOffset,
                yOffset
            );
        }
        this.utils.selector.moveCircleSelectorByPlacementInfo(circleSel,
            circlePlacementInfo,
            xOffset,
            yOffset
        );
        this.utils.selector.moveAllSelectors(mouseSels, selectorShapes, xOffset, yOffset);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Signals that a structure circle is hovered in the draw area by switching the
     * color of its corresponding selection shape to the hover color.
     *
     * @param structureId {Number} - the unique id of the structure the structure
     * circle belongs to
     */
    hoverStructureCircle(structureId) {
        const structureCircleSel = this.structureCircleToSelMap[structureId];
        this.utils.selector.switchTextLabelSelectorStatus(structureCircleSel, SelectorStatus.hover);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Selects a structure circle in the draw area by switching the color of its
     * corresponding selection shape to the selection color.
     *
     * @param structureId {Number} - the unique id of the structure the structure
     * circle belongs to
     */
    selectStructureCircle(structureId) {
        const structureCircleSel = this.structureCircleToSelMap[structureId];
        this.utils.selector.switchTextLabelSelectorStatus(structureCircleSel,
            SelectorStatus.select
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a previously selected/hovered structure circle, removes color from the
     * corresponding selection shape.
     *
     * @param structureId {Number} - the unique id of the structure the structure
     * circle belongs to
     */
    unselectStructureCircle(structureId) {
        const structureCircleSel = this.structureCircleToSelMap[structureId];
        this.utils.selector.switchTextLabelSelectorStatus(structureCircleSel,
            SelectorStatus.unselect
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Retrieves the saved bbox draw limits of the drawn element of
     * a structure circle.
     *
     * @param structureId {Number} - the unique id of the structure the circle
     * belongs to
     * @returns {Object} - object detailing draw limits
     */
    getStructureCircleDrawLimits(structureId) {
        return BaseUtils.convertBBoxToMaxes(BaseUtils.getSelBBox(this.structureCircleToSelMap[structureId].structureSel));
    }

    /*----------------------------------------------------------------------*/

    /**
     * Retrieves information on the selector shape around a structure circle.
     *
     * @param structureId {Number} - the unique id of the structure the circle
     * belongs to
     * @returns {Array} - array containing an object describing the shape
     */
    getStructureCircleSelShapes(structureId) {
        return this.structureCircleToSelMap[structureId].selectorShapes;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Shows/hides structure circles by changing the corresponding display
     * properties of the svg elements. Also hides the selectors.
     *
     * @param full {Boolean} - set visibility of all structure circles
     * @param structureCircle {Boolean} - toggles the visibility if set true
     * @param structureId {Number} - id of structure to show/hide structure circles from
     * @param visibilityClass {String} - CSS class for show/hide
     */
    setVisibility(full, structureCircle, structureId, visibilityClass) {
        if ((full || structureCircle) && this.structureCircleToSelMap.hasOwnProperty(structureId)) {
            const structureCircleToSelMap = this.structureCircleToSelMap[structureId];
            structureCircleToSelMap.structureSel
                .classed(visibilityClass, true);
            structureCircleToSelMap.selectorSel
                .classed(visibilityClass, true);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a previously removed structure, puts its detached structure circles
     * DOM elements back into previous positions.
     *
     * @param structureId {Number} - id of structure to add back
     */
    redraw(structureId) {
        if (this.structureCircleToSelMap.hasOwnProperty(structureId)) {
            this.structureCircleGroupDom.node()
                .appendChild(this.structureCircleToSelMap[structureId].structureSel.node());
            this.structureCircleSelGroupDom.node()
                .appendChild(this.structureCircleToSelMap[structureId].selectorSel.node());
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes structure circle only from the DOM
     *
     * @param structureId {Number} - the unique Id of the structure to remove
     * its structure circles from DOM
     */
    removeFromDOM(structureId) {
        if (this.structureCircleToSelMap.hasOwnProperty(structureId)) {
            this.structureCircleToSelMap[structureId].structureSel.remove();
            this.structureCircleToSelMap[structureId].selectorSel.remove();
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes all cached structure circle information for a given structure (by its Id).
     *
     * @param structureId {Number} - id of structure to remove structure circle information
     * from
     */
    purgeFromCache(structureId) {
        if (this.structureCircleToSelMap.hasOwnProperty(structureId)) {
            delete this.structureCircleToSelMap[structureId];
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets translations made for structure circles of a certain structure
     *
     * @param structureId {Number} - id of structure to reset translations for
     */
    resetStructureCircleSkeletonTranslation(structureId) {
        if (this.structureCircleToSelMap.hasOwnProperty(structureId)) {
            SelectorUtils.resetTransformOnSelectors(this.structureCircleToSelMap[structureId]);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves structural skeleton (structure circles as groups) by specified offsets.
     *
     * @param structureId {Number} - id of structure to move skeleton of
     * @param xOffset {Number} - offset to move structure by in x-direction
     * @param yOffset {Number} - offset to move structure by in y-direction
     */
    moveStructureCircleSkeleton(structureId, xOffset, yOffset) {
        const structureCircleSels = this.structureCircleToSelMap[structureId];
        this.utils.selector.moveSelectorsOfSkeleton(structureCircleSels,
            xOffset,
            yOffset,
            'structureCircle'
        );
    }
}