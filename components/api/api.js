angular
    .module('redComponents.api', [
        'ngResource',
        'lodash'
    ])

    // TODO: Clean this up!
    // TODO: Add in code to wrap the expanded responses into Angular resource objects, eg http://stackoverflow.com/questions/16452277/how-can-i-extend-the-constructor-of-an-angularjs-resource-resource

    .factory('api', function ($resource, $http, $interval, $q, _, $timeout, $window) {
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

        var metadataResponse = {
            transformResponse: transformResponse,
            interceptor: {response: responseInterceptor}
        };

        var metadataFormat = {
            get: _.merge({}, metadataResponse, {method: 'GET'}),
            save: _.merge({}, metadataResponse, {method: 'POST'}),
            query: _.merge({}, metadataResponse, {
                method: 'GET',
                isArray: true
            }),
            remove: _.merge({}, metadataResponse, {method: 'DELETE'}),
            delete: _.merge({}, metadataResponse, {method: 'DELETE'})
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
            resource.prototype.update = // This name should be phased out once I figure out who is using it...
                resource.prototype.$update = function (updateValues) {
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
            $timeout(function () {
                angular.extend(result.sports, data);
                angular.extend(result.sportsList, _.pluck(data, 'name'));
            }, 1000);
        });

        result.sports = [];
        result.sportsList = [];

        result.domain = apiUrl; // export if needed.

        $http.get(apiUrl + '/eventtype/').success(function (data) {
            angular.extend(result.event.types, data);
        });
        result.event.types = [];

        //result.event.getPanel = function (event) {
        //    $http({
        //        url: apiUrl + '/event/' + event.id + '/json?size=sm',
        //        method: 'GET'
        //    }).success(function (data) {
        //        event.panel = data;
        //    });
        //};


        /** Will get a panel, and add it to self under the "panel" key.
         *
         * @param {String} type event or dataset
         * @param {String|Number} id
         * @param {Object} [options]
         * @param {Number} [options.startTime]
         * @param {Number} [options.endTime]
         * @param {String} [options.size]
         * @param {Array|String} [options.axes]
         * @param {Object|Number} [options.filters]
         * // Any other keys are passed directly to the API
         * @returns {$http promise}
         */
        function getPanelRaw(type, id, options) {
            var queryString = {
                size: _.has(options, 'size') ? options.size : 'lg'
            };

            if (!_.isUndefined(options)) {
                queryString.startTime = options.startTime;
                queryString.endTime = options.endTime;

                console.dir(options);


                _.each(options, function (value, key) {
                    if (key === 'axes') {
                        if (!_.has(queryString, 'fields')) {
                            queryString.fields = [];
                        }
                        queryString.fields.push('panel(' + value.join(',') + ')');
                    } else if (key === 'filters') {
                        console.log('Setting filters');
                        _.each(value, function (filterValue, filterType) {
                            queryString['filter' + filterType] = filterValue;
                        });
                    }
                });
            }

            if (_.has(queryString, 'fields')) {
                queryString.fields = queryString.fields.join(',');
            }


            return $http({
                method: 'GET',
                url: apiUrl + '/' + type + '/' + id + '/json',
                params: queryString
            });
        }

        result.getPanel = getPanelRaw;

        result.dataset.prototype.getPanel = function (options) {
            var self = this;
            return getPanelRaw('dataset', self.id, options)
                .success(function (data) {
                    // This is a bit of a hack! Allows for storing both a
                    // regular sized panel and an extra large size panel.
                    if (options.key) {
                        self[options.key] = data;
                    } else {
                        self.panel = data;
                    }
                });
        };

        result.event.prototype.getPanel = function (options) {
            var self = this;
            return getPanelRaw('event', self.id, options)
                .success(function (data) {
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

        /** Downloads a CSV panel to the user's browser.
         *
         * @param {Object} options
         * @param {Number} options.frequency The frequency in Hz
         * @param {Number} [options.startTime]
         * @param {Number} [options.endTime]
         * @param {Array|String} [options.axes]
         */
        result.dataset.prototype.getCSVPanel = function (options) {
            if (!_.has(options, 'frequency') || !_.isNumber(options.frequency)) {
                throw new Error('Invalid options.frequency parameter.');
            }

            var resultUrl = apiUrl + '/dataset/' + this.id + '/csv?frequency=' + options.frequency;

            if (_.has(options, 'axes')) {
                resultUrl += '&axes=' + options.axes.join(',');
            }

            if (_.has(options, 'startTime')) {
                resultUrl += '&startTime=' + options.startTime;
            }

            if (_.has(options, 'endTime')) {
                resultUrl += '&endTime=' + options.endTime;
            }

            $window.open(resultUrl);
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