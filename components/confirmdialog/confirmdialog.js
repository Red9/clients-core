// TODO: Shouldn't this be a directive? I wrote it a while ago when I was still new. -srlm
angular
    .module('redComponents.confirmDialog', [])
    .factory('confirmDialog', function ($modal) {
        return function (parameters) {
            return function () {
                var ModalInstanceCtrl = function ($scope, $modalInstance) {
                    $scope.confirm = function () {
                        $modalInstance.close(true);
                    };

                    $scope.cancel = function () {
                        $modalInstance.dismiss('cancel');
                    };
                    $scope.message = parameters.message;
                };

                var modalInstance = $modal.open({
                    templateUrl: '/components/confirmdialog/confirmdialog.html',
                    controller: ModalInstanceCtrl,
                    size: 'sm'
                });

                modalInstance.result.then(parameters.confirm, parameters.cancel);

            };
        };
    });