angular
    .module('redApp.dataset.media', [
        'redComponents.api',
        'redComponents.confirmDialog',
        'ui.bootstrap.showErrors'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('dataset.media', {
            url: '/media',
            templateUrl: '/my-client/dataset/media/media.html',
            controller: 'DatasetMediaController',
            accessLevel: 'basic',
            title: 'R9: Session Media'
        });
    })
    .controller('DatasetMediaController', function ($scope, api, dataset, confirmDialog) {

        console.dir(dataset);

        $scope.newVideo = {
            startTime: dataset.startTime // Set default.
        };

        $scope.addVideo = function (form) {

            $scope.$broadcast('show-errors-check-validity');

            if ($scope.newVideoForm.$valid) {
                console.log('Adding video');
                var newVideo = new api.video({
                    datasetId: dataset.id,
                    host: 'YouTube',
                    hostId: form.hostId,
                    startTime: form.startTime
                });
                newVideo.$save();
                dataset.videos.push(newVideo);
            }
        };

        $scope.deleteVideo = function (video) {
            confirmDialog({
                message: "You're about to delete this video. This is non-reversible.",
                confirm: function (confirmation) {
                    if (confirmation === false) {
                        return; // do nothing
                    }

                    (new api.video(video)).$delete();
                    dataset.videos.splice(dataset.videos.indexOf(video), 1);
                },
                cancel: function () {
                }
            })();
        };
    });