angular
    .module('redComponents.visualizations.maps.local', [
        'lodash',
        'redComponents.geo'
    ])
    .directive('maplocal', function () {
        return {
            restrict: 'E',
            scope: {
                hover: '=',
                panel: '=',
                displayHeatline: '='
            },
            templateUrl: '/components/visualizations/maps/local/local.html',
            controller: function ($scope, _, geo) {
                var percentageOfWindow = 0.9;

                $scope.map = {
                    height: 600,
                    width: 1000
                };

                if (_.isUndefined($scope.displayHeatline)) {
                    $scope.displayHeatline = false;
                }

                // function setupPanel() {

                var latitudes = $scope.panel.panel['gps:latitude'];
                var longitudes = $scope.panel.panel['gps:longitude'];
                var speed = $scope.panel.panel['gps:speed'];
                var time = $scope.panel.panel.time;


                var validPaths = [];
                var invalidPaths = [];
                var hoverablePoints = [];

                var heatPoints = [];

                var lastPoint = true; // "valid" first point
                // todo strip out the single last invalid point if it starts on invalid.
                // todo make sure it works with no at the start.
                _.each(_.zip(longitudes, latitudes), function (point, index) {
                    if (point[0] && point[1]) { // not null
                        // Valid Point
                        hoverablePoints.push({point: point, index: index});
                        if (lastPoint === null) {
                            // We are comming off of an invalid streak.
                            // Store the current point as the "end" of that streak.
                            invalidPaths[invalidPaths.length - 1].push(point);
                            // And start a new valid streak.
                            validPaths.push([point]);
                        } else if (validPaths.length === 0) {
                            // special case: first valid point
                            validPaths.push([point]);
                        } else {
                            // We're in the middle of a valid streak
                            validPaths[validPaths.length - 1].push(point);

                            heatPoints.push({
                                start: lastPoint,
                                end: point,
                                speed: speed[index]
                            });
                        }
                        lastPoint = point;
                    } else {
                        // Invalid Point
                        if (lastPoint) { // not null
                            invalidPaths.push([lastPoint]);
                        }
                        lastPoint = null;
                    }
                });


                function createProjection(geoJSONPoints) {
                    var projection = d3.geo.mercator().scale(1);


                    var bounds = d3.geo.path().projection(projection).bounds(geoJSONPoints);

                    var scale = percentageOfWindow / Math.max(
                            (bounds[1][0] - bounds[0][0]) / $scope.map.width,
                            (bounds[1][1] - bounds[0][1]) / $scope.map.height
                        );
                    projection.scale(scale);

                    var geoBounds = d3.geo.bounds(geoJSONPoints);
                    projection.center([
                        (geoBounds[1][0] + geoBounds[0][0]) / 2,
                        (geoBounds[1][1] + geoBounds[0][1]) / 2
                    ]);

                    projection.translate([$scope.map.width / 2, $scope.map.height / 2]);

                    return projection;
                }


                var projection = createProjection({
                    type: 'MultiLineString',
                    coordinates: validPaths
                });

                var pathBuilder = d3.geo.path().projection(projection);

                $scope.validPath = pathBuilder({
                    type: 'MultiLineString',
                    coordinates: validPaths
                });
                $scope.invalidPath = pathBuilder({
                    type: 'MultiLineString',
                    coordinates: invalidPaths
                });


                function createHeatSegments(speed, heatPoints) {
                    // This clever multi-color scale stuff is taken from here: https://groups.google.com/d/msg/d3-js/B31N2zSVEiE/rxXNlS8zCXIJ
                    var heatScale = d3.scale.linear()
                        .domain(d3.extent(speed));
                    heatScale.domain([0, 0.2, 0.4, 0.95, 1].map(heatScale.invert));
                    heatScale.range(['black', "blue", "yellow", "red", 'white']);

                    return _.map(heatPoints, function (segment) {
                        return {
                            startPixels: projection(segment.start),
                            endPixels: projection(segment.end),
                            color: heatScale(segment.speed)
                        };
                    });
                }

                $scope.dragging = false;

                $scope.closestPixels = projection(hoverablePoints[0].point);

                $scope.heatSegments = createHeatSegments(speed, heatPoints);


                function createScales(projection, height, width) {
                    // Note that this mapping DOES NOT take the geographic projection into
                    // account. So, we assume that it's "good enough" for close up work
                    // regardless of projection (flat earth assumption).
                    var scaleScale = d3.scale.linear()
                        // Create a scale from 0 to the width of the map (in the geo domain), in meters
                        .domain([0, geo.distanceBetween(projection.invert([0, 0]), projection.invert([width, 0]))])
                        // And map it to pixels
                        .range([0, width]);

                    // Calculate the pixels for each tick
                    return _.chain(scaleScale.ticks(6))
                        .map(function (tick) {
                            var offset = scaleScale(tick);
                            return {
                                sideY: height - offset,
                                bottomX: scaleScale(tick),
                                text: tick
                            };
                        })
                        // The 0 mark will be displayed right on the edge of the map, so
                        // we get rid of it.
                        .rest().value();
                }

                $scope.gridLines = createScales(projection, $scope.map.height, $scope.map.width);

                $scope.markers = {
                    start: projection(hoverablePoints[0].point),
                    end: projection(hoverablePoints[hoverablePoints.length - 1].point)
                };

                $scope.hovermove = function ($event) {
                    if ($scope.dragging) {
                        var mousePoint =
                            projection.invert([$event.offsetX, $event.offsetY]);


                        $scope.mousePoint = mousePoint;

                        var closestPoint = _.min(hoverablePoints, function (point) {
                            return geo.distanceBetween(point.point, mousePoint);
                        });

                        $scope.closestPixels = projection(closestPoint.point);

                        console.log('closestPoint.index: ' + closestPoint.index + ', ' + time[closestPoint.index]);
                        angular.extend($scope.hover, {
                            time: new Date(time[closestPoint.index]),
                            index: closestPoint.index
                        });
                    }
                };


                $scope.$watch('hover.index', function (hoverIndex) {
                    if (hoverIndex) {
                        if (latitudes[hoverIndex] && longitudes[hoverIndex]) {
                            $scope.closestPixels = projection([
                                longitudes[hoverIndex],
                                latitudes[hoverIndex]
                            ]);
                        }
                    }
                });


                $scope.hovermarkerMoveStart = function ($event) {
                    $scope.dragging = true;

                    $event.preventDefault();
                };

                $scope.hovermarkerMoveEnd = function () {
                    $scope.dragging = false;
                };

                $scope.$watch('displayHeatline', function (newValue) {
                    if (newValue) { // truthy
                        //drawHeatline();
                    } else {
                        //drawSimpleline();
                    }
                });


            }
        };
    });