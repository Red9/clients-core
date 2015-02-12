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
            'ngTagsInput',
            'duScroll',

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
            'redComponents.authenticate',

            'redComponents.head' // Is this the correct use of this directive?
        ])
        .value('duScrollOffset', 50) // Compensate for the navbar
        .controller('pageController', function ($scope, authenticate) {
            $scope.logout = authenticate.logout;
        })
        .config(function ($routeProvider, $locationProvider, $urlRouterProvider) {

            // Pages
            //$routeProvider.when('/page/404', {
            //    templateUrl: '/my-client/pages/404.html',
            //    accessLevel: 'public',
            //    title: 'R9: 404'
            //});
            //$routeProvider.when('/page/about', {
            //    templateUrl: '/my-client/pages/about.html',
            //    accessLevel: 'public',
            //    title: 'R9: About'
            //});
            //$routeProvider.when('/page/jobs', {
            //    templateUrl: '/my-client/pages/jobs.html',
            //    accessLevel: 'public',
            //    title: 'R9: Jobs'
            //});
            //$routeProvider.when('/page/monitor', {
            //    templateUrl: '/my-client/pages/monitor.html',
            //    accessLevel: 'admin',
            //    title: 'R9: Admin'
            //});
            //$routeProvider.when('/page/team', {
            //    templateUrl: '/my-client/pages/team.html',
            //    accessLevel: 'public',
            //    title: 'R9: Team'
            //});
            //$routeProvider.when('/page/uploadrnc', {
            //    templateUrl: '/my-client/pages/uploadrnc.html',
            //    accessLevel: 'public',
            //    title: 'R9: Upload RNC'
            //});
            //
            //$routeProvider.otherwise({
            //    redirectTo: '/page/404'
            //});

            $locationProvider.html5Mode(true);

            // For any unmatched url, redirect to /state1
            //$urlRouterProvider.otherwise("/state1");
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
                    }
                    /*else if ($rootScope.current.user.scope.indexOf(nextLoc.accessLevel) === -1) {
                     // Not enough permissions
                     alert("You don't have sufficient permissions to access that.");
                     $location.search('attemptUrl', encodeURIComponent($location.absUrl()));
                     $location.path('/page/unauthenticated');
                     }*/
                }
            });

            // Set page title
            $rootScope.$on('$routeChangeSuccess', function (event, currentRoute, previousRoute) {
                $rootScope.pageTitle = currentRoute.title;
            });
        });
})();

