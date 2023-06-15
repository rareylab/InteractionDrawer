describe('InteractionDrawer GeometryCalculation AngleCalculation', function () {

    it('tests radians to degree angle computation', async function () {
        const expectedAngle = 89.954;
        const angle = AngleCalculation.radianToDegree(1.570);
        expect(angle).toBeCloseTo(expectedAngle);
    });

    it('tests degree to radians angle computation', async function () {
        const expectedAngle = 1.570;
        const angle = AngleCalculation.degreeToRadian(90);
        expect(angle).toBeCloseTo(expectedAngle);
    });
});

