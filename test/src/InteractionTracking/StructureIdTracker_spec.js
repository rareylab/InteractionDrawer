describe('InteractionDrawer InteractionTracking StructureIdTracker', function () {

    it('tests the adding of an Id to a StructureIdTracker', async function () {
        const structureIdTracker = new StructureIdTracker();
        structureIdTracker.addID(0, 1);
        expect(structureIdTracker.hasEntries()).toEqual(true);
        expect(structureIdTracker.hasID(0, 1)).toEqual(true);
    });
});