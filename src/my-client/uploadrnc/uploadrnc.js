angular
    .module('redApp.uploadRNC', [
        'lodash',
        'angularFileUpload',
        'redComponents.api',
        'redComponents.validFile'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('uploadRnc', {
            url: '/upload/rnc',
            templateUrl: '/my-client/uploadrnc/uploadrnc.html',
            controller: 'uploadRNCController',
            data: {
                css: '/my-client/uploadrnc/uploadrnc.css'
            },
            accessLevel: 'basic',
            title: 'R9: Upload'
        });
    })
    .controller('uploadRNCController',
    function ($scope, _, $upload, current, api) {
        $scope.users = [];
        $scope.uploadPercent = null;


        //$scope.upload = {};

        $scope.sportsList = api.sportsList;


        $scope.resultModel = {
            sport: 'none',
            title: '',
            user: current.user,
            tags: []
        };

        api.user.query({}, function (users) {
            $scope.users = users;
        });

        $scope.beginUpload = function () {
            $upload.upload({
                url: red9config.apiUrl + '/dataset/',
                method: 'POST',
                withCredentials: true,
                fields: {
                    sport: $scope.resultModel.sport,
                    title: $scope.resultModel.title,
                    userId: $scope.resultModel.user.id,
                    tags: _.pluck($scope.resultModel.tags, 'text')
                },
                file: $scope.file,
                fileFormDataName: 'rnc'
            }).progress(function (evt) {
                $scope.uploadPercent = parseInt(100.0 * evt.loaded / evt.total);
            }).success(function (data, status) {
                $scope.uploadPercent = 100;
                $scope.uploadDataset = data.data;
            }).error(function (data) {
                $scope.uploadError = data;
            });
        };

        $scope.onFileSelect = function ($files) {
            $scope.file = $files[0];
        };
    });