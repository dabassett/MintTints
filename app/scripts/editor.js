'use strict';

var $ = require('jquery');
var Tint = require('./tint.js');
var Util = require('./util.js');
var tc = require('tinycolor');
require('spectrum');

// accept user input as text or from a colorpicker to generate colors
// present detailed info on the color, and produce new colors
// from various constraints for text and details
var TintEditor = function(opts) {
  opts = opts || {};
  var _this = this;

  this.tint = opts.tint || new Tint('black');
  this.format = opts.format || 'hswl';
  this.$container = $(opts.container || $('html'));
  this.$red = $(opts.red || this.$container.find('.te-red'));
  this.$green = $(opts.green || this.$container.find('.te-green'));
  this.$blue = $(opts.blue || this.$container.find('.te-blue'));
  this.$hue = $(opts.hue || this.$container.find('.te-hue'));
  this.$saturation = $(opts.saturation || this.$container.find('.te-sat'));
  this.$luminance = $(opts.luminance || this.$container.find('.te-lum'));
  this.$contrast = $(opts.contrast || this.$container.find('.te-contrast'));
  this.$textSample = $(opts.textSample || this.$container.find('.te-text-sample'));
  this.$lgText = $(opts.lgText || this.$container.find('.te-lg-text'));
  this.$mdText = $(opts.mdText || this.$container.find('.te-md-text'));
  this.$smText = $(opts.smText || this.$container.find('.te-sm-text'));
  this.$lgContrast = $(opts.lgContrastInput || this.$container.find('input.te-large'));
  this.$mdContrast = $(opts.mdContrastInput || this.$container.find('input.te-medium'));
  this.$smContrast = $(opts.smContrastInput || this.$container.find('input.te-small'));
  this.$hex = $(opts.hex || this.$container.find('.te-hex'));
  this.$rgb = $(opts.rgb || this.$container.find('.te-rgb'));
  this.$hsl = $(opts.hsl || this.$container.find('.te-hsl'));
  this.$hsv = $(opts.hsv || this.$container.find('.te-hsv'));
  this.$hswl = $(opts.hswl || this.$container.find('.te-hswl'));
  this.$input = $(opts.input || this.$container.find('.te-input'));


  // initialize the color picker
  if (opts.colorpicker) {
    this.$colorpicker = this.$container.find(opts.colorpicker);
    this.$colorpicker.spectrum({
        color: tc.random().toHexString(),
        theme: 'sp-mint',
        flat: true,
        showInput: false,
        showButtons: false,
        showInitial: true,
        move: function (color) {
          _this.setTint(new Tint(color.toRgb()));
        }
    });
  } else {
    this.$colorpicker = false;
  }

  // event handlers

  // text contrast inputs
  this.$lgContrast.on('change', function() {
    _this.updateDemo();
  });

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
  // change the tint and update all outputs
  setTint: function (newTint, format) {
    this.tint = newTint;
    this.format = format || this.format;
    this.updateStats();
    this.updateColorpicker();
    this.updateDemo();
    this.updateInput();
  },

  // update the input box when colorpicker changes
  updateInput: function () {
    console.log('updateInput()');
    var str;
    if (this.format === 'hswl') { // todo - fix this hack properly
      str = this.tint.tiny.toHswlString();
    } else {
      str = this.tint.tiny.toString(this.format);
    }
    this.$input.val(str);
  },

  // temp name until functional
  updateStats: function () {
    this.$hex.valOrText(this.tint.tiny.toString('hex'));
    this.$rgb.valOrText(this.tint.tiny.toString('rgb'));
    this.$hsl.valOrText(this.tint.tiny.toString('hsl'));
    this.$hsv.valOrText(this.tint.tiny.toString('hsv'));
    this.$hswl.valOrText(this.tint.tiny.toHswlString()); // todo - fix this hack properly
    this.$contrast.valOrText(Util.round(this.tint.maxContrast(), 1));
  },

  // set the colorpicker to the current color
  updateColorpicker: function () {
    if (this.$colorpicker) {
      this.$colorpicker.spectrum('set', this.tint.tiny.toRgb());
    }
  },

  // update the demo box, colorpicker and stats display when any of
  // the inputs are changed
  updateDemo: function() {
    var lgTextTint = this.tint.contrastColor(this.$lgContrast.val());
    var mdTextTint = this.tint.contrastColor(this.$mdContrast.val());
    var smTextTint = this.tint.contrastColor(this.$smContrast.val());
    this.$textSample.css({
      'background-color': this.tint.toStr()
    });
    this.$lgText.css({
      'color': lgTextTint.toStr()
    });
    this.$mdText.css({
      'color': mdTextTint.toStr()
    });
    this.$smText.css({
      'color': smTextTint.toStr()
    });
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
