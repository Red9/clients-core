angular
    .module('redApp.dataset.details.event.all', [
        'lodash'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('dataset.details.event.all', {
            url: '/all',
            templateUrl: '/my-client/dataset/details/event/all/all.html',
            controller: 'DatasetDetailsEventAllController',
            accessLevel: 'basic',
            title: 'R9: Event Details'
        });
    })
    .controller('DatasetDetailsEventAllController', function ($scope, dataset, _, $stateParams) {
        $scope.dataset = dataset;

        $scope.viewModel = {
            eventType: $stateParams.type
        };

        //$scope.events = _.chain(dataset.events)
        //    .filter(function (event) {
        //        return event.type === $stateParams.type;
        //    })
        //    .sortBy('startTime')
        //    .value();
    });