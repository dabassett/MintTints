'use strict';

var $ = require('jquery');
var tc = require('tinycolor');
var Palette = require('./palette.js');
var TintEditor = require('./tintEditor.js');
require('spectrum')($);
require('bootstrap-sass');
require('jquery-textfill');

// this decorator for the Palette keeps the display code
// and bootstrap dependency neatly seperated from the logic
//  (technically not a decorator because it's only inheriting
//  from Palette, but who's counting anyways?)
var PaletteDecorator = function(opts) {
  opts = opts || {};

  // call parent constructor
  Palette.call(this, opts);

  this.decorate();
  this._updateColorField(this.currentTint.rawColor);
  this._resizeSwatchLabel();
};

// refer the prototype back to the parent
PaletteDecorator.prototype = Object.create(Palette.prototype);

// set the "constructor" property
PaletteDecorator.prototype.constructor = PaletteDecorator;

// add some bootstrap flair
PaletteDecorator.prototype.decorate = function() {
  // editor controls classes
  $('.pa-input').addClass('form-group');

  // button classes
  this.$addButton
    .prepend($('<span>', {
          'class': 'glyphicon glyphicon-plus'
    }));
  this.$removeButton
    .text('')
    .addClass('btn btn-danger')
    .append($('<span>', {
      'class': 'glyphicon glyphicon-trash'
    }));

  // add colorpicker to color input
  this.$colorfield = $('<span>', {
    'class': 'input-group-addon pa-color-field'
  });
  this.inputs.$color
    .wrap($('<div>', {
      'class': 'input-group'
    }))
    .after(this.$colorfield)
    .popover({
      title: 'Select a new color',
      placement: 'auto'
    })
      .on('inserted.bs.popover', $.proxy(this._createColorpicker, this));

  // resize labels to fit swatches on screen resize
  $(window).on('resize', $.proxy(this._resizeSwatchLabel, this));

  // range slider tooltips
  $('input[type=range]').tooltip({
    trigger: 'manual',
    animation: false
  });
  this.$editor
    .on('mouseover.pd change.pd input.pd', 'input[type=range]', $.proxy(this.handlers.showTooltip, this))
    .on('mouseleave.pd', 'input[type=range]', this.handlers.hideTooltip);
};

// set the range control tooltip to track the marker on screen
PaletteDecorator.prototype.handlers.showTooltip = function (event) {
  var $el = $(event.currentTarget);

  if (!$el.prop('disabled')) {
    // update the tooltip text with the slider's current value
    $el
      .attr('data-original-title', this.prettyRangeValue($el))
      .tooltip('show');

    // position the tooltip over the slider marker
    var $tooltip = $el.next('.tooltip');
    var point = ($el.val() - $el.attr('min')) / ($el.attr('max') - $el.attr('min'));
    var offset = $el.position().left - ($tooltip.width() / 2) - (6 * ((point * 2) - 1));
    var position = (point * $el.width()) + offset;

    $tooltip.css({
      left: position
    });
  }
};

PaletteDecorator.prototype.handlers.hideTooltip = function (event) {
  $(event.currentTarget).tooltip('hide');
};

PaletteDecorator.prototype.prettyRangeValue = function (element) {
  var method = element.data('method');
  var val = element.val();
  if (method === 'hueShift') {
    val = val + '\u00B0'; // add degree symbol
  } else if (method === 'satAdjust' || method === 'lumAdjust') {
    val = Math.round(val * 100) + '%';
  } else if (method === 'hueBlend' || method === 'satBlend') {
    val = val + '%';
  }
  return val;
};

// parent function overrides
// ----------------------
PaletteDecorator.prototype.setCurrentTint = function (tint) {
  Palette.prototype.setCurrentTint.call(this, tint);
  this._updateColorpicker(tint.rawColor);
  this._updateColorField(tint.rawColor);
  this._updateTextSample();
};

PaletteDecorator.prototype.setSwatchBaseColor = function (color) {
  Palette.prototype.setSwatchBaseColor.call(this, color);
  this._updateColorpicker(color);
  this._updateColorField(color);
};

PaletteDecorator.prototype.setSwatchAttr = function (attr, value) {
  Palette.prototype.setSwatchAttr.call(this, attr, value);
  this._updateTextSample();
};

PaletteDecorator.prototype.setSwatchName = function (newName) {
  Palette.prototype.setSwatchName.call(this, newName);
  this._resizeSwatchLabel();
};

PaletteDecorator.prototype.setSwatchParent = function (tint) {
  Palette.prototype.setSwatchParent.call(this, tint);
  this._resizeSwatchLabel();
};

// private functions
// -----------------

PaletteDecorator.prototype._createColorpicker = function () {
  this.$colorpicker = $('<div>', { 'class': 'pa-colorpicker' });
  this.$colorpicker
    .appendTo(this.$editor.find('.popover-content'))
    .spectrum({
      color: this.currentTint.rawColor,
      theme: 'sp-mint',
      flat: true,
      showInput: false,
      showButtons: false,
      move: $.proxy(this._updateColorInput, this)
    });
};

PaletteDecorator.prototype._updateColorpicker = function (colorStr) {
  if (this.$colorpicker) {
    this.$colorpicker.spectrum('set', colorStr);
  }
};

PaletteDecorator.prototype._updateColorInput = function (tinycol) {
  this.currentTint.setAttr('rawColor', tinycol.toRgb());
  this.inputs.$color.val(tinycol.toHexString());
  this._updateColorField(tinycol.toHexString());
  this._updateTextSample();
};

PaletteDecorator.prototype._updateColorField = function (colorStr) {
  if (this.$colorfield) {
    this.$colorfield.css({
      background: colorStr
    });
  }
}

PaletteDecorator.prototype._updateTextSample = function () {
  // todo - integrate this better or spin off a new class
  //      - also desperately needs a refactor
  //        -- ALSO Palette.Tint should probably be emitting change events
  var $textSample = $('.te-text-sample');
  var $header1 = $textSample.find('.te-lg-text');
  var $header2 = $textSample.find('.te-md-text');
  var $paragraph = $textSample.find('.te-sm-text');
  if (this.tints[0]) {
    $textSample.css({
      background: this.tints[0].toStr()
    });
  }
  if (this.tints[1]) {
    $header1.css({
      color: this.tints[1].toStr()
    });
  }
  if (this.tints[2]) {
    $header2.css({
      color: this.tints[2].toStr()
    });
  }
  if (this.tints[3]) {
    $paragraph.css({
      color: this.tints[3].toStr()
    });
  }
};

PaletteDecorator.prototype._resizeSwatchLabel = function () {
  this.$swatches.children().textfill({
    minfontPixels: 12,
    maxFontPixels: 22,
    widthOnly: true
  });
};

module.exports = PaletteDecorator;
