describe('InteractionDrawer GeometryCalculation VectorCalculation', function () {

    it('tests the computed length of a vector', async function () {
        const expectedLength = 2.828;
        const length = VectorCalculation.vectorLength({x: 2, y: 2});
        expect(length).toBeCloseTo(expectedLength);
    });

    it('tests the substraction of one vector from another', async function () {
        const expectedVector = {x: 1, y: 1};
        const vector = VectorCalculation.vectorSubstract({x: 2, y: 2}, {x: 1, y: 1});
        expect(expectedVector).toEqual(vector);
    });

    it('tests the addition of one vector from another', async function () {
        const expectedVector = {x: 3, y: 3};
        const vector = VectorCalculation.vectorAdd({x: 2, y: 2}, {x: 1, y: 1});
        expect(expectedVector).toEqual(vector);
    });

    it('tests the scalar multiplication of one vector', async function () {
        const expectedVector = {x: 4, y: 4};
        const vector = VectorCalculation.scalarMult({x: 2, y: 2}, 2);
        expect(expectedVector).toEqual(vector);
    });

    it('tests the dot product of two vector', async function () {
        const expectedProduct = 8;
        const product = VectorCalculation.dot({x: 2, y: 2}, {x: 2, y: 2});
        expect(expectedProduct).toEqual(product);
    });

    it('tests vector normalization computation', async function () {
        const expectedVector = {x: 0.707, y: 0.707};
        const vector = VectorCalculation.normalize({x: 2, y: 2});
        compareCoordinates(expectedVector, vector);
    });

    it('tests for some vectors if they point to the same/opposite direction', async function () {
        const vectors = {sameDir: {x: 2, y: 2}, oppositeDir: {x: -2, y: -2}};
        let sameDir = VectorCalculation.checkTwoVectorsPointSameDirection({x: 2, y: 2},
            vectors.sameDir
        );
        expect(sameDir).toEqual(true);
        sameDir =
            VectorCalculation.checkTwoVectorsPointSameDirection({x: 2, y: 2}, vectors.oppositeDir);
        expect(sameDir).toEqual(false);
    });

    it('tests the creation of vector based on line endpoints', async function () {
        const expectedVector = {x: -1, y: -1};
        const vector = VectorCalculation.vectorizeLine({x: 4, y: 4}, {x: 3, y: 3});
        expect(expectedVector).toEqual(vector);
    });

    it('tests the distance computation between two given vectors', async function () {
        const expectedDistance = 1;
        const distance = VectorCalculation.getDist2d({x: 3, y: 3}, {x: 4, y: 3});
        expect(distance).toBeCloseTo(expectedDistance);
    });

    it('tests the perpendicular vector calculation for points', async function () {
        const expectedVector = {x: -0.5, y: -0.5};
        const vector = VectorCalculation.findPerpVecLineToPoint({x: 0, y: 1},
            {x: 1, y: 0},
            {x: 0, y: 0}
        );
        compareCoordinates(expectedVector, vector);
    });

    it('tests the minimal distance point calculation on a line to a given point',
        async function () {
            const expectedPoint = {x: 0.5, y: 0.5};
            const point = VectorCalculation.findMinDistPointOnLineToPoint({x: 0, y: 1},
                {x: 1, y: 0},
                {x: 0, y: 0}
            );
            compareCoordinates(expectedPoint, point);
        }
    );

    it('tests the angle computation between two vectors', async function () {
        const expectedAngle = 1.570;
        const angle = VectorCalculation.findAngleBetweenTwoVectors({x: 0, y: 1}, {x: 1, y: 0});
        expect(angle).toBeCloseTo(expectedAngle);
    });

    it('tests the parallel line computation to a given line', async function () {
        const expectedPoint1 = {x: 1, y: 1};
        const expectedPoint2 = {x: 2, y: 1};
        const points = VectorCalculation.findParallelLineByDistVec({x: 0, y: 0},
            {x: 1, y: 0},
            {x: 1, y: 1}
        );
        expect(points[0]).toEqual(expectedPoint1);
        expect(points[1]).toEqual(expectedPoint2);
    });

    it('tests the angle computation between two lines', async function () {
        const expectedAngle = 1.57;
        const angle = VectorCalculation.findAngleBetweenLines({x: 0, y: 0},
            {x: 0, y: 1},
            {x: 0, y: 0},
            {x: 1, y: 0}
        );
        expect(angle).toBeCloseTo(expectedAngle);
    });

    it('tests the projection computation of a given point onto a given line', async function () {
        const expectedPoint = {x: 0.5, y: 0.5};
        const point = VectorCalculation.calcProjection({x: 1, y: 1}, {x: 1, y: 0});
        expect(point).toEqual(expectedPoint);
    });

    function compareCoordinates(point, expectedCoordinates) {
        expect(point.x).toBeCloseTo(expectedCoordinates.x);
        expect(point.y).toBeCloseTo(expectedCoordinates.y);
    }
});