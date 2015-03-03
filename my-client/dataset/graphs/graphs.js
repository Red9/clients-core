angular
    .module('redApp.dataset.graphs', [
        'redComponents.api'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('dataset.graphs', {
            url: '/graphs?startTime&endTime',
            templateUrl: '/my-client/dataset/graphs/graphs.html',
            controller: 'DatasetGraphsController',
            accessLevel: 'basic',
            title: 'R9: Graphs',
            resolve: {
                panel: function ($stateParams, _, api, dataset) {
                    console.log('$stateParams');
                    console.dir($stateParams);

                    if (_.isUndefined($stateParams.startTime)
                        && _.isUndefined($stateParams.endTime)) {
                        console.log('graphs: using provided dataset');
                        return dataset.panel;
                    } else {
                        console.log('graphs: getting new panel');
                        return api.getPanel('dataset', dataset.id, {
                            startTime: _.isUndefined($stateParams.startTime) ? dataset.startTime : $stateParams.startTime,
                            endTime: _.isUndefined($stateParams.endTime) ? dataset.endTime : $stateParams.endTime
                        }).then(function (response) {
                            return response.data;
                        });
                    }
                }
            }
        });
    })
    .controller('DatasetGraphsController', function ($scope, api, dataset, $stateParams, $state, $location, panel) {
        $scope.$stateParams = $stateParams;

        $scope.hover = {
            time: null,
            index: null
        };

        $scope.zoom = function (direction) {
            console.log('Zoom ' + direction);

            // Convenience handles
            var currentStartTime = $scope.viewModel.currentStartTime;
            var currentEndTime = $scope.viewModel.currentEndTime;

            // Current window width in time
            var currentDuration = currentEndTime - currentStartTime;


            console.log(currentStartTime + ' --- ' + currentEndTime + ' *** ' + currentDuration);

            var zoomInTime = Math.floor(currentDuration / 3);

            var result;

            if (direction === 'in') {
                result = {
                    startTime: currentStartTime + zoomInTime,
                    endTime: currentEndTime - zoomInTime
                };
            } else if (direction === 'out') {
                result = {
                    startTime: currentStartTime - currentDuration,
                    endTime: currentEndTime + currentDuration
                };
            } else if (direction === 'left') {
                // Have we hit the left "wall"?
                if (currentStartTime - zoomInTime < dataset.startTime) {
                    console.log('hit left wall');
                    result = {
                        startTime: undefined,
                        endTime: dataset.endTime + zoomInTime
                    };
                } else {
                    console.log('shifting left');
                    result = {
                        startTime: currentStartTime - zoomInTime,
                        endTime: undefined
                    };
                }
            } else if (direction === 'right') {
                // Have we hit the right "wall"?
                if (currentEndTime + zoomInTime > dataset.endTime) {
                    console.log('hit right wall');
                    result = {
                        startTime: dataset.endTime - zoomInTime,
                        endTime: dataset.endTime
                    };
                } else {
                    result = {
                        startTime: currentStartTime + zoomInTime,
                        endTime: currentEndTime + zoomInTime
                    };
                }
            } else if (direction === 'reset') {
                result = {
                    startTime: undefined,
                    endTime: undefined
                };
            }

            $state.go('.', result);
        };
        $scope.viewModel = {};


        function displayPanel(newPanel) {
            console.log('newPanel!');
            angular.extend($scope.viewModel,
                {
                    hoverTime: null,
                    panel: newPanel,
                    currentStartTime: newPanel.panel.time[0],
                    currentEndTime: newPanel.panel.time
                        [newPanel.panel.time.length - 1],
                    graphSeries: [
                        {
                            label: 'm/s^2',
                            values: {
                                accelerationX: newPanel.panel['acceleration:x'],
                                accelerationY: newPanel.panel['acceleration:y'],
                                accelerationZ: newPanel.panel['acceleration:z']
                            }
                        },
                        {
                            label: 'rad/s',
                            values: {
                                rotationRateX: newPanel.panel['rotationrate:x'],
                                rotationRateY: newPanel.panel['rotationrate:y'],
                                rotationRateZ: newPanel.panel['rotationrate:z']
                            }
                        },
                        {
                            label: 'T',
                            values: {
                                magneticFieldX: newPanel.panel['magneticfield:x'],
                                magneticFieldY: newPanel.panel['magneticfield:y'],
                                magneticFieldZ: newPanel.panel['magneticfield:z']
                            }
                        }

                    ]
                });
        }

        displayPanel(panel);


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
    });