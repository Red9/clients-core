angular
    .module('redComponents.visualizations.maps.local', [
        'lodash',
        'redComponents.geo'
    ])
    .directive('maplocal', function () {
        return {
            restrict: 'E',
            scope: {
                slides: '=',
                panel: '=',
                displayHeatline: '='
            },
            templateUrl: '/components/visualizations/maps/local/local.html',
            controller: function ($scope, $window, $element, _, geo) {
                var percentageOfWindow = 0.85;

                if (_.isUndefined($scope.displayHeatline)) {
                    $scope.displayHeatline = false;
                }

                function drawMap(width) {
                    $scope.map = {
                        height: 400,
                        width: width ? width : $scope.map.width // Allows for recalling this function
                    };

                    var latitudes = $scope.panel.panel['gps:latitude'];
                    var longitudes = $scope.panel.panel['gps:longitude'];
                    var speed = $scope.panel.panel['gps:speed'];
                    var time = $scope.panel.panel.time;


                    var validPaths = [];

                    var hoverablePoints = [];

                    var heatPoints = [];

                    var lastPoint = null;
                    _.each(_.zip(longitudes, latitudes), function (point, index) {
                        if (point[0] && point[1]) { // valid point
                            if (lastPoint === null) {
                                validPaths.push([]);
                            } else { // we can only construct the heatline if we have 2 valid points
                                heatPoints.push({
                                    start: lastPoint,
                                    end: point,
                                    speed: speed[index]
                                });
                            }
                            validPaths[validPaths.length - 1].push(point);
                            hoverablePoints.push({point: point, index: index});
                            lastPoint = point;
                        } else {
                            lastPoint = null;
                        }
                    });

                    if (hoverablePoints.length === 0) {
                        console.log('Cannot display map: no points');
                        $scope.noPoints = {
                            x: $scope.map.width / 2,
                            y: $scope.map.height / 2
                        };
                        return;
                    } else {
                        $scope.noPoints = false;
                    }


                    // TODO: this is not correct! Compare the leaflet map and the local map

                    lastPoint = _.last(_.first(validPaths));
                    var invalidPaths = _.chain(validPaths).rest().map(function (path) {
                        var result = [
                            lastPoint,
                            _.first(path)
                        ];
                        lastPoint = _.last(path);
                        return result;
                    }).value();


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

                            angular.extend($scope.hover, {
                                time: new Date(time[closestPoint.index]),
                                index: closestPoint.index
                            });
                        }
                    };


                    /** Calculate the closest index in the timeList from desiredTime.
                     * Duplicate!
                     * @param timeList
                     * @param desiredTime
                     * @returns {*}
                     */
                    function estimateIndex(timeList, desiredTime) {
                        var step = (_.last(timeList) - _.first(timeList)) / timeList.length;
                        return Math.round((desiredTime - _.first(timeList)) / step);
                    }

                    $scope.$watch('slides.hover', function (hoverTime) {
                        if (hoverTime) {
                            var hoverIndex = estimateIndex(time, hoverTime);
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
                }

                $scope.$watch('panel', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        drawMap();
                    }
                });

                // This IIFE business is to overcome the Bootstrap deal where it
                // calculates the final offsetWidth after some time. I can't
                // always keep this around since it's a performance hog. I could
                // just call with a -15px, but then what if that constant changes?
                // So, there's this little pearl* of a solution.
                // * hack
                (function () {
                    var count = 0;
                    var countMax = 100;
                    var listener = $scope.$watch(function () { // watch container width
                        if (++count > countMax) {
                            listener(); // deregister
                        }
                        return $element[0].children[0].offsetWidth;
                    }, drawMap);
                })();

                // Resize graphs on window resize
                angular.element($window).bind('resize', function () {
                    drawMap($element[0].children[0].offsetWidth);
                });

            }
        };
    });