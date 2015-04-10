(function () {
    'use strict';

    angular.module('lodash', [])
        .factory('_', function () {
            return window._; // assumes underscore has already been loaded on the page
        });

// Declare app level module which depends on filters, and services
    angular
        .module('redApp', [
            'ui.bootstrap',

            'angulartics',
            'angulartics.segment.io',

            'redComponents.api',

            'leaflet-directive',

            'redComponents.filters.display.duration',
            'redComponents.filters.display.units',

            'redComponents.map',
            'redComponents.authenticate',
            'redComponents.head' // Is this the correct use of this directive?
        ])
        .config(function ($resourceProvider, $locationProvider) {
            // Don't strip trailing slashes from calculated URLs
            $resourceProvider.defaults.stripTrailingSlashes = false;
            $locationProvider.html5Mode(true);
        })
        .controller('pageController', function ($scope, _, $location, api) {

            var search = $location.search();

            var datasetId = search.datasetId;

            var queryOptions = {
                id: datasetId,
                fields: [
                    'id',
                    'userId',
                    'title',
                    'createdAt',
                    'duration',
                    'summaryStatistics',
                    'source',
                    'startTime',
                    'endTime',
                    'gpsLock',
                    'tags',
                    'boundingCircle',
                    'boundingBox',
                    // Dynamically added fields
                    'aggregateStatistics',
                    'user',
                    'event(id,type,subType,startTime,endTime,source,summaryStatistics(gps,distance))',
                    'comment',
                    'video'
                ].join(','),
                expand: ['user', 'comment', 'video']
            };

            var dataset;
            api.dataset.get(queryOptions).$promise
                .then(function (dataset_) {
                    dataset = dataset_;
                    return dataset.getEvents();
                })
                .then(function () {
                    return dataset.getPanel({
                        size: 'xxxl',
                        axes: [
                            'time',
                            'gps:latitude',
                            'gps:longitude'
                        ]
                    });
                }).then(function () {
                    $scope.dataset = dataset;

                    var viewModel = {
                        sessionDuration: dataset.duration,
                        userName: dataset.user.displayName,
                        startTime: dataset.startTime,
                        sport: dataset.sport.charAt(0).toUpperCase() + dataset.sport.slice(1)
                    };

                    if (search.type) {
                        var events = _.filter(dataset.events, function (event) {
                            return event.type === search.type;
                        });

                        $scope.highlights = events;

                        viewModel.distanceLabel = 'Longest ' + search.type;
                        viewModel.distanceUnits = 'feet';
                        viewModel.distance = _.max(events, function (event) {
                            return event.summaryStatistics.distance.path;
                        }).summaryStatistics.distance.path;

                        viewModel.speedLabel = 'Fastest ' + search.type;
                        viewModel.speed = _.max(events, function (event) {
                            return event.summaryStatistics.gps.speed.maximum;
                        }).summaryStatistics.gps.speed.maximum;

                        viewModel.metricCLabel = search.type + ' Count';
                        viewModel.metricCDuration = false;
                        viewModel.metricC = events.length;
                    } else {
                        viewModel.distanceLabel = 'Total Distance';
                        viewModel.distanceUnits = 'miles';
                        viewModel.distance = dataset.summaryStatistics.distance.path;

                        viewModel.speedLabel = 'Top Speed';
                        viewModel.speed = dataset.summaryStatistics.gps.speed.maximum;

                        viewModel.metricCLabel = 'Total Time';
                        viewModel.metricCDuration = true;
                        viewModel.metricC = dataset.duration;
                    }

                    $scope.viewModel = viewModel;
                });


        });
})();

