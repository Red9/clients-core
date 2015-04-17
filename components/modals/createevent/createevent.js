// TODO: Shouldn't this be a directive? I wrote the original version (confirm dialog) a while ago when I was still new. -srlm
angular
    .module('redComponents.modals.createEvent', [
        'redComponents.api',
        'redComponents.autoFocus'
    ])
    .factory('CreateEventModal', function ($modal, $timeout, api) {

        /**
         *
         * @param {Object} parameters
         * @param {Number} parameters.datasetId
         * @param {Number} parameters.startTime
         * @param {Number} parameters.endTime
         * @param {Function} parameters.callback - Only called when an event is created
         * @param {String} [parameters.defaultType] - The default event type display
         * @returns {Function}
         */
        function result(parameters) {
            var ModalInstanceCtrl = function ($scope, $modalInstance) {

                $scope.resultModel = {
                    type: {
                        name: parameters.defaultType || 'Default'
                    }
                };

                $scope.viewModel = {
                    startTime: parameters.startTime,
                    endTime: parameters.endTime,
                    duration: parameters.endTime - parameters.startTime,
                    types: api.event.types
                };

                $scope.confirm = function () {

                    var newEvent = new api.event({
                        datasetId: parameters.datasetId,
                        startTime: parameters.startTime,
                        endTime: parameters.endTime,
                        type: $scope.resultModel.type.name,
                        source: {
                            type: 'manual'
                        }
                    });

                    newEvent.$save();

                    $modalInstance.close(newEvent);
                };

                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };

                $scope.message = parameters.message;
            };

            var modalInstance = $modal.open({
                templateUrl: '/components/modals/createevent/createevent.html',
                controller: ModalInstanceCtrl,
                size: 'sm'
            });

            modalInstance.result.then(parameters.callback);
        }

        return result;
    });