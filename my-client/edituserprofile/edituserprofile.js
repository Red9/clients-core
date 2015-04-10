angular
    .module('redApp.editUserProfile', [
        'redComponents.api',
        'redComponents.listGroupSimple'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('editUserProfile', {
            url: '/user/{id}/admin',
            templateUrl: '/my-client/edituserprofile/edituserprofile.html',
            controller: 'EditUserProfileController',
            data: {
                css: '/my-client/edituserprofile/edituserprofile.css'
            },
            accessLevel: 'admin',
            title: 'R9: Edit User Profile'
        });
    })
    .controller('EditUserProfileController',
    function ($scope, $stateParams, api) {
        $scope.editableUser = {};

        api.user.get({id: $stateParams.id}, function (user) {
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
