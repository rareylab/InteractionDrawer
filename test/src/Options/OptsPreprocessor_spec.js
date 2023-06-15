describe('InteractionDrawer Options OptsPreprocessor', function () {

    it('tests if config is loaded if no custom config is set', async function () {
        const optsPreprocessor = new OptsPreprocessor();
        expect(optsPreprocessor.getOpts()).toEqual(undefined);
        optsPreprocessor.processOpts();
        expect(optsPreprocessor.getOpts()).toEqual(interactionDrawerProcessedDefaultConfig);
    });

    it('tests if config is loaded if empty config is set', async function () {
        const optsPreprocessor = new OptsPreprocessor({});
        expect(optsPreprocessor.getOpts()).toEqual({});
        optsPreprocessor.processOpts();
        expect(optsPreprocessor.getOpts()).toEqual(interactionDrawerProcessedDefaultConfig);
    });

    it('tests and corrects moveFreedomLevel in config', async function () {
        const brokenConfig = Helpers.deepCloneObject(defaultConfig);
        brokenConfig.moveFreedomLevel = 'broken';
        const optsPreprocessor = new OptsPreprocessor(brokenConfig);
        optsPreprocessor.correctGeneralOpts();
        const opts = optsPreprocessor.getOpts();
        expect(opts.moveFreedomLevel).toEqual('free');
    });

    it('tests and corrects missing options in config', async function () {
        const brokenConfig = Helpers.deepCloneObject(defaultConfig);
        delete brokenConfig.moveAllSelection;
        const optsPreprocessor = new OptsPreprocessor(brokenConfig);
        optsPreprocessor.correctGeneralOpts();
        const opts = optsPreprocessor.getOpts();
        expect(opts.moveAllSelection).toEqual(true);
    });

    it(
        'tests and corrects allowed interactions when one option is also excluded in config',
        async function () {
            const brokenConfig = Helpers.deepCloneObject(defaultConfig);
            brokenConfig.allowedInteraction = ['movement', 'mouse'];
            const excludedInteractions = ['movement'];
            brokenConfig.excludedInteraction = excludedInteractions;
            const optsPreprocessor = new OptsPreprocessor(brokenConfig);
            optsPreprocessor.correctUserInteractionOpts();
            const opts = optsPreprocessor.getOpts();
            expect(opts.allowedInteraction).toEqual(['mouse']);
            expect(opts.excludedInteraction).toEqual(excludedInteractions);
        }
    );

    it('tests and corrects allowed interactions when mouse option is missing', async function () {
        //mouse is always allowed
        const brokenConfig = Helpers.deepCloneObject(defaultConfig);
        brokenConfig.allowedInteraction = [];
        const optsPreprocessor = new OptsPreprocessor(brokenConfig);
        optsPreprocessor.correctUserInteractionOpts();
        const opts = optsPreprocessor.getOpts();
        expect(opts.allowedInteraction).toEqual(['mouse']);
    });

    it(
        'tests and corrects allowed interactions when lineMirror is set without mirrorSelect',
        async function () {
            const brokenConfig = Helpers.deepCloneObject(defaultConfig);
            brokenConfig.allowedInteraction = ['lineMirror'];
            const optsPreprocessor = new OptsPreprocessor(brokenConfig);
            optsPreprocessor.correctUserInteractionOpts();
            const opts = optsPreprocessor.getOpts();
            expect(opts.allowedInteraction.includes('lineMirror')).toEqual(true);
            expect(opts.allowedInteraction.includes('mirrorSelect')).toEqual(true);
        }
    );

    it('tests and corrects allowed interactions when lineMirror is not set', async function () {
        const brokenConfig = Helpers.deepCloneObject(defaultConfig);
        brokenConfig.allowedInteraction = [];
        const optsPreprocessor = new OptsPreprocessor(brokenConfig);
        optsPreprocessor.correctUserInteractionOpts();
        const opts = optsPreprocessor.getOpts();
        expect(opts.allowedInteraction.includes('lineMirror')).toEqual(false);
        expect(opts.allowedInteraction.includes('mirrorSelect')).toEqual(false);
    });

    it('tests and corrects mouse buttons based on allowed interactions', async function () {
        const brokenConfig = Helpers.deepCloneObject(defaultConfig);
        brokenConfig.allowedInteraction = ['movement', 'freeSelect'];
        brokenConfig.buttons.mouse = {'movement': {}, '...': {}};
        const optsPreprocessor = new OptsPreprocessor(brokenConfig);
        optsPreprocessor.correctUserInteractionOpts();
        const opts = optsPreprocessor.getOpts();
        const mouseButtons = opts.buttons.mouse;
        expect('movement' in mouseButtons).toEqual(true);
        expect('freeSelect' in mouseButtons).toEqual(false);
        expect('...' in mouseButtons).toEqual(false);
    });

    it('tests and corrects buttons based on allowed interactions', async function () {
        const brokenConfig = Helpers.deepCloneObject(defaultConfig);
        brokenConfig.allowedInteraction = ['zoomIn', 'zoomOut'];
        brokenConfig.buttons = {'zoomIn': [], '...': [], 'mouse': {}};
        const optsPreprocessor = new OptsPreprocessor(brokenConfig);
        optsPreprocessor.correctUserInteractionOpts();
        const opts = optsPreprocessor.getOpts();
        const buttons = opts.buttons;
        expect('zoomIn' in buttons).toEqual(true);
        expect('mouse' in buttons).toEqual(true);
        expect('zoomOut' in buttons).toEqual(false);
        expect('...' in buttons).toEqual(false);
    });

    it('tests and converts structure representation opts to enums', async function () {
        const config = Helpers.deepCloneObject(defaultConfig);
        const optsPreprocessor = new OptsPreprocessor(config);
        optsPreprocessor.correctStructureRepresentationOpts();
        const opts = optsPreprocessor.getOpts();
        const allowedStructureRepresentations = opts.allowedStructureRepresentations;
        expect('default' in allowedStructureRepresentations).toEqual(true);
        const defaultrepresentations = allowedStructureRepresentations.default;
        expect(defaultrepresentations[0]).toEqual(1);
        expect(defaultrepresentations[1]).toEqual(2);
    });

    it('tests correction of draw area scaling opts', async function () {
        const config = Helpers.deepCloneObject(defaultConfig);
        const optsPreprocessor = new OptsPreprocessor(config);
        optsPreprocessor.correctDrawAreaScalingOpts();
        const opts = optsPreprocessor.getOpts();
        expect(opts.sceneMaxScale).toEqual(3);
        expect(opts.sceneMinScale).toEqual(0.5);
    });

    it('tests the postprocessing of some text size based config opts', async function () {
        const config = Helpers.deepCloneObject(defaultConfig);
        const optsPreprocessor = new OptsPreprocessor(config);
        optsPreprocessor.modifyOpts();
        const opts = optsPreprocessor.getOpts();
        expect(opts.textCrop).toBeCloseTo(1.852);
        expect(opts.hOffset).toEqual(1.3);
        expect(opts.chargeFontSize).toBeCloseTo(5.037);
        expect(opts.chargeOffset).toEqual(1.95);
        expect(opts.hNumberFontSize).toEqual(3.9);
        expect(opts.hNumberOffset).toBeCloseTo(1.527);
    });

    it('tests setting of one new mouse interaction (exact duplicate)', async function () {
        const expected = {'movement': [{'key': 2, 'modifiers': ['alt']}]};
        checkMouseInteractionSetting('movement', 2, ['alt'], expected)
    });

    it('tests setting of one new mouse interaction (mode not valid)', async function () {
        const expected = {'movement': [{'key': 2, 'modifiers': ['alt']}]};
        checkMouseInteractionSetting('notValid', 2, ['notValid'], expected)
    });

    it(
        'tests the setting of one new mouse interaction (same mode, other controls)',
        async function () {
            const expected = {
                'movement': [
                    {'key': 2, 'modifiers': ['alt']}, {'key': 2, 'modifiers': []}
                ]
            };
            checkMouseInteractionSetting('movement', 2, [], expected)
        }
    );

    it('tests the setting of one new mouse interaction (new mode)', async function () {
        const expected = {
            'movement': [{'key': 2, 'modifiers': ['alt']}],
            'rotation': [{'key': 1, 'modifiers': []}]
        };
        checkMouseInteractionSetting('rotation', 1, [], expected)
    });

    it(
        'tests the setting of one new mouse interaction (other mode, same controls)',
        async function () {
            const expected = {'movement': [], 'rotation': [{'key': 2, 'modifiers': ['alt']}]};
            checkMouseInteractionSetting('rotation', 2, ['alt'], expected)
        }
    );

    function checkMouseInteractionSetting(identifier, key, modifiers, expected) {
        const config = Helpers.deepCloneObject(defaultConfig);
        const optsPreprocessor = new OptsPreprocessor(config);
        optsPreprocessor.opts.buttons.mouse = {'movement': [{'key': 2, 'modifiers': ['alt']}]};
        optsPreprocessor.addMouseInteraction(identifier, key, modifiers);
        const mouseInteractions = optsPreprocessor.opts.buttons.mouse;
        expect(mouseInteractions).toEqual(expected);
    }
});