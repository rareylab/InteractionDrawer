/**
 * These are only meant to check the overall scene structure. Add more detailed
 * checks where necessary.
 */
class JSONSceneStructure {
    static annotations() {
        return {
            ref: 'annotation', required: {
                id: 0, label: '', coordinates: {
                    x: 0, y: 0
                }
            }, optional: {
                belongsTo: {
                    type: "", id: 0, atomLinks: new JSONOptional([0])
                }, color: "", isStructureLabel: true, additionalInformation: {}
            }
        };
    }

    /*----------------------------------------------------------------------*/

    static piStackings() {
        return {
            ref: 'pi stacking interaction', required: {
                id: 0, fromStructure: 0, toStructure: 1, from: 0, to: 1
            }, optional: {
                additionalInformation: {}
            }
        };
    }

    /*----------------------------------------------------------------------*/

    static cationPiStackings() {
        return {
            ref: 'cation pi stacking interaction', required: {
                id: 0, fromStructure: 0, toStructure: 1, from: 0, to: 0
            }, optional: {
                additionalInformation: {}
            }
        };
    }

    /*----------------------------------------------------------------------*/

    static atomPairInteractions() {
        return {
            ref: 'atom pair interaction', required: {
                id: 0, fromStructure: 0, toStructure: 0, from: 0, to: 0
            }, optional: {
                additionalInformation: {}
            }
        };
    }

    /*----------------------------------------------------------------------*/

    static distances() {
        return {
            ref: 'distance', required: {
                id: 0, fromStructure: 0, toStructure: 0, from: 0, to: 0, additionalInformation: {}
            }
        };
    }

    /*----------------------------------------------------------------------*/

    static interactions() {
        return {
            ref: 'interaction', required: {
                id: 0, fromStructure: 0, toStructure: 0, from: 0, to: 0, additionalInformation: {}
            }
        };
    }

    /*----------------------------------------------------------------------*/

    static hydrophobicContacts() {
        return {
            ref: 'hydrophobic contact', required: {
                id: 0, belongsTo: 0, controlPoints: [
                    {
                        x: 0, y: 0, atomLinks: new JSONOptional([0])
                    }
                ]
            }, optional: {
                controlPointsInsertId: 0
            }
        };
    }

    /*----------------------------------------------------------------------*/

    static structures() {
        return {
            ref: 'structure', required: {
                id: 0
            }, optional: {
                structureLabel: "",
                structureName: "",
                structureType: "",
                representation: 1,
                additionalInformation: {}
            }
        };
    }

    /*----------------------------------------------------------------------*/

    static atoms() {
        return {
            ref: 'atom', required: {
                id: 0, element: "", label: new JSONChoice(["", null]), coordinates: {
                    x: 0, y: 0
                }
            }, optional: {
                color: "",
                charge: 0,
                hydrogenCount: new JSONChoice([0, new SpecificStrings(['missing'])]),
                aromatic: true,
                stereoCenter: true,
                additionalInformation: {}
            }
        };
    }

    /*----------------------------------------------------------------------*/

    static bonds() {
        return {
            ref: 'bond', required: {
                id: 0, from: 0, to: 0, type: new SpecificStrings(this.bondTypes())
            }, optional: {
                aromatic: true
            }
        };
    }

    /*----------------------------------------------------------------------*/

    static rings() {
        return {
            ref: 'ring', required: {
                id: 0, atoms: [0]
            }
        };
    }

    /*----------------------------------------------------------------------*/

    static ringsystems() {
        return {
            ref: 'ring system', required: {
                id: 0, atoms: [0]
            }
        };
    }

    /*----------------------------------------------------------------------*/

    static bondTypes() {
        return [
            'single',
            'double',
            'triple',
            'stereoFront',
            'stereoBack',
            'stereoFrontReverse',
            'stereoBackReverse',
            'up',
            'down'
        ];
    }
}

/*----------------------------------------------------------------------*/

class JSONOptional {
    constructor(value) {
        this.value = value;
        this.isOptional = true; //for duck typing
    }
}

/*----------------------------------------------------------------------*/

class JSONChoice {
    constructor(choices) {
        this.choices = choices;
        this.isChoice = true; //for duck typing
    }
}

/*----------------------------------------------------------------------*/

class SpecificStrings {
    constructor(stringArr) {
        this.strings = stringArr;
        this.isSpecificString = true; //for duck typing
    }

    /*----------------------------------------------------------------------*/

    checkString(string) {
        return this.strings.includes(string);
    }

    /*----------------------------------------------------------------------*/

    stringsToChoice() {
        return `"${this.strings.join('|')}"`;
    }
}
