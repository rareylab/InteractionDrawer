describe('InteractionDrawer GeometryCalculation PointCalculation', function () {

    it('tests the point rotation computation (by degree) around another', async function () {
        checkPointRotationWithAngleType(30, false);
    });

    it('tests the point rotation computation (by radians) around another', async function () {
        checkPointRotationWithAngleType(0.523, true);
    });

    function checkPointRotationWithAngleType(angle, isRadians) {
        const rotatedPoint = PointCalculation.rotatePointAroundAnother({x: 1, y: 1},
            {x: 0, y: 0},
            angle,
            isRadians
        );
        const expectedCoordinates = {x: 0.366, y: 1.366};
        compareCoordinates(rotatedPoint, expectedCoordinates);
    }

    it('tests the first closest point computation to a given point', async function () {
        const point = {x: 1, y: 1};
        const otherPoints = [{x: 0.8, y: 0.8}, {x: 0.9, y: 0.9}, {x: 1.2, y: 1.2}];
        const closestPoint1 = PointCalculation.getClosestPoint(point, otherPoints);
        compareCoordinates(closestPoint1.point, otherPoints[1]);
    });

    it('tests the first closest point computation to a given point (same coordinates)',
        async function () {
            const point = {x: 1, y: 1};
            const otherPoints = [{x: 0.8, y: 0.8}, {x: 0.9, y: 0.9}, {x: 1.2, y: 1.2}];
            otherPoints.push({x: 1.0, y: 1.0});
            const closestPoint2 = PointCalculation.getClosestPoint(point, otherPoints);
            compareCoordinates(closestPoint2.point, otherPoints[3]);
        }
    );

    it('tests the computation of some points rotation (by radians) around another position',
        async function () {
            checkPointsRotationWithAngleType(0.523, false);
        }
    );

    it('tests the computation of some points rotation (by degree) around another',
        async function () {
            checkPointsRotationWithAngleType(30, true);
        }
    );

    function checkPointsRotationWithAngleType(angle, isDegree) {
        const closestPoints = PointCalculation.rotatePointsAroundMid([
            {x: 0.9, y: 0.9}, {x: 1, y: 1}, {x: 1.1, y: 1.1}
        ], angle, {x: 0, y: 0}, isDegree);
        compareCoordinates(closestPoints[0], {x: 0.329, y: 1.229});
        compareCoordinates(closestPoints[1], {x: 0.366, y: 1.366});
        compareCoordinates(closestPoints[2], {x: 0.402, y: 1.502});
    }

    it('tests the computation of point rotation (by sin/cos) around another', async function () {
        const rotatedPoint = PointCalculation.rotatePointAroundAnotherSinCosKnown({x: 1, y: 1},
            {x: 0, y: 0},
            0.499,
            0.866
        );
        const expectedCoordinates = {x: 0.366, y: 1.366};
        compareCoordinates(rotatedPoint, expectedCoordinates);
    });

    it('tests if a point is inside a circle', async function () {
        checkPointInCircle({x: 1, y: 1}, true);
    });

    it('tests if a point is not inside a circle', async function () {
        checkPointInCircle({x: 3, y: 3}, false);
    });

    function checkPointInCircle(point, expected) {
        const circleCenter = {x: 0, y: 0};
        const circleRadius = 2;
        let isInCircle = PointCalculation.checkPointInCircle(point, circleCenter, circleRadius);
        expect(isInCircle).toEqual(expected);
    }

    it('tests the relative 2D viewer position (same) computation of a point to a fixed one',
        async function () {
            checkRelativePositionOfPoint({x: 1, y: 1}, RelativePosition.same);
        }
    );

    it('tests the relative 2D viewer position (right) computation of a point to a fixed one',
        async function () {
            checkRelativePositionOfPoint({x: 1.5, y: 1}, RelativePosition.right);
        }
    );

    it('tests the relative 2D viewer position (left) computation of a point to a fixed one',
        async function () {
            checkRelativePositionOfPoint({x: 0.5, y: 1}, RelativePosition.left);
        }
    );

    it('tests the relative 2D viewer position (above) computation of a point to a fixed one',
        async function () {
            checkRelativePositionOfPoint({x: 1, y: 1.5}, RelativePosition.above);
        }
    );

    it('tests the relative 2D viewer position (below) computation of a point to a fixed one',
        async function () {
            checkRelativePositionOfPoint({x: 1, y: 0.5}, RelativePosition.below);
        }
    );

    function checkRelativePositionOfPoint(relativePoint, expectedPosition) {
        const fixedPoint = {x: 1, y: 1};
        const position = PointCalculation.getRelativePositionPointPoint(fixedPoint, relativePoint);
        expect(position).toEqual(expectedPosition);
    }

    it('finds the side (right) of a point offering the most free space', async function () {
        checkBestSideForPoint([{x: 0.8, y: 1}, {x: 1, y: 1.1}, {x: 1, y: 0.9}], 'right');
    });

    it('finds the side (left) of a point offering the most free space', async function () {
        checkBestSideForPoint([{x: 1, y: 0.9}, {x: 1, y: 1.1}, {x: 1.1, y: 1}], 'left');
    });

    it('finds the side (down) of a point offering the most free space', async function () {
        checkBestSideForPoint([{x: 1, y: 0.9}, {x: 0.9, y: 1}, {x: 1.1, y: 1}], 'down');
    });

    it('finds the side (up) of a point offering the most free space', async function () {
        checkBestSideForPoint([{x: 1, y: 1.1}, {x: 0.8, y: 1}, {x: 1.2, y: 1}], 'up');
    });

    function checkBestSideForPoint(neighbors, expectedDirection) {
        //these are directions of lines towards the sides of a point,
        //therefore side with most free space = inverted direction
        const bestDirection = PointCalculation.findSideMostSpace({x: 1, y: 1}, neighbors, true);
        expect(bestDirection).toEqual(expectedDirection);
    }

    it(
        'determines point at a position (right) with a certain distance relative to a given point',
        async function () {
            checkNewPointForRelativePosition(RelativePosition.right, {x: 1.5, y: 1}, 0.5);
        }
    );

    it(
        'determines point at a position (left) with a certain distance relative to a given point',
        async function () {
            checkNewPointForRelativePosition(RelativePosition.left, {x: 0.5, y: 1}, 0.5);
        }
    );

    it(
        'determines point at a position (above) with a certain distance relative to a given point',
        async function () {
            checkNewPointForRelativePosition(RelativePosition.above, {x: 1, y: 1.5}, 0.5);
        }
    );

    it(
        'determines point at a position (below) with a certain distance relative to a given point',
        async function () {
            checkNewPointForRelativePosition(RelativePosition.below, {x: 1, y: 0.5}, 0.5);
        }
    );

    function checkNewPointForRelativePosition(relativePosition, expectedPoint, distance) {
        const fixedPoint = {x: 1, y: 1};
        const relativePoint = PointCalculation.getPointByRelativePosition(fixedPoint,
            relativePosition,
            distance
        );
        compareCoordinates(relativePoint, expectedPoint);
    }

    it('tests the movement of a point towards another', async function () {
        const movedPoint = PointCalculation.movePointTowardsAnother({x: 1, y: 1}, {x: 1, y: 4}, 2);
        compareCoordinates(movedPoint, {x: 1, y: 3});
    });

    it('tests the movement of a point towards another', async function () {
        const pointToMove = {x: 1, y: 1};
        const moveFunctions = PointCalculation.createMovementBetweenTwoPoints(pointToMove,
            {x: 2, y: 1}
        );
        let movedPoint = moveFunctions.forward(0.5);
        compareCoordinates(movedPoint, {x: 1.5, y: 1});
        movedPoint = moveFunctions.forward(-0.5);
        compareCoordinates(movedPoint, {x: 1, y: 1});
    });

    it('tests for some points which ones are part of the convex hull', async function () {
        const points = [
            {x: 0, y: 0},
            {x: 0.35, y: 0.35},
            {x: 0.5, y: 0.75},
            {x: 0.75, y: 0.75},
            {x: 1, y: 1},
            {x: 1, y: 0},
            {x: 0.5, y: 0.5}
        ];
        const hullPoints = PointCalculation.findConvexHull(points);
        expect(hullPoints.length).toEqual(4);
        const expectedHullPoints = [{x: 0, y: 0}, {x: 0.5, y: 0.75}, {x: 1, y: 1}, {x: 1, y: 0}];
        expectedHullPoints.forEach(expectedPoint => expect(hullPoints.includes(expectedPoint)));
    });

    it('tests the distance computation between two points by point x,y distances',
        async function () {
            const distance = PointCalculation.getDist2dByDists(0, 1);
            expect(distance).toBeCloseTo(1);
        }
    );

    it('tests the midpoint computation of an edge', async function () {
        const midPoint = PointCalculation.findEdgeMidpoint({x: 0, y: 0}, {x: 1, y: 1});
        compareCoordinates(midPoint, {x: 0.5, y: 0.5});
    });

    it('tests the geometric center computation of some points', async function () {
        const centerPoint = PointCalculation.findGeometricCenter([
            {x: 1, y: 1}, {x: -1, y: -1}, {x: -1, y: 1}, {x: 1, y: -1}
        ]);
        compareCoordinates(centerPoint, {x: 0, y: 0});
    });

    it(
        'tests the translation of global (cursor) position to a local position inside DOM element',
        async function () {
            const point = PointCalculation.getCoordinatesInElement({x: 1.5, y: 1.5},
                {x: 0.5, y: 0.5}
            );
            compareCoordinates(point, {x: 1, y: 1});
        }
    );

    it('tests for same coordinates if they are almost equal (true) with tolerance 0',
        async function () {
            const almostEqual = PointCalculation.coordsAlmostEqual({x: 1, y: 1}, {x: 1, y: 1}, 0);
            expect(almostEqual).toEqual(false);
        }
    );

    it('tests for same coordinates if they are almost equal (true) with enough tolerance',
        async function () {
            const almostEqual = PointCalculation.coordsAlmostEqual({x: 1, y: 1}, {x: 1, y: 1}, 0.1);
            expect(almostEqual).toEqual(true);
        }
    );

    it('tests for different coordinates if they are almost equal (false) with not enough' +
        ' tolerance', async function () {
        const almostEqual = PointCalculation.coordsAlmostEqual({x: 1, y: 1}, {x: 2, y: 2}, 0.5);
        expect(almostEqual).toEqual(false);
    });

    it('tests for different coordinates if they are almost equal (true) with enough tolerance' +
        ' (2)', async function () {
        const almostEqual = PointCalculation.coordsAlmostEqual({x: 1, y: 1}, {x: 2, y: 2}, 2);
        expect(almostEqual).toEqual(true);
    });

    function compareCoordinates(point, expectedCoordinates) {
        expect(point.x).toBeCloseTo(expectedCoordinates.x);
        expect(point.y).toBeCloseTo(expectedCoordinates.y);
    }
});