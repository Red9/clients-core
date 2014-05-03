define(['vendor/jquery', 'vendor/history',
    'vendor/URI'
], function($, History, URI) {
    function sandboxHistory(sandbox) {
        var historyChanging = false;

        function pushHistoryState(stateObj, title, url) {
            if (historyChanging !== 'true') {
                History.pushState(stateObj, title, url);
            }
        }
        function getCurrentHistory() {
            var State = History.getState(); // Note: We are using History.getState() instead of event.state
            var uri = URI(State.url);

            var uuidMatch = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;

            return {
                url: State.url,
                path: uri.path(),
                normalizedPath: uri.path().replace(uuidMatch, ':id'),
                query: uri.query(true),
                resource: uri.directory(),
                id: uri.filename()
            };
        }
        function onHistoryChange() {
            historyChanging = true;
            var $progressBar = $('#pageloaderspinner');
            $progressBar.show('fast').toggleClass('active');
            // Bound to StateChange Event

            var state = getCurrentHistory();

            sandbox.initiateResourceFocusedEvent(state.resource.substring(1), // remove leading '/'
                    state.id,
                    state.query['focus.starttime'], state.query['focus.endtime'],
                    function() {
                        $progressBar.hide('fast').toggleClass('active');
                        historyChanging = false;
                    });
        }

        function resourceFocused(type, id, startTime, endTime) {
            var uri = URI();
            if (typeof type !== 'undefined' && typeof id !== 'undefined') {
                uri.directory(type);
                uri.filename(id);
            } else { // Default to dataset ID
                throw 'Must define a resource type and id to focus on.';
            }

            var focus = {};
            if (typeof startTime !== 'undefined') {
                focus['focus.starttime'] = startTime;
            }

            if (typeof endTime !== 'undefined') {
                focus['focus.endtime'] = endTime;
            }

            uri.query(focus);
            pushHistoryState(null, 'Focusing on ' + type + ' ' + id, uri.toString());
        }

        function forceHistoryLoad(){
            onHistoryChange();
        }

        History.Adapter.bind(window, 'statechange', onHistoryChange); // Note: We are using statechange instead of popstate

        sandbox.getCurrentHistory = getCurrentHistory;
        sandbox.forceHistoryLoad = forceHistoryLoad;
        sandbox.resourceFocused = resourceFocused;

    }
    return sandboxHistory;
});