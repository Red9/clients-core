angular
    .module('redComponents.badgeList', [
        'lodash'
    ])
    .directive('badgeList', function () {
        return {
            restrict: 'E',
            scope: {
                list: '=',
                deleteItem: '=',
                displayKey: '@',
                editable: '@',
                muted: '@'
            },
            templateUrl: '/components/badgelist/badgelist.html',
            controller: function ($scope, _) {
                $scope.display = function (item) {
                    if ($scope.displayKey) {
                        return item[$scope.displayKey];
                    } else {
                        return item;
                    }
                };

                $scope.removeBadge = function (tag) {
                    var index = $scope.list.indexOf(tag);
                    if (index > -1) {
                        $scope.list.splice(index, 1);
                        if (_.isFunction($scope.deleteItem)) {
                            $scope.deleteItem(tag);
                        }
                    }
                };
            }
        };
    });
