/**
 * Validates drawer's input JSON and outputs warning/error messages.
 */
class JsonValidator {
    /**
     * Contains instance for data access.
     */
    constructor(sceneData) {
        this.sceneData = sceneData;
        this.errorLogger = [];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks annotation in JSON format.
     *
     * @param labelInfo {Object} - annotation in JSON format
     * @param i {Number} - annotation index in JSON
     * @param jsonKey {String} - name of the field in the input
     * @returns {Boolean} - false if input is not valid
     */
    annotationJSONerror(labelInfo, i, jsonKey) {
        const errPrefix = JsonValidator.createErrorPrefixByIdx(jsonKey, i);
        if (this.checkJSONStructure(labelInfo,
            jsonKey,
            i,
            this.sceneData.annotationsData.annotations,
            errPrefix,
            true
        ).error) {
            return true;
        }

        const belongsTo = labelInfo.belongsTo;

        //further sanity checks
        if (belongsTo) {
            let errMsg = '';
            const belongsPrefix = 'Field "belongsTo": ';
            let validSid = true;
            if (!this.sceneData.structuresData.structures.hasOwnProperty(belongsTo.id)) {
                errMsg += belongsPrefix + '"id" does not match any ' + 'structure!';
                validSid = false;
            }
            if (!['structure', 'structureSpline']
                .includes(belongsTo.type)) {
                if (errMsg) errMsg += ' ';
                errMsg += belongsPrefix + '"type" must match ' +
                    'either "structure" or "structureSpline"!'
            }
            if (validSid && belongsTo.hasOwnProperty('atomLinks')) {
                const badAtomLinks = [];
                const checkStructure = this.sceneData.structuresData.structures[belongsTo.id];
                belongsTo.atomLinks.forEach((atomLink, i) => {
                    if (!checkStructure.atomsData.atomIds.includes(atomLink)) {
                        badAtomLinks.push(i);
                    }
                });
                if (badAtomLinks.length) {
                    if (errMsg) errMsg += ' ';
                    errMsg += belongsPrefix + `"atomLinks" contains ` +
                        `references to non-existing atom` +
                        `${badAtomLinks.length > 1 ? 's' : ''} (` +
                        `position${badAtomLinks.length > 1 ? 's' : ''}` +
                        ` ${badAtomLinks.join(', ')})`;
                }
            }

            if (errMsg) {
                console.log(errPrefix + errMsg);
                this.errorLogger.push(errPrefix + errMsg);
                return true;
            }
        }
        return false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks hydrophobic contact in JSON format.
     *
     * @param hydrophobicInfo {Object} - hydrophobic contact in JSON format
     * @param i {Number} - hydrophobic contact index in JSON
     * @param jsonKey {String} - name of the field in the input
     * @returns {Boolean} - false if input is not valid
     */
    hydrophobicJSONerror(hydrophobicInfo, i, jsonKey) {
        const errPrefix = JsonValidator.createErrorPrefixByIdx(jsonKey, i);
        //set container parameter to false here to prevent the unique id
        //error message because we can add control points to a existing
        //hydrophobic contact
        if (this.checkJSONStructure(hydrophobicInfo, jsonKey, i, false, errPrefix, true).error) {
            return true;
        }
        const {
            belongsTo: belongsTo, controlPoints: controlPoints
        } = hydrophobicInfo;

        //further sanity checks
        if (!this.sceneData.structuresData.structures.hasOwnProperty(belongsTo)) {
            const error = errPrefix + 'Field "belongsTo" does not ' + 'refer to a valid structure!';
            console.log(error);
            this.errorLogger.push(error);
            return true;
        }
        const structure = this.sceneData.structuresData.structures[belongsTo];
        const badAtomLinks = {};
        controlPoints.forEach((cpInfo, cpPos) => {
            if (cpInfo.hasOwnProperty('atomLinks')) {
                cpInfo.atomLinks.forEach((atomLink, linkPos) => {
                    if (!structure.atomsData.atomIds.includes(atomLink)) {
                        if (!badAtomLinks.hasOwnProperty(cpPos)) {
                            badAtomLinks[cpPos] = [];
                        }
                        badAtomLinks[cpPos].push(linkPos);
                    }
                });
            }
        });
        let errMsg = '';
        for (const cpPos in badAtomLinks) {
            if (errMsg) errMsg += ' ';
            errMsg += `Field "control points": "[${cpPos}]": ` +
                `"atomLinks" contains references to non-existing atom` +
                `${badAtomLinks[cpPos].length > 1 ? 's' : ''} ` +
                `(position${badAtomLinks[cpPos].length > 1 ? 's' : ''} ` +
                `${badAtomLinks[cpPos].join(', ')})!`;
        }
        if (errMsg) {
            console.log(errPrefix + errMsg);
            this.errorLogger.push(errPrefix + errMsg);
            return true;
        }
        return false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks by intermolecular edge connected structures in JSON format.
     *
     * @param interactionInfo {Object} - intermolecular edge in JSON format
     * @param i {Number} - intermolecular edge index in JSON
     * @param jsonKey {String} - name of the field in the input
     * @returns {Boolean} - false if input is not valid
     */
    intermolecularMolJSONerror(interactionInfo, i, jsonKey) {
        const errPrefix = JsonValidator.createErrorPrefixByIdx(jsonKey, i);
        if (this.checkJSONStructure(interactionInfo,
            jsonKey,
            i,
            this.sceneData.intermolecularData[jsonKey],
            errPrefix,
            true
        ).error) {
            return true;
        }

        let errMsg = '';
        if (!interactionInfo.fromStruct) {
            errMsg += `Field "fromStructure" does not refer to a valid ` + `structure!`;
        }
        if (!interactionInfo.toStruct) {
            if (errMsg) errMsg += ' ';
            errMsg += `Field "toStructure" does not refer to a valid ` + `structure!`;
        }
        if (errMsg) {
            console.log(errPrefix + errMsg);
            this.errorLogger.push(errPrefix + errMsg);
            return true;
        }
        return false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks intermolecular edge end point in JSON format.
     *
     * @param interactionInfo {Object} - intermolecular edge in JSON format
     * @param i {Number} - intermolecular edge index in JSON
     * @param jsonKey {String} - name of the field in the input
     * @returns {Boolean} - false if input is not valid
     */
    intermolecularEndPointJSONerror(interactionInfo, i, jsonKey) {
        const errPrefix = JsonValidator.createErrorPrefixByIdx(jsonKey, i);
        let errMsg = '';
        if (!interactionInfo.fromObj) {
            errMsg = errPrefix + `Structure ${interactionInfo.fromStructure} does not ` +
                `contain an interaction endpoint with ID ${interactionInfo.from}!`;
        }
        if (!interactionInfo.toObj) {
            if (errMsg) errMsg += ' ';
            errMsg +=
                `Structure ${interactionInfo.toStructure} does not contain an interaction endpoint with ` +
                `with ID ${interactionInfo.to}!`;
        }
        if (errMsg) {
            console.log(errPrefix + errMsg);
            this.errorLogger.push(errPrefix + errMsg);
            return true;
        }
        if (jsonKey !== 'distances' && jsonKey !== 'interactions' &&
            interactionInfo.fromStructure === interactionInfo.toStructure &&
            interactionInfo.from === interactionInfo.to) {
            const endpointsErrorMsg = errPrefix + 'The two given endpoint ids are the same!';
            console.log(endpointsErrorMsg);
            this.errorLogger.push(endpointsErrorMsg);
            return true;
        }
        return false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks structure in JSON format.
     *
     * @param structureInfo {Object} - structure in JSON format
     * @param i {Number} - structure index in JSON
     * @returns {Boolean} - false if input is not valid
     */
    structureJSONerror(structureInfo, i) {
        const jsonKey = 'structures';
        const errPrefix = JsonValidator.createErrorPrefixByIdx(jsonKey, i);
        if (this.checkJSONStructure(structureInfo,
            jsonKey,
            i,
            this.sceneData.structuresData.structures,
            errPrefix,
            true
        ).error) {
            return true;
        }
        return false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks structure content (atoms, bonds) in JSON format.
     *
     * @param structureInfo {Object} - structure in JSON format
     * @param i {Number} - structure index in JSON
     * @returns {Boolean} - false if input is not valid
     */
    structureNestedJSONerror(structureInfo, i) {
        const jsonKey = 'structures';
        const errPrefix = JsonValidator.createErrorPrefixByIdx(jsonKey, i);
        //sanity checks on all relevant fields
        //assumes that prop name in structure info is same as in JSON base!
        let errOccurred = false;
        let errMsg = '';
        const handleError = (msg) => {
            if (errOccurred) errMsg += ' ';
            errMsg += msg;
            errOccurred = true;
        };
        //structure is only build if no errors in JSON -> use dummy containers
        const atomContainer = {};

        //sanity check atoms
        this.checkStructureContentJSONerror(structureInfo, 'atoms', (i) => {
            return `Field atoms at position ${i}: `
        }, handleError, atomContainer);
        //sanity check bonds
        const createPrefixBonds = (i) => {
            return `Field "bonds" at position ${i}: `;
        };
        if (!this.checkStructureContentJSONerror(structureInfo,
            'bonds',
            createPrefixBonds,
            handleError,
            {}
        )) {
            structureInfo.bonds.forEach(({from, to, type}, i) => {
                let errMsg = '';
                if (from === to) {
                    errMsg += 'Fields "from" and "to" are the same!';
                }
                if (!atomContainer.hasOwnProperty(from)) {
                    if (errMsg) errMsg += ' ';
                    errMsg += 'Field "from" does not match any atom!';
                }
                if (!atomContainer.hasOwnProperty(to)) {
                    if (errMsg) errMsg += ' ';
                    errMsg += 'Field "to" does not match any atom!';
                }
                if (errMsg) {
                    handleError(createPrefixBonds(i) + errMsg);
                }
            });
        }
        //prepare checking of atom ids in arrays (rings)
        const checkAtomArr = (ringObj, createPrefix, idx) => {
            const badIdxs = [];
            ringObj.atoms.forEach((atomId, i) => {
                if (!atomContainer.hasOwnProperty(atomId)) badIdxs.push(i);
            });
            if (badIdxs.length) {
                handleError(createPrefix(idx) + 'Given atoms do not match ' +
                    `any atom (at positions ${badIdxs.join(', ')}).`);
            }
        };
        //sanity check rings
        if (structureInfo.rings) {
            const createPrefixRings = (i) => {
                return `Field rings at position ${i}: `;
            };
            if (!this.checkStructureContentJSONerror(structureInfo,
                'rings',
                createPrefixRings,
                handleError,
                {}
            )) {
                structureInfo.rings.forEach((ringInfo, i) => {
                    checkAtomArr(ringInfo, createPrefixRings, i);
                });
            }
        }
        //sanity check ring systems
        if (structureInfo.ringsystems) {
            const createPrefixRingSys = (i) => {
                return `Field ringsystems at position ${i}: `;
            };
            if (!this.checkStructureContentJSONerror(structureInfo,
                'ringsystems',
                createPrefixRingSys,
                handleError,
                {}
            )) {
                structureInfo.ringsystems.forEach((ringSysInfo, i) => {
                    checkAtomArr(ringSysInfo, createPrefixRingSys, i);
                });
            }
        }
        //log accumulated error message
        if (errOccurred) {
            console.log(errPrefix + errMsg);
            this.errorLogger.push(errPrefix + errMsg);
            return true;
        }
        return false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks a certain object type of a structure in JSON format.
     *
     * @param structureInfo {Object} - structure in JSON format
     * @param jsonKey {String} - name of the Structure object type field (e.g. "atoms")
     * in the input
     * @param createPrefixFn {Function} - creates the prefix for an error message
     * @param handleError {Function} - tracks error and extends error message
     * @param container {Object} - container object in which the drawer saves
     * new elements based on information from the input object
     * @returns {Boolean} - false if input is not valid
     */
    checkStructureContentJSONerror(structureInfo, jsonKey, createPrefixFn, handleError, container) {
        const jsonArr = structureInfo[jsonKey];
        let {error, msg} = this.checkJSONStructureArray(jsonArr, jsonKey, false);
        if (error) { //ignore original msg
            handleError(`Field ${jsonKey} is not an Array!`);
            return true;
        }
        let errFound = false;
        jsonArr.forEach((jsonObj, i) => {
            ({error, msg} = this.checkJSONStructure(jsonObj, jsonKey, i, container, '', false));
            if (error) {
                errFound = true;
                handleError(createPrefixFn(i) + msg);
                return;
            }
            container[jsonObj.id] = true;
        });
        return errFound;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks whether one of the fields given in an input object to create a new
     * scene in the draw area is an array. If not, create an error message
     * based on the name of the property.
     *
     * @param jsonArray {*} - variable to check whether it is an array
     * @param jsonKey {String} - name of the field in the input
     * @param logError {Boolean} - whether to immediately log the error when
     * the given input is not an array
     * @returns {Object} - report of the error: whether an error occurred
     * (field "error") and the related error message (field "msg")
     */
    checkJSONStructureArray(jsonArray, jsonKey, logError = true) {
        const report = {
            error: false, msg: ''
        };
        const name = JSONSceneStructure[jsonKey]().ref;
        //check if given JSON array is actually array
        if (!Array.isArray(jsonArray)) {
            report.error = true;
            report.msg = `Skipped drawing of ${name}s: must be given in form ` + `of an Array!`;
        }
        if (logError && report.error) {
            console.log(report.msg);
            this.errorLogger.push(report.msg)
        }
        return report;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks whether the structure and types of fields of a given object
     * present in the input object to create a new scene matches the expected
     * structure and types of fields as logged in JSON_Base_Structures.js.
     * Return information on possible mismatches.
     *
     * @param jsonToCheck {Object} - object to check
     * @param jsonKey {String} - name of the field in which the object is
     * located
     * @param idx {Number} - position of the checked object in the array the
     * field maps to
     * @param container {Object} - container object in which the drawer saves
     * new elements based on information from the input object
     * @param errPrefix {String} - prefix for an error message
     * @param logError {Boolean} - whether to immediately log the error when
     * the given input does not match the expected structure or types
     * @returns {Object} - report of the error: whether an error occurred
     * (field "error") and the related error message (field "msg")
     */
    checkJSONStructure(jsonToCheck, jsonKey, idx, container, errPrefix = '', logError = true) {
        const report = {
            error: false, msg: '', missing: [], badTypes: []
        };
        //sanity check given parameters
        if (jsonToCheck.constructor.name !== 'Object') {
            report.error = true;
            report.msg = 'Not an Object.';
        }
        //compare given structure with correct structure blueprint
        const correctJson = JSONSceneStructure[jsonKey]();
        if (!report.error) {
            this.recCompareObjectStructures(jsonToCheck, correctJson, report);
        }
        //check uniqueness of id in given container
        if (!report.error && container) {
            if (container.hasOwnProperty(jsonToCheck.id)) {
                report.error = true;
                report.msg = 'ID is not unique!';
            }
        }
        //finalize error message and log to console if requested
        if (report.error) {
            report.msg = errPrefix + report.msg;
            if (logError) {
                console.log(report.msg);
                this.errorLogger.push(report.msg);
            }
        }
        return report;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Recursively compares the structure and types of fields of a given input
     * object with a blueprint of the expected structure.
     *
     * @param jsonToCheck {Object} - the object to check
     * @param correctJson {Object} - the blueprint to check against
     * @param report {Object} - report of the error: whether an error occurred
     * (field "error") and the related error message (field "msg")
     */
    recCompareObjectStructures(jsonToCheck, correctJson, report) {
        //during check, log which properties are missing or of wrong type
        //start of recursion check
        this.recursiveJSONcheck(report, jsonToCheck, correctJson.required, [], false);
        if (correctJson.hasOwnProperty('optional')) {
            this.recursiveJSONcheck(report, jsonToCheck, correctJson.optional, [], true);
        }

        //construct error message after recursion check is done
        const mLen = report.missing.length;
        const btLen = report.badTypes.length;
        if (!mLen && !btLen) { //structure okay, shortcut return
            return;
        }
        let errMsg = '';
        const reducePredArr = (predArr) => {
            const len = predArr.length;
            return predArr.reduce((accStr, prop, i) => {
                return accStr + `\"${prop}\"${i < len - 1 ? ': ' : ''}`;
            }, '');
        };
        if (mLen) {
            errMsg += 'Missing the following fields: ';
            errMsg += Helpers.orderedStringFromArr(report.missing.map(predArr => {
                return reducePredArr(predArr);
            }));
        }
        if (btLen) {
            if (mLen) errMsg += ' ';
            errMsg += 'Fields have wrong type: ';
            errMsg += Helpers.orderedStringFromArr(report.badTypes.map(({props, reqType}) => {
                const propString = reducePredArr(props);
                return `${propString} (should be ${reqType})`;
            }));
        }
        report.error = true;
        report.msg = errMsg;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Recursive step that compares the structure and types of fields of a
     * given input object with a blueprint of the expected structure.
     *
     * @param report {Object} - report of the error: whether an error occurred
     * (field "error") and the related error message (field "msg")
     * @param jsonToCheck {Object} - the object to check
     * @param correctJson {Object} - the blueprint to check against
     * @param predArr {Array} - array of properties to check
     * @param optional {Boolean} - whether the entry is optional
     */
    recursiveJSONcheck(report, jsonToCheck, correctJson, predArr, optional = false) {
        for (const prop in correctJson) {
            //add prop to currently checked chain of properties
            const extArr = predArr.slice();
            extArr.push(prop);
            //check if property exists in provided JSON
            if (!jsonToCheck.hasOwnProperty(prop)) {
                if (!optional && !correctJson[prop].isOptional) {
                    report.missing.push(extArr);
                }
                continue;
            }

            //type checking initialisation
            const curVal = jsonToCheck[prop];
            let corVal = correctJson[prop];
            const curType = (curVal === null) ? null : curVal.constructor.name;
            let corType = (corVal === null) ? null : corVal.constructor.name;
            const compareTypes = () => {
                if (curType !== corType) {
                    report.badTypes.push({
                        props: extArr, reqType: corType
                    });
                    return false;
                }
                return true;
            };

            //special helper types first
            //duck typing for JSONChoice class as uglify strips class name
            if (corVal.isChoice) {
                const {typeMatches, typeChoices} = JsonValidator.checkTypes(corVal,
                    curVal,
                    curType,
                    corType
                );
                if (!typeMatches) {
                    report.badTypes.push({
                        props: extArr, reqType: typeChoices
                    });
                    continue;
                }
                //duck typing for SpecificString class
            } else if (corVal.isSpecificString) {
                if (!corVal.checkString(curVal)) {
                    report.badTypes.push({
                        props: extArr, reqType: corVal.stringsToChoice()
                    });
                    continue;
                }
                //duck typing for JSONOptional class
            } else if (corVal.isOptional) {
                corVal = corVal.value;
                corType = (corVal === null) ? null : corVal.constructor.name;
                if (!compareTypes()) continue;
            } else {
                if (!compareTypes()) continue;
            }
            this.nextRecursiveCheck(report, curVal, corVal, corType, extArr);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks and compares with blueprint structure and types of fields of JSON object.
     *
     * @param report {Object} - report of the error: whether an error occurred
     * (field "error") and the related error message (field "msg")
     * @param curVal {*} - value in the JSON that has to be checked
     * @param corVal {*} - value in the blueprint
     * @param corType {*} - type in the blueprint
     * @param extArr {*} -
     */
    nextRecursiveCheck(report, curVal, corVal, corType, extArr) {
        //recursion for objects
        if (corType === 'Object') {
            this.recursiveJSONcheck(report, curVal, corVal, extArr, false);
        }
        //recursion for arrays
        if (corType === 'Array') {
            const blueprint = corVal[0];
            corType = blueprint.constructor.name;
            curVal.forEach((nextVal, i) => {
                const itArr = extArr.slice();
                itArr.push(`[${i}]`);
                if (corType !== 'Object' && nextVal.constructor.name !== corType) {
                    report.badTypes.push({
                        props: itArr, reqType: corType
                    });
                    return;
                }
                this.recursiveJSONcheck(report, nextVal, blueprint, itArr, false);
            });
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks and compares JSON type of field with type in the blueprint.
     *
     * @param corVal {*} - value in the JSON that has to be checked
     * @param curVal {*} - value in the blueprint
     * @param curType {*} - type in the JSON that has to be checked
     * @param corType {*} - type in the blueprint
     */
    static checkTypes(corVal, curVal, curType, corType) {
        const choices = corVal.choices;
        let typeMatches = false;
        let typeChoices = '';
        for (let i = 0; i < choices.length; ++i) {
            corVal = choices[i];
            //duck typing for SpecificStrings class
            if (corVal && corVal.isSpecificString) {
                if (corVal.checkString(curVal)) {
                    typeMatches = true;
                    break;
                } else {
                    if (i !== 0) typeChoices += '|';
                    typeChoices += corVal.stringsToChoice();
                    continue;
                }
            }
            corType = choices[i] === null ? null : choices[i].constructor.name;
            if (curType === corType) {
                typeMatches = true;
                break;
            } else {
                if (i !== 0) typeChoices += '|';
                typeChoices += corType
            }
        }
        return {typeMatches, typeChoices};
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the prefix for an error message when checking the entries of a
     * specific array in the input object to create a new scene in the draw
     * area.
     *
     * @param jsonKey {String} - name of the field in which checked entries
     * are located
     * @param idx {Number} - position of the checked object in the array
     * @returns {String} - the prefix
     */
    static createErrorPrefixByIdx(jsonKey, idx) {
        const name = JSONSceneStructure[jsonKey]().ref;
        return `Skipped drawing of ${name} at Array position ${idx}: `;
    }
}
