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
                        sessionDistance: dataset.summaryStatistics.distance.path,
                        userName: dataset.user.displayName,
                        startTime: dataset.startTime,
                        sport: dataset.sport
                    };

                    if (dataset.sport === 'surf') {
                        var events = _.filter(dataset.events, function (event) {
                            return event.type === 'Wave';
                        });

                        $scope.highlights = events;

                        viewModel.distance = _.max(events, function (event) {
                            return event.summaryStatistics.distance.path;
                        }).summaryStatistics.distance.path;

                        viewModel.speed = _.max(events, function (event) {
                            return event.summaryStatistics.gps.speed.maximum;
                        }).summaryStatistics.gps.speed.maximum;

                        viewModel.eventCount = events.length;
                    } else {
                        viewModel.speed = dataset.summaryStatistics.gps.speed.maximum;
                    }

                    $scope.viewModel = viewModel;
                });
        });
})();

