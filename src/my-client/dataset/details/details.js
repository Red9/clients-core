angular
    .module('redApp.dataset.details', [
        'lodash'
    ])
    .config(function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.when('/dataset/{id}/details', '/dataset/{id}/details/session');
        $stateProvider.state('dataset.details', {
            url: '/details',
            templateUrl: '/my-client/dataset/details/details.html',
            controller: 'DatasetDetailsController',
            accessLevel: 'basic',
            title: 'R9: Details',
            redirectTo: 'dataset.details.session',
            data: {
                css: '/my-client/dataset/details/details.css'
            }
        });
    })
    .controller('DatasetDetailsController', function ($scope, dataset, _, $state) {
        $scope.dataset = dataset;

        $scope.viewModel = {};

        console.dir(dataset);

        $scope.viewModel.eventTypes = _.chain(dataset.events)
            .pluck('type').uniq().value();

        $scope.$state = $state;
    });