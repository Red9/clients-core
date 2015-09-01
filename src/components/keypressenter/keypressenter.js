angular
    .module('redComponents.keypressEnter', [])
    .directive('keypressEnter', function () {
        // Taken from here: http://stackoverflow.com/a/17472118/2557842
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.keypressEnter);
                    });

                    event.preventDefault();
                }
            });
        };
    });