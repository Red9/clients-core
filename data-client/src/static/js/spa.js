require(['sandbox', 'vendor/jquery', 'vendor/underscore', 'vendor/bootstrap.old'], function(sandbox, $, _) {

    sandbox.buildSandbox();
    sandbox.requestTemplate('spa.bottombar.panel', function(template) {

        $('#fixedBottomBarDiv').html(template({}));
        sandbox.init();

        $('#navbar-fixed-bottom-layout-button').on('click', function(element) {
            sandbox.showModal('layouteditor', {});
        });

        $('#navbar-fixed-bottom-comments-button').on('click', function(element) {
            sandbox.showModal('comments', {});
        });

        $(sandbox).on('totalState-resource-focused', function(event, parameters) {
            // Update with the number of comments
            sandbox.get('comment', {resourceType: 'dataset', resourceId: sandbox.getCurrentDatasetId()}, function(commentList) {
                var length = commentList.length === 0 ? '' : commentList.length;
                $('#navbar-fixed-bottom-comments-button').parent().find('.badge').text(length);
            });
        });

        $('#navbar-fixed-bottom-dataset-properties-button').on('click', function(element) {
            sandbox.showModal('resourcedetails', {
                type: 'dataset',
                id: sandbox.getCurrentDatasetId()
            });
        });

        $('#navbar-fixed-bottom-edit-dataset-button').on('click', function(element) {
            sandbox.displayEditResourceDialog('dataset', sandbox.getCurrentDatasetId());
        });

        $('#navbar-fixed-bottom-create-event-button').on('click', function(element) {
            sandbox.showModal('modifyresource', {
                resourceAction: 'create',
                resourceType: 'event',
                resource: {//defaults
                    startTime: sandbox.focusState.startTime,
                    endTime: sandbox.focusState.endTime,
                    datasetId: sandbox.getCurrentDatasetId()
                }
            });

        });
        $('[data-name=navbar-fixed-bottom-zoom-button]').on('click', function() {
            var zoom = sandbox.calculateZoom($(this).data('direction'));
            sandbox.initiateResourceFocusedEvent('dataset', sandbox.getCurrentDatasetId(),
                    zoom.startTime, zoom.endTime);
        });
    });
});
