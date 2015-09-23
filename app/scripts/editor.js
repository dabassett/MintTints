'use strict';

var $ = require('jquery');
var Tint = require('./tint.js');
var Util = require('./util.js');

// displays detailed information about colors
var TintEditor = function(opts) {
  opts = opts || {};
  this.tint = opts.tint || new Tint('black');
  this.$container = $(opts.container || $('html'));
  this.$red = $(opts.red || this.$container.find('.stat-red'));
  this.$green = $(opts.green || this.$container.find('.stat-green'));
  this.$blue = $(opts.blue || this.$container.find('.stat-blue'));
  this.$hue = $(opts.hue || this.$container.find('.stat-hue'));
  this.$saturation = $(opts.saturation || this.$container.find('.stat-sat'));
  this.$luminance = $(opts.luminance || this.$container.find('.stat-lum'));
  this.$contrast = $(opts.contrast || this.$container.find('.stat-contrast'));
};

TintEditor.prototype = {
  update: function (tint) {
    this.tint = tint || this.tint;
    this.$red.valOrText(this.tint.r);
    this.$green.valOrText(this.tint.g);
    this.$blue.valOrText(this.tint.b);
    this.$hue.valOrText(Util.round(this.tint.h, 0));
    this.$saturation.valOrText(Util.round(this.tint.s, 4));
    this.$luminance.valOrText(Util.round(this.tint.wl, 4));
    this.$contrast.valOrText(Util.round(this.tint.maxContrast(), 1));
  }
};

// jQuery plugins
// --------------
$.fn.valOrText = function(text) {
  var out;
  if ($(this).is('input')) {
    out = $(this).val(text);
  } else {
    out = $(this).text(text);
  }
  if (typeof text === 'undefined') {
    return this;
  }
  return out;
};

module.exports = TintEditor;
