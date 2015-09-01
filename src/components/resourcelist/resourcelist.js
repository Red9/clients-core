angular
    .module('redComponents.resourceList', [
        'redComponents.api',
        'redComponents.confirmDialog',
        'redComponents.badgeList',
        'redComponents.filters.display.duration',
        'leaflet-directive',
        'lodash'
    ])
    .directive('resourceList', function () {
        return {
            restrict: 'E',
            templateUrl: function (element, attributes) {
                return '/components/resourcelist/' + attributes.resourceType + 'list.html';
            },
            scope: {
                resourceFilters: '=',
                resourceType: '@'
            },
            controller: function ($scope, $location, $q, _, api, confirmDialog) {

                $scope.resourceList = resourceList;
                //$scope.resourceList = null;

                $scope.paging = {
                    sort: 'createdAt',
                    sortDirection: 'desc',
                    offset: 10,
                    limit: 10
                };

                $scope.displayPaging = {
                    currentPage: 1,
                    pageChanged: pagingChanged
                };

                //var requestInProgress = false;

                function pagingChanged(newValue) {
                    console.log('Paging changed: ');
                    console.dir(newValue);
                    $scope.paging.offset =
                        ($scope.displayPaging.currentPage - 1) *
                        $scope.paging.limit;
                    $scope.displayPaging.currentPage = Math.floor($scope.paging.offset /$scope.paging.limit) + 1;
                    makeRequest();
                }

                $scope.$watchCollection('paging', pagingChanged);


                function makeRequest(newValue) {
                    //if(requestInProgress){
                    //    return;
                    //}
                    //requestInProgress = true;
                    //
                    //$scope.resourceList = null;  // Clear variable to indicate loading
                    //
                    //api[$scope.resourceType].query(
                    //    angular.extend({}, newValue, $scope.paging),
                    //    function (data) {
                    //        $scope.resourceList = data;
                    //        console.log('Data: ');
                    //        console.dir(data);
                    //        requestInProgress = false;
                    //        // The currentPage set should be before the
                    //        // resourceList set. This will allow the change
                    //        // in the resourceList to initiate a change
                    //        // in the page
                    //        //$scope.resourcePages.currentPage = 1;
                    //        //$scope.resourceList = _.sortBy(data, sortBy[$scope.resourceType]);
                    //        //$scope.resourceList.$meta = data.$meta; // Hack for now since _.sort strips the meta, and while we're still doing all this client side stuff.
                    //        //createMapMarkers(data);
                    //    });
                }

                $scope.$watch('resourceFilters', makeRequest);


                //$scope.resourceList = null;
                //$scope.resultDisplay = 'table';
                //
                //$scope.map = {
                //    markers: {},
                //    layers: {
                //        baselayers: {
                //            ThunderforestLandscape: {
                //                url: 'http://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png',
                //                type: 'xyz',
                //                name: 'Thunderforest Landscape',
                //                layerParams: {},
                //                layerOptions: {}
                //            },
                //            ThunderforestOutdoors: {
                //                url: 'http://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png',
                //                type: 'xyz',
                //                name: 'Thunderforest Outdoors',
                //                layerParams: {},
                //                layerOptions: {}
                //            },
                //            "osm": {
                //                "name": "OpenStreetMap",
                //                "url": "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                //                "type": "xyz",
                //                "layerParams": {},
                //                "layerOptions": {}
                //            },
                //            MapQuestOpenAerial: {
                //                url: 'http://otile1.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg',
                //                name: 'MapQuestOpen Aerial',
                //                layerParams: {},
                //                type: 'xyz',
                //                layerOptions: {
                //                    attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; ' +
                //                    'Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
                //                }
                //            }
                //        },
                //        overlays: {
                //            Locations: {
                //                "name": "Locations",
                //                "type": "markercluster",
                //                "visible": true,
                //                "layerOptions": {
                //                    chunkedLoading: true,
                //                    showCoverageOnHover: false,
                //                    removeOutsideVisibleBounds: true,
                //                    maxClusterRadius: 30
                //                }
                //            }
                //        }
                //    },
                //    bounds: {},
                //    center: {}
                //};
                //
                //var parameters = {
                //    dataset: {
                //        //fields: 'title,id,createdAt,startTime,endTime,owner,count,tags,boundingCircle,owner(displayName,id,picture)',
                //        //part: 'title,id,createTime,startTime,endTime,owner.id,owner.displayName,count',
                //        'expand': ['user']
                //    },
                //    event: {
                //        //fields: 'type,id,startTime,endTime,datasetId,boundingCircle'
                //    },
                //    user: {}
                //
                //};
                //
                //var sortBy = {
                //    dataset: function (dataset) {
                //        return -dataset.createdAt;
                //    },
                //    event: function (event) {
                //        return -event.startTime;
                //    },
                //    user: function (user) {
                //        return user.displayName;
                //    }
                //};
                //
                //
                //// Creates a page of resources suitable for display. This
                //// page is just a shallow copy, so no need to use it for
                //// anything but display.
                //function extractResourcePage() {
                //
                //    if ($scope.resourceList) {
                //        var page = $scope.resourcePages.currentPage;
                //        var ipp = $scope.resourcePages.itemsPerPage;
                //
                //        $scope.resourcePage = $scope.resourceList.slice(
                //            (page - 1) * ipp,
                //            page * ipp
                //        );
                //    } else {
                //        $scope.resourcePage = null;
                //    }
                //}
                //
                //function createMapMarkers(list) {
                //    var minimumLatitude = Number.MAX_VALUE;
                //    var maximumLatitude = -Number.MAX_VALUE;
                //    var minimumLongitude = Number.MAX_VALUE;
                //    var maximumLongitude = -Number.MAX_VALUE;
                //
                //    $scope.map.markers = _.chain(list).filter(function (item) {
                //        return _.has(item, 'boundingCircle')
                //            && _.isObject(item.boundingCircle)
                //            && _.has(item.boundingCircle, 'latitude')
                //            && _.has(item.boundingCircle, 'longitude');
                //    }).reduce(function (memo, item) {
                //        var key = item.id;
                //        var message = "";
                //        if (_.has(item, 'title')) {
                //            message = item.title;
                //        } else if (_.has(item, 'type')) {
                //            message = item.type;
                //        }
                //
                //        memo[key] = {
                //            layer: "Locations",
                //            message: message,
                //            lat: item.boundingCircle.latitude,
                //            lng: item.boundingCircle.longitude
                //        };
                //
                //        if (item.boundingCircle.latitude > maximumLatitude) {
                //            maximumLatitude = item.boundingCircle.latitude;
                //        }
                //        if (item.boundingCircle.latitude < minimumLatitude) {
                //            minimumLatitude = item.boundingCircle.latitude;
                //        }
                //
                //        if (item.boundingCircle.longitude > maximumLongitude) {
                //            maximumLongitude = item.boundingCircle.longitude;
                //        }
                //        if (item.boundingCircle.longitude < minimumLongitude) {
                //            minimumLongitude = item.boundingCircle.longitude;
                //        }
                //
                //
                //        return memo;
                //    }, {}).value();
                //
                //    $scope.map.bounds = {
                //        southWest: {
                //            lat: minimumLatitude,
                //            lng: minimumLongitude
                //        },
                //        northEast: {
                //            lat: maximumLatitude,
                //            lng: maximumLongitude
                //        }
                //    };
                //}
                //
                //$scope.$watch('resourcePages.currentPage', extractResourcePage);
                //$scope.$watch('resourcePages.itemsPerPage', extractResourcePage);
                //$scope.$watchCollection('resourceList', extractResourcePage);
                //
                //$scope.$watch('resourceFilters', function (newValue, oldValue) {
                //    $scope.resourceList = null;  // Clear variable to indicate loading
                //
                //    api[$scope.resourceType].query(
                //        angular.extend(parameters[$scope.resourceType], newValue),
                //        function (data) {
                //
                //            // The currentPage set should be before the
                //            // resourceList set. This will allow the change
                //            // in the resourceList to initiate a change
                //            // in the page
                //            $scope.resourcePages.currentPage = 1;
                //            $scope.resourceList = _.sortBy(data, sortBy[$scope.resourceType]);
                //            $scope.resourceList.$meta = data.$meta; // Hack for now since _.sort strips the meta, and while we're still doing all this client side stuff.
                //            createMapMarkers(data);
                //        });
                //});
                //
                //// Gets all the resources that have the selected option set.
                //function extractSelected(list) {
                //    return _.filter(list, function (resource) {
                //        return resource.selected;
                //    });
                //}
                //
                //$scope.deleteSelected = function (list) {
                //    var deleteList = extractSelected(list);
                //
                //    if (deleteList.length === 0) {
                //        return; // Do nothing if nothing is selected.
                //    }
                //
                //    confirmDialog({
                //        message: "You're about to delete " + deleteList.length + " " + $scope.resourceType + "s. This is non-reversible.",
                //        confirm: function (confirmation) {
                //            if (confirmation === false) {
                //                return; // do nothing
                //            }
                //
                //            _.each(deleteList, function (item) {
                //                api[$scope.resourceType].delete({id: item.id}, function () {
                //                    list.splice(_.indexOf(list, item), 1);
                //                });
                //            });
                //        },
                //        cancel: function () {
                //        }
                //    })();
                //};
                //
                //$scope.resourcePages = {
                //    itemsPerPage: 25,
                //    maxSize: 5, // The maximum number of page numbers to display.
                //    currentPage: 1
                //};
                //
                //if ($scope.resourceType === 'dataset') {
                //    $scope.searchEvents = function (datasetList) {
                //
                //        var selectedList = extractSelected(datasetList);
                //        if (selectedList.length === 0) {
                //            return; // Do nothing if nothing is selected
                //        }
                //
                //        var url = '/event/?datasetId=' + _.pluck(selectedList, 'id').join(',');
                //
                //        $location.url(url);
                //    };
                //} else if ($scope.resourceType === 'event') {
                //    $scope.datasetGroups = null;
                //    $scope.$watchCollection('resourceList', function (newValue) {
                //        $scope.datasetGroups = _.chain(newValue)
                //            .groupBy('datasetId')
                //            .reduce(function (memo, eventList, datasetId, index) {
                //                if (memo[memo.length - 1].length === 3) {
                //                    memo.push([]);
                //                }
                //
                //                var sumDuration = 0;
                //
                //                var groupedEventList = _.chain(eventList)
                //                    .groupBy('type')
                //                    .map(function (events, type) {
                //                        var duration = _.reduce(events, function (memo, event) {
                //                            memo += (event.endTime - event.startTime);
                //                            return memo;
                //                        }, 0);
                //
                //                        sumDuration += duration;
                //
                //                        return {
                //                            type: type,
                //                            duration: duration,
                //                            count: events.length
                //                        };
                //                    })
                //                    .map(function (eventSummary, type) {
                //                        eventSummary.percent = (eventSummary.duration / sumDuration) * 100;
                //                        eventSummary.percentString = eventSummary.percent + '%';
                //                        return eventSummary;
                //                    })
                //                    .sortBy(function (eventSummary) {
                //                        return eventSummary.type;
                //                    })
                //                    .value();
                //
                //
                //                memo[memo.length - 1].push({
                //                    datasetId: datasetId,
                //                    eventList: groupedEventList
                //                });
                //                return memo;
                //            }, [[]])
                //            .value();
                //    });
                //}
            }
        };
    });
