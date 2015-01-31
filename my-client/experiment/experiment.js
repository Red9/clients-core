angular
    .module('redApp.experiment', [
        'ngRoute',
        'redComponents.api',
        'angularDc',
        'lodash'
    ])
    .config(function ($routeProvider) {
        $routeProvider.when('/experiment/', {
            templateUrl: '/my-client/experiment/experiment.html',
            controller: 'ExperimentController',
            accessLevel: 'basic',
            title: 'R9: Experimental Page'
        });
    })
    .controller('ExperimentController',
    function ($scope, $http, _) {
        $http({
            method: 'GET',
            url: 'http://localhost:3000/flatevent/'
        }).then(function (result) {
            var ndx = crossfilter(_.map(result.data, function (event) {
                event.duration = event.duration / 1000;
                return event;
            }));
            $scope.ndx = ndx;
            $scope.all = ndx.groupAll();
            $scope.count = result.data.length;
            $scope.resetAll = function () {
                dc.filterAll();
                dc.redrawAll();
            };
            //$scope.rowChartWidth = document.getElementById('testColumn').offsetWidth;

            $scope.dailyVolumeX = d3.scale.ordinal();
            $scope.dailyVolumeXUnits = dc.units.ordinal;
            $scope.dailyVolumeDimension = ndx
                .dimension(function (event) {
                    var d = new Date(event.startTime);
                    var result = d.getFullYear() + '-' + (d.getMonth() + 1);
                    return result;
                });

            $scope.dailyVolumeGroup = $scope.dailyVolumeDimension
                .group().reduceCount();

            $scope.rowX = d3.scale.linear().domain([0, 30]);
            $scope.rowDimension = ndx
                .dimension(function (event) {
                    return event['dataset.user.displayName'];
                });

            $scope.rowGroup = $scope.rowDimension
                .group().reduceCount();

            $scope.rowOrdering = function (value) {
                return -value.value;
            };


            $scope.scatterX = d3.scale.linear().domain([0, 30]);
            $scope.scatterDimension = ndx
                .dimension(function (event) {
                    return [event.duration, event['summaryStatistics.gps.speed.average']];
                });

            $scope.scatterGroup = $scope.scatterDimension
                .group();

            $scope.scatterSpeedDimension = ndx
                .dimension(function (event) {
                    return [event.duration, event['summaryStatistics.gps.speed.maximum']];
                });
            $scope.scatterSpeedGroup = $scope.scatterSpeedDimension
                .group();


            $scope.scatter2Dimension = ndx
                .dimension(function (event) {
                    return [event.duration, event['summaryStatistics.distance.path']];
                });

            $scope.scatter2Group = $scope.scatter2Dimension
                .group();


        }).catch(function (err) {
            console.log(err);
        });
    });