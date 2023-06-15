/**
 * Component that manages SVG groups for the drawing of atoms.
 */
class AtomGroupsComponent {
    /**
     * Contains all relevant D3 selectors and instances for configuration options and drawing utils.
     * Creates containers for the caching of draw element selectors.
     *
     * @param opts {Object} - configuration parameters
     * @param utils {Object} - by components commonly used generic functions for drawing
     * @param atomGroupDom {Object} - D3 selector of the atoms group
     * @param atomSelGroupDom {Object} - D3 selector of the selection shape group
     * @param atomDbgGroupDom {Object} - D3 selector of the debug label group
     * @param svgId {String} - DOM id of the SVG
     */
    constructor(opts, utils, atomGroupDom, atomSelGroupDom, atomDbgGroupDom, svgId) {
        this.opts = opts;
        this.utils = utils;
        this.atomGroupDom = atomGroupDom;
        this.atomSelGroupDom = atomSelGroupDom;
        this.atomDbgGroupDom = atomDbgGroupDom;
        this.svgId = svgId;

        //Structure object id -> (structureSel/debugSels) -> selectors /atomSels/ringSysSels
        //-> Atom/Ring object id -> selectors
        this.atomToSelMap = {};
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the representation of an atom within the SVG. Each atom has its
     * own wrapper within the wrapper for all the atoms of this structure.
     * Inside this wrapper, there is another wrapper containing the drawing of
     * the atom (text or ball) and the selector (which is represented by a
     * circle around the atom). Access to the DOM elements (main atom wrapper,
     * wrapper of atom representation, and for the selector are mapped in the
     * atomToSelMap.
     *
     * @param structure {Structure} - the Structure object containing the atom
     * @param atom {Atom} - the Atom object to draw
     */
    drawAtom(structure, atom) {
        //create wrapper
        const structureId = structure.id;
        const {id: atomId, coordinates, element, ringSystem, label} = atom;
        const structureSels = this.atomToSelMap[structureId];

        //prepare container to put elements into and base for id strings
        const wrapperContainer = ringSystem ? structureSels.ringSysSels[ringSystem] : structureSels;
        const structAtomString = `${this.svgId}_s_${structureId}_a_${atomId}`;

        //create map entries (will be updated in individual drawing functions)
        const placementInfo = {
            atomText: {exists: false},
            chargeText: {exists: false},
            hText: {exists: false},
            hNumberText: {exists: false}
        };
        const atomSels = {
            groupSel: null, //to delete/hide entire group
            atomSel: null, //to change coordinates and color
            mouseSels: [], //to change coordinates
            selectorShapes: [], //to find out if something is on selector
            placementInfo: placementInfo, //for text and hydrogen
            debugSel: null, debugPosition: null //where debug text is positioned
        };

        structureSels.atomSels[atomId] = atomSels;
        //create the visualization step by step
        if (this.opts.atomMode === 'name') {
            if (element !== 'C') {
                this.drawAtomText(atom, wrapperContainer, atomSels, structAtomString);
                //correctly place hydrogens after drawing
                this.placeHByOrientation(structureId, atom, false);
            }
        }
        this.drawAtomSelector(label,
            coordinates,
            wrapperContainer,
            atomSels,
            placementInfo,
            structAtomString
        );
        if (this.opts.debug.atoms) {
            this.drawAtomDebugText(structureId, atom, wrapperContainer, atomSels);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * As part of creation of the representation of an atom within the SVG,
     * creates the main (element) text centered on given coordinates.
     *
     * @param atom {Atom} - the Atom object to represent, containing
     * information on coordinates, color, etc.
     * @param wrapperContainer {Object} - object holding SVG group elements to
     * add text elements within
     * @param atomSels {Object} - selector object used within the drawer to
     * cache selectors
     * @param structAtomString {String} - base string for ids of text
     * elements
     */
    drawAtomText(atom, wrapperContainer, atomSels, structAtomString) {
        const {coordinates, label, charge, hydrogenCount: hCount, color} = atom;
        const wrapper = GroupUtils.addGroupToSvg(wrapperContainer.structureSel,
            structAtomString + '_w',
            {
                'font-family': this.opts.fontFamily
            }
        );

        //add wrapper for text (as text group)
        const gId = structAtomString + '_text';
        const textG = GroupUtils.addGroupToSvg(wrapper, gId);

        //add main text element
        const {
            sel: atomText, width: labelWidth, x: labelX, y: labelY
        } = this.utils.text.placeCenteredText(textG, label, coordinates, color, true);

        //add charge text (if necessary)
        let chargeNode, chargeX, chargeY, chargeWidth;
        if (charge !== 0) {
            const fullCharge = Number.isInteger(charge);
            let chargeText;
            const chargeAbs = Math.abs(charge);
            const symbol = charge > 0 ? '+' : '-';
            if (fullCharge) {
                chargeText = (chargeAbs !== 1 && chargeAbs !== -1) ? symbol + chargeAbs : symbol;
            } else {
                chargeText = new Fraction(charge).simplify(0.01).toFraction(false);
                if (charge > 0) {
                    chargeText = symbol + chargeText;
                }
            }
            chargeNode = textG.append('text')
                .style('font-family', this.opts.fontFamily)
                .style('fill', color)
                .text(chargeText)
                .attr('y', coordinates.y)
                .attr('x', coordinates.x)
                .attr('font-size', this.opts.chargeFontSize + 'px')
                .attr('font-weight', 'bolder');
            //first center (on top of label), then move to correct position
            const chargeBbox = chargeNode.node().getBBox();
            chargeX = labelX + labelWidth;
            chargeY = BaseUtils.centerBBoxY(chargeBbox, coordinates);
            //bbox width is not correkt for chrome and edge
            chargeWidth = chargeNode.node().getSubStringLength(0, chargeText.length);
            chargeNode.attr('x', chargeX)
                .attr('y', chargeY)
                .attr('dy', -this.opts.chargeOffset + 'px');
        }

        //create text for hydrogens (if necessary)
        let hText, hY, hWidth, hNumberText, hNrY, hNrWidth;
        if (hCount > 0) {
            hText = textG.append('text')
                .style('font-family', this.opts.fontFamily)
                .style('fill', color)
                .text('H')
                .attr('x', coordinates.x)
                .attr('y', coordinates.y)
                .attr('font-size', this.opts.textSize + 'px');
            //place on top of label, real placement happens in
            //placeHByOrientation()
            const hBbox = hText.node().getBBox();
            hY = BaseUtils.centerBBoxY(hBbox, coordinates);
            hWidth = hBbox.width;
            hText.attr('y', hY);
            //draw hydrogen count
            if (hCount > 1) {
                hNumberText = textG.append('text')
                    .style('font-family', this.opts.fontFamily)
                    .style('fill', color)
                    .text(hCount)
                    .attr('x', coordinates.x)
                    .attr('y', coordinates.y)
                    .attr('font-size', this.opts.hNumberFontSize + 'px');
                //place only y coordinate correctly, real placement as above
                const hNumberBbox = hNumberText.node().getBBox();
                const hNrX = hBbox.x + hBbox.width;
                hNrY = BaseUtils.centerBBoxY(hNumberBbox, coordinates);
                hNrWidth = hNumberBbox.width;
                hNumberText.attr('x', hNrX)
                    .attr('y', hNrY)
                    .attr('dy', this.opts.hNumberOffset);
            }
        }

        //set the group selectors in the given selector map
        atomSels.groupSel = wrapper;
        atomSels.atomSel = textG;
        const placementInfo = atomSels.placementInfo;
        const updateInfo = (x, y, width, sel, field) => {
            if (y) {
                placementInfo[field] = {
                    exists: true, sel: sel, x: x, y: y, width: width
                };
            }
        };
        updateInfo(labelX, labelY, labelWidth, atomText, 'atomText');
        updateInfo(chargeX, chargeY, chargeWidth, chargeNode, 'chargeText');
        updateInfo(undefined, hY, hWidth, hText, 'hText');
        updateInfo(undefined, hNrY, hNrWidth, hNumberText, 'hNumberText');
    }

    /*----------------------------------------------------------------------*/

    /**
     * As part of creation of the representation of an atom within the SVG,
     * creates debug text referencing the internal atom id on top of the main
     * text representation.
     *
     * @param structureId {Number} - id of structure the atom belongs to
     * @param atomId {Number} - id of the atom
     * @param coordinates {Object} - x- and y-coordinates to center text in
     * @param wrapperContainer {Object} - object holding SVG group elements to
     * add text elements within
     * @param atomSels {Object} - selector object used within the drawer to
     * cache selectors
     */
    drawAtomDebugText(structureId, {id: atomId, coordinates}, wrapperContainer, atomSels) {
        const debugSel = wrapperContainer.debugSel;
        const styles = {
            'dominant-baseline': 'central', 'font-size': this.opts.debug.textSize
        };
        if (!this.opts.debug.showAtoms) {
            styles['display'] = 'none';
        }
        atomSels.debugSel = this.utils.text.addTextToSvg(debugSel, '', atomId, coordinates, styles);
        atomSels.debugPosition = Object.assign({}, coordinates);
    }

    /*----------------------------------------------------------------------*/

    /**
     * As part of creation of the representation of an atom within the SVG,
     * creates the selector shapes behind the atom text.
     *
     * @param label {String} - text that is drawn for the atom
     * @param coordinates {Object} - x- and y-coordinates to center text in
     * @param wrapperContainer {Object} - object holding SVG group elements to
     * add text elements within
     * @param atomSels {Object} - selector object used within the drawer to
     * cache selectors
     * @param placementInfo {Object} - bbox information of the different text
     * elements created for the atom
     * @param structAtomString {String} - base string for ids of text
     * elements
     */
    drawAtomSelector(label,
        coordinates,
        wrapperContainer,
        atomSels,
        placementInfo,
        structAtomString
    ) {
        const selId = structAtomString + '_selector';
        const {mouseSels, selectorShapes} = this.utils.selector.drawTextLabelSelectors(label,
            coordinates,
            placementInfo.atomText.width,
            wrapperContainer.selectorSel,
            selId
        );
        atomSels.mouseSels = mouseSels;
        atomSels.selectorShapes = selectorShapes;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Detaches all DOM elements which are part of an atom's drawn
     * representation. These remain cached and can be reattached by use of the
     * redrawAtom() function.
     *
     * @param structureId {Number} - the unique id of the structure the atom
     * belongs to
     * @param atomId {Number} - the unique id of the atom to remove related
     * DOM elements for
     * @param unselect {Boolean} - whether to unselect the atom's selector
     * element prior to detaching it (if you plan to reattach it later)
     */
    removeAtom(structureId, atomId, unselect = true) {
        const structureSels = this.atomToSelMap[structureId];
        const atomSels = structureSels.atomSels[atomId];
        const mouseSels = atomSels.mouseSels;
        if (unselect) {
            mouseSels.forEach(selector => {
                this.utils.selector.switchSelector(selector, 'circle', SelectorStatus.unselect);
            });
        }
        if (atomSels.groupSel) atomSels.groupSel.remove();
        if (atomSels.debugSel) {
            atomSels.debugSel.remove();
        }
        mouseSels.forEach(selector => {
            selector.remove();
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Reattaches cached detached DOM elements which are part of an atom's
     * drawn representation (after application of removeAtom()).
     *
     * @param structureId {Number} - the unique id of the structure the atom
     * belongs to
     * @param atom {Atom} - Atom object belonging to the atom to reattach DOM
     * elements for (requiring id and ring system information)
     */
    redrawAtom(structureId, atom) {
        const atomId = atom.id;
        const structureSels = this.atomToSelMap[structureId];
        const atomSels = structureSels.atomSels[atomId];
        //add back atom group to structure group
        let wrapper = structureSels;
        if (atom.ringSystem) {
            wrapper = structureSels.ringSysSels[atom.ringSystem];
        }
        if (atomSels.groupSel) {
            wrapper.structureSel.node().appendChild(atomSels.groupSel.node());
        }
        if (atomSels.debugSel) {
            structureSels.debugSel.node().appendChild(atomSels.debugSel.node());
        }
        atomSels.mouseSels.forEach(selector => {
            wrapper.selectorSel.node().appendChild(selector.node());
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Applies movement on the representation of an atom (i.e., on all text
     * elements drawn for this atom) by giving offsets to move in x- and y-
     * direction.
     *
     * @param structureId {Number} - the unique id of the structure the atom
     * belongs to
     * @param atomId {Number} - the unique id of the atom to move
     * @param xOffset {Number} - offset to move in x-direction
     * @param yOffset {Number} - offset to move in y-direction
     */
    moveAtom(structureId, atomId, {x: xOffset, y: yOffset}) {
        const atomSels = this.atomToSelMap[structureId].atomSels[atomId];
        const placementInfo = atomSels.placementInfo;

        //ATOM TEXT
        let curInfo;
        const updateCur = () => {
            if (curInfo.exists) {
                this.utils.text.moveTextByPlacementInfo(curInfo.sel, curInfo, xOffset, yOffset);
            }
        };

        //ATOM TEXT
        curInfo = placementInfo.atomText;
        updateCur();
        //CHARGE TEXT
        curInfo = placementInfo.chargeText;
        updateCur();
        //HYDROGEN TEXT
        curInfo = placementInfo.hText;
        updateCur();
        //HYDROGEN NUMBER TEXT
        curInfo = placementInfo.hNumberText;
        updateCur();

        //update created selector shapes
        this.utils.selector.moveAllSelectors(atomSels.mouseSels,
            atomSels.selectorShapes,
            xOffset,
            yOffset
        );

        //update debug text if given
        if (this.opts.debug.atoms) {
            const debugSel = atomSels.debugSel;
            const debugInfo = atomSels.debugPosition;
            this.utils.text.moveTextByPlacementInfo(debugSel, debugInfo, xOffset, yOffset);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Signals that an atom is hovered in the draw area by switching the color
     * of its corresponding selection shape to the hover color.
     *
     * @param structureId {Number} - the unique id of the structure the atom
     * belongs to
     * @param atomId {Number} - the unique id of the atom to signal as hovered
     */
    hoverAtom(structureId, atomId) {
        const atomSels = this.atomToSelMap[structureId].atomSels[atomId];
        this.utils.selector.switchTextLabelSelectorStatus(atomSels, SelectorStatus.hover);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Selects an atom in the draw area by switching the color of its
     * corresponding selection shape to the selection color.
     *
     * @param structureId {Number} - the unique id of the structure the atom
     * belongs to
     * @param atomId {Number} - the unique id of the atom to select
     */
    selectAtom(structureId, atomId) {
        const atomSels = this.atomToSelMap[structureId].atomSels[atomId];
        this.utils.selector.switchTextLabelSelectorStatus(atomSels, SelectorStatus.select);
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a previously selected/hovered atom, removes color from the atom's
     * corresponding selection shape.
     *
     * @param structureId {Number} - the unique id of the structure the atom
     * belongs to
     * @param atomId {Number} - the unique id of the atom to unselect
     */
    unselectAtom(structureId, atomId) {
        const atomSels = this.atomToSelMap[structureId].atomSels[atomId];
        this.utils.selector.switchTextLabelSelectorStatus(atomSels, SelectorStatus.unselect);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Changes the color of an atom's corresponding selection shape.
     *
     * @param structureId {Number} - the unique id of the structure the atom
     * belongs to
     * @param atomId {Number} - the unique id of the atom to select
     * @param color {String} - valid CSS color
     */
    recolorAtomSelector(structureId, atomId, color) {
        const atomSels = this.atomToSelMap[structureId].atomSels[atomId];
        this.utils.selector.switchTextLabelSelectorColor(atomSels, color);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Changes the color of an atom's representation.
     *
     * @param structureId {Number} - the unique id of the structure the atom
     * belongs to
     * @param atomId {Number} - the unique id of the atom to recolor
     * @param color {String} - CSS color to use as new color
     */
    recolorAtom(structureId, atomId, color) {
        const atomGroupDom = this.atomToSelMap[structureId].atomSels[atomId].atomSel.node();
        atomGroupDom.childNodes.forEach(child => {
            child.style.fill = color;
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * As part of creation of the representation of an atom within the SVG,
     * places hydrogen text to a specified side of the main text
     *
     * @param structureId {Number} - id of structure the atom belongs to
     * @param atom {Atom} - the Atom object to represent, containing
     * information on orientation of attached hydrogen
     * @param byTemp {Boolean} - whether to use temporary values for
     * hydrogen orientation
     */
    placeHByOrientation(structureId, atom, byTemp) {
        const placementInfo = this.getPlacementInfo(structureId, atom.id);
        if (!placementInfo) {
            return;
        }
        const orientationParam = byTemp ? 'tempHydrogenOrientation' : 'hydrogenOrientation';
        switch (atom[orientationParam]) {
            case 'left':
                this.placeHLeft(placementInfo);
                break;
            case 'right':
                this.placeHRight(placementInfo);
                break;
            case 'up':
                this.placeHUpDown(placementInfo, true);
                break;
            case 'down':
                this.placeHUpDown(placementInfo, false);
                break;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Part of hydrogen placement. Places hydrogen text to the left of the main
     * atom text.
     *
     * @param atomText {Object} - bbox information for the main atom text
     * @param hText {Object} - bbox information for the hydrogen text
     * @param hNumberText {Object} - bbox information for the small number
     * text as subscript of hydrogen text
     */
    placeHLeft({atomText, hText, hNumberText}) {
        let hNrX = atomText.x;
        if (hNumberText.exists) {
            const hNumberWidth = hNumberText.width;
            hNrX -= hNumberWidth;
            hNumberText.sel.attr('x', hNrX)
                .attr('dy', this.opts.hNumberOffset);
            hNumberText.x = hNrX;
        }
        const hX = hNrX - hText.width;
        hText.sel.attr('x', hX).attr('dy', 0);
        hText.x = hX;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Part of hydrogen placement. Places hydrogen text to the right of the main
     * atom text.
     *
     * @param atomText {Object} - bbox information for the main atom text
     * @param chargeText {Object} - bbox information for the charge text
     * @param hText {Object} - bbox information for the hydrogen text
     * @param hNumberText {Object} - bbox information for the small number
     * text as subscript of hydrogen text
     */
    placeHRight({atomText, chargeText, hText, hNumberText}) {
        let hX = atomText.x + atomText.width;
        if (chargeText.exists) {
            const chargeRight = chargeText.x + chargeText.width;
            if (chargeRight > hX) {
                hX = chargeRight;
            }
        }
        hText.sel.attr('x', hX).attr('dy', 0);
        hText.x = hX;
        if (hNumberText.exists) {
            const hNrX = hX + hText.width;
            hNumberText.sel.attr('x', hNrX)
                .attr('dy', this.opts.hNumberOffset);
            hNumberText.x = hNrX;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Part of hydrogen placement. Places hydrogen text above or below the main atom
     * text.
     *
     * @param atomText {Object} - bbox information for the main atom text
     * @param hText {Object} - bbox information for the hydrogen text
     * @param hNumberText {Object} - bbox information for the small number
     * text as subscript of hydrogen text
     * @param up {Boolean} - set to true if H shall be placed above the atom
     */
    placeHUpDown({atomText, hText, hNumberText}, up) {
        const xSizeOffset = (atomText.width - hText.width) / 2;
        let hDy = this.opts.textSize - this.opts.textCrop + this.opts.hOffset;
        if (up) {
            hDy = hDy * -1;
        }
        const hX = atomText.x + xSizeOffset;
        hText.sel.attr('x', hX)
            .attr('dy', hDy);
        hText.x = hX;

        if (hNumberText.exists) {
            const hNrX = hText.x + hText.width;
            hNumberText.sel.attr('x', hNrX)
                .attr('dy', this.opts.hNumberOffset + hDy);
            hNumberText.x = hNrX;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * (Re-)Anchors the draw elements of an Atom object representing an amino
     * acid label. This is done by moving the anchored side on top of the
     * labels current (temporary) position. If the label has been anchored
     * before, the prevOrientation parameter is used to specify the previous
     * anchoring and tells the drawer to undo that first.
     *
     * @param structureId {Number} - unique id of the structure the atom
     * belongs to
     * @param atomId {Number} - unique id of the Atom
     * @param coords {Object} - x- and y-coordinates of the atom
     * @param labelOrientation {String} - 'left', 'right', 'up', or 'down'
     * @param prevOrientation {String} - 'left', 'right', 'up', or 'down'
     */
    anchorAtomLabel(structureId, {
        id: atomId, tempCoordinates: coords, tempLabelOrientation: labelOrientation
    }, prevOrientation) {
        const selMap = this.atomToSelMap[structureId].atomSels[atomId];
        const offsets = {
            x: 0, y: 0
        };
        let width, height;
        selMap.selectorShapes.forEach(selShape => {
            if (selShape.type !== 'line') return;
            //line sel shape better approximation for text than bbox, but only
            //works properly if only one line sel shape exists
            ({height, width} = selShape);
        });
        const horizontalAnchor = width / 2 + this.opts.atomRadius - this.opts.labelSideCorrection;
        const verticalAnchor = height / 2;
        const anchorOffsets = {
            'left': {x: horizontalAnchor},
            'right': {x: -horizontalAnchor},
            'up': {y: verticalAnchor},
            'down': {y: -verticalAnchor}
        };
        const addOffset = (orientation, reverse) => {
            let {x, y} = anchorOffsets[orientation];
            if (x) {
                if (reverse) x = -x;
                offsets.x += x;
            }
            if (y) {
                if (reverse) y = -y;
                offsets.y += y;
            }
        };
        if (prevOrientation) addOffset(prevOrientation, true);
        addOffset(labelOrientation, false);
        this.moveAtom(structureId, atomId, offsets);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Retrieves the saved bbox draw limits of all text elements making up the
     * representation of an atom.
     *
     * @param structureId {Number} - the unique id of the structure the atom
     * belongs to
     * @param atom {Atom} - Atom object to request limits for
     * @returns {Array} - array of objects detailing draw limits
     */
    getAtomDrawLimits(structureId, atom) {
        const placementInfo = this.getPlacementInfo(structureId, atom.id);

        //if no atom text then there is no other text either
        if (!placementInfo.atomText.exists) {
            const coords = atom.tempCoordinates;
            return [
                {
                    type: 'atomPoint', limits: {
                        xMin: coords.x, xMax: coords.x, yMin: coords.y, yMax: coords.y
                    }
                }
            ];
        }
        const structureSel = this.atomToSelMap[structureId].structureSel;
        const display = structureSel.style('display') !== 'none';
        if (!display) {
            structureSel.style('display', null);
        }
        const drawLimits = [];
        for (const textType in placementInfo) {
            const textElement = placementInfo[textType];
            if (!textElement.exists) {
                continue;
            }
            drawLimits.push({
                type: textType, limits: BaseUtils.convertBBoxToMaxes(textElement.sel.node()
                    .getBBox())
            });
        }
        if (!display) {
            structureSel.style('display', 'none');
        }
        return drawLimits;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Retrieves information on the selector shapes (currently just the one
     * circle) created for an atom.
     *
     * @param structureId {Number} - the unique id of the structure the atom
     * belongs to
     * @param atomId {Number} - the unique id of the atom
     * @returns {Array} - array of objects describing the selector shapes
     */
    getAtomSelShapes(structureId, atomId) {
        return this.atomToSelMap[structureId].atomSels[atomId].selectorShapes;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Retrieves placement information for an atom (bbox information of the
     * different text elements created for this atom).
     *
     * @param structureId {Number} - the unique id of the structure the atom
     * belongs to
     * @param atomId {Number} - the unique id of the atom
     * @returns {Object} - placement information
     */
    getPlacementInfo(structureId, atomId) {
        return this.atomToSelMap[structureId].atomSels[atomId].placementInfo;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Shows/hides atoms by changing the corresponding display
     * properties of the svg elements. Also hides the selectors.
     *
     * @param full {Boolean} - set visibility of all atoms
     * @param atoms {Boolean} - toggles the visibility if set true
     * @param structureId {Number} - id of structure to show/hide atoms from
     * @param visibilityClass {String} - CSS class for show/hide
     */
    setVisibility(full, atoms, structureId, visibilityClass) {
        if ((full || atoms) && this.atomToSelMap.hasOwnProperty(structureId)) {
            const atomToSelMap = this.atomToSelMap[structureId];
            atomToSelMap.structureSel.classed(visibilityClass, true);
            atomToSelMap.selectorSel.classed(visibilityClass, true);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a (new) structure, adds new container groups to the svg for atoms.
     * Creates a new wrapper in the atom group. Further
     * prepares the mapping of selectors for later access. In the selector
     * map, the created groups are mapped also, so they may be hidden later.
     *
     * @param structure {Structure} - Structure object
     * @param structureId {structureId} - id of Structure object
     * @param debug {Boolean} - true if debug information shall be visualized
     */
    addAtomsToTrack(structure, structureId, debug) {
        //create fitting ids for newly created SVG elements
        const movementGroupIDs = {
            idGroup: this.svgId + '_s_' + structureId + '_a',
            idSelGroup: this.svgId + '_s_' + structureId + '_aS',
            idDbgGroup: this.svgId + '_s_' + structureId + '_dbgAtoms'
        };
        const movementGroupsDom = GroupUtils.addGroupsForMovement(this.atomGroupDom,
            this.atomSelGroupDom,
            this.atomDbgGroupDom,
            movementGroupIDs,
            debug
        );
        //creation of more complicated atom maps
        const atomToSelMap = {
            structureSel: movementGroupsDom.movGroupDom, //to quickly access/remove all atoms
            selectorSel: movementGroupsDom.movSelGroupDom, atomSels: {}, //individual cts for one
                                                                         // atom
            debugSel: movementGroupsDom.movDbgGroupDom //dbg group selector
        };
        //add move groups for rings to optimize movement in ring move mode
        const atomRingMap = {};
        for (const bccId in structure.ringsData.ringSystems) {
            const ringMovementGroupIDs = {
                idGroup: this.svgId + '_s_' + structureId + '_rs_' + bccId + '_a',
                idSelGroup: this.svgId + '_s_' + structureId + '_rs_' + bccId + '_aS',
                idDbgGroup: this.svgId + '_s_' + structureId + '_rs_' + bccId + '_dbg'
            };
            const ringMovementGroupsDom = GroupUtils.addGroupsForMovement(movementGroupsDom.movGroupDom,
                movementGroupsDom.movSelGroupDom,
                movementGroupsDom.movDbgGroupDom,
                ringMovementGroupIDs,
                debug
            );
            atomRingMap[bccId] = {
                structureSel: ringMovementGroupsDom.movGroupDom,
                selectorSel: ringMovementGroupsDom.movSelGroupDom,
                debugSel: ringMovementGroupsDom.movDbgGroupDom
            };
        }
        atomToSelMap.ringSysSels = atomRingMap;
        this.atomToSelMap[structureId] = atomToSelMap;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Hides all text representations of debug labels. Otherwise, display all
     * text representations of debug labels, provided parameters
     * to ever show specific debug elements are set in the configuration.
     *
     * @param visible {Boolean} - true if debug labels shall be visible
     */
    toggleDebugLabelsVisibility(visible) {
        let display = 'none';
        if (visible) {
            display = null;
        }
        if (this.opts.debug.atoms && !this.opts.debug.showAtoms) {
            for (const structureSel of Object.values(this.atomToSelMap)) {
                for (const atomSel of Object.values(structureSel.atomSels)) {
                    atomSel.debugSel.style('display', display);
                }
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * For a previously removed structure, puts its detached atom DOM elements back
     * into previous positions.
     *
     * @param structureId {Number} - id of structure to add back
     */
    redrawStructureAtoms(structureId) {
        this.atomGroupDom.node().appendChild(this.atomToSelMap[structureId].structureSel.node());
        this.atomSelGroupDom.node().appendChild(this.atomToSelMap[structureId].selectorSel.node());
        if (this.atomToSelMap[structureId].debugSel) {
            this.atomDbgGroupDom.node().appendChild(this.atomToSelMap[structureId].debugSel.node());
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes all atoms of a structure from the DOM.
     *
     * @param structureId {Number} - the unique id of the structure to remove
     * its atoms from the DOM
     */
    removeStructureAtomsFromDOM(structureId) {
        this.atomToSelMap[structureId].structureSel.remove();
        this.atomToSelMap[structureId].selectorSel.remove();
        if (this.atomToSelMap[structureId].debugSel) {
            this.atomToSelMap[structureId].debugSel.remove();
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Remove all cached information for a given structure (by its id).
     *
     * @param structureId {Number} - id of structure to remove atom information
     * from.
     */
    purgeStructureAtomsFromCache(structureId) {
        delete this.atomToSelMap[structureId];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets translations made for atoms of a certain ring system.
     *
     * @param structureId {Number} - id of structure containing the ring
     * system
     * @param ringSysId {Number} - id of ring systems to reset translations
     * for
     */
    resetRingAtomSkeletonTranslation(structureId, ringSysId) {
        const atomSels = this.atomToSelMap[structureId].ringSysSels[ringSysId];
        SelectorUtils.resetTransformOnSelectors(atomSels);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets translations made for atoms of a certain structure.
     *
     * @param structureId {Number} - id of structure to reset translations for
     */
    resetAtomSkeletonTranslation(structureId) {
        SelectorUtils.resetTransformOnSelectors(this.atomToSelMap[structureId]);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves structural skeleton (atoms as groups) by specified offsets.
     *
     * @param structureId {Number} - id of structure to move skeleton of
     * @param xOffset {Number} - offset to move structure by in x-direction
     * @param yOffset {Number} - offset to move structure by in y-direction
     */
    moveAtomSkeleton(structureId, xOffset, yOffset) {
        const atomSels = this.atomToSelMap[structureId];
        this.utils.selector.moveSelectorsOfSkeleton(atomSels, xOffset, yOffset, 'atom');
    }

    /*----------------------------------------------------------------------*/

    /**
     * Moves structural skeleton (atoms as groups) of a ring system by specified
     * offsets.
     *
     * @param structureId {Number} - id of structure containing the ring
     * system
     * @param ringSysId {Number} - id of ring systems to move skeleton of
     * @param xOffset {Number} - offset to move ring system by in x-direction
     * @param yOffset {Number} - offset to move ring system by in y-direction
     */
    moveRingAtomSkeleton(structureId, ringSysId, xOffset, yOffset) {
        const atomSels = this.atomToSelMap[structureId].ringSysSels[ringSysId];
        this.utils.selector.moveSelectorsOfSkeleton(atomSels, xOffset, yOffset, 'atom');
    }
}