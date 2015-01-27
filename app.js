(function () {
    'use strict';

    angular.module('underscore', [])
        .factory('_', function () {
            return window._; // assumes underscore has already been loaded on the page
        });

    angular.module('async', [])
        .factory('async', function () {
            return window.async; // assumes async has already been loaded on the page
        });

// Declare app level module which depends on filters, and services
    angular.module('redApp', [
        'ui.bootstrap',
        'ngAnimate',
        'ngRoute',
        'ngCookies',
        'ngResource',
        'angularSpinner',
        'angular.filter',
        'angularFileUpload',
        'angulartics',
        'angulartics.segment.io',
        'underscore',
        'redApp.filters',
        'redApp.services',
        'redApp.directives',
        'redApp.controllers',
        'leaflet-directive'
    ])
        .config(function ($routeProvider, $locationProvider) {
            // Resources
            $routeProvider.when('/', {
                templateUrl: '/my-client/partials/home.html',
                css: '/my-client/css/home.css',
                controller: 'homeController',
                accessLevel: 'basic',
                title: 'Red9: Measure Up to You'
            });
            $routeProvider.when('/dataset/', {
                templateUrl: '/my-client/partials/searchdataset.html',
                css: '/my-client/css/dataset.css',
                controller: 'search',
                accessLevel: 'basic',
                title: 'R9: Dataset Search'
            });
            $routeProvider.when('/event/', {
                templateUrl: '/my-client/partials/searchevent.html',
                controller: 'search',
                accessLevel: 'basic',
                title: 'R9: Event Search'
            });
            $routeProvider.when('/user/', {
                templateUrl: '/my-client/partials/searchuser.html',
                controller: 'search',
                accessLevel: 'basic',
                title: 'R9: User Search'
            });
            $routeProvider.when('/user/:id/admin', {
                templateUrl: '/my-client/partials/edituserprofile.html',
                css: '/my-client/css/edituserprofile.css',
                controller: 'editUserProfile',
                accessLevel: 'admin',
                title: 'R9: Edit User Profile'
            });
            $routeProvider.when('/user/:id', {
                templateUrl: '/my-client/partials/userprofile.html',
                css: '/my-client/css/userprofile.css',
                controller: 'userProfile',
                accessLevel: 'basic',
                title: 'R9: User Profile'
            });
            $routeProvider.when('/aggregate/sitestatistics', {
                templateUrl: '/my-client/partials/aggregate/sitestatistics.html',
                controller: 'siteStatistics',
                accessLevel: 'basic',
                title: 'R9: Site Statistics'
            });
            $routeProvider.when('/page/unauthenticated', { // TODO: Users shouldn't be able to access this page when they are signed in.
                templateUrl: '/my-client/partials/unauthenticated.html',
                css: '/my-client/css/unauthenticated.css',
                controller: 'unauthenticatedController',
                accessLevel: 'public',
                title: 'R9: Not Authenticated'
            });
            $routeProvider.when('/upload/rnc', {
                templateUrl: '/my-client/partials/uploadrnc.html',
                controller: 'uploadRNC',
                accessLevel: 'basic',
                title: 'R9: Upload'
            });
            $routeProvider.when('/leaderboard/:tag?', {
                templateUrl: '/my-client/partials/leaderboard.html',
                css: '/my-client/css/leaderboard.css',
                controller: 'leaderboard',
                accessLevel: 'public',
                title: 'R9: Leaderboard'
            });
            $routeProvider.when('/analysis/:id', {
                templateUrl: '/my-client/partials/dataanalysis.html',
                controller: 'dataanalysis',
                css: '/my-client/css/dataanalysis.css',
                accessLevel: 'public',
                title: 'R9: Data Analysis'
            });
            $routeProvider.when('/admin/', {
                templateUrl: '/my-client/partials/admin.html',
                controller: 'admin',
                accessLevel: 'basic',
                title: 'R9: Administrative Tasks'
            });

            // Pages
            $routeProvider.when('/page/404', {
                templateUrl: '/my-client/partials/page/404.html',
                accessLevel: 'public',
                title: 'R9: 404'
            });
            $routeProvider.when('/page/about', {
                templateUrl: '/my-client/partials/page/about.html',
                accessLevel: 'public',
                title: 'R9: About'
            });
            $routeProvider.when('/page/jobs', {
                templateUrl: '/my-client/partials/page/jobs.html',
                accessLevel: 'public',
                title: 'R9: Jobs'
            });
            $routeProvider.when('/page/monitor', {
                templateUrl: '/my-client/partials/page/monitor.html',
                accessLevel: 'admin',
                title: 'R9: Admin'
            });
            $routeProvider.when('/page/team', {
                templateUrl: '/my-client/partials/page/team.html',
                accessLevel: 'public',
                title: 'R9: Team'
            });
            $routeProvider.when('/page/uploadrnc', {
                templateUrl: '/my-client/partials/page/uploadrnc.html',
                accessLevel: 'public',
                title: 'R9: Upload RNC'
            });

            $routeProvider.otherwise({
                redirectTo: '/page/404'
            });

            $locationProvider.html5Mode(true);
        })
        .config(function ($resourceProvider) {
            // Don't strip trailing slashes from calculated URLs
            $resourceProvider.defaults.stripTrailingSlashes = false;
        })
        .run(function ($rootScope, $location, $window, current, authenticate) {
            // The idea of using cookies for initial user authentication came from this page:
            // http://www.frederiknakstad.com/2013/01/21/authentication-in-single-page-applications-with-angular-js/
            //var currentUser = $cookieStore.get('currentUser');
            // currentUser may be undefined, in which case we set it to null.
            //$rootScope.currentUser = typeof currentUser === 'undefined' ? null : currentUser;
            $rootScope.current = current;
            $rootScope.authenticate = authenticate;
            //$cookieStore.remove('currentUser');

            // Check authentication
            $rootScope.$on('$routeChangeStart', function (event, nextLoc, currentLoc) {
                if (nextLoc.accessLevel !== 'public') {
                    if ($rootScope.current.user === null) {
                        // Attempting to access a protected page.
                        $location.search('attemptUrl', encodeURIComponent($location.absUrl()));
                        $location.path('/page/unauthenticated');
                    } else if ($rootScope.current.user.scope.indexOf(nextLoc.accessLevel) === -1) {
                        // Not enough permissions
                        alert("You don't have sufficient permissions to access that.");
                        $location.search('attemptUrl', encodeURIComponent($location.absUrl()));
                        $location.path('/page/unauthenticated');
                    }
                }
            });

            // Set page title
            $rootScope.$on('$routeChangeSuccess', function (event, currentRoute, previousRoute) {
                $rootScope.pageTitle = currentRoute.title;
            });
        });
})();
