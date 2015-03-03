angular
    .module('redApp.dataset.admin', [
        'redComponents.api'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('dataset.admin', {
            url: '/admin',
            templateUrl: '/my-client/dataset/admin/admin.html',
            controller: 'DatasetAdminController',
            accessLevel: 'basic',
            title: 'R9: Session Admin'
        });
    })
    .controller('DatasetAdminController', function ($scope, api, dataset) {
        $scope.dataset = dataset;

        $scope.datasetSport = $scope.dataset.sport;

        $scope.sportsList = api.sportsList;

        $scope.saveSport = function (newValue) {
            console.log('newValue: ' + newValue);
            $scope.dataset.update({sport: newValue});
        };

        $scope.eventFind = function (dataset) {
            $scope.eventFindDisabled = true;
            dataset.eventFind();
        };
    });
