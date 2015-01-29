angular
    .module('redComponents.search.event', [
        'redComponents.api',
        'redComponents.badgeList',
        'redComponents.keypressEnter',
        'lodash'
    ])
    .directive('eventSearch', function () {
        return {
            restrict: 'E',
            scope: {
                query: '='
            },
            templateUrl: '/components/search/event/eventsearch.html',
            controller: function ($scope, _, api) {
                $scope.eventTypes = _.pluck(api.event.types, 'name');
                $scope.typeList = [];
                $scope.typeInput = '';

                $scope.datasetList = [];


                if (_.has($scope.query, 'type')) {
                    $scope.typeList = $scope.query.type.split(',');
                }

                if (_.has($scope.query, 'datasetId')) {
                    api.dataset.query({idList: $scope.query.datasetId}, function (results) {
                        $scope.datasetList = results;
                    });
                }

                $scope.addType = function () {
                    if ($scope.typeList.indexOf($scope.typeInput) === -1) {
                        $scope.typeList.push($scope.typeInput);
                    }
                    $scope.typeInput = '';
                };

                $scope.startSearch = function () {
                    var result = {};
                    if ($scope.typeList.length > 0) {
                        result.type = $scope.typeList.join(',');
                    }

                    if ($scope.datasetList.length > 0) {
                        result.datasetId = _.pluck($scope.datasetList, 'id').join(',');
                    }

                    $scope.query = result;
                };
            }
        };
    });