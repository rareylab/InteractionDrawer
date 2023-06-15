const EdgeChangeCase = Object.freeze({
    'remove': 1, 'draw': 2, 'redraw': 3, 'move': 4, 'pass': 5
});

const InteractionMode = Object.freeze({
    'movement': 1,
    'rotation': 2,
    'scaledRotation': 3,
    'rectSelect': 4,
    'freeSelect': 5,
    'mirrorSelect': 6,
    'lineMirror': 7,
    'bondMirror': 8,
    'remove': 9,
    'addIntermolecular': 10,
    'addAnnotation': 11,
    'addAnnotationInput': 12,
    'addGeomineQueryVirtualPoint': 13,
    'globalMovement': 14,
    'doNothing': 15,
    'addStructure': 16,
    'addStructureInput': 17,
    'clickSelect': 18,
    'addAtom': 19,
    'edit': 20,
    'editInput': 21,
});

const IntermolecularType = Object.freeze({
    'atomPairInteraction': 1, 'piStacking': 2, 'cationPiStacking': 3, 'hydrophobicContact': 4
});

const EditType = Object.freeze({
    'annotation': 1, 'atom': 2, 'bond': 3, 'structure': 4
});

const SelectorStatus = Object.freeze({
    'select': 1, 'unselect': 2, 'hover': 3
});

const StructureRepresentation = Object.freeze({
    'default': 1, 'circle': 2
});

//Note that those values are designed that way so that
//one can do e.g. bitwise or of below and left to
//get the value for belowLeft.
//inside and same are synonyms used for points/rectangles
const RelativePosition = Object.freeze({
    'inside': 0,
    'same': 0,
    'above': 1,
    'below': 2,
    'left': 4,
    'right': 8,
    'aboveLeft': 5,
    'aboveRight': 9,
    'belowLeft': 6,
    'belowRight': 10
});