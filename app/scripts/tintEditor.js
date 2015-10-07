'use strict';

var $ = require('jquery');
var Tint = require('./tint.js');
var Util = require('./util.js');
var tc = require('tinycolor');
require('spectrum')($);
require('bootstrap-sass');

// accept user input as text or from a colorpicker to generate colors
// present detailed info on the color, and produce new colors
// from various constraints for text and details
var TintEditor = function(opts) {
  opts = opts || {};
  opts.colorpicker = opts.colorpicker || {};
  var _this = this;

  this.tint = opts.tint || new Tint('black');
  this.format = opts.format || 'hswl';

  if (opts.container) {
    this.$container = $(opts.container);
  }

  // initialize the color picker
  this.$colorpicker = $('<div>', {
    'class': 'te-colorpicker'
  });
  this.$container.append(this.$colorpicker);
  this.$colorpicker.spectrum({
    color: this.tint.toStr(),
    theme: 'sp-mint',
    flat: true,
    showInput: false,
    showButtons: false,
    showInitial: true,
    move: function (color) {
      _this.setTint(new Tint(color.toRgb()));
    }
  });
  this.$container.text('Clicky clicky');
  this.$container.popover({
    html: this.$colorpicker.html()
  });


  // event handlers
  // --------------

  // color input
  this.$input.on('change', function() {
    var raw = $(this).val();
    if (raw) {
      var newTint = new Tint(raw);
      _this.setTint(newTint, newTint.tiny.getFormat());
    }
  });
};

TintEditor.prototype = {
  // change the tint and update all displayed objects
  setTint: function (tintOrColorString, format) {
    this.tint = new Tint(tintOrColorString);
    this.format = format || this.tint.tiny.getFormat();
    this._update();
  },

  // update the various color displays
  _update: function () {
  },

  // update the input box when colorpicker changes
  _updateInput: function () {
    var str;
    if (this.format === 'hswl') { // todo - fix this hack properly
      str = this.tint.tiny.toHswlString();
    } else {
      str = this.tint.tiny.toString(this.format);
    }
    this.$input.val(str);
  },


  // set the colorpicker to the current color
  updateColorpicker: function () {
    if (this.$colorpicker) {
      this.$colorpicker.spectrum('set', this.tint.tiny.toRgb());
    }
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
