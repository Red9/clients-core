angular
    .module('redApp.dataset', [
        'redComponents.api',
        'redComponents.eventsSummary',
        'redComponents.fcpxmlDownload',
        'redComponents.map',
        'redComponents.summaryStatistics',
        'redComponents.filters.display.duration',
        'redComponents.filters.display.units',
        'redComponents.filters.display.sumDuration',
        'redComponents.responsiveDetection',
        'angular.filter',
        'lodash'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('dataset', {
            url: '/dataset/{id:int}',
            templateUrl: '/my-client/dataset/dataset.html',
            controller: 'DatasetController',
            resolve: {
                dataset: function ($stateParams, api, ResponsiveDetection) {
                    // TODO: take care of the case that {id} isn't here
                    var queryOptions = {
                        id: $stateParams.id,
                        expand: ['user', 'comment', 'video']
                    };

                    var dataset;
                    return api.dataset.get(queryOptions).$promise
                        .then(function (dataset_) {
                            dataset = dataset_;
                            return dataset
                                .getEvents();
                        })
                        .then(function () {
                            return dataset.getPanel({
                                axes: [
                                    'time',
                                    'gps:latitude',
                                    'gps:longitude'
                                ]
                            });
                        }).then(function () {
                            // Get a high resolution version, but don't block user action for the new version.
                            dataset.getPanel({
                                size: 'xxxl',
                                axes: [
                                    'time',
                                    'gps:latitude',
                                    'gps:longitude'
                                ],
                                key: 'panelSuper'
                            });

                            return dataset;
                        });

                }
            },
            data: {
                css: '/my-client/dataset/dataset.css'
            },
            accessLevel: 'basic',
            title: 'R9: Session',
            redirectTo: 'dataset.summary'
        });
    })
    .controller('DatasetController',
    function ($scope, $stateParams, _, api, dataset, $rootScope, $state) {
        $scope.dataset = dataset;

        $rootScope.$state = $state;
    });