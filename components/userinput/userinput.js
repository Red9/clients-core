angular
    .module('redComponents.userInput', [
        'redComponents.api'
    ])
    .directive('userInput', function () {
        return {
            restrict: 'E',
            scope: {
                selectedUser: '=?',
                list: '=?',
                placeholder: '@'
            },
            templateUrl: '/components/userinput/userinput.html',
            controller: function ($scope, api) {
                $scope.users = [];

                $scope.selected = $scope.selectedUser;

                if (_.isUndefined($scope.selectedUser)) {
                    $scope.selectedUser = null;
                }

                $scope.$watch('selected', function (newValue, oldValue) {
                    if (_.isObject($scope.selected)) {  // Make sure that we've got an addition, not a clearing of the input
                        $scope.selectedUser = $scope.selected;

                        if (_.isArray($scope.list)  // Make sure that there is a list that we can add to
                            && $scope.list.indexOf($scope.selected) === -1) { // and that it doesn't have this item already
                            $scope.list.push($scope.selected);
                            $scope.selected = null;
                        }
                    }
                });

                api.user.query({}, function (users) {
                    $scope.users = users;
                });
            }
        };
    });
