angular
    .module('redApp.search', [
        'ngRoute',
        'lodash',
        'redComponents.search.dataset',
        'redComponents.search.event',
        'redComponents.resourceList',
        'redComponents.resourceList',
        'redComponents.userInput'
    ])
    .config(function ($routeProvider) {
        $routeProvider.when('/dataset/', {
            templateUrl: '/my-client/search/search_dataset.html',
            css: '/my-client/search/search_dataset.css',
            controller: 'SearchController',
            accessLevel: 'basic',
            title: 'R9: Dataset Search'
        });
        $routeProvider.when('/event/', {
            templateUrl: '/my-client/search/search_event.html',
            controller: 'SearchController',
            accessLevel: 'basic',
            title: 'R9: Event Search'
        });
        $routeProvider.when('/user/', {
            templateUrl: '/my-client/search/search_user.html',
            controller: 'SearchController',
            accessLevel: 'basic',
            title: 'R9: User Search'
        });
    })
    .controller('SearchController', function ($scope, $location, _) {
        $scope.query = $location.search();

        $scope.$watch('query', function (newValue, oldValue) {
            $location.url($location.path()); // Clear query string
            _.each(newValue, function (value, key) {
                $location.search(key, value);
            });
        });
    });