angular
    .module('redApp.search', [
        'lodash',
        'redComponents.queryValidator',
        'redComponents.queryBuilder.dataset',
        'redComponents.pageApi',
        'redComponents.tile.dataset',
        'redComponents.responsiveDetection'
    ])
    .config(function ($stateProvider) {

        // Validate URL:
        var pagingSchema = {
            offset: 'int',
            limit: 'int',
            sort: 'passthrough',
            sortDirection: 'passthrough'
        };

        var resource = {
            dataset: {
                schema: {
                    sport: 'passthrough',
                    title: 'passthrough',
                    'tags[]': 'passthrough',
                    userId: 'idList'
                },
                defaults: {
                    offset: 0,
                    limit: 24,
                    sort: 'startTime',
                    sortDirection: 'desc'
                },
                expand: 'user'
            },
            user: {
                schema: {},
                defaults: {
                    offset: 0,
                    limit: 24,
                    sort: 'displayName',
                    sortDirection: 'asc'
                }
            }
        };

        function createResourceList(name, model) {
            return function ($location, _, api, queryValidator) {
                // Validate URL:
                var schema = _.defaults(model.schema, pagingSchema);
                var search = _.defaults(queryValidator(schema, $location.search()), model.defaults);

                $location.search(search); // Save to URL

                if (_.has(model, 'expand')) {
                    search.expand = model.expand;
                }

                return api[name].query(search).$promise;
            };
        }

        $stateProvider.state('search_dataset', {
            url: '/dataset/',
            templateUrl: '/my-client/search/search_dataset.html',
            controller: 'search.dataset',
            resolve: {
                resourceList: createResourceList('dataset', resource.dataset)
            },
            data: {
                css: '/my-client/search/search_dataset.css'
            },
            accessLevel: 'basic',
            title: 'R9: Dataset Search'
        });

        $stateProvider.state('search_user', {
            url: '/user/',
            templateUrl: '/my-client/search/search_user.html',
            controller: 'search.user',
            resolve: {
                resourceList: createResourceList('user', resource.user)
            },
            accessLevel: 'admin',
            title: 'R9: User Search'
        });
    })
    .controller('search.user', function ($scope, resourceList) {
        $scope.resourceList = resourceList;
    })
    .controller('search.dataset', function ($scope, $location, _, api, resourceList, ResponsiveDetection) {

        var chunkSizes = {
            xs: 2,
            sm: 2,
            md: 2,
            lg: 3
        };

        function chunk(arr, size) {
            // Taken from http://stackoverflow.com/a/21653981/2557842
            var newArr = [];
            for (var i = 0; i < arr.length; i += size) {
                newArr.push(arr.slice(i, i + size));
            }
            return newArr;
        }

        $scope.$watchCollection('resourceList', function (newValue) {
            $scope.chunkedList = chunk(newValue, chunkSizes[ResponsiveDetection.getBreakpoint()]);
        });
        $scope.resourceList = resourceList;

        $scope.paging = {
            sort: $location.search().sort,
            sortDirection: $location.search().sortDirection,
            offset: parseInt($location.search().offset),
            limit: parseInt($location.search().limit)
        };

        $scope.$watchCollection('paging', function (newValue, oldValue) {
            if (newValue !== oldValue) { // is this not initialization?
                $location.search(_.extend({}, $location.search(), $scope.paging));
                runSearch();
            }
        });

        $scope.query = _.pick({
            title: $location.search().title,
            'tags[]': (!_.has($location.search(), 'tags[]') || // This really ugly piece of code
            _.isArray($location.search()['tags[]']))           // is to convert a single element
                ? $location.search()['tags[]']                 // from a string to an array
                : [$location.search()['tags[]']],              // but for nothing be undefined.
            userId: $location.search().userId,
            sport: $location.search().sport
        }, _.identity); // Keep only the defined values

        $scope.$watchCollection('query', function queryChange(newValue, oldValue) {
            if (newValue !== oldValue) {
                var t = _.extend({}, $scope.paging, $scope.query);
                if (t.title === '') { // Get rid of empty string.
                    delete t.title;
                }
                $location.search(t);
                if ($scope.paging.offset === 0) {
                    runSearch();
                } else {
                    $scope.paging.offset = 0; // Triggers the watch
                }
            }
        });

        function runSearch() {
            var t = $location.search();
            t.expand = 'user';
            api.dataset.query(t,
                function (resourceList) {
                    $scope.resourceList = resourceList;
                });
        }

        $scope.searchChanged = function () {
            $scope.paging.offset = 0;
            runSearch();
        };
    });
