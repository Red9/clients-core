angular
    .module('redApp.mapDemo', [
        'redComponents.api',
        'lodash'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('mapDemo', {
            url: '/mapdemo/',
            templateUrl: '/my-client/mapdemo/mapdemo.html',
            controller: 'mapDemoController',
            accessLevel: 'basic',
            title: 'map demo',
            resolve: {
                dataset: function (api) {
                    var dataset;
                    return api.dataset.get({id: 356}).$promise
                        .then(function (dataset_) {
                            dataset = dataset_;
                            return dataset.getPanel({
                                startTime: 1421520370450,
                                endTime: 1421520397300
                                //size: 'xl'
                            });
                        }).then(function () {
                            return dataset;
                        });
                }
            },
            data: {
                css: '/my-client/mapdemo/mapdemo.css'
            }
        });
    })
    .controller('mapDemoController', function ($scope, _, dataset) {
        function haversine(point1, point2) {
            var lat1 = point1[1];
            var lon1 = point1[0];
            var lat2 = point2[1];
            var lon2 = point2[0];

            // Taken from http://www.movable-type.co.uk/scripts/latlong.html
            var R = 6371000; // metres
            var φ1 = lat1 * Math.PI / 180; // convert to radians
            var φ2 = lat2 * Math.PI / 180;
            var Δφ = (lat2 - lat1) * Math.PI / 180;
            var Δλ = (lon2 - lon1) * Math.PI / 180;

            var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            var d = R * c;
            return d;
        }

        function projectPoint(startPoint, heading, distance) {
            var R = 6371000; // metres
            var lat1 = startPoint[1];
            var lon1 = startPoint[0];
            var φ1 = lat1 * Math.PI / 180; // convert to radians
            var λ1 = lon1 * Math.PI / 180;
            var bearing = heading * Math.PI / 180;
            // Taken from http://www.movable-type.co.uk/scripts/latlong.html
            var φ2 = Math.asin(Math.sin(φ1) * Math.cos(distance / R) +
            Math.cos(φ1) * Math.sin(distance / R) * Math.cos(bearing));
            var λ2 = λ1 + Math.atan2(Math.sin(bearing) * Math.sin(distance / R) * Math.cos(φ1),
                    Math.cos(distance / R) - Math.sin(φ1) * Math.sin(φ2));

            return [
                λ2 * 180 / Math.PI,
                φ2 * 180 / Math.PI
            ];
        }

        var percentageOfWindow = 0.9;

        $scope.map = {
            height: 600,
            width: 1000
        };
        $scope.dataset = dataset;

        var latitudes = dataset.panel.panel['gps:latitude'];
        var longitudes = dataset.panel.panel['gps:longitude'];
        var speed = dataset.panel.panel['gps:speed'];

        //var lattop =

        var validPoints = [];
        var invalidPoints = [];
        var hoverPoints = [];

        var segments = [];


        var lastPoint = true; // "valid" first point
        _.each(_.zip(longitudes, latitudes), function (point, index) {
            if (point[0] && point[1]) { // not null
                // Valid Point
                hoverPoints.push({point: point, index: index});
                if (lastPoint === null) {
                    // We are comming off of an invalid streak.
                    // Store the current point as the "end" of that streak.
                    invalidPoints[invalidPoints.length - 1].push(point);
                    // And start a new valid streak.
                    validPoints.push([point]);
                } else if (validPoints.length === 0) {
                    // special case: first valid point
                    validPoints.push([point]);
                } else {
                    // We're in the middle of a valid streak
                    validPoints[validPoints.length - 1].push(point);

                    segments.push({
                        start: lastPoint,
                        end: point,
                        speed: speed[index]
                    });
                }
                lastPoint = point;
            } else {
                // Invalid Point
                if (lastPoint) { // not null
                    invalidPoints.push([lastPoint]);
                }
                lastPoint = null;
            }
        });


        // todo strip out the single last invalid point if it starts on invalid.
        // todo make sure it works with no at the start.


        var points = {
            type: 'MultiLineString',
            coordinates: validPoints
        };


        var projection = d3.geo.mercator().scale(1);
        var pathBuilder = d3.geo.path().projection(projection);

        var bounds = pathBuilder.bounds(points);

        var scale = percentageOfWindow / Math.max(
                (bounds[1][0] - bounds[0][0]) / $scope.map.width,
                (bounds[1][1] - bounds[0][1]) / $scope.map.height
            );
        projection.scale(scale);

        var geoBounds = d3.geo.bounds(points);

        projection.center([
            (geoBounds[1][0] + geoBounds[0][0]) / 2,
            (geoBounds[1][1] + geoBounds[0][1]) / 2
        ]);

        projection.translate([$scope.map.width / 2, $scope.map.height / 2]);

        $scope.validPath = pathBuilder(points);

        $scope.invalidPath = pathBuilder({
            type: 'MultiLineString',
            coordinates: invalidPoints
        });

        $scope.dragging = false;

        $scope.closestPixels = projection(hoverPoints[0].point);

        // This clever multi-color scale stuff is taken from here: https://groups.google.com/d/msg/d3-js/B31N2zSVEiE/rxXNlS8zCXIJ
        var heatScale = d3.scale.linear()
            .domain(d3.extent(speed));
        heatScale.domain([0, 0.2, 0.4, 0.95, 1].map(heatScale.invert));
        heatScale.range(['black', "blue", "yellow", "red", 'white']);

        _.each(segments, function (segment) {
            segment.startPixels = projection(segment.start);
            segment.endPixels = projection(segment.end);
            segment.color = heatScale(segment.speed);
        });
        $scope.segments = segments;


        var scaleDistance = 10;
        var scaleStartPixels = [30, $scope.map.height - 30];
        var scaleEndPixels = projection(projectPoint(projection.invert(scaleStartPixels), 90, scaleDistance));
        $scope.scale = {
            startPixels: scaleStartPixels,
            endPixels: scaleEndPixels,
            ticks: [
                {
                    startPixels: scaleStartPixels,
                    endPixels: [scaleStartPixels[0], scaleStartPixels[1] - 10]
                },
                {
                    startPixels: scaleEndPixels,
                    endPixels: [scaleEndPixels[0], scaleEndPixels[1] - 10]
                }
            ],
            label: {
                x: (scaleStartPixels[0] + scaleEndPixels[0]) / 2,
                y: scaleStartPixels[1] + 20,
                text: scaleDistance + ' meters'
            }
        };


        // Note that this mapping DOES NOT take the geographic projection into
        // account. So, we assume that it's "good enough" for close up work
        // regardless of projection (flat earth assumption).
        var scaleScale = d3.scale.linear()
            // Create a scale from 0 to the width of the map (in the geo domain), in meters
            .domain([0, haversine(projection.invert([0, 0]), projection.invert([$scope.map.width, 0]))])
            // And map it to pixels
            .range([0, $scope.map.width]);

        $scope.gridLines = _.chain(scaleScale.ticks(6))
            .map(function (tick) {
                var offset = scaleScale(tick);
                return {
                    sideY: $scope.map.height - offset,
                    bottomX: scaleScale(tick),
                    text: tick
                };
            })
            // The 0 mark will be displayed right on the edge of the map, so
            // we get rid of it.
            .rest().value();



        $scope.markers = {
            start: projection(hoverPoints[0].point),
            end: projection(hoverPoints[hoverPoints.length -1].point)
        };

        $scope.hovermove = function ($event) {
            if ($scope.dragging) {
                var mousePoint =
                    projection.invert([$event.offsetX, $event.offsetY]);


                $scope.mousePoint = mousePoint;

                var closestPoint = _.min(hoverPoints, function (point) {
                    return haversine(point.point, mousePoint);
                });

                $scope.closestPixels = projection(closestPoint.point);

                $scope.speed = speed[closestPoint.index];



                $scope.speedHeat = heatScale($scope.speed);
            }
        };

        $scope.hovermarkerMoveStart = function ($event) {
            $scope.dragging = true;

            $event.preventDefault();
        };

        $scope.hovermarkerMoveEnd = function () {
            $scope.dragging = false;
        };


    });