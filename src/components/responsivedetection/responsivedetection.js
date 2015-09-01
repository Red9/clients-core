angular
    .module('redComponents.responsiveDetection', [])
    .factory('ResponsiveDetection', function ($window) {
        return {
            getBreakpoint: function () {
                var w = $window.innerWidth;
                if (w < 768) {
                    return 'xs';
                } else if (w < 992) {
                    return 'sm';
                } else if (w < 1200) {
                    return 'md';
                } else {
                    return 'lg';
                }
            }
        };
    });