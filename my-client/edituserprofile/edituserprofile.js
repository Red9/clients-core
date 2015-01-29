angular
    .module('redApp.editUserProfile', [
        'ngRoute',
        'redComponents.api',
        'redComponents.listGroupSimple'
    ])
    .config(function ($routeProvider) {
        $routeProvider.when('/user/:id/admin', {
            templateUrl: '/my-client/edituserprofile/edituserprofile.html',
            css: '/my-client/edituserprofile/edituserprofile.css',
            controller: 'EditUserProfileController',
            accessLevel: 'admin',
            title: 'R9: Edit User Profile'
        });
    })
    .controller('EditUserProfileController',
    function ($scope, $routeParams, api) {
        $scope.editableUser = {};

        api.user.get({id: $routeParams.id}, function (user) {
            $scope.editableUser.displayName = user.displayName;
            $scope.editableUser.preferredLayout = user.preferredLayout;
            $scope.editableUser.scope = user.scope;
            $scope.user = user;
        });

        $scope.saveChanges = function () {
            $scope.user.update($scope.editableUser)
                .success(function () {
                    alert('Successfully Updated');
                })
                .error(function () {
                    alert('Update error. Check Network tab.');
                });
        };
    });
