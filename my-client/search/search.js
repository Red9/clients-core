angular
    .module('redApp.search', [
        'ngRoute',
        'lodash',
        'redComponents.search.dataset',
        'redComponents.search.event',
        'redComponents.resourceList',
        'redComponents.resourceList',
        'redComponents.userInput',
        'redComponents.queryValidator',
        'redComponents.queryBuilder.dataset',
        'redComponents.pageApi'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('search_dataset', {
            url: '/dataset/',
            templateUrl: '/my-client/search/search_dataset.html',
            controller: 'search.dataset',
            resolve: {
                resourceList: function ($location, _, api, queryValidator) {

                    // Validate URL:
                    var schema = {
                        offset: 'int',
                        limit: 'int',
                        sort: 'passthrough',
                        sortDirection: 'passthrough',
                        sport: 'passthrough',
                        title: 'passthrough',
                        'tags[]': 'passthrough',
                        userId: 'idList'
                    };

                    var search =
                        _.defaults(queryValidator(schema, $location.search()), {
                            offset: 0,
                            limit: 25,
                            sort: 'createdAt',
                            sortDirection: 'desc'
                        });

                    $location.search(search); // Save to URL

                    return api.dataset.query(search);
                }
            },
            data: {
                css: '/my-client/search/search_dataset.css'
            }
            //accessLevel: 'basic',
            //title: 'R9: Dataset Search'
        });
    })
    .controller('search.dataset', function ($scope, $location, _, api, resourceList) {
        $scope.resourceList = resourceList;


        $scope.selected = {
            delete: function () {
                console.log('Delete: ');
                console.dir($scope.selectedResources);
            },
            events: function () {

            }
        };

        $scope.selectedResources = [];

        $scope.selectResource = function ($event, resource) {
            console.log('selectResource()');
            if ($event.target.checked) {
                console.log('Adding resource');
                $scope.selectedResources.push(resource);
            } else {
                console.log('Removing resource');
                _.remove($scope.selectedResources, function (r) {
                    return r.id === resource.id;
                });
            }
            $event.stopPropagation();
        };


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
            api.dataset.query($location.search(),
                function (resourceList) {
                    $scope.resourceList = resourceList;
                });
        }

        $scope.searchChanged = function () {
            $scope.paging.offset = 0;
            runSearch();
        };
    });