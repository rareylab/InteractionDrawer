/**
 * Component that manages SVG groups for the drawing of edges.
 */
class EdgeGroupsComponent {
    /**
     * Contains all relevant D3 selectors and instances for configuration options and drawing utils.
     * Creates containers for the caching of draw element selectors.
     *
     * @param opts {Object} - configuration parameters
     * @param utils {Object} - by components commonly used generic functions for drawing
     * @param edgeGroupDom {Object} - D3 selector of the edges group
     * @param edgeSelGroupDom {Object} - D3 selector of the selection shape group
     * @param edgeDbgGroupDom {Object} - D3 selector of the debug label group
     * @param defsComponent {Object} - D3 selector of the defs element (for gradients)
     * @param svgId {String} - DOM id of the SVG
     */
    constructor(opts, utils, edgeGroupDom, edgeSelGroupDom, edgeDbgGroupDom, defsComponent, svgId) {
        this.opts = opts;
        this.utils = utils;
        this.edgeGroupDom = edgeGroupDom;
        this.edgeSelGroupDom = edgeSelGroupDom;
        this.edgeDbgGroupDom = edgeDbgGroupDom;
        this.defsComponent = defsComponent;
        this.svgId = svgId;

        //Structure object id -> (structureSel/debugSel/selectorSel) -> selectors /edgeSels
        //-> Edge object id -> selectors
        this.edgeToSelMap = {};
        //Structure object id -> Edge object id -> gradient
        this.edgeGradientMap = {};
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the representation of a bond within the SVG. Each bond has its
     * own wrapper within the wrapper for all the bonds of this structure.
     * D3 selectors for DOM elements (for the group wrapper, the selection
     * shape, debug text, and ring wrapper) are cached within the
     * edgeToSelMap, gradient information within the edgeGradientMap.
     *
     * @param structure {Structure} - the Structure object containing the bond
     * @param edge {Edge} - the edge object to draw
     * @param from {Atom} - Atom object of the first atom of the bond
     * @param to {Atom} - Atom object of the second atom of the bond (defines
     * direction of the bond)
     * @param byTemp {Boolean} - whether to use temporary draw information to
     * create the bond drawing
     */
    drawEdge(structure, edge, from, to, byTemp = false) {
        //prepare internal / HTML objects to write information to
        const structureId = structure.id;
        const {id: edgeId, ringSystem} = edge;
        const structureSels = this.edgeToSelMap[structureId];
        const {midpoints, drawPoints, selWidth} = byTemp ? edge.tempDrawInfo : edge.drawInfo;

        //prepare container to put elements into and base for id strings
        const wrapperContainer = ringSystem ? structureSels.ringSysSels[ringSystem] : structureSels;
        const structEdgeString = `${this.svgId}_s_${structureId}_e_${edgeId}`;

        //create map entries (will be updated in individual drawing functions)
        const edgeSels = {
            edgeDrawn: true, groupSel: null, //to delete/hide entire group
            //to iterate drawn elements and change coordinates
            mouseSel: null, //to change coordinates
            debugSel: null, //to change position of debug information
            ringSels: {}, //gets filled later if part of aromatic ring
            aromaticSel: null  //gets filled later if its a non ring aromatic edge
        };
        structureSels.edgeSels[edgeId] = edgeSels;

        //create the visualization step by step
        const usedColor = this.createGradientForEdge(structureId,
            edge,
            from.color,
            to.color,
            midpoints
        );
        this.drawEdgeRepresentation(edge,
            wrapperContainer.structureSel,
            structEdgeString,
            usedColor,
            drawPoints,
            edgeSels,
            midpoints
        );
        this.drawEdgeSelector(wrapperContainer.selectorSel,
            structEdgeString,
            selWidth,
            midpoints,
            edgeSels
        );
        if (this.opts.debug.edges) {
            this.drawEdgeDebugText(structure, edge, wrapperContainer.debugSel, edgeSels);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * For the construction of bonds within aromatic rings, adds the inner
     * (dashed) line to the SVG.
     *
     * @param structureId {Number} - the unique id of the structure the bond
     * belongs to
     * @param edgeId {Number} - the unique id of the outer bond
     * @param ringId {Number} - the unique id of the ring the inner bond
     * should be drawn in
     * @param fromCoords {Object} - x- and y-coordinates of the first endpoint
     * of the inner line
     * @param toCoords {Object} - x- and y-coordinates of the second endpoint
     * of the inner line
     */
    drawAromaticRingEdge(structureId, edgeId, ringId, fromCoords, toCoords) {
        //find SVG group to attach aromatic edge to
        const edgeSels = this.edgeToSelMap[structureId].edgeSels[edgeId];
        const groupSel = edgeSels.groupSel;
        //find the edge's gradient to apply here as well
        const usedColor = this.edgeGradientMap[structureId][edgeId].htmlColor;
        const dashOff = this.utils.base.getBaseDashOffsetByMidpoints([
            fromCoords, toCoords
        ]);
        const styles = {
            'stroke-dasharray': this.utils.line.dashArrString(), 'stroke-dashoffset': dashOff
        };
        if (usedColor !== this.opts.colors.DEFAULT) {
            styles.stroke = usedColor;
        }
        const selId = `structure_${structureId}_edge_${edgeId}_ring_${ringId}`;
        edgeSels.ringSels[ringId] =
            this.utils.line.addLineToSvg(groupSel, selId, fromCoords, toCoords, styles);
    }

    /*----------------------------------------------------------------------*/

    /**
     * As part of creating the representation for a bond, creates its main
     * representation (lines etc., not the selector or debug info).
     *
     * @param edge {Edge} - the edge object to draw
     * @param wrapper {Object} - D3 selector of group to put elements in
     * @param structEdgeString {String} - base string for element ids
     * @param usedColor {String} - URL of gradient or current color of the
     * bond if the bond has only one color
     * @param drawPoints {Array} - array of arrays that defines the
     * endpoints of lines to draw
     * @param edgeSels {Object} - object caching relevant D3 selectors
     */
    drawEdgeRepresentation(edge,
        wrapper,
        structEdgeString,
        usedColor,
        drawPoints,
        edgeSels,
        midpoints
    ) {
        const group = GroupUtils.addGroupToSvg(wrapper, structEdgeString + '_w');
        group.style('stroke', usedColor) //for lines
            .style('fill', usedColor)
            .style('stroke-linejoin', 'round') //for paths
            .style('stroke-width', this.opts.lineWidth + 'px');
        //create lines / path
        if (edge.isAromaticNoRing()) {
            this.utils.line.addElementsByDrawPoints(group, [drawPoints[0]], {edgeType: edge.type});
            edgeSels.groupSel = group;
            const dashOff = this.utils.base.getDashOffsetByMidpoints([
                drawPoints[1][0], drawPoints[1][1]
            ]);
            const styles = {
                'stroke-dasharray': this.utils.line.dashArrString(), 'stroke-dashoffset': dashOff
            };
            edgeSels.aromaticSel = this.utils.line.addLineToSvg(edgeSels.groupSel,
                '',
                drawPoints[1][1],
                drawPoints[1][0],
                styles
            );
        } else {
            this.utils.line.addElementsByDrawPoints(group, drawPoints, {edgeType: edge.type});
            edgeSels.groupSel = group;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Draws the selector around an edge in form of a line of a given selector
     * width. At first, this selector will be made invisible by setting its
     * opacity to 0.
     *
     * @param wrapper {Object} - container to add selector into
     * @param structEdgeString {String} - base string for structure to create
     * id from
     * @param selWidth {Number} - width of created line
     * @param midpoints {Array} - array of two objects holding the coordinates
     * of the endpoints of the bond on both sides ([from, to])
     * @param edgeSels {Object} - selector object used within the drawer to
     * cache selectors
     */
    drawEdgeSelector(wrapper, structEdgeString, selWidth, midpoints, edgeSels) {
        const selId = structEdgeString + '_selector';
        edgeSels.mouseSel =
            this.utils.selector.drawLineSelectionShape(wrapper, selId, midpoints, selWidth).sel;
    }

    /*----------------------------------------------------------------------*/

    /**
     * As part of creating the representation for a bond, creates a text element
     * referencing the internal id in the center of the bond representation.
     *
     * @param structure {Structure} - Structure object containing the bond
     * @param edgeId {Number} - id of the bond to draw debug text for
     * @param from {Number} - id of first atom the bond is connected to
     * @param to {Number} - id of second atom the bond is connected to
     * @param wrapper {Object} - D3 selector for group element to append drawn
     * lines/paths to
     * @param edgeSels {Object} - selector object used within the drawer to
     * cache selectors
     */
    drawEdgeDebugText(structure, {id: edgeId, from, to}, wrapper, edgeSels) {
        const fromCoords = structure.atomsData.getAtom(from).coordinates;
        const toCoords = structure.atomsData.getAtom(to).coordinates;
        const midEdge = {
            x: (fromCoords.x + toCoords.x) / 2, y: (fromCoords.y + toCoords.y) / 2
        };
        const styles = {
            'dominant-baseline': 'central', 'font-size': this.opts.debug.textSize
        };
        if (!this.opts.debug.showEdges) {
            styles['display'] = 'none';
        }
        edgeSels.debugSel = this.utils.text.addTextToSvg(wrapper, '', edgeId, midEdge, styles);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Detaches all DOM elements which are part of a bond's drawn representation.
     * These remain cached and can be reattached by use of the redrawEdge()
     * function.
     *
     * @param structureId {Number} - the unique id of the structure the bond
     * belongs to
     * @param edgeId {Number} - the unique id of the bond to remove related
     * DOM elements for
     * @param unselect {Boolean} - whether to unselect the bond's selector
     * element prior to detaching it (if you plan to reattach it later)
     */
    removeEdge(structureId, edgeId, unselect = true) {
        const structureSels = this.edgeToSelMap[structureId];
        const edgeSels = structureSels.edgeSels[edgeId];
        if (unselect) {
            this.utils.selector.switchSelector(edgeSels.mouseSel, 'line', SelectorStatus.unselect);
        }
        edgeSels.groupSel.remove();
        if (edgeSels.aromaticSel) {
            edgeSels.aromaticSel.remove();
        }
        edgeSels.mouseSel.remove();
        if (this.opts.debug.edges) {
            edgeSels.debugSel.remove();
        }
        this.edgeGradientMap[structureId][edgeId].domSel.remove();
    }

    /*----------------------------------------------------------------------*/
    /**
     * Detaches the DOM element of the inner line of an aromatic edge.
     *
     * @param structureId {Number} - the unique id of the structure the bond
     * belongs to
     * @param edgeId {Number} - the unique id of the outer bond
     * @param ringId {Number} - the unique id of the ring the inner bond
     * is drawn in
     */
    removeAromaticRingEdge(structureId, edgeId, ringId) {
        this.edgeToSelMap[structureId].edgeSels[edgeId].ringSels[ringId].remove();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Reattaches cached detached DOM elements which are part of a bond's
     * drawn representation (after application of removeEdge()).
     *
     * @param structureId {Number} - the unique id of the structure the bond
     * belongs to
     * @param edge {Edge} - Edge object representing the bond
     */
    redrawEdge(structureId, edge) {
        const edgeId = edge.id;
        const structureSels = this.edgeToSelMap[structureId];
        const edgeSels = structureSels.edgeSels[edgeId];
        //add back edge group to structure group
        let wrapper = structureSels;
        //append ring systems
        if (edge.ringSystem) {
            wrapper = structureSels.ringSysSels[edge.ringSystem];
        }
        //append edge groups
        const structNode = wrapper.structureSel.node();
        structNode.appendChild(edgeSels.groupSel.node());
        if (edgeSels.aromaticSel) {
            structNode.appendChild(edgeSels.aromaticSel.node());
        }
        if (this.opts.debug.edges) {
            structureSels.debugSel.node().appendChild(edgeSels.debugSel.node());
        }
        wrapper.selectorSel.node().appendChild(edgeSels.mouseSel.node());
        //add back gradient
        this.defsComponent.defsDom.node().appendChild(this.edgeGradientMap[structureId]
            [edgeId].domSel.node());
    }

    /*----------------------------------------------------------------------*/

    /**
     * Reattaches the cached line of an aromatic bond to the DOM.
     *
     * @param structureId {Number} - the unique id of the structure the bond
     * belongs to
     * @param edgeId {Number} - the unique id of the outer bond
     * @param ringId {Number} - the unique id of the ring the inner bond
     * is drawn in
     */
    redrawAromaticRingEdge(structureId, edgeId, ringId) {
        const structureSels = this.edgeToSelMap[structureId];
        structureSels.structureSel.node()
            .appendChild(structureSels.edgeSels[edgeId].ringSels[ringId].node());
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves the SVG representation of an edge by updating the corresponding
     * lines (both of the actual edge and the selector) / paths and also the
     * edge's gradient.
     *
     * @param structure {Structure} - the object holding the edge
     * @param edge {Edge} - Edge object with all the necessary coordinate
     * information
     * @param byTemp {Boolean} - whether to move edge using temporary draw
     * info
     * @param typeChanged {Boolean} - flag to denote if type of edge has
     * changed since it was last drawn
     */
    moveEdge(structure, edge, byTemp = false, typeChanged = false) {
        const structureId = structure.id;
        const {id: edgeId, type} = edge;
        const edgeSels = this.edgeToSelMap[structureId].edgeSels[edgeId];
        const drawElements = edgeSels.groupSel;
        const drawElementsNode = drawElements.node();
        const mouseSel = edgeSels.mouseSel;
        const gradientInfo = this.edgeGradientMap[structureId][edgeId];
        const {midpoints, drawPoints} = byTemp ? edge.tempDrawInfo : edge.drawInfo;

        //EDGE: change position / create new path
        if (typeChanged) { //recreate edges
            GroupUtils.clearWrapper(drawElements);
            this.utils.line.addElementsByDrawPoints(drawElements, drawPoints, {edgeType: type});
        } else { //move edges based on new information
            const movableEdges = [
                'single',
                'double',
                'triple',
                'stereoBack',
                'stereoBackReverse',
                'stereoFront',
                'stereoFrontReverse'
            ];
            if (movableEdges.includes(type)) {
                if (edgeSels.aromaticSel) {
                    const path = this.utils.line.createPathFromPoints([drawPoints[0]]);
                    const pathNode = drawElementsNode.firstChild;
                    pathNode.setAttribute('d', path);
                    const aromaticNode = edgeSels.aromaticSel.node();
                    this.utils.line.updateLineByDrawpoints(aromaticNode, drawPoints[1]);
                } else {
                    const path = this.utils.line.createPathFromPoints(drawPoints);
                    const pathNode = drawElementsNode.firstChild;
                    pathNode.setAttribute('d', path);
                }
            }
        }

        //SELECTOR
        const mouseSelNode = mouseSel.node();
        this.utils.line.updateLineByDrawpoints(mouseSelNode, midpoints);

        //GRADIENT
        if (gradientInfo.isOnDom) {
            const gradientNode = gradientInfo.domSel.node();
            this.utils.line.updateLineByDrawpoints(gradientNode, midpoints);
        }

        //DEBUG-INFO
        if (this.opts.debug.edges) {
            const coordParam = byTemp ? 'tempCoordinates' : 'coordinates';
            const fromCoords = structure.atomsData.getAtom(edge.from)[coordParam];
            const toCoords = structure.atomsData.getAtom(edge.to)[coordParam];
            this.moveEdgeDebugText(structureId, edgeId, fromCoords, toCoords);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * As part of bond movement, updates position of debug text.
     *
     * @param structureId {Number} - unique id of structure containing the
     * bond
     * @param edgeId {Number} - unique id of the bond to move
     * @param firstCoords {Object} - new coordinates for first endpoint
     * @param secondCoords {Object} - new coordinates for second endpoint
     */
    moveEdgeDebugText(structureId, edgeId, firstCoords, secondCoords) {
        if (!this.opts.debug.edges) {
            return;
        }
        const dbgNode = this.edgeToSelMap[structureId].edgeSels[edgeId]
            .debugSel.node();
        this.utils.base.setAttributeRounded(dbgNode, 'x', (firstCoords.x + secondCoords.x) / 2);
        this.utils.base.setAttributeRounded(dbgNode, 'y', (firstCoords.y + secondCoords.y) / 2);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Selects a bond in the draw area by switching the color of its
     * corresponding selection shape to the selection color.
     *
     * @param structureId {Number} - the unique id of the structure the bond
     * belongs to
     * @param edgeId {Number} - the unique id of the bond to select
     */
    selectEdge(structureId, edgeId) {
        const selector = this.edgeToSelMap[structureId].edgeSels[edgeId].mouseSel;
        this.utils.selector.switchSelector(selector, 'line', SelectorStatus.select);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Signals that a bond is hovered in the draw area by switching the color
     * of its corresponding selection shape to the hover color.
     *
     * @param structureId {Number} - the unique id of the structure the bond
     * belongs to
     * @param edgeId {Number} - the unique id of the bond to hover
     */
    hoverEdge(structureId, edgeId) {
        const selector = this.edgeToSelMap[structureId].edgeSels[edgeId].mouseSel;
        this.utils.selector.switchSelector(selector, 'line', SelectorStatus.hover);
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a previously selected/hovered bond, removes color from the bond's
     * corresponding selection shape.
     *
     * @param structureId {Number} - the unique id of the structure the bond
     * belongs to
     * @param edgeId {Number} - the unique id of the bond to unselect
     */
    unselectEdge(structureId, edgeId) {
        const selector = this.edgeToSelMap[structureId].edgeSels[edgeId].mouseSel;
        this.utils.selector.switchSelector(selector, 'line', SelectorStatus.unselect);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Changes the color of a bond's representation by giving end colors for a
     * gradient along the bond (colors can be the same).
     *
     *@param structureId {Number} - the unique id of the structure the bond
     * belongs to
     * @param edgeId {Number} - the unique id of the bond to recolor
     * @param fromColor {String} - valid CSS color for the first end of the
     * gradient which colors the bond
     * @param toColor {String} - valid CSS color for the second end of the
     * gradient which colors the bond
     */
    recolorEdge(structureId, edgeId, fromColor, toColor) {
        const setGroupColor = (color) => {
            const group = this.edgeToSelMap[structureId].edgeSels[edgeId].groupSel;
            group.style('stroke', color)
                .style('fill', color);
        };

        const gradientInfo = this.edgeGradientMap[structureId][edgeId];
        if (fromColor === toColor) { //no gradient needed
            if (gradientInfo.isOnDom) {
                gradientInfo.domSel.remove();
                gradientInfo.isOnDom = false;
            }
            if (gradientInfo.htmlColor !== fromColor) {
                gradientInfo.htmlColor = fromColor;
                setGroupColor(fromColor);
            }
        } else { //gradient needed
            if (!gradientInfo.isOnDom) {
                this.defsComponent.defsDom.node().appendChild(gradientInfo.domSel.node());
                gradientInfo.isOnDom = true;
                const url = gradientInfo.url;
                gradientInfo.htmlColor = url;
                setGroupColor(url);
            }
            if (fromColor) {
                gradientInfo.fromColorSel.attr('stop-color', fromColor);
            }
            if (toColor) {
                gradientInfo.toColorSel.attr('stop-color', toColor);
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Changes the color of an inner line of an aromatic bond.
     *
     * @param structureId {Number} - the unique id of the structure the bond
     * belongs to
     * @param edgeId {Number} - the unique id of the outer bond
     * @param ringId {Number} - the unique id of the ring the inner bond
     * is drawn in
     */
    recolorAromaticRingEdge(structureId, edgeId, ringId) {
        const ringEl = this.edgeToSelMap[structureId].edgeSels[edgeId].ringSels[ringId];
        const curColor = this.edgeGradientMap[structureId][edgeId].htmlColor;
        ringEl.style('stroke', curColor);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Change the color of a bond's corresponding selection shape.
     *
     * @param structureId {Number} - the unique id of the structure the bond
     * belongs to
     * @param edgeId {Number} - the unique id of the bond to select
     * @param color {String} - valid CSS color
     */
    recolorEdgeSelector(structureId, edgeId, color) {
        const selector = this.edgeToSelMap[structureId].edgeSels[edgeId].mouseSel;
        SelectorUtils.changeSelectorColor(selector, 'line', color);
    }

    /*----------------------------------------------------------------------*/

    /**
     * As part of creating the SVG representation of a bond, creates the
     * gradient (in the SVG defs) to color it.
     *
     * @param structureId {Number} - the unique id of the structure the bond
     * belongs to
     * @param edgeId {Number} - the unique id of the bond to draw
     * @param type {String} - type of the bond, e.g., 'single', 'double'
     * @param fromColor {String} - CSS color of the first side of the bond
     * @param toColor {String} - CSS color of the second side of the bond
     * @param midpoints {Array} - array of two objects holding the coordinates
     * of the endpoints of the bond on both sides ([from, to])
     * @returns {String} - URL of gradient or current color of the bond if the
     * bond has only one color
     */
    createGradientForEdge(structureId, {id: edgeId, type}, fromColor, toColor, midpoints) {
        const gradientId = `${this.svgId}_s_${structureId}_e_${edgeId}_g`;
        let firstColor, secondColor;
        //be careful with order of colors
        if (type === 'stereoFrontReverse' || type === 'stereoBackReverse') {
            firstColor = toColor;
            secondColor = fromColor;
        } else {
            firstColor = fromColor;
            secondColor = toColor;
        }

        const gradient = this.defsComponent.addGradientToSvg(gradientId,
            firstColor,
            secondColor,
            midpoints[0],
            midpoints[1]
        );
        if (firstColor === secondColor) {
            gradient.domSel.remove();
            gradient.isOnDom = false;
            gradient.htmlColor = firstColor;
        }
        //set map entry, return the used color (url or RBG code)
        this.edgeGradientMap[structureId][edgeId] = gradient;
        return gradient.htmlColor;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks if a representation has already been created for a bond (by use
     * of the drawEdge() function).
     *
     * @param structureId {Number} - the unique id of the structure containing
     * the bond
     * @param edgeId {Number} - the unique id of the bond to check for
     * @returns {Boolean} - whether a representation exists
     */
    wasEdgeDrawnBefore(structureId, edgeId) {
        return this.edgeToSelMap[structureId].edgeSels[edgeId].edgeDrawn;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves the inner line of an aromatic bond. Assumes that moveEdge() is
     * always called as these inner lines use the same gradients.
     *
     * @param structureId {Number} - the unique id of the structure the bond
     * belongs to
     * @param edgeId {Number} - the unique id of the outer bond
     * @param ringId {Number} - the unique id of the ring the inner bond
     * should be drawn in
     * @param fromCoords {Object} - x- and y-coordinates of the new first
     * endpoint of the inner line
     * @param toCoords {Object} - x- and y-coordinates of the new second
     * endpoint of the inner line
     */
    moveAromaticRingEdge(structureId, edgeId, ringId, fromCoords, toCoords) {
        const ringSel = this.edgeToSelMap[structureId].edgeSels[edgeId].ringSels[ringId];
        const dashOff = this.utils.base.getBaseDashOffsetByMidpoints([
            fromCoords, toCoords
        ]);
        ringSel.style('stroke-dashoffset', dashOff);
        const ringNode = ringSel.node();
        this.utils.line.updateLineByDrawpoints(ringNode, [fromCoords, toCoords]);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Shows/hides edges by changing the corresponding display
     * properties of the svg elements. Also hides the selectors.
     *
     * @param full {Boolean} - set visibility of all edges
     * @param bonds {Boolean} - toggles the visibility if set true
     * @param structureId {Number} - id of structure to show/hide edges from
     * @param visibilityClass {String} - CSS class for show/hide
     */
    setVisibility(full, bonds, structureId, visibilityClass) {
        if ((full || bonds) && this.edgeToSelMap.hasOwnProperty(structureId)) {
            const edgeToSelMap = this.edgeToSelMap[structureId];
            edgeToSelMap.structureSel.classed(visibilityClass, true);
            edgeToSelMap.selectorSel.classed(visibilityClass, true);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Rotates the EDGE skeleton of a structure (new atom positions to be set
     * separately).
     *
     * @param structureId {Number} - id of structure to move edge skeleton for
     * @param angle {Number} - angle to rotate by
     * @param origin {Object} - point to rotate around
     * @param isDeg {Boolean} - whether the provided angle is given in degrees
     * or radians
     */
    setRotationEdgeSkeleton(structureId, angle, origin, isDeg = true) {
        const structureSels = this.edgeToSelMap[structureId];
        const deg = isDeg ? angle : AngleCalculation.radianToDegree(angle);
        structureSels.structureSel
            .attr('transform', `rotate(${deg} ${origin.x} ${origin.y})`);
        structureSels.selectorSel
            .attr('transform', `rotate(${deg} ${origin.x} ${origin.y})`);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the rotation of an edge skeleton.
     *
     * @param structureId {Number} - id of structure to reset rotation for
     */
    resetEdgeSkeletonRotation(structureId) {
        const structureSels = this.edgeToSelMap[structureId];
        SelectorUtils.resetTransformOnSelectors(structureSels);
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a (new) structure, adds new container groups to the svg for edges.
     * Creates a new wrapper in the edge group. Further
     * prepares the mapping of selectors for later access. In the selector
     * map, the created groups are mapped also, so they may be hidden later.
     *
     * @param structure {Structure} - Structure object
     * @param structureId {structureId} - id of Structure object
     * @param debug {Boolean} - true if debug information shall be visualized
     */
    addEdgesToTrack(structure, structureId, debug) {
        const movementGroupIDs = {
            idGroup: this.svgId + '_s_' + structureId + '_e',
            idSelGroup: this.svgId + '_s_' + structureId + '_eS',
            idDbgGroup: this.svgId + '_s_' + structureId + '_dbgEdges'
        };
        const movementGroupsDom = GroupUtils.addGroupsForMovement(this.edgeGroupDom,
            this.edgeSelGroupDom,
            this.edgeDbgGroupDom,
            movementGroupIDs,
            debug
        );
        const edgeSels = {};
        structure.edgesData.edges.forEach(({id: edgeId}) => {
            edgeSels[edgeId] = {
                edgeDrawn: false
            };
        });
        //creation of more complicated edge maps
        const edgeToSelMap = {
            structureSel: movementGroupsDom.movGroupDom,
            selectorSel: movementGroupsDom.movSelGroupDom,
            edgeSels: edgeSels,
            debugSel: movementGroupsDom.movDbgGroupDom
        };

        const edgeRingMap = {};
        for (const bccId in structure.ringsData.ringSystems) {
            const ringMovementGroupIDs = {
                idGroup: this.svgId + '_s_' + structureId + '_rs_' + bccId + '_e',
                idSelGroup: this.svgId + '_s_' + structureId + '_rs_' + bccId + '_eS',
                idDbgGroup: this.svgId + '_s_' + structureId + '_rs_' + bccId + '_dbg'
            };
            const ringMovementGroupsDom = GroupUtils.addGroupsForMovement(movementGroupsDom.movGroupDom,
                movementGroupsDom.movSelGroupDom,
                movementGroupsDom.movDbgGroupDom,
                ringMovementGroupIDs,
                debug
            );
            edgeRingMap[bccId] = {
                structureSel: ringMovementGroupsDom.movGroupDom,
                selectorSel: ringMovementGroupsDom.movSelGroupDom,
                debugSel: ringMovementGroupsDom.movDbgGroupDom
            };
        }
        edgeToSelMap.ringSysSels = edgeRingMap;
        this.edgeToSelMap[structureId] = edgeToSelMap;
        this.edgeGradientMap[structureId] = {};
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hides all text representations of debug labels. Otherwise, display all
     * text representations of debug labels, provided parameters
     * to ever show specific debug elements are set in the configuration
     *
     * @param visible {Boolean} - true if debug labels shall be visible
     */
    toggleDebugLabelsVisibility(visible) {
        let display = 'none';
        if (visible) {
            display = null;
        }
        if (this.opts.debug.edges && this.opts.debug.showEdges) {
            for (const structureSel of Object.values(this.edgeToSelMap)) {
                for (const edgeSel of Object.values(structureSel.edgeSels)) {
                    edgeSel.debugSel.style('display', visible);
                }
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a previously removed structure, puts its detached edge DOM elements back
     * into previous positions.
     *
     * @param structureId {Number} - id of structure to add back
     */
    redrawStructureEdges(structureId) {
        this.edgeGroupDom.node().appendChild(this.edgeToSelMap[structureId].structureSel.node());
        this.edgeSelGroupDom.node().appendChild(this.edgeToSelMap[structureId].selectorSel.node());
        for (const edgeId in this.edgeGradientMap[structureId]) {
            const gradient = this.edgeGradientMap[structureId][edgeId].domSel;
            gradient && this.defsComponent.defsDom.node().appendChild(gradient.node());
        }
        if (this.edgeToSelMap[structureId].debugSel) {
            this.edgeDbgGroupDom.node().appendChild(this.edgeToSelMap[structureId].debugSel.node());
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes edges of a structure from the DOM.
     *
     * @param structureId {Number} - the unique id of the structure to remove its
     * edges from DOM
     */
    removeStructureEdgesFromDOM(structureId) {
        this.edgeToSelMap[structureId].structureSel.remove();
        this.edgeToSelMap[structureId].selectorSel.remove();
        if (this.edgeToSelMap[structureId].debugSel) {
            this.edgeToSelMap[structureId].debugSel.remove();
        }
        for (const edgeId in this.edgeGradientMap[structureId]) {
            const gradient = this.edgeGradientMap[structureId][edgeId].domSel;
            gradient && gradient.remove();
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes all cached edge information for a given structure (by its id).
     *
     * @param structureId {Number} - id of structure to remove information
     * about.
     */
    purgeStructureEdgesFromCache(structureId) {
        delete this.edgeToSelMap[structureId];
        delete this.edgeGradientMap[structureId];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets translations made for edges of a certain ring system.
     *
     * @param structureId {Number} - id of structure containing the ring
     * system
     * @param ringSysId {Number} - id of ring systems to reset translations
     * for
     */
    resetRingEdgeSkeletonTranslation(structureId, ringSysId) {
        const edgeSels = this.edgeToSelMap[structureId].ringSysSels[ringSysId];
        SelectorUtils.resetTransformOnSelectors(edgeSels);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets translations made for edges of a certain structure.
     *
     * @param structureId {Number} - id of structure to reset translations for
     */
    resetEdgeSkeletonTranslation(structureId) {
        SelectorUtils.resetTransformOnSelectors(this.edgeToSelMap[structureId]);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves structural skeleton (edges as groups) by specified offsets.
     *
     * @param structureId {Number} - id of structure to move skeleton of
     * @param xOffset {Number} - offset to move structure by in x-direction
     * @param yOffset {Number} - offset to move structure by in y-direction
     */
    moveEdgeSkeleton(structureId, xOffset, yOffset) {
        const edgeSels = this.edgeToSelMap[structureId];
        this.utils.selector.moveSelectorsOfSkeleton(edgeSels, xOffset, yOffset, 'edge');
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves structural skeleton (edges as groups) of a ring system by specified
     * offsets.
     *
     * @param structureId {Number} - id of structure containing the ring
     * system
     * @param ringSysId {Number} - id of ring systems to move skeleton of
     * @param xOffset {Number} - offset to move ring system by in x-direction
     * @param yOffset {Number} - offset to move ring system by in y-direction
     */
    moveRingEdgeSkeleton(structureId, ringSysId, xOffset, yOffset) {
        const edgeSels = this.edgeToSelMap[structureId].ringSysSels[ringSysId];
        this.utils.selector.moveSelectorsOfSkeleton(edgeSels, xOffset, yOffset, 'edge');
    }
}