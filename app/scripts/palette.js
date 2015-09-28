'use strict';

var $ = require('jquery');
var Tint = require('./tint.js');
var Util = require('./util.js');
var tc = require('tinycolor');
require('spectrum')($);

// build a palette of colors that can have complex
// dependencies
var Palette = function(opts) {
  this.tints = opts.tints || [];
  this.$container = $(opts.container);

  if (this.tints.length === 0) {
    this.random();
  }
  this.currentTint = this.tints[1];

  this.render();
};

Palette.prototype = {
  // add palette markup to the dom
  render: function() {
    var _this = this;

    this.$swatches = $('<div></div>', {
      'class': 'pa-swatches'
    });
    this.tints.forEach(function(tint) {
      tint.$swatch.appendTo(_this.$swatches);
    });

    this.inputs = {
      name: $('<input>', {
        name: 'swatchName'
      }),
      color: $('<input>', {
        name: 'rawColor'
      }),
      parent: $('<input>', {
        name: 'parent'
      }),
      hueShift: $('<input>', {
        name: 'hueShift',
        type: 'range',
        max: 180,
        min: -180,
      }),
      hueBlend: $('<input>', {
        name: 'hueBlend',
        type: 'range'
      }),
      satAdjust: $('<input>', {
        name: 'satAdjust',
        type: 'range',
        min: -1,
        max: 1,
        step: 0.01
      }),
      satBlend: $('<input>', {
        name: 'satBlend',
        type: 'range'
      }),
      lumAdjust: $('<input>', {
        name: 'lumAdjust',
        type: 'range',
        min: -1,
        max: 1,
        step: 0.01
      }),
      lumContrast: $('<input>', {
        name: 'lumContrast',
        type: 'range',
        min: 1,
        max: 21,
        step: 0.1
      })
    };

    // todo fit this in somehow
    this.$colorpicker = $('<input>', { 'class': 'pa-colorpicker' });

    var inputLabels = [];
    $.each(this.inputs, function(index, $input) {
      var $label = $('<label>', { text: $input.attr('name') });
      $label.append($input);
      inputLabels.push($label);

      // set initial slider values
      $input.val(_this.currentTint[$input.attr('name')]);
    });

    this.$editor = $('<div></div>', {
      'class': 'pa-editor'
    });

    this.$editor.append(inputLabels);
    this.$editor.append(this.$colorpicker);

    this.$container.append(this.$swatches, this.$editor);

    // event handler for editor controls
    //   todo - this fires on any mouseover of the input
    this.$editor.on('change mousemove', 'input[type=range]', function() {
      console.log('Event on:', $(this).attr('name'), 'Value:', $(this).val());
      // todo make a setter for this
      _this.currentTint[$(this).attr('name')] = parseFloat($(this).val());
      _this.currentTint.update();
    });

    // init the colorpicker
    this.$colorpicker.spectrum({
      theme: 'sp-mint',
      showInput: false,
      showButtons: false,
      showInitial: true,
      move: function (color) { return null; }
    });
  },

  // generate a simple analogous palette for init
  random: function () {
    var bg = new Palette.Tint(tc.random(), {
      swatchName: 'background'
    });
    var h1 = new Palette.Tint(tc.random(), {
      swatchName: 'heading1',
      parent: bg,
      lumContrast: 3
    });
    var h2 = new Palette.Tint(null, {
      swatchName: 'heading2',
      parent: bg,
      lumContrast: 4.5
    });
    var p = new Palette.Tint(null, {
      swatchName: 'paragraph',
      parent: bg,
      lumContrast: 7
    });
    var detail = new Palette.Tint(tc.random(), {
      swatchName: 'detail',
      parent: bg,
      lumContrast: 3,
      satAdjust: 0.5,
      hueShift: 180,
      hueBlend: 50
    });
    this.tints = [bg, h1, h2, p, detail];
  },

  // check the palette for possible dependency cycles and
  // disable any options that could cause one
  checkForCycles: function () {

  },

  // add a new palette color
  addColor: function () {

  },

  // remove a palette color
  removeColor: function () {

  }
};

// the palette tint class inherits from tint
// and adds logic for color dependencies
Palette.Tint = function(color, opts) {
  opts = opts || {};

  // call parent constructor
  Tint.call(this, color);

  // color prior to any processing
  this.rawColor = color;
  this.swatchName = opts.swatchName || '';
  this.$swatch = $('<div></div>', {
    'class': 'pa-swatch'
  }).append('<p>' + this.swatchName + '</p>');

  // note: references to other tints for color editing purposes
  //       not related to the class's inheritance structure
  this.parent = opts.parent || null;
  this.child = opts.child || null;

  // attribute transformations
  this.hueShift = opts.hueShift || 0;
  this.hueBlend = opts.hueBlend || 0;
  this.satAdjust = opts.satAdjust || 0;
  this.satBlend = opts.satBlend || 0;
  this.lumAdjust = opts.lumAdjust || 0;
  this.lumContrast = opts.lumContrast || 1;

  this.update();
};

// refer the prototype back to the parent as well
Palette.Tint.prototype = Object.create(Tint.prototype);

// Set the "constructor" property
Palette.Tint.prototype.constructor = Palette.Tint;


// set an attribute and update the color
Palette.Tint.prototype.setAttr = function(attr, fn) {
  // todo add dynamic function calling
  this.attrs.h = Object.merge();
  this.update();
};

// update the color after changing one of its attributes
Palette.Tint.prototype.update = function() {
  // todo clean up this whole function
  var output;
  var inputTint = new Tint(this.rawColor);

  if (this.parent) {
    output = this.parent.set();
  } else {
    output = new Tint(this.rawColor);
  }

  // apply transforms
  output = output.setHSWL({
      s: Tint.adjustAttr(output.s, this.satAdjust),
      wl: Tint.adjustAttr(output.wl, this.lumAdjust)
    })
    .shift({h: this.hueShift});

  if (this.parent) {
    output = output.blend({h: inputTint.h}, this.hueBlend)
      .blend({s: inputTint.s}, this.satBlend);
    output.setHSWL({
      wl: this.parent.contrastColor(this.lumContrast).wl
    });
  }

  this.setHSWL(output.tiny.toHswl());
  this.render();
  // todo update dependents
};

// update palette swatch markup
Palette.Tint.prototype.render = function() {
  this.$swatch
    .text(this.toStr())
    .css({
      backgroundColor: this.toStr(),
      color: this.contrastColor().toStr()
    });
};

// bake the altered color in permanantly
// and clear all dependencies and transforms
Palette.Tint.prototype.bake = function() {
};

// clear all of the dependencies and set the
// color back to its initial state
Palette.Tint.prototype.revert = function() {
};

module.exports = Palette;
