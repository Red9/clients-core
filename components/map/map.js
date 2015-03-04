angular
    .module('redComponents.map', [
        'leaflet-directive',
        'lodash'
    ])
    .directive('map', function () {
        return {
            restrict: 'E',
            scope: {
                resource: '='
            },
            templateUrl: '/components/map/map.html',
            controller: function ($scope, _) {
                $scope.map = {
                    markers: {},
                    paths: {},
                    center: {},
                    bounds: {},
                    defaults: {
                        scrollWheelZoom: false,
                        dragging: false
                    },
                    layers: {
                        baselayers: {
                            ThunderforestLandscape: {
                                url: 'http://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png',
                                type: 'xyz',
                                name: 'Thunderforest Landscape',
                                layerParams: {},
                                layerOptions: {
                                    maxZoom: 21,
                                    maxNativeZoom: 18
                                }
                            },
                            ThunderforestOutdoors: {
                                url: 'http://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png',
                                type: 'xyz',
                                name: 'Thunderforest Outdoors',
                                layerParams: {},
                                layerOptions: {}
                            },
                            "osm": {
                                "name": "OpenStreetMap",
                                "url": "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                                "type": "xyz",
                                "layerParams": {},
                                "layerOptions": {}
                            },
                            MapQuestOpenAerial: {
                                url: 'http://otile1.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg',
                                name: 'MapQuestOpen Aerial',
                                layerParams: {},
                                type: 'xyz',
                                layerOptions: {
                                    attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; ' +
                                    'Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
                                }
                            }
                        }
                    }
                };

                var weight = {
                    valid: 3,
                    invalid: 2
                };
                var color = {
                    valid: '#559141',
                    invalid: '#C2C2C2'
                };
                var startIcon = {
                    iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/go.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, 0]
                };

                var stopIcon = {
                    iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/red-square.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, 0]
                };


                function isValid(latitude, longitude) {
                    return !_.isNull(latitude) && !_.isNull(longitude);
                }

                function boundsConstructor() {
                    var minimumLatitude = Number.MAX_VALUE;
                    var maximumLatitude = -Number.MAX_VALUE;
                    var minimumLongitude = Number.MAX_VALUE;
                    var maximumLongitude = -Number.MAX_VALUE;

                    var result = {
                        add: function (latitude, longitude) {
                            if (latitude > maximumLatitude) {
                                maximumLatitude = latitude;
                            }
                            if (latitude < minimumLatitude) {
                                minimumLatitude = latitude;
                            }

                            if (longitude > maximumLongitude) {
                                maximumLongitude = longitude;
                            }
                            if (longitude < minimumLongitude) {
                                minimumLongitude = longitude;
                            }
                        },
                        get: function () {
                            return {
                                southWest: {
                                    lat: minimumLatitude,
                                    lng: minimumLongitude
                                },
                                northEast: {
                                    lat: maximumLatitude,
                                    lng: maximumLongitude
                                }
                            };
                        }
                    };
                    return result;
                }

                function createLeafletPath(markers, paths, bounds, resource) {
                    var minimalId = 'hello' + resource.id;


                    var leafletPoints = [];
                    var lastValidPoint;


                    for (var i = 0; i < resource.panel.panel['gps:longitude'].length; i++) {
                        var latitude = resource.panel.panel['gps:latitude'][i];
                        var longitude = resource.panel.panel['gps:longitude'][i];


                        //console.log('longitude: ' + resource.panel.panel['gps:longitude'][i]);

                        if (isValid(latitude, longitude)) {
                            bounds.add(latitude, longitude);

                            var currentPoint = {
                                lat: latitude,
                                lng: longitude
                            };

                            if (leafletPoints.length === 0) {
                                if (_.isUndefined(lastValidPoint)) {
                                    // Very first valid point.
                                    markers[minimalId + '___' + i] = {
                                        message: 'start',
                                        lat: currentPoint.lat,
                                        lng: currentPoint.lng,
                                        icon: startIcon
                                    };
                                } else {
                                    // Just comming off an invalid streak
                                    paths[minimalId + '___' + i] = {
                                        color: color.invalid,
                                        weight: weight.invalid,
                                        latlngs: [
                                            lastValidPoint,
                                            currentPoint
                                        ]
                                    };
                                }
                            }

                            leafletPoints.push(currentPoint);
                            lastValidPoint = currentPoint;
                        } else {
                            if (leafletPoints.length > 0) {
                                // If we've just come off a valid streak
                                paths[minimalId + '___' + i] = {
                                    color: color.valid,
                                    weight: weight.valid,
                                    latlngs: leafletPoints
                                };
                                leafletPoints = [];
                            }
                        }
                    }

                    if (leafletPoints.length > 1) {
                        // If we've just come off a valid streak
                        paths[minimalId + '___' + i] = {
                            color: color.valid,
                            weight: weight.valid,
                            latlngs: leafletPoints
                        };
                    }

                    if (!_.isUndefined(lastValidPoint)) {
                        markers[minimalId + '___' + i] = {
                            message: 'stop',
                            lat: lastValidPoint.lat,
                            lng: lastValidPoint.lng,
                            icon: stopIcon
                        };
                    }
                }

                if (_.isObject($scope.resource) && _.has($scope.resource, 'panel')) {
                    var bounds = boundsConstructor();
                    createLeafletPath($scope.map.markers, $scope.map.paths, bounds, $scope.resource);
                    $scope.map.bounds = bounds.get();
                }

                $scope.$watch('resource.panel', function (newValue) {
                    if (_.isObject($scope.resource) && _.has($scope.resource, 'panel')) {
                        var bounds = boundsConstructor();
                        createLeafletPath($scope.map.markers, $scope.map.paths, bounds, $scope.resource);
                        $scope.map.bounds = bounds.get();
                    }
                });

                //$scope.$watch('resource.event', function (newValue) {
                //    try {
                //        _.each($scope.resource.event, function (event) {
                //            var bounds = boundsConstructor();
                //            createLeafletPath($scope.map.markers, $scope.map.paths, bounds, event);
                //            $scope.map.bounds = bounds.get();
                //        });
                //    } catch (e) {
                //    }
                //}, true);
            }
        };
    });
