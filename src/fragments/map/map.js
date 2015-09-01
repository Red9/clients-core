(function () {
    'use strict';

    angular.module('lodash', [])
        .factory('_', function () {
            return window._; // assumes underscore has already been loaded on the page
        });

// Declare app level module which depends on filters, and services
    angular
        .module('redApp', [
            'redComponents.api',
            'leaflet-directive',
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

            if(!_.has(search, 'datasetId')){
                throw new Error('Must provide a datasetId query parameter.');
            }

            var queryOptions = {
                id: datasetId,
                fields: [
                    'id',
                    'sport',
                    'startTime',
                    'endTime'
                ].join(',')
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

                    var viewModel = {};

                    if (dataset.sport === 'surf') {
                        var events = _.filter(dataset.events, function (event) {
                            return event.type === 'Wave';
                        });

                        $scope.highlights = events;
                    }

                    $scope.viewModel = viewModel;
                });
        });
})();

