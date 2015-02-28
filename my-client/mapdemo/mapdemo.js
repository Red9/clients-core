angular
    .module('redApp.mapDemo', [
        'redComponents.api',
        'redComponents.visualizations.maps.local'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('mapDemo', {
            url: '/mapdemo/',
            templateUrl: '/my-client/mapdemo/mapdemo.html',
            controller: 'mapDemoController',
            accessLevel: 'basic',
            title: 'map demo',
            resolve: {
                dataset: function (api) {
                    var dataset;
                    return api.dataset.get({id: 356}).$promise
                        .then(function (dataset_) {
                            dataset = dataset_;
                            return dataset.getPanel({
                                startTime: 1421520370450,
                                endTime: 1421520397300
                                //size: 'xl'
                            });
                        }).then(function () {
                            return dataset;
                        });
                }
            },
            data: {
                css: '/my-client/mapdemo/mapdemo.css'
            }
        });
    })
    .controller('mapDemoController', function ($scope, dataset) {
        $scope.dataset = dataset;
    });