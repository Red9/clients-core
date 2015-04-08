angular
    .module('redComponents.filters.display.units', [])
    .filter('units', function () {
        return function (value, fromUnits, toUnits) {
            if (fromUnits === 'knots' && toUnits === 'mph') {
                return value * 1.15077945;
            } else if (fromUnits === 'meters' && toUnits === 'feet') {
                return value * 3.280;
            } else if (fromUnits === 'meters' && toUnits === 'miles') {
                return value * 0.000621371;
            } else if (fromUnits === 'Hz' && toUnits === 'RPH') {
                // Convert from cycles per second to cycles per hour
                return value * 60 * 60;
            } else {
                throw new Error('Can not convert from ' + fromUnits + ' to ' + toUnits);
            }
        };
    });
