// TODO: Shouldn't this be a directive? I wrote the original version (confirm dialog) a while ago when I was still new. -srlm
angular
    .module('redComponents.modals.setFilters', [
        'redComponents.api',
        'redComponents.autoFocus'
    ])
    .factory('SetFiltersModal', function ($modal) {

        /**
         * @param {Object} parameters
         * @param {Object} parameters.filters
         * @param {Function} parameters.callback - Only called when changes are submitted.
         * @returns {Function}
         */
        function result(parameters) {
            var ModalInstanceCtrl = function ($scope, $modalInstance) {

                $scope.viewModel = {
                    filters: angular.copy(parameters.filters)
                };

                $scope.confirm = function () {
                    $modalInstance.close($scope.viewModel.filters);
                };

                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
            };

            var modalInstance = $modal.open({
                templateUrl: '/components/modals/setfilters/setfilters.html',
                controller: ModalInstanceCtrl,
                size: 'lg'
            });

            modalInstance.result.then(parameters.callback);
        }

        return result;
    });