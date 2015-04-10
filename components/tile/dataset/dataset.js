angular
    .module('redComponents.tile.dataset', [
        'lodash'
    ])
    .directive('tileDataset', function () {
        return {
            restrict: 'E',
            scope: {
                dataset: '='
            },
            templateUrl: '/components/tile/dataset/dataset.html',
            controller: function ($scope, _) {

                console.dir($scope.dataset);

                try {
                    // We may not have any lat/long information, but give it our
                    // best shot.
                    var lat = $scope.dataset.boundingCircle.latitude;
                    var lng = $scope.dataset.boundingCircle.longitude;
                    $scope.map = {
                        layers: {
                            baselayers: {
                                ThunderforestLandscape: {
                                    url: 'http://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png',
                                    type: 'xyz',
                                    name: 'Thunderforest Landscape',
                                    layerParams: {},
                                    layerOptions: {}
                                }
                            }
                        },
                        defaults: {
                            zoomControl: false,
                            scrollWheelZoom: false,
                            dragging: false
                        },
                        center: {
                            lat: lat,
                            lng: lng,
                            zoom: 12
                        },
                        markers: {
                            center: {
                                lat: lat,
                                lng: lng
                            }
                        }
                    };
                } catch (e) {
                }
            }
        };
    });