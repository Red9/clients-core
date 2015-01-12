(function () {
    'use strict';

    angular.module('redApp.controllers', [])
        .controller('pageController', function ($scope, authenticate) {
            $scope.logout = authenticate.logout;
        })
        .controller('search', function ($scope, $location, _) {
            console.dir($location.search());
            $scope.query = $location.search();

            $scope.$watch('query', function (newValue, oldValue) {
                $location.url($location.path()); // Clear query string
                _.each(newValue, function (value, key) {
                    $location.search(key, value);
                });
            });
        })
        .controller('dataanalysis',
        function ($scope, $routeParams, _, api) {
            var queryOptions = {
                id: $routeParams.id,
                fields: [
                    'id',
                    'ownerId',
                    'title',
                    'createTime',
                    'duration',
                    'summaryStatistics',
                    'source',
                    'startTime',
                    'endTime',
                    'gpsLock',
                    'tags',
                    'boundingCircle',
                    'boundingBox',
                    // Dynamically added fields
                    'aggregateStatistics',
                    'owner',
                    'event(id,type,subType,startTime,endTime,source,summaryStatistics(gps,distance))',
                    'comment',
                    'video'
                ].join(','),
                expand: ['owner', 'event', 'comment', 'video']
            };
            api.dataset.get(queryOptions, function (dataset) {
                $scope.dataset = dataset;
                $scope.dataset.getPanel({
                    axes: [
                        'time',
                        'gps:latitude',
                        'gps:longitude'
                    ]
                });

                _.each($scope.dataset.event, function (event) {
                    //api.event.getPanel(event);
                });

            });

            $scope.eventFind = function (dataset) {
                $scope.eventFindDisabled = true;
                dataset.eventFind();
            };

        })
        .controller('uploadRNC',
        function ($scope, $upload, current, api) {
            $scope.users = [];
            $scope.uploadPercent = 0;
            $scope.upload = {};

            $scope.owner = current.user;

            api.user.query({}, function (users) {
                $scope.users = users;
            });

            $scope.beginUpload = function () {
                $upload.upload({
                    url: red9config.apiUrl + '/dataset/',
                    method: 'POST',
                    withCredentials: true,
                    data: {
                        ownerId: $scope.owner.id,
                        title: $scope.title
                    },
                    file: $scope.file,
                    fileFormDataName: 'rnc'
                }).progress(function (evt) {
                    $scope.uploadPercent = parseInt(100.0 * evt.loaded / evt.total);
                }).success(function (data, status) {
                    $scope.uploadPercent = 100;
                    $scope.uploadDataset = data;
                }).error(function (data) {
                    $scope.uploadError = data;
                });
            };
            $scope.onFileSelect = function ($files) {
                console.dir($files);
                $scope.file = $files[0];
            };
        })
        .controller('admin',
        function ($scope, api) {
            $scope.newUser = {};
            $scope.createdUsers = [];

            $scope.addNewUser = function () {
                var createdUser = new api.user({
                    email: $scope.newUser.email,
                    displayName: 'unknown'
                });

                createdUser.$save({}, function () {
                    $scope.createdUsers.push(createdUser);
                    $scope.newUser = {};
                    $scope.newUserForm.$setPristine();
                }, function (data) {
                    alert('Error. Please report as bug: ' + JSON.stringify(data.data, null, 3));
                });

            };

        })
        .controller('userProfile',
        function ($scope, $routeParams, api) {
            $scope.datasetSearchQuery = {ownerId: $routeParams.id};

            api.user.get({id: $routeParams.id}, function (user) {
                $scope.user = user;
            });
        })
        .controller('editUserProfile',
        function ($scope, $routeParams, api) {
            $scope.editableUser = {};


            api.user.get({id: $routeParams.id}, function (user) {
                $scope.editableUser.displayName = user.displayName;
                $scope.editableUser.preferredLayout = user.preferredLayout;
                $scope.editableUser.scope = user.scope;
                $scope.user = user;
            });

            $scope.saveChanges = function () {
                $scope.user.update($scope.editableUser)
                    .success(function () {
                        alert('Successfully Updated');
                    })
                    .error(function () {
                        alert('Update error. Check Network tab.');
                    });
            };

        })
        .controller('homeController',
        function ($scope, _) {
            $scope.myInterval = 1000;

            var instagramList = [
                'u1BeCCTDVE',
                'uN3fY_zDdF',
                'uqK1eszDRE',
                't8vBXQTDZZ',
                'tvcuznzDdO',
                'uGJeQSTDXI'
            ];

            $scope.slides = _.map(instagramList, function (id) {
                return {
                    image: 'http://instagram.com/p/' + id + '/media/?size=l',
                    active: false
                };
            });
            $scope.slides[0].active = true;


        })
        .controller('unauthenticatedController',
        function ($scope, $location, _) {
            $scope.attemptUrl = decodeURIComponent($location.search().attemptUrl);

            $scope.error = null;
            if (_.has($location.search(), 'error')) {
                try {
                    $scope.error = JSON.parse($location.search().error);
                } catch (e) {
                    $scope.error = {
                        message: 'Warning: could not parse URL error. Did you mess with it? If not, contact support.'
                    };
                }
            }
        })
        .controller('leaderboard',
        function ($scope, $routeParams, api) {

            $scope.format = 'MMM dd, yyyy';
            $scope.userList = null;
            $scope.dateOptions = {
                showWeeks: false
            };
            $scope.team = $routeParams.tag;  // This is temporary.  We should assign a team to the surfer.
            $scope.predicate = "topSpeed";
            $scope.reverse = true;

            $scope.startDate = {
                //date: new Date((new Date()).getTime() - 7 * 24 * 60 * 60 * 1000), // Last week
                //date: new Date((new Date()).getTime() - 4 * 31 * 24 * 60 * 60 * 1000), // Four months ago
                date: null,
                opened: false,
                open: function ($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    $scope.startDate.opened = true;
                }
            };

            $scope.endDate = {
                date: null,
                opened: false,
                open: function ($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    $scope.endDate.opened = true;
                }
            };

            $scope.runSearch = function () {
                $scope.startTime = $scope.startDate.date ? $scope.startDate.date.getTime() : (new Date((new Date()).getTime() - 7 * 7 * 24 * 60 * 60 * 1000)).getTime();
                $scope.endTime = $scope.endDate.date ? $scope.endDate.date.getTime() : (new Date()).getTime();
                $scope.leaderboardData = null;
                var datasetQuery = {
                    'expand[]': ['owner', 'event'],
                    'startTime.gt': $scope.startTime,
                    'endTime.lt': $scope.endTime,
                    'tags': $scope.team
                };
                api.dataset.query(datasetQuery, function (datasetList) {
                    // Filter to just the event type that we're interested in
                    var searchString = "wave";
                    datasetList = _.map(datasetList, function (dataset) {
                        dataset.event = _.filter(dataset.event, function (event) {
                            return event.type.toUpperCase().indexOf(searchString.toUpperCase()) != -1;
                        });
                        return dataset;
                    });

                    // Utility function to help us out.
                    function calculateTotalDistance(eventList) {
                        if (eventList.length) {
                            return _.reduce(eventList, function (memo, event) {
                                return memo + event.summaryStatistics.distance.path; // SRLM: What if there is no distance for a particular event?
                            }, 0);
                        }
                    }

                    function calculateTopSpeed(eventList) {
                        var topSpeed = 0;

                        _.each(eventList, function (event) {
                            var gpsSpeed = event.summaryStatistics.gps.speed.maximum;
                            topSpeed = Math.max(gpsSpeed, topSpeed);
                        });
                        return topSpeed || 0;
                    }

                    $scope.leaderboardData = _.chain(datasetList).groupBy('ownerId').map(function (userDatasets, userId) {
                        var totalEventDistance = 0;
                        var eventCount = 0;
                        var totalDuration = 0;
                        var topSpeed = 0;

                        _.each(userDatasets, function (dataset) {
                            totalDuration += dataset.duration;
                            totalEventDistance += calculateTotalDistance(dataset.event);
                            eventCount += dataset.event.length;
                            topSpeed = Math.max(calculateTopSpeed(dataset.event), topSpeed);
                        });

                        var averageEventDistance = 0;
                        if (eventCount !== 0) {
                            averageEventDistance = totalEventDistance / eventCount;
                        }

                        var averageEventsPerHour = 0;
                        if (totalDuration !== 0) {
                            averageEventsPerHour = eventCount / (totalDuration / 1000 / 60 / 60);
                        }
                        return {
                            user: userDatasets[0].owner,
                            eventsPerHour: averageEventsPerHour,
                            totalEventDistance: parseInt((totalEventDistance * 3.28084), 10), // convert to feet (temporary)
                            averageEventDistance: parseInt((averageEventDistance * 3.28084), 10), // same
                            datasets: userDatasets,
                            topSpeed: parseInt((topSpeed * 1.15078), 10) // convert to mph (temporary)
                        };
                    }).value();
                });
            };

            $scope.runSearch(); // Initial run

        })
        .controller('siteStatistics',
        function ($scope, _, api) {
            var parameters = {
                dataset: {
                    'expand': ['owner', 'count']
                },
                event: {}

            };

            api.dataset.query(parameters.dataset, function (datasets) {
                var datasetAggregate = _.reduce(datasets, function (memo, dataset) {
                    memo.sumDuration += dataset.endTime - dataset.startTime;
                    console.log(memo.sumDuration + ', ' + dataset.startTime + ', ' + dataset.endTime + ', ' + dataset.id);
                    try {
                        memo.sumDistance += dataset.summaryStatistics.static.route.path.distance.value;
                    } catch (e) {
                    }
                    return memo;
                }, {
                    sumDuration: 0,
                    sumDistance: 0
                });

                datasetAggregate.count = datasets.length;
                datasetAggregate.averageDuration = datasetAggregate.sumDuration / datasets.length;
                datasetAggregate.averageDistance = datasetAggregate.sumDistance / datasets.length;

                $scope.datasetAggregate = datasetAggregate;


                $scope.datasetUsers = _.chain(datasets)
                    .groupBy(function (dataset) {
                        return dataset.ownerId;
                    })
                    .map(function (list) {
                        return _.reduce(list, function (memo, dataset) {

                            memo.sumDuration += dataset.endTime - dataset.startTime;
                            memo.count += 1;

                            // A bit wasteful to set it on every iteration, but oh well.
                            memo.ownerId = dataset.ownerId;
                            memo.owner.displayName = dataset.owner.displayName;
                            return memo;
                        }, {
                            sumDuration: 0,
                            count: 0,
                            owner: {}
                        });
                    })
                    .value();
            });

            api.event.query({}, function (events) {
                var eventsAggregate = _.chain(events)
                    .groupBy('type')
                    .map(function (eventsByType, type) {
                        var t = {
                            manual: {
                                sumDuration: 0,
                                sumDistance: 0,
                                count: 0
                            },
                            auto: {
                                sumDuration: 0,
                                sumDistance: 0,
                                count: 0
                            }
                        };

                        var result = _.reduce(eventsByType, function (memo, event) {
                            if (event.source.type === 'manual' || event.source.type === 'auto') {
                                memo[event.source.type].sumDuration += event.endTime - event.startTime;
                                memo[event.source.type].count += 1;

                                try {
                                    memo[event.source.type].sumDistance += event.summaryStatistics.static.route.path.distance.value;
                                } catch (e) {
                                }

                            } else {
                                console.log('bad type: ' + event.id + ': ' + event.source.type);
                            }

                            return memo;
                        }, t);

                        result.manual.averageDuration = result.manual.sumDuration / result.manual.count;
                        result.auto.averageDuration = result.auto.sumDuration / result.auto.count;
                        result.type = type;
                        return result;
                    })
                    .value();
                $scope.eventsAggregate = eventsAggregate;

                $scope.eventCount = _.reduce(eventsAggregate, function (memo, agg) {
                    memo.manual.count += agg.manual.count;
                    memo.manual.sumDuration += agg.manual.sumDuration;
                    memo.auto.count += agg.auto.count;
                    memo.auto.sumDuration += agg.auto.sumDuration;
                    return memo;
                }, {
                    manual: {
                        count: 0,
                        sumDuration: 0
                    },
                    auto: {
                        count: 0,
                        sumDuration: 0
                    },
                    total: events.length
                });

            });
        });

})
();
               