angular
    .module('redApp.dataset.summary', [])
    .config(function ($stateProvider) {
        $stateProvider.state('dataset.summary', {
            url: '/summary',
            templateUrl: '/my-client/dataset/summary/summary.html',
            controller: 'DatasetSummaryController',
            accessLevel: 'basic',
            title: 'R9: Summary',
            data: {
                css: '/my-client/dataset/summary/summary.css'
            }
        });
    })
    .controller('DatasetSummaryController', function ($scope, $state, dataset) {
        $scope.dataset = dataset;


        $scope.viewModel = {
            session: {
                distance: dataset.summaryStatistics.distance.path,
                duration: dataset.duration,
                score: 920
            }
        };


        function constructCountLengthSpeedTiles(eventType) {

            var filteredEvents = _.filter(dataset.events, function (event) {
                return event.type === eventType;
            });

            var tiles = [];

            tiles.push({
                value: filteredEvents.length,
                decimals: 0,
                units: '',
                caption: eventType.toLowerCase() + 's'
            });

            var longest = 0;
            try {
                longest = _.max(filteredEvents, function (event) {
                    return event.summaryStatistics.distance.path;
                }).summaryStatistics.distance.path;
            } catch (e) {
            }
            tiles.push({
                value: longest,
                decimals: 0,
                units: 'm',
                caption: 'longest ' + eventType.toLowerCase()
            });


            var speed = 0;
            try {
                speed = _.max(filteredEvents, function (event) {
                    return event.summaryStatistics.gps.speed.maximum;
                }).summaryStatistics.gps.speed.maximum;
            } catch (e) {
            }
            tiles.push({
                value: speed,
                decimals: 1,
                units: 'kn',
                caption: 'fastest ' + eventType.toLowerCase()
            });

            return tiles;
        }

        function constructDistanceTimeSpeedTiles(eventType) {
            var filteredEvents = _.filter(dataset.events, function (event) {
                return event.type === eventType;
            });

            var tiles = [];

            var distance = 0;
            try {
                distance = _.reduce(filteredEvents, function (sum, event) {
                    return sum + event.summaryStatistics.distance.path;
                }, 0);
            } catch (e) {
            }

            tiles.push({
                value: distance,
                decimals: 0,
                units: 'm',
                caption: 'total ' + eventType.toLowerCase() + ' distance'
            });

            var duration = _.reduce(filteredEvents, function (sum, event) {
                return sum + event.duration;
            }, 0);
            tiles.push({
                value: duration,
                units: 'duration',
                caption: 'total ' + eventType.toLowerCase() + ' time'
            });

            var averageSpeed = 0;
            try {
                averageSpeed = _.reduce(filteredEvents, function (sum, event) {
                    return sum + (event.duration * event.summaryStatistics.gps.speed.average);
                }, 0) / duration;
            } catch (e) {
            }
            tiles.push({
                value: averageSpeed,
                decimals: 1,
                units: 'kn',
                caption: 'average ' + eventType.toLowerCase() + ' speed'
            });

            return tiles;
        }

        function constructSessionTiles() {
            var tiles = [];
            tiles.push({
                value: dataset.summaryStatistics.distance.path,
                decimals: 0,
                units: 'm',
                caption: 'total distance'
            });

            tiles.push({
                value: dataset.duration,
                units: 'duration',
                caption: 'total time'
            });

            tiles.push({
                value: 920,
                units: 'points',
                caption: 'R9 Score'
            });
            return tiles;
        }


        if (dataset.sport === 'surf') {
            $scope.viewModel.eventRows = [
                {
                    type: 'Wave',
                    tiles: constructCountLengthSpeedTiles('Wave'),
                    link: function () {
                        $state.go('^.details.event', {type: 'Wave'});
                    }
                },
                {
                    type: 'Paddle',
                    tiles: constructDistanceTimeSpeedTiles('Paddle'),
                    link: function () {
                        $state.go('^.details.event', {type: 'Paddle'});
                    }

                },
                {
                    type: 'Session',
                    tiles: constructSessionTiles(),
                    link: function () {
                        $state.go('^.details.session');
                    }
                }
            ];

            $scope.highlights = _.filter(dataset.events, function (event) {
                return event.type === 'Wave';
            });
        }


        $scope.myInterval = 5000;
        $scope.slides = [
            {
                image: 'https://igcdn-photos-b-a.akamaihd.net/hphotos-ak-xaf1/t51.2885-15/10899537_770375399705953_810718899_n.jpg',
                text: 'rainbow'
            },
            {
                image: 'https://igcdn-photos-f-a.akamaihd.net/hphotos-ak-xaf1/t51.2885-15/10852920_898059813540085_1699410642_n.jpg',
                text: 'pop'
            },
            {
                image: 'https://scontent-ord.cdninstagram.com/hphotos-xfa1/t51.2885-15/10919471_1535050676754814_25895625_n.jpg',
                text: 'barrel'
            },
            {
                image: 'https://igcdn-photos-f-a.akamaihd.net/hphotos-ak-xaf1/t51.2885-15/10958520_1559009321021021_573787603_n.jpg',
                text: 'whoosh'
            }
        ];
    });
