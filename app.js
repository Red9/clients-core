(function () {
    'use strict';

    angular.module('lodash', [])
        .factory('_', function () {
            return window._; // assumes underscore has already been loaded on the page
        });

// Declare app level module which depends on filters, and services
    angular
        .module('redApp', [
            'ui.bootstrap',
            'ui.router',
            'uiRouterStyles',

            'angulartics',
            'angulartics.segment.io',

            'redApp.experiment',
            'redApp.userProfile',
            'redApp.uploadRNC',
            'redApp.leaderboard',
            'redApp.sitestatistics',
            'redApp.unauthenticated',
            'redApp.home',
            'redApp.editUserProfile',
            'redApp.admin',
            'redApp.dataAnalysis',
            'redApp.search',
            'redApp.event',

            'redApp.svg',
            'redApp.mapDemo',

            'redComponents.authenticate',

            'redComponents.head' // Is this the correct use of this directive?
        ])
        .value('duScrollOffset', 50) // Compensate for the navbar
        .controller('pageController', function ($scope, authenticate) {
            $scope.logout = authenticate.logout;
        })
        .config(function ($stateProvider, $locationProvider, $urlRouterProvider) {
            // Pages
            $stateProvider.state('jobs', {
                url: '/page/jobs',
                templateUrl: '/my-client/pages/jobs.html'
                //accessLevel: 'public',
                //title: 'R9: Jobs'
            });

            $stateProvider.state('404', {
                templateUrl: '/my-client/pages/404.html'
                //accessLevel: 'public',
                //title: 'R9: 404'
            });

            $locationProvider.html5Mode(true);

            // "redirect" to 404 without changing URL
            // Taken from http://stackoverflow.com/a/25591908/2557842
            $urlRouterProvider.otherwise(function ($injector, $location) {
                var state = $injector.get('$state');
                state.go('404');
                return $location.path();
            });
        })
        .config(function ($resourceProvider) {
            // Don't strip trailing slashes from calculated URLs
            $resourceProvider.defaults.stripTrailingSlashes = false;
        })
        .run(function ($rootScope, $location, $window, current, authenticate, $state) {
            // The idea of using cookies for initial user authentication came from this page:
            // http://www.frederiknakstad.com/2013/01/21/authentication-in-single-page-applications-with-angular-js/
            //var currentUser = $cookieStore.get('currentUser');
            // currentUser may be undefined, in which case we set it to null.
            //$rootScope.currentUser = typeof currentUser === 'undefined' ? null : currentUser;
            $rootScope.current = current;
            $rootScope.authenticate = authenticate;
            //$cookieStore.remove('currentUser');

            // Check authentication
            $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
                if (toState.accessLevel !== 'public') {
                    if ($rootScope.current.user === null) {
                        // Attempting to access a protected page.
                        event.preventDefault();
                        $state.go('unauthenticated');
                        //$location.search({attemptUrl: encodeURIComponent($location.absUrl())});
                        //$location.path('/page/unauthenticated');
                    }
                    /*else if ($rootScope.current.user.scope.indexOf(nextLoc.accessLevel) === -1) {
                     // Not enough permissions
                     alert("You don't have sufficient permissions to access that.");
                     $location.search('attemptUrl', encodeURIComponent($location.absUrl()));
                     $location.path('/page/unauthenticated');
                     }*/
                }
            });

            $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
                console.log('state change error: ');
                console.dir(error);
                console.dir(event);
                console.dir(toState);
            });

            // Set page title
            $rootScope.$on('$stateChangeSuccess', function (event, toState) {
                $rootScope.pageTitle = toState.title;
            });
        });
})();

