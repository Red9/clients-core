angular
    .module('redApp.svg', [
        'redComponents.api',
        'redComponents.visualizations.charts.timeseries',
        'lodash'
    ])
    .config(function ($stateProvider) {
        console.log('Setting up state.');
        $stateProvider.state('svg', {
            url: '/svg/',
            templateUrl: '/my-client/svg/svg.html',
            controller: 'svgController',
            accessLevel: 'basic',
            title: 'svg test',
            resolve: {
                dataset: function (api) {
                    var dataset;
                    return api.dataset.get({id: 356}).$promise
                        .then(function (dataset_) {
                            dataset = dataset_;
                            return dataset.getPanel();
                        }).then(function () {
                            return dataset;
                        });
                }
            },
            data: {
                css: '/my-client/svg/svg.css'
            }
        });
    })
    .controller('svgController', function ($scope, _, dataset) {
        $scope.hover = {
            time: null,
            index: null
        };
        $scope.viewModel = {
            hoverTime: null
        };
        $scope.$watch('hover.time', function (time) {
            $scope.viewModel.hoverTime =
                time ?
                _.padLeft(time.getFullYear(), 4, '0') + '-' +
                _.padLeft(time.getMonth() + 1, 2, '0') + '-' +
                _.padLeft(time.getDate() + 1, 2, '0') + '  ' +
                _.padLeft(time.getHours(), 2, '0') + ':' +
                _.padLeft(time.getMinutes(), 2, '0') + ':' +
                _.padLeft(time.getSeconds(), 2, '0') + '.' +
                _.padLeft(time.getMilliseconds(), 3, '0') :
                    null;
        });

        $scope.dataset = dataset;

        $scope.graphSeries = [
            {
                label: 'm/s^2',
                values: {
                    accelerationX: dataset.panel.panel['acceleration:x'],
                    accelerationY: dataset.panel.panel['acceleration:y'],
                    accelerationZ: dataset.panel.panel['acceleration:z']
                }
            },
            {
                label: 'rad/s',
                values: {
                    rotationRateX: dataset.panel.panel['rotationrate:x'],
                    rotationRateY: dataset.panel.panel['rotationrate:y'],
                    rotationRateZ: dataset.panel.panel['rotationrate:z']
                }
            },
            {
                label: 'T',
                values: {
                    magneticFieldX: dataset.panel.panel['magneticfield:x'],
                    magneticFieldY: dataset.panel.panel['magneticfield:y'],
                    magneticFieldZ: dataset.panel.panel['magneticfield:z']
                }
            }
        ];
    });
