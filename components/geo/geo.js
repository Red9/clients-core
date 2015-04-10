angular
    .module('redComponents.geo', [])
    .factory('geo', function () {
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

            return R * c;
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

        return {
            distanceBetween: haversine,
            projectPoint: projectPoint
        };
    });