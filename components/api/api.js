angular
    .module('redComponents.api', [
        'ngResource',
        'lodash'
    ])

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
    .factory('api', function ($resource, $http, $interval, $q, _) {
        $http.defaults.withCredentials = true;
        var apiUrl = red9config.apiUrl;

        function transformResponse(data) {
            var wrappedResult = angular.fromJson(data);

            wrappedResult.data = wrappedResult.data || [];
            wrappedResult.data.$meta = wrappedResult.meta;

            return wrappedResult.data;
        }

        function responseInterceptor(response) {
            response.resource.$meta = response.data.$meta;
            return response.resource;
        }

        var endpoint = {
            single: {
                method: 'GET',
                isArray: false,
                transformResponse: transformResponse,
                interceptor: {response: responseInterceptor}
            },
            list: {
                method: 'GET',
                isArray: true,
                transformResponse: transformResponse,
                interceptor: {response: responseInterceptor}
            }
        };

        var metadataFormat = {
            get: endpoint.single,
            save: endpoint.single,
            update: endpoint.single,
            query: endpoint.list,
            remove: endpoint.single,
            delete: endpoint.single
        };

        var result = {
            dataset: $resource(apiUrl + '/dataset/:id', {id: '@id'}, metadataFormat),
            event: $resource(apiUrl + '/event/:id', {id: '@id'}, metadataFormat),
            comment: $resource(apiUrl + '/comment/:id', {id: '@id'}, metadataFormat),
            user: $resource(apiUrl + '/user/:id', {id: '@id'}, metadataFormat),
            video: $resource(apiUrl + '/video/:id', {id: '@id'}, metadataFormat)
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

        $http.get(apiUrl + '/sport/').success(function (data) {
            angular.extend(result.sports, data);
            angular.extend(result.sportsList, _.pluck(data, 'name'));
        });
        result.sports = [];
        result.sportsList = [];

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
        result.dataset.prototype.getPanel = function (options) {
            var self = this;


            var queryString = {
                size: 'lg'
            };

            _.each(options, function (value, key) {
                if (key === 'axes') {
                    if (!_.has(queryString, 'fields')) {
                        queryString.fields = [];
                    }
                    queryString.fields.push('panel(' + value.join(',') + ')');
                }
            });

            if (!_.has(queryString, 'fields')) {
                queryString.fields = queryString.fields.join(',');
            }

            return $http({
                method: 'GET',
                url: apiUrl + '/dataset/' + self.id + '/json',
                params: queryString
            }).success(function (data) {
                self.panel = data;
            });
        };

        result.dataset.prototype.getFcpxmlOptions = function () {
            var self = this;
            return $http({
                method: 'GET',
                url: apiUrl + '/dataset/' + self.id + '/fcpxml/options'
            }).success(function (options) {
                self.fcpxmlOptions = options;
            });
        };

        result.dataset.prototype.getFcpxmlUrl = function (options_) {
            // DW-332: we need to make a clone of the options so that our
            // options.files changes doesn't work it's way back to whoever
            // gave this to us.
            var options = _.clone(options_);

            // This function seems to get called at an inappropriate time...
            // HACK to make sure it doesn't error out.
            if (!options.files) {
                return '';
            }

            options.files = options.files.join(',');

            var params = [];
            angular.forEach(options, function (value, key) {
                this.push(key + '=' + value);
            }, params);
            return apiUrl + '/dataset/' + this.id + '/fcpxml?' + params.join('&');
        };

        result.dataset.prototype.getEvents = function () {
            var self = this;
            var eventQuery = {
                aggregateStatistics: true,
                aggregateStatisticsGroupBy: 'type',
                datasetId: self.id
            };

            return result.event
                .query(eventQuery)
                .$promise
                .then(function (events) {
                    self.events = events;
                });
        };

        result.dataset.prototype.eventFind = function () {
            var self = this;
            return $http({
                url: apiUrl + '/dataset/' + self.id + '/eventfind',
                method: 'POST'
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

        result.getCompoundStatistics = function (query, groupBy) {
            var deferred = $q.defer();

            var params = _.clone(query);
            params.groupBy = groupBy.join(',');
            $http({
                url: apiUrl + '/compound/',
                method: 'GET',
                params: params
            }).then(function (data) {
                var result = data.data.data;
                result.$meta = data.data.meta;

                console.dir(result);

                deferred.resolve(result);

            }).catch(deferred.reject);

            return deferred.promise;
        };

        return result;
    });