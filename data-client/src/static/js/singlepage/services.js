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
        .factory('api', function ($resource, $http) {
            $http.defaults.withCredentials = true;
            var apiUrl = red9config.apiUrl;

            var apiOptions = {
                update: {method: 'PUT'}
            };

            var result = {
                dataset: $resource(apiUrl + '/dataset/:id', {id: '@id'}, apiOptions),
                event: $resource(apiUrl + '/event/:id', {id: '@id'}, apiOptions),
                comment: $resource(apiUrl + '/comment/:id', {id: '@id'}, apiOptions),
                user: $resource(apiUrl + '/user/:id', {id: '@id'}, apiOptions),
                video: $resource(apiUrl + '/video/:id', {id: '@id'}, apiOptions)
            };

            /** Will get a panel, and add it to the dataset under the "panel" key.
             *
             * @param options
             * @returns {$http promise}
             */
            result.dataset.prototype.getPanel = function (options) {
                var self = this;
                return $http({
                    url: apiUrl + '/dataset/' + this.id + '/json',
                    method: 'GET',
                    params: options
                }).success(function(data){
                   self.panel = data;
                });
            };

            result.dataset.prototype.addToCollection = function (key, values, callback) {
                var data = {};
                data[key] = values;
                $http.put(apiUrl + '/dataset/' + this.id + '/' + key, data)
                    .success(callback)
                    .error(function (data, status) {
                        console.log('Error: ' + data + ', ' + status);
                    });
            };

            result.dataset.prototype.removeFromCollection = function (key, values, callback) {
                var data = {};
                data[key] = values;
                $http.patch(apiUrl + '/dataset/' + this.id + '/' + key, data)
                    .success(callback)
                    .error(function (data, status) {
                        console.log('Error: ' + data + ', ' + status);
                    });
            };

            return result;
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