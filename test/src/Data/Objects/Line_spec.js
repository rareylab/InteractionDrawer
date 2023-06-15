describe('InteractionDrawer Data Objects Line', function () {

    it('tests the creation of a Line object', async function () {
        const line = new Line(2, 2);
        expect(line.m).toEqual(2);
        expect(line.b).toEqual(2);
        expect(line.function(2)).toEqual(6);
    });
});