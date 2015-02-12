angular
    .module('redComponents.queryBuilder.dataset', [
        'redComponents.api',
        'lodash',
        'ngTagsInput'
    ])
    .directive('queryBuilderDataset', function () {
        return {
            restrict: 'E',
            scope: {
                query: '='
            },
            templateUrl: '/components/querybuilder/dataset/dataset.html',
            controller: function ($scope, _, api) {
                // Load the users who we are searching for already
                if (_.has($scope.query, 'userId')) {
                    api.user.query({idList: $scope.query.userId}).$promise
                        .then(function (users) {
                            $scope.queryDisplay.users = users;
                        })
                        .finally(function () {
                            // Defer adding the watch until after we're done loading
                            // users, if any
                            $scope.$watchCollection('queryDisplay.users', queryDisplayWatchUsers);
                        });
                } else {
                    $scope.$watchCollection('queryDisplay.users', queryDisplayWatchUsers);
                }

                $scope.queryDisplay = _.pick({
                    tags: _.map($scope.query['tags[]'], function (tag) {
                        return {text: tag};
                    })
                }, _.identity);

                $scope.$watchCollection('queryDisplay.tags', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        $scope.query['tags[]'] = _.pluck($scope.queryDisplay.tags, 'text');
                    }
                });

                function queryDisplayWatchUsers(newValue, oldValue) {
                    if (newValue !== oldValue) {
                        if ($scope.queryDisplay.users && $scope.queryDisplay.users.length > 0) {
                            $scope.query.userId = _.pluck($scope.queryDisplay.users, 'id').join(',');
                        } else {
                            delete $scope.query.userId;
                        }
                    }
                }

                $scope.sports = api.sports;
                $scope.sportsList = api.sportsList;

                $scope.searchUsers = function (query) { // for autocomplete
                    return api.user.query({displayName: query}).$promise;
                };
            }
        };
    });