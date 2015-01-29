angular
    .module('redComponents.tagHelper', [
        'redComponents.badgeList',
        'redComponents.keypressEnter'
    ])
    .directive('tagHelper', function () {
        return {
            restrict: 'E',
            scope: {
                tagKey: '@', // The resource key, eg 'tags'
                resource: '='
            },
            templateUrl: '/components/taghelper/taghelper.html',
            controller: function ($scope) {
                $scope.$watch('resource', function () {
                    try {
                        $scope.tagList = $scope.resource[$scope.tagKey];
                    } catch (e) {
                    }
                });

                $scope.deleteTag = function (tag) {
                    $scope.resource.removeFromCollection($scope.tagKey, [tag], function () {
                        console.log('Deleted.');
                    });
                };

                $scope.addTag = function () {
                    var value = $scope.newTagInput;
                    if ($scope.resource[$scope.tagKey].indexOf(value) === -1) {
                        $scope.resource.addToCollection($scope.tagKey, [value], function () {
                            $scope.resource[$scope.tagKey].push(value);
                        });
                    }
                    $scope.newTagInput = '';
                };
            }
        };
    });
