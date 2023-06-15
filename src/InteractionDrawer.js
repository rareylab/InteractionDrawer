/**
 * Initializes the drawer and exposes the main functionality to the user.
 * The sceneData object contains the data of the current scene.
 * The svgComponent object represents the view.
 * The svgDrawer manipulates both in order to update data and view.
 * The userInteractionHandler processes interactions of the user with the draw area with the
 * svgDrawer and interactionState objects.
 * The interactionState tracks the current state of the draw area and user interactions.
 */
class InteractionDrawer {
    /**
     * Sets up the library transferring style preferences from a configuration
     * object and sets up the the main instances for data, view manipulation and
     * user interaction tracking/handling.
     *
     * @param svgId {String} - DOM id of the svg
     * @param opts {Object} - configuration options for the drawer
     */
    constructor(svgId, opts = null) {
        this.optsPreprocessor = new OptsPreprocessor(opts);
        this.optsPreprocessor.processOpts();
        this.opts = this.optsPreprocessor.getOpts();

        if (!InteractionDrawer.svgExists(svgId)) {
            console.log('ERROR: svg does not exist');
            return;
        }

        this.svgDom = d3.select('#' + svgId).style('touch-action', 'none')
        this.svgComponent = new SvgComponent(this.opts, this.svgDom, svgId);
        const info = this.svgComponent.getDrawAreaInfo();

        this.sceneData = new SceneData(this.opts);
        this.sceneData.setInfoForDrawing(info.width, info.height);
        this.interactionState = new InteractionState(this.opts, this.sceneData);

        this.svgDrawer =
            new SvgDrawer(this.opts, this.sceneData, this.interactionState, this.svgComponent);

        this.userInteractionHandler = new UserInteractionHandler(this.opts,
            this.sceneData,
            this.interactionState,
            this.svgDrawer
        );
        this.userInteractionHandler.bindDrawAreaResizeBehavior();
        this.userInteractionHandler.bindUserInteractionHandling();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks if draw area svg is available.
     *
     * @param svgId {String} - DOM id of the svg
     * @returns {Boolean} - false if svg element is not valid otherwise true
     */
    static svgExists(svgId) {
        if (typeof svgId === 'string') {
            const drawArea = document.getElementById(svgId);
            if (drawArea.tagName === 'svg') {
                return true;
            }
        }
        return false;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Serializes the inline browser SVG of the draw area, trim unnecessary
     * parts, then returns a Blob which contains the resulting string.
     *
     * @returns {Blob} - blob of serialized string in XML format containing inline
     * browser SVG information
     */
    getSvgBlob() {
        let xmlData = this.svgComponent.getSvgData()

        //get relevant scene data
        const {xMin, xMax, yMin, yMax} = this.sceneData.globalLimits;
        const {scale} = this.interactionState.transformParams;

        //set tight height and width for returned SVG with some excess space
        const excessSpace = 5;
        const sceneWidth = xMax - xMin + excessSpace * 2;
        const sceneHeight = yMax - yMin + excessSpace;
        //set fixed width and height in returned SVG data as attributes
        xmlData = xmlData.replace(/<svg.*?>/,
            (match) => {
                let xml1 = match.replace(
                    /width="[^"]*"/, `width="${sceneWidth * scale}"`
                );
                return xml1.replace(
                    /height="[^"]*"/, `height="${sceneHeight * scale}"`
                );
            });

        //functions to anchor current scene to upper left corner of draw area
        const curOrigin = this.interactionState.getRealCoordinates({x:0, y:0});
        const spaceLeft = -(curOrigin.x - xMin) - excessSpace / 2;
        const spaceTop = -(curOrigin.y - yMin) - excessSpace / 2;
        const correctWidth = (valStr) => {
            return (parseFloat(valStr) - spaceLeft).toString();
        };
        const correctHeight = (valStr) => {
            return (parseFloat(valStr) - spaceTop).toString();
        };

        //translate positional parameters of SVG elements via regex replace
        //carefully, something like -1e-8 can be set
        const nrRegexBase = '-?[0-9|e]+(?:.[0-9|e]+)?';
        const xParams = ['cx', 'x', 'x1', 'x2'];
        const yParams = ['cy', 'y', 'y1', 'y2'];
        //do not try to match path x- and y-values by a single regex, turns out
        //to be terrible performance-wise, rather match numbers lazy as (.*?)
        const paramRegexStr = `((?: |<))(${xParams.join('|')}|` +
            `${yParams.join('|')}|path d)(=")(.*?)(")`;
        const pathRegexStr = `(${nrRegexBase})( *)(${nrRegexBase})`;
        //define replacement function to be used
        const convertNumbers = (param, nrStr) => {
            if (param === 'path d'){
                return nrStr.replace(new RegExp(pathRegexStr, 'g'),
                    (match, p1, p2, p3) => {
                        return correctWidth(p1) + p2 + correctHeight(p3);
                    })
            } else if (xParams.includes(param)) {
                return correctWidth(nrStr);
            } else { //yParams.includes(param)
                return correctHeight(nrStr);
            }
        };
        //apply the full regex to the data string
        xmlData = xmlData.replace(new RegExp(paramRegexStr, 'g'),
            (match, p0, p1, p2, p3, p4) => {
                return p0 + p1 + p2 + convertNumbers(p1, p3) + p4;
            });
        return new Blob([xmlData], {type: 'image/svg+xml'});
    }

