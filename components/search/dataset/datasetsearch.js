angular
    .module('redComponents.search.dataset', [
        'redComponents.api',
        'redComponents.badgeList',
        'redComponents.keypressEnter',
        'lodash'
    ])
    .directive('datasetSearch', function () {
        return {
            restrict: 'E',
            scope: {
                query: '='
            },
            templateUrl: '/components/search/dataset/datasetsearch.html',
            controller: function ($scope, $location, _, api) {

                // Working Variable
                $scope.tagInput = '';

                $scope.sports = api.sports;

                // Search Query variables
                if (_.has($scope.query, 'title')) {
                    $scope.searchTitle = $scope.query.title;
                } else {
                    $scope.seachTitle = '';
                }

                if (_.has($scope.query, 'tags')) {
                    if (_.isArray($scope.query.tags)) {
                        // If there's a single element it will be passed as a single value.
                        $scope.tagList = $scope.query.tags;
                    } else {
                        $scope.tagList = [$scope.query.tags];
                    }
                } else {
                    $scope.tagList = [];
                }

                if (_.has($scope.query, 'userId')) {
                    api.user.query({idList: $scope.query.userId}, function (results) {
                        $scope.userList = results;
                    });
                }

                $scope.userList = [];

                function checkSportQuery() {
                    if (_.has($scope.query, 'sport')) {
                        // Todo: update this section with _.find when we upgrade
                        // to lodash.
                        var index = _.pluck(api.sports, 'name')
                            .indexOf($scope.query.sport);
                        //console.log('Index: ' + index);
                        //console.dir(api.sports);
                        //console.dir(_.pluck(api.sports, 'name'));
                        if (index > -1) {
                            $scope.sport = api.sports[index];
                            //console.log('$scope.sport: ' + $scope.sport);
                        }
                    }
                }

                // This is a bit of a hack, since on load sports (which is
                // filled from the API) doesn't have anything. Then it does.
                $scope.$watchCollection('sports', checkSportQuery);
                checkSportQuery();

                $scope.addTag = function () {
                    // Make sure that we only add new tags
                    if ($scope.tagList.indexOf($scope.tagInput) === -1) {
                        $scope.tagList.push($scope.tagInput);
                    }
                    // But clear input regardless.
                    $scope.tagInput = '';
                };

                $scope.startSearch = function () {
                    var result = {};

                    if ($scope.userList.length > 0) {
                        result.userId = _.pluck($scope.userList, 'id').join(',');
                    }

                    if ($scope.tagList.length > 0) {
                        result['tags[]'] = $scope.tagList;
                    }

                    //console.log('$scope.searchTitle: ' + $scope.searchTitle);

                    if ($scope.searchTitle &&
                        $scope.searchTitle.length > 0) {
                        result.title = $scope.searchTitle;
                    }

                    //console.log('$scope.sport: ' + $scope.sport);

                    if ($scope.sport) {
                        result.sport = $scope.sport.name;
                    }

                    $scope.query = result;
                };
            }
        };
    });