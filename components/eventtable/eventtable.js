angular
    .module('redComponents.eventTable', [
        'lodash'
    ])
    .directive('eventTable', function () {
        return {
            restrict: 'E',
            scope: {
                events: '='
            },
            templateUrl: '/components/eventtable/eventtable.html',
            controller: function ($scope, $state, _) {
                $scope.$state = $state;

                $scope.viewModel = {};

                // This won't work for values across 0 (negative and positive)
                function calculateMax(events, accessor) {
                    return accessor(_.max(events, accessor));
                }

                function calculateBar(value, max) {
                    return Math.round((value / max) * 100);
                }


                function distanceAccessor(event) {
                    return event.summaryStatistics.distance.path;
                }

                function greatCircleAccessor(event) {
                    return event.summaryStatistics.distance.greatCircle;
                }

                var distanceMax = calculateMax($scope.events, distanceAccessor);

                function speedAccessor(event) {
                    return event.summaryStatistics.gps.speed.maximum;
                }

                function averageSpeedAccessor(event) {
                    return event.summaryStatistics.gps.speed.average;
                }


                var speedMax = calculateMax($scope.events, speedAccessor);

                function durationAccessor(event) {
                    return event.duration;
                }

                var durationMax = calculateMax($scope.events, durationAccessor);

                $scope.viewModel.events = _.chain($scope.events)
                    .sortBy('startTime')
                    .map(function (event, index) {
                        return {
                            id: event.id,
                            datasetId: event.datasetId,
                            index: index,
                            startTime: event.startTime,
                            endTime: event.endTime,
                            speed: event.summaryStatistics.gps.speed.maximum,
                            distance: event.summaryStatistics.distance.path,
                            duration: event.duration,
                            bars: {
                                duration: calculateBar(durationAccessor(event), durationMax),
                                distance: calculateBar(distanceAccessor(event), distanceMax),
                                greatCircleDistance: calculateBar(greatCircleAccessor(event), distanceMax),
                                speed: calculateBar(speedAccessor(event), speedMax),
                                averageSpeed: calculateBar(averageSpeedAccessor(event), speedMax)
                            }
                        };
                    })
                    .value();

                $scope.sortState = {
                    predicate: 'index',
                    reverse: false
                };


                $scope.sort = function (column) {
                    // If the column is the same then we'll reverse the sort direction,
                    // otherwise keep the current sort direction.
                    if (column === $scope.sortState.predicate) {
                        $scope.sortState.reverse = !$scope.sortState.reverse;
                    }

                    $scope.sortState.predicate = column;

                    $scope.viewModel.events = _.sortBy($scope.viewModel.events, function (e) {
                        return ($scope.sortState.reverse ? -1 : 1) *
                            e[$scope.sortState.predicate];
                    });
                };

            }
        };
    });