angular
    .module('redApp.userProfile', [
        'ngRoute',
        'redComponents.api',
        'lodash',
        'redComponents.aggregateStatistics',
        'redComponents.resourceList',
        'redComponents.userDetails'
    ])
    .config(function ($routeProvider) {
        $routeProvider.when('/user/:id', {
            templateUrl: '/my-client/userprofile/userprofile.html',
            css: '/my-client/userprofile/userprofile.css',
            controller: 'UserProfileController',
            accessLevel: 'basic',
            title: 'R9: User Profile'
        });
    })
    .controller('UserProfileController',
    function ($scope, $routeParams, api, _) {
        $scope.datasetSearchQuery = {userId: $routeParams.id};

        var eventQuery = {
            aggregateStatistics: true,
            aggregateStatisticsGroupBy: 'type',
            'dataset.userId': $routeParams.id,
            'expand[]': 'dataset',
            metaformat: 'only'
        };

        $scope.aggregateStatistics = {};
        api.event.query(eventQuery, function (eventList) {
            if (eventList.$meta && eventList.$meta.aggregateStatistics) {
                $scope.aggregateStatistics.events = eventList.$meta.aggregateStatistics.groupedBy;
            }
        });

        var datasetMetaQuery = {
            userId: $routeParams.id,
            aggregateStatistics: true,
            metaformat: 'only'
        };

        api.dataset.query(datasetMetaQuery, function (datasetList) {
            $scope.aggregateStatistics.datasets = datasetList.$meta.aggregateStatistics;
        });


        api.user.get({id: $routeParams.id}, function (user) {
            $scope.editable = user.id === $scope.current.user.id;
            $scope.user = user;

            // Whitelist the keys that we can edit.
            $scope.userDetails = _.pick(
                angular.copy($scope.user), // Probably not the best combo...
                ['height', 'weight', 'sport', 'tagline', 'city', 'state']
            );

            // We need this list bit because we want to allow users to
            // select height based on feet/inches, not just inches or
            // just feet. It's a bit of an annoying special case.
            $scope.heightSelectList = [];
            // Generate the height list, minimum to maximum height in inches
            for (var i = 48; i <= 84; i++) {
                $scope.heightSelectList.push({
                    value: i * 0.0254, // inch to meter
                    label: Math.floor(i / 12) + "' " + (i % 12) + '"'
                });
            }

            // Round meters to the nearest inch.
            // Use the same algorithm as above so that the select option is
            // correctly populated.
            $scope.userDetails.height = Math.round($scope.user.height * 39.3701) * 0.0254;

        });

        $scope.saveChanges = function () {
            $scope.saving = true;

            $scope.user.update($scope.userDetails)
                .success(function () {
                    // nothing to do here :)
                })
                .error(function (data) {
                    $scope.updateError = data;
                })
                .finally(function () {
                    $scope.saving = false;
                });
        };
    });
