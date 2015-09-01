angular
    .module('redComponents.summaryStatistics', [])
    .directive('summaryStatistics', function () {
        return {
            restrict: 'E',
            scope: {
                statistics: '='
            },
            templateUrl: '/components/summarystatistics/summarystatistics.html',
            controller: function ($scope) {
            }
        };
    });
