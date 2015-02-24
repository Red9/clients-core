angular
    .module('redComponents.visualizations.charts.timeseries', [])
    .directive('timeseries', function () {
        return {
            restrict: 'E',
            scope: {
                time: '=',
                ySeries: '=',
                hover: '=',
                yLabel: '@'
            },
            templateUrl: '/components/visualizations/charts/timeseries/timeseries.html',
            controller: function ($scope, $element, $window) {
                var xScale;

                $scope.$watch('hover.time', function (hoverTime) {
                    if (hoverTime) {
                        graph.hoverline.x = xScale(hoverTime);
                        calculateValueBox();
                    }
                });

                $scope.hovermove = function ($event) {
                    var hoverTime = xScale.invert($event.offsetX);
                    angular.extend($scope.hover, {
                        time: hoverTime,
                        index: d3.bisectLeft($scope.time, hoverTime)
                    });
                };
                $scope.hoverleave = function () {
                    angular.extend($scope.hover, {
                        time: null,
                        index: null
                    });
                };

                var ySeries = angular.copy($scope.ySeries);
                $scope.ySeries = ySeries;
                var seriesInView = Object.keys(ySeries);

                var tickSize = 5;
                var fontSize = 15;

                $scope.toggleSeries = function ($event, key) {
                    var index = _.indexOf(seriesInView, key);
                    if (index !== -1) {
                        seriesInView.splice(index, 1);
                    } else {
                        seriesInView.push(key);
                    }

                    drawGraph(graph.width);
                };

                var graph = {
                    hoverline: {
                        x: 100,
                        visible: false
                    }
                };
                $scope.graph = graph;

                var valueBoxLineHeight = 18;
                var valueBoxColumnWidth = 100;

                function calculateValueBox() {
                    var index = 0;
                    graph.valueBox = {
                        x: graph.axes.y.width + 10,
                        y: 20,
                        labels: _.chain(ySeries).pick(seriesInView).map(
                            function (series, key) {
                                return {
                                    y: index++ * valueBoxLineHeight,
                                    key: {
                                        x: 0,
                                        text: key
                                    },

                                    value: {
                                        x: valueBoxColumnWidth,
                                        text: series[$scope.hover.index] ?
                                            series[$scope.hover.index].toPrecision(3) :
                                            null
                                    }
                                };
                            })
                            .value()
                    };
                }


                function drawGraph(width) {
                    graph.width = width;

                    graph.plot = {
                        height: 350
                    };
                    graph.axes = {
                        x: {
                            height: 20
                        },
                        y: {
                            width: 60
                        }
                    };
                    graph.key = {
                        height: 20
                    };

                    graph.plot.width = graph.width - graph.axes.y.width;
                    graph.height = graph.plot.height + graph.axes.x.height + graph.key.height + 10;

                    var xTickCount = 6;
                    xScale = d3.time.scale()
                        .range([graph.width - graph.plot.width, graph.width])
                        .domain(d3.extent($scope.time));
                    var xTickFormat = xScale.tickFormat(xTickCount);

                    var yTickCount = 6;
                    var yScale = d3.scale.linear()
                        .range([graph.plot.height, 0])
                        .clamp(true) // Make sure that null doesn't go to 0
                        .domain(d3.extent(
                            // Get the minimum and maximum value across all the
                            // series that we have.
                            _.chain(ySeries)
                                .pick(seriesInView)
                                .map(function (array) {
                                    return d3.extent(array);
                                })
                                .flatten()
                                .value()
                        ));

                    // Generate X Axis
                    graph.axes.x.ticks = _.map(xScale.ticks(xTickCount), function (domainValue) {
                        return {
                            line: {
                                x: xScale(domainValue),
                                y1: graph.plot.height,
                                y2: graph.plot.height + tickSize
                            },
                            label: {
                                x: xScale(domainValue),
                                y: graph.plot.height + tickSize + fontSize,
                                text: xTickFormat(domainValue)
                            }
                        };
                    });

                    // Generate Y Axis
                    graph.axes.y.label = {
                        x: fontSize,
                        y: graph.plot.height / 2,
                        text: $scope.yLabel
                    };
                    graph.axes.y.ticks = _.map(yScale.ticks(yTickCount), function (domainValue) {
                        return {
                            line: {
                                x1: graph.axes.y.width - tickSize,
                                x2: graph.axes.y.width,
                                y: yScale(domainValue)
                            },
                            label: {
                                x: graph.axes.y.width - tickSize - fontSize,
                                y: yScale(domainValue),
                                text: domainValue.toPrecision(2)
                            }
                        };
                    });

                    function createLine(x, y) {
                        return d3.svg.line()
                            .x(function (d) {
                                return xScale(d[0]);
                            })
                            .y(function (d) {
                                return yScale(d[1]);
                            })
                        (_.zip(x, y));
                    }


                    var keyStep = graph.plot.width / (Object.keys(ySeries).length + 1);
                    var keyX = graph.axes.y.width;

                    $scope.plots = _.mapValues(ySeries, function (series, key) {
                        keyX += keyStep;
                        var result = {
                            key: {
                                x: keyX,
                                y: graph.plot.height + graph.axes.x.height + graph.key.height
                            }
                        };

                        if (_.indexOf(seriesInView, key) !== -1) {
                            result.line = {
                                svgLine: $scope.svgLine = createLine($scope.time, series)
                            };
                        }
                        return result;
                    });

                    calculateValueBox();


                }

                // This IIFE business is to overcome the Bootstrap deal where it
                // calculates the final offsetWidth after some time. I can't
                // always keep this around since it's a performance hog. I could
                // just call with a -15, but then what if that constant changes?
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
                    }, drawGraph);
                })();

                // Resize graphs on window resize
                angular.element($window).bind('resize', function () {
                    drawGraph($element[0].children[0].offsetWidth);
                });
            }
        };
    });
