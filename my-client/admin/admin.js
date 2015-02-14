angular
    .module('redApp.admin', [
        'ngRoute',
        'redComponents.api'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('admin', {
            url: '/admin/',
            templateUrl: '/my-client/admin/admin.html',
            controller: 'admin',
            accessLevel: 'basic',
            title: 'R9: Administrative Tasks'
        });
    })
    .controller('admin',
    function ($scope, api) {
        $scope.newUser = {};
        $scope.createdUsers = [];

        $scope.addNewUser = function () {
            var createdUser = new api.user({
                email: $scope.newUser.email,
                displayName: 'unknown'
            });

            createdUser.$save({}, function () {
                $scope.createdUsers.push(createdUser);
                $scope.newUser = {};
                $scope.newUserForm.$setPristine();
            }, function (data) {
                alert('Error. Please report as bug: ' + JSON.stringify(data.data, null, 3));
            });
        };
    });
