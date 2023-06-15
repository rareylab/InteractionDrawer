/**
 * By components commonly used functions for the drawing of SVG groups.
 */
class GroupUtils {
    /**
     * Contains an instance for configuration options.
     *
     * @param opts {Object} - configuration parameters
     */
    constructor(opts) {
        this.opts = opts;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Removes all children from a given SVG group element.
     *
     * @param wrapper {Object} - D3 selector for the group to clean
     */
    static clearWrapper(wrapper) {
        const wrapperNode = wrapper.node();
        while (wrapperNode.firstChild) {
            wrapperNode.removeChild(wrapperNode.firstChild);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Attaches a group element to the SVG as a child of a given parent element.
     *
     * @param domParent {Object} - D3 selector for the parent element
     * @param id {String} - unique id to be used in the browser
     * @param styles {Object} - properties matched to style values
     * @returns {Object} - D3 selector for the group
     */
    static addGroupToSvg(domParent, id, styles = {}) {
        const g = domParent.append('g');
        if (id) {
            g.attr('id', id);
        }
        for (const style in styles) {
            g.style(style, styles[style]);
        }
        return g;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Marks a group as likely to transform, which can bring a performance boost
     * during interaction.
     *
     * @param groupSel {Object} - D3 selector for the group element
     */
    static markGroupAsTransform(groupSel) {
        groupSel.classed('transform', true);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates new SVG groups using fitting ids for newly created SVG elements
     * for movement via composite layers, optimize movement by marking them as
     * ready to transform
     */
    static addGroupsForMovement(group, selGroup, dbgGroup, movementGroupIDs, debug) {
        const movGroupDom = GroupUtils.addGroupToSvg(group, movementGroupIDs.idGroup);
        GroupUtils.markGroupAsTransform(movGroupDom);
        const movSelGroupDom = GroupUtils.addGroupToSvg(selGroup, movementGroupIDs.idSelGroup);
        GroupUtils.markGroupAsTransform(movSelGroupDom);

        let movDbgGroupDom;

        if (debug) {
            movDbgGroupDom = GroupUtils.addGroupToSvg(dbgGroup, movementGroupIDs.idDbgGroup);
            GroupUtils.markGroupAsTransform(movDbgGroupDom);
        }
        return {
            movGroupDom: movGroupDom, movSelGroupDom: movSelGroupDom, movDbgGroupDom: movDbgGroupDom
        };
    }
}