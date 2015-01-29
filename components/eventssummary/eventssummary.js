angular
    .module('redComponents.eventsSummary', [
        'redComponents.filters.display.duration',
        'lodash'
    ])
    .directive('eventsSummary', function () {
        return {
            restrict: 'E',
            templateUrl: '/components/eventssummary/eventssummary.html',
            scope: {
                events: '='
            },
            controller: function ($scope, _) {
                $scope.displayEvents = [];
                function update() {
                    $scope.displayEvents = _.chain($scope.events)
                        .groupBy('type')
                        .map(function (eventsByType) {
                            return _.reduce(eventsByType, function (memo, event) {
                                memo.type = event.type;
                                memo.count++;
                                memo.totalDuration += event.endTime - event.startTime;
                                if (event.source.type === 'manual') {
                                    memo.sourceType.manual++;
                                } else {
                                    memo.sourceType.auto++;
                                }

                                return memo;
                            }, {
                                count: 0,
                                totalDuration: 0,
                                sourceType: {
                                    manual: 0,
                                    auto: 0
                                }
                            });
                        })
                        .sortBy(function (summary) {
                            return summary.type;
                        })
                        .value();
                }

                $scope.$watch('events', update);
                update();
            }
        };
    });
