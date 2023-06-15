/**
 * Draw layer of the InteractionDrawer. Creates and manipulates the required DOM elements
 * in the DOM's inline SVG via inner components.
 */
class SvgComponent {
    /**
     * Contains D3 selector of the SVG and sets up the different draw layer(s) creating inner
     * components with outer SVG groups in the SVG draw area for different structural elements.
     *
     * @param opts {Object} - configuration parameters
     * @param svgDom {Object} - D3 selector of the SVG
     * @param svgId {String} - DOM id of the SVG
     */
    constructor(opts, svgDom, svgId) {
        this.opts = opts;
        //main element to draw in / add elements to
        this.svgDom = svgDom;
        this.svgId = svgId; //unique id necessary if multiple drawers on one page

        this.utils = new SvgUtils(this.opts);

        const backgroundDom = this.appendBackgroundRect();
        this.backgroundComponent = new BackgroundComponent(this.utils, backgroundDom);

        //gradients go in defs element
        const defsDom = this.svgDom.append('defs');
        this.defsComponent = new DefsComponent(this.utils, defsDom);

        const selectionLineDom = this.appendSelectionLine();
        this.selectionLineComponent = new SelectionLineComponent(selectionLineDom);

        const transformGroupsDom = this.appendTransformGroup();
        this.transformGroupsComponent = new TransformGroupsComponent(this.opts,
            this.utils,
            transformGroupsDom,
            this.defsComponent,
            this.svgId
        );

        //create svg groups for draw elements in order defined in configuration
        const svgElementOrder = this.opts.svgElementOrder;
        this.transformGroupsComponent.noteElementOrderInformation(svgElementOrder);
        this.transformGroupsComponent.appendPermanentGroups(svgElementOrder);
        this.transformGroupsComponent.appendTemporaryGroups();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Draws a background rectangle before everything else.
     */
    appendBackgroundRect() {
        return this.svgDom.append('rect')
            .attr('id', this.svgId + '_background')
            .style('width', '100%')
            .style('height', '100%')
            .style('fill', this.opts.colors.BACKGROUND);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Draws selector before the atoms/edges and outside transform group.
     */
    appendSelectionLine() {
        return this.svgDom.append('path')
            .attr('id', this.svgId + '_selector')
            .style('fill', this.opts.colors.multiSelectionToolFill)
            .style('stroke', this.opts.colors.multiSelectionToolBorder)
            .style('stroke-dasharray', this.opts.selectorDashArray + 'px')
            .style('stroke-width', this.opts.selectorDashWidth + 'px');
    }

    /*----------------------------------------------------------------------*/

    /**
     * Appends groups to svg for the different visualization elements. Order
     * of adding determines draw order.
     */
    appendTransformGroup() {
        return this.svgDom.append('g')
            .attr('id', this.svgId + '_view')
            .style('user-select', 'none')
            .style('-ms-user-select', 'none');
    }

    /*----------------------------------------------------------------------*/

    /**
     * Infers the necessary information about the draw area to base Drawer and
     * SvgDrawer functionality on.
     *
     * @returns {Object} - key information about the draw area
     */
    getDrawAreaInfo() {
        const drawArea = document.getElementById(this.svgId);
        const boundingRect = drawArea.getBoundingClientRect();
        return {
            type: drawArea.tagName,
            id: this.svgId,
            width: boundingRect.width,
            height: boundingRect.height,
            border: parseInt(getComputedStyle(drawArea)
                .getPropertyValue('border-width')),
            start: {
                x: boundingRect.x, y: boundingRect.y
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Serializes the inline browser SVG of the draw area, trim unnecessary
     * parts, then returns the resulting string.
     *
     * @returns {String} - serialized string in XML format containing inline
     * browser SVG information
     */
    getSvgData() {
        //remove all selectors that are not selected (or hovered) + cursor info
        return new XMLSerializer().serializeToString(this.svgDom.node())
            .replace(/<(?:line|circle).*?_selector.*?opacity: 0;/ + /.*?\/(?:line|circle)?>/g, '')
            .replace(/cursor: .*?;/, '');
    }
}