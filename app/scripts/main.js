'use strict';

global.jQuery = require('jquery');
var $ = global.jQuery;
require('bootstrap-sass');
var PaletteDecorator = require('./paletteDecorator.js');

$(function() {
  // initialize the palette builder
  var palette = new PaletteDecorator({
    container: '.palette'
  });
});
