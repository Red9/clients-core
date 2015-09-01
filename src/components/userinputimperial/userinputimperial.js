angular
    .module('redComponents.userInputImperial', [])
    .directive('userInputImperial', function () {
        // Adapted from: http://stackoverflow.com/a/17632922/2557842
        // Must be at attribute with the attribute key
        // value the unit to convert to.
        // TODO: Does the year option appropriately account for timezones?
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {

                var imperialUnit = attrs.userInputImperial;

                var unitMap = {
                    lb: 'kg',
                    year: 'timestamp'
                };

                if (!unitMap.hasOwnProperty(imperialUnit)) {
                    throw new Error('Must provide a valid imperial unit to convert from. Invalid: ' + imperialUnit);
                }

                var siUnit = unitMap[imperialUnit];

                // Convert from imperial to SI (Red9)
                ngModel.$parsers.push(function (imperial) {
                    if (!imperial) { // undefined
                        return imperial;
                    }

                    if (imperialUnit === 'lb' && siUnit === 'kg') {
                        return imperial * 0.453592;
                    }
                    if (imperialUnit === 'year' && siUnit === 'timestamp') {
                        return (new Date('1/1/' + imperial)).getTime();
                    }

                });

                // Convert from SI (Red9) to imperial
                ngModel.$formatters.push(function (si) {
                    if (!si) { // undefined
                        return si;
                    }

                    if (imperialUnit === 'lb' && siUnit === 'kg') {
                        return Math.round(si * 2.20462);
                    }
                    if (imperialUnit === 'year' && siUnit === 'timestamp') {
                        return (new Date(si)).getFullYear();
                    }
                });
            }
        };
    });
