(function () {
    'use strict';


    /* Directives */
    angular.module('redApp.directives', [])
        .directive('resourceList', function () {
            return {
                restrict: 'E',
                templateUrl: function (element, attributes) {
                    return '/static/partials/directives/' + attributes.resourceType + 'list.html';
                },
                scope: {
                    resourceFilters: '=',
                    resourceType: '@'
                },
                controller: function ($scope, $location, $q, _, api, confirmDialog) {
                    $scope.resourceList = null;
                    $scope.resultDisplay = 'table';

                    $scope.map = {
                        markers: {},
                        layers: {
                            baselayers: {
                                ThunderforestLandscape: {
                                    url: 'http://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png',
                                    type: 'xyz',
                                    name: 'Thunderforest Landscape',
                                    layerParams: {},
                                    layerOptions: {}
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
                            },
                            overlays: {
                                Locations: {
                                    "name": "Locations",
                                    "type": "markercluster",
                                    "visible": true,
                                    "layerOptions": {
                                        chunkedLoading: true,
                                        showCoverageOnHover: false,
                                        removeOutsideVisibleBounds: true,
                                        maxClusterRadius: 30
                                    }
                                }
                            }
                        },
                        bounds: {},
                        center: {}
                    };

                    var parameters = {
                        dataset: {
                            //fields: 'title,id,createdAt,startTime,endTime,owner,count,tags,boundingCircle,owner(displayName,id,picture)',
                            //part: 'title,id,createTime,startTime,endTime,owner.id,owner.displayName,count',
                            'expand': ['user']
                        },
                        event: {
                            //fields: 'type,id,startTime,endTime,datasetId,boundingCircle'
                        },
                        user: {}

                    };

                    var sortBy = {
                        dataset: function (dataset) {
                            return -dataset.createdAt;
                        },
                        event: function (event) {
                            return -event.startTime;
                        },
                        user: function (user) {
                            return user.displayName;
                        }
                    };


                    // Creates a page of resources suitable for display. This
                    // page is just a shallow copy, so no need to use it for
                    // anything but display.
                    function extractResourcePage() {

                        if ($scope.resourceList) {
                            var page = $scope.resourcePages.currentPage;
                            var ipp = $scope.resourcePages.itemsPerPage;

                            $scope.resourcePage = $scope.resourceList.slice(
                                (page - 1) * ipp,
                                page * ipp
                            );
                        } else {
                            $scope.resourcePage = null;
                        }
                    }

                    function createMapMarkers(list) {
                        var minimumLatitude = Number.MAX_VALUE;
                        var maximumLatitude = -Number.MAX_VALUE;
                        var minimumLongitude = Number.MAX_VALUE;
                        var maximumLongitude = -Number.MAX_VALUE;

                        $scope.map.markers = _.chain(list).filter(function (item) {
                            return _.has(item, 'boundingCircle')
                                && _.isObject(item.boundingCircle)
                                && _.has(item.boundingCircle, 'latitude')
                                && _.has(item.boundingCircle, 'longitude');
                        }).reduce(function (memo, item) {
                            var key = item.id;
                            var message = "";
                            if (_.has(item, 'title')) {
                                message = item.title;
                            } else if (_.has(item, 'type')) {
                                message = item.type;
                            }

                            memo[key] = {
                                layer: "Locations",
                                message: message,
                                lat: item.boundingCircle.latitude,
                                lng: item.boundingCircle.longitude
                            };

                            if (item.boundingCircle.latitude > maximumLatitude) {
                                maximumLatitude = item.boundingCircle.latitude;
                            }
                            if (item.boundingCircle.latitude < minimumLatitude) {
                                minimumLatitude = item.boundingCircle.latitude;
                            }

                            if (item.boundingCircle.longitude > maximumLongitude) {
                                maximumLongitude = item.boundingCircle.longitude;
                            }
                            if (item.boundingCircle.longitude < minimumLongitude) {
                                minimumLongitude = item.boundingCircle.longitude;
                            }


                            return memo;
                        }, {}).value();

                        $scope.map.bounds = {
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

                    $scope.$watch('resourcePages.currentPage', extractResourcePage);
                    $scope.$watch('resourcePages.itemsPerPage', extractResourcePage);
                    $scope.$watchCollection('resourceList', extractResourcePage);

                    $scope.$watch('resourceFilters', function (newValue, oldValue) {
                        $scope.resourceList = null;  // Clear variable to indicate loading

                        api[$scope.resourceType].query(
                            angular.extend(parameters[$scope.resourceType], newValue),
                            function (data) {

                                // The currentPage set should be before the
                                // resourceList set. This will allow the change
                                // in the resourceList to initiate a change
                                // in the page
                                $scope.resourcePages.currentPage = 1;
                                $scope.resourceList = _.sortBy(data, sortBy[$scope.resourceType]);
                                $scope.resourceList.$meta = data.$meta; // Hack for now since _.sort strips the meta, and while we're still doing all this client side stuff.
                                createMapMarkers(data);
                            });
                    });

                    // Gets all the resources that have the selected option set.
                    function extractSelected(list) {
                        return _.filter(list, function (resource) {
                            return resource.selected;
                        });
                    }

                    $scope.deleteSelected = function (list) {
                        var deleteList = extractSelected(list);

                        if (deleteList.length === 0) {
                            return; // Do nothing if nothing is selected.
                        }

                        confirmDialog({
                            message: "You're about to delete " + deleteList.length + " " + $scope.resourceType + "s. This is non-reversible.",
                            confirm: function (confirmation) {
                                if (confirmation === false) {
                                    return; // do nothing
                                }

                                _.each(deleteList, function (item) {
                                    api[$scope.resourceType].delete({id: item.id}, function () {
                                        list.splice(_.indexOf(list, item), 1);
                                    });
                                });
                            },
                            cancel: function () {
                            }
                        })();
                    };

                    $scope.resourcePages = {
                        itemsPerPage: 25,
                        maxSize: 5, // The maximum number of page numbers to display.
                        currentPage: 1
                    };

                    if ($scope.resourceType === 'dataset') {
                        $scope.searchEvents = function (datasetList) {

                            var selectedList = extractSelected(datasetList);
                            if (selectedList.length === 0) {
                                return; // Do nothing if nothing is selected
                            }

                            var url = '/event/?datasetId=' + _.pluck(selectedList, 'id').join(',');

                            $location.url(url);
                        };
                    } else if ($scope.resourceType === 'event') {
                        $scope.datasetGroups = null;
                        $scope.$watchCollection('resourceList', function (newValue) {
                            $scope.datasetGroups = _.chain(newValue)
                                .groupBy('datasetId')
                                .reduce(function (memo, eventList, datasetId, index) {
                                    if (memo[memo.length - 1].length === 3) {
                                        memo.push([]);
                                    }

                                    var sumDuration = 0;

                                    var groupedEventList = _.chain(eventList)
                                        .groupBy('type')
                                        .map(function (events, type) {
                                            var duration = _.reduce(events, function (memo, event) {
                                                memo += (event.endTime - event.startTime);
                                                return memo;
                                            }, 0);

                                            sumDuration += duration;

                                            return {
                                                type: type,
                                                duration: duration,
                                                count: events.length
                                            };
                                        })
                                        .map(function (eventSummary, type) {
                                            eventSummary.percent = (eventSummary.duration / sumDuration) * 100;
                                            eventSummary.percentString = eventSummary.percent + '%';
                                            return eventSummary;
                                        })
                                        .sortBy(function (eventSummary) {
                                            return eventSummary.type;
                                        })
                                        .value();


                                    memo[memo.length - 1].push({
                                        datasetId: datasetId,
                                        eventList: groupedEventList
                                    });
                                    return memo;
                                }, [[]])
                                .value();
                        });
                    }
                }
            };
        })
        .directive('eventSearch', function () {
            return {
                restrict: 'E',
                scope: {
                    query: '='
                },
                templateUrl: '/static/partials/directives/eventsearch.html',
                controller: function ($scope, _, api) {
                    $scope.eventTypes = _.pluck(api.event.types, 'name');
                    $scope.typeList = [];
                    $scope.typeInput = '';

                    $scope.datasetList = [];


                    if (_.has($scope.query, 'type')) {
                        $scope.typeList = $scope.query.type.split(',');
                    }

                    if (_.has($scope.query, 'datasetId')) {
                        api.dataset.query({idList: $scope.query.datasetId}, function (results) {
                            $scope.datasetList = results;
                        });
                    }

                    $scope.addType = function () {
                        if ($scope.typeList.indexOf($scope.typeInput) === -1) {
                            $scope.typeList.push($scope.typeInput);
                        }
                        $scope.typeInput = '';
                    };

                    $scope.startSearch = function () {
                        var result = {};
                        if ($scope.typeList.length > 0) {
                            result.type = $scope.typeList.join(',');
                        }

                        if ($scope.datasetList.length > 0) {
                            result.datasetId = _.pluck($scope.datasetList, 'id').join(',');
                        }

                        $scope.query = result;
                    };
                }
            };
        })
        .directive('datasetSearch', function () {
            return {
                restrict: 'E',
                scope: {
                    query: '='
                },
                templateUrl: '/static/partials/directives/datasetsearch.html',
                controller: function ($scope, $location, _, api) {

                    // Working Variable
                    $scope.tagInput = '';

                    $scope.sports = api.sports;

                    // Search Query variables
                    if (_.has($scope.query, 'title')) {
                        $scope.searchTitle = $scope.query.title;
                    } else {
                        $scope.seachTitle = '';
                    }

                    if (_.has($scope.query, 'tags')) {
                        if (_.isArray($scope.query.tags)) {
                            // If there's a single element it will be passed as a single value.
                            $scope.tagList = $scope.query.tags;
                        } else {
                            $scope.tagList = [$scope.query.tags];
                        }
                    } else {
                        $scope.tagList = [];
                    }

                    if (_.has($scope.query, 'userId')) {
                        api.user.query({idList: $scope.query.userId}, function (results) {
                            $scope.userList = results;
                        });
                    }

                    $scope.userList = [];

                    function checkSportQuery() {
                        if (_.has($scope.query, 'sport')) {
                            // Todo: update this section with _.find when we upgrade
                            // to lodash.
                            var index = _.pluck(api.sports, 'name')
                                .indexOf($scope.query.sport);
                            console.log('Index: ' + index);
                            console.dir(api.sports);
                            console.dir(_.pluck(api.sports, 'name'));
                            if (index > -1) {
                                $scope.sport = api.sports[index];
                                console.log('$scope.sport: ' + $scope.sport);
                            }
                        }
                    }

                    // This is a bit of a hack, since on load sports (which is
                    // filled from the API) doesn't have anything. Then it does.
                    $scope.$watchCollection('sports', checkSportQuery);
                    checkSportQuery();

                    $scope.addTag = function () {
                        // Make sure that we only add new tags
                        if ($scope.tagList.indexOf($scope.tagInput) === -1) {
                            $scope.tagList.push($scope.tagInput);
                        }
                        // But clear input regardless.
                        $scope.tagInput = '';
                    };

                    $scope.startSearch = function () {
                        var result = {};

                        if ($scope.userList.length > 0) {
                            result.userId = _.pluck($scope.userList, 'id').join(',');
                        }

                        if ($scope.tagList.length > 0) {
                            result['tags[]'] = $scope.tagList;
                        }

                        console.log('$scope.searchTitle: ' + $scope.searchTitle);

                        if ($scope.searchTitle &&
                            $scope.searchTitle.length > 0) {
                            result.title = $scope.searchTitle;
                        }

                        console.log('$scope.sport: ' + $scope.sport);

                        if ($scope.sport) {
                            result.sport = $scope.sport.name;
                        }

                        $scope.query = result;
                    };
                }
            };
        })
        // Taken from here: http://stackoverflow.com/a/22795642/2557842
        .directive('validFile', function () {
            return {
                require: 'ngModel',
                link: function (scope, el, attrs, ngModel) {
                    el.bind('change', function () {
                        scope.$apply(function () {
                            ngModel.$setViewValue(el.val());
                            ngModel.$render();
                        });
                    });
                }
            };
        })
        .directive('keypressEnter', function () {
            // Taken from here: http://stackoverflow.com/a/17472118/2557842
            return function (scope, element, attrs) {
                element.bind("keydown keypress", function (event) {
                    if (event.which === 13) {
                        scope.$apply(function () {
                            scope.$eval(attrs.keypressEnter);
                        });

                        event.preventDefault();
                    }
                });
            };
        })
        .directive('userInput', function () {
            return {
                restrict: 'E',
                scope: {
                    selectedUser: '=?',
                    list: '=?',
                    placeholder: '@'
                },
                templateUrl: '/static/partials/directives/userinput.html',
                controller: function ($scope, api) {
                    $scope.users = [];

                    $scope.selected = $scope.selectedUser;

                    if (_.isUndefined($scope.selectedUser)) {
                        $scope.selectedUser = null;
                    }

                    $scope.$watch('selected', function (newValue, oldValue) {
                        if (_.isObject($scope.selected)) {  // Make sure that we've got an addition, not a clearing of the input
                            $scope.selectedUser = $scope.selected;

                            if (_.isArray($scope.list)  // Make sure that there is a list that we can add to
                                && $scope.list.indexOf($scope.selected) == -1) { // and that it doesn't have this item already
                                $scope.list.push($scope.selected);
                                $scope.selected = null;
                            }


                        }

                    });


                    api.user.query({}, function (users) {
                        $scope.users = users;
                    });
                }
            };
        })
        .directive('badgeList', function () {
            return {
                restrict: 'E',
                scope: {
                    list: '=',
                    deleteItem: '=',
                    displayKey: '@',
                    editable: '@',
                    muted: '@'
                },
                templateUrl: '/static/partials/directives/badgelist.html',
                controller: function ($scope, _) {
                    $scope.display = function (item) {
                        if ($scope.displayKey) {
                            return item[$scope.displayKey];
                        } else {
                            return item;
                        }
                    };

                    $scope.removeBadge = function (tag) {
                        var index = $scope.list.indexOf(tag);
                        if (index > -1) {
                            $scope.list.splice(index, 1);
                            if (_.isFunction($scope.deleteItem)) {
                                $scope.deleteItem(tag);
                            }
                        }
                    };
                }
            };
        })
        .directive('tagHelper', function () {
            return {
                restrict: 'E',
                scope: {
                    tagKey: '@', // The resource key, eg 'tags'
                    resource: '='
                },
                templateUrl: '/static/partials/directives/taghelper.html',
                controller: function ($scope) {
                    $scope.$watch('resource', function () {
                        try {
                            $scope.tagList = $scope.resource[$scope.tagKey];
                        } catch (e) {
                        }
                    });

                    $scope.deleteTag = function (tag) {
                        $scope.resource.removeFromCollection($scope.tagKey, [tag], function () {
                            console.log('Deleted.');
                        });
                    };

                    $scope.addTag = function () {
                        var value = $scope.newTagInput;
                        if ($scope.resource[$scope.tagKey].indexOf(value) === -1) {
                            $scope.resource.addToCollection($scope.tagKey, [value], function () {
                                $scope.resource[$scope.tagKey].push(value);
                            });
                        }
                        $scope.newTagInput = '';
                    };
                }
            };
        })
        .directive('compoundStatistics', function () {
            return {
                restrict: 'E',
                scope: {
                    statistics: '=',
                    idList: '=', // Used to make useful links to the list.
                    resourceType: '@'
                },
                templateUrl: '/static/partials/directives/compoundstatistics.html',
                controller: function ($scope) {
                    $scope.listUrl = '/' + $scope.resourceType + '/?idList=' + $scope.idList.join(',');
                }
            };
        })
        .directive('temporalStatistics', function () {
            return {
                restrict: 'E',
                scope: {
                    statistics: '=',
                    idList: '=',
                    resourceType: '@'
                },
                templateUrl: '/static/partials/directives/temporalstatistics.html',
                controller: function ($scope) {
                    $scope.listUrl = '/' + $scope.resourceType + '/?idList=' + $scope.idList.join(',');
                }
            };
        })
        .directive('summaryStatistics', function () {
            return {
                restrict: 'E',
                scope: {
                    statistics: '='
                },
                templateUrl: '/static/partials/directives/summarystatistics.html',
                controller: function ($scope) {
                }
            };
        })
        .directive('listGroupSimple', function () {
            return {
                restrict: 'E',
                scope: {
                    list: '=',
                    editable: '@'
                },
                templateUrl: '/static/partials/directives/listgroupsimple.html',
                controller: function ($scope) {
                    $scope.newItem = '';
                    $scope.removeItem = function (item) {
                        $scope.list.splice($scope.list.indexOf(item), 1);
                    };

                    $scope.addItem = function () {
                        if ($scope.newItem.length > 0) {
                            if (!$scope.list) {
                                $scope.list = [];
                            }
                            $scope.list.push($scope.newItem);
                            $scope.newItem = '';
                        }
                    };

                }
            };
        })
        .directive('map', function () {
            return {
                restrict: 'E',
                scope: {
                    resource: '='
                },
                templateUrl: '/static/partials/directives/map.html',
                controller: function ($scope, _) {
                    $scope.map = {
                        markers: {},
                        paths: {},
                        center: {},
                        bounds: {},
                        defaults: {},
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
        })
        .directive('eventTimeline', function (_) {
            return {
                restrict: 'E',
                replace: false,
                scope: {
                    events: '='
                },
                link: function (scope, element, attrs) {
                    var events = scope.events;

                    var graphHeight = 200; // Make an initial guess.

                    var graphWidth = element.parent()[0].offsetWidth - 30;
                    //var graphWidth = element.css('width');
                    // Constants
                    var xScaleHeight = 20;
                    var markerHeight = 12;
                    var rowPadding = 4;
                    var leftPadding = 60;
                    var minimumMarkerWidth = 4;
                    var rowHeight = markerHeight + rowPadding;

                    function emptyRightClick() {
                        //stop showing browser menu
                        d3.event.preventDefault();
                    }

                    function calculateRowKey(event) {
                        return event.type + event.source.type;
                    }

                    var graphSvg = d3.select(element[0])
                        .append('svg')
                        .attr('height', graphHeight)
                        .attr('width', graphWidth)
                        //.on('mousemove', mouseMove)
                        //.on('mouseout', mouseOut)
                        .on('contextmenu', emptyRightClick);
                    //.on('drag', dragmove);

                    var xScale = d3.time.scale()
                        .range([leftPadding, graphWidth])
                        .domain([0, 1]);
                    var xAxis = d3.svg.axis().scale(xScale);

                    var xScaleY = (graphHeight - xScaleHeight);
                    graphSvg.append('g')
                        .attr('transform', 'translate(0,' + xScaleY + ')')
                        .attr('class', 'event-timeline-axis')
                        .call(xAxis);


                    function update() {
                        //graphWidth = element[0].offsetWidth;
                        //console.log('graphWidth: "' + graphWidth + '"');
                        //console.log(element.parent()[0].offsetWidth);
                        events = scope.events;
                        // Get all event labels
                        var eventLabels = {};
                        var rowKeys = [];
                        _.each(events, function (event) {
                            var key = calculateRowKey(event);
                            eventLabels[key] = event.type + (event.source.type === 'auto' ? '*' : '');
                            rowKeys.push(key);
                        });

                        rowKeys = _.uniq(rowKeys).sort();

                        var yScale = {};
                        _.each(rowKeys, function (key, index) {
                            yScale[key] = index * rowHeight;
                        });

                        // Get rid of events outside the current window
                        //var viewableEvents = _.reject(events, function (event) {
                        //    return event.endTime < startTime || endTime < event.startTime;
                        //});
                        var startTime = _.chain(events).pluck('startTime').min().value();
                        var endTime = _.chain(events).pluck('endTime').max().value();
                        var viewableEvents = events || [];

                        xScale.domain([startTime, endTime]);

                        xScaleY = rowKeys.length * rowHeight;
                        graphHeight = xScaleY + xScaleHeight;
                        graphSvg.attr('height', graphHeight);

                        //graphSvg.selectAll('.hovermarker')
                        //    .attr('y2', xScaleY);
                        //graphSvg.selectAll('.videomarker')
                        //    .attr('y2', xScaleY);


                        graphSvg.select('.event-timeline-axis')
                            .attr('transform', 'translate(0,' + xScaleY + ')')
                            .call(xAxis);

                        var svgEvents = graphSvg.selectAll('.event-timeline-markers')
                            .data(viewableEvents, function (event) {
                                return event.id;
                            });

                        svgEvents.enter()
                            .append('svg:rect')
                            .attr('class', 'event-timeline-markers');

                        svgEvents
                            .attr('y', function (event) {
                                return yScale[calculateRowKey(event)];
                            })
                            .attr('height', markerHeight)
                            .each(function (event) {
                                var x = xScale(event.startTime);
                                var xEnd = xScale(event.endTime);


                                if ((x > graphWidth && xEnd > graphWidth) || (x < leftPadding && xEnd < leftPadding)) {
                                    // Do nothing. Off edge of graph.
                                    return;
                                }

                                if (xEnd > graphWidth) { // End of event off right edge.
                                    xEnd = graphWidth;
                                }

                                if (x < leftPadding) { // Start of event off left edge
                                    x = leftPadding;
                                }

                                if (x > xEnd) {
                                    console.log('Error: x > xEnd...: ' + x + ', ' + xEnd);
                                }

                                var eWidth = xEnd - x;
                                eWidth = eWidth >= minimumMarkerWidth ? eWidth : minimumMarkerWidth;

                                d3.select(this).attr({
                                    x: x,
                                    width: eWidth
                                });
                            })
                            .classed('event-timeline-markers-source-auto', function (event) {
                                return event.source.type === 'auto';
                            });
                        //.on('click', function (event) {
                        //    if (typeof configuration.eventClicked === 'function') {
                        //        configuration.eventClicked(event.id);
                        //    }
                        //})
                        //.on('contextmenu', function (event) {
                        //    var setTo = !d3.select(this).classed('event-timeline-markers-select');
                        //    d3.select(this).classed('event-timeline-markers-select', setTo);
                        //
                        //    d3.event.stopPropagation();
                        //
                        //    //stop showing browser menu
                        //    d3.event.preventDefault();
                        //});

                        svgEvents.exit().remove();


                        var svgEventLabels = graphSvg.selectAll('.event-timeline-types')
                            .data(rowKeys, function (label) {
                                return label;
                            });


                        svgEventLabels.enter()
                            .append('svg:text')
                            .attr('class', 'event-timeline-types');

                        svgEventLabels
                            .attr('x', 0)
                            .attr('y', function (rowKey) {
                                // Get the CSS font size, remove the "px", and convert
                                // it to an int.
                                var fontSize = parseInt(d3.select(this).style('font-size').slice(0, -2));
                                return yScale[rowKey] + fontSize;
                            })
                            .text(function (rowKey) {
                                return eventLabels[rowKey];
                            });
                        //.on('contextmenu', function (rowKey) {
                        //    console.log('row type: ' + rowKey);
                        //
                        //    //stop showing browser menu
                        //    d3.event.preventDefault();
                        //})
                        //.on('click', function (rowKey) {
                        //    graphSvg.selectAll('.event-timeline-markers')
                        //        .each(function (event) {
                        //            if (calculateRowKey(event) === rowKey) {
                        //                d3.select(this).classed('event-timeline-markers-select', true);
                        //            }
                        //        });
                        //});

                        svgEventLabels.exit().remove();
                    }

                    update();

                    scope.$watch('events', function (newValue, oldValue) {
                        update();
                    });

                    //d3.select(window).on('resize', update);


                },
                controller: function ($scope) {

                }
            };
        })
        .directive('userDetails', function () {
            return {
                restrict: 'E',
                templateUrl: '/static/partials/directives/userdetails.html',
                controller: function ($scope, _) {

                }
            };
        })
        .directive('userInputImperial', function () {
            // Adapted from: http://stackoverflow.com/a/17632922/2557842
            // Must be at attribute with the attribute key
            // value the unit to convert to.
            // TODO: Does the year option appropriately account for timezones?
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function (scope, element, attrs, ngModel) {

                    var imperialUnit = attrs.userInputImperial;

                    var unitMap = {
                        lb: 'kg',
                        year: 'timestamp'
                    };

                    if (!unitMap.hasOwnProperty(imperialUnit)) {
                        throw new Error('Must provide a valid imperial unit to convert from. Invalid: ' + imperialUnit);
                    }

                    var siUnit = unitMap[imperialUnit];

                    // Convert from imperial to SI (Red9)
                    ngModel.$parsers.push(function (imperial) {
                        if (!imperial) { // undefined
                            return imperial;
                        }

                        if (imperialUnit === 'lb' && siUnit === 'kg') {
                            return imperial * 0.453592;
                        }
                        if (imperialUnit === 'year' && siUnit === 'timestamp') {
                            return (new Date('1/1/' + imperial)).getTime();
                        }

                    });

                    // Convert from SI (Red9) to imperial
                    ngModel.$formatters.push(function (si) {
                        if (!si) { // undefined
                            return si;
                        }

                        if (imperialUnit === 'lb' && siUnit === 'kg') {
                            return Math.round(si * 2.20462);
                        }
                        if (imperialUnit === 'year' && siUnit === 'timestamp') {
                            return (new Date(si)).getFullYear();
                        }
                    });
                }
            };
        })
        .directive('aggregateStatistics', function () {
            return {
                restrict: 'E',
                templateUrl: '/static/partials/directives/aggregatestatistics.html',
                controller: function ($scope, _) {

                }
            };
        })
        .directive('eventsSummary', function () {
            return {
                restrict: 'E',
                templateUrl: '/static/partials/directives/eventssummary.html',
                scope: {
                    events: '='
                },
                controller: function ($scope, _) {
                    $scope.displayEvents = [];
                    function update() {
                        $scope.displayEvents = _.chain($scope.events)
                            .groupBy('type')
                            .map(function (eventsByType) {
                                return _.reduce(eventsByType, function (memo, event) {
                                    memo.type = event.type;
                                    memo.count++;
                                    memo.totalDuration += event.endTime - event.startTime;
                                    if (event.source.type === 'manual') {
                                        memo.sourceType.manual++;
                                    } else {
                                        memo.sourceType.auto++;
                                    }

                                    return memo;
                                }, {
                                    count: 0,
                                    totalDuration: 0,
                                    sourceType: {
                                        manual: 0,
                                        auto: 0
                                    }
                                });
                            })
                            .sortBy(function (summary) {
                                return summary.type;
                            })
                            .value();
                    }

                    $scope.$watch('events', update);
                    update();
                }
            };
        })
        .directive('fcpxmlDownload', function () {
            return {
                restrict: 'E',
                templateUrl: '/static/partials/directives/fcpxmldownload.html',
                scope: {
                    dataset: '='
                },
                controller: function ($scope) {
                    function update() {
                        if ($scope.dataset) {
                            $scope.dataset.getFcpxmlOptions().success(function (options) {
                                $scope.options.template = options.template[0];
                                $scope.options.eventType = options.eventType[0];
                                $scope.options.videoType = Object.keys(options.videoType)[0];
                                $scope.options.titleDuration = 3;
                                $scope.options.files = [];
                            });
                        }
                    }

                    $scope.$watch('dataset', update);
                    update();


                    $scope.options = {};

                    $scope.$watch('options', function () {
                        // For some reason, the form is valid on page load.
                        // So, we add in the test to make sure that we have a dataset.
                        $scope.fcpxmlUrl = $scope.form.$valid && $scope.dataset ?
                            $scope.dataset.getFcpxmlUrl($scope.options) :
                            '';
                    }, true);

                }
            };
        })
        .directive('eventSummary',
        function () {
            return {
                restrict: 'E',
                templateUrl: function (element, attributes) {
                    return '/static/partials/directives/eventsummary/' + attributes.type;
                },
                scope: {
                    event: '=',
                    type: '@'
                },
                controller: function () {
                }
            };
        })

        .directive('head', ['$rootScope', '$compile', // taken from http://stackoverflow.com/a/20404559/2557842
            function ($rootScope, $compile) {
                return {
                    restrict: 'E',
                    link: function (scope, elem) {
                        var html = '<link rel="stylesheet" ng-repeat="(routeCtrl, cssUrl) in routeStyles" ng-href="{{cssUrl}}" />';
                        elem.append($compile(html)(scope));
                        scope.routeStyles = {};
                        $rootScope.$on('$routeChangeStart', function (e, next, current) {
                            if (current && current.$$route && current.$$route.css) {
                                if (!angular.isArray(current.$$route.css)) {
                                    current.$$route.css = [current.$$route.css];
                                }
                                angular.forEach(current.$$route.css, function (sheet) {
                                    delete scope.routeStyles[sheet];
                                });
                            }
                            if (next && next.$$route && next.$$route.css) {
                                if (!angular.isArray(next.$$route.css)) {
                                    next.$$route.css = [next.$$route.css];
                                }
                                angular.forEach(next.$$route.css, function (sheet) {
                                    scope.routeStyles[sheet] = sheet;
                                });
                            }
                        });
                    }
                };
            }
        ])
    ;
})();