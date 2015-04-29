angular
    .module('redApp.dataset.details.event', [
        'lodash',
        'redComponents.eventTable'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('dataset.details.event', {
            url: '/event/{type}',
            templateUrl: '/my-client/dataset/details/event/event.html',
            controller: 'DatasetDetailsEventController',
            accessLevel: 'basic',
            title: 'R9: Event Details',
            data: {
                css: '/my-client/dataset/details/event/event.css'
            }
        });
    })
    .controller('DatasetDetailsEventController', function ($scope, dataset, _, $stateParams) {
        $scope.dataset = dataset;

        $scope.viewModel = {
            type: $stateParams.type
        };

        $scope.events = _.chain(dataset.events)
            .filter(function (event) {
                return event.type === $stateParams.type;
            })
            .value();

        function calculateStats(label, values, units, accessor, weightAccessor) {
            if (_.isUndefined(weightAccessor)) {
                // Calculate a straight average
                weightAccessor = function () {
                    return 1;
                };
            }

            var averageParts = _.reduce(values, function (result, v) {
                var weight = weightAccessor(v);
                result.weightSum += weight;
                result.sum += accessor(v) * weight;

                return result;

            }, {sum: 0, weightSum: 0});

            return {
                title: label,
                tiles: [
                    {
                        value: accessor(_.max(values, accessor)),
                        decimals: 1,
                        units: units,
                        postfix: 'max'
                    },
                    {
                        value: averageParts.sum / averageParts.weightSum,
                        decimals: 1,
                        units: units,
                        postfix: 'avg'
                    },
                    {
                        value: accessor(_.min(values, accessor)),
                        decimals: 1,
                        units: units,
                        postfix: 'min'
                    }
                ]
            };
        }

        function calculateSessionStats(values, eventType) {
            return {
                title: 'Session Totals',
                tiles: [
                    {
                        value: values.length,
                        decimals: 0,
                        units: eventType + 's',
                        postfix: 'total'
                    },
                    {
                        value: _.reduce(values, function (sum, v) {
                            return sum + v.summaryStatistics.distance.path;
                        }, 0),
                        decimals: 0,
                        units: 'm',
                        postfix: 'total'
                    },
                    {
                        value: _.reduce(values, function (sum, v) {
                            return sum + v.duration;
                        }, 0),
                        units: 'duration',
                        postfix: 'total'
                    }
                ]
            };
        }

        $scope.statsRows = [
            calculateSessionStats($scope.events, $stateParams.type),
            calculateStats('Duration', $scope.events, 'duration', function (e) {
                return e.duration;
            }),
            calculateStats('Distance', $scope.events, 'm', function (e) {
                return e.summaryStatistics.distance.path;
            }),
            calculateStats('Top Speed', $scope.events, 'kn', function (e) {
                return e.summaryStatistics.gps.speed.maximum;
            }, function (e) {
                return e.duration;
            })
        ];
    });