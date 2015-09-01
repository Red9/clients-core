angular
    .module('redComponents.visualizations.video', [
        'youtube-embed',
        'lodash',
        'redComponents.api'
    ])
    .directive('redvideo', function () {
        return {
            restrict: 'E',
            scope: {
                slides: '=',
                videos: '=',
                time: '=',
                windowStartTime: '=',
                windowEndTime: '='
            },
            templateUrl: '/components/visualizations/video/video.html',
            controller: function ($scope, $interval, $timeout, _, api) {
                $scope.video = $scope.videos[0]; // Default to the first video.

                $scope.playerOptions = {
                    html5: 1, // Force HTML5.
                    modestbranding: 1, // Hide as much YouTube stuff as possible
                    showinfo: 0, // Don't show extra info at video start
                    //controls: 2, // Slight performance improvement.
                    rel: 0 // Don't show related videos
                    //TODO: Should specify the "origin" option to prevent cross origin security problems.
                };

                /** Calculate the closest index in the timeList from desiredTime.
                 * Duplicate!
                 * @param timeList
                 * @param desiredTime
                 * @returns {*}
                 */
                function estimateIndex(timeList, desiredTime) {
                    var step = (_.last(timeList) - _.first(timeList)) / timeList.length;
                    return Math.round((desiredTime - _.first(timeList)) / step);
                }

                var playerWatchInterval = null;

                function estimatePlayerTime() {
                    var playerMilliseconds = Math.floor($scope.player.getCurrentTime() * 1000);
                    return playerMilliseconds + $scope.video.startTime;
                }

                function playing() {
                    var playerTime = estimatePlayerTime();
                    var index = estimateIndex($scope.time, playerTime);
                    $scope.slides.video = new Date($scope.time[index]);

                    if (playerTime > $scope.windowEndTime) {
                        setPlayerToWindow();
                    }
                }

                $scope.$on('youtube.player.playing', function ($event, player) {
                        // play it again
                        player.playVideo();

                        console.log('Player playing!');

                        // Make sure we're not already playing. Eg, when user seeks
                        // to new time that's a new "playing" event without a pause.
                        if (!playerWatchInterval) {
                            playerWatchInterval = $interval(playing, 250);
                            // Set to 250, since that's the rate at which YT
                            // changes the result. This means that, at a speed of 0.25,
                            // we get a resolution of +-1/16 second. (or is it 1/32?)
                        }
                    }
                );

                function cancelUpdates() {
                    $interval.cancel(playerWatchInterval);
                    playerWatchInterval = null;
                    //$scope.slides.video = null;
                }

                function setPlayerToWindow() {
                    var playerTime = estimatePlayerTime();
                    if (playerTime < $scope.windowStartTime ||
                        playerTime > $scope.windowEndTime) {
                        var seekPosition = ($scope.windowStartTime - $scope.video.startTime) / 1000;
                        if (seekPosition < 0) {
                            seekPosition = 0;
                        }

                        console.log('Starting seek to position ' + seekPosition);

                        var previousState = $scope.player.getPlayerState();
                        $scope.player.seekTo(seekPosition, true);

                        // The player automatically starts playing, but it should
                        // only play if it was already playing.
                        if (previousState !== 1) {
                            $scope.player.pauseVideo();
                        }
                    }
                }

                // For initial load
                $scope.$watch('player.playVideo', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        setPlayerToWindow();

                        // This runs on the first time the player is loaded,
                        // so after everything is set up we'll go ahead and
                        // add watches for when the user zooms around.
                        $scope.$watch('windowStartTime', setPlayerToWindow);
                        $scope.$watch('windowEndTime', setPlayerToWindow);
                    }
                });

                $scope.$on('youtube.player.ended', cancelUpdates);
                $scope.$on('youtube.player.paused', cancelUpdates);

                $scope.$on('video.sync.frame', function ($event, time) {
                    console.log('sync to time: ' + time);
                    console.dir(time);

                    if ($scope.player) {
                        var playerMilliseconds = Math.floor($scope.player.getCurrentTime() * 1000);

                        // Is this safe if it's already wrapped?
                        $scope.video = new api.video($scope.video);
                        $scope.video.$update({startTime: time - playerMilliseconds});

                    } else {
                        throw new Error('No YouTube player available. Cannot sync!');
                    }
                });

                cancelUpdates(); // Set videoHover initial
            }
        };
    });
