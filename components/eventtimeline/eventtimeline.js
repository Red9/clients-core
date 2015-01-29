angular
    .module('redComponents.eventTimeline', [
        'lodash'
    ])
    .directive('eventTimeline', function (_) {
        return {
            restrict: 'E',
            replace: false,
            scope: {
                events: '='
            },
            link: function (scope, element, attrs) {
                var events = scope.events;

                var graphHeight = 200; // Make an initial guess.

                var graphWidth = element.parent()[0].offsetWidth - 30;
                //var graphWidth = element.css('width');
                // Constants
                var xScaleHeight = 20;
                var markerHeight = 12;
                var rowPadding = 4;
                var leftPadding = 60;
                var minimumMarkerWidth = 4;
                var rowHeight = markerHeight + rowPadding;

                function emptyRightClick() {
                    //stop showing browser menu
                    d3.event.preventDefault();
                }

                function calculateRowKey(event) {
                    return event.type + event.source.type;
                }

                var graphSvg = d3.select(element[0])
                    .append('svg')
                    .attr('height', graphHeight)
                    .attr('width', graphWidth)
                    //.on('mousemove', mouseMove)
                    //.on('mouseout', mouseOut)
                    .on('contextmenu', emptyRightClick);
                //.on('drag', dragmove);

                var xScale = d3.time.scale()
                    .range([leftPadding, graphWidth])
                    .domain([0, 1]);
                var xAxis = d3.svg.axis().scale(xScale);

                var xScaleY = (graphHeight - xScaleHeight);
                graphSvg.append('g')
                    .attr('transform', 'translate(0,' + xScaleY + ')')
                    .attr('class', 'event-timeline-axis')
                    .call(xAxis);


                function update() {
                    //graphWidth = element[0].offsetWidth;
                    //console.log('graphWidth: "' + graphWidth + '"');
                    //console.log(element.parent()[0].offsetWidth);
                    events = scope.events;
                    // Get all event labels
                    var eventLabels = {};
                    var rowKeys = [];
                    _.each(events, function (event) {
                        var key = calculateRowKey(event);
                        eventLabels[key] = event.type + (event.source.type === 'auto' ? '*' : '');
                        rowKeys.push(key);
                    });

                    rowKeys = _.uniq(rowKeys).sort();

                    var yScale = {};
                    _.each(rowKeys, function (key, index) {
                        yScale[key] = index * rowHeight;
                    });

                    // Get rid of events outside the current window
                    //var viewableEvents = _.reject(events, function (event) {
                    //    return event.endTime < startTime || endTime < event.startTime;
                    //});
                    var startTime = _.chain(events).pluck('startTime').min().value();
                    var endTime = _.chain(events).pluck('endTime').max().value();
                    var viewableEvents = events || [];

                    xScale.domain([startTime, endTime]);

                    xScaleY = rowKeys.length * rowHeight;
                    graphHeight = xScaleY + xScaleHeight;
                    graphSvg.attr('height', graphHeight);

                    //graphSvg.selectAll('.hovermarker')
                    //    .attr('y2', xScaleY);
                    //graphSvg.selectAll('.videomarker')
                    //    .attr('y2', xScaleY);


                    graphSvg.select('.event-timeline-axis')
                        .attr('transform', 'translate(0,' + xScaleY + ')')
                        .call(xAxis);

                    var svgEvents = graphSvg.selectAll('.event-timeline-markers')
                        .data(viewableEvents, function (event) {
                            return event.id;
                        });

                    svgEvents.enter()
                        .append('svg:rect')
                        .attr('class', 'event-timeline-markers');

                    svgEvents
                        .attr('y', function (event) {
                            return yScale[calculateRowKey(event)];
                        })
                        .attr('height', markerHeight)
                        .each(function (event) {
                            var x = xScale(event.startTime);
                            var xEnd = xScale(event.endTime);


                            if ((x > graphWidth && xEnd > graphWidth) || (x < leftPadding && xEnd < leftPadding)) {
                                // Do nothing. Off edge of graph.
                                return;
                            }

                            if (xEnd > graphWidth) { // End of event off right edge.
                                xEnd = graphWidth;
                            }

                            if (x < leftPadding) { // Start of event off left edge
                                x = leftPadding;
                            }

                            if (x > xEnd) {
                                console.log('Error: x > xEnd...: ' + x + ', ' + xEnd);
                            }

                            var eWidth = xEnd - x;
                            eWidth = eWidth >= minimumMarkerWidth ? eWidth : minimumMarkerWidth;

                            d3.select(this).attr({
                                x: x,
                                width: eWidth
                            });
                        })
                        .classed('event-timeline-markers-source-auto', function (event) {
                            return event.source.type === 'auto';
                        });
                    //.on('click', function (event) {
                    //    if (typeof configuration.eventClicked === 'function') {
                    //        configuration.eventClicked(event.id);
                    //    }
                    //})
                    //.on('contextmenu', function (event) {
                    //    var setTo = !d3.select(this).classed('event-timeline-markers-select');
                    //    d3.select(this).classed('event-timeline-markers-select', setTo);
                    //
                    //    d3.event.stopPropagation();
                    //
                    //    //stop showing browser menu
                    //    d3.event.preventDefault();
                    //});

                    svgEvents.exit().remove();


                    var svgEventLabels = graphSvg.selectAll('.event-timeline-types')
                        .data(rowKeys, function (label) {
                            return label;
                        });


                    svgEventLabels.enter()
                        .append('svg:text')
                        .attr('class', 'event-timeline-types');

                    svgEventLabels
                        .attr('x', 0)
                        .attr('y', function (rowKey) {
                            // Get the CSS font size, remove the "px", and convert
                            // it to an int.
                            var fontSize = parseInt(d3.select(this).style('font-size').slice(0, -2));
                            return yScale[rowKey] + fontSize;
                        })
                        .text(function (rowKey) {
                            return eventLabels[rowKey];
                        });
                    //.on('contextmenu', function (rowKey) {
                    //    console.log('row type: ' + rowKey);
                    //
                    //    //stop showing browser menu
                    //    d3.event.preventDefault();
                    //})
                    //.on('click', function (rowKey) {
                    //    graphSvg.selectAll('.event-timeline-markers')
                    //        .each(function (event) {
                    //            if (calculateRowKey(event) === rowKey) {
                    //                d3.select(this).classed('event-timeline-markers-select', true);
                    //            }
                    //        });
                    //});

                    svgEventLabels.exit().remove();
                }

                update();

                scope.$watch('events', function (newValue, oldValue) {
                    update();
                });

                //d3.select(window).on('resize', update);


            },
            controller: function ($scope) {

            }
        };
    });
