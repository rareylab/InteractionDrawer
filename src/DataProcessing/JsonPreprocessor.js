/**
 * Preprocesses drawer's input JSONs in various ways.
 */
class JsonPreprocessor {
    /**
     * Contains instance for data access.
     */
    constructor(sceneData) {
        this.sceneData = sceneData;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Preprocesses the JSON by altering the ids of added objects (e.g. residue) so
     * that all ids are unique. This usually makes sense if there is already a
     * structure loaded and you want to add another which has no information
     * about the already loaded structure. Note that this is not done automatically
     * when adding something to the drawer.
     *
     * @param diagramString {String} - diagram string
     */
    prepJsonUIds(diagramString) {
        let diagramJson;
        try {
            diagramJson = JSON.parse(diagramString);
            //first get the highest ids of everything already drawn
            const highestDrawnIds = this.getHighestIDs();
            //Change the current ids of the JSON to new ids
            //Map old ids to new ids to change e.g. fromAtom in atomPairInteractions
            const idMaps = {
                structures: {}, atoms: {}, rings: {}, hydrophobicContacts: {}
            };
            this.changeStructureIDs(diagramJson, highestDrawnIds, idMaps);
            this.changeIntermolecularIDs(diagramJson, highestDrawnIds, idMaps);
            this.changeHydrophobicIDs(diagramJson, highestDrawnIds, idMaps);
            this.changeAnnotationIDs(diagramJson, highestDrawnIds, idMaps);
            return JSON.stringify(diagramJson);
        } catch (err) {
            console.log('Could not parse JSON:');
            console.log(err);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Determines for each draw object type the highest used id.
     *
     * @return {Object} - highest used ids for all draw object types
     */
    getHighestIDs() {
        const highestDrawnIds = {
            structures: -1,
            atoms: -1,
            bonds: -1,
            rings: -1,
            ringsystems: -1,
            distances: -1,
            interactions: -1,
            atomPairInteractions: -1,
            piStackings: -1,
            cationPiStackings: -1,
            hydrophobicContacts: -1,
            annotations: -1
        };
        for (const structure of Object.values(this.sceneData.structuresData.structures)) {
            highestDrawnIds.structures = Math.max(highestDrawnIds.structures, structure.id);
            highestDrawnIds.atoms = Math.max(highestDrawnIds.atoms, ...structure.atomsData.atomIds);
            highestDrawnIds.bonds = Math.max(highestDrawnIds.bonds,
                ...Object.keys(structure.edgesData.edgeById).map(Number)
            );
            highestDrawnIds.rings = Math.max(highestDrawnIds.rings,
                ...Object.keys(structure.ringsData.rings).map(Number)
            );
            highestDrawnIds.ringsystems = Math.max(highestDrawnIds.ringsystems,
                ...Object.keys(structure.ringsData.ringSystems).map(Number)
            );
        }
        highestDrawnIds.atomPairInteractions =
            Math.max(highestDrawnIds.atomPairInteractions
                ,...Object.keys(this.sceneData.intermolecularData.atomPairInteractions)
                .map(Number));
        highestDrawnIds.piStackings =
            Math.max(highestDrawnIds.piStackings,
                ...Object.keys(this.sceneData.intermolecularData.piStackings)
                .map(Number));
        highestDrawnIds.cationPiStackings =
            Math.max(...Object.keys(this.sceneData.intermolecularData.cationPiStackings)
                .map(Number));
        highestDrawnIds.distances =
            Math.max(highestDrawnIds.distances,
                ...Object.keys(this.sceneData.intermolecularData.distances)
                .map(Number));
        highestDrawnIds.interactions =
            Math.max(highestDrawnIds.interactions,
                ...Object.keys(this.sceneData.intermolecularData.interactions)
                .map(Number));
        highestDrawnIds.hydrophobicContacts =
            Math.max(highestDrawnIds.hydrophobicContacts,
                ...Object.keys(this.sceneData.hydrophobicData.hydrophobicContacts)
                .map(Number));
        highestDrawnIds.annotations =
            Math.max(highestDrawnIds.annotations,
                ...Object.keys(this.sceneData.annotationsData.annotations)
                .map(Number));
        return highestDrawnIds;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adapts structure ids to the currently highest used one such that
     * no id is used multiple times.
     */
    changeStructureIDs(diagramJson, highestDrawnIds, idMaps) {
        if (diagramJson.scene.hasOwnProperty('structures')) {
            diagramJson.scene.structures.forEach(function (mol, mIdx) {
                idMaps.structures[mol.id] = ++highestDrawnIds.structures;
                this[mIdx].id = idMaps.structures[mol.id];

                if (this[mIdx].hasOwnProperty('atoms')) {
                    mol.atoms.forEach(function (atom, aIdx) {
                        idMaps.atoms[atom.id] = ++highestDrawnIds.atoms;
                        this[aIdx].id = idMaps.atoms[atom.id];
                    }, diagramJson.scene.structures[mIdx].atoms)
                }

                if (this[mIdx].hasOwnProperty('bonds')) {
                    mol.bonds.forEach(function (bond, bIdx) {
                        this[bIdx].id = ++highestDrawnIds.bonds;
                        this[bIdx].from = idMaps.atoms[bond.from];
                        this[bIdx].to = idMaps.atoms[bond.to];
                    }, diagramJson.scene.structures[mIdx].bonds)
                }

                if (this[mIdx].hasOwnProperty('rings')) {
                    mol.rings.forEach(function (ring, rIdx) {
                        idMaps.rings[ring.id] = ++highestDrawnIds.rings;
                        this[rIdx].id = idMaps.rings[ring.id];
                        this[rIdx].atoms = ring.atoms.map(id => idMaps.atoms[id]);
                    }, diagramJson.scene.structures[mIdx].rings)
                }

                if (this[mIdx].hasOwnProperty('ringsystems')) {
                    mol.ringsystems.forEach(function (sys, sIdx) {
                        this[sIdx].id = ++highestDrawnIds.ringsystems;
                        this[sIdx].atoms = sys.atoms.map(id => idMaps.atoms[id]);
                    }, diagramJson.scene.structures[mIdx].ringsystems)
                }

            }, diagramJson.scene.structures);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adapts ids of a given intermolecular type to the currently highest used one
     * such that no id is used multiple times.
     */
    changeIntermolecularTypeIDs(json, highestDrawnIds, idMaps, type, fromMap, toMap) {
        if (json.scene.hasOwnProperty(type)) {
            json.scene[type].forEach(function (intermolecular, idx) {
                this[idx].id = ++highestDrawnIds[type];
                if (idMaps.structures.hasOwnProperty(intermolecular.fromStructure)) {
                    this[idx].fromStructure = idMaps.structures[intermolecular.fromStructure];
                }
                if (idMaps.structures.hasOwnProperty(intermolecular.toStructure)) {
                    this[idx].toStructure = idMaps.structures[intermolecular.toStructure];
                }
                if (idMaps[fromMap].hasOwnProperty(intermolecular.from)) {
                    this[idx].from = idMaps[fromMap][intermolecular.from];
                }
                if (idMaps[toMap].hasOwnProperty(intermolecular.to)) {
                    this[idx].to = idMaps[toMap][intermolecular.to];
                }
            }, json.scene[type]);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adapts ids of all intermolecular types to the currently highest used ones
     * such that no id is used multiple times.
     */
    changeIntermolecularIDs(diagramJson, highestDrawnIds, idMaps) {
        this.changeIntermolecularTypeIDs(diagramJson,
            highestDrawnIds,
            idMaps,
            'atomPairInteractions',
            'atoms',
            'atoms'
        );
        this.changeIntermolecularTypeIDs(diagramJson,
            highestDrawnIds,
            idMaps,
            'piStackings',
            'rings',
            'rings'
        );
        this.changeIntermolecularTypeIDs(diagramJson,
            highestDrawnIds,
            idMaps,
            'cationPiStackings',
            'rings',
            'atoms'
        );
        this.changeIntermolecularTypeIDs(diagramJson,
            highestDrawnIds,
            idMaps,
            'distances',
            'annotations',
            'annotations'
        );
        this.changeIntermolecularTypeIDs(diagramJson,
            highestDrawnIds,
            idMaps,
            'interactions',
            'annotations',
            'annotations'
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adapts ids of hydrophobic contacts to the currently highest used one
     * such that no id is used multiple times.
     */
    changeHydrophobicIDs(diagramJson, highestDrawnIds, idMaps) {
        if (diagramJson.scene.hasOwnProperty('hydrophobicContacts')) {
            diagramJson.scene.hydrophobicContacts.forEach(function (hydro, hIdx) {
                idMaps.hydrophobicContacts[hydro.id] = ++highestDrawnIds.hydrophobicContacts;
                this[hIdx].id = idMaps.hydrophobicContacts[hydro.id];
                if (idMaps.structures.hasOwnProperty(hydro.belongsTo)) {
                    this[hIdx].belongsTo = idMaps.structures[hydro.belongsTo];

                    hydro.controlPoints.forEach(function (cp, cIdx) {
                        if (cp.hasOwnProperty('atomLinks')) {
                            this[cIdx].atomLinks = cp.atomLinks.map(id => idMaps.atoms[id]);
                        }
                    }, diagramJson.scene.hydrophobicContacts[hIdx].controlPoints)
                }

            }, diagramJson.scene.hydrophobicContacts);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adapts ids of annotations to the currently highest used one
     * such that no id is used multiple times.
     */
    changeAnnotationIDs(diagramJson, highestDrawnIds, idMaps) {
        if (diagramJson.scene.hasOwnProperty('annotations')) {
            diagramJson.scene.annotations.forEach(function (anno, aIdx) {
                this[aIdx].id = ++highestDrawnIds.annotations;
                if (anno.belongsTo && idMaps.structures.hasOwnProperty(anno.belongsTo.id)) {
                    this[aIdx].belongsTo.id = idMaps.structures[anno.belongsTo.id];
                    if (this[aIdx].belongsTo.hasOwnProperty('atomLinks')) {
                        this[aIdx].belongsTo.atomLinks = this[aIdx].belongsTo.atomLinks
                            .map(id => idMaps.atoms[id]);
                    }
                }
            }, diagramJson.scene.annotations);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Preprocesses the JSON by moving all objects to the top left corner or
     * to specified coordinates of the current view area.
     *
     * @param diagramString {String} - diagram as string
     * @param coords {Object|optional} - coordinates to move diagram to
     * @return {String} - the string in JSON format with moved diagram
     */
    prepJsonCoordinates(diagramString, coords = undefined) {
        let diagramJson;
        try {
            diagramJson = JSON.parse(diagramString);
            const [moveX, moveY] = this.getMoveXY(diagramJson, coords);
            this.moveXY(diagramJson, moveX, moveY);
            return JSON.stringify(diagramJson);
        } catch (err) {
            console.log('Could not parse JSON:');
            console.log(err);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Preprocesses the JSON by moving all objects next to the currently loaded diagram(s) and
     * by altering the ids of added objects so that all ids are unique. This is only done, when
     * another diagram is already loaded
     *
     * @param diagramString {String} - diagram as string
     * @return {String} - the string in JSON format with moved diagram
     */
    prepAdditionalJsonCoordinatesUIds(diagramString, coords = undefined) {
        if (!this.sceneData.structuresData.structureLoaded) {
            return diagramString;
        }
        let diagramJson;
        try {
            diagramJson = JSON.parse(diagramString);
            //the center of the new diagram
            const diagramCenter = this.getDiagramCenter(diagramJson);
            //the mid point of the current scene
            const sceneMid = this.sceneData.globalLimits.mid;
            //move the center of the new diagramJson to the center of the current scene
            this.moveXY(
                diagramJson,
                diagramCenter.x - sceneMid.x,
                diagramCenter.y - sceneMid.y
            );
            //move to the left including some excess space in between the two diagrams
            this.moveXY(
                diagramJson,
                this.sceneData.globalLimits.width * 0.55,
                0
            );
            const moveLeftX = this.getDiagramWidthXright(diagramJson);
            this.moveXY(
                diagramJson,
                moveLeftX * 1.05,
                0
            );
            return this.prepJsonUIds(JSON.stringify(diagramJson));
        } catch (err) {
            console.log('Could not parse JSON:');
            console.log(err);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Determines necessary movement for the top left corner of the current view area or for
     * specific coordinates if given.
     *
     * @param diagramJson {Object} - diagram as object
     * @param coords {Object} - coordinates to move JSON objects to
     * @return {Array} - x and y coordinates
     */
    getMoveXY(diagramJson, coords = undefined) {
        let {xMin: drawerMinX, yMin: drawerMinY} = this.sceneData.globalLimits;
        if (coords) {
            drawerMinX = coords.x;
            drawerMinY = coords.y;
        }
        let minX = Infinity;
        let minY = Infinity;

        if (diagramJson.scene.hasOwnProperty('structures')) {
            diagramJson.scene.structures.forEach(function (mol) {
                if (mol.hasOwnProperty('atoms')) {
                    mol.atoms.forEach(function (atom) {
                        const coords = atom.coordinates;
                        if (minX > coords.x) minX = coords.x;
                        if (minY > coords.y) minY = coords.y;
                    })
                }
            });
        }

        if (diagramJson.scene.hasOwnProperty('hydrophobicContacts')) {
            diagramJson.scene.hydrophobicContacts
                .forEach(function (hydro) {
                    hydro.controlPoints.forEach(function (cp) {
                        if (minX > cp.x) minX = cp.x;
                        if (minY > cp.y) minY = cp.y;
                    })
                });
        }

        if (diagramJson.scene.hasOwnProperty('annotations')) {
            diagramJson.scene.annotations.forEach(function (anno) {
                const coords = anno.coordinates;
                if (minX > coords.x) minX = coords.x;
                if (minY > coords.y) minY = coords.y;
            });
        }

        const moveX = minX - drawerMinX;
        const moveY = minY - drawerMinY;
        return [moveX, moveY];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Executes the movement of a diagram by a specified length in x and y directions.
     *
     * @param diagramJson {Object} - diagram as object
     * @param moveX {Number} - movement length on x axis
     * @param moveY {Number} - movement length on y axis
     */
    moveXY(diagramJson, moveX, moveY) {
        if (diagramJson.scene.hasOwnProperty('structures')) {
            diagramJson.scene.structures.forEach(function (mol, mIdx) {
                if (mol.hasOwnProperty('atoms')) {
                    mol.atoms.forEach(function (atom, aIdx) {
                        this[aIdx].coordinates.x -= moveX;
                        this[aIdx].coordinates.y -= moveY;
                    }, diagramJson.scene.structures[mIdx].atoms)
                }
            });
        }

        if (diagramJson.scene.hasOwnProperty('hydrophobicContacts')) {
            diagramJson.scene.hydrophobicContacts
                .forEach(function (hydro, hIdx) {
                    hydro.controlPoints.forEach(function (cp, cIdx) {
                        this[cIdx].x -= moveX;
                        this[cIdx].y -= moveY;
                    }, diagramJson.scene.hydrophobicContacts[hIdx].controlPoints)
                });
        }

        if (diagramJson.scene.hasOwnProperty('annotations')) {
            diagramJson.scene.annotations.forEach(function (anno, aIdx) {
                this[aIdx].coordinates.x -= moveX;
                this[aIdx].coordinates.y -= moveY;
            }, diagramJson.scene.annotations);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Determines right extension of a diagram on the x axis with respect to its the midpoint.
     *
     * @param diagramJson {Object} - diagram as object
     * @return {Number} - extension of the diagram on the x axis
     */
    getDiagramWidthXright(diagramJson) {
        let xRight = undefined;
        const coordinates = [];

        if (diagramJson.scene.hasOwnProperty('structures')) {
            diagramJson.scene.structures.forEach(function (mol) {
                if (mol.hasOwnProperty('atoms')) {
                    mol.atoms.forEach(function (atom) {
                        const coords = atom.coordinates;
                        if (!xRight) {
                            xRight = coords.x;
                        } else if (xRight < coords.x) {
                            xRight = coords.x;
                        }
                        coordinates.push(coords);
                    })
                }
            });
        }

        if (diagramJson.scene.hasOwnProperty('hydrophobicContacts')) {
            diagramJson.scene.hydrophobicContacts
                .forEach(function (hydro) {
                    hydro.controlPoints.forEach(function (cp) {
                        if (!xRight) {
                            xRight = cp.x;
                        } else if (xRight < cp.x) {
                            xRight = cp.x;
                        }
                        coordinates.push({x: cp.x, y: cp.y});
                    })
                });
        }

        if (diagramJson.scene.hasOwnProperty('annotations')) {
            diagramJson.scene.annotations.forEach(function (anno) {
                const coords = anno.coordinates;
                if (!xRight) {
                    xRight = coords.x;
                } else if (xRight < coords.x) {
                    xRight = coords.x;
                }
                coordinates.push(coords);
            });
        }
        const geometricCenter = PointCalculation.findGeometricCenter(coordinates);
        //move to the left by this distance
        return (geometricCenter.x - xRight) * -1;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Determines geometric center of a diagram.
     *
     * @param diagramJson {Object} - diagram as object
     * @return {Object} - center of the diagram with x and y coordinates
     */
    getDiagramCenter(diagramJson) {
        const coordinates = [];

        if (diagramJson.scene.hasOwnProperty('structures')) {
            diagramJson.scene.structures.forEach(function (mol) {
                if (mol.hasOwnProperty('atoms')) {
                    mol.atoms.forEach(function (atom) {
                        const coords = atom.coordinates;
                        coordinates.push(coords);
                    })
                }
            });
        }

        if (diagramJson.scene.hasOwnProperty('hydrophobicContacts')) {
            diagramJson.scene.hydrophobicContacts
                .forEach(function (hydro) {
                    hydro.controlPoints.forEach(function (cp) {
                        coordinates.push({x: cp.x, y: cp.y});
                    })
                });
        }

        if (diagramJson.scene.hasOwnProperty('annotations')) {
            diagramJson.scene.annotations.forEach(function (anno) {
                const coords = anno.coordinates;
                coordinates.push(coords);
            });
        }
        return PointCalculation.findGeometricCenter(coordinates);
    }
}