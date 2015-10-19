'use strict';

global.jQuery = require('jquery');
var $ = global.jQuery;
var tc = require('tinycolor');
require('bootstrap-sass');
var Tint = require('./tint.js');
var Modal = require('./modal.js');
var PaletteDecorator = require('./paletteDecorator.js');
global.Tint = Tint;
require('spectrum')($);

// jQuery plugins
// --------------
$.fn.addColorLabel = function(color, contrastColor) {
  $('<h4 class="contrast">' + color.toHexString() + '</h4>')
    .appendTo(this)
    .css({
      'color': contrastColor
    });
  return this;
};

$.fn.colorslice = function(tint, hueShift) {
  var n = 7; // todo, maybe make this a param
  var slice = tint.shift({h: hueShift}).colorslice(n);
  $(this).empty();
  for (var i = n - 1; i >= 0; i--) {
    var $row = $('<div class="cs-row"></div>');
    $(this).append($row);
    for (var j = 0; j < n; j++) {
      var $shade = $('<span class="shade"></span>');
      $shade.appendTo($row);
      $shade.css('background-color', slice[i][j].toStr());
      if (i === (n - 1) / 2) {
        $shade.addClass('shade-tall');
      }
      if (j === (n - 1) / 2) {
        $shade.addClass('shade-wide');
      }
    }
  }
  return this;
};

$(function() {
  var colorInfo = new Modal('#color-info');

  // initialize the palette builder
  var palette = new PaletteDecorator({
    container: '.palette'
  });

  function addColorBlock(color) {
    var colors = {};
    colors.orig = color;
    colors.aaaLarge = tc.getReadable(color, {level: 'aaa', size: 'large', returnBestFit: true});

    var $column = $('<div class="col-lg-2 col-md-3 col-sm-4 col-xs-6"></div>').appendTo($('.colors'));

    $('<div class="tint"></div>')
      .appendTo($column)
      .addColorLabel(colors.orig, colors.aaaLarge)
      .css({
        'background': colors.orig.toHexString()
      })
      .hover(function() {
        $(this).css({
          'border-color': colors.aaaLarge.toHexString(),
          'box-shadow': '0 0 5px ' + colors.aaaLarge.toHexString()
        });
      }, function() {
        $(this).css({
          'border-color': 'transparent',
          'box-shadow': ''
        });
      })
      .click(function() {
        colorInfo.build(colors.orig);
        colorInfo.$.modal(); // call bootstrap's modal plugin
      });
  }

  function addColors() {
    // populate the random colors list
    for(var i = 0; i < 48; i++) {
      var randomColor = tc.random();
      addColorBlock(randomColor);
    }
  }

  $('#more-colors').click(function() {
    addColors();
  });

  addColors();
});
