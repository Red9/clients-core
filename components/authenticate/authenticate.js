angular
    .module('redComponents.authenticate', [

        'lodash'
    ])
    .factory('authenticate', function ($http, $window, $interval, $location, current, _) {
        $http.defaults.withCredentials = true;
        return {
            logout: function () {
                current.user = null;
                $http.post(red9config.apiUrl + '/auth/logout');
                $window.location = '/';
            },
            login: function () {
                if (_.has($location.search(), 'attemptUrl')) {
                    console.log('setting callbackURL to attemptURL');
                    $window.location = red9config.apiUrl + '/auth/google?callbackUrl=' + encodeURIComponent($location.search().attemptUrl);
                } else {
                    console.log('setting callbackURL to absURL');
                    $window.location = red9config.apiUrl + '/auth/google?callbackUrl=' + $location.absUrl();
                }
            }
        };
    });
