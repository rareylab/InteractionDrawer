The InteractionDrawer's input is to be provided in JSON form. This JSON contains a single Object
with just one key: "scene". Mapped to this key is another Object detailing the elements to be drawn.
Different fields in the "scene" Object then provide draw information for the different subunits a
scene is composed of.

```json
{
  "scene": {
    "structures": [...],
    "atomPairInteractions": [...],
    "piStackings": [...],
    "cationPiStackings": [...],
    "hydrophobicContacts": [...],
    "annotations": [...],
  }
}
```

# Structures

Different structures of the scene are given as Objects inside an Array provided in the "structures"
field. Each such Object has to contain a unique ID. The structure Object can further contain the
fields "atoms", "bonds", "rings", and "ringsystems" (all optional, but potentially dependent on each
other).

```json
"structures": [
  {
    "id": 0,
    "structureName": "xyz",
    "structureType": "residue",
    "structureLabel": "abc",
    "representation": 1,
    "additionalInformation": {},
    "atoms": [
      {
        "id": 0,
        "element": "C",
        "label": "C",
        "coordinates": {
          "x": 5,
          "y": 5,
        },
        "color": "black",
        "charge": 0,
        "hydrogenCount": 0,
        "aromatic": false,
        "stereoCenter": false,
        "additionalInformation": {},
      },
      ...
    ],
    "bonds": [
      {
        "id": 0,
        "from": 0,
        "to": 1,
        "type": "single",
        "aromatic": "false"
      },
      ...
    ],
    "rings": [
      {
        "id": 0,
        "atoms": [0,1,2,3,4,5]
      },
      ...
    ],
    "ringsystems": [
      {
        "id": 0,
        "atoms": [0,1,2,3,4,5,6,7,8,9]
      },
      ...
    ]
  },
  ...
]
```

Available fields:

- "id" (Number|mandatory): unique (!) ID of the structure within the scene
- "structureName" (String|optional): the name of the structure
- "structureType" (String|optional): type of the structure. This is used to set allowed
  representations and styles/functionality of the circle representation to this structure
- "structureLabel" (String|optional): label of the structure. This is shown inside the structure
  circle. "structureName" is not used to give an alternative in case the full name is too long
- "representation" (Number|optional): Start representation of the structure (1 for default, 2 for circle)
- "additionalInformation" (Object|optional): Any additional information that does not belong to the
  drawer directly and may be queried from an external source during runtime

### Atoms

Given as an Array of Objects, each Object describes an individual atom. Available fields:

- "id" (Number|mandatory): unique (!) ID of the atom within all structures
- "element" (String|mandatory): element by periodic table letter code
- "label" (String|mandatory): text to draw
- "coordinates" (Object|mandatory): x- and y-coordinates to place atom at
- "color" (String|optional): valid CSS color of the drawn text (otherwise deduced from atom's element)
- "charge" (Number|optional): charge of the atom to appear as text (otherwise deduced from neighbors)
- "hydrogenCount" (Number|optional): number of hydrogens bound to this atom (otherwise deduced from
  neighbors and charge)
- "aromatic" (Boolean|optional): whether the atom is part of an aromatic system
- "stereoCenter" (Boolean|optional): whether the atom is a stereo center (can be inferred from bond types
  of neighbors)
- "additionalInformation" (Object|optional): Any additional information that does not belong to the
  drawer directly and may be queried from an external source during runtime

### Bonds

Given as an Array of Objects, each Object describes an individual bond. Provides information on
which atoms are connected. Positions and colors are derived from the connected atoms. Available fields:

- "id" (Number|mandatory): unique (!) ID of the bond within this structure
- "from" (Number|mandatory): ID of first atom bond connects
- "to" (Number|mandatory): ID of second atom bond connects
- "type" (String|mandatory): type of bond - can take either of the following values: "single", "
  double", "triple" (referring to the chemical bond types), "stereoFront", "stereoBack", "
  stereoFrontReverse", "stereoBackReverse" (front and back facing stereo bonds, either from atom
  referenced in the field "to" to atom referenced in the field "from" or in backwards direction), "up", "
  down" (front and back facing stereo bonds with unspecified direction, deduced by surrounding
  stereo center atoms)
- "aromatic" (Boolean|optional): whether the bond is part of an aromatic system

### Rings

Given as an Array of Objects, each Object describes an individual ring. Available fields:

- "id" (Number|mandatory): unique (!) ID of the ring within all structures
- "atoms" (Array|mandatory): IDs of atoms involved in this ring

### Ring Systems

Given as an Array of Objects, each Object describes an individual ring system. Describe the cyclic
regions of the structure. It has to be provided for pi-stacking interactions. Available fields:

- "id" (Number|mandatory): unique (!) ID of the ring system within this structure
- "atoms" (Array|mandatory): IDs of atoms involved in this ring system

# Hydrogen Bonds, Metal Interactions, Ionic Interactions ("atomPairInteractions")

Given as an Array of Objects, each Object describes an individual atom pair interaction. Provides
information on which atoms of which structures shall be connected.

