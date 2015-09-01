angular
    .module('redComponents.visualizations.timeline', [])
    .directive('timeline', function () {
        return {
            restrict: 'E',
            scope: {
                time: '=',
                events: '=',
                slides: '='
            },
            templateUrl: '/components/visualizations/timeline/timeline.html',
            controller: function ($scope, $element, $window) {
                //var initialized = false;
                var graph;
                graph = {
                    slides: {}
                };
                $scope.graph = graph;

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


                $scope.hoverleave = function () {
                    $scope.slides.hover = null;
                };

                /**
                 *
                 * @param {Number} [width] Defaults to graph.width
                 */
                function drawGraph(width) {

                    graph.width = width ? width : graph.width;

                    graph.axes = {
                        x: {
                            height: 20
                        },
                        y: {
                            width: 60 // Width of the labels on the left
                        }
                    };

                    graph.plot = {};
                    graph.plot.width = graph.width - graph.axes.y.width;


                    graph.xScale = d3.time.scale()
                        .range([graph.width - graph.plot.width, graph.width])
                        .domain(d3.extent($scope.time))
                        .clamp(true); // Make sure we don't overdraw outside the drawable area

                    drawEvents();
                    forceUpdateAllSlides();
                }

                function drawEvents() {
                    var padding = 2;
                    var contentHeight = 12;
                    var minWidth = 3;
                    var rowHeight = padding * 2 + contentHeight;

                    var xTickCount = 6;

                    var tickSize = 5;
                    var fontSize = 15;

                    // Prepare events for display
                    graph.events = _.chain($scope.events)
                        .groupBy('type')
                        .map(function (events, type) {
                            return {
                                type: type,
                                events: events
                            };
                        })
                        .sortBy('type')
                        .map(function (row, index) {
                            row.y = index * rowHeight;
                            row.height = rowHeight;
                            row.textHeight = padding + contentHeight;

                            var leftBound = _.first($scope.time);
                            var rightBound = _.last($scope.time);
                            var boundPadding = (rightBound - leftBound) * 0.05;
                            leftBound -= boundPadding;
                            rightBound += boundPadding;

                            row.boxes = _.chain(row.events)
                                .filter(function (event) {
                                    // Make sure that events are in the displayable window
                                    return (leftBound < event.startTime && event.startTime < rightBound)||
                                        (leftBound < event.endTime && event.endTime < rightBound);
                                })
                                .map(function (event) {
                                    var x = graph.xScale(event.startTime);
                                    var width = graph.xScale(event.endTime) - x;

                                    if (width < minWidth) {
                                        width = minWidth;
                                    }

                                    return {
                                        x: x,
                                        y: padding,
                                        height: contentHeight,
                                        width: width,
                                        event: event
                                    };
                                })
                                .value();

                            return row;
                        })
                        .value();

                    graph.plot.height = graph.events.length * rowHeight;
                    graph.height = graph.plot.height + (graph.axes.x.height + 10);

                    // Generate X Axis
                    var xTickFormat = graph.xScale.tickFormat(xTickCount);
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
                }

                $scope.selectEventType = function (type) {
                    _.chain($scope.events)
                        .filter(function (event) {
                            return event.type === type;
                        })
                        .each(function (event) {
                            event.selected = true;
                        })
                        .value();
                };

                /**
                 *
                 * @param $event - click event
                 * @param event - Red9 event
                 */
                $scope.clickEvent = function ($event, event) {
                    if ($event.ctrlKey) {
                        if (event.selected) {
                            delete event.selected;
                        } else {
                            event.selected = true;
                        }
                    } else {
                        $scope.$emit('zoom', {
                            startTime: event.startTime,
                            endTime: event.endTime
                        });
                    }
                };


                // Respond to zooms
                $scope.$watch('time', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        drawGraph();
                    }
                });

                // Respond to created and deleted events
                $scope.$watchCollection('events', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        drawEvents();
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
