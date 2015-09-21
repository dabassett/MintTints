// general utilities
// -----------------
'use strict';

var Util = Util || {};

// a somewhat better round
// credit to Jack Moore
// http://www.jacklmoore.com/notes/rounding-in-javascript/
Util.round = function(value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
};

module.exports = Util;
