angular
    .module('redComponents.map', [
        'leaflet-directive',
        'lodash'
    ])
    .directive('map', function () {
        return {
            restrict: 'E',
            scope: {
                panel: '=',
                /** Format:
                 * array of objects:
                 * {
                 *  startTime:
                 *  endTime:
                 * }
                 *
                 */
                highlights: '=',


                /** Compile time literals.
                 * These are not watched! Must be built in.
                 */

                /** The string true or false
                 */
                controls: '@',

                /** The string true or false
                 */
                interactive: '@'
            },
            templateUrl: '/components/map/map.html',
            controller: function ($scope, _) {


                $scope.$watchCollection('options', function () {
                    $scope.map.defaults = {
                        scrollWheelZoom: $scope.options && _.has($scope.options, 'mouse') ?
                            $scope.options.mouse : true,
                        dragging: $scope.options && _.has($scope.options, 'mouse') ?
                            $scope.options.mouse : true,
                        zoomControl: $scope.options && _.has($scope.options, 'controls') ?
                            $scope.options.controls : true
                    };
                });

                var defaultLayerOptions = {
                    maxZoom: 21,
                    maxNativeZoom: 18
                };

                $scope.map = {
                    markers: {},
                    paths: {},
                    center: {},
                    bounds: {},
                    defaults: {
                        scrollWheelZoom: $scope.interactive === 'true',
                        dragging: $scope.interactive === 'true',
                        zoomControl: $scope.controls === 'true'
                    },
                    layers: {
                        baselayers: angular.extend({
                            ThunderforestOutdoors: {
                                url: 'http://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png',
                                type: 'xyz',
                                name: 'Thunderforest Outdoors',
                                layerParams: {},
                                layerOptions: defaultLayerOptions
                            }
                        }, $scope.controls === 'true' ? { // The layers control only shows if we have multiple layers.
                            ThunderforestLandscape: {
                                url: 'http://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png',
                                type: 'xyz',
                                name: 'Thunderforest Landscape',
                                layerParams: {},
                                layerOptions: defaultLayerOptions
                            },
                            OpenTopoMap: {
                                url: 'http://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png',
                                type: 'xyz',
                                name: 'Open Topo Map Hydda',
                                layerParams: {},
                                layerOptions: defaultLayerOptions
                            },
                            OpenStreetMap: {
                                name: "OpenStreetMap",
                                url: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                                type: "xyz",
                                layerParams: {},
                                layerOptions: defaultLayerOptions
                            },
                            MapQuestOpenAerial: {
                                url: 'http://otile1.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg',
                                name: 'MapQuestOpen Aerial',
                                layerParams: {},
                                type: 'xyz',
                                layerOptions: defaultLayerOptions
                                // attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; ' +
                                // 'Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
                            }
                        } : {})
                    }
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


                function createEdges(panel, highlights) {

                    var edges = [];

                    var lastValidPoint = null;
                    var lastPointValid = true; // The first point is always valid (true)

                    // TODO: Correctly handle (reduce) overlapping highlights.
                    var sortedHighlights = _.sortBy(highlights, function (highlight) {
                        return highlight.startTime;
                    });


                    var currentHighlight = sortedHighlights[0];
                    sortedHighlights = _.rest(sortedHighlights);

                    for (var i = 0; i < panel['gps:longitude'].length; i++) {
                        var latitude = panel['gps:latitude'][i];
                        var longitude = panel['gps:longitude'][i];
                        var time = panel.time[i];

                        if (isValid(latitude, longitude)) {
                            var highlight = null;


                            // First, update currentHighlight so we don't have to search through the whole list.
                            while (sortedHighlights &&
                            currentHighlight &&
                            currentHighlight.endTime < time) {
                                // We can safely discard highlights whose time has already passed.
                                currentHighlight = sortedHighlights[0];
                                sortedHighlights = _.rest(sortedHighlights);
                            }

                            // Do we have highlights to use?
                            // Check if the highlight applies to this point


                            if (currentHighlight &&
                                currentHighlight.startTime <= time &&
                                time <= currentHighlight.endTime) {
                                highlight = 'Wave';
                            }


                            var currentPoint = {
                                lat: latitude,
                                lng: longitude,
                                time: time
                            };

                            if (lastValidPoint !== null) {
                                // not first point
                                edges.push({
                                    p0: lastValidPoint,
                                    p1: currentPoint,
                                    valid: lastPointValid,
                                    highlight: highlight
                                });
                            }

                            lastValidPoint = currentPoint;
                            lastPointValid = true;
                        } else {
                            lastPointValid = false;
                        }
                    }

                    return edges;
                }

                function edgesToPaths(edges) {
                    var paths = [];
                    var workingPath = null;
                    var previousEdge;

                    _.each(edges, function (edge) {
                        if (workingPath === null) {
                            workingPath = {
                                valid: edge.valid,
                                highlight: edge.highlight,
                                points: [
                                    edge.p0,
                                    edge.p1
                                ]
                            };
                        } else {
                            if (previousEdge.valid !== edge.valid
                                || previousEdge.highlight !== edge.highlight) {
                                // Are we still on the same "type" of edge?
                                // If not:
                                paths.push(workingPath);
                                workingPath = {
                                    valid: edge.valid,
                                    highlight: edge.highlight,
                                    points: [
                                        edge.p0,
                                        edge.p1
                                    ]
                                };
                            } else {
                                // We're working with the same "type", so just add the second point
                                // Note: p0 is the same as previous p1.
                                workingPath.points.push(edge.p1);
                            }
                        }

                        previousEdge = edge;
                    });


                    paths.push(workingPath); // Clean up last path

                    return paths;
                }

                /**
                 *
                 * @param {Object} path
                 * @param {Boolean} highlightsAvailable
                 * @returns {{className: string, latlngs: Array}}
                 */
                function convertToLeafletPath(path, highlightsAvailable) {
                    return {
                        className: (path.valid ? 'valid' : 'invalid') + ' ' +
                        (path.highlight !== null ? path.highlight : 'default') +
                        (highlightsAvailable ? '' : ' unhighlight'),
                        latlngs: path.points
                    };
                }

                /**
                 *
                 * @param {Object} markers - An object to store markers into
                 * @param {Object} leafletPaths - An object to store leafletPaths into
                 * @param {Object} bounds - A bounds object (see boundsConstructor)
                 * @param {Object} panel - Raw Panel data (object of arrays)
                 * @param {Array|Object} highlights -
                 */
                function createLeafletPath(markers, leafletPaths, bounds, panel, highlights) {
                    // Leaflet (-angular?) needs unique ids. We don't really care about them...
                    var minimalId = 'hello' + _.random(0, 999999);

                    var edges = createEdges(panel, highlights);

                    var paths = edgesToPaths(edges);

                    _.each(paths, function (path, index) {
                        leafletPaths[minimalId + '____' + index] = convertToLeafletPath(path, _.isUndefined(highlights));
                    });

                    _.each(edges, function (edge) {
                        bounds.add(edge.p0.lat, edge.p0.lng);
                    });
                    bounds.add(_.last(edges).p1.lat, _.last(edges).p1.lng);


                    markers[minimalId + '___start'] = {
                        message: 'start',
                        lat: edges[0].p0.lat,
                        lng: edges[0].p0.lng,
                        icon: startIcon
                    };

                    markers[minimalId + '___end'] = {
                        message: 'end',
                        lat: _.last(edges).p1.lat,
                        lng: _.last(edges).p1.lng,
                        icon: stopIcon
                    };
                }

                function createMap() {
                    if (_.isObject($scope.panel)) {
                        var bounds = boundsConstructor();
                        $scope.map.markers = {};
                        $scope.map.paths = {};
                        createLeafletPath($scope.map.markers, $scope.map.paths, bounds, $scope.panel, $scope.highlights);
                        $scope.map.bounds = bounds.get();
                    }
                }

                $scope.$watch('panel', createMap);
                createMap();

            }
        };
    });
