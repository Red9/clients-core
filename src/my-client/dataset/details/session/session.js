angular
    .module('redApp.dataset.details.session', [])
    .config(function ($stateProvider) {
        $stateProvider.state('dataset.details.session', {
            url: '/session',
            templateUrl: '/my-client/dataset/details/session/session.html',
            controller: 'DatasetDetailsSessionController',
            accessLevel: 'basic',
            title: 'R9: Session Details'
        });
    })
    .controller('DatasetDetailsSessionController', function ($scope, dataset) {
        $scope.dataset = dataset;
    });