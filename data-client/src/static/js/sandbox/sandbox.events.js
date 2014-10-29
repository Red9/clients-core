define(['vendor/jquery', 'vendor/underscore'
], function($, _) {
    function sandboxEvents(sandbox) {
        sandbox.initiateVideoTimeEvent = function(videoTime) {
            var eventName = 'totalState-video-time';
            initiateEvent(eventName, {videoTime: videoTime});
        };
        sandbox.initiateHoverTimeEvent = function(hoverTime) {
            var eventName = 'totalState-hover-time';
            initiateEvent(eventName, {hoverTime: hoverTime});
        };
        sandbox.initiateResourceDeletedEvent = function(type, id) {
            var eventName = 'totalState-resource-deleted';
            initiateEvent(eventName, {type: type, id: id});
        };

        sandbox.initiateResourceCreatedEvent = function(type, resource) {
            var eventName = 'totalState-resource-created';
            initiateEvent(eventName, {type: type, resource: resource});
        };

        sandbox.initiateResourceFocusedEvent = function(type, id, startTime, endTime) {
            // Let's set the history on this one...
            sandbox.resourceFocused(type, id, startTime, endTime);
        };






        //----------------------------------------------------------------------
        // PRIVATE
        //----------------------------------------------------------------------
        function initiateEvent(eventName, parameters) {
            $(sandbox).trigger(eventName, parameters);
        }

        sandbox.internalResourceFocusedEvent = function(type, id, startTime, endTime, callbackDone) {
            var eventName = 'totalState-resource-focused';

            // Fill callback done with a sensible default if the caller doesn't care.
            if (typeof callbackDone !== 'function') {
                callbackDone = function() {
                };
            }

            if (type === 'event') {
                console.log('Focusing on resource ' + id);
                sandbox.get(type, {id: id}, function(eventList) {
                    sandbox.get('dataset', {id: eventList[0].datasetId}, function(dataset) {
                        startTime = eventList[0].startTime;
                        endTime = eventList[0].endTime;
                        sandbox.getPanel(dataset[0].id, startTime, endTime, true, function(panel) {
                            sandbox.setPageTitle('Event: ' + eventList[0].type);

                            sandbox.focusState.dataset = undefined;
                            sandbox.focusState.minStartTime = dataset[0].startTime;
                            sandbox.focusState.maxEndTime = dataset[0].endTime;
                            sandbox.focusState.startTime = startTime;
                            sandbox.focusState.endTime = endTime;
                            sandbox.focusState.event = eventList[0];
                            sandbox.focusState.panel = panel;

                            initiateEvent(eventName,
                                    {
                                        type: type,
                                        id: id,
                                        panel: panel
                                    });
                            callbackDone();
                        });
                    });
                });
            } else if (type === 'dataset') {
                console.log('############# A');
                sandbox.get(type, {id: id}, function(datasetList) {
                    console.log('############# B');
                    //if (typeof datasetList[0].headPanel === 'undefined'){
                    //    // Removed this second check for DW-246.
                    //        //|| _.keys(datasetList[0].headPanel.summaryStatistics).length === 0) {
                    //    // For the case when the the dataset has just been
                    //    // uploaded, and processing is not done yet.
                    //    setTimeout(function() {
                    //        sandbox.initiateResourceFocusedEvent(type, id, startTime, endTime, callbackDone);
                    //    }, 1000);
                    //    return;
                    //}
                    var cache = typeof startTime === 'undefined' && typeof endTime === 'undefined';
                    if (typeof startTime === 'undefined') {
                        startTime = datasetList[0].startTime;
                    }
                    if (typeof endTime === 'undefined') {
                        endTime = datasetList[0].endTime;
                    }
                    sandbox.getPanel(datasetList[0].id, startTime, endTime, cache, function(panel) {
                        console.log('############# C');
                        sandbox.setPageTitle(datasetList[0].title);

                        sandbox.focusState.dataset = datasetList[0];
                        sandbox.focusState.minStartTime = datasetList[0].startTime;
                        sandbox.focusState.maxEndTime = datasetList[0].endTime;
                        sandbox.focusState.startTime = startTime;
                        sandbox.focusState.endTime = endTime;
                        sandbox.focusState.panel = panel;
                        sandbox.focusState.event = undefined;

                        initiateEvent(eventName,
                                {
                                    type: type,
                                    id: id,
                                    panel: panel
                                });
                        callbackDone();
                    });
                }, ['owner']);
            }
        };
    }
    return sandboxEvents;
});