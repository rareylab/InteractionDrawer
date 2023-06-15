/**
 * Component that manages SVG groups for the drawing of intermolecular edges.
 */
class IntermolecularGroupsComponent {
    /**
     * Contains all relevant D3 selectors and instances for configuration options and drawing
     * utils.
     * Creates containers for the tracking/caching of draw element selectors.
     *
     * @param opts {Object} - configuration parameters
     * @param utils {Object} - by components commonly used generic functions for drawing
     * @param distanceGroupDom {Object} - D3 selector of the intermolecular edge (distance)
     * @param interactionGroupDom {Object} - D3 selector of the intermolecular edge (interaction)
     * @param cationpiGroupDom {Object} - D3 selector of the intermolecular edge (cationpi)
     * @param pipiGroupDom {Object} - D3 selector of the intermolecular edge (pipi)
     * @param atomPairInteractionGroupDom {Object} - D3 selector of the intermolecular edge
     *     (atomPairInteraction)
     * @param distanceSelGroupDom {Object} - D3 selector of the selection shape group (distance)
     * @param interactionSelGroupDom {Object} - D3 selector of the selection shape group
     * (interaction)
     * @param cationpiSelGroupDom {Object} - D3 selector of the selection shape group (cationpi)
     * @param pipiSelGroupDom {Object} - D3 selector of the selection shape group (pipi)
     * @param atomPairInteractionSelGroupDom {Object} - D3 selector of the selection shape group
     *     (atomPairInteraction)
     */
    constructor(opts,
        utils,
        distanceGroupDom,
        interactionGroupDom,
        cationpiGroupDom,
        pipiGroupDom,
        atomPairInteractionGroupDom,
        distanceSelGroupDom,
        interactionSelGroupDom,
        cationpiSelGroupDom,
        pipiSelGroupDom,
        atomPairInteractionSelGroupDom
    ) {
        this.opts = opts;
        this.utils = utils;
        this.cationpiGroupDom = cationpiGroupDom;
        this.pipiGroupDom = pipiGroupDom;
        this.atomPairInteractionGroupDom = atomPairInteractionGroupDom;
        this.distanceGroupDom = distanceGroupDom;
        this.interactionGroupDom = interactionGroupDom;
        this.cationpiSelGroupDom = cationpiSelGroupDom;
        this.pipiSelGroupDom = pipiSelGroupDom;
        this.atomPairInteractionSelGroupDom = atomPairInteractionSelGroupDom;
        this.distanceSelGroupDom = distanceSelGroupDom;
        this.interactionSelGroupDom = interactionSelGroupDom;
        //IntermolecularEdge id -> selectors
        this.atomPairInteractionToSelMap = {};
        this.piStackToSelMap = {};
        this.cationPiStackToSelMap = {};
        this.distanceToSelMap = {};
        this.interactionToSelMap = {};
        //maps intermolecular type to groups
        //interGroup for intermolecular edge
        //selGroup for selection shape
        this.typeGroupMap = {
            'atomPairInteractions': {
                'interGroup': this.atomPairInteractionGroupDom,
                'selGroup': this.atomPairInteractionSelGroupDom
            },
            'piStackings': {'interGroup': this.pipiGroupDom, 'selGroup': this.pipiSelGroupDom},
            'cationPiStackings': {
                'interGroup': this.cationpiGroupDom, 'selGroup': this.cationpiSelGroupDom
            },
            'distances': {
                'interGroup': this.distanceGroupDom, 'selGroup': this.distanceSelGroupDom
            },
            'interactions': {
                'interGroup': this.interactionGroupDom, 'selGroup': this.interactionSelGroupDom
            }
        };
        this.typeSelectorMap = {
            'atomPairInteractions': this.atomPairInteractionToSelMap,
            'piStackings': this.piStackToSelMap,
            'cationPiStackings': this.cationPiStackToSelMap,
            'distances': this.distanceToSelMap,
            'interactions': this.interactionToSelMap
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the line and endpoint circles representing an intermolecular edge
     * within the SVG. Also creates the wrapper element for this
     * type of intermolecular edge if not done before.
     *
     * @param intermolecularEdge {IntermolecularEdge} - intermolecular edge to draw
     * @param intermolecularInfo {Object} - further draw information for the intermolecular edge
     * @param type {String} - type of the intermolecular edge
     */
    drawIntermolecular(intermolecularEdge, intermolecularInfo, type) {
        const {id, fromStructure, toStructure, color, additionalInformation} = intermolecularEdge;
        const {drawPoints, midpoints, selWidth} = intermolecularInfo;
        const groups = this.typeGroupMap[type];
        const interGroup = groups['interGroup'];
        const selGroup = groups['selGroup'];
        this.typeSelectorMap[type][id] = {};
        const intermolecularSels = this.typeSelectorMap[type][id];
        if (['atomPairInteractions', 'cationPiStackings', 'piStackings'].includes(type)) {
            const dashOff = this.utils.base.getBaseDashOffsetByMidpoints(midpoints);
            const lineSels = this.utils.line.addElementsByDrawPoints(interGroup, drawPoints, {
                styles: {
                    'stroke-dasharray': this.utils.line.dashArrString(),
                    'stroke-dashoffset': dashOff,
                    'stroke-width': this.opts.lineWidth + 'px',
                    'stroke': color,
                    'fill': color,
                    'stroke-linecap': 'round'
                }
            });
            const circleStyle = {'fill': color};
            if (!this.opts.geomineMode && type === 'cationPiStackings') {
                const circle = this.utils.circle.addCircleToSvg(interGroup,
                    '',
                    midpoints[0],
                    this.opts.piPiRadius,
                    circleStyle
                );
                intermolecularSels.circleSel = circle;
            } else if (!this.opts.geomineMode && type === 'piStackings') {
                const fromCircle = this.utils.circle.addCircleToSvg(interGroup,
                    '',
                    midpoints[0],
                    this.opts.piPiRadius,
                    circleStyle
                );
                const toCircle = this.utils.circle.addCircleToSvg(interGroup,
                    '',
                    midpoints[1],
                    this.opts.piPiRadius,
                    circleStyle
                );
                intermolecularSels.fromSel = fromCircle;
                intermolecularSels.toSel = toCircle;
            }
            intermolecularSels.lineSels = lineSels;
        } else if (this.opts.geomineMode && ['distances', 'interactions'].includes(type)) {
            const color = additionalInformation.color;
            const dashOff = this.utils.base.getPtoPdashOffsetByMidpoints(midpoints);
            let styles = {
                'stroke': color, 'fill': color, 'stroke-width': selWidth, 'opacity': 0.5
            };
            if (type === 'interactions') {
                styles['stroke-dasharray'] = this.utils.line.dashArrStringPtoP;
                styles['stroke-dashoffset'] = dashOff;
            }
            const lineSels = this.utils.line.addElementsByDrawPoints(interGroup, drawPoints, {
                styles: styles
            });
            intermolecularSels.lineSels = lineSels;
        }
        intermolecularSels.fromStructure = fromStructure;
        intermolecularSels.toStructure = toStructure;
        intermolecularSels.mouseSel =
            this.utils.selector.drawLineSelectionShape(selGroup, "", midpoints, selWidth).sel;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves the circles of an intermolecular edge to new endpoints and
     * updates the line between the circles accordingly.
     *
     * @param id {Number} - the unique id of the intermolecular edge
     * @param drawPoints {Array} - array of arrays that defines the
     * endpoints of lines to draw
     * @param midpoints {Array} - coordinates of line endpoints
     * @param type {String} - type of the intermolecular edge
     */
    moveIntermolecular(id, {drawPoints, midpoints}, type) {
        const intermolecularSels = this.typeSelectorMap[type][id];
        const dashOff = this.utils.base.getBaseDashOffsetByMidpoints(midpoints);
        intermolecularSels.lineSels.forEach((lineSel, idx) => {
            lineSel.style('stroke-dashoffset', dashOff);
            this.utils.line.updateLineByDrawpoints(lineSel.node(), drawPoints[idx]);
        });
        if (!this.opts.geomineMode && type === 'cationPiStackings') {
            this.utils.circle.moveCircleElement(intermolecularSels.circleSel.node(),
                midpoints[0].x,
                midpoints[0].y
            );
        } else if (!this.opts.geomineMode && type === 'piStackings') {
            this.utils.circle.moveCircleElement(intermolecularSels.fromSel.node(),
                midpoints[0].x,
                midpoints[0].y
            );
            this.utils.circle.moveCircleElement(intermolecularSels.toSel.node(),
                midpoints[1].x,
                midpoints[1].y
            );
        }
        const intermolecularSelectorsSel = intermolecularSels.mouseSel;
        this.utils.line.updateLineByDrawpoints(intermolecularSelectorsSel.node(), midpoints);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Detaches the circle and line elements of a an intermolecular edge from the DOM.
     *
     * @param id {Number} - the unique id of the intermolecular edge
     * @param type {String} - type of the intermolecular edge
     */
    removeIntermolecularFromDOM(id, type) {
        const intermolecularSels = this.typeSelectorMap[type][id];
        intermolecularSels.lineSels.forEach(lineSel => {
            lineSel.remove();
        });
        if (!this.opts.geomineMode && type === 'cationPiStackings') {
            intermolecularSels.circleSel.remove();
        } else if (!this.opts.geomineMode && type === 'piStackings') {
            intermolecularSels.fromSel.remove();
            intermolecularSels.toSel.remove();
        }
        intermolecularSels.mouseSel.remove();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Reattaches the cached circle and line elements of an intermolecular edge to the
     * DOM (after application of removeIntermolecularFromDOM()).
     *
     * @param id {Number} - the unique id of the intermolecular edge
     * @param type {String} - type of the intermolecular edge
     */
    redrawIntermolecular(id, type) {
        const groups = this.typeGroupMap[type];
        const interGroupNode = groups['interGroup'].node();
        const selGroupNode = groups['selGroup'].node();
        const intermolecularSels = this.typeSelectorMap[type][id];
        intermolecularSels.lineSels.forEach(lineSel => {
            interGroupNode.appendChild(lineSel.node());
        });
        if (!this.opts.geomineMode && type === 'cationPiStackings') {
            interGroupNode.appendChild(intermolecularSels.circleSel.node());
        } else if (!this.opts.geomineMode && type === 'piStackings') {
            interGroupNode.appendChild(intermolecularSels.fromSel.node());
            interGroupNode.appendChild(intermolecularSels.toSel.node());
        }
        selGroupNode.appendChild(intermolecularSels.mouseSel.node());
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes all cached information of intermolecular edge's elements.
     *
     * @param id {Number} - the unique id of the intermolecular edge type
     * @param type {String} - type of the intermolecular edge
     */
    purgeIntermolecularFromCache(id, type) {
        delete this.typeSelectorMap[type][id];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Selects an intermolecular edge in the draw area by switching the color of its
     * corresponding selection shape to the selection color.
     *
     * @param id {Number} - the unique id of the intermolecular edge to select
     * @param type {String} - type of the intermolecular edge to select
     */
    selectIntermolecular(id, type) {
        const selector = this.typeSelectorMap[type][id].mouseSel;
        this.utils.selector.switchSelector(selector, 'line', SelectorStatus.select);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Signals that an intermolecular edge is hovered in the draw area by switching the
     * color of its corresponding selection shape to the hover color.
     *
     * @param id {Number} - the unique id of the intermolecular edge to hover
     * @param type {String} - type of the intermolecular edge to hover
     */
    hoverIntermolecular(id, type) {
        const selector = this.typeSelectorMap[type][id].mouseSel;
        this.utils.selector.switchSelector(selector, 'line', SelectorStatus.hover);
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a previously selected/hovered intermolecular edge, removes color from the
     * corresponding selection shape.
     *
     * @param id {Number} - the unique id of the intermolecular edge to unselect
     * @param type {String} - type of the intermolecular edge to unselect
     */
    unselectIntermolecular(id, type) {
        const selector = this.typeSelectorMap[type][id].mouseSel;
        this.utils.selector.switchSelector(selector, 'line', SelectorStatus.unselect);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks if a representation has already been created for a atom pair interaction.
     *
     * @param atomPairInteractionId {Number}- the unique id of the atom pair interaction
     * @returns {Boolean} - whether a representation exists
     */
    wasAtomPairInteractionDrawnBefore(atomPairInteractionId) {
        return this.atomPairInteractionToSelMap.hasOwnProperty(atomPairInteractionId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Shows/hides intermolecular edges of a certain type by changing the corresponding display
     * properties of the svg elements. Also hides the selectors.
     *
     * @param full {Boolean} - set visibility of all intermolecular edges of this type
     * @param toogleVisibility {Boolean} - toggles the visibility if set true
     * @param structureId {Number} - id of structure to show/hide intermolecular edges from
     * @param visibilityClass {String} - CSS class for show/hide
     * @param hiddenStructures {Array} - ids of structures which are currently
     * completely hidden in the draw area.
     * @param type {String} - intermolecular edge type
     */
    setVisibility(full, toogleVisibility, structureId, visibilityClass, hiddenStructures, type) {
        if (full || toogleVisibility) {
            for (const intermolecularObj of Object.values(this.typeSelectorMap[type])) {
                if ((intermolecularObj.fromStructure === structureId ||
                        intermolecularObj.toStructure === structureId) &&
                    !hiddenStructures.includes(intermolecularObj.fromStructure) &&
                    !hiddenStructures.includes(intermolecularObj.toStructure)) {
                    for (const lineSel of intermolecularObj.lineSels) {
                        lineSel.classed(visibilityClass, true);
                    }
                    if (!this.opts.geomineMode && type === 'cationPiStackings') {
                        intermolecularObj.circleSel.classed(visibilityClass, true);
                    } else if (!this.opts.geomineMode && type === 'piStackings') {
                        intermolecularObj.fromSel.classed(visibilityClass, true);
                        intermolecularObj.toSel.classed(visibilityClass, true);

                    }
                    intermolecularObj.mouseSel.classed(visibilityClass, true);
                }
            }
        }
    }
}