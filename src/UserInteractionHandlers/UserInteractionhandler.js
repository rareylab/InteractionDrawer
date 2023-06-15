/**
 * Binds event listeners to certain components of the draw area.
 * Specific user interactions are processed by more specialized handlers.
 * Tracks the current user interaction state (e.g. selected atoms or if the
 * draw area is hovered) and updates the data and the draw area via drawers.
 * The user interaction processing starts with the initial mouse hovering
 * Hovered draw objects are added to the InteractionState for tracking as potential
 * selection candidates (bindContinuousInteraction -> HoverHandler -> handleHover).
 * Based on further mouse and keyboard usage a specific interaction mode is set,
 * tracked and processed (bindStartInteraction -> startUserInteraction ->
 * handleInteractionSelect)
 * For example the default mode: selection of a draw object by mouse click and release:
 * (bindStopInteraction -> handleMouseRelease -> switchSelectionCandidates).
 * If the hovered draw object is selectable as well as tracked as a selection candidate,
 * it will be highlighted in the draw area executing a specific callback.
 */
class UserInteractionHandler {
    /**
     * Contains specialized event handlers and extracts components from the view
     * that are to be bound to certain user interactions. Contains instances
     * for the data storage/access, user interaction tracking and draw area
     * manipulation and configuration options.
     *
     * @param opts {Object} - configuration options for the drawer
     * @param sceneData {Object} - data storage
     * @param interactionState {Object} - tracks user interactions
     * @param svgDrawer {Object} - updates the draw area
     */
    constructor(opts, sceneData, interactionState, svgDrawer) {
        this.opts = opts;
        this.sceneData = sceneData;
        this.interactionState = interactionState;
        this.svgDrawer = svgDrawer;

        this.svgComponent = svgDrawer.svgComponent;
        const transformGroupsComponent = this.svgComponent.transformGroupsComponent;
        const interactionElementsGroupComponent = transformGroupsComponent.interactionElementsGroupComponent;
        this.annotationFormComponent = interactionElementsGroupComponent.annotationFormComponent;
        this.structureFormComponent = interactionElementsGroupComponent.structureFormComponent;
        this.editAnnotationFormComponent = interactionElementsGroupComponent.editAnnotationFormComponent;
        this.editAtomFormComponent = interactionElementsGroupComponent.editAtomFormComponent;
        this.editEdgeFormComponent = interactionElementsGroupComponent.editEdgeFormComponent;
        this.editStructureFormComponent = interactionElementsGroupComponent.editStructureFormComponent;

        this.clickSelectionHandler = new ClickSelectionHandler(this.opts,
            this.sceneData,
            this.interactionState,
            this.svgDrawer
        );
        this.rectangleSelectionHandler = new RectangleSelectionHandler(this.opts,
            this.sceneData,
            this.interactionState,
            this.svgDrawer
        );
        this.lassoSelectionHandler = new LassoSelectionHandler(this.opts,
            this.sceneData,
            this.interactionState,
            this.svgDrawer,
            this.clickSelectionHandler
        );
        this.hoverHandler =
            new HoverHandler(this.opts, this.sceneData, this.interactionState, this.svgDrawer);
        this.translationHandler = new TranslationHandler(this.opts,
            this.sceneData,
            this.interactionState,
            this.svgDrawer,
            this.hoverHandler,
            this.clickSelectionHandler
        );
        this.rotationHandler = new RotationHandler(this.opts,
            this.sceneData,
            this.interactionState,
            this.svgDrawer,
            this.hoverHandler,
            this.clickSelectionHandler
        );
        this.mirrorHandler =
            new MirrorHandler(this.opts, this.sceneData, this.interactionState, this.svgDrawer);
        this.addHandler = new AddHandler(this.opts,
            this.sceneData,
            this.interactionState,
            this.svgDrawer,
            this.hoverHandler
        );
        this.removeHandler =
            new RemoveHandler(this.opts, this.sceneData, this.interactionState, this.svgDrawer);

        this.subscribedFunctions = [];
    }

    /*----------------------------------------------------------------------*/

