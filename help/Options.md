# Overview

During initialization of the Drawer, you may provide a variety of options as part of the ```opts```
parameter. Any option you do not manually set is instead filled by a default value of the Drawer.

# Debug Information

Debug text can be displayed on top of atom text/bond lines. This text can be completely disabled (as
to not take up any SVG elements), otherwise its current visibility can be controlled.

| Option           | Effect                                      | Default Value |
|------------------|---------------------------------------------|---------------|
| debug.atoms      | Whether atom debug text can ever be shown   | true          |
| debug.showAtoms | Whether to immediately show atom debug text | false         |
| debug.edges      | Whether bond debug text can ever be shown   | true          |
| debug.showEdges | Whether to immediately show bond debug text | false         |
| debug.textSize  | Size of debug text (in px)                  | 6.5           |

# Interaction

## Allowed Modes

The drawer offers different modes of interaction which can be used or excluded.

| Option | Effect                                                                                                                                                                                                      | Default Value                                                                                                                                                                                                                                                                                                           |
|---|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| allowInteraction | Whether the interaction is allowed at all                                                                                                                                                                   | true                                                                                                                                                                                                                                                                                                                    |
| allowedInteraction | Array of allowed interactions, all others are disabled. By default, all interaction types are enabled. Use this parameter if you only want to use a select few types of interaction.                        | ["movement", "rotation", "scaledRotation", "rectSelect", "freeSelect", "lineMirror", "bondMirror", "zoomIn", "zoomOut", "advanceHistory", "revertHistory", "center", "structureReset", "remove", "addIntermolecular", "addAnnotation", "globalMovement", "doNothing", "addStructure", "clickSelect", "addAtom", "edit"] |
| excludedInteraction | Array of explicitly not allowed interactions (to be removed from allowedInteraction). If you need to disable only a few interactions (but keep the rest), use this parameter instead of allowedInteraction. | []                                                                                                                                                                                                                                                                                                                      |

## Key Bindings

### Mouse Bindings

Many interaction modes follow the same drag-and-drop pattern. These modes are all used by the mouse.
Different modes are then used depending on the pressed mouse button (field "key") and additionally
pressed modifiers (field "modifiers"). You can also add more than one binding to an interaction by
expanding the array. A single mode can also be set as the default mode (option ```defaultInteraction```)
to be used if no other mode's conditions are met. A pre-selection of modes is already set.

| Option                          | Effect                                                                                    | Default Value  |
|---------------------------------|-------------------------------------------------------------------------------------------|---|
| defaultInteraction              | The default interaction mode                                                              | "movement" |
| buttons.mouse.clickSelect       | Mouse key bindings to trigger click interaction mode                                      | [{'key': 0, 'modifiers': []}] |
| buttons.mouse.rectSelect        | Mouse key bindings to trigger rectangular selection interaction mode                      | [{'key': 0, 'modifiers': ['shift']}] |
| buttons.mouse.freeSelect        | Mouse key bindings to trigger lasso selection interaction mode                            | [{'key': 0, 'modifiers': ['ctrl']}] |
| buttons.mouse.remove            | Mouse key bindings to trigger removing of hovered/selected objects                        | [{'key': 0, 'modifiers': ['alt']}] |
| buttons.mouse.rotation          | Mouse key bindings to trigger rotation interaction mode                                   | [{'key': 1, 'modifiers': []}] |
| buttons.mouse.addAnnotation     | Mouse key bindings to trigger input popup to add an annotation                            | [{'key': 1, 'modifiers': ['shift']}] |
| buttons.mouse.addIntermolecular | Mouse key bindings to trigger interaction start of adding e.g. a atom pair interaction    | [{'key': 1, 'modifiers': ['ctrl']}] |
| buttons.mouse.addStructure      | Mouse key bindings to trigger input popup to add a structure                              | [{'key': 1, 'modifiers': ['alt']}] |
| buttons.mouse.movement          | Mouse key bindings to trigger movement interaction mode                                   | [{'key': 2, 'modifiers': []}] |
| buttons.mouse.bondMirror        | Mouse key bindings to trigger mirror interaction on a bond of a molecular structure       | [{'key': 2, 'modifiers': ['alt']}] |
| buttons.mouse.lineMirror        | Mouse key bindings to trigger mirror interaction on a free line                           | [{'key': 2, 'modifiers': ['ctrl']}] |
| buttons.mouse.scaledRotation           | Mouse key bindings to trigger scaled rotation interaction mode                            |  |
| buttons.mouse.addAtom           | Mouse key bindings to trigger the drawing of an atom                                      |  |
| buttons.mouse.edit              | Mouse key bindings to trigger input popup to edit an annotation, atom, bond, or structure |  |
| buttons.mouse.doNothing              | No interaction mode is triggered                                                          |  |

