angular
    .module('redApp.dataset.details.event', [
        'lodash'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('dataset.details.event', {
            url: '/event/{type}',
            templateUrl: '/my-client/dataset/details/event/event.html',
            controller: 'DatasetDetailsEventController',
            accessLevel: 'basic',
            title: 'R9: Event Details',
            redirectTo: 'dataset.details.event.all'
        });
    })
    .controller('DatasetDetailsEventController', function ($scope, dataset, _, $stateParams) {
        $scope.dataset = dataset;

        $scope.events = _.chain(dataset.events)
            .filter(function (event) {
                return event.type === $stateParams.type;
            })
            .sortBy('startTime')
            .value();
    });