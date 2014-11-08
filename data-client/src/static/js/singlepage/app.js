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
                templateUrl: '/static/partials/home.html',
                controller: 'homeController',
                accessLevel: 'user',
                title: 'Red9: Measure Up to You'
            });
            $routeProvider.when('/dataset/', {
                templateUrl: '/static/partials/searchdataset.html',
                controller: 'search',
                accessLevel: 'user',
                title: 'R9: Dataset Search'
            });
            $routeProvider.when('/event/', {
                templateUrl: '/static/partials/searchevent.html',
                controller: 'search',
                accessLevel: 'user',
                title: 'R9: Event Search'
            });
            $routeProvider.when('/user/', {
                templateUrl: '/static/partials/searchuser.html',
                controller: 'search',
                accessLevel: 'user',
                title: 'R9: User Search'
            });

            $routeProvider.when('/user/me', {
                templateUrl: '/static/partials/myprofile.html',
                controller: 'myProfile',
                accessLevel: 'user',
                title: 'R9: My Profile'
            });
            $routeProvider.when('/user/:id', {
                templateUrl: '/static/partials/userprofile.html',
                controller: 'userProfile',
                accessLevel: 'user',
                title: 'R9: User Profile'
            });
            $routeProvider.when('/aggregate/sitestatistics', {
                templateUrl: '/static/partials/aggregate/sitestatistics.html',
                controller: 'siteStatistics',
                accessLevel: 'user',
                title: 'R9: Site Statistics'
            });
            $routeProvider.when('/page/unauthenticated', { // TODO: Users shouldn't be able to access this page when they are signed in.
                templateUrl: '/static/partials/unauthenticated.html',
                controller: 'unauthenticatedController',
                accessLevel: 'public',
                title: 'R9: Not Authenticated'
            });
            $routeProvider.when('/upload/rnc', {
                templateUrl: '/static/partials/uploadrnc.html',
                controller: 'uploadRNC',
                accessLevel: 'user',
                title: 'R9: Upload'
            });
            $routeProvider.when('/leaderboard/', {
                templateUrl: '/static/partials/leaderboard.html',
                controller: 'leaderboard',
                accessLevel: 'public',
                title: 'R9: Leaderboard'
            });
            $routeProvider.when('/analysis/:id', {
                templateUrl: '/static/partials/dataanalysis.html',
                controller: 'dataanalysis',
                accessLevel: 'user',
                title: 'R9: Data Analysis'
            });
            $routeProvider.when('/admin/', {
                templateUrl: '/static/partials/admin.html',
                controller: 'admin',
                accessLevel: 'user',
                title: 'R9: Administrative Tasks'
            });


            // Pages
            $routeProvider.when('/page/404', {
                templateUrl: '/static/partials/page/404.html',
                accessLevel: 'public',
                title: 'R9: 404'
            });
            $routeProvider.when('/page/about', {
                templateUrl: '/static/partials/page/about.html',
                accessLevel: 'public',
                title: 'R9: About'
            });
            $routeProvider.when('/page/jobs', {
                templateUrl: '/static/partials/page/jobs.html',
                accessLevel: 'public',
                title: 'R9: Jobs'
            });
            $routeProvider.when('/page/monitor', {
                templateUrl: '/static/partials/page/monitor.html',
                accessLevel: 'admin',
                title: 'R9: Admin'
            });
            $routeProvider.when('/page/team', {
                templateUrl: '/static/partials/page/team.html',
                accessLevel: 'public',
                title: 'R9: Team'
            });
            $routeProvider.when('/page/uploadrnc', {
                templateUrl: '/static/partials/page/uploadrnc.html',
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
                if ($rootScope.current.user === null && nextLoc.accessLevel !== 'public') {
                    // Attempting to access a protected page.
                    $location.search('attemptUrl', encodeURIComponent($location.absUrl()));
                    $location.path('/page/unauthenticated');
                }
            });

            // Set page title
            $rootScope.$on('$routeChangeSuccess', function (event, currentRoute, previousRoute) {
                console.log('Setting title: ' + currentRoute.title);
                $rootScope.pageTitle = currentRoute.title;
            });
        });
})();

