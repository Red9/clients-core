angular
    .module('redComponents.filters.display.duration', [
        'lodash'
    ])
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

            // We only care about the first digit (don't want to get too precise)
            millisecondsString = millisecondsString[0];

            if (tight === 'smart') {
                var result = minutesString + 'min';
                if (hours > 0) {
                    result = hours + 'hr ' + result;
                }
                return result;
            } else if (tight === false || hours > 0) {
                return hours + 'h ' + minutesString + 'm'; // Don't display seconds if it's more than an hour. "Oddly precise".
            } else if (minutes > 0) {
                return minutes + 'm ' + secondsString + '.' + millisecondsString + 's';
            } else {
                return seconds + '.' + millisecondsString + 's';
            }

        };
    });
