requirejs.config({
    noGlobal: true,
    baseUrl: "/static/js",
    paths: {
        customHandlebarsHelpers: 'utilities/customHandlebarsHelpers',
        socketio: (function() {

            if(window.location.hostname === "localdev.redninesensor.com"){
                return 'http://action.localdev.redninesensor.com/socket.io/socket.io';
            }else{
                return 'http://action.redninesensor.com/socket.io/socket.io';
            }

            // Make sure that we request the socket.io script from the correct
            // server.
            /*return 'http://action.'
                    + window.location.hostname
                    + '/socket.io/socket.io';*/
        }())
    },
    shim: {
        'jQuery.validate': [
            'vendor/jquery'
        ],
        customHandlebarsHelpers: [
            'vendor/handlebars'
        ]
    }
});