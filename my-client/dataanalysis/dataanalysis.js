angular
    .module('redApp.dataAnalysis', [
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
    .config(function ($routeProvider) {
        $routeProvider.when('/analysis/:id', {
            templateUrl: '/my-client/dataanalysis/dataanalysis.html',
            controller: 'DataAnalysisController',
            css: '/my-client/dataanalysis/dataanalysis.css',
            accessLevel: 'public',
            title: 'R9: Data Analysis'
        });
    })
    .controller('DataAnalysisController',
    function ($scope, $routeParams, _, api) {
        var queryOptions = {
            id: $routeParams.id,
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

        $scope.sportsList = api.sportsList;

        $scope.saveSport = function (newValue) {
            console.log('newValue: ' + newValue);
            $scope.dataset.update({sport: newValue});
        };

        api.dataset.get(queryOptions, function (dataset) {
            dataset
                .getEvents()
                .then(function () {
                    console.log('Here');
                    console.dir(dataset);
                    $scope.dataset = dataset;
                    $scope.dataset.getPanel({
                        axes: [
                            'time',
                            'gps:latitude',
                            'gps:longitude'
                        ]
                    });

                    $scope.datasetSport = $scope.dataset.sport;

                    _.each($scope.dataset.events, function (event) {
                        //api.event.getPanel(event);
                    });
                });

        });

        $scope.eventFind = function (dataset) {
            $scope.eventFindDisabled = true;
            dataset.eventFind();
        };

    });