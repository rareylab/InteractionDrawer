describe('InteractionDrawer GeometryCalculation PolygonCalculation', function () {

    it('tests the creation of vertices of a rectangle based on its starts and ends',
        async function () {
            const points = PolygonCalculation.createRectByBoundaries(0, 1, 0, 1);
            expect(points[0]).toEqual({x: 0, y: 0});
            expect(points[1]).toEqual({x: 1, y: 0});
            expect(points[2]).toEqual({x: 1, y: 1});
            expect(points[3]).toEqual({x: 0, y: 1});
        }
    );

    it('tests whether point hits a path of edges, defined by the points along this path. Point' +
        ' is on edge', async function () {
        checkPathPointHit({x: 0, y: 3}, true);
    });

    it('tests whether point hits a path of edges, defined by the points along this path. Point' +
        ' is on edge', async function () {
        checkPathPointHit({x: 0, y: 2.5}, true);
    });

    it('tests whether point hits a path of edges, defined by the points along this path. Point' +
        ' is next to edge but within margin (right)', async function () {
        checkPathPointHit({x: 0.1, y: 2.5}, true);
    });

    it('tests whether point hits a path of edges, defined by the points along this path. Point' +
        ' is next to edge but within margin (left)', async function () {
        checkPathPointHit({x: -0.1, y: 2.5}, true);
    });

    it('tests whether point hits a path of edges, defined by the points along this path. Point' +
        ' is not on edge or within margin', async function () {
        checkPathPointHit({x: 0.26, y: 2.5}, false);
    });

    it('tests whether point hits a path of edges, defined by the points along this path. Point' +
        ' is not on edge but almost within margin', async function () {
        checkPathPointHit({x: -0.26, y: 2.5}, false);
    });

    function checkPathPointHit(point, expected) {
        const pathPoints = [
            {x: 0, y: 0}, {x: 0, y: 1}, {x: 0, y: 2}, {x: 0, y: 3}, {x: 0, y: 4}, {x: 0, y: 5}
        ];
        const hit = PolygonCalculation.checkCollisionPointPath(pathPoints, 0.25, point);
        expect(hit).toEqual(expected);
    }

    it('tests whether a point lies within a polygon (defined by its edges). Point is inside',
        async function () {
            checkPolygonPointHit({x: 0.5, y: 0.5}, true);
        }
    );

    it('tests whether a point lies within a polygon (defined by its edges). Point is almost' +
        ' inside', async function () {
        checkPolygonPointHit({x: 0.5, y: -0.001}, false);
    });

    it('tests whether a point lies within a polygon (defined by its edges). Point is almost' +
        ' inside', async function () {
        checkPolygonPointHit({x: 0.5, y: 1.001}, false);
    });

    it('tests whether a point lies within a polygon (defined by its edges). Point is on' +
        ' boundary of polygon', async function () {
        checkPolygonPointHit({x: 1, y: 1}, false);
    });

    function checkPolygonPointHit(point, expected) {
        const polyEdges = [
            {x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 0}, {x: 1, y: 1}
        ];
        const hit = PolygonCalculation.checkCollisionPolygonPoint(point, polyEdges);
        expect(hit).toEqual(expected);
    }


    it('tests whether two polygons (defined by its edges) hit each other. Polygons have almost' +
        ' contact', async function () {
        const polyEdges = [
            {x: 1.001, y: 1.001}, {x: 1.001, y: 2}, {x: 2, y: 1.001}, {x: 2, y: 2}
        ];
        checkPolygonPolygonHit(polyEdges, false);
    });

    it('tests whether two polygons (defined by its edges) hit each other. Two Polygon edges are on' +
        ' top of each other', async function () {
        const polyEdges = [
            {x: 1, y: 1}, {x: 1, y: 2}, {x: 2, y: 1}, {x: 2, y: 2}
        ];
        checkPolygonPolygonHit(polyEdges, true);
    });

    it('tests whether two polygons (defined by its edges) hit each other. Very small' +
        ' intersection', async function () {
        const polyEdges = [
            {x: 0.999, y: 0.999}, {x: 0.999, y: 2}, {x: 2, y: 0.999}, {x: 2, y: 2}
        ];
        checkPolygonPolygonHit(polyEdges, true);
    });

    it('tests whether two polygons (defined by its edges) hit each other. Big intersection',
        async function () {
            const polyEdges = [
                {x: 0.5, y: 0.5}, {x: 0.5, y: 1.5}, {x: 1.5, y: 0.5}, {x: 1.5, y: 2}
            ];
            checkPolygonPolygonHit(polyEdges, true);
        }
    );

    it('tests whether two polygons (defined by its edges) hit each other. Polygon is inside the' +
        ' other one', async function () {
        const polyEdges = [
            {x: 0.25, y: 0.25}, {x: 0.25, y: 0.75}, {x: 0.75, y: 0.25}, {x: 0.75, y: 0.75}
        ];
        checkPolygonPolygonHit(polyEdges, true);
    });

    function checkPolygonPolygonHit(polyEdgesTest, expected) {
        const polyEdgesTarget = [
            {x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 0}, {x: 1, y: 1}
        ];
        const hit = PolygonCalculation.checkCollisionTwoPolygons(polyEdgesTest, polyEdgesTarget);
        expect(hit).toEqual(expected);
    }

    it('tests whether a line segment (given by its endpoints) hits a rectangle (intersection or' +
        ' fully inside). Line crosses polygon', async function () {
        checkLineSegmentPolygonHit({x: -1, y: -1}, {x: 1, y: 1}, true);
    });

    it('tests whether a line segment (given by its endpoints) hits a rectangle (intersection or' +
        ' fully inside). Line is inside', async function () {
        checkLineSegmentPolygonHit({x: 0.25, y: 0.25}, {x: 0.75, y: 0.75}, true);
    });

    it('tests whether a line segment (given by its endpoints) hits a rectangle (intersection or' +
        ' fully inside). Line is on polygon edge', async function () {
        checkLineSegmentPolygonHit({x: 0, y: 0}, {x: 1, y: 0}, true);
    });

    it('tests whether a line segment (given by its endpoints) hits a rectangle (intersection or' +
        ' fully inside). Line is almost on polygon edge', async function () {
        checkLineSegmentPolygonHit({x: -0.001, y: 0}, {x: -0.001, y: 1}, false);
    });

    function checkLineSegmentPolygonHit(point1, point2, expected) {
        const polyEdgesTarget = [
            {x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 0}, {x: 1, y: 1}
        ];
        const hit = PolygonCalculation.checkIntersectionLineRectangle(point1,
            point2,
            polyEdgesTarget
        );
        expect(hit).toEqual(expected);
    }

    it('tests the creation of vertices of a polygon based on a given line and no width',
        async function () {
            const expectedVertices = [{x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 2}, {x: 0, y: 2}];
            checkLineWidthPolygonCreation(0, expectedVertices);
        }
    );

    it('tests the creation of vertices of a polygon based on a given line and a given width',
        async function () {
            const expectedVertices = [{x: -2, y: 0}, {x: 2, y: 0}, {x: 2, y: 2}, {x: -2, y: 2}];
            checkLineWidthPolygonCreation(1, expectedVertices);
        }
    );

    function checkLineWidthPolygonCreation(width, expectedVertices) {
        const vertices = PolygonCalculation.createRectFromLine({x: 0, y: 0},
            {x: 0, y: 2},
            [{x: -2, y: 0}, {x: 2, y: 0}],
            width
        );
        expect(vertices.length).toEqual(4);
        for (let i = 0; i < vertices.length; i++) {
            compareCoordinates(vertices[0], expectedVertices[0]);
        }
    }

    it('tests the creation of bounding rectangle coordinates', async function () {
        const boundingCoordinates = PolygonCalculation.boundingRectangle({
            height: 1, width: 1, coords: {x: 0.5, y: 0.5}
        });
        expect(boundingCoordinates.xMin).toEqual(0);
        expect(boundingCoordinates.xMax).toEqual(1);
        expect(boundingCoordinates.yMin).toEqual(0);
        expect(boundingCoordinates.yMax).toEqual(1);
    });

    it('tests the determination of edge of a rectangle by position (below)', async function () {
        checkRectangleEdgeByPosition(RelativePosition.below, [{x: 0, y: 0}, {x: 1, y: 0}]);
    });

    it('tests the determination of edge of a rectangle by position (above)', async function () {
        checkRectangleEdgeByPosition(RelativePosition.above, [{x: 0, y: 1}, {x: 1, y: 1}]);
    });

    it('tests the determination of edge of a rectangle by position (left)', async function () {
        checkRectangleEdgeByPosition(RelativePosition.left, [{x: 0, y: 0}, {x: 0, y: 1}]);
    });

    it('tests the determination of edge of a rectangle by position (right)', async function () {
        checkRectangleEdgeByPosition(RelativePosition.right, [{x: 1, y: 0}, {x: 1, y: 1}]);
    });

    function checkRectangleEdgeByPosition(position, expectedEdgePoints) {
        const edgePoints = PolygonCalculation.getRectangleEdgeByPosition({
            xMin: 0, xMax: 1, yMin: 0, yMax: 1
        }, position);
        compareCoordinates(edgePoints[0], expectedEdgePoints[0]);
        compareCoordinates(edgePoints[1], expectedEdgePoints[1]);
    }

    it('tests the determination of corners of a rectangle by position (aboveLeft)',
        async function () {
            checkRectangleCornerByPosition(RelativePosition.aboveLeft, {x: 0, y: 1});
        }
    );

    it('tests the determination of corners of a rectangle by position (aboveRight)',
        async function () {
            checkRectangleCornerByPosition(RelativePosition.aboveRight, {x: 1, y: 1});
        }
    );

    it('tests the determination of corners of a rectangle by position (belowLeft)',
        async function () {
            checkRectangleCornerByPosition(RelativePosition.belowLeft, {x: 0, y: 0});
        }
    );

    it('tests the determination of corners of a rectangle by position (belowRight)',
        async function () {
            checkRectangleCornerByPosition(RelativePosition.belowRight, {x: 1, y: 0});
        }
    );

    function checkRectangleCornerByPosition(position, expectedCorner) {
        const corner = PolygonCalculation.getRectangleCornerByPosition({
            xMin: 0, xMax: 1, yMin: 0, yMax: 1
        }, position);
        compareCoordinates(corner, expectedCorner);
    }

    it('tests the conversion of a axis aligned rectangle given by its mid, height and width to' +
        ' maxes', async function () {
        const maxes = PolygonCalculation.convertRectangleMidDimensionsToMaxes({x: 0.5, y: 0.5},
            {height: 1, width: 1}
        );
        expect(maxes.xMin).toEqual(0);
        expect(maxes.xMax).toEqual(1);
        expect(maxes.yMin).toEqual(0);
        expect(maxes.yMax).toEqual(1);
    });

    it('tests that a polygon (defined by its edges) and a circle interact', async function () {
        const polyEdges = [
            {x: 0, y: 0},
            {x: 1, y: 0},
            {x: 0, y: 1},
            {x: 1, y: 1},
            {x: 0, y: 0},
            {x: 0, y: 1},
            {x: 1, y: 0},
            {x: 1, y: 1}
        ];
        checkPolygonCircleHit(polyEdges, true);
    });

    it('tests that a polygon (defined by its edges) and a circle interact. Polygon is inside' +
        ' circle', async function () {
        const polyEdges = [
            {x: 0, y: 0},
            {x: 0.5, y: 0},
            {x: 0, y: 0.5},
            {x: 0.5, y: 0.5},
            {x: 0, y: 0},
            {x: 0, y: 0.5},
            {x: 0.5, y: 0},
            {x: 0.5, y: 0.5}
        ];
        checkPolygonCircleHit(polyEdges, true);
    });

    it('tests that a polygon (defined by its edges) and a circle interact. Polygon edge touches' +
        ' circle boundary', async function () {
        const polyEdges = [
            {x: 1, y: 1},
            {x: 2, y: 1},
            {x: 1, y: 2},
            {x: 2, y: 2},
            {x: 1, y: 1},
            {x: 1, y: 2},
            {x: 2, y: 1},
            {x: 2, y: 2}
        ];
        checkPolygonCircleHit(polyEdges, false);
    });

    function checkPolygonCircleHit(polyEdges, expected) {
        const circle = {x: 0, y: 0, rad: 1};
        const hit = PolygonCalculation.checkCollisionPolygonCircle(circle, polyEdges);
        expect(hit).toEqual(expected);
    }

    it('tests whether a point lies within a polygon (defined by its edges)', async function () {
        checkPolygonPointHitWn({x: 0.5, y: 0}, -1);
    });

    it('tests whether a point lies within a polygon (defined by its edges). Point is close to' +
        ' polygon boundary', async function () {
        checkPolygonPointHitWn({x: 0.999, y: 0}, -1);
    });

    it('tests whether a point lies outside of a polygon (defined by its edges)',
        async function () {
            checkPolygonPointHitWn({x: 1.001, y: 0}, 0);
        }
    );

    function checkPolygonPointHitWn(point, expected) {
        const polyEdges = [
            {x: 0, y: 0},
            {x: 1, y: 0},
            {x: 0, y: 1},
            {x: 1, y: 1},
            {x: 0, y: 0},
            {x: 0, y: 1},
            {x: 1, y: 0},
            {x: 1, y: 1}
        ];
        const hit = PolygonCalculation.calcWindingNumber(point, polyEdges);
        expect(hit).toEqual(expected);
    }

    it('tests closest point computation on the outer lines of a axis aligned rectangle to a' +
        ' given point (right)', async function () {
        checkClosestPointOnRectangle({x: 1.5, y: 0.5},
            {x: 1, y: 0.5},
            0.5,
            false,
            RelativePosition.right
        );
    });

    it('tests closest point computation on the outer lines of a axis aligned rectangle to a' +
        ' given point (aboveRight)', async function () {
        checkClosestPointOnRectangle({x: 1, y: 1},
            {x: 1, y: 1},
            0,
            false,
            RelativePosition.aboveRight
        );
    });

    it('tests closest point computation on the outer lines of a axis aligned rectangle to a' +
        ' given point (aboveLeft)', async function () {
        checkClosestPointOnRectangle({x: 0, y: 1},
            {x: 0, y: 1},
            0,
            false,
            RelativePosition.aboveLeft
        );
    });

    it('tests closest point computation on the outer lines of a axis aligned rectangle to a' +
        ' given point (belowLeft)', async function () {
        checkClosestPointOnRectangle({x: 0, y: 0},
            {x: 0, y: 0},
            0,
            false,
            RelativePosition.belowLeft
        );
    });

    it('tests closest point computation on the outer lines of a axis aligned rectangle to a' +
        ' given point (belowRight)', async function () {
        checkClosestPointOnRectangle({x: 1, y: 0},
            {x: 1, y: 0},
            0,
            false,
            RelativePosition.belowRight
        );
    });

    it('tests closest point computation on the outer lines of a axis aligned rectangle to a' +
        ' given point (left)', async function () {
        checkClosestPointOnRectangle({x: -0.5, y: 0.5},
            {x: 0, y: 0.5},
            0.5,
            false,
            RelativePosition.left
        );
    });

    it('tests closest point computation on the outer lines of a axis aligned rectangle to a' +
        ' given point (above)', async function () {
        checkClosestPointOnRectangle({x: 0.5, y: 1.5},
            {x: 0.5, y: 1},
            0.5,
            false,
            RelativePosition.above
        );
    });

    it('tests closest point computation on the outer lines of a axis aligned rectangle to a' +
        ' given point (below)', async function () {
        checkClosestPointOnRectangle({x: 0.5, y: -0.5},
            {x: 0.5, y: 0},
            0.5,
            false,
            RelativePosition.below
        );
    });

    it('tests closest point computation on the outer lines of a axis aligned rectangle to a' +
        ' given point (inside)', async function () {
        checkClosestPointOnRectangle({x: 0.5, y: 0.5},
            {x: 0, y: 0.5},
            0.5,
            true,
            RelativePosition.inside
        );
    });

    function checkClosestPointOnRectangle(point, expectedPoint, distance, isInside, position) {
        const rectanglePoint = PolygonCalculation.getClosestPointOnRectangle(point, {
            xMin: 0, xMax: 1, yMin: 0, yMax: 1
        });
        compareCoordinates(rectanglePoint.point, expectedPoint);
        expect(rectanglePoint.dist).toEqual(distance);
        expect(rectanglePoint.isInside).toEqual(isInside);
        expect(rectanglePoint.relativePosition).toEqual(position);
    }

    it('tests the relative position of a point to a axis aligned rectangle (left)',
        async function () {
            checkPositionPointOnRectangle({x: -0.5, y: 0.5}, RelativePosition.left);
        }
    );

    it('tests the relative position of a point to a axis aligned rectangle (right',
        async function () {
            checkPositionPointOnRectangle({x: 1.5, y: 0.5}, RelativePosition.right);
        }
    );

    it('tests the relative position of a point to a axis aligned rectangle (above)',
        async function () {
            checkPositionPointOnRectangle({x: 0.5, y: 1.5}, RelativePosition.above);
        }
    );

    it('tests the relative position of a point to a axis aligned rectangle (below)',
        async function () {
            checkPositionPointOnRectangle({x: 0.5, y: -0.5}, RelativePosition.below);
        }
    );

    function checkPositionPointOnRectangle(point, expectedPosition) {
        const position = PolygonCalculation.getRelativePositionPointRectangle(point, {
            xMin: 0, xMax: 1, yMin: 0, yMax: 1
        }, true);
        expect(position).toEqual(expectedPosition);
    }

    it('tests the rotation computation of an axis aligned rectangle around a point (degree). Point' +
        ' is outside rectangle', async function () {
        checkRectangleRotationArroundPoint(180, false, {x: 0.5, y: 1.1}, {x: 0.5, y: 1.6});
    });

    it('tests the rotation computation of an axis aligned rectangle around a point (radians).' +
        ' Point is outside rectangle', async function () {
        checkRectangleRotationArroundPoint(3.14159, true, {x: 0.5, y: 1.1}, {x: 0.5, y: 1.6});
    });

    it('tests the rotation computation of an axis aligned rectangle around a point (radians).' +
        ' Point is inside rectangle', async function () {
        checkRectangleRotationArroundPoint(3.14159, true, {x: 0.5, y: 0.75}, {x: 0.5, y: 1.25});
    });

    function checkRectangleRotationArroundPoint(angle, isRadians, rotateArround, expectedMid) {
        const newMidPoint = PolygonCalculation.rotateRectangleAroundPoint({x: 0.5, y: 0.5}, {
            xMin: 0, xMax: 1, yMin: 0, yMax: 1
        }, rotateArround, angle, 0, false, isRadians);
        compareCoordinates(newMidPoint, expectedMid);
    }

    it('tests the rotation computation of an axis aligned rectangle around a point (degree).' +
        ' Point is outside rectangle. Rectangle touches circle adapting distance',
        async function () {
            const newMidPoint = PolygonCalculation.rotateRectangleAroundPoint(//Circle with radius 0.5 around point {x: 0, y: 1}.
                //Rectangle is on the right of circle -> distance 1.5 from rectangle mid to circle
                //mid. Distance decreases to 1 after rotation of 90 degree such that rectangle
                //lies on top of the circle.
                {x: 2, y: 0}, {
                    xMin: 1, xMax: 3, yMin: 0.5, yMax: 1.5
                }, {x: 0, y: 1}, 90, 0.5, false);
            compareCoordinates(newMidPoint, {x: 0.5, y: 2});
        }
    );

    it('tests relative position inversion (left to right)', async function () {
        checkPositionInversion(RelativePosition.left, RelativePosition.right);
    });

    it('tests relative position inversion (right to left)', async function () {
        checkPositionInversion(RelativePosition.right, RelativePosition.left);
    });

    it('tests relative position inversion (above to below)', async function () {
        checkPositionInversion(RelativePosition.above, RelativePosition.below);
    });

    it('tests relative position inversion (below to above)', async function () {
        checkPositionInversion(RelativePosition.below, RelativePosition.above);
    });

    function checkPositionInversion(position, expectedPosition) {
        expect(PolygonCalculation.invertRelativePosition(position)).toEqual(expectedPosition);
    }

    it('tests the center computation for a convex polygon', async function () {
        const polyVertices = [{x: -2, y: 0}, {x: 2, y: 0}, {x: 2, y: 2}, {x: -2, y: 2}];
        const center = PolygonCalculation.findCenterOfConvexPolygon(polyVertices);
        compareCoordinates(center.centroid, {x: 0, y: 1})
    });

    function compareCoordinates(point, expectedCoordinates) {
        expect(point.x).toBeCloseTo(expectedCoordinates.x);
        expect(point.y).toBeCloseTo(expectedCoordinates.y);
    }
});