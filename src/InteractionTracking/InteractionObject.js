/**
 * Class to keep track of elements affected by the different interaction modes
 * available for the InteractionDrawer.
 */
class InteractionObject {
    /**
     * Sets up the different containers for information tracking for the
     * different interaction modes.
     *
     * @param moveGrace {Number} - allowed movement until which only selection
     * happens (in px)
     */
    constructor(moveGrace = 0) {
        this.active = false; //whether interaction currently takes place
        //start coordinates - do NOT reset this at disable interaction!
        this.start = null;
        this.mode = undefined; //how the scene is affected
        this.grace = moveGrace;

        //affected elements for the different interaction modes
        this.lineMirror = {
            curMode: InteractionMode.lineMirror
        };
        this.addAnnotation = {
            curMode: InteractionMode.addAnnotation
        };
        this.addStructure = {
            curMode: InteractionMode.addStructure
        };
        this.edit = {
            curMode: InteractionMode.edit
        };
        this.addGeomineQueryVirtualPoint = {
            curMode: InteractionMode.addGeomineQueryVirtualPoint
        };
        this.fullReset();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the tracked information for all interaction modes.
     */
    fullReset() {
        this.resetAllButMirrorInfo();
        this.resetMirrorInfo();
        this.resetAddAnnotationInfo();
        this.resetAddStructureInfo();
        this.resetEditInfo();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the tracked information for all interaction modes except the bond
     * mirror interaction mode which has to retain its information while a bond
     * stays hovered to iteratively mirror different halves of a structure.
     */
    resetAllButMirrorInfo() {
        this.resetMovementInfo();
        this.resetRotationInfo();
        this.resetScaledRotationInfo();
        this.resetLineMirrorInfo();
        this.resetRemoveInfo();
        this.resetSelectionCandidates();
        this.resetAddIntermolecularInfo();
        this.resetAddAtomInfo();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the tracked draw elements to be moved in the movement interaction
     * mode.
     */
    resetMovementInfo() {
        this.movement = {
            canMove: false, //if movement is permitted currently
            didMove: false, //if movement has occurred
            fullStructures: [], //structures to move all elements for
            partialStructures: [], //structures to move individual atoms for
            ringSystems: {}, //ring systems containing any moved atoms
            //ALL individual atoms to move (including in full structures)
            individualAtoms: {}, //individual atoms to move
            annotations: new Set(), //individual annotations to move
            splineControlPoints: {}, //individual spline points to move
            distances: new Set(), //individual distances to move
            interactions: new Set(), //individual interactions to move
            atomPairInteractions: new Set(), //individual atom pair interactions to move
            piStackings: new Set(), //individual pi-stackings to move
            //individual cation-pi-stackings to move
            cationPiStackings: new Set()
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the tracked draw elements to be rotated in the rotation
     * interaction mode.
     */
    resetRotationInfo() {
        this.rotation = {
            curRotation: 0, //full rotation until now, given in degrees
            type: 'fullScene',
            structures: [], //structures to move all elements for
            annotations: new Set(),
            splineControlPoints: {}, //individual spline points to move
            distances: new Set(), //individual distances to move
            interactions: new Set(), //individual interactions to move
            atomPairInteractions: new Set(), //individual atom pair interactions to move
            piStackings: new Set(), //individual pi-stackings to move
            //individual cation-pi-stackings to move
            cationPiStackings: new Set()
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the additionally required information for the scaled rotation
     * interaction mode (which, as an extension to the rotation mode, uses the
     * data in this.rotation as a base).
     */
    resetScaledRotationInfo() {
        this.scaledRotation = {
            rememberedAngle: 0
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the information on the bond to mirror parts of a structure on in
     * the bond mirror interaction mode.
     */
    resetMirrorInfo() {
        this.mirror = {
            edge: {
                structureId: undefined, edgeId: undefined
            }, side: 'small', atomsSmall: [], atomsLarge: []
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the draw elements to be mirrored on the free mirror line in the
     * line mirror interaction mode.
     */
    resetLineMirrorInfo() {
        //note that the current line mirror mode is not altered
        this.lineMirror.curStructureId = undefined;
        this.lineMirror.annotations = [];
        this.lineMirror.splineControlPoints = {};
    }

    /*----------------------------------------------------------------------*/

    /**
     * Reset the tracked draw elements to be moved in the movement interaction
     * mode.
     */
    resetRemoveInfo() {
        this.remove = {
            structures: new Set(),
            atoms: new Set(),
            edges: new Set(),
            annotations: new Set(),
            hydrophobicContacts: new Set(),
            atomPairInteractions: new Set(),
            piStackings: new Set(),
            cationPiStackings: new Set(),
            selected: false
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the tracked elements to add intermolecular interaction by the
     * interaction mode.
     */
    resetAddIntermolecularInfo() {
        this.addIntermolecular = {
            endpoints: {
                first: undefined, second: undefined
            }, from: undefined, to: undefined, fromHydrophobic: {
                hydrophobicContactId: undefined, controlPointId: undefined
            }, toHydrophobic: {
                hydrophobicContactId: undefined, controlPointId: undefined
            }, fromStructure: undefined, toStructure: undefined
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the tracked elements to add intermolecular interaction by the
     * interaction mode.
     */
    resetAddAtomInfo() {
        this.addAtom = {
            endpoints: {
                first: undefined, second: undefined
            }, from: undefined, fromStructure: undefined
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the tracked elements to add intermolecular interaction by the
     * interaction mode.
     */
    resetAddAnnotationInfo() {
        this.addAnnotation.coords = undefined;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the tracked elements to add structures by the interaction mode.
     */
    resetAddStructureInfo() {
        this.addStructure.coords = undefined;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the tracked elements to add structures by the interaction mode.
     */
    resetEditInfo() {
        this.edit.coords = undefined;
        this.edit.object = undefined;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets information on current candidates for selection after current user
     * interaction is finished.
     */
    resetSelectionCandidates() {
        //structure id -> array of candidates by type ('atom', 'edge' or
        //'structureCircle') and id
        this.selectionCandidates = {};
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds a potential candidate for selection.
     *
     * @param structureId {Number} - id of structure the candidate is part of
     * @param id {Number} - id of the candidate
     * @param type {String} - type of the candidate ('atom', 'edge'
     * or 'structureCircle')
     */
    addSelectionCandidate(structureId, id, type) {
        if (!this.selectionCandidates.hasOwnProperty(structureId)) {
            this.selectionCandidates[structureId] = [];
        }
        this.selectionCandidates[structureId].push({
            type: type, id: id
        });
    }
}
