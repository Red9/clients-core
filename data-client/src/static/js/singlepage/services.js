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
        .factory('api', function ($resource, $http, _) {
            $http.defaults.withCredentials = true;
            var apiUrl = red9config.apiUrl;

            var result = {
                dataset: $resource(apiUrl + '/dataset/:id', {id: '@id'}),
                event: $resource(apiUrl + '/event/:id', {id: '@id'}),
                comment: $resource(apiUrl + '/comment/:id', {id: '@id'}),
                user: $resource(apiUrl + '/user/:id', {id: '@id'}),
                video: $resource(apiUrl + '/video/:id', {id: '@id'})
            };

            _.each(result, function (resource, type) {
                /**
                 *
                 * @param updateValues {object} a set of key values to PUT to the server
                 */
                resource.prototype.update = function (updateValues) {
                    var self = this;
                    var request = $http({
                        url: apiUrl + '/' + type + '/' + self.id,
                        method: 'PUT',
                        data: updateValues
                    }).success(function (data) {
                        angular.extend(self, updateValues);
                    });
                    return request;
                };
            });


            $http.get(apiUrl + '/eventtype/').success(function (data) {
                angular.extend(result.event.types, data);
            });
            result.event.types = [];

            result.event.getPanel = function (event) {
                $http({
                    url: apiUrl + '/event/' + event.id + '/json?size=sm',
                    method: 'GET'
                }).success(function (data) {
                    event.panel = data;
                });
            };


            /** Will get a panel, and add it to the dataset under the "panel" key.
             *
             * @param options
             * @returns {$http promise}
             */
            result.dataset.prototype.getPanel = function () {
                var self = this;
                return $http({
                    url: apiUrl + '/dataset/' + self.id + '/json?size=lg',
                    method: 'GET'
                }).success(function (data) {
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