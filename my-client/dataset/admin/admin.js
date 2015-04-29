angular
    .module('redApp.dataset.admin', [
        'redComponents.api',
        'ui.bootstrap.showErrors',
        'redComponents.confirmDialog'
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
    .controller('DatasetAdminController', function ($scope, $state, api, confirmDialog, dataset) {
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

        $scope.runDownload = function (parameters) {
            $scope.$broadcast('show-errors-check-validity');

            if ($scope.downloadForm.$valid) {
                console.dir(parameters);

                dataset.getCSVPanel(parameters);
            }

        };

        $scope.viewModel = {};
        $scope.viewModel.tags = angular.copy(dataset.tags);

        $scope.deleteDataset = function (dataset) {
            console.log('Delete dataset!');


            confirmDialog({
                message: 'Are you sure? You will delete all associated events, comments, and videos permanently.',
                confirm: function () {
                    dataset.$delete();
                    $state.go('search_dataset');
                }
            });


            // TODO: Fill out the "Are You Sure" for this.
            // Make sure it does actually delete all events too.
            // Redirect to home

            // Also, add in an Are You Sure for the event creation.


        };

    });
