angular
    .module('redComponents.authenticate', [])
    .factory('authenticate', function ($http, $window, $location) {
        $http.defaults.withCredentials = true;
        return {
            logout: function () {
                $http.post(red9config.apiUrl + '/auth/logout', {})
                    .success(function () {
                        $window.location = '/'; // A bit hacky, but at this point who cares? ...
                    });
            },
            login: function () {
                $window.location = red9config.apiUrl + '/auth/google?callbackUrl=' + $location.absUrl();
            }
        };
    });
