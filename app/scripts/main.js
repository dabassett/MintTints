'use strict';

global.jQuery = require('jquery');
var $ = global.jQuery;
var tc = require('tinycolor');
require('bootstrap-sass'); // todo pick only what you need

$(function() {
  var $colorModal = $('#color-info');
  var $infoBox = {
    modal: $colorModal,
    header: $colorModal.find('.modal-header'),
    body: $colorModal.find('.modal-body'),
    title: $colorModal.find('.modal-title'),
    lum: $colorModal.find('#luminance'),
    rgb: $colorModal.find('#rgb'),
    contrast: $colorModal.find('#max-contrast'),
    stats: $colorModal.find('.stats'),
    samples: $colorModal.find('.text-samples'),
    aaLarge: $colorModal.find('#aa-large'),
    aaaLarge: $colorModal.find('#aaa-large'),
    aaaSmall: $colorModal.find('#aaa-small')
  };

  function maxContrast(color) {
    return Math.round(
      Math.max(tc.readability(color, 'black'),
               tc.readability(color, 'white')) * 10) / 10;
  }

  function adjustAttribute(attr, step, total, limit) {
    var limit = limit || 0.12;
    var normStep = step - total + 1;
    var adjustment;

    if (normStep < 0) {
      adjustment = attr * normStep / total;
    } else {
      adjustment = ((1 - attr) * normStep / total);
    }

    if (Math.abs(adjustment) > Math.abs(normStep * limit)) {
      return attr + (normStep * limit);
    }

    return attr + adjustment;
  }

  function hswlMutateTint(color, row, col, total) {
    var hswl = color.toHswl();
    var lum, sat;
    return tc({
      h: hswl.h,
      s: adjustAttribute(hswl.s, col, total, 0.25),
      wl: adjustAttribute(hswl.wl, row, total)
    });
  }

  $.fn.addColorLabel = function(color, contrastColor) {
    $('<h4 class="contrast">' + color.toHexString() + '</h4>')
      .appendTo(this)
      .css({
        'color': contrastColor
      });
    return this;
  };

  function addColorBlock(color) {
    var hswl = color.toHswl();
    var colors = {};
    colors.orig = color;
    colors.aaLarge = tc.getReadable(color, {level: 'aa', size: 'large', returnBestFit: true});
    colors.aaaLarge = tc.getReadable(color, {level: 'aaa', size: 'large', returnBestFit: true});
    colors.aaaSmall = tc.getReadable(color, {level: 'aaa', size: 'small', returnBestFit: true});
    colors.h = hswl.h;
    colors.s = hswl.s;
    colors.lum = hswl.wl;
    colors.dark = tc({h: colors.h, s: colors.s * 0.5, wl: colors.lum * 0.25});
    colors.darkText = tc.getReadable(colors.dark, {contrastRatio: 6, returnBestFit: true});
    colors.light = tc({h: colors.h, s: colors.s * 0.5, wl: colors.lum + ((1 - colors.lum) * 0.5)});
    colors.divider = '2px solid ' + colors.aaaLarge.toHexString();

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
        $infoBox.header.css({
          'background-color': colors.orig.toHexString(),
          'border-bottom': colors.divider
        });
        $infoBox.title.css('color', colors.aaaLarge.toHexString());
        $infoBox.title.text('Information for ' + colors.orig.toHexString());

        $infoBox.stats.css('background-color', colors.dark.toHexString());
        $infoBox.stats.find('p').css('color', colors.darkText.toHexString());
        $infoBox.rgb.text(colors.orig.toRgbString());
        $infoBox.lum.text(colors.lum);
        $infoBox.contrast.text(maxContrast(colors.orig));

        $infoBox.samples.css({
          'background-color': colors.orig.toHexString(),
          'border-top': colors.divider,
          'border-bottom': colors.divider
        })
          .find('h3')
          .css('color', colors.aaaLarge.toHexString());
        $infoBox.aaLarge.css('color', colors.aaLarge.toHexString())
          .find('.hex')
          .text(colors.aaLarge.toHexString());
        $infoBox.aaaLarge.css('color', colors.aaaLarge.toHexString())
          .find('.hex')
          .text(colors.aaaLarge.toHexString());
        $infoBox.aaaSmall.css('color', colors.aaaSmall.toHexString())
          .find('.hex')
          .text(colors.aaaSmall.toHexString());

        $infoBox.modal.find('.shades')
          .css('background-color', colors.light.toHexString())
          .find('.shade')
            .each(function () {
              var elem = $(this);
              var shade = hswlMutateTint(colors.orig, elem.data('row'), elem.data('col'), 4);
              elem.css('background-color', shade.toHexString());
              console.log('row: '+elem.data('row')+' col: '+elem.data('col'));
            });

        $infoBox.modal.modal();
      });

  }

  function updateJumbo() {
    // selects a random hue only to keep the jumbotron colors consistent
    var randomColor = tc({h: Math.floor(Math.random() * 360), s: 0.6, wl: 0.4});
    var contrastColor = tc.getReadable(randomColor, {contrastRatio: 3.5})
    $('.jumbotron').css({
      'background-color': randomColor.toHexString(),
      'border-color': contrastColor.toHexString(),
      'color': contrastColor.toHexString()
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

  // disable jumbotron transition and set an initial color
  var savedTransition = $('.jumbotron').css('transition');
  $('.jumbotron').css('transition', 'none');
  updateJumbo();
  // reset the transition
  setInterval(function() { $('.jumbotron').css('transition', savedTransition) }, 10);

  setInterval(function() { updateJumbo(); }, 120000);
  addColors();
});
