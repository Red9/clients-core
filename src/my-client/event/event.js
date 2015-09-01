angular
    .module('redApp.event', [
        'redComponents.api',
        'redComponents.visualizations.maps.local'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('event', {
            url: '/event/{id}',
            templateUrl: '/my-client/event/event.html',
            controller: 'eventController',
            accessLevel: 'basic',
            title: 'Event',
            resolve: {
                event: function (api, $stateParams) {
                    var event;
                    return api.event.get({id: $stateParams.id}).$promise
                        .then(function (event_) {
                            event = event_;
                            return event.getPanel();
                        }).then(function () {
                            return event;
                        });
                }
            },
            data: {
                //css: '/my-client/event/event.css'
            }
        });
    })
    .controller('eventController', function ($scope, event) {
        $scope.resource = event;

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

        $scope.graphSeries = [
            {
                label: 'm/s^2',
                values: {
                    accelerationX: event.panel.panel['acceleration:x'],
                    accelerationY: event.panel.panel['acceleration:y'],
                    accelerationZ: event.panel.panel['acceleration:z']
                }
            },
            {
                label: 'rad/s',
                values: {
                    rotationRateX: event.panel.panel['rotationrate:x'],
                    rotationRateY: event.panel.panel['rotationrate:y'],
                    rotationRateZ: event.panel.panel['rotationrate:z']
                }
            },
            {
                label: 'T',
                values: {
                    magneticFieldX: event.panel.panel['magneticfield:x'],
                    magneticFieldY: event.panel.panel['magneticfield:y'],
                    magneticFieldZ: event.panel.panel['magneticfield:z']
                }
            }
        ];
    });