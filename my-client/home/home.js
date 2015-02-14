angular
    .module('redApp.home', [
        'ngRoute',
        'lodash'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('home', {
            url: '/',
            templateUrl: '/my-client/home/home.html',
            data: {
                css: '/my-client/home/home.css'
            },
            controller: 'homeController',
            accessLevel: 'basic',
            title: 'Red9: Measure Up to You'
        });
    })
    .controller('homeController',
    function ($scope, _) {
        $scope.myInterval = 1000;

        var instagramList = [
            'u1BeCCTDVE',
            'uN3fY_zDdF',
            'uqK1eszDRE',
            't8vBXQTDZZ',
            'tvcuznzDdO',
            'uGJeQSTDXI'
        ];

        $scope.slides = _.map(instagramList, function (id) {
            return {
                image: 'http://instagram.com/p/' + id + '/media/?size=l',
                active: false
            };
        });
        $scope.slides[0].active = true;


    });