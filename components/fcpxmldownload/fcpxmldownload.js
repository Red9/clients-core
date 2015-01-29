angular
    .module('redComponents.fcpxmlDownload', [
        'redComponents.listGroupSimple'
    ])
    .directive('fcpxmlDownload', function () {
        return {
            restrict: 'E',
            templateUrl: '/components/fcpxmldownload/fcpxmldownload.html',
            scope: {
                dataset: '='
            },
            controller: function ($scope) {
                function update() {
                    if ($scope.dataset) {
                        $scope.dataset.getFcpxmlOptions().success(function (options) {
                            $scope.options.template = options.template[0];
                            $scope.options.eventType = options.eventType[0];
                            $scope.options.videoType = Object.keys(options.videoType)[0];
                            $scope.options.titleDuration = 3;
                            $scope.options.files = [];
                        });
                    }
                }

                $scope.$watch('dataset', update);
                update();


                $scope.options = {};

                $scope.$watch('options', function () {
                    // For some reason, the form is valid on page load.
                    // So, we add in the test to make sure that we have a dataset.
                    $scope.fcpxmlUrl = $scope.form.$valid && $scope.dataset ?
                        $scope.dataset.getFcpxmlUrl($scope.options) :
                        '';
                }, true);

            }
        };
    });
