define(['vendor/jquery', 'vendor/underscore', 'vendor/async'
], function($, _, async) {

    function sandboxDatabase(sandbox) {
        var schemas = {
            eventtype: {} // Hack for now. Doesn't actually have a schema.
        };

        sandbox.getSchema = function(resourceType, callback) {
            // Basic cache.
            if (_.has(schemas, resourceType)) {
                callback(schemas[resourceType]);
            } else {
                $.ajax({
                    type: 'GET',
                    url: sandbox.apiUrl + '/' + resourceType + '/describe',
                    dataType: 'json',
                    success: callback
                });
            }
        };
        sandbox.get = function(resourceType, constraints, callback, expand) {
            if (typeof expand !== 'undefined') {
                if(expand.length > 1){
                    alert('Programming error: expand cannot be more than 1. Alert SRLM.');
                }
                if(expand.length === 1){
                    constraints['expand[]'] = expand[0];
                }
            }

            if(_.has(constraints, 'id')){
                constraints.idList = constraints.id;
                delete constraints.id;
            }


            //sandbox.getSchema(resourceType, function(schema) {
                $.ajax({
                    type: 'GET',
                    url: sandbox.apiUrl + '/' + resourceType + '/?' + $.param(constraints),
                    dataType: 'json',
                    success: function(resourceList) {
                        //sandbox.getTimezoneOffset()
                        callback(resourceList);
                    }

                });
            //});
        };
        sandbox.update = function(resourceType, id, newValues, callback) {
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
        };
        sandbox.create = function(resourceType, newResource, callback) {
            $.ajax({
                type: 'POST',
                url: sandbox.apiUrl + '/' + resourceType + '/',
                dataType: 'json',
                data: newResource,
                success: function(data) {
                    callback(undefined, data);
                    sandbox.initiateResourceCreatedEvent(resourceType, data);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    callback(textStatus + '---' + errorThrown + ' --- ' + jqXHR.responseText);
                }
            });
        };


        function deleteIndividual(resourceType, id, callback) {
            $.ajax({
                type: 'DELETE',
                url: sandbox.apiUrl + '/' + resourceType + '/' + id,
                dataType: 'json',
                success: function() {
                    callback();
                },
                error: function() {
                    callback('error');
                }
            });
        }

        /** Deletes the resource, and initiates a resource-deleted event
         * when complete.
         *
         * @param {type} resourceType The type, such as 'dataset' or 'event'.
         * @param {type} id A single ID, or array of IDs.
         */
        sandbox.delete = function(resourceType, id) {
            if (_.isArray(id) === false) {
                deleteIndividual(resourceType, id, function() {
                    sandbox.initiateResourceDeletedEvent(resourceType, id);
                });
            } else {
                if (id.length > 0) { // Best not do anything for empty arrays
                    async.reduce(id, [],
                            function(memo, i, callback) {
                                deleteIndividual('event', i, function(err) {
                                    if (typeof err === 'undefined') {
                                        memo.push(i);
                                    }
                                    callback(null, memo);
                                });
                            },
                            function(err, result) {
                                sandbox.initiateResourceDeletedEvent(resourceType, result);
                            });
                }
            }

        };
        sandbox.getPanel = function(id, startTime, endTime, cache, callback) {
            // Added in a small optimization here to use the new server side caching scheme.
            var panelUrl;
            if (typeof startTime !== 'undefined' || typeof endTime !== 'undefined') {
                var panelParameters = {
                    rows: 1000
                };
                if (typeof startTime !== 'undefined') {
                    panelParameters.startTime = startTime;
                }
                if (typeof endTime !== 'undefined') {
                    panelParameters.endTime = endTime;
                }
                panelUrl = sandbox.apiUrl + '/dataset/' + id + '/json?' + $.param(panelParameters);
            } else{
                panelUrl = sandbox.apiUrl + '/dataset/' + id + '/json?size=lg';
            }

            $.ajax({
                type: 'GET',
                url: panelUrl,
                dataType: 'json',
                success: function(panel) {
                    _.each(panel.values, function(row) {
                        row[0] = new Date(row[0]);
                    });
                    callback(panel);
                }
            });
        };
    }
    return sandboxDatabase;


});