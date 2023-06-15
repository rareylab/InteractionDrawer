/**
 * Preprocesses the config of the drawer.
 */
class OptsPreprocessor {
    /**
     * Contains and adapts configuration options where given, else use defaults.
     *
     * @param opts {Object} - option parameters given by the user
     */
    constructor(opts) {
        this.opts = opts;
        this.defaultConfigCopy = Helpers.deepCloneObject(defaultConfig);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Sets the default config or corrects the config loaded by the user.
     */
    processOpts() {
        if (!this.opts) {
            this.opts = Helpers.deepCloneObject(this.defaultConfigCopy);
        }
        this.correctGeneralOpts();
        this.correctStructureRepresentationOpts();
        if (this.opts.allowInteraction) {
            this.correctUserInteractionOpts();
        }
        this.correctDrawAreaScalingOpts();
        this.modifyOpts();
    }

    /*----------------------------------------------------------------------*/

    /**
     * Fills out missing fields on a user-provided configuration object with
     * default parameters stored in this class. This does not override any of
     * the fields actually given.
     */
    correctGeneralOpts() {
        const recCheck = (optsPart, defaults) => {
            for (const opt in defaults) {
                if (optsPart.hasOwnProperty(opt)) {
                    if (!Array.isArray(defaults[opt]) && typeof defaults[opt] === 'object') {
                        recCheck(optsPart[opt], defaults[opt]);
                    }
                } else {
                    optsPart[opt] = defaults[opt];
                }
            }
        };
        recCheck(this.opts, this.defaultConfigCopy);
        const colors = {};
        for (const colorId in this.opts.colors) {
            colors[colorId] = Helpers.hexToRgb(this.opts.colors[colorId]);
        }
        this.opts.colors = colors;
        //sanity checks
        if (!['structures', 'rings', 'free']
            .includes(this.opts.moveFreedomLevel)) {
            this.opts.moveFreedomLevel = "free";
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Maps to let the drawer know which representations are allowed
     * for a structure type. Note that the first representation of each
     * type will be displayed as default.
     */
    correctStructureRepresentationOpts() {
        this.opts.allowedStructureRepresentations =
            Object.assign({}, ...Object.entries(this.opts.allowedStructureRepresentations)
                .map(([sType, reps]) => ({
                    [sType]: reps.map(rep => StructureRepresentation[rep])
                })));
    }

    /*----------------------------------------------------------------------*/

    /**
     * If user interaction is allowed (inferred from settings in config), saves
     * parameters set in config and subscribe necessary event listeners to the
     * drawer's associated draw area.
     */
    correctUserInteractionOpts() {
        this.opts.defaultInteraction = InteractionMode[this.opts.defaultInteraction];
        let {allowedInteraction, excludedInteraction} = this.opts;
        allowedInteraction = allowedInteraction.filter(interaction => {
            return !excludedInteraction.includes(interaction);
        });
        //careful with multi-mode interaction
        if (allowedInteraction.includes('lineMirror')) {
            allowedInteraction.push('mirrorSelect');
        }
        this.opts.allowedInteraction = allowedInteraction;
        //store only button/mouse controls relevant for
        //interactions that are allowed in allowedInteraction
        this.opts.buttons.mouse =
            Helpers.filterObjectByKeys(this.opts.buttons.mouse, this.opts.allowedInteraction);
        if (!this.opts.allowedInteraction.includes('mouse')) {
            this.opts.allowedInteraction.push('mouse'); //always allowed
        }
        this.opts.buttons =
            Helpers.filterObjectByKeys(this.opts.buttons, this.opts.allowedInteraction);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Limits scaling min/max of the draw area based on user config.
     */
    correctDrawAreaScalingOpts() {
        this.opts.sceneMaxScale = this.opts.sceneMaxScale ? this.opts.sceneMaxScale : Infinity;
        this.opts.sceneMinScale = this.opts.sceneMinScale ? this.opts.sceneMinScale : -Infinity;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Adapts some config options.
     */
    modifyOpts() {
        const textSize = this.opts.textSize;
        //crop to get to text (the margin above the text that should be cut)
        this.opts.textCrop = Helpers.convertOptStringToPx(textSize, this.opts.textCrop);
        this.opts.hOffset = Helpers.convertOptStringToPx(textSize, this.opts.hOffset);
        //in config: percentage values for smaller text sizes (and their offsets)
        this.opts.chargeFontSize = textSize * this.opts.chargeFontSize;
        this.opts.chargeOffset = textSize * this.opts.chargeOffset;
        this.opts.hNumberFontSize = textSize * this.opts.hNumberFontSize;
        this.opts.hNumberOffset = textSize * this.opts.hNumberOffset;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Binds a interaction mode to a specified mouse button press with optional
     * modifiers. If the combination of mouse button and modifiers already exists
     * to trigger another interaction mode it gets deleted. It is not recommended
     * to bin any interaction to right click and one of the modifiers being shift
     * as this will trigger the contextmenu in firefox by releasing the mouse
     * button.
     *
     * @param identifier {String} - identifier string of the interaction mode, see
     * the InteractionMode object in Enums.js
     * @param key {Number} - the mouse button pressed (0: left, 1: middle, 2: right)
     * @param modifiers {Array} - the modifiers pressed ('ctrl', 'alt' and/or 'shift')
     */
    addMouseInteraction(identifier, key, modifiers = []) {
        if (!InteractionMode.hasOwnProperty(identifier)) {
            console.log('Cannot add mouse interaction: Drawer does ' +
                `not recognize mode "${identifier}".`);
            return;
        }
        if (!this.opts.allowedInteraction.includes(identifier)) {
            console.log('Cannot add mouse interaction: Mode ' +
                `"${identifier}" is disabled by configuration.`);
            return;
        }
        const newConfig = {
            key: key, modifiers: modifiers
        };
        const newModifiersSet = new Set(modifiers);
        //look for key modifiers combination and remove if present
        for (const [mode, configs] of Object.entries(this.opts.buttons.mouse)) {
            this.opts.buttons.mouse[mode] = configs.filter(config => config.key !== newConfig.key ||
                !Helpers.areSetsTheSame(new Set(config.modifiers), newModifiersSet))
        }
        //add modifications to mouse interaction
        if (!this.opts.buttons.mouse[identifier]) {
            this.opts.buttons.mouse[identifier] = [];
        }
        this.opts.buttons.mouse[identifier].push(newConfig);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Returns the config.
     */
    getOpts() {
        return this.opts;
    }
}