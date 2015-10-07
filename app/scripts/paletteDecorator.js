'use strict';

var $ = require('jquery');
var tc = require('tinycolor');
var Palette = require('./palette.js');
var TintEditor = require('./tintEditor.js');
require('spectrum')($);
require('bootstrap-sass');

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
};

// refer the prototype back to the parent
PaletteDecorator.prototype = Object.create(Palette.prototype);

// Set the "constructor" property
PaletteDecorator.prototype.constructor = PaletteDecorator;

// add some bootstrap flair
PaletteDecorator.prototype.decorate = function() {
  var _this = this;
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
      placement: 'auto bottom'
    })
      .on('inserted.bs.popover', $.proxy(this._createColorpicker, this));

};

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
};

PaletteDecorator.prototype._updateColorField = function (colorStr) {
  if (this.$colorfield) {
    this.$colorfield.css({
      background: colorStr
    });
  }
}

PaletteDecorator.prototype.setCurrentTint = function (tint) {
  Palette.prototype.setCurrentTint.call(this, tint);
  this._updateColorpicker(tint.rawColor);
  this._updateColorField(tint.rawColor);
};

PaletteDecorator.prototype.setSwatchBaseColor = function (color) {
  Palette.prototype.setSwatchBaseColor.call(this, color);
  this._updateColorpicker(color);
  this._updateColorField(color);
};

module.exports = PaletteDecorator;
