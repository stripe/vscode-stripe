(function () {
    'use strict';
    angular.module('umbraco.filters', []);
    'use strict';
    angular.module('umbraco.filters').filter('compareArrays', function () {
        return function inArray(array, compareArray, compareProperty) {
            var result = [];
            angular.forEach(array, function (arrayItem) {
                var exists = false;
                angular.forEach(compareArray, function (compareItem) {
                    if (arrayItem[compareProperty] === compareItem[compareProperty]) {
                        exists = true;
                    }
                });
                if (!exists) {
                    result.push(arrayItem);
                }
            });
            return result;
        };
    });
    'use strict';
    // Filter to take a node id and grab it's name instead
    // Usage: {{ pickerAlias | ncNodeName }}
    // Cache for node names so we don't make a ton of requests
    var ncNodeNameCache = {
        id: '',
        keys: {}
    };
    angular.module('umbraco.filters').filter('ncNodeName', function (editorState, entityResource) {
        function formatLabel(firstNodeName, totalNodes) {
            return totalNodes <= 1 ? firstNodeName    // If there is more than one item selected, append the additional number of items selected to hint that
 : firstNodeName + ' (+' + (totalNodes - 1) + ')';
        }
        return function (input) {
            // Check we have a value at all
            if (input === '' || input.toString() === '0') {
                return '';
            }
            var currentNode = editorState.getCurrent();
            // Ensure a unique cache per editor instance
            var key = 'ncNodeName_' + currentNode.key;
            if (ncNodeNameCache.id !== key) {
                ncNodeNameCache.id = key;
                ncNodeNameCache.keys = {};
            }
            // MNTP values are comma separated IDs. We'll only fetch the first one for the NC header.
            var ids = input.split(',');
            var lookupId = ids[0];
            // See if there is a value in the cache and use that
            if (ncNodeNameCache.keys[lookupId]) {
                return formatLabel(ncNodeNameCache.keys[lookupId], ids.length);
            }
            // No value, so go fetch one 
            // We'll put a temp value in the cache though so we don't 
            // make a load of requests while we wait for a response
            ncNodeNameCache.keys[lookupId] = 'Loading...';
            var type = lookupId.indexOf('umb://media/') === 0 ? 'Media' : lookupId.indexOf('umb://member/') === 0 ? 'Member' : 'Document';
            entityResource.getById(lookupId, type).then(function (ent) {
                ncNodeNameCache.keys[lookupId] = ent.name;
            });
            // Return the current value for now
            return formatLabel(ncNodeNameCache.keys[lookupId], ids.length);
        };
    }).filter('ncRichText', function () {
        return function (input) {
            return $('<div/>').html(input).text();
        };
    });
    'use strict';
    /**
* @ngdoc filter
* @name umbraco.filters.preserveNewLineInHtml
* @description 
* Used when rendering a string as HTML (i.e. with ng-bind-html) to convert line-breaks to <br /> tags
**/
    angular.module('umbraco.filters').filter('preserveNewLineInHtml', function () {
        return function (text) {
            if (!text) {
                return '';
            }
            return text.replace(/\n/g, '<br />');
        };
    });
    'use strict';
    angular.module('umbraco.filters').filter('safe_html', [
        '$sce',
        function ($sce) {
            return function (text) {
                return $sce.trustAsHtml(text);
            };
        }
    ]);
    'use strict';
    angular.module('umbraco.filters').filter('timespan', function () {
        return function (input) {
            var sec_num = parseInt(input, 10);
            var hours = Math.floor(sec_num / 3600);
            var minutes = Math.floor((sec_num - hours * 3600) / 60);
            var seconds = sec_num - hours * 3600 - minutes * 60;
            if (hours < 10) {
                hours = '0' + hours;
            }
            if (minutes < 10) {
                minutes = '0' + minutes;
            }
            if (seconds < 10) {
                seconds = '0' + seconds;
            }
            var time = hours + ':' + minutes + ':' + seconds;
            return time;
        };
    });
    'use strict';
    /**
 * @ngdoc filter
 * @name umbraco.filters.filter:truncate
 * @namespace truncateFilter
 * 
 * param {any} wordwise if true, the string will be cut after last fully displayed word.
 * param {any} max max length of the outputtet string
 * param {any} tail option tail, defaults to: ' ...'
 *
 * @description
 * Limits the length of a string, if a cut happens only the string will be appended with three dots to indicate that more is available.
 */
    angular.module('umbraco.filters').filter('truncate', function () {
        return function (value, wordwise, max, tail) {
            if (!value)
                return '';
            max = parseInt(max, 10);
            if (!max)
                return value;
            if (value.length <= max)
                return value;
            value = value.substr(0, max);
            if (wordwise) {
                var lastspace = value.lastIndexOf(' ');
                if (lastspace != -1) {
                    value = value.substr(0, lastspace);
                }
            }
            return value + (tail || (wordwise ? ' \u2026' : '\u2026'));
        };
    });
    'use strict';
    /**
 * @ngdoc filter
 * @name umbraco.filters.filter:umbWordLimit
 * @namespace umbWordLimitFilter
 *
 * @description
 * Limits the number of words in a string to the passed in value
 */
    (function () {
        'use strict';
        function umbWordLimitFilter() {
            return function (collection, property) {
                if (!angular.isString(collection)) {
                    return collection;
                }
                if (angular.isUndefined(property)) {
                    return collection;
                }
                var newString = '';
                var array = [];
                array = collection.split(' ', property);
                array.length = property;
                newString = array.join(' ');
                return newString;
            };
        }
        angular.module('umbraco.filters').filter('umbWordLimit', umbWordLimitFilter);
    }());
}());