```json
"atomPairInteractions": [
  {
    "id": 0,
    "fromStructure": 0,
    "toStructure": 1,
    "from": 0,
    "to": 1
  },
  ...
]
```

Available fields:

- "id" (Number|mandatory): unique (!) ID of the atom pair interaction
- "fromStructure" (Number|mandatory): ID of the first structure to connect
- "toStructure" (Number|mandatory): ID of the second structure to connect
- "from" (Number|mandatory): ID of the atom to connect in the first structure
- "to" (Number|mandatory): ID of the atom to connect in the second structure
- "additionalInformation" (Object|optional): Any additional information that does not belong to the
  drawer directly and may be queried from an external source during runtime

# Pi Stacking Interactions ("piStackings")

Given as an Array of Objects, each Object describes an individual pi-stacking interaction. Provides
information on which ring of which structures shall be connected.

```json
"piStackings": [
  {
    "id": 0,
    "fromStructure": 0,
    "toStructure": 1,
    "from": 0,
    "to": 1,
  },
  ...
]
```

Available fields:

- "id" (Number|mandatory): unique (!) ID of the pi stacking interaction
- "fromStructure" (Number|mandatory): ID of the first structure to connect
- "toStructure" (Number|mandatory): ID of the second structure to connect
- "from" (Number|mandatory): ID of the ring to connect in the first structure
- "to" (Number|mandatory): ID of the ring to connect in the second structure
- "additionalInformation" (Object|optional): Any additional information that does not belong to the
  drawer directly and may be queried from an external source during runtime

# Cation-Pi Interactions ("cationPiStackings")

Given as an Array of Objects, each Object describes an individual cation-pi interaction. Provides
information on which ring to connect with which atom.

```json
"cationPiStackings": [
  {
    "id": 0,
    "fromStructure": 0,
    "toStructure": 1,
    "from": 0,
    "to": 0
  },
  ...
]
```

Available fields:

- "id" (Number|mandatory): unique (!) ID of the cation-pi stacking interaction
- "fromStructure" (Number|mandatory): ID of the structure containing the ring system to connect
- "toStructure" (Number|mandatory): ID of the structure containing the atom to connect
- "from" (Number|mandatory): ID of the ring system to connect
- "to" (Number|mandatory): ID of the atom to connect
- "additionalInformation" (Object|optional): Any additional information that does not belong to the
  drawer directly and may be queried from an external source during runtime

# Hydrophobic Contacts ("hydrophobicContacts")

Given as an Array of Object, each Object describes an individual hydrophobic contact. Hydrophobic
contacts are rendered as splines which are defined by a series of control points.

```json
"hydrophobicContacts": [
  {
    "id": 0,
    "belongsTo": 0,
    "controlPoints": [
      {
        "x": 5,
        "y": 5,
        "atomLinks": [0, 1]
      },
      ...
    ],
    "controlPointsInsertId": 0
  },
  ...
]
```

Available fields:

- "id" (Number|mandatory): unique (!) ID of the hydrophobic contact
- "belongsTo" (Number|mandatory): ID of the structure the hydrophobic contact interacts with
- "controlPoints" (Array|mandatory): Objects of control points to define the spline, which represents
  the hydrophobic contact in the drawing, each control point being defined by its position of x- and
  y-coordinates. Each control point can also optionally be provided with "atomLinks": if one of the
  atoms referenced in this Array is moved, the control point then follows the movement. If not set,
  the nearest atom is automatically linked to the control point
- "controlPointsInsertId" (Number|optional): If a hydrophobic contact with "id" already exists, add
  the control points to the present contact. This defines at which position in the present control
  point to insert these given control points. Will be inserted at the end if undefined

# Annotations

Given as an Array of Objects, each Object describes an individual annotation. Annotations represent
text on the scene. They can be bound to structures/splines to mimic movement applied to the associated
element.

```json
"annotations": [
  {
    "id": 0,
    "label": "Asp86A",
    "coordinates": {
      "x": 5,
      "y": 5
    },
    "color": "black",
    "isStructureLabel": true,
    "additionalInformation": {}
    "belongsTo": {
      "type": "structure",
      "id": 0,
      "atomLinks": [0, 1]
    }
  },
  ...
]
```

Available fields:

- "id" (Number|mandatory): unique (!) ID of the annotation
- "label" (String|mandatory): text to draw
- "coordinates" (Object|mandatory): x- and y-coordinates to place annotation at
- "color" (String|optional): valid CSS color of the drawn text (defaults to black or color of splines
  when associated with a hydrophobic contact)
- "isStructureLabel" (Boolean|optional): true if this should be hidden when the corresponding
  structure's (if any) current representation is "circle"
- "additionalInformation" (Object|optional): Any additional information that does not belong to the
  drawer directly and may be queried from an external source during runtime
- "belongsTo" (Object|optional): binds the annotation to an element of the scene, defined by its
  type (either a "structure" or a spline as type "structureSpline") and its ID. This binding can
  also optionally be extended by "atomLinks": if one of the atoms referenced in this Array is moved,
  the annotation follows the movement. If not set, the nearest atom is linked to the annotation
