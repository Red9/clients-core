angular
    .module('redApp.dataset.summary', [])
    .config(function ($stateProvider) {
        $stateProvider.state('dataset.summary', {
            url: '/summary',
            templateUrl: '/my-client/dataset/summary/summary.html',
            controller: 'DatasetSummaryController',
            accessLevel: 'basic',
            title: 'R9: Summary'
        });
    })
    .controller('DatasetSummaryController', function ($scope, dataset) {
        $scope.dataset = dataset;
    });