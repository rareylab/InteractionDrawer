/**
 * This component manages the SVG transform group, which contains and layers in a certain order
 * most of the other components(with SVG groups), e.g. components for atoms or the mirror line
 * visualization. Debug layers are available. Debug labels (e.g. atom ids) are drawn on these layers
 * if the respective config option is set.
 */
class TransformGroupsComponent {
    /**
     * Contains all relevant D3 selectors and instances for configuration options and drawing utils.
     * Creates containers for the order of SVG groups based on the drawer's configuration.
     *
     * @param opts {Object} - configuration parameters
     * @param utils {Object} - by components commonly used generic functions for drawing
     * @param transformGroupDom {Object} - D3 selector of the transform group
     * @param defsComponent {Object} - D3 selector of the defs element (for gradients)
     * @param svgId {String} - DOM id of the SVG
     */
    constructor(opts, utils, transformGroupDom, defsComponent, svgId) {
        this.opts = opts;
        this.utils = utils;
        this.transformGroupDom = transformGroupDom;
        this.defsComponent = defsComponent;
        this.svgId = svgId;
        this.firstElementAfterSceneGroups = this.svgId + '_interactionElements';
        if (this.opts.allowInteraction) {
            this.transformGroupDom.style('cursor', 'pointer');
        }
        //denote the order of draw element groups in the SVG transform group
        //type of the SVG group -> index
        this.svgElementPositions = {};
        //index -> {exists: ..., id: ...}
        this.svgPositionsToElements = {};
    }

    /*----------------------------------------------------------------------*/

