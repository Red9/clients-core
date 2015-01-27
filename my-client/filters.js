(function () {
    'use strict';

    /* Filters */

    angular.module('redApp.filters', [])
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
                    return value;
                }
            };
        })
        .filter('sumDuration', function (_) {
            return function (resources) {
                return _.reduce(resources, function (memo, resource) {
                    memo += (resource.endTime - resource.startTime);
                    return memo;
                }, 0);
            };
        })
        .filter('duration', function (_) {
            return function (totalMilliseconds, tight) {
                if (_.isNaN(totalMilliseconds)) {
                    totalMilliseconds = 0;
                }

                if (typeof tight === 'undefined') {
                    tight = false;
                }

                // adapted from here: http://stackoverflow.com/a/6313008/2557842
                var totalSeconds = Math.floor(totalMilliseconds / 1000);
                var hours = Math.floor(totalSeconds / 3600);
                var minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
                var seconds = totalSeconds - (hours * 3600) - (minutes * 60);
                var milliseconds = Math.floor(totalMilliseconds - totalSeconds * 1000);

                var minutesString = '' + minutes;
                if (minutes < 10) {
                    minutesString = '0' + minutes;
                }
                var secondsString = '' + seconds;
                if (seconds < 10) {
                    secondsString = '0' + seconds;
                }

                var millisecondsString = '' + milliseconds;
                if (milliseconds < 10) {
                    millisecondsString = '00' + milliseconds;
                } else if (milliseconds < 100) {
                    millisecondsString = '0' + milliseconds;
                }


                if (tight === false || hours > 0) {
                    return hours + 'h ' + minutesString + 'm'; // Don't display seconds if it's more than an hour. "Oddly precise".
                } else if (minutes > 0) {
                    return minutes + 'm ' + secondsString + '.' + millisecondsString + 's';
                } else {
                    return seconds + '.' + millisecondsString + 's';
                }

            };
        }).
        filter('slice', function () {
            // Taken from here: http://jsfiddle.net/BinaryMuse/vQUsS/
            return function (arr, start, end) {
                return arr.slice(start, end);
            };
        });
})();