    /*----------------------------------------------------------------------*/

    /**
     * Serializes the JSON data of the draw area and
     * then returns a Blob which contains the resulting string.
     *
     * @returns {Blob} - blob of serialized JSON data
     */
    getJsonBlob() {
        const jsonBuilder = new JsonBuilder(this.sceneData, this.opts);
        return new Blob([jsonBuilder.getJson(true, true)], {type: 'application/json'});
    }

    /*----------------------------------------------------------------------*/

    /**
     * Serializes the JSON data of the draw area including the config
     * and then returns a Blob which contains the resulting string.
     *
     * @returns {Blob} - blob of serialized JSON data including the config
     */
    getJsonBlobWithConfig() {
        const jsonBuilder = new JsonBuilder(this.sceneData, this.opts);
        return new Blob(
            [jsonBuilder.getJsonWithConfig(true, true)],
            {type: 'application/json'}
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Serializes the JSON data of the draw area and returns the resulting string.
     *
     * @returns {Object} - JSON data
     */
    getJson() {
        const jsonBuilder = new JsonBuilder(this.sceneData, this.opts);
        return jsonBuilder.getJson(true, true);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Serializes the interaction data of the draw area and then returns a Blob
     * which contains the resulting string.
     *
     * @returns {Object} - blob of serialized interaction data
     */
    getTxtBlob() {
        const textBuilder = new TextBuilder(this.sceneData);
        return new Blob(
            [textBuilder.getInteractionsText(this.sceneData)],
            {type: 'text/plain'}
        );
    }

    /*----------------------------------------------------------------------*/

    /**
     * Binds a set of interaction modes to specified mouse button presses with
     * optional modifiers. If a combination of mouse button and modifiers already
     * exists to trigger another interaction mode it gets deleted. It is not
     * recommended to bin any interaction to right click and one of the modifiers
     * being shift as this will trigger the contextmenu in firefox by releasing
     * the mouse button.
     *
     * @param interactions {Object} - holds interaction modes and pressed mouse
     * buttons with modifiers. The object of is structured as follows, where
     * interactionMode is e.g. movement, the key corresponds to the mouse button
     * and valid modifiers are 'ctrl','alt', and 'shift'
     * {
     *     interactionMode1:
     *     [
     *         {
     *             key: 0,
     *             modifiers: ['shift', 'alt']
     *         },{
     *             key: 1,
     *             modifiers: []
     *         }
     *     ],
     *     interactionMode2: [...],
     *     ...
     * }
     * @param clearAll {Boolean} - if true removes all previous bound interactions
     */
    addMouseInteractions(interactions, clearAll = false) {
        if (clearAll) this.opts.buttons.mouse = {};
        for (const [mode, configs] of Object.entries(interactions)) {
            for (const config of configs) {
                this.optsPreprocessor.addMouseInteraction(mode, config.key, config.modifiers);
            }
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Create a scene in the draw area based on a string in JSON format.
     *
     * @param jsonString {String} - string in JSON format representing the scene
     * @param center {Boolean} - whether to center the scene after adding the new
     * elements
     * added json based on already loaded jsons
     */
    addByJSON(jsonString, center = true) {
        if (!jsonString) {
            console.log('ERROR parsing: no JSON provided');
            return;
        }
        try {
            this.userInteractionHandler.addHandler.addToScene(jsonString, center);
        } catch (err) {
            console.log('ERROR parsing: Could not parse JSON:');
            console.log(err);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Use the ProteinsPlus REST API and create a scene in the draw area based
     * on either a PDB code or ProteinsPlus job id of an uploaded file and a ligand name.
     *
     * @param id {String} - 4 letter PDB code or ProteinsPlus id of an uploaded PDB file
     * @param ligandName {String} - name of the ligand in format molecule_chain_number,
     * e.g., 4SP_A_1298
     * @param reset {Boolean} - resets the scene before adding the diagram
     * @param processingCallback {Function} - callback to be called while the diagram is still
     * loading
     * @param loadedCallback {Function} -  callback to be called after the loading of the diagram
     * has finished
     * @param errorCallback {Function} - callback to be called if the diagram could not be loaded
     * and an error occurred
     */
    addById(id, ligandName, reset = true, {
        processingCallback,
        loadedCallback,
        errorCallback
    } = {}) {
        const download = async () => {
            const responsePost = await fetch(
                'https://proteins.plus/api/poseview2_rest',
                {
                    method: 'POST',
                    body: '{"poseview2": {"pdbCode":"' + id +
                        '","ligand":"' + ligandName + '"}}',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
            const jsonPost = await responsePost.json();

            //job will be executed or results already exists
            if (jsonPost.status_code === 202 || jsonPost.status_code === 200) {
                let polling = true;
                const delay = ms => new Promise(res => setTimeout(res, ms));

                while (polling) {

                    const responseGet = await fetch(jsonPost.location, {method: 'GET'});
                    const jsonGetStatus = await responseGet.json();

                    //still calculating?
                    if (jsonGetStatus.status_code === 200) {
                        polling = false;
                        const responseGetResults = await fetch(
                            jsonGetStatus.result_json,
                            {method: 'GET'}
                        );
                        const jsonGetResults = await responseGetResults.json();
                        if (reset || !this.sceneData.structuresData.structureLoaded) {
                            this.userInteractionHandler.removeHandler.fullReset();
                            this.addByJSON(JSON.stringify(jsonGetResults));
                        } else {
                            const jsonPreprocessor = new JsonPreprocessor(this.sceneData);
                            const  preprocessedDiagram =
                                jsonPreprocessor.prepAdditionalJsonCoordinatesUIds(
                                JSON.stringify(jsonGetResults)
                            );
                            this.addByJSON(preprocessedDiagram);
                        }
                        if (loadedCallback) {
                            loadedCallback();
                        }
                    } else if (jsonGetStatus.status_code === 202) {
                        if (processingCallback) {
                            processingCallback();
                        }
                        await delay(3000);
                    } else {
                        if (errorCallback) {
                            errorCallback();
                        }
                        console.log('ERROR: Could not download diagram');
                    }
                }
            } else {
                if (errorCallback) {
                    errorCallback();
                }
                console.log('ERROR: Could not download diagram');
            }
        }
        download();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Use the ProteinsPlus REST API and create a scene in the draw area based
     * on the content of a PDB file and a ligand name.
     *
     * @param fileContent {String} - file content of a PDB file
     * @param ligandName {String} - name of the ligand in format molecule_chain_number,
     * e.g., 4SP_A_1298
     * @param reset {Boolean} - resets the scene before loading the diagram
     * @param processingCallback {Function} - callback to be called while the diagram is still
     * loading
     * @param loadedCallback {Function} -  callback to be called after the loading of the diagram
     * has finished
     * @param errorCallback {Function} - callback to be called if the diagram could not be loaded
     * and an error occurred
     */
    addByFile(fileContent, ligandName, reset = true, {
        processingCallback,
        loadedCallback,
        errorCallback
    } = {}) {
        const upload = async () => {
            const form = new FormData();
            form.append(
                'pdb_file[pathvar]',
                new File([fileContent],
                    '/custom.pdb')
            );
            const responsePost = await fetch(
                'https://proteins.plus/api/pdb_files_rest',
                {
                    method: 'POST',
                    headers: {'Accept': 'application/json'},
                    body: form
                }
            );
            const jsonPost = await responsePost.json();

            if (responsePost.status === 202) {
                let polling = true;
                const delay = ms => new Promise(res => setTimeout(res, ms));

                while (polling) {
                    const responseGet = await fetch(jsonPost.location, {method: 'GET'});
                    const jsonGetStatus = await responseGet.json();

                    //still calculating?
                    if (responseGet.status === 200) {
                        polling = false;
                        this.addById(jsonGetStatus.id, ligandName, reset, {
                            processingCallback, loadedCallback, errorCallback
                        })
                    } else if (responseGet.status === 202) {
                        if (processingCallback) {
                            processingCallback();
                        }
                        await delay(3000);
                    } else {
                        if (errorCallback) {
                            errorCallback();
                        }
                        console.log('ERROR: Could not upload file');
                    }
                }
            } else {
                if (errorCallback) {
                    errorCallback();
                }
                console.log('ERROR: Could not upload file');
            }
        }
        upload();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Subscribe a number of callbacks to the drawer which are called at
     * different change steps.
     *
     * @param preprocessCallback {Function} - callback to be called before
     * processing JSON input during the creation of a new scene. Input for the
     * callback is the provided scene data in form of an object
     * Ex.: (scene) => { //preprocess the JSON info, e.g. scene.atoms //}
     *
     * @param sceneChangeCallback {Function} - callback to be called right
     * after fundamental parts of the scene have changed (i.e., coordinates or
     * existence of elements)
     * @param colorCallback {Function} - callback to be called right after
     * color changes have been applied to the scene
     * Ex. (any of the above): (sceneData) => { //do something with given
     * JSON string detailing new configuration of the scene //}
     *
     * @param hoverCallback {Function} - callback to be called after an
     * element has been hit during hover
     * Ex.: (hit) => { //check hit.type to see what element is hit, then
     * perform actions accordingly //}
     *
     * @param selectionCallback {Function} - callback to be called after the
     * current selection (of atoms/bonds) changes
     * Ex.: (info) => { //check info.type to see what element is hit and
     * info.selectionType for type of selection ('select' or 'unselect'), then
     * perform actions accordingly //}
     * @param clickInTheBlankCallback {Function} - callback to be called after the
     * the scene was clicked in the blank
     * @param multiSelectionCallback {Function} - callback to be called after the lasso or rectangle
     * selection has finished
     * @param removeCallback {Function} - callback to be called after removing of objects in the
     * scene
     * @param optsCallback {Function} - callback for the inspection of the opts used for the
     * corresponding history step
     */
    setCallbacks({
        preprocessCallback,
        sceneChangeCallback,
        colorCallback,
        hoverCallback,
        selectionCallback,
        clickInTheBlankCallback,
        multiSelectionCallback,
        removeCallback,
        optsCallback
    }) {
        if (preprocessCallback) {
            this.svgDrawer.preprocessCallback = preprocessCallback;
        }
        if (sceneChangeCallback) {
            this.svgDrawer.historyDrawer.sceneChangeCallback = sceneChangeCallback;
        }
        if (colorCallback) {
            this.svgDrawer.historyDrawer.colorCallback = colorCallback;
        }
        if (optsCallback) {
            this.svgDrawer.historyDrawer.optsCallback = optsCallback;
        }
        if (hoverCallback) {
            this.userInteractionHandler.hoverHandler.hoverCallback = hoverCallback;
        }
        if (selectionCallback) {
            this.svgDrawer.atomDrawer.selectionCallback = selectionCallback;
            this.svgDrawer.edgeDrawer.selectionCallback = selectionCallback;
            this.svgDrawer.annotationDrawer.selectionCallback = selectionCallback;
            this.svgDrawer.intermolecularDrawer.selectionCallback = selectionCallback;
            this.svgDrawer.structureCircleDrawer.selectionCallback = selectionCallback;
        }
        if (clickInTheBlankCallback) {
            this.userInteractionHandler.clickSelectionHandler.clickInTheBlankCallback =
                clickInTheBlankCallback;
        }
        if (multiSelectionCallback) {
            this.userInteractionHandler.lassoSelectionHandler.multiSelectionCallback =
                multiSelectionCallback;
            this.userInteractionHandler.rectangleSelectionHandler.multiSelectionCallback =
                multiSelectionCallback;
        }
        if (removeCallback) {
            this.svgDrawer.removeCallback = removeCallback;
        }
    }
}