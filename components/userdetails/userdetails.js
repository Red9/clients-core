angular
    .module('redComponents.userDetails', [
        'redComponents.userInput',
        'redComponents.userInputImperial'
    ])
    .directive('userDetails', function () {
        return {
            restrict: 'E',
            templateUrl: '/components/userdetails/userdetails.html',
            controller: function ($scope) {
            }
        };
    });
