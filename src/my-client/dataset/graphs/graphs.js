angular
    .module('redApp.dataset.graphs', [
        'redComponents.api',
        'redComponents.visualizations.charts.timeseries',
        'redComponents.visualizations.video',
        'redComponents.visualizations.timeline',
        'redComponents.modals.createEvent',
        'redComponents.modals.setFilters',
        'redComponents.confirmDialog'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('dataset.graphs', {
            url: '/graphs?startTime&endTime',
            templateUrl: '/my-client/dataset/graphs/graphs.html',
            controller: 'DatasetGraphsController',
            accessLevel: 'basic',
            title: 'R9: Graphs',
            reloadOnSearch: false, // prevent ui-router from recreating the page when zooming aroundeventtimeline.js. Optimization.
            data: {
                css: '/my-client/dataset/graphs/graphs.css'
            },
            resolve: {
                filters: function () {
                    return {
                        acceleration: 1.0,
                        rotationrate: 1.0,
                        magneticfield: 1.0
                    };
                },
                panel: function ($stateParams, _, api, dataset, filters) {
                    // Ideally, we don't want to reload the panel. But there's the
                    // issue that the map on the summary page needs a high resolution
                    // version, and the graphs on this page bog down if they're
                    // given that high resolution.
                    if (_.isUndefined($stateParams.startTime)
                        && _.isUndefined($stateParams.endTime)) {
                        return dataset.panel;
                    } else {
                        return api.getPanel('dataset', dataset.id, {
                            startTime: _.isUndefined($stateParams.startTime) ? dataset.startTime : $stateParams.startTime,
                            endTime: _.isUndefined($stateParams.endTime) ? dataset.endTime : $stateParams.endTime,
                            filters: filters
                        }).then(function (response) {
                            return response.data;
                        });
                    }
                }
            }
        });
    })
    .controller('DatasetGraphsController', function ($scope, api, dataset, $stateParams, $state, $location, panel, filters, CreateEventModal, SetFiltersModal, confirmDialog) {
        $scope.$stateParams = $stateParams;

        $scope.slides = {
            hover: null,
            video: null
        };

        $scope.filters = filters;

        $scope.$watchCollection('filters', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                console.log('Filters changed, reloading panel');
                loadPanel($scope.viewModel.currentStartTime, $scope.viewModel.currentEndTime);
            }
        });

        $scope.setFilters = function () {
            SetFiltersModal({
                filters: $scope.filters,
                callback: function (filters) {
                    $scope.filters = angular.extend($scope.filters, filters);
                }
            });
        };


        function loadPanel(startTime, endTime) {
            if (_.isUndefined(startTime)
                && _.isUndefined(endTime)) {
                displayPanel(dataset.panel);
            } else {
                api.getPanel('dataset', dataset.id, {
                    startTime: _.isUndefined(startTime) ? dataset.startTime : startTime,
                    endTime: _.isUndefined(endTime) ? dataset.endTime : endTime,
                    filters: filters
                }).then(function (response) {
                    displayPanel(response.data);
                });
            }
        }

        $scope.pinVideoFrame = function (time) {
            $scope.$broadcast('video.sync.frame', time);
        };


        var eventTypeCache; // Small optimization to allow the user to create multiples in a row
        $scope.createEvent = function (a, b) {
            var startTime = a;
            var endTime = b;
            if (a > b) { // Are they backwards?
                startTime = b;
                endTime = a;
            }

            CreateEventModal({
                defaultType: eventTypeCache,
                datasetId: dataset.id,
                startTime: startTime.getTime(),
                endTime: endTime.getTime(),
                callback: function (event) {
                    dataset.events.push(event);
                    eventTypeCache = event.type;
                    $scope.slides.a = null;
                    $scope.slides.b = null;
                }
            });
        };

        $scope.deleteEvents = function () {
            var count = _.countBy(dataset.events, 'selected').true || 0;
            if (count !== 0) {
                confirmDialog({
                    message: 'You are about to delete ' + count + ' events.\nAre you sure?',
                    confirm: function () {
                        _.forEachRight(dataset.events, function (event, index) {
                            if (event.selected === true) {
                                (new api.event(event)).$delete();
                                dataset.events.splice(index, 1);
                            }
                        });
                    }
                });
            }
        };

        $scope.$on('zoom', function (event, parameters) {
            zoom(parameters.startTime, parameters.endTime);
        });


        function zoom(startTime, endTime) {
            // Reset slides if they're no longer visible.
            if ($scope.slides.a <= startTime || endTime <= $scope.slides.a) {
                $scope.slides.a = null;
            }
            if ($scope.slides.b <= startTime || endTime <= $scope.slides.b) {
                $scope.slides.b = null;
            }

            $location.search({startTime: startTime, endTime: endTime});
            loadPanel(startTime, endTime);
        }

        $scope.zoom = function (direction) {
            // Convenience handles
            var currentStartTime = $scope.viewModel.currentStartTime;
            var currentEndTime = $scope.viewModel.currentEndTime;

            // Current window width in time
            var currentDuration = currentEndTime - currentStartTime;

            var zoomInTime = Math.floor(currentDuration / 3);

            var startTime;
            var endTime;

            if (direction === 'markers') {
                if ($scope.slides.a && $scope.slides.b) {
                    startTime = $scope.slides.a.getTime(); // They're date objects...
                    endTime = $scope.slides.b.getTime();

                    if (startTime > endTime) { // In case the user put the markers backwards...
                        var temp = startTime;
                        startTime = endTime;
                        endTime = temp;
                    }
                } else {
                    return; // Do nothing if we don't have both.
                }

            } else if (direction === 'in') {

                startTime = currentStartTime + zoomInTime;
                endTime = currentEndTime - zoomInTime;

            } else if (direction === 'out') {
                startTime = currentStartTime - currentDuration;
                endTime = currentEndTime + currentDuration;
            } else if (direction === 'left') {
                // Have we hit the left "wall"?
                if (currentStartTime - zoomInTime < dataset.startTime) {
                    startTime = undefined;
                    endTime = dataset.endTime + zoomInTime;
                } else {
                    startTime = currentStartTime - zoomInTime;
                    endTime = undefined;
                }
            } else if (direction === 'right') {
                // Have we hit the right "wall"?
                if (currentEndTime + zoomInTime > dataset.endTime) {
                    startTime = dataset.endTime - zoomInTime;
                    endTime = dataset.endTime;
                } else {
                    startTime = currentStartTime + zoomInTime;
                    endTime = currentEndTime + zoomInTime;
                }
            } else if (direction === 'reset') {
                startTime = undefined;
                endTime = undefined;
            }

            zoom(startTime, endTime);
        };
        $scope.viewModel = {
            displayExtraGraphs: false
        };

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
                            label: 'kn',
                            values: {
                                gpsSpeed: newPanel.panel['gps:speed']
                            }
                        },
                        {
                            label: 'm/s^2',
                            values: {
                                accelerationX: newPanel.panel['acceleration:x'],
                                accelerationY: newPanel.panel['acceleration:y'],
                                accelerationZ: newPanel.panel['acceleration:z'],
                                accelerationMagnitude: newPanel.panel['acceleration:magnitude']
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
                            extra: true,
                            label: 'T',
                            values: {
                                magneticFieldX: newPanel.panel['magneticfield:x'],
                                magneticFieldY: newPanel.panel['magneticfield:y'],
                                magneticFieldZ: newPanel.panel['magneticfield:z']
                            }
                        },
                        {
                            extra: true,
                            label: 'satellites',
                            values: {
                                gpsSatellites: newPanel.panel['gps:satellites']
                            }
                        },
                        {
                            extra: true,
                            label: 'm',
                            values: {
                                gpsHdop: newPanel.panel['gps:hdop']
                            }
                        },
                        {
                            extra: true,
                            label: 'm',
                            values: {
                                gpsAltitude: newPanel.panel['gps:altitude']
                            }
                        }
                    ]
                });
        }

        displayPanel(panel);
    });