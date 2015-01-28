angular
    .module('redApp.unauthenticated', [
        'ngRoute',
        'lodash'
    ])
    .config(function ($routeProvider) {
        // TODO: Users shouldn't be able to access this page when they are signed in.
        $routeProvider.when('/page/unauthenticated', {
            templateUrl: '/my-client/unauthenticated/unauthenticated.html',
            css: '/my-client/unauthenticated/unauthenticated.css',
            controller: 'unauthenticatedController',
            accessLevel: 'public',
            title: 'R9: Not Authenticated'
        });
    })
    .controller('unauthenticatedController',
    function ($scope, $location, _) {
        $scope.attemptUrl = decodeURIComponent($location.search().attemptUrl);

        $scope.error = null;
        if (_.has($location.search(), 'error')) {
            try {
                $scope.error = JSON.parse($location.search().error);
            } catch (e) {
                $scope.error = {
                    message: 'Warning: could not parse URL error. Did you mess with it? If not, contact support.'
                };
            }
        }
    });