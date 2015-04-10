angular
    .module('redApp.sitestatistics', [
        'redComponents.api',
        'redComponents.filters.display.duration',
        'lodash'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('sitestatistics', {
            url: '/aggregate/sitestatistics',
            templateUrl: '/my-client/sitestatistics/sitestatistics.html',
            controller: 'siteStatisticsController',
            accessLevel: 'trusted',
            title: 'R9: Site Statistics'
        });
    })
    .controller('siteStatisticsController',
    function ($scope, _, api) {
        var parameters = {
            dataset: {
                'expand': ['user']
            },
            event: {}

        };

        api.dataset.query(parameters.dataset, function (datasets) {
            var datasetAggregate = _.reduce(datasets, function (memo, dataset) {
                memo.sumDuration += dataset.endTime - dataset.startTime;
                console.log(memo.sumDuration + ', ' + dataset.startTime + ', ' + dataset.endTime + ', ' + dataset.id);
                try {
                    memo.sumDistance += dataset.summaryStatistics.static.route.path.distance.value;
                } catch (e) {
                }
                return memo;
            }, {
                sumDuration: 0,
                sumDistance: 0
            });

            datasetAggregate.count = datasets.length;
            datasetAggregate.averageDuration = datasetAggregate.sumDuration / datasets.length;
            datasetAggregate.averageDistance = datasetAggregate.sumDistance / datasets.length;

            $scope.datasetAggregate = datasetAggregate;


            $scope.datasetUsers = _.chain(datasets)
                .groupBy(function (dataset) {
                    return dataset.userId;
                })
                .map(function (list) {
                    return _.reduce(list, function (memo, dataset) {

                        memo.sumDuration += dataset.endTime - dataset.startTime;
                        memo.count += 1;

                        // A bit wasteful to set it on every iteration, but oh well.
                        memo.userId = dataset.userId;
                        memo.user.displayName = dataset.user.displayName;
                        return memo;
                    }, {
                        sumDuration: 0,
                        count: 0,
                        user: {}
                    });
                })
                .value();
        });

        api.event.query({}, function (events) {
            var eventsAggregate = _.chain(events)
                .groupBy('type')
                .map(function (eventsByType, type) {
                    var t = {
                        manual: {
                            sumDuration: 0,
                            sumDistance: 0,
                            count: 0
                        },
                        auto: {
                            sumDuration: 0,
                            sumDistance: 0,
                            count: 0
                        }
                    };

                    var result = _.reduce(eventsByType, function (memo, event) {
                        if (event.source.type === 'manual' || event.source.type === 'auto') {
                            memo[event.source.type].sumDuration += event.endTime - event.startTime;
                            memo[event.source.type].count += 1;

                            try {
                                memo[event.source.type].sumDistance += event.summaryStatistics.static.route.path.distance.value;
                            } catch (e) {
                            }

                        } else {
                            console.log('bad type: ' + event.id + ': ' + event.source.type);
                        }

                        return memo;
                    }, t);

                    result.manual.averageDuration = result.manual.sumDuration / result.manual.count;
                    result.auto.averageDuration = result.auto.sumDuration / result.auto.count;
                    result.type = type;
                    return result;
                })
                .value();
            $scope.eventsAggregate = eventsAggregate;

            $scope.eventCount = _.reduce(eventsAggregate, function (memo, agg) {
                memo.manual.count += agg.manual.count;
                memo.manual.sumDuration += agg.manual.sumDuration;
                memo.auto.count += agg.auto.count;
                memo.auto.sumDuration += agg.auto.sumDuration;
                return memo;
            }, {
                manual: {
                    count: 0,
                    sumDuration: 0
                },
                auto: {
                    count: 0,
                    sumDuration: 0
                },
                total: events.length
            });

        });
    });