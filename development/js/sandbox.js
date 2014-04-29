define(['vendor/jquery', 'vendor/underscore', 'vendor/handlebars',
    'vendor/history', 'vendor/async', 'vendor/URI',
    'tileframe',
    'customHandlebarsHelpers'
], function($, _, Handlebars, History, async, URI, tileFrame) {
    var sandbox = {
        currentUser: '',
        apiUrl: '',
        actionUrl: '',
        historyChanging: false,
        definedColorMappings: {
            "gps:altitude": "#FF6347",
            "gps:speed": "#8B4513",
            "gps:satellite": "#4B0082",
            "gps:hdop": "#228B22",
            "rotationrate:x": "#C71585",
            "rotationrate:y": "#32CD32",
            "rotationrate:z": "#4169E1",
            "magneticfield:x": "#FF4500",
            "magneticfield:y": "#3CB371",
            "magneticfield:z": "#191970",
            "pressure:pressure": "#2E8B57",
            "pressure:temperature": "#F4A460",
            "acceleration:x": "#FFA500",
            "acceleration:y": "#6B8E23",
            "acceleration:z": "#0000CD"
        },
        undefinedColorMappings: [
            "#DA70D6",
            "#CD853F",
            "#B0E0E6",
            "#9ACD32"
        ],
        tiles: [
            /*{
             class: 'resourcedetails'
             },
             {
             class: 'eventlist'
             },
             {
             class: 'embeddedvideo'
             },*//*
              {
              class: 'panelspectralentropy',
              configuration: {
              axes: [
              'acceleration:x',
              'acceleration:y',
              'acceleration:z',
              ]
              }
              },*/
            {
                class: 'panelgraph',
                configuration: {
                    axes: [
                        'acceleration:x',
                        'acceleration:y',
                        'acceleration:z'
                    ]
                }
            }, /*
             {
             class: 'paneldistribution',
             configuration: {
             axes: [
             'acceleration:x',
             'acceleration:y',
             'acceleration:z'
             ]
             }
             },
             {
             class: 'panelspectralentropy',
             configuration: {
             axes: [
             'rotationrate:x',
             'rotationrate:y',
             'rotationrate:z',
             ]
             }
             },
             {
             class: 'panelgraph',
             configuration: {
             axes: [
             'rotationrate:x',
             'rotationrate:y',
             'rotationrate:z'
             ]
             }
             },
             {
             class: 'paneldistribution',
             configuration: {
             axes: [
             'rotationrate:x',
             'rotationrate:y',
             'rotationrate:z'
             ]
             }
             },
             {
             class: 'panelspectralentropy',
             configuration: {
             axes: [
             'magneticfield:x',
             'magneticfield:y',
             'magneticfield:z'
             ]
             }
             },
             {
             class: 'panelgraph',
             configuration: {
             axes: [
             'magneticfield:x',
             'magneticfield:y',
             'magneticfield:z'
             ]
             }
             },
             {
             class: 'paneldistribution',
             configuration: {
             axes: [
             'magneticfield:x',
             'magneticfield:y',
             'magneticfield:z'
             ]
             }
             },
             {
             class: 'panelgraph',
             configuration: {
             axes: [
             'gps:speed'
             ]
             }
             },
             {
             class: 'panelspectralentropy',
             configuration: {
             axes: [
             'gps:speed'
             ]
             }
             },
             {
             class: 'paneldistribution',
             configuration: {
             axes: [
             'gps:speed'
             ]
             }
             },
             {
             class: 'panelgraph',
             configuration: {
             axes: [
             'pressure:pressure'
             ]
             }
             }, /*
             {
             class: 'googlemap'
             },
             {
             class: 'summarystatistics'
             }*/
        ],
        templates: {},
        modules: [],
        tileTemplate: '',
        init: function() {
            sandbox.setPageTitle('Red9 Sensor');
            History.Adapter.bind(window, 'statechange', sandbox.onHistoryChange); // Note: We are using statechange instead of popstate

            sandbox.div = $('#sandboxContentDiv');
            sandbox.focusState = undefined;

            sandbox.requestTemplate('sandboxtiletemplate', function(template) {
                sandbox.tileTemplate = template;
                async.eachSeries(sandbox.tiles, sandbox.createTile,
                        function(err) {
                            // First time, so force a history "change"
                            sandbox.onHistoryChange();
                        });
            });
        },
        createTile: function(tile, doneCallback) {
            tileFrame(sandbox, tile, sandbox.tileTemplate, doneCallback);
        },
        createHumanAxesString: function(axesList) {
            var axes = {};
            _.each(axesList, function(axis) {
                var t = axis.split(':');
                var type = t[0];
                var direction = t[1];

                if (_.has(axes, type) === false) {
                    axes[type] = [];
                }
                axes[type].push(direction);
            });


            var axisIndex = 0;
            return _.reduce(axes, function(memo, axisValues, axisName) {
                if (axisIndex > 0) {
                    memo += ' and ';
                }
                memo += axisName + ' ';
                _.each(axisValues, function(v, i) {
                    if (i > 0) {
                        memo += ',';
                    }
                    memo += v;
                });
                axisIndex++;
                return memo;
            }, '');

        },
        trimPanel: function(panel, axes) {
            // Add in default of time
            var resultAxes = [panel.labels[0]];
            var indicies = [0];
            _.each(axes, function(desiredAxis) {
                var index = _.indexOf(panel.labels, desiredAxis);
                if (index !== -1) {
                    resultAxes.push(desiredAxis);
                    indicies.push(index);
                }
            });
            var resultPanel = _.omit(panel, ['labels', 'values']);
            resultPanel.labels = resultAxes;
            resultPanel.values = _.map(panel.values, function(row) {
                var resultRow = [];
                _.each(indicies, function(index) {
                    resultRow.push(row[index]);
                });
                return resultRow;
            });
            return resultPanel;
        },
        get: function(resourceType, constraints, callback, expand) {
            if (typeof expand !== 'undefined') {
                constraints.expand = "";
                _.each(expand, function(value, index) {
                    if (index > 0) {
                        constraints.expand += ',';
                    }
                    constraints.expand += value;
                });
            }

            $.ajax({
                type: 'GET',
                url: sandbox.apiUrl + '/' + resourceType + '/?' + $.param(constraints),
                dataType: 'json',
                success: callback
            });
        },
        getSchema: function(resourceType, callback) {
            $.ajax({
                type: 'GET',
                url: sandbox.apiUrl + '/' + resourceType + '/describe',
                dataType: 'json',
                success: callback
            });
        },
        update: function(resourceType, id, newValues, callback) {
            console.log('resourceType: ' + resourceType);
            console.log('id: ' + id);
            $.ajax({
                type: 'PUT',
                url: sandbox.apiUrl + '/' + resourceType + '/' + id,
                dataType: 'json',
                data: newValues,
                success: function() {
                    callback();
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    callback(textStatus + '---' + errorThrown + ' --- ' + jqXHR.responseText);
                }
            });
        },
        create: function(resourceType, newResource, callback) {
            $.ajax({
                type: 'POST',
                url: sandbox.apiUrl + '/' + resourceType + '/',
                dataType: 'json',
                data: newResource,
                success: function(data) {
                    callback(undefined, data);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    callback(textStatus + '---' + errorThrown + ' --- ' + jqXHR.responseText);
                }
            });
        },
        delete: function(resourceType, id) {
            $.ajax({
                type: 'DELETE',
                url: sandbox.apiUrl + '/' + resourceType + '/' + id,
                dataType: 'json',
                success: function() {
                    sandbox.initiateResourceDeletedEvent(resourceType, id);
                }
            });
        },
        getPanel: function(id, startTime, endTime, cache, callback) {
            var panelParameters = {
                buckets: 1000,
                format: 'json',
                cache: 'off'
            };
            if (typeof startTime !== 'undefined') {
                panelParameters.startTime = startTime;
            }
            if (typeof endTime !== 'undefined') {
                panelParameters.endTime = endTime;
            }
            if (cache === true) {
                panelParameters.cache = 'on';
            }

            $.ajax({
                type: 'GET',
                url: sandbox.apiUrl + '/panel/' + id + '/body/?' + $.param(panelParameters),
                dataType: 'json',
                success: function(panel) {
                    _.each(panel.values, function(row) {
                        row[0] = new Date(row[0]);
                    });
                    callback(panel);
                }
            });
        },
        requestTemplate: function(name, callback) {
            if (typeof sandbox.templates[name] === 'undefined') {
                $.ajax({
                    url: '/templates/' + name + '.html',
                    datatype: 'text/javascript',
                    success: function(response, status, jqXHR) {
                        sandbox.templates[name] = Handlebars.compile(response);
                        callback(sandbox.templates[name]);
                    }

                });
            } else {
                callback(sandbox.templates[name]);
            }
        },
        resourceFocused: function(type, id, startTime, endTime) {
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
            sandbox.pushHistoryState(null, 'Focusing on ' + type + ' ' + id, uri.toString());
        },
        downloadPanelDisplay: function(id) {
            sandbox.get('panel', {id: id}, function(resourceList) {
                if (resourceList.length === 1) {
                    sandbox.showModal('downloadpanel', {
                        resource: resourceList[0]
                    });
                }
            });
        },
        createResourceDisplay: function(type, defaults) {
            sandbox.showModal('modifyresource', {
                resourceAction: 'create',
                resourceType: type,
                resource: defaults
            });
        },
        editResourceDisplay: function(type, id) {
            sandbox.get(type, {id: id}, function(resourceList) {
                if (resourceList.length === 1) {
                    sandbox.showModal('modifyresource',
                            {
                                resourceAction: 'edit',
                                resourceType: type,
                                resource: resourceList[0]
                            });
                }
            });
        },
        initiateEvent: function(eventName, parameters) {
            $(sandbox).trigger(eventName, parameters);
        },
        setPageTitle: function(newTitle) {
            $(document).attr('title', newTitle);
            $('#footer-page-title').text(newTitle);
        },
        initiateVideoTimeEvent: function(videoTime) {
            var eventName = 'totalState.video-time';
            sandbox.initiateEvent(eventName, {videoTime: videoTime});
        },
        initiateHoverTimeEvent: function(hovertime) {
            var eventName = 'totalState.hover-time';
            sandbox.initiateEvent(eventName, {hovertime: hovertime});
        },
        initiateResourceDeletedEvent: function(resource, id) {
            var eventName = 'totalState.resource-deleted';
            sandbox.initiateEvent(eventName, {type: resource, id: id});
        },
        initiateResourceFocusedEvent: function(resource, id, startTime, endTime, callbackDone) {
            var eventName = 'totalState.resource-focused';
            if (resource === 'event') {
                sandbox.get(resource, {id: id}, function(event) {
                    sandbox.get('dataset', {id: event[0].datasetId}, function(dataset) {
                        startTime = event[0].startTime;
                        endTime = event[0].endTime;
                        sandbox.getPanel(dataset[0].headPanelId, startTime, endTime, true, function(panel) {
                            sandbox.setPageTitle('Event: ' + event[0].type);
                            sandbox.focusState = {
                                dataset: dataset[0].id,
                                panel: dataset[0].headPanel.id,
                                minStartTime: dataset[0].headPanel.startTime,
                                maxEndTime: dataset[0].headPanel.endTime,
                                startTime: startTime,
                                endTime: endTime,
                                event: event[0].id
                            };
                            sandbox.initiateEvent(eventName,
                                    {
                                        type: resource,
                                        resource: event[0],
                                        panel: panel
                                    });
                            callbackDone();
                        });
                    }, ['headPanel']);
                });
            } else if (resource === 'dataset') {
                sandbox.get(resource, {id: id}, function(dataset) {
                    var cache = typeof startTime === 'undefined' && typeof endTime === 'undefined';
                    if (typeof startTime === 'undefined') {
                        startTime = dataset[0].headPanel.startTime;
                    }
                    if (typeof endTime === 'undefined') {
                        endTime = dataset[0].headPanel.endTime;
                    }
                    sandbox.getPanel(dataset[0].headPanel.id, startTime, endTime, cache, function(panel) {
                        sandbox.setPageTitle(dataset[0].title);
                        sandbox.focusState = {
                            dataset: dataset[0].id,
                            panel: dataset[0].headPanel.id,
                            minStartTime: dataset[0].headPanel.startTime,
                            maxEndTime: dataset[0].headPanel.endTime,
                            startTime: parseInt(startTime), // Need to parse, since we don't know where it came from...
                            endTime: parseInt(endTime)
                        };
                        sandbox.initiateEvent(eventName,
                                {
                                    type: resource,
                                    resource: dataset[0],
                                    panel: panel
                                });
                        callbackDone();
                    });
                }, ['headPanel', 'owner']);
            }
        },
        pushHistoryState: function(stateObj, title, url) {
            if (sandbox.historyChanging !== 'true') {
                History.pushState(stateObj, title, url);
            }
        },
        onHistoryChange: function() {
            sandbox.historyChanging = true;
            var $progressBar = $('#pageloaderspinner');
            $progressBar.show('fast').toggleClass('active');
            // Bound to StateChange Event
            var State = History.getState(); // Note: We are using History.getState() instead of event.state
            var uri = URI(State.url);
            var query = uri.query(true);
            var resource = uri.directory().substring(1); // remove leading '/'
            var id = uri.filename();
            sandbox.initiateResourceFocusedEvent(resource, id, query['focus.starttime'], query['focus.endtime'],
                    function() {
                        $progressBar.hide('fast').toggleClass('active');
                        sandbox.historyChanging = false;
                    });
        },
        showModal: function(type, parameters) {
            // If modal is already shown, dismiss it first.
            var $modalDiv = $('#modal_div');
            $modalDiv.find('.modal').each(function() {
                $(this).modal('hide');
            });
            $modalDiv.empty();

            require(['modals/' + type], function(newmodal) {
                var mymodal = new newmodal($modalDiv, parameters);
            });
        },
        truncateStringAtWord: function(string, maximumCharacters) {
            // Modified from http://stackoverflow.com/a/1199420
            var tooLong = string.length > maximumCharacters,
                    s_ = tooLong ? string.substr(0, maximumCharacters - 1) : string;
            s_ = tooLong ? s_.substr(0, s_.lastIndexOf(' ')) : s_;
            return  tooLong ? s_ + '&hellip;' : s_;
        }
    };
    return sandbox;
});