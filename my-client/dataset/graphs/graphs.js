angular
    .module('redApp.dataset.graphs', [
        'redComponents.api',
        'redComponents.visualizations.charts.timeseries',
        'redComponents.visualizations.video'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('dataset.graphs', {
            url: '/graphs?startTime&endTime',
            templateUrl: '/my-client/dataset/graphs/graphs.html',
            controller: 'DatasetGraphsController',
            accessLevel: 'basic',
            title: 'R9: Graphs',
            reloadOnSearch: false, // prevent ui-router from recreating the page. Optimization.
            resolve: {
                panel: function ($stateParams, _, api, dataset) {
                    if (_.isUndefined($stateParams.startTime)
                        && _.isUndefined($stateParams.endTime)) {
                        return dataset.panel;
                    } else {
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
        console.log('new graphs');
        $scope.$stateParams = $stateParams;

        $scope.slides = {
            hover: null,
            video: null
        };

        function loadPanel(startTime, endTime) {
            if (_.isUndefined(startTime)
                && _.isUndefined(endTime)) {
                displayPanel(dataset.panel);
            } else {
                api.getPanel('dataset', dataset.id, {
                    startTime: _.isUndefined(startTime) ? dataset.startTime : startTime,
                    endTime: _.isUndefined(endTime) ? dataset.endTime : endTime
                }).then(function (response) {
                    displayPanel(response.data);
                });
            }
        }

        $scope.pinVideoFrame = function (time) {
            $scope.$broadcast('video.sync.frame', time);
        };

        $scope.zoom = function (direction) {
            // Convenience handles
            var currentStartTime = $scope.viewModel.currentStartTime;
            var currentEndTime = $scope.viewModel.currentEndTime;

            // Current window width in time
            var currentDuration = currentEndTime - currentStartTime;

            var zoomInTime = Math.floor(currentDuration / 3);

            var result;

            if (direction === 'markers') {

                if ($scope.slides.a && $scope.slides.b) {
                    result = {
                        startTime: $scope.slides.a.getTime(), // They're date objects...
                        endTime: $scope.slides.b.getTime()
                    };

                    if (result.startTime > result.endTime) { // In case the user put the markers backwards...
                        var temp = result.startTime;
                        result.startTime = result.endTime;
                        result.endTime = temp;
                    }


                } else {
                    return; // Do nothing if we don't have both.
                }

            } else if (direction === 'in') {
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

            // Reset slides if they're no longer visible.
            if ($scope.slides.a <= result.startTime || result.endTime <= $scope.slides.a) {
                console.log('clear a');
                $scope.slides.a = null;
            }
            if ($scope.slides.b <= result.startTime || result.endTime <= $scope.slides.b) {
                console.log('clear b');
                $scope.slides.b = null;
            }

            $location.search(result);
            console.log('zoom!');
            loadPanel(result.startTime, result.endTime);

            //$state.go('.', result);
        };
        $scope.viewModel = {};


        function displayPanel(newPanel) {
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
    });