### Other Bindings

Other interactions can be bound to different keyboard buttons ("type": "key", with "button" set to
the desired key) or the mouse wheel (type "wheel", with "button" set to "up" or "down"). Multiple
buttons can be bound for one interaction type.

| Option | Effect                                                                                     | Default Value |
|---|--------------------------------------------------------------------------------------------|---|
| buttons.zoomIn | Key bindings to zoom into the scene                                                        | [{"type": "wheel", "button": "up"}, {"type": "key", "button": "+"}] |
| buttons.zoomOut | Key bindings to zoom out of the scene                                                      | [{"type": "wheel", "button": "down"}, {"type": "key", "button": "-"}] |
| buttons.advanceHistory | Key bindings to advance the Drawer's history by one step                                   | [{"type": "key", "button": "ArrowRight"}] |
| buttons.revertHistory  | Key bindings to revert the Drawer's history by one step                                    | [{"type": "key", "button": "ArrowLeft"}] |
| buttons.center | Key bindings to center the scene in its draw area                                          | [{"type": "key", "button": "c"}] |
| buttons.structureReset | Key bindings to reset the current scene to its initial (after processing JSON input) state | [{"type": "key", "button": "r"}] |
| buttons.remove | Key bindings to remove hovered/selected objects                                            | [{"type": "key", "button": "Delete"}] |

## Mode Behavior

Some interaction modes can be further influenced by the setting of certain modes.

