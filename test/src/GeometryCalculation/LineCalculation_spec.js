describe('InteractionDrawer GeometryCalculation LineCalculation', function () {

    it('tests linear function computation for two points', async function () {
        const expectedLine = new Line(1, 0);
        const line = LineCalculation.createLinearFunctionByTwoPoints({x: 0, y: 0}, {x: 1, y: 1});
        expect(expectedLine.m).toEqual(1);
        expect(expectedLine.b).toEqual(0);
    });

    it('tests line computation parallel to a given line', async function () {
        const expectedPoints = [{x: 0.25, y: 0.25}, {x: 4.75, y: 0.25}];
        //0.5*0.5=0.25 for y..., 135 for some line shortening
        const line = LineCalculation.createInnerLine({x: 0, y: 0},
            {x: 5, y: 0},
            {x: 0.5, y: 0.5},
            0.5,
            135
        );
        const points = line.points;
        compareCoordinates(points[0], expectedPoints[0]);
        compareCoordinates(points[1], expectedPoints[1]);
        expect(line.secondMakesSense).toEqual(true);
    });

    it('tests line dash offset computation for a line', async function () {
        //the start of the dash array computation is pushed by 2 user units
        const offset = LineCalculation.calcDashOffset(10, 2, 1);
        //'-- -- -- -'  => ' -- -- -- '
        expect(offset).toEqual(-1);
    });

    it('tests the intersection computation for two lines', async function () {
        const line1 = new Line(0.5, 0);
        const line2 = new Line(-0.5, 1);
        const intersection = LineCalculation.findIntersectionTwoLines(line1, line2);
        // |X
        expect(intersection).toEqual({x: 1, y: 0.5});
    });

    it('tests the intersection computation for two vertical lines', async function () {
        const line1 = new VerticalLine(1);
        const line2 = new Line(-0.5, 1);
        const intersection = LineCalculation.findIntersectionLineVerticalLine(line1, line2);
        // |X
        expect(intersection).toEqual({x: 1, y: 0.5});
    });

    it('tests if some points hit a line segment', async function () {
        checkPointLineSegmentHit({x: 1, y: 1}, true);
        checkPointLineSegmentHit({x: 1, y: 0.999}, false);
        checkPointLineSegmentHit({x: 1, y: 0.999}, false);
        checkPointLineSegmentHit({x: -1, y: -1}, false);
        checkPointLineSegmentHit({x: 3, y: 3}, false);
    });

    function checkPointLineSegmentHit(point, expectedHit) {
        const hit = LineCalculation.checkPointOnLineSegment({x: 0, y: 0}, {x: 2, y: 2}, point);
        expect(hit).toEqual(expectedHit);
    }

    it('tests that two crossing line segments hit each other', async function () {
        checkTwoLineSegmentsHit({x: 2, y: 1}, {x: 1, y: 2}, true);
    });

    it('tests if two line segments hit each other. The endpoint of first one touches the second' +
        ' one', async function () {
        checkTwoLineSegmentsHit({x: 2, y: 1}, {x: 1.5, y: 1.5}, true);
    });

    it('tests if two line segments hit each other. The endpoint of first one almost touches the' +
        ' second one', async function () {
        checkTwoLineSegmentsHit({x: 2, y: 1}, {x: 1.5, y: 1.499}, false);
    });

    function checkTwoLineSegmentsHit(point1, point2, expectedHit) {
        const hit = LineCalculation.checkTwoLineSegmentsInteract({x: 1, y: 1},
            {x: 2, y: 2},
            point1,
            point2
        );
        expect(hit).toEqual(expectedHit);
    }

    it('tests if a line (by endpoints) hits a circle. Line goes trough circle', async function () {
        checkCircleLineHitEndpoints({x: -1, y: 0}, {x: 1.5, y: 0}, true);
    });

    it('tests if a line (by endpoints) hits a circle. Line is inside and near the circle' +
        ' boundary', async function () {
        checkCircleLineHitEndpoints({x: 0.999, y: 0}, {x: 1.5, y: 0}, true);
    });

    it('tests if a line (by endpoints) hits a circle. Line is on the circle boundary',
        async function () {
            checkCircleLineHitEndpoints({x: 1, y: 0}, {x: 1.5, y: 0}, true);
        }
    );

    it(
        'tests if some lines (by endpoints) hit a circle. Line is almost on the circle boundary',
        async function () {
            checkCircleLineHitEndpoints({x: 1.001, y: 0}, {x: 1.5, y: 0}, false);
        }
    );

    function checkCircleLineHitEndpoints(point1, point2, expectedHit) {
        //compares vector length
        const hit = LineCalculation.checkIntersectionLineCircle(point1,
            point2,
            {x: 0, y: 0, rad: 1}
        );
        expect(hit).toEqual(expectedHit);
    }

    it('tests if a line (by slope and y intersection) hits a circle', async function () {
        checkCircleLineHitFormula(1, 0, {x: 1, y: 1}, {x: -1, y: -1});
    });

    it('tests if a line (by slope and y intersection) does not hit a circle', async function () {
        const points = LineCalculation.findCircleLineIntersections(1.414, 0, 0, 2, -4);
        expect(points).toEqual([]);
    });

    function checkCircleLineHitFormula(slope, yIntersection, expectedPoint1, expectedPoint2) {
        const points = LineCalculation.findCircleLineIntersections(1.414,
            0,
            0,
            slope,
            yIntersection
        );
        compareCoordinates(points[0], expectedPoint1);
        compareCoordinates(points[1], expectedPoint2);
    }

    it('tests x coordinates calculation of intersections of a circle and a line',
        async function () {
            const xCoordinates = LineCalculation.findCircleLineIntersectionsXCoord(1.414,
                0,
                0,
                1,
                0
            );
            expect(xCoordinates.length).toEqual(2);
            expect(xCoordinates[0]).toBeCloseTo(1);
            expect(xCoordinates[1]).toBeCloseTo(-1);
        }
    );

    it('tests the intersection computation of a circle and a line where line is defined as point' +
        ' and angle', async function () {
        const points = LineCalculation.findCircleLineIntersectionsFromPointAngle(1.414,
            0,
            0,
            1,
            1,
            0
        );
        expect(points.length).toEqual(2);
        compareCoordinates(points[0], {x: 1, y: 1});
        compareCoordinates(points[1], {x: -1, y: 1});
    });

    it('tests the calculation of the position to a line a given point lies (right)',
        async function () {
            checkPointSideToLine({x: -0.5, y: 0.5}, 1);
        }
    );

    it('tests the calculation of the position to a line a given point lies (left)',
        async function () {
            checkPointSideToLine({x: 0.5, y: 0.5}, -1);
        }
    );

    it('tests the calculation of the position to a line a given point lies (on line)',
        async function () {
            checkPointSideToLine({x: 0, y: 1}, 0);
        }
    );
    it('tests the calculation of the position to a line a given point lies (right, almost on' +
        ' line)', async function () {
        checkPointSideToLine({x: -0.001, y: 1}, 1);
    });

    it('tests the calculation of the position to a line a given point lies (left, almost on' +
        ' line)', async function () {
        checkPointSideToLine({x: 0.001, y: 1}, -1);
    });

    it('tests the calculation of the position to a line a given point lies (above)',
        async function () {
            checkPointSideToLine({x: 0, y: 1.001}, 0);
        }
    );

    function checkPointSideToLine(point, expectedSide) {
        //-1 left, 1 right depending on direction
        const side = LineCalculation.getSideOfLine({x: 0, y: 0}, {x: 0, y: 1}, point);
        expect(side).toEqual(expectedSide);
    }

    it('tests whether a point lies to the left of a defined line (right)', async function () {
        checkPointLeftSideToLine({x: -0.5, y: 0.5}, false);
    });

    it('tests whether a point lies to the left of a defined line (left)', async function () {
        checkPointLeftSideToLine({x: 0.5, y: 0.5}, true);
    });

    it('tests whether a point lies to the left of a defined line (onto line)', async function () {
        checkPointLeftSideToLine({x: 0, y: 1}, false);
    });

    it('tests whether a point lies to the left of a defined line (right, almost onto line)',
        async function () {
            checkPointLeftSideToLine({x: -0.001, y: 1}, false);
        }
    );

    it('tests whether a point lies to the left of a defined line (left, almost onto line)',
        async function () {
            checkPointLeftSideToLine({x: 0.001, y: 1}, true);
        }
    );

    it('tests whether a point lies to the left of a defined line (above line)', async function () {
        checkPointLeftSideToLine({x: 0, y: 1.001}, false);
    });

    function checkPointLeftSideToLine(point, expectedSide) {
        const side = LineCalculation.isLeft({x: 0, y: 0}, {x: 0, y: 1}, point);
        expect(side).toEqual(expectedSide);
    }

    it('tests the mirroring computation of given points to a given line', async function () {
        const points = [{x: 0, y: 0.5}, {x: 0, y: 1.5}, {x: -0.5, y: 0.5}, {x: 0.6, y: 0.6}];
        const mirroredPoints = LineCalculation.mirrorPointsOnLine(points,
            {x: 0, y: 0},
            {x: 0, y: 1}
        );
        expect(mirroredPoints.length).toEqual(4);
        const expectedPoints = [
            {x: 0, y: 0.5}, {x: 0, y: 1.5}, {x: 0.5, y: 0.5}, {x: -0.6, y: 0.6}
        ];
        expect(mirroredPoints.length).toEqual(4);
        for (let i = 0; i < 4; i++) {
            compareCoordinates(mirroredPoints[i], expectedPoints[i]);
        }
    });

    it('tests the computation of points of line after shortening it', async function () {
        const newPoints = LineCalculation.shortenLine({x: 0, y: 0}, {x: 0, y: 1}, 0.25, 0.25);
        compareCoordinates(newPoints[0], {x: 0, y: 0.25});
        compareCoordinates(newPoints[1], {x: 0, y: 0.75});
    });

    it(
        'tests the computation of slope and y intersection of a line defined by angle and point',
        async function () {
            const calculated = LineCalculation.getLineFromPointAngle(0, 1, 0.785398);
            expect(calculated.slope).toBeCloseTo(1);
            expect(calculated.y0).toBeCloseTo(1);
        }
    );

    it('tests the computation of unit normals of a line', async function () {
        const expectedNormals = [{x: -1, y: 0}, {x: 1, y: 0}];
        const normals = LineCalculation.findUnitNormals({x: 0, y: 0}, {x: 0, y: 2});
        compareCoordinates(normals[0], {x: -1, y: 0});
        compareCoordinates(normals[1], {x: 1, y: 0});
    });

    it('tests the computation of normals of a line', async function () {
        const expectedNormals = [{x: -2, y: 0}, {x: 2, y: 0}];
        const normals = LineCalculation.findNormals({x: 0, y: 0}, {x: 0, y: 2});
        compareCoordinates(normals[0], expectedNormals[0]);
        compareCoordinates(normals[1], expectedNormals[1]);
    });

    function compareCoordinates(point, expectedCoordinates) {
        expect(point.x).toBeCloseTo(expectedCoordinates.x);
        expect(point.y).toBeCloseTo(expectedCoordinates.y);
    }
});

