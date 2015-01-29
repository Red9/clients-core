angular
    .module('redComponents.filters.display.sumDuration', [
        'lodash'
    ])
    .filter('sumDuration', function (_) {
        return function (resources) {
            return _.reduce(resources, function (memo, resource) {
                memo += (resource.endTime - resource.startTime);
                return memo;
            }, 0);
        };
    });