| Option | Effect                                                                                                                                                                                                                                                                                                                                                                 | Default Value |
|---|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| moveFreedomLevel | Size of molecular units to be moved at once in the ```movement``` interaction mode (annotations and splines unaffected): <ol><li>"structures": Can only move full structures</li><li>"free": Can freely move atoms and bonds</li><li>"rings": Can freely move atoms and bonds outside of ring systems, but move all atoms and bonds of ring systems together</li></ol> | "structures"  |
| moveAllSelection | Whether to move all selected elements at once when a selected element is moved during the ```movement``` interaction mode (while ```moveFreedomLevel``` is set to ```structures```)                                                                                                                                                                                    | true          |
| hoverAfterDeselection | Keeps hover highlighting of an element active after its deselection                                                                                                                                                                                                                                                                                                    | true          |
| selectionGrace | How far the cursor has to be moved from its initial click position before a movement is committed in the ```movement`` interaction mode (to allow selection for minor mouse slips, in px)                                                                                                                                                                              | 0.4           |
| scaledRotationThreshold | Threshold after which rotation is committed during the ```scaledRotation``` interaction mode (in degree)                                                                                                                                                                                                                                                               | 5             |
| zoomStrength | Relative strength of zoom operations                                                                                                                                                                                                                                                                                                                                   | 7             |
| sceneMaxScale | Maximum scaling factor which can be applied to the scene (can be set to null to allow infinite zoom-out)                                                                                                                                                                                                                                                               | 3             |
| sceneMinScale | Minimum scaling factor which can be applied to the scene (can be set to null to allow infinite zoom-in)                                                                                                                                                                                                                                                                | 0.5           |
| handleCollisionWith | How collision detection on scene elements should be done: <ol><li>"selector": Checks collision against the selection shape(s) around draw elements</li><li>"drawingOnly": Checks collision against the drawn shapes of draw elements only (so against much smaller elements than the selection shapes)</li></ol>                                                       | "selector"    |
| historyCanClearScene | Whether reverting the history can set the scene back to its empty state after adding elements (if set to false the latest state that can be reverted back to is the state in which elements were just added)                                                                                                                                                           | true          |
| addIntermolecularSnapDist | The distance from the nearest atom, ring, or hydrophobic control point to the cursor position where to snap to the object during ```addIntermolecular``` interaction mode                                                                                                                                                                                              | 15            |
| resetMode | To what state to reset during ```reset``` interaction (initial state off: 0 = all present elements; 1 = only the first loaded json, discard other elements; 2 = only all loaded jsons which contain at least one structure)                                                                                                                                            | 0             |

# Representations

There are currently two different representations of structures.

- **default** is the skeletal representation. Internally this is always present due to the fact the 
- drawer relies on that information.
- **circle** shows the structures as a circle.

The allowed representations can be specified for each ```moleculeType``` defined in the loaded
jsons. Note that, as stated above the **default** representation must always be present.

| Option | Effect                                                                                                                                                                                                                                                                                                    | Default Value |
|---|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---|
| allowedStructureRepresentations | Can contain a key that holds an array of allowed representations for every ```moleculeType``` of loaded structures. The first item in the array defines the initial representation. The array at key ```default``` is applied when ```moleculeType``` of a loaded structure does not match any other key. | { default: ["default", "circle"] } |

## Circle Options

Additional options (styling and functional) can be applied to the structure when in circle
representation. The label of the circle that is shown inside the circle (json
field ```moleculeLabel```) can be split into max 3 rows to not lap outside of the circle. There are
2 split methods are available:

- **Automatic** Splits the label so that all rows have the same number of characters. Note that this
  mode does not guarantee rows of the same width because the width of characters differ
- **Manual** Splits the label at the first occurrences of characters in a defined array

Further options on how splitting should be handled are described in the table below.

| Option | Effect                                                                                                                                                                                                                                                   | Default Value                                                                                                                                                                                                                                                                                                            |
|---|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| structureCircleOpts | Can contain a key that holds an object of additional options (described below) for every ```moleculeType``` of loaded structures. The object at key ```default``` is applied when ```moleculeType``` of a loaded structure does not match any other key. | { "default": { "rad": 20, "textColor": "#000000", "circleCss": { "stroke": "#000000", "fill": "#808080", "opacity": "0.4" }, "labelAutoSplit": true, "labelAutoSplitMinCharsPerLine": 3, "labelManualLineBreakChars": [" ", "-", "_"], "labelManualIncludeSplitChar": [false, false], "labelMaxLines": 3, "labelSameFontSize": true } |
| structureCircleOpts.```moleculeType```.circleCss | Object containing all relevant styling that is directly applied to the circle svg element. Every style attribute that fits an svg circle element can be set. (Hint: use "stroke": undefined for no border)                                               | { "stroke": "#000000", "fill": "#808080", "opacity": "0.4" }                                                                                                                                                                                                                                                             |
| structureCircleOpts.```moleculeType```.rad | radius of the circle                                                                                                                                                                                                                                     | 20                                                                                                                                                                                                                                                                                                                       |
| structureCircleOpts.```moleculeType```.textColor | css color of the label in the middle of the circle                                                                                                                                                                                                       | "#000000"                                                                                                                                                                                                                                                                                                                |
| structureCircleOpts.```moleculeType```.labelMaxLines | Maximal number of lines the label string should be split into. **                                                                                                                                                                                        
Only 1, 2, and 3 are supported currently** | 3                                                                                                                                                                                                                                                        |
| structureCircleOpts.```moleculeType```.labelSameFontSize | Whether each line of the label should fill the available space and may produce a different font size for each row (false) or each line should have the same font size (true). The max font size will always be ```textSize```                            | true                                                                                                                                                                                                                                                                                                                     |
| structureCircleOpts.```moleculeType```.labelAutoSplit | The split mode. true: automatic mode; false: manual mode                                                                                                                                                                                                 | true                                                                                                                                                                                                                                                                                                                     |
| structureCircleOpts.```moleculeType```.labelAutoSplitMinCharsPerLine | Minimal amount of characters that should be present in each row of the label. Only applies if ```labelAutoSplit``` is true                                                                                                                               | 3                                                                                                                                                                                                                                                                                                                        |
| structureCircleOpts.```moleculeType```.labelManualLineBreakChars | Array containing characters at which to split the label. Only applies if ```labelAutoSplit``` is false                                                                                                                                                   | [" ", "-", "_"]                                                                                                                                                                                                                                                                                                          |
| structureCircleOpts.```moleculeType```.labelManualIncludeSplitChar | If the character on which the label string was split should be included in the final label. First value for first split, second value for second split. Only applies if ```labelAutoSplit``` is false                                                    | [false, false]                                                                                                                                                                                                                                                                                                           |

# Styling

The styling of scene elements is directly controlled by the configuration. Parameters usually
correspond directly with CSS properties to set. For styling of the structure circle representation,
see *Representation --> Circle Options*

## Atoms/Text Labels

| Option | Effect                                                                                                                                                                                             | Default Value |
|---|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| atomMode | How atoms are depicted. Currently only supports "name" mode, which displays atoms by textual label                                                                                                 | "name"        |
| textSelector | Kind of selection shape to draw around text selectors: "circle": only draw a simple circle; "full": draw a more sophisticated shape which fully flows around the text                              | "full"        |
| fontFamily | Font family to use for text labels                                                                                                                                                                 | "arial"       |
| textSize | Text size to use for text labels (in px)                                                                                                                                                           | 6.5           |
| textCrop | Estimated extra space below/above glyphs in the current font (to get hydrogen text above/below atom text closer)                                                                                   | "0.285em"     |
| textBorderCorrection | Estimated excess space on border boxes of larger text elements (in px)                                                                                                                             | 1             |
| labelSideCorrection | Correction to apply to anchor points (as selectors around labels are very large, in px)                                                                                                            | 1             |
| hOffset | Distance between atom text and hydrogen text                                                                                                                                                       | "0.2em"       |
| chargeFontSize | Percentage of regular font size to apply as charge text font size                                                                                                                                  | 0.775         |
| chargeOffset | Percentage of regular font size to set as font size of offset between atom text and charge text                                                                                                    | 0.3           |
| hNumberFontSize | Percentage of regular font size to apply as hydrogen number text (the small number as subscript of hydrogen text)                                                                                  | 0.6           |
| hNumberOffset | Percentage of regular font size to set as font size of offset between the middle line of hydrogen text and the upper line of bounding box of hydrogen number text                                  | 0.235         |
| atomRadius | Radius around atoms in which bonds are not allowed to be drawn (in px)                                                                                                                             | 3.75          |
| atomSelectorRadius | Radius around atoms/distance from atoms to base selection shape drawing of                                                                                                                         | 5             |
| smallestBboxWidth | When first drawing a scene, scale the scene such that a text of 'I' is rendered with a bbox at least of this width (in px) to avoid a to small drawing where rounding errors may distort the scene | 20            |

## Edges

| Option | Effect                                                                                                                                                                     | Default Value |
|---|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| lineWidth | Width of drawn lines (in px)                                                                                                                                               | 0.65          |
| wedgeBaseWidth | Width of wedges (representation of stereo bonds) at their smallest (in px)                                                                                                 | 0.3           |
| wedgeFullWidth | Width of wedges (representation of stereo bonds) at their widest (in px)                                                                                                   | 2.5           |
| wedgeSpacing | Space between individual segments of wedges (representation of stereo bonds, in px)                                                                                        | 1             |
| spaceBetweenDouble | Space between individual lines of double bonds (in px)                                                                                                                     | 1.3           |
| spaceBetweenTriple | Space between individual lines of triple bonds (in px)                                                                                                                     | 0.75          |
| spaceToRing | Space between bonds and inner bonds of aromatic rings (in px)                                                                                                              | 1.3           |
| cutoffAngleDouble | For double bonds where not both bonds are drawn full length: In which angle does the the endpoint of the smaller bond lie from the endpoint of the larger bond (in degree) | 60            |
| edgeSelectorOffset | Distance from lines representing bonds and the surrounding selection shape (in px)                                                                                         | 2.25          |
| lineDashDrawn | Length of individual segments of dashed lines (in px)                                                                                                                      | 2             |
| lineDashGap | Gap between segments of dashed lines (in px)                                                                                                                               | 2             |

## Coloring

| Option                     | Effect                                                                                                                                    | Default Value |
|----------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|---|
| colors.DEFAULT             | Color of annotations that do not belong to a hydrophobic contact or with no given color. Color for atoms, which have an unknown element. Color of undefined interactions and bonds | "#222" |
| colors.BACKGROUND          | Background color of the drawer                                                                                                            | "#fff" |
| colors.HOVER     | Color of hovered elements                                                                                                                 | "#8eff7d" |
| colors.SELECTION           | Color of selected elements                                                                                                                | "#10ff00" |
| colors.MIRROR              | Color of the line to mirror during ```lineMirror``` interaction mode                                                                      | "#ff6600" |
| colors.multiSelectionToolBorder          | Color of lasso and rectangle selection tool                                                                                               | "#ff33ff" |
| colors.multiSelectionToolFill          | Color of lasso and rectangle selection tool                                                                                               | "#ffe6ff" |
| colors.cationPiStackings   | Color of cation pi stacking interactions                                                                                                  | "#99cc33" |
| colors.piStackings         | Color of pi stacking interactions                                                                                                         | "#33cccc" |
| colors.atomPairInteractions              | Color of atom pair interactions                                                                                                           | "#6699ff" |
| colors.ionicInteractions   | Color of ionic interactions                                                                                                               | "#ff00ff" |
| colors.metalInteractions   | Color of metal interactions                                                                                                               | "#f7de3a" |
| colors.hydrophobicContacts | Color of hydrophobic contacts                                                                                                             | "#019a4d" |

### Atoms

Atom colors as hex values for each element. the property of ```colors``` defines the element. There
is also the possibility of adding colors for custom elements (e.g. "R" for a side chain)

| Option | Default Value |
|---|---------------|
| colors.C | "#222"        |
| colors.N | "#3050F8"     |
| colors.O | "#FF0D0D"     |
| colors.H | "#222"        |
| colors.HE | "#D9FFFF"     |
| colors.LI | "#CC80FF"     |
| colors.BE | "#C2FF00"     |
| colors.B | "#FFB5B5"     |
| colors.F | "#90E050"     |
| colors.NE | "#B3E3F5"     |
| colors.NA | "#AB5CF2"     |
| colors.MG | "#7CE500"     |
| colors.AL | "#BFA6A6"     |
| colors.SI | "#F0C8A0"     |
| colors.P | "#FF8000"     |
| colors.S | "#F7DE3A"     |
| colors.CL | "#1FF01F"     |
| colors.AR | "#80D1E3"     |
| colors.K | "#8F40D4"     |
| colors.CA | "#33D800"     |
| colors.SC | "#E6E6E6"     |
| colors.TI | "#BFC2C7"     |
| colors.V | "#A6A6AB"     |
| colors.CR | "#8A99C7"     |
| colors.MN | "#9C7AC7"     |
| colors.FE | "#E06633"     |
| colors.CO | "#F090A0"     |
| colors.NI | "#50D050"     |
| colors.CU | "#C88033"     |
| colors.ZN | "#7D80B0"     |
| colors.GA | "#C28F8F"     |
| colors.GE | "#668F8F"     |
| colors.AS | "#BD80E3"     |
| colors.SE | "#FFA100"     |
| colors.BR | "#A62929"     |
| colors.KR | "#5CB8D1"     |
| colors.RB | "#702EB0"     |
| colors.SR | "#00FF00"     |
| colors.Y | "#94FFFF"     |
| colors.ZR | "#94E0E0"     |
| colors.NB | "#73C2C9"     |
| colors.MO | "#54B5B5"     |
| colors.TC | "#3B9E9E"     |
| colors.RU | "#248F8F"     |
| colors.RH | "#0A7D8C"     |
| colors.PD | "#006985"     |
| colors.AG | "#C0C0C0"     |
| colors.CD | "#FFD98F"     |
| colors.IN | "#A67573"     |
| colors.SN | "#668080"     |
| colors.SB | "#9E63B5"     |
| colors.TE | "#D47A00"     |
| colors.I | "#940094"     |
| colors.XE | "#940094"     |
| colors.CS | "#57178F"     |
| colors.BA | "#00C900"     |
| colors.LA | "#70D4FF"     |
| colors.CE | "#FFFFC7"     |
| colors.PR | "#D9FFC7"     |
| colors.ND | "#C7FFC7"     |
| colors.PM | "#A3FFC7"     |
| colors.SM | "#8FFFC7"     |
| colors.EU | "#61FFC7"     |
| colors.GD | "#45FFC7"     |
| colors.TB | "#30FFC7"     |
| colors.DY | "#1FFFC7"     |
| colors.HO | "#00FF9C"     |
| colors.ER | "#00E675"     |
| colors.TM | "#00D452"     |
| colors.YB | "#00BF38"     |
| colors.LU | "#00AB24"     |
| colors.HF | "#4DC2FF"     |
| colors.TA | "#4DA6FF"     |
| colors.W | "#2194D6"     |
| colors.RE | "#267DAB"     |
| colors.OS | "#266696"     |
| colors.IR | "#175487"     |
| colors.PT | "#D0D0E0"     |
| colors.AU | "#FFD123"     |
| colors.HG | "#B8B8D0"     |
| colors.TL | "#A6544D"     |
| colors.PB | "#575961"     |
| colors.BI | "#9E4FB5"     |
| colors.PO | "#AB5C00"     |
| colors.AT | "#754F45"     |
| colors.RN | "#428296"     |
| colors.FR | "#420066"     |
| colors.RA | "#007D00"     |
| colors.AC | "#70ABFA"     |
| colors.TH | "#00BAFF"     |
| colors.PA | "#00A1FF"     |
| colors.U | "#008FFF"     |
| colors.NP | "#0080FF"     |
| colors.PU | "#006BFF"     |
| colors.AM | "#545CF2"     |
| colors.CM | "#785CE3"     |
| colors.BK | "#8A4FE3"     |
| colors.CF | "#A136D4"     |
| colors.ES | "#B31FD4"     |
| colors.FM | "#B31FBA"     |
| colors.MD | "#B30DA6"     |
| colors.NO | "#BD0D87"     |
| colors.LR | "#C70066"     |
| colors.RF | "#CC0059"     |
| colors.DB | "#D1004F"     |
| colors.SG | "#D90045"     |
| colors.BH | "#E00038"     |
| colors.HS | "#E6002E"     |
| colors.MT | "#EB0026"     |
| colors.DS | "#FFFFFF"     |
| colors.RG | "#FFFFFF"     |
| colors.CN | "#FFFFFF"     |
| colors.UUT | "#FFFFFF"     |
| colors.FL | "#FFFFFF"     |
| colors.UUP | "#FFFFFF"     |
| colors.LV | "#FFFFFF"     |
| colors.UUH | "#FFFFFF"     |
| colors.D | "#FFFFC0"     |
| colors.T | "#FFFFA0"     |

## Other

| Option | Effect                                                                                                 | Default Value |
|---|--------------------------------------------------------------------------------------------------------|---------------|
| selectorOpacity | Value determines the opacity of selection highlighting                                                 | 1             |
| selectorDashArray | Value of "stroke-dasharray" for lines of selector rectangle/lasso (in px)                              | 4             |
| selectorDashWidth | Value of "stroke-width" for lines of selector rectangle/lasso (in px)                                  | 3             |
| mirrorLineWidth | Line width of the line used in the mirror line mode (in px)                                            | 0.65          |
| piPiRadius | Radius of circles as part of pi-stacking interaction representations (in px)                           | 3.75          |
| drawAreaPadding | Space to leave between elements of the scene and the border of the draw area (in any direction, in px) | 15            |

# Misc

Some different options to influence the rendering of the scene.

| Option | Effect | Default Value                                                                                                                                                                                                                                                                                                                                                                                                                          |
|---|---|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| decimalPrecision | Precision (decimal place) to which SVG attributes are rounded | 8                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| svgElementOrder | Order of elements within the SVG draw area (later elements are drawn on top of earlier elements) | ["hydrophobicContactSelectors", "cationPiStackingsSelectors", "piStackingsSelectors", "atomPairInteractionsSelectors", "hydrophobicContacts", "cationPiStackings", "piStackings", "atomPairInteractions", "distancesSelectors", "interactionsSelectors", "bondSelectors", "atomSelectors", "annotationSelectors", "structureCirclesSelectors", "bonds", "atoms", "annotations", "structureCircles", "bondDebugTexts", "atomDebugTexts"] |

# Penalties

The Drawer offers a scoring functionality to judge drawings based on drawn atom/bond
representations. The exact penalization of draw violations and some thresholds for this judgment can
be given in the penalties Object.

| Option | Effect                                                                                                                                                    | Default Value |
|---|-----------------------------------------------------------------------------------------------------------------------------------------------------------|---|
| penalties.coordinateOverlap | Penalty for directly overlapping coordinates of atom text elements                                                                                        | 1000 |
| penalties.mainDrawingOverlap | Penalty for overlap of bounding boxes of atom text elements                                                                                               | 50 |
| penalties.otherDrawingOverlap | Penalty for overlap of bounding boxes of atom text elements and associated text elements (e.g., hydrogen texts)                                           | 10 |
| penalties.edgeMainDrawingOverlap | Penalty for overlap of bounding box of atom text element and bounding box of bond line element                                                            | 20 |
| penalties.edgeOtherDrawingOverlap | Penalty for overlap of bounding box of an atom's associated text element (e.g., hydrogen text) and bonding box of bond line element                       | 10 |
| penalties.smallestAngleWithoutPenalty | Smallest angle between neighboring bonds which is not penalized (in degrees)                                                                              | 30 |
| penalties.smallestAllowedAngle | Smallest angle between neighboring bonds which is not heavily penalized (in degrees)                                                                      | 20 |
| penalties.thirtyDegreeViolation | Penalty for angles between neighboring bonds that are not divisible by 30                                                                                 | 5 |
| penalties.smallAngleViolations | Penalty for angles between neighboring bonds smaller than penalties.smallestAngleWithoutPenalty                                                           | 10 |
| penalties.heavyAngleViolations | Penalty for angles between neighboring bonds smaller than penalties.smallestAllowedAngle                                                                  | 100 |
| penalties.nonCyclicEdgeHits | Penalty for overlap of bounding boxes of bond line elements where none of the bonds is cyclic                                                             | 50 |
| penalties.oneCyclicEdgeHits | Penalty for overlap of bounding boxes of bond line elements where exactly one of the bonds is cyclic                                                      | 10 |
| penalties.cyclicEdgeHits | Penalty for overlap of bounding boxes of bond line elements where both bonds are cyclic                                                                   | 10 |
| penalties.hiddenEdges | Penalty for bonds whose representation is completely hidden                                                                                               | 200 |
| penalties.allowedEdgeLengthDifference | Fraction by which the length of a single bond may divert from the average bond length of the scene. Applied separately for regular bonds and interactions | 1/3 |
| penalties.edgeLengthViolation | Penalty for bonds which divert more from the average bond length than allowed by penalties.allowedEdgeLengthDifference                                    | 10 |
