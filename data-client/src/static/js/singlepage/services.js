(function () {
    'use strict';

    angular.module('redApp.services', [])

    /** Create a Red9 API accessor object
     *
     *  Each resource has the following methods:
     *   - save (create)
     *   - get
     *   - query
     *   - update
     *   - delete
     *
     */
        .factory('api', function ($resource, $http, $location) {
            $http.defaults.withCredentials = true;

            var apiOptions = {
                update: {method: 'PUT'}
            };

            return {
                dataset: $resource(red9config.apiUrl + '/dataset/:id', {id: '@id'}, apiOptions),
                event: $resource(red9config.apiUrl + '/event/:id', {id: '@id'}, apiOptions),
                comment: $resource(red9config.apiUrl + '/comment/:id', {id: '@id'}, apiOptions),
                user: $resource(red9config.apiUrl + '/user/:id', {id: '@id'}, apiOptions),
                video: $resource(red9config.apiUrl + '/video/:id', {id: '@id'}, apiOptions)
            };
        })
        .factory('authenticate', function ($http, $window, $interval, $location, current, _) {
            $http.defaults.withCredentials = true;
            return {
                logout: function () {
                    current.user = null;
                    $http.post(red9config.apiUrl + '/auth/logout');
                    $window.location = '/';
                },
                login: function () {
                    if (_.has($location.search(), 'attemptUrl')) {
                        console.log('setting callbackURL to attemptURL');
                        $window.location = red9config.apiUrl + '/auth/google?callbackUrl=' + encodeURIComponent($location.search().attemptUrl);
                    } else {
                        console.log('setting callbackURL to absURL');
                        $window.location = red9config.apiUrl + '/auth/google?callbackUrl=' + $location.absUrl();
                    }
                }
            };
        })
        .factory('confirmDialog', function ($modal) {
            return function (parameters) {
                return function () {
                    var ModalInstanceCtrl = function ($scope, $modalInstance) {
                        $scope.confirm = function () {
                            $modalInstance.close(true);
                        };

                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                        $scope.message = parameters.message;
                    };

                    var modalInstance = $modal.open({
                        templateUrl: '/static/partials/modals/areyousure.html',
                        controller: ModalInstanceCtrl,
                        size: 'sm'
                    });

                    modalInstance.result.then(parameters.confirm, parameters.cancel);

                };
            };
        });
})();