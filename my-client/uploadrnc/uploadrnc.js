angular
    .module('redApp.uploadRNC', [
        'ngRoute',
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
    function ($scope, $upload, current, api) {
        $scope.users = [];
        $scope.uploadPercent = 0;
        $scope.upload = {};

        $scope.user = current.user;

        api.user.query({}, function (users) {
            $scope.users = users;
        });

        $scope.beginUpload = function () {
            $upload.upload({
                url: red9config.apiUrl + '/dataset/',
                method: 'POST',
                withCredentials: true,
                data: {
                    userId: $scope.user.id,
                    title: $scope.title
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
            console.dir($files);
            $scope.file = $files[0];
        };
    });