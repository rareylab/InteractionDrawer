describe('InteractionDrawer Data Objects VerticalLine', function () {

    it('tests the creation of a VerticalLine object', async function () {
        const line = new VerticalLine(2);
        expect(line.x).toEqual(2);
    });
});