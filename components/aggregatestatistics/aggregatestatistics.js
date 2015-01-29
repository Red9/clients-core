angular
    .module('redComponents.aggregateStatistics', [
        'redComponents.filters.display.duration',
        'redComponents.filters.display.units'
    ])
    .directive('aggregateStatistics', function () {
        return {
            restrict: 'E',
            templateUrl: '/components/aggregatestatistics/aggregatestatistics.html',
            controller: function ($scope) {
            }
        };
    });
