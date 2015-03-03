angular
    .module('redApp.dataset', [
        'ngRoute',
        'redComponents.api',
        'redComponents.eventsSummary',
        'redComponents.eventTimeline',
        'redComponents.fcpxmlDownload',
        'redComponents.map',
        'redComponents.summaryStatistics',
        'redComponents.tagHelper',
        'redComponents.filters.display.duration',
        'redComponents.filters.display.units',
        'redComponents.filters.display.sumDuration',
        'angular.filter',
        'lodash'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('dataset', {
            url: '/dataset/{id:int}',
            templateUrl: '/my-client/dataset/dataset.html',
            controller: 'DatasetController',
            resolve: {
                dataset: function ($stateParams, api) {
                    // TODO: take care of the case that {id} isn't here
                    var queryOptions = {
                        id: $stateParams.id,
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
                        }).then(function(){
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