// Load analytics stuff
/* jshint ignore:start */
window.analytics = window.analytics || [], window.analytics.methods = ["identify", "group", "track", "page", "pageview", "alias", "ready", "on", "once", "off", "trackLink", "trackForm", "trackClick", "trackSubmit"], window.analytics.factory = function (t) {
    return function () {
        var a = Array.prototype.slice.call(arguments);
        return a.unshift(t), window.analytics.push(a), window.analytics;
    };
};
for (var i = 0; i < window.analytics.methods.length; i++) {
    var key = window.analytics.methods[i];
    window.analytics[key] = window.analytics.factory(key)
}
window.analytics.load = function (t) {
    if (!document.getElementById("analytics-js")) {
        var a = document.createElement("script");
        a.type = "text/javascript", a.id = "analytics-js", a.async = !0, a.src = ("https:" === document.location.protocol ? "https://" : "http://") + "cdn.segment.com/analytics.js/v1/" + t + "/analytics.min.js";
        var n = document.getElementsByTagName("script")[0];
        n.parentNode.insertBefore(a, n);
    }
}, window.analytics.SNIPPET_VERSION = "2.0.9",
    window.analytics.load('FnTPjUuqyF');
/* jshint ignore:end */

// Start the app
L.Icon.Default.imagePath = '/images';
deferredBootstrapper.bootstrap({
    element: document,
    module: 'redApp',
    resolve: {
        // For this section of code we have to do the Angular injection array
        // stuff: ng-annotate doesn't find it, and uglify will mess up the names.
        current: ['$q', '$http', function ($q, $http) {
            $http.defaults.withCredentials = true;

            return $q(function (resolve, reject) {
                $http.get(red9config.apiUrl + '/auth/current')
                    .success(function (data, status) {
                        //analytics.identify(data.user.id, angular.extend({name: data.user.displayName}, data.user));
                        resolve({user: data.user});
                    })
                    .error(function (data, status) {
                        resolve({user: null});
                    });
            });
        }]
    }
});