    /**
     * Makes sure that the elements inside the draw area get rescaled properly
     * when the window (and thus the draw area itself) gets rescaled.
     */
    bindDrawAreaResizeBehavior() {
        window.addEventListener('resize', () => {
            this.svgDrawer.viewerDrawer.resize();
            this.hoverHandler.handleHoverAtCurrentCursor();
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles subscription of interaction listeners to draw area.
     */
    bindUserInteractionHandling() {
        const buttons = this.opts.buttons;
        if (buttons) {
            this.bindZooming(buttons.zoomIn, buttons.zoomOut, this.opts.zoomStrength);
            this.bindHistoryChange(buttons.advanceHistory, buttons.revertHistory);
            this.bindCenter(buttons.center);
            this.bindStructureReset(buttons.structureReset);
            this.bindRemove(buttons.remove);
        }
        this.bindDisableContextmenu();
        //bind hover/selection behavior for different modes
        this.bindStartInteraction();
        this.bindContinuousInteraction();
        this.bindStopInteraction();
        if (this.opts.allowedInteraction.includes('addAnnotation')) {
            this.bindAddAnnotationFormEvents();
        }
        if (this.opts.allowedInteraction.includes('addStructure')) {
            this.bindAddStructureFormEvents();
        }
        if (this.opts.allowedInteraction.includes('addStructure')) {
            this.bindAddStructureFormEvents();
        }
        if (this.opts.allowedInteraction.includes('edit')) {
            this.bindEditFormEvents();
        }
        //define behavior on entering/leaving the draw area
        this.unbindListeners = () => {
        }; //also used in disable!

        //subscribe ALL events only when draw area hovered
        this.svgComponent.svgDom.node().onpointerenter = () => {
            this.interactionState.drawAreaHovered = true;
            this.unbindListeners = () => {
            };
            this.subscribedFunctions.forEach(({target, type, fn}) => {
                if (!type) return;
                if (!target) target = document;
                target.addEventListener(type, fn);
            });
        };
        //unsubscribe ALL events when draw area is no longer hovered
        this.svgComponent.svgDom.node().onpointerleave = () => {
            this.interactionState.cursorPos = null;
            this.interactionState.drawAreaHovered = false;
            this.unbindListeners = () => {
                this.subscribedFunctions.forEach(({target, type, fn}) => {
                    if (!type) return;
                    if (!target) target = document;
                    target.removeEventListener(type, fn);
                });
            };
            if (!this.interactionState.interaction.active) {
                this.unbindListeners();
                this.hoverHandler.unselectAllHovered();
            }
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Binds the drawer's zooming behavior to specified buttons. All such
     * buttons are objects with the fields "type" ("wheel" or "key") and
     * "button" ("up" and "down" for wheel and keyboard buttons for "key").
     *
     * @param zoomInBtns {Array} - all buttons which should trigger zoom
     * into the scene
     * @param zoomOutBtns {Array} - all buttons which should trigger zoom
     * out of the scene
     * @param zoomStrength {Number} - how much an individual button press
     * zooms at once (the higher the stronger the zoom)
     */
    bindZooming(zoomInBtns, zoomOutBtns, zoomStrength) {
        const zoomAdd = zoomStrength / 100; //zoom strength is always set
        const zoomInFunction = () => {
            if (this.interactionState.interaction.active) {
                return;
            }
            this.svgDrawer.viewerDrawer.scale(this.interactionState.transformParams.scale *
                (1 + zoomAdd));
            this.hoverHandler.handleHoverAtCurrentCursor();
        };
        const zoomOutFunction = () => {
            if (this.interactionState.interaction.active) {
                return;
            }
            this.svgDrawer.viewerDrawer.scale(this.interactionState.transformParams.scale *
                (1 - zoomAdd));
            this.hoverHandler.handleHoverAtCurrentCursor();
        };

        zoomInBtns && zoomInBtns.forEach(({type: btnType, button}) => {
            this.subscribeFunction(btnType, button, zoomInFunction);
        });
        zoomOutBtns && zoomOutBtns.forEach(({type: btnType, button}) => {
            this.subscribeFunction(btnType, button, zoomOutFunction);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Binds iteration through the drawer's history to specified buttons. All
     * such buttons are objects with the fields "type" ("wheel" or "key") and
     * "button" ("up" and "down" for wheel and keyboard buttons for "key").
     *
     * @param advanceBtns {Array} - all buttons which should advance the
     * history by one step
     * @param revertBtns {Array} - all buttons which should revert the history
     * by one step
     */
    bindHistoryChange(advanceBtns, revertBtns) {
        const advance = () => {
            this.svgDrawer.historyDrawer.advanceHistory();
            //scene changes, so do hovered elements
            this.hoverHandler.handleHoverAtCurrentCursor();
        };
        const revert = () => {
            this.svgDrawer.historyDrawer.revertHistory();
            //scene changes, so do hovered elements
            this.hoverHandler.handleHoverAtCurrentCursor();
        };

        advanceBtns && advanceBtns.forEach(({type: btnType, button}) => {
            this.subscribeFunction(btnType, button, advance);
        });
        revertBtns && revertBtns.forEach(({type: btnType, button}) => {
            this.subscribeFunction(btnType, button, revert);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Binds the drawer's centering functionality to specified buttons. All such
     * buttons are objects with the fields "type" ("wheel" or "key") and
     * "button" ("up" and "down" for wheel and keyboard buttons for "key").
     *
     * @param centerBtns {Array} - all buttons which should center the scene
     */
    bindCenter(centerBtns) {
        centerBtns && centerBtns.forEach(({type: btnType, button}) => {
            this.subscribeFunction(btnType, button, () => {
                this.svgDrawer.viewerDrawer.center();
                this.hoverHandler.handleHoverAtCurrentCursor();
            });
        });
    };

    /*----------------------------------------------------------------------*/

    /**
     * Binds the drawer's reset functionality (to the first history step) to
     * specified buttons. All such buttons are objects with the fields "type"
     * ("wheel" or "key") and "button" ("up" and "down" for wheel and keyboard
     * buttons for "key").
     *
     * @param resetBtns {Array} - all buttons which should reset the scene
     */
    bindStructureReset(resetBtns) {
        resetBtns && resetBtns.forEach(({type: btnType, button}) => {
            this.subscribeFunction(btnType, button, () => {
                if (this.interactionState.interaction.active) return;
                this.resetScene(this.opts.resetMode)
            });
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Resets the drawer and readds all previous added jsons.
     * It can be defined which json(s) to add (e.g. only jsons containing structures).
     *
     * @param type {Number} - define which previously added jsons to load /
     * which to discard.
     * 0: load all,
     * 1: only load the first added json,
     * 2: only load jsons containing at least one structure
     */
    resetScene(type = 0) {
        const jsonStrings = this.sceneData.getJsonByType(type);
        this.removeHandler.fullReset();
        jsonStrings.forEach(jsonString => {
            this.addHandler.addToScene(jsonString, true);
        })
    }

    /*----------------------------------------------------------------------*/

    /**
     * Binds the drawer's remove functionality to specified buttons. All such
     * buttons are objects with the fields "type" ("wheel" or "key") and
     * "button" ("up" and "down" for wheel and keyboard buttons for "key").
     *
     * @param removeBtns {Array} - all buttons which should remove hovered
     * elements or selected elements if hovered element is also selected
     */
    bindRemove(removeBtns) {
        removeBtns && removeBtns.forEach(({type: btnType, button}) => {
            this.subscribeFunction(btnType, button, () => {
                if (this.interactionState.interaction.remove.selected) {
                    this.removeHandler.handleRemoveSelected();
                } else {
                    this.removeHandler.handleRemoveHovered();
                }
            });
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Disables the contextmenu when right clicking the draw-area.
     * Note that this does not prevent the contextmenu coming up
     * at firefox when right clicking and holding shift.
     */
    bindDisableContextmenu() {
        const listener = e => { //may go over the edge
            e.preventDefault();
        };
        this.subscribedFunctions.push({
            type: 'contextmenu', fn: listener
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the event listener to handle the start of user interaction when
     * a user clicks on/touches the scene and adds it to the tracked event
     * listeners of the drawer. The listener checks which modifier buttons are
     * pressed when the event occurs and checks for the current mouse key -
     * this information is then compared to provided interaction mode
     * information (Objects with "key" and "modifiers" fields) and the best
     * fitting mode is then chosen for further user interaction steps.
     */
    bindStartInteraction() {
        const confirmSwitch = this.checkIfNecessaryButtonsPressed();
        const listener = e => {
            const interaction = this.interactionState.interaction;
            //prevent weird behavior e.g. activation of scroll mode by middle mouse
            //button in chrome
            if (e.button !== 0) {
                e.preventDefault();
            }
            //interaction now recognized in move and up functions
            interaction.active = true;
            //get coordinates at start of current interaction
            const drawAreaBBox = Helpers.getXYOfNode(this.svgComponent.svgDom.node());
            interaction.start = PointCalculation.getCoordinatesInElement({
                x: e.clientX, y: e.clientY
            }, drawAreaBBox);
            interaction.origin = Object.assign({}, interaction.start);
            //different behavior for pure touch as move is skipped there
            if (e.pointerType === 'touch') {
                this.interactionState.setInteractionMode(this.opts.defaultInteraction);
                this.hoverHandler.handleHover(interaction.start);
            } else { //mouse movement, multiple modes per keys possible
                const conf = {
                    matched: false, mode: undefined
                };
                //cache reused modes
                const lineMirrorMode = interaction.lineMirror.curMode;
                const addAnnotationMode = interaction.addAnnotation.curMode;
                const addStructureMode = interaction.addStructure.curMode;
                const editMode = interaction.edit.curMode;
                //first check if any ongoing interaction must be finished
                if (lineMirrorMode === InteractionMode.mirrorSelect) {
                    conf.matched = true;
                    conf.mode = lineMirrorMode;
                } else if (addAnnotationMode === InteractionMode.addAnnotationInput) {
                    conf.matched = true;
                    conf.mode = addAnnotationMode;
                } else if (addStructureMode === InteractionMode.addStructureInput) {
                    conf.matched = true;
                    conf.mode = addStructureMode;
                } else if (editMode === InteractionMode.editInput) {
                    conf.matched = true;
                    conf.mode = editMode;
                } else { //otherwise switch interaction based on buttons pressed
                    for (const [mouseMode, configurations] of
                        Object.entries(this.opts.buttons.mouse)) {
                        confirmSwitch(e, mouseMode, configurations, conf);
                        if (conf.matched) {
                            break;
                        }
                    }
                }
                //confirm changes in this.interactionState.interaction or take default
                if (conf.matched) {
                    this.interactionState.setInteractionMode(conf.mode);
                } else {
                    this.interactionState.setInteractionMode(this.opts.defaultInteraction);
                }
            }
            this.startUserInteraction();
        };
        this.subscribedFunctions.push({
            type: 'pointerdown', fn: listener
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Checks if all buttons necessary for a mode are pressed.
     */
    checkIfNecessaryButtonsPressed() {
        return (event, mouseMode, configurations, confObj) => {
            const confirm = () => {
                confObj.matched = true;
                confObj.mode = InteractionMode[mouseMode];
            };
            const eventButtons = {
                ctrl: event.ctrlKey, alt: event.altKey, shift: event.shiftKey
            };
            const nrButtonsPressed = Object.values(eventButtons)
                .filter(value => value).length;
            for (const configuration of configurations) {
                if (event.button === configuration.key) {
                    let configurationMatches = true;
                    const modifiers = configuration.modifiers;
                    const nrOfMods = (modifiers && modifiers.length) || 0;
                    if (nrOfMods !== nrButtonsPressed) {
                        return;
                    }
                    for (let i = 0; i < nrOfMods; ++i) {
                        const mod = modifiers[i];
                        if (!eventButtons.hasOwnProperty(mod) || !eventButtons[mod]) {
                            configurationMatches = false;
                        }
                    }
                    if (configurationMatches) {
                        //not rejected, so choose this mode as new best
                        confirm();
                        return;
                    }
                }
            }
        };
    }

    /*----------------------------------------------------------------------*/

    /**
     * Handles any necessary post-processing (including selection) for the
     * current interaction mode.
     */
    startUserInteraction() {
        switch (this.interactionState.interaction.mode) {
            case InteractionMode.doNothing:
                break;
            case InteractionMode.globalMovement:
                break;
            case InteractionMode.addGeomineQueryVirtualPoint:
                break;
            case InteractionMode.rectSelect:
                this.clickSelectionHandler.handleSelectionStart(InteractionMode.rectSelect);
                break;
            case InteractionMode.freeSelect:
                this.clickSelectionHandler.handleSelectionStart(InteractionMode.freeSelect);
                break;
            case InteractionMode.mirrorSelect:
            case InteractionMode.lineMirror:
            case InteractionMode.bondMirror:
                break;
            case InteractionMode.addIntermolecular:
                this.addHandler.setInteractionStartAddIntermolecular();
                this.hoverHandler.unselectAllHovered();
                break;
            case InteractionMode.addAtom:
                this.addHandler.setInteractionStartAddAtom();
                this.hoverHandler.unselectAllHovered();
                break;
            case InteractionMode.edit:
            case InteractionMode.editInput:
            case InteractionMode.addAnnotation:
            case InteractionMode.addAnnotationInput:
            case InteractionMode.addStructure:
            case InteractionMode.addStructureInput:
                this.hoverHandler.unselectAllHovered();
                break;
            case InteractionMode.rotation:
            case InteractionMode.movement:
            case InteractionMode.scaledRotation:
            case InteractionMode.remove:
            case InteractionMode.clickSelect:
            default: //default when no mode is given (mode is undefined)
                this.clickSelectionHandler.handleInteractionSelect();
                break;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the event listener to handle continuous user interaction after
     * clicking on/touching the scene (i.e., mouse/touch movement) and adds it
     * to the tracked event listeners of the drawer. Updating of elements is
     * based on distance between intermittent cursor positions and for
     * performance reasons limited to one update per animation frame.
     */
    bindContinuousInteraction() {
        let lastUpdate = null;
        const moveFunction = e => { //function that can be bound whenever relevant
            //always update cursor position
            const drawAreaBBox = Helpers.getXYOfNode(this.svgComponent.svgDom.node());
            const drawAreaCoords = PointCalculation.getCoordinatesInElement({
                x: e.clientX, y: e.clientY
            }, drawAreaBBox);
            this.interactionState.cursorPos = {
                x: drawAreaCoords.x, y: drawAreaCoords.y
            };

            //cursor behavior for touch and mouse hover
            if (e.pointerType === 'touch') {
                //to avoid blue flicker
                this.svgDrawer.viewerDrawer.setCursorStyle('default');
            } else {
                //better signalling on what is hovered
                this.svgDrawer.viewerDrawer.setCursorStyle('pointer');
            }
            if (!this.interactionState.drawAreaHovered &&
                !this.interactionState.interaction.active) {
                return;
            }
            //prevent weird behaviour when moving out of draw area bounds
            e.preventDefault();

            //only one render call per animation frame
            if (lastUpdate !== null) {
                return;
            }
            lastUpdate = requestAnimationFrame(() => {
                let mode;
                //check if any ongoing interaction must be finished
                if (this.interactionState.interaction.lineMirror.curMode ===
                    InteractionMode.mirrorSelect) {
                    mode = InteractionMode.mirrorSelect;
                } else if (this.interactionState.interaction.addAnnotation.curMode ===
                    InteractionMode.addAnnotationInput) {
                    mode = InteractionMode.addAnnotationInput;
                } else if (this.interactionState.interaction.addStructure.curMode ===
                    InteractionMode.addStructureInput) {
                    mode = InteractionMode.addStructureInput;
                } else if (this.interactionState.interaction.edit.curMode ===
                    InteractionMode.editInput) {
                    mode = InteractionMode.editInput;
                }
                //no active interaction -> check which elements are hovered and
                //to be interacted with in the next step
                if (!mode && !this.interactionState.interaction.active) {
                    this.hoverHandler.handleHover(drawAreaCoords);
                    lastUpdate = null;
                    return;
                }
                //if no mode to finish, set to current user mode
                if (!mode) mode = this.interactionState.interaction.mode;
                //variables that note postprocessing steps to do
                if (this.handleMouseClick(mode, drawAreaCoords)) {
                    this.interactionState.interaction.start = {
                        x: drawAreaCoords.x, y: drawAreaCoords.y
                    };
                }
                lastUpdate = null;
            });
        };
        this.subscribedFunctions.push({
            type: 'pointermove', fn: moveFunction
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates the event listener to cleanup at the end of user interaction when
     * a user lifts the clicked mouse button/touch and adds it to the tracked
     * event listeners of the drawer. The exact behavior is dependent on the
     * current interaction mode.
     */
    bindStopInteraction() {
        const listener = e => { //may go over the edge
            //shortcut if no interaction is taking place
            if (!this.interactionState.interaction.active) {
                return;
            }
            const interactionMode = this.interactionState.interaction.mode;
            //variables noting postprocessing steps that may have to be done
            const actions = {};
            actions.unselectHovered = e.pointerType === 'touch';
            actions.fullResetRequest = false;
            actions.hoverRequest = false;
            this.handleMouseRelease(interactionMode, actions, e);
            //restore previous status as necessary
            this.interactionState.interaction.active = false;
            if (actions.fullResetRequest) {
                this.interactionState.interaction.fullReset();
            }
            //make sure not to destroy page performance when multiple
            //InteractionDrawers are active
            if (!this.interactionState.drawAreaHovered) {
                this.unbindListeners();
                actions.unselectHovered = true;
            }
            if (actions.unselectHovered) {
                this.hoverHandler.unselectAllHovered();
            }
            if (actions.hoverRequest) {
                this.hoverHandler.handleHoverAtCurrentCursor();
            }
        };
        this.subscribedFunctions.push({
            type: 'pointerup', fn: listener
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Processes mouse click with respect to user interaction mode.
     *
     * @param mode {Object} - current user interaction mode
     * @param coords {Object} - clicked draw area coordinates
     * @returns {Boolean} - whether interaction mode was actually applied
     */
    handleMouseClick(mode, coords) {
        let newStartRequest = false;
        switch (mode) {
            case InteractionMode.doNothing:
                break;
            case InteractionMode.globalMovement:
                newStartRequest = true;
                //decide if any movement is made based on specified grace
                const offset = this.interactionState.getOffsetsToInteractionStart(coords);
                //movement may be rejected bc of allowed grace
                const doMove = this.interactionState.decideMovementPossible(offset);
                if (!doMove) newStartRequest = false;
                this.translationHandler.handleTranslation(coords);
                break;
            case InteractionMode.movement:
                newStartRequest = this.translationHandler.handleMovement(coords);
                break;
            case InteractionMode.rotation:
                newStartRequest = this.rotationHandler.handleRotationByCoords(coords);
                break;
            case InteractionMode.scaledRotation:
                newStartRequest = this.rotationHandler.handleScaledRotation(coords);
                break;
            case InteractionMode.rectSelect:
                this.rectangleSelectionHandler.handleRectSelection(coords);
                break;
            case InteractionMode.freeSelect:
                this.lassoSelectionHandler.handleFreeSelection(coords);
                break;
            case InteractionMode.mirrorSelect:
                newStartRequest = true;
                this.svgDrawer.viewerDrawer.setMirrorLineToCursor();
                break;
            case InteractionMode.addIntermolecular:
                newStartRequest = true;
                this.addHandler.handleAddIntermolecular();
                break;
            case InteractionMode.addAtom:
                newStartRequest = true;
                this.addHandler.handleAddAtom();
                break;
        }
        return newStartRequest;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Processes mouse click release onto the dra area.
     *
     * @param mode {Object} - current user interaction mode
     * @param actions {Object} - variable noting postprocessing steps that may have to be done
     * @param event {Object} - object noting current user interaction event
     */
    handleMouseRelease(mode, actions, event) {
        const interaction = this.interactionState.interaction;
        const structures = this.sceneData.structuresData.structures;
        switch (mode) {
            case InteractionMode.doNothing:
                break;
            case InteractionMode.globalMovement:
                if (this.opts.geomineMode && PointCalculation.coordsAlmostEqual(interaction.origin,
                    interaction.start,
                    interaction.grace
                )) {
                    this.clickSelectionHandler.deselectAllGeominePoints();
                    this.clickSelectionHandler.deselectAllGeomineQueryPointToPointConstraints();
                    this.clickSelectionHandler.deselectAllGeomineQueryAngles();
                    this.clickSelectionHandler.handleClickInTheBlank()
                }
                break;
            case InteractionMode.movement:
                this.translationHandler.handleMovementEnd();
                break;
            case InteractionMode.rotation:
            case InteractionMode.scaledRotation:
                this.rotationHandler.handleRotationEnd();
                break;
            case InteractionMode.rectSelect:
                this.rectangleSelectionHandler.handleRectSelectionEnd();
                break;
            case InteractionMode.freeSelect:
                actions.fullResetRequest = true;
                this.lassoSelectionHandler.handleFreeSelectionEnd();
                break;
            case InteractionMode.lineMirror:
                const curStructureId = interaction.lineMirror.curStructureId;
                const splineControlPoints = interaction.lineMirror.splineControlPoints;
                if (curStructureId !== undefined &&
                    structures[curStructureId].representationsData.isCurRepresentation(
                        StructureRepresentation.circle)) {
                    break;
                }
                if (curStructureId === undefined && Object.keys(splineControlPoints).length === 0) {
                    break;
                }
                actions.unselectHovered = true;
                this.svgDrawer.viewerDrawer.setMirrorLineToCursor();
                this.interactionState.setNextLineMirrorMode();
                break;
            case InteractionMode.mirrorSelect:
                actions.fullResetRequest = true;
                actions.hoverRequest = true;
                this.mirrorHandler.performLineMirror();
                this.svgDrawer.viewerDrawer.hideMirrorLine();
                this.interactionState.setNextLineMirrorMode();
                break;
            case InteractionMode.bondMirror:
                const {structureId, edgeId} = interaction.mirror.edge;
                if (structureId === undefined || edgeId === undefined ||
                    structures[structureId].representationsData.isCurRepresentation(
                        StructureRepresentation.circle)) {
                    break;
                }
                this.mirrorHandler.mirrorOnEdge(structureId, edgeId);
                interaction.resetMovementInfo();
                interaction.resetRotationInfo();
                interaction.resetSelectionCandidates();
                break;
            case InteractionMode.remove:
                if (interaction.remove.selected) {
                    this.removeHandler.handleRemoveSelected();
                } else {
                    this.removeHandler.handleRemoveHovered();
                }
                this.interactionState.resetAfterHoverEnd();
                break;
            case InteractionMode.addIntermolecular:
                this.addHandler.handleAddIntermolecularEnd();
                break;
            case InteractionMode.addAtom:
                const currentJson = this.addHandler.jsonBuilder.getJson(true, true);
                this.removeHandler.removeCurrentScene();
                this.addHandler.handleAddAtomEnd(currentJson);
                if (this.interactionState.addAtomType.edit) {
                    this.interactionState.editType = EditType.atom;
                    //edit the atom, default is C without text label
                    this.addHandler.handleEditFormEnd();
                }
                break;
            case InteractionMode.addAnnotation:
                this.addHandler.handleAddAnnotationFormEnd();
                break;
            case InteractionMode.addStructure:
                this.addHandler.handleAddStructureFormEnd();
                break;
            case InteractionMode.edit:
                this.addHandler.handleEditFormEnd();
                break;
            case InteractionMode.addAnnotationInput:
                if (event.button === 2) { //reset if right click
                    this.addHandler.handleAddAnnotationInputEnd(true);
                }
                //annotation adding gets handled with separate event handlers
                //see bindAddAnnotationFormEvents()
                break;
            case InteractionMode.addStructureInput:
                if (event.button === 2) { //reset if right click
                    this.addHandler.handleAddStructureInputEnd(true);
                }
                break;
            case InteractionMode.editInput:
                if (event.button === 2) { //reset if right click
                    this.addHandler.handleEditInputEnd("", true);
                }
                break;
            case InteractionMode.addGeomineQueryVirtualPoint:
                this.clickSelectionHandler.handleClickInTheBlank();
                break;
            case InteractionMode.clickSelect:
                this.clickSelectionHandler.switchSelectionCandidates();
                this.hoverHandler.handleHoverAtCurrentCursor();
                const selectionCandidates = this.interactionState.interaction.selectionCandidates;
                //if nothing is hovered for selection and mouse is not moved, deselect everything
                if (Object.keys(selectionCandidates).length === 0 && PointCalculation.coordsAlmostEqual(
                    interaction.origin,
                    interaction.start,
                    interaction.grace
                ) && !this.opts.geomineMode) {
                    this.clickSelectionHandler.deselectEverything();
                }
                this.interactionState.resetAfterHoverEnd();
                break;
            default: //no interaction mode, just confirm selection
                this.clickSelectionHandler.switchSelectionCandidates();
                if (this.opts.hoverAfterDeselection) {
                    this.hoverHandler.handleHoverAtCurrentCursor();
                }
                break;
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds the event listeners necessary for the add annotation form
     */
    bindEditFormEvents() {
        const events = [];
        //click on edit button
        events.push({
            target: this.editEdgeFormComponent.editEdgeFormDom.editBtn,
            type: 'click',
            fn: () => {
                if (this.interactionState.interaction.edit.curMode ===
                    InteractionMode.editInput) {
                    const currentJson = this.addHandler.jsonBuilder.getJson(true, true);
                    this.removeHandler.removeCurrentScene();
                    this.addHandler.handleEditInputEnd(currentJson, false);
                }
            }
        });
        //click on cancel button
        events.push({
            target: this.editEdgeFormComponent.editEdgeFormDom.cancelBtn,
            type: 'click',
            fn: () => {
                if (this.interactionState.interaction.edit.curMode ===
                    InteractionMode.editInput) {
                    this.addHandler.handleEditInputEnd("", true);
                }
            }
        });

        //click on edit button
        events.push({
            target: this.editStructureFormComponent.editStructureFormDom.editBtn,
            type: 'click',
            fn: () => {
                if (this.interactionState.interaction.edit.curMode ===
                    InteractionMode.editInput) {
                    const currentJson = this.addHandler.jsonBuilder.getJson(true, true);
                    this.removeHandler.removeCurrentScene();
                    this.addHandler.handleEditInputEnd(currentJson, false);
                }
            }
        });
        //click on cancel button
        events.push({
            target: this.editStructureFormComponent.editStructureFormDom.cancelBtn,
            type: 'click',
            fn: () => {
                if (this.interactionState.interaction.edit.curMode ===
                    InteractionMode.editInput) {
                    this.addHandler.handleEditInputEnd("", true);
                }
            }
        });
        //click on edit button
        events.push({
            target: this.editAnnotationFormComponent.editAnnotationFormDom.editBtn,
            type: 'click',
            fn: () => {
                if (this.interactionState.interaction.edit.curMode ===
                    InteractionMode.editInput) {
                    const currentJson = this.addHandler.jsonBuilder.getJson(true, true);
                    this.removeHandler.removeCurrentScene();
                    this.addHandler.handleEditInputEnd(currentJson, false);
                }
            }
        });
        //click on cancel button
        events.push({
            target: this.editAnnotationFormComponent.editAnnotationFormDom.cancelBtn,
            type: 'click',
            fn: () => {
                if (this.interactionState.interaction.edit.curMode ===
                    InteractionMode.editInput) {
                    this.addHandler.handleEditInputEnd("", true);
                }
            }
        });
        //click on edit button
        events.push({
            target: this.editAtomFormComponent.editAtomFormDom.editBtn,
            type: 'click',
            fn: () => {
                if (this.interactionState.interaction.edit.curMode ===
                    InteractionMode.editInput) {
                    const currentJson = this.addHandler.jsonBuilder.getJson(true, true);
                    this.removeHandler.removeCurrentScene();
                    this.addHandler.handleEditInputEnd(currentJson, false);
                }
            }
        });
        //click on cancel button
        events.push({
            target: this.editAtomFormComponent.editAtomFormDom.cancelBtn,
            type: 'click',
            fn: () => {
                if (this.interactionState.interaction.edit.curMode ===
                    InteractionMode.editInput) {
                    this.addHandler.handleEditInputEnd("", true);
                }
            }
        });
        //Enter or Escape key during input
        events.push({
            target: this.editStructureFormComponent.editStructureFormDom.labelInput,
            type: 'keydown',
            fn: e => {
                if (this.interactionState.interaction.edit.curMode ===
                    InteractionMode.editInput) {
                    if (e.key === 'Enter') {
                        const currentJson = this.addHandler.jsonBuilder.getJson(true, true);
                        this.removeHandler.removeCurrentScene();
                        this.addHandler.handleEditInputEnd(currentJson, false);
                    } else if (e.key === 'Escape') {
                        this.addHandler.handleEditInputEnd("", true);
                    }
                }
            }
        });
        //Enter or Escape key during input
        events.push({
            target: this.editStructureFormComponent.editStructureFormDom.representationInput,
            type: 'keydown',
            fn: e => {
                if (this.interactionState.interaction.edit.curMode ===
                    InteractionMode.editInput) {
                    if (e.key === 'Enter') {
                        const currentJson = this.addHandler.jsonBuilder.getJson(true, true);
                        this.removeHandler.removeCurrentScene();
                        this.addHandler.handleEditInputEnd(currentJson, false);
                    } else if (e.key === 'Escape') {
                        this.addHandler.handleEditInputEnd("", true);
                    }
                }
            }
        });
        //Enter or Escape key during input
        events.push({
            target: this.editAnnotationFormComponent.editAnnotationFormDom.textInput,
            type: 'keydown',
            fn: e => {
                if (this.interactionState.interaction.edit.curMode ===
                    InteractionMode.editInput) {
                    if (e.key === 'Enter') {
                        const currentJson = this.addHandler.jsonBuilder.getJson(true, true);
                        this.removeHandler.removeCurrentScene();
                        this.addHandler.handleEditInputEnd(currentJson, false);
                    } else if (e.key === 'Escape') {
                        this.addHandler.handleEditInputEnd("", true);
                    }
                }
            }
        });
        events.push({
            target: this.editAtomFormComponent.editAtomFormDom.labelInput,
            type: 'keydown',
            fn: e => {
                if (this.interactionState.interaction.edit.curMode ===
                    InteractionMode.editInput) {
                    if (e.key === 'Enter') {
                        const currentJson = this.addHandler.jsonBuilder.getJson(true, true);
                        this.removeHandler.removeCurrentScene();
                        this.addHandler.handleEditInputEnd(currentJson, false);
                    } else if (e.key === 'Escape') {
                        this.addHandler.handleEditInputEnd("", true);
                    }
                }
            }
        });
        events.push({
            target: this.editAtomFormComponent.editAtomFormDom.elementInput,
            type: 'keydown',
            fn: e => {
                if (this.interactionState.interaction.edit.curMode ===
                    InteractionMode.editInput) {
                    if (e.key === 'Enter') {
                        const currentJson = this.addHandler.jsonBuilder.getJson(true, true);
                        this.removeHandler.removeCurrentScene();
                        this.addHandler.handleEditInputEnd(currentJson, false);
                    } else if (e.key === 'Escape') {
                        this.addHandler.handleEditInputEnd("", true);
                    }
                }
            }
        });
        events.push({
            target: this.editAtomFormComponent.editAtomFormDom.chargeInput,
            type: 'keydown',
            fn: e => {
                if (this.interactionState.interaction.edit.curMode ===
                    InteractionMode.editInput) {
                    if (e.key === 'Enter') {
                        const currentJson = this.addHandler.jsonBuilder.getJson(true, true);
                        this.removeHandler.removeCurrentScene();
                        this.addHandler.handleEditInputEnd(currentJson, false);
                    } else if (e.key === 'Escape') {
                        this.addHandler.handleEditInputEnd("", true);
                    }
                }
            }
        });
        events.push({
            target: this.editAtomFormComponent.editAtomFormDom.hInput,
            type: 'keydown',
            fn: e => {
                if (this.interactionState.interaction.edit.curMode ===
                    InteractionMode.editInput) {
                    if (e.key === 'Enter') {
                        const currentJson = this.addHandler.jsonBuilder.getJson(true, true);
                        this.removeHandler.removeCurrentScene();
                        this.addHandler.handleEditInputEnd(currentJson, false);
                    } else if (e.key === 'Escape') {
                        this.addHandler.handleEditInputEnd("", true);
                    }
                }
            }
        });
        events.push({
            target: this.editEdgeFormComponent.editEdgeFormDom.typeSelect,
            type: 'keydown',
            fn: e => {
                if (this.interactionState.interaction.edit.curMode ===
                    InteractionMode.editInput) {
                    if (e.key === 'Enter') {
                        const currentJson = this.addHandler.jsonBuilder.getJson(true, true);
                        this.removeHandler.removeCurrentScene();
                        this.addHandler.handleEditInputEnd(currentJson, false);
                    } else if (e.key === 'Escape') {
                        this.addHandler.handleEditInputEnd("", true);
                    }
                }
            }
        });
        Array.prototype.push.apply(this.subscribedFunctions, events);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds the event listeners necessary for the add annotation form
     */
    bindAddAnnotationFormEvents() {
        const events = [];
        //default color button click
        events.push({
            target: this.annotationFormComponent.addAnnotationFormDom.defaultColorBtn,
            type: 'click',
            fn: () => {
                if (this.interactionState.interaction.addAnnotation.curMode ===
                    InteractionMode.addAnnotationInput) {
                    this.annotationFormComponent.setInputColor(this.opts.colors.DEFAULT);
                }
            }
        });
        //hydrophobic color button click
        events.push({
            target: this.annotationFormComponent.addAnnotationFormDom.hydrophobicColorBtn,
            type: 'click',
            fn: () => {
                if (this.interactionState.interaction.addAnnotation.curMode ===
                    InteractionMode.addAnnotationInput) {
                    this.annotationFormComponent.setInputColor(this.opts.colors.hydrophobicContacts);
                }
            }
        });
        //click on add button
        events.push({
            target: this.annotationFormComponent.addAnnotationFormDom.addBtn,
            type: 'click',
            fn: () => {
                if (this.interactionState.interaction.addAnnotation.curMode ===
                    InteractionMode.addAnnotationInput) {
                    this.addHandler.handleAddAnnotationInputEnd();
                }
            }
        });
        //click on cancel button
        events.push({
            target: this.annotationFormComponent.addAnnotationFormDom.cancelBtn,
            type: 'click',
            fn: () => {
                if (this.interactionState.interaction.addAnnotation.curMode ===
                    InteractionMode.addAnnotationInput) {
                    this.addHandler.handleAddAnnotationInputEnd(true);
                }
            }
        });
        //Enter or Escape key during input
        events.push({
            target: this.annotationFormComponent.addAnnotationFormDom.textInput,
            type: 'keydown',
            fn: e => {
                if (this.interactionState.interaction.addAnnotation.curMode ===
                    InteractionMode.addAnnotationInput) {
                    if (e.key === 'Enter') {
                        this.addHandler.handleAddAnnotationInputEnd();
                    } else if (e.key === 'Escape') {
                        this.addHandler.handleAddAnnotationInputEnd(true);
                    }
                }
            }
        });
        Array.prototype.push.apply(this.subscribedFunctions, events);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adds the event listeners necessary for the add structure form
     */
    bindAddStructureFormEvents() {
        const events = [];
        //click on add button
        events.push({
            target: this.structureFormComponent.addStructureFormDom.addBtn,
            type: 'click',
            fn: () => {
                if (this.interactionState.interaction.addStructure.curMode ===
                    InteractionMode.addStructureInput) {
                    this.addHandler.handleAddStructureInputEnd();
                }
            }
        });
        //click on cancel button
        events.push({
            target: this.structureFormComponent.addStructureFormDom.cancelBtn,
            type: 'click',
            fn: () => {
                if (this.interactionState.interaction.addStructure.curMode ===
                    InteractionMode.addStructureInput) {
                    this.addHandler.handleAddStructureInputEnd(true);
                }
            }
        });
        //Enter or Escape key during input
        events.push({
            target: this.structureFormComponent.addStructureFormDom.input,
            type: 'input',
            fn: e => {
                if (this.interactionState.interaction.addStructure.curMode ===
                    InteractionMode.addStructureInput) {
                    if (this.structureFormComponent.addStructureFormDom.input.value.length > 0) {
                        this.structureFormComponent.addStructureFormDom.select.disabled = true;
                    } else {
                        this.structureFormComponent.addStructureFormDom.select.disabled = false;
                    }
                }
            }
        });
        events.push({
            target: this.structureFormComponent.addStructureFormDom.input,
            type: 'keydown',
            fn: e => {
                if (this.interactionState.interaction.addStructure.curMode ===
                    InteractionMode.addStructureInput) {
                    if (e.key === 'Enter') {
                        this.addHandler.handleAddStructureInputEnd();
                    } else if (e.key === 'Escape') {
                        this.addHandler.handleAddStructureInputEnd(true);
                    }
                }
            }
        });
        events.push({
            target: this.structureFormComponent.addStructureFormDom.select,
            type: 'keydown',
            fn: e => {
                if (this.interactionState.interaction.addStructure.curMode ===
                    InteractionMode.addStructureInput) {
                    if (e.key === 'Enter') {
                        this.addHandler.handleAddStructureInputEnd();
                    } else if (e.key === 'Escape') {
                        this.addHandler.handleAddStructureInputEnd(true);
                    }
                }
            }
        });
        Array.prototype.push.apply(this.subscribedFunctions, events);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates listener for a new button or mouse wheel event and push that
     * event to an array of subscribed functions (which can be easily
     * unsubscribed when the user does not hover the scene as to not overload
     * the page with event listeners).
     *
     * @param btnType {String} - "key" or "wheel", determines type of event
     * @param button {String} - which button to press ("up" and "down" for
     * wheel events)
     * @param fn {Function} - code to execute on button press
     */
    subscribeFunction(btnType, button, fn) {
        this.subscribedFunctions.push(this.createListener(btnType, button, fn));
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates all necessary information to subscribe events to the scene or
     * page based on given button information.
     *
     * @param btnType {String} - "key" or "wheel", determines type of event
     * @param button {String} - which button to press ("up" and "down" for
     * wheel events)
     * @param fn {Function} - code to execute on button press
     * @returns {Object} - information to create event listener: type of
     * listener ("wheel" or "keydown", target (draw area or window), and
     * function (field "fn") to execute on event trigger
     */
    createListener(btnType, button, fn) {
        const listener = {
            target: undefined, type: undefined, fn: undefined
        };
        switch (btnType) {
            case 'wheel':
                switch (button) {
                    case 'up':
                        listener.fn = (e) => {
                            e.preventDefault();
                            if (e.deltaY > 0) {
                                fn(e);
                            }
                            return false;
                        };
                        break;
                    case 'down':
                        listener.fn = (e) => {
                            e.preventDefault();
                            if (e.deltaY < 0) {
                                fn(e);
                            }
                            return false;
                        };
                        break;
                    default: //bad input
                        return listener;
                }
                listener.target = this.svgComponent.svgDom.node();
                listener.type = 'wheel';
                break;
            case 'key':
                listener.type = 'keydown';
                listener.fn = (e) => {
                    if (this.interactionState.drawAreaHovered) {
                        if (e.key === button && //do not do weird stuff when entering a text into
                            //the text field
                            this.interactionState.interaction.addAnnotation.curMode !==
                            InteractionMode.addAnnotationInput &&
                            this.interactionState.interaction.addStructure.curMode !==
                            InteractionMode.addStructureInput) {
                            fn(e);
                        }
                    }
                };
                break;
        }
        return listener;
    }
}