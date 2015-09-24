'use strict';

var $ = require('jquery');
require('bootstrap-sass');
var Util = require('./util.js');
var Tint = require('./tint.js');
var TintEditor = require('./editor.js');

// logic for the color info modal
var Modal = function (selector) {
  this.selector = selector;
  this.$ = $(selector);
  this.header = this.$.find('.modal-header');
  this.body = this.$.find('.modal-body');
  this.title = this.$.find('.modal-title');
  this.$stats = this.$.find('.stats');
  this.editor = new TintEditor({container: this.$});
  this.samples = this.$.find('.text-samples');
  this.aaLarge = this.$.find('#aa-large');
  this.aaaLarge = this.$.find('#aaa-large');
  this.aaaSmall = this.$.find('#aaa-small');
};

Modal.prototype = {
  build: function (tint) {
    tint = new Tint(tint);

    var colors = {};
    colors.aaLarge = tint.contrastColor(3);
    colors.aaaLarge = tint.contrastColor(4.5);
    colors.aaaSmall = tint.contrastColor(7);
    colors.dark = tint.set({s: tint.s * 0.5, wl: tint.wl * 0.25});
    colors.darkText = colors.dark.contrastColor(6);
    colors.light = tint.set({s: tint.s * 0.5, wl: tint.wl + ((1 - tint.wl) * 0.5)});
    colors.divider = '2px solid ' + colors.aaaLarge.toStr();
    this.header.css({
      'background-color': tint.toStr(),
      'border-bottom': colors.divider
    });
    this.title.css('color', colors.aaaLarge.toStr());
    this.title.text('Information for ' + tint.toStr());

    this.$stats.css('background-color', colors.dark.toStr());
    this.$stats.css('color', colors.darkText.toStr());
    this.editor.setTint(tint);

    this.samples.css({
      'background-color': tint.toStr(),
      'border-top': colors.divider,
      'border-bottom': colors.divider
    })
      .find('h3')
      .css('color', colors.aaaLarge.toStr());
    this.aaLarge.css('color', colors.aaLarge.toStr())
      .find('.hex')
      .text(colors.aaLarge.toStr());
    this.aaaLarge.css('color', colors.aaaLarge.toStr())
      .find('.hex')
      .text(colors.aaaLarge.toStr());
    this.aaaSmall.css('color', colors.aaaSmall.toStr())
      .find('.hex')
      .text(colors.aaaSmall.toStr());

    // set readability icons
    this.setTextReadabilityIcon(this.aaLarge, tint.hasContrast(colors.aaLarge, 3), tint);
    this.setTextReadabilityIcon(this.aaaLarge, tint.hasContrast(colors.aaaLarge, 4.5), tint);
    this.setTextReadabilityIcon(this.aaaSmall, tint.hasContrast(colors.aaaSmall, 7), tint);

    this.$.find('.shades')
      .css('background-color', colors.light.toStr());

    this.$.find('#cs-original').colorslice(tint);
    this.$.find('#cs-shifted1').colorslice(tint, 60);
    this.$.find('#cs-shifted2').colorslice(tint, 120);
    this.$.find('#cs-shifted3').colorslice(tint, 180);
    this.$.find('#cs-shifted4').colorslice(tint, 240);
    this.$.find('#cs-shifted5').colorslice(tint, 300);
  },

  setTextReadabilityIcon: function(elem, readable, tint) {
    var $icon = $(elem).children('.glyphicon');
    $icon.tooltip('destroy')
      .removeClass('glyphicon-ok-sign glyphicon-remove-sign');
    if (readable) {
      $icon.addClass('glyphicon-ok-sign')
        .css('color', tint.contrastColor(3).blend({h: 120, s: 0.6}, 60).toStr())
        .tooltip({title: 'Color passes for this contrast level', placement: 'right'});
    } else {
      $icon.addClass('glyphicon-remove-sign')
        .css('color', tint.contrastColor(3).blend({h: 1, s: 0.6}, 60).toStr())
        .tooltip({title: 'There\'s no color that can achieve this contrast!', placement: 'right'});
    }
    return;
  }
};

module.exports = Modal;
