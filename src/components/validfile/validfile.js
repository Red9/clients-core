angular
    .module('redComponents.validFile', [])
    // Taken from here: http://stackoverflow.com/a/22795642/2557842
    .directive('validFile', function () {
        return {
            require: 'ngModel',
            link: function (scope, el, attrs, ngModel) {
                el.bind('change', function () {
                    scope.$apply(function () {
                        ngModel.$setViewValue(el.val());
                        ngModel.$render();
                    });
                });
            }
        };
    });