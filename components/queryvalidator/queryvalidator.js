angular
    .module('redComponents.queryValidator', [
        'lodash'
    ])
    .factory('queryValidator', function (_) {
        var idRegex = new RegExp(/([0-9]*)/);
        var csvId = new RegExp('^(' + idRegex.source + ',)*' + idRegex.source + '$');

        return function (model, object) {
            return _.chain(model).mapValues(function (scheme, key){
            //console.log('Testing key: ' + key);
                var result;
                if (_.has(object, key)) {
                    var value = object[key];
                    if (scheme === 'int' && !_.isNaN(parseInt(value, 10))) {
                        result = parseInt(value, 10);
                    } else if (scheme === 'idList' && csvId.test(value)) {
                        result = value;
                    } else if (scheme === 'passthrough') {
                        result = value;
                    }
                }
                return result;
            }).pick(_.identity).value();
        }
    });