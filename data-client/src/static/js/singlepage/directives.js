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
                            //part: 'title,id,createTime,startTime,endTime,owner.id,owner.displayName,count',
                            'expand': ['owner', 'count']
                        },
                        event: {
                            //part: 'type,id,startTime,endTime,datasetId,summaryStatistics.static.cse.axes'
                        },
                        user: {}

                    };

                    var sortBy = {
                        dataset: function (dataset) {
                            return -dataset.createTime;
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
                            return _.has(item, 'boundingCircle');
                        }).reduce(function (memo, item) {
                            var key = item.id.replace(/-/g, '');
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
                                    console.log('index: ' + index);
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

                    // Search Query variables
                    $scope.searchTitle = '';
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

                    if (_.has($scope.query, 'ownerId')) {
                        api.user.query({idList: $scope.query.ownerId}, function (results) {
                            $scope.userList = results;
                        });
                    }

                    $scope.userList = [];

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
                            result.ownerId = _.pluck($scope.userList, 'id').join(',');
                        }

                        if ($scope.tagList.length > 0) {
                            result.tags = $scope.tagList;
                        }

                        if ($scope.searchTitle.length > 0) {
                            result.title = $scope.searchTitle;
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

                    console.log('placeholder: ' + $scope.placeholder);


                    if (_.isUndefined($scope.selectedUser)) {
                        $scope.selectedUser = null;
                    }

                    console.dir($scope);

                    $scope.$watch('selected', function (newValue, oldValue) {
                        console.log('Selected changed!');
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
                    displayKey: '@'
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
    ;
})();