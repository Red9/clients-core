angular
    .module('redComponents.autoFocus', [])
    // Taken from http://stackoverflow.com/a/20865048/2557842
    .directive('autoFocus', function ($timeout) {
        return {
            restrict: 'AC',
            link: function (_scope, _element) {
                $timeout(function () {
                    _element[0].focus();
                }, 400);
            }
        };
    });
