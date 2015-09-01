angular
    .module('redComponents.listGroupSimple', [
        'redComponents.keypressEnter'
    ])
    .directive('listGroupSimple', function () {
        return {
            restrict: 'E',
            scope: {
                list: '=',
                editable: '@'
            },
            templateUrl: '/components/listgroupsimple/listgroupsimple.html',
            controller: function ($scope) {
                $scope.newItem = '';
                $scope.removeItem = function (item) {
                    $scope.list.splice($scope.list.indexOf(item), 1);
                };

                $scope.addItem = function () {
                    if ($scope.newItem.length > 0) {
                        if (!$scope.list) {
                            $scope.list = [];
                        }
                        $scope.list.push($scope.newItem);
                        $scope.newItem = '';
                    }
                };

            }
        };
    });