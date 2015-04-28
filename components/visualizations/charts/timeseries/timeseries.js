angular
    .module('redComponents.visualizations.charts.timeseries', [])
    .directive('timeseries', function () {
        return {
            restrict: 'E',
            scope: {
                time: '=',
                ySeries: '=',
                slides: '=',
                //videoHover: '=',
                yLabel: '@'
            },
            templateUrl: '/components/visualizations/charts/timeseries/timeseries.html',
            controller: function ($scope, $element, $window) {
                var initialized = false;
                var graph;
                graph = {
                    slides: {}
                };
                $scope.graph = graph;

                var valueBoxLineHeight = 18;
                var valueBoxColumnWidth = 140;

                var tickSize = 5;
                var fontSize = 15;


                function updateSlide(name) {
                    return function (time) {
                        if (time && graph.xScale &&
                            _.first($scope.time) <= time &&
                            time <= _.last($scope.time)) {
                            graph.slides[name] = graph.xScale(time);
                        } else {
                            graph.slides[name] = null;
                        }
                    };
                }

                var slideUpdaters = {
                    video: updateSlide('video'),
                    a: updateSlide('a'),
                    b: updateSlide('b')
                };

                $scope.$watch('slides.video', slideUpdaters.video);
                $scope.$watch('slides.a', slideUpdaters.a);
                $scope.$watch('slides.b', slideUpdaters.b);

                function forceUpdateAllSlides() {
                    _.each(slideUpdaters, function (update, key) {
                        // Use the current time, but force a draw calculation
                        update($scope.slides[key]);
                    });
                }


                $scope.$watch('slides.hover', function (time) {
                    // The test for xScale defined is a hack, but I don't really
                    // want to dive into why it's needed right now.
                    if (time && graph.xScale) {
                        graph.slides.hover = graph.xScale(time);
                        graph.calculateValueBox();
                    } else {
                        graph.slides.hover = null;
                    }
                });

                $scope.hovermove = function ($event) {
                    var hoverTime = graph.xScale.invert($event.offsetX);
                    $scope.slides.hover = hoverTime;
                };

                $scope.plotareaClick = function ($event) {
                    var time = graph.xScale.invert($event.offsetX);

                    if (!$scope.slides.a) {
                        $scope.slides.a = time;
                    } else if (!$scope.slides.b) {
                        $scope.slides.b = time;
                    } else {
                        // Update the closest one
                        if (Math.abs($scope.slides.a - time) < // Distance to A <
                            Math.abs($scope.slides.b - time)) {// distance to B)
                            $scope.slides.a = time;
                        } else {
                            $scope.slides.b = time;
                        }
                    }
                };

                $scope.yAxisClick = function ($event) {
                    $scope.graph.horizontalRule = $event.offsetY;
                    console.log('yvalue: ' + graph.yScale.invert($event.offsetY));
                };

                $scope.hoverleave = function () {
                    $scope.slides.hover = null;
                };

                $scope.toggleSeries = function ($event, key) {
                    var index = _.indexOf(graph.seriesInView, key);
                    if (index !== -1) {
                        graph.seriesInView.splice(index, 1);
                    } else {
                        graph.seriesInView.push(key);
                    }

                    drawGraph();
                };

                /** Calculate the closest index in the timeList from desiredTime.
                 * Dulpicate!
                 * @param timeList
                 * @param desiredTime
                 * @returns {*}
                 */
                function estimateIndex(timeList, desiredTime) {
                    var step = (_.last(timeList) - _.first(timeList)) / timeList.length;
                    return Math.round((desiredTime - _.first(timeList)) / step);
                }

                graph.calculateValueBox = function () {
                    var measurementIndex = estimateIndex($scope.time, $scope.slides.hover);
                    var index = 0; // position index
                    graph.valueBox = {
                        x: graph.axes.y.width + 10,
                        y: 20,
                        labels: _.chain(graph.ySeries).pick(graph.seriesInView).map(
                            function (series, key) {
                                return {
                                    y: index++ * valueBoxLineHeight,
                                    key: {
                                        x: 0,
                                        text: key
                                    },

                                    value: {
                                        x: valueBoxColumnWidth,
                                        text: series[measurementIndex] ?
                                            series[measurementIndex].toPrecision(3) :
                                            null
                                    }
                                };
                            })
                            .value()
                    };
                };

                /**
                 *
                 * @param {Number} [width] Defaults to graph.width
                 */
                function drawGraph(width, height) {

                    //console.log('drawing graph with height: ' + height);

                    graph.ySeries = $scope.ySeries;
                    if (!initialized) {
                        initialized = true;
                        graph.seriesInView = Object.keys(graph.ySeries);
                    }

                    graph.width = width ? width : graph.width;
                    graph.height = height ? height : graph.height;

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

                    graph.plot = {};
                    graph.plot.width = graph.width - graph.axes.y.width;
                    graph.plot.height = graph.height - (graph.axes.x.height + graph.key.height + 10);

                    var xTickCount = 6;
                    graph.xScale = d3.time.scale()
                        .range([graph.width - graph.plot.width, graph.width])
                        .domain(d3.extent($scope.time));
                    var xTickFormat = graph.xScale.tickFormat(xTickCount);

                    var yTickCount = 6;
                    var yScale = d3.scale.linear()
                        .range([graph.plot.height, 0])
                        .clamp(true) // Make sure that null doesn't go to 0
                        .domain(d3.extent(
                            // Get the minimum and maximum value across all the
                            // series that we have.
                            _.chain(graph.ySeries)
                                .pick(graph.seriesInView)
                                .map(function (array) {
                                    return d3.extent(array);
                                })
                                .flatten()
                                .value()
                        ));
                    graph.yScale = yScale;

                    // Generate X Axis
                    graph.axes.x.ticks = _.map(graph.xScale.ticks(xTickCount), function (domainValue) {
                        return {
                            line: {
                                x: graph.xScale(domainValue),
                                y1: graph.plot.height,
                                y2: graph.plot.height + tickSize
                            },
                            label: {
                                x: graph.xScale(domainValue),
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
                                return graph.xScale(d[0]);
                            })
                            .y(function (d) {
                                return yScale(d[1]);
                            })
                        (_.zip(x, y));
                    }


                    var keyStep = graph.plot.width / (Object.keys(graph.ySeries).length + 1);
                    var keyX = graph.axes.y.width;

                    $scope.plots = _.mapValues(graph.ySeries, function (series, key) {
                        keyX += keyStep;
                        var result = {
                            key: {
                                x: keyX,
                                y: graph.plot.height + graph.axes.x.height + graph.key.height
                            }
                        };

                        // Make sure that we don't try to graph something with all NaNs.
                        var hasValidPoints = _.reduce(series, function (memo, value) {
                            return memo || !_.isNull(value);
                        }, false);

                        if (_.indexOf(graph.seriesInView, key) !== -1 && hasValidPoints) {
                            result.line = {
                                svgLine: $scope.svgLine = createLine($scope.time, series)
                            };
                        }
                        return result;
                    });

                    graph.calculateValueBox();
                    forceUpdateAllSlides();
                }

                // Respond to zooms
                // Note: we really shouldn't have this in here, since a zoom is
                // a state change, and hence will reload this controller.
                $scope.$watch('time', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        drawGraph();
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
                    }, function (newWidth) {
                        drawGraph($element[0].children[0].offsetWidth, $element[0].children[0].offsetHeight);
                    });
                })();

                (function () {
                    var count = 0;
                    var countMax = 100;
                    var listener = $scope.$watch(function () { // watch container width
                        if (++count > countMax) {
                            listener(); // deregister
                        }
                        return $element[0].children[0].offsetHeight;
                    }, function (newHeight) {
                        //drawGraph($element[0].children[0].offsetWidth, $element[0].children[0].offsetHeight);
                    });
                })();


                // Resize graphs on window resize
                angular.element($window).bind('resize', function () {
                    drawGraph($element[0].children[0].offsetWidth, $element[0].children[0].offsetHeight);
                });
            }
        };
    });