    /**
     * Appends all always present SVG groups to the SVG transform group based
     * on a given group order.
     *
     * @param svgElementOrder {Array} - order of SVG group elements based on
     * associated identifiers
     */
    appendPermanentGroups(svgElementOrder) {
        let atomGroupDom = '';
        let atomSelGroupDom = '';
        let atomDbgGroupDom = '';
        let edgeGroupDom = '';
        let edgeSelGroupDom = '';
        let edgeDbgGroupDom = '';
        let structureCircleGroupDom = '';
        let structureCircleSelGroupDom = '';
        let annotationGroupDom = '';
        let annotationSelGroupDom = '';
        svgElementOrder.forEach(identifier => {
            switch (identifier) {
                case 'bondSelectors':
                    edgeSelGroupDom = this.appendBasicGroup(identifier);
                    edgeSelGroupDom.style('stroke-linecap', 'round')
                        .style('stroke-linejoin', 'round');
                    break;
                case 'atomSelectors':
                    atomSelGroupDom = this.appendBasicGroup(identifier);
                    break;
                case 'annotationSelectors':
                    annotationSelGroupDom = this.appendBasicGroup(identifier);
                    break;
                case 'structureCirclesSelectors':
                    structureCircleSelGroupDom = this.appendBasicGroup(identifier);
                    break;
                case 'bonds':
                    edgeGroupDom = this.appendBasicGroup(identifier);
                    const color = this.opts.colors.DEFAULT;
                    edgeGroupDom.style('stroke', color)
                        .style('fill', color)
                        .style('stroke-linecap', 'round')
                        .style('stroke-linejoin', 'round');
                    break;
                case 'atoms':
                    atomGroupDom = this.appendBasicGroup(identifier);
                    break;
                case 'annotations':
                    annotationGroupDom = this.appendBasicGroup(identifier);
                    break;
                case 'structureCircles':
                    structureCircleGroupDom = this.appendBasicGroup(identifier);
                    break;
                case 'bondDebugTexts':
                    if (this.opts.debug.edges) {
                        edgeDbgGroupDom = this.appendBasicGroup(identifier);
                        edgeDbgGroupDom.style('fill', 'red')
                            .style('font-size', this.opts.debug.textSize + 'px')
                            .style('text-anchor', 'middle');
                    }
                    break;
                case 'atomDebugTexts':
                    if (this.opts.debug.atoms) {
                        atomDbgGroupDom = this.appendBasicGroup(identifier);
                        atomDbgGroupDom.style('fill', 'darkmagenta')
                            .style('font-size', this.opts.debug.textSize + 'px')
                            .style('font-family', this.opts.fontFamily)
                            .style('text-anchor', 'middle');
                    }
                    break;
            }
        });
        const hydrophobicGroupDom = this.insertHydrophobicGroupAtCorrectPosition();
        const hydrophobicSelGroupDom = this.insertHydrophobicSelectorGroupAtCorrectPosition();
        const distanceGroupDom = this.insertIntermolecularGroupAtCorrectPosition('distances');
        const interactionGroupDom = this.insertIntermolecularGroupAtCorrectPosition('interactions');
        const cationpiGroupDom = this.insertIntermolecularGroupAtCorrectPosition('cationPiStackings');
        const pipiGroupDom = this.insertIntermolecularGroupAtCorrectPosition('piStackings');
        const atomPairInteractionGroupDom = this.insertIntermolecularGroupAtCorrectPosition(
            'atomPairInteractions');
        const distanceSelGroupDom = this.insertIntermolecularGroupAtCorrectPosition(
            'distancesSelectors');
        const interactionSelGroupDom = this.insertIntermolecularGroupAtCorrectPosition(
            'interactionsSelectors');
        const cationpiSelGroupDom = this.insertIntermolecularSelectorsGroupAtCorrectPosition(
            'cationPiStackingsSelectors');
        const pipiSelGroupDom = this.insertIntermolecularSelectorsGroupAtCorrectPosition(
            'piStackingsSelectors');
        const atomPairInteractionSelGroupDom = this.insertIntermolecularSelectorsGroupAtCorrectPosition(
            'atomPairInteractionsSelectors');
        this.atomGroupsComponent = new AtomGroupsComponent(this.opts,
            this.utils,
            atomGroupDom,
            atomSelGroupDom,
            atomDbgGroupDom,
            this.svgId
        );
        this.edgeGroupsComponent = new EdgeGroupsComponent(this.opts,
            this.utils,
            edgeGroupDom,
            edgeSelGroupDom,
            edgeDbgGroupDom,
            this.defsComponent,
            this.svgId
        );
        this.structureCircleGroupsComponent = new StructureCircleGroupsComponent(this.opts,
            this.utils,
            structureCircleGroupDom,
            structureCircleSelGroupDom,
            this.svgId
        );
        this.annotationGroupsComponent = new AnnotationGroupsComponent(this.opts,
            this.utils,
            annotationGroupDom,
            annotationSelGroupDom
        );
        this.hydrophobicGroupsComponent = new HydrophobicGroupsComponent(this.opts,
            this.utils,
            hydrophobicGroupDom,
            hydrophobicSelGroupDom
        );
        this.intermolecularGroupsComponent = new IntermolecularGroupsComponent(this.opts,
            this.utils,
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
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Appends a SVG group to contain certain elements to the SVG transform
     * group.
     *
     * @param identifier {String} - type of the added SVG group
     */
    appendBasicGroup(identifier) {
        const id = this.svgId + '_' + identifier;
        const groupDom = this.transformGroupDom.append('g').attr('id', id);
        this.addSVGPositionEntry(identifier, id);
        return groupDom;
    }

    /*----------------------------------------------------------------------*/

    /**
     * When first adding hydrophobic contacts, inserts the SVG group to contain
     * all elements representing such interactions into the ring position
     * inside the SVG transform group based on the defined group order in the
     * configuration and apply intended styling.
     */
    insertHydrophobicGroupAtCorrectPosition() {
        const identifier = 'hydrophobicContacts';
        const id = this.svgId + '_hydrophobicContacts';
        const hydrophobicGroupDom = this.insertGroupAtCorrectPosition(identifier);
        hydrophobicGroupDom.attr('id', id)
            .style('fill', 'none')
            .style('stroke-linecap', 'round');
        this.addSVGPositionEntry(identifier, id);
        return hydrophobicGroupDom;
    }

    /*----------------------------------------------------------------------*/

    /**
     * When first adding hydrophobic contacts, inserts the SVG group to contain
     * all elements representing selection shapes used for these contacts
     * inside the SVG transform group based on the defined group order in the
     * configuration.
     */
    insertHydrophobicSelectorGroupAtCorrectPosition() {
        const identifier = 'hydrophobicContactSelectors';
        const id = this.svgId + '_hydrophobicSels';
        const hydrophobicSelGroupDom = this.insertGroupAtCorrectPosition(identifier);
        hydrophobicSelGroupDom.attr('id', id);
        this.addSVGPositionEntry(identifier, id);
        return hydrophobicSelGroupDom;
    }

    /*----------------------------------------------------------------------*/

    /**
     * When first adding intermolecular interactions, inserts the SVG group
     * to contain all elements representing such interactions into the right
     * position inside the SVG transform group based on the defined group order
     * in the configuration and apply intended styling.
     *
     * @param identifier {String} - type of the added SVG group
     */
    insertIntermolecularGroupAtCorrectPosition(identifier) {
        const id = this.svgId + '_' + identifier;
        const intermolecularGroup = this.insertGroupAtCorrectPosition(identifier);
        intermolecularGroup.attr('id', id);
        this.addSVGPositionEntry(identifier, id);
        return intermolecularGroup;
    }

    /*----------------------------------------------------------------------*/

    /**
     * When first adding intermolecular interactions, inserts the SVG group
     * to contain all elements representing the selection elements of such
     * interactions into the right position inside the SVG transform group
     * based on the defined group order in the configuration and apply
     * intended styling.
     *
     * @param identifier {String} - type of the added SVG group
     */
    insertIntermolecularSelectorsGroupAtCorrectPosition(identifier) {
        const id = this.svgId + '_' + identifier;
        const intermolecularSelGroup = this.insertGroupAtCorrectPosition(identifier);
        intermolecularSelGroup.attr('id', id)
            .style('stroke-linecap', 'round')
            .style('stroke-linejoin', 'round');
        this.addSVGPositionEntry(identifier, id);
        return intermolecularSelGroup;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Appends container for interaction elements, e.g. mirror line
     */
    appendTemporaryGroups() {
        const interactionElementsGroupDom = GroupUtils.addGroupToSvg(this.transformGroupDom,
            this.firstElementAfterSceneGroups
        );
        this.interactionElementsGroupComponent = new InteractionElementsGroupComponent(this.opts,
            this.utils,
            interactionElementsGroupDom,
            this.svgId
        );
        this.interactionElementsGroupComponent.appendInteractionElements();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Marks that an SVG group given by identifier and DOM id has been added
     * inside the SVG transform group in this.svgPositionsToElements.
     *
     * @param identifier {String} - type of the added SVG group
     * @param idString {String} - DOM id of the added SVG group
     */
    addSVGPositionEntry(identifier, idString) {
        const position = this.svgElementPositions[identifier];
        this.svgPositionsToElements[position] = {
            exists: true, id: idString
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets the 'cursor' style on the group containing all relevant draw
     * elements of the scene.
     *
     * @param val {String} - the 'cursor' style to use
     */
    setTransformGroupPointer(val) {
        this.transformGroupDom.style('cursor', val);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates container elements to denote the order of draw element groups in
     * the SVG transform group based on the drawer's configuration.
     *
     * @param svgElementOrder {Array} - string identifiers denoting the order
     * of draw elements (earlier ones to appear behind later ones)
     */
    noteElementOrderInformation(svgElementOrder) {
        svgElementOrder.forEach((identifier, i) => {
            this.svgElementPositions[identifier] = i;
            this.svgPositionsToElements[i] = {
                exists: false, id: undefined
            }
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Applies transformation to the entire scene by applying transform attribute
     * to the transform group.
     *
     * @param scale {Number} - scale to use for transform
     * @param xOffset {Number} - x-parameter for translation part of transform
     * attribute
     * @param yOffset {Number} - y-parameter for translation part of transform
     * attribute
     */
    applyTransform({scale, translate: {x: xOffset, y: yOffset}}) {
        this.transformGroupDom.attr('transform',
            `scale(${this.utils.base.round(scale)}) ` +
            `translate(${this.utils.base.round(xOffset)} ${this.utils.base.round(yOffset)})`
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Dynamically insert a blank SVG group element inside the SVG transform
     * group based on the position of a given identifier in the SVG group order
     * in the configuration.
     *
     * @param identifier {String} - type of the added SVG group
     * @returns {Object} - D3 selector of the added blank SVG group
     */
    insertGroupAtCorrectPosition(identifier) {
        const transformGroupDom = this.transformGroupDom;
        const nextGroupId = this.findSVGGroupToInsertBefore(identifier);
        return transformGroupDom.insert('g', '#' + nextGroupId);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds the DOM id of the first existing SVG group that is higher in the
     * order of positions defined in the configuration compared to a group to
     * insert given by its identifier. If none is found, returns the id of the
     * SVG element after all element SVG groups.
     *
     * @param identifier {String} - type of the SVG group to add
     * @return {String} - DOM id of the SVG group with higher position
     */
    findSVGGroupToInsertBefore(identifier) {
        let nextGroupId;
        const svgPosInfo = this.svgPositionsToElements;
        const position = this.svgElementPositions[identifier];
        let nextPos = position + 1;
        while (svgPosInfo.hasOwnProperty(nextPos)) {
            const {exists, id} = svgPosInfo[nextPos];
            if (exists) {
                nextGroupId = id;
                break;
            }
            nextPos++;
        }
        if (!nextGroupId) {
            nextGroupId = this.firstElementAfterSceneGroups;
        }
        return nextGroupId;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Updates display and cursor css property based on html classes
     * ia-drawer-hide-elem and ia-drawer-show-elem. Note that those classes
     * will be removed from the html element.
     */
    updateVisibility() {
        this.transformGroupDom.selectAll(".ia-drawer-hide-elem")
            .classed("ia-drawer-hide-elem", false)
            .style('cursor', "auto")
            .style('display', "none");
        this.transformGroupDom.selectAll(".ia-drawer-show-elem")
            .classed("ia-drawer-show-elem", false)
            .style('cursor', null)
            .style('display', null);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Calculates the height and width (by BBox) of a svg text element.
     *
     * @param text {String} - text of the text element. Can be omitted if only
     * the height is of interest
     * @return {Object} - key "height" and "width" with values taken from
     * getBBox()
     */
    getTextDimensions(text = "Test") {
        const test = this.transformGroupDom.append('text')
            .attr('font-size', this.opts.textSize)
            .style('font-family', this.opts.fontFamily)
            .text(text);
        const {width, height} = test.node().getBBox();
        test.remove();
        return {
            width: width, height: height
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Different layout algorithms produce output in differently scaled
     * coordinate systems. For coordinate systems with very small distances
     * between atoms, text sizes have to be chosen to also be just as small.
     * The SVG drawing layer can of course render this, but getting bounding
     * boxes gets heavily rounded / inaccurate results, leading to incorrect
     * placements. As such, apply a heuristic: scale to a size that is known
     * to yield good drawings, draw, then scale back. This function gives the
     * scale to at least apply to draw well, given by drawing the slimmest
     * possible label ('I' for Iodine). The value for this 'smallest bbox
     * width' was tried out to be sufficient, but may also be scaled back if
     * ever performance gets negatively influenced by this approach.
     */
    suggestDrawScaling() {
        const suggestion = {
            rescale: false, scale: undefined
        };
        const test = this.transformGroupDom.append('text')
            .attr('font-size', this.opts.textSize)
            .style('font-family', this.opts.fontFamily)
            .text('I');
        const width = test.node().getBoundingClientRect().width;
        if (width === 0) {
            test.remove();
            return suggestion;
        } //sanity check
        //heuristic parameter to guess good draw environment (such that atom
        //labels are placed correctly)
        const smallestAllowedWidth = this.opts.smallestBboxWidth;
        if (width < smallestAllowedWidth) {
            suggestion.rescale = true;
            suggestion.scale = smallestAllowedWidth / width;
        }
        test.remove();
        return suggestion;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Shows parts of a structure or the full structure by changing the
     * corresponding display properties of the svg elements. Also hides the
     * selectors. If you hide this structure completely make sure to mark
     * the structure as hidden.
     *
     * @param structureId {Number} - id of structure to show
     * @param parts {Object} - which parts of the structure to show/hide. Parts can
     * contain "full, atoms, bonds, structureCircle, hydrophobic, atomPairInteractions,
     * piStackings, cationPiStackings, label" as keys and true (show) or false
     * (do not change visibility) as values.
     * @param hiddenStructures {Array} - ids of structures which are currently
     * completely hidden in the draw area. Those are used to identify whether to
     * show/hide interactions to other structures. Can be omitted if parts only
     * containing atoms, bonds, structureCircle, labels and/or hydrophobic.
     * @param show {Boolean} - set true if structure parts shall be shown otherwise false
     */
    showHideStructureParts(structureId, {
        full,
        atoms,
        bonds,
        structureCircle,
        hydrophobic,
        atomPairInteractions,
        piStackings,
        cationPiStackings,
        label
    }, hiddenStructures = [], show) {
        let visibilityClass = 'ia-drawer-hide-elem';
        if (show) {
            hiddenStructures = hiddenStructures.filter(id => {
                return id !== structureId;
            });
            visibilityClass = 'ia-drawer-show-elem';
        }
        this.atomGroupsComponent.setVisibility(full, atoms, structureId, visibilityClass);
        this.edgeGroupsComponent.setVisibility(full, bonds, structureId, visibilityClass);
        this.structureCircleGroupsComponent.setVisibility(full,
            structureCircle,
            structureId,
            visibilityClass
        );
        this.hydrophobicGroupsComponent.setVisibility(full,
            hydrophobic,
            structureId,
            visibilityClass
        );
        this.intermolecularGroupsComponent.setVisibility(full,
            atomPairInteractions,
            structureId,
            visibilityClass,
            hiddenStructures,
            'atomPairInteractions'
        );
        this.intermolecularGroupsComponent.setVisibility(full,
            piStackings,
            structureId,
            visibilityClass,
            hiddenStructures,
            'cationPiStackings'
        );
        this.intermolecularGroupsComponent.setVisibility(full,
            cationPiStackings,
            structureId,
            visibilityClass,
            hiddenStructures,
            'piStackings'
        );
        this.annotationGroupsComponent.setVisibility(full, label, structureId, visibilityClass);
        this.updateVisibility();
    }
}
