angular
    .module('redComponents.pageApi', [])
    .directive('pageApi', function () {
        return {
            restrict: 'E',
            scope: {
                paging: '=',
                length: '=',
                scrollToId: '@'
            },
            templateUrl: '/components/pageapi/pageapi.html',
            controller: function ($scope) {
                $scope.page = {
                    first: function () {
                        $scope.paging.offset = 0;
                    },
                    previous: function () {
                        var t = $scope.paging.offset - $scope.paging.limit;
                        $scope.paging.offset = t < 0 ? 0 : t;
                    },
                    next: function () {
                        var t = $scope.paging.offset + $scope.paging.limit;
                        if (t < $scope.length) {
                            // If we still have pages left
                            $scope.paging.offset = t;
                        }
                    },
                    last: function () {
                        $scope.paging.offset
                            = Math.floor($scope.length / $scope.paging.limit)
                        * $scope.paging.limit;
                    }
                };
            }
        };
    });