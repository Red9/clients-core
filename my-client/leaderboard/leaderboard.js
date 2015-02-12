angular
    .module('redApp.leaderboard', [
        'ngRoute',
        'redComponents.api',
        'lodash'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('leaderboard', {
            url: '/leaderboard/{tag}',
            templateUrl: '/my-client/leaderboard/leaderboard.html',
            controller: 'leaderboard',
            data: {
                css: '/my-client/leaderboard/leaderboard.css'
            },
            accessLevel: 'public',
            title: 'R9: Leaderboard'
        });
    })
    .controller('leaderboard',
    function ($scope, $stateParams, api, _) {

        $scope.format = 'MMM dd, yyyy';
        $scope.userList = null;
        $scope.dateOptions = {
            showWeeks: false
        };
        $scope.team = $stateParams.tag;  // This is temporary.  We should assign a team to the surfer.
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
            var datasetQuery = _.pick({
                'expand[]': ['user', 'event'],
                'startTime.gt': $scope.startTime,
                'endTime.lt': $scope.endTime,
                'tags[]': $scope.team
            }, _.identity);
            api.dataset.query(datasetQuery, function (datasetList) {
                // Filter to just the event type that we're interested in
                var searchString = "wave";
                datasetList = _.map(datasetList, function (dataset) {
                    dataset.events = _.filter(dataset.events, function (event) {
                        return event.type.toUpperCase().indexOf(searchString.toUpperCase()) !== -1;
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

                $scope.leaderboardData = _.chain(datasetList).groupBy('userId').map(function (userDatasets, userId) {
                    var totalEventDistance = 0;
                    var eventCount = 0;
                    var totalDuration = 0;
                    var topSpeed = 0;

                    _.each(userDatasets, function (dataset) {
                        totalDuration += dataset.duration;
                        totalEventDistance += calculateTotalDistance(dataset.events);
                        eventCount += dataset.events.length;
                        topSpeed = Math.max(calculateTopSpeed(dataset.events), topSpeed);
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
                        user: userDatasets[0].user,
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

    });