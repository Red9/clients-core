angular
    .module('redApp.dataset.details.event.single', [
        'lodash'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('dataset.details.event.single', {
            url: '/{eventId}',
            templateUrl: '/my-client/dataset/details/event/single/single.html',
            controller: 'DatasetDetailsEventSingleController',
            accessLevel: 'basic',
            title: 'R9: Event Details'
        });
    })
    .controller('DatasetDetailsEventSingleController', function ($scope, dataset, _, $stateParams) {
        $scope.dataset = dataset;

        //$scope.events = _.chain(dataset.events)
        //    .filter(function (event) {
        //        return event.type === $stateParams.type;
        //    })
        //    .sortBy('startTime')
        //    .value();
    });