'use strict';

var $ = require('jquery');
var Tint = require('./tint.js');
var Util = require('./util.js');
var tc = require('tinycolor');
require('spectrum')($);

// build a palette of colors that can have complex
// dependencies
var Palette = function(opts) {
  var _this = this;
  this.tints = opts.tints || [];
  this.$container = $(opts.container);
  this.active = false;

  if (this.tints.length === 0) {
    this.random();
  }

  this.$swatches = $('<div>', {
    'class': 'pa-swatches'
  });
  this.tints.forEach(function(tint) {
    tint.$swatch.appendTo(_this.$swatches);
  });

  this.$addButton = $('<button>', {
    'class': 'pa-add',
    text: 'Add'
  });

  this.$removeButton = $('<button>', {
    'class': 'pa-remove',
    text: 'Delete'
  });

  this.$colorpicker = $('<input>', { 'class': 'pa-colorpicker' });
  
  this.$editor = $('<div>', {
    'class': 'pa-editor'
  });


  this._render();
  this.setCurrentTint(this.tints[0]);
};

Palette.prototype = {
  // add palette markup to the dom
  _render: function() {
    var _this = this;

    var inputContainers = {};
    var transforms = {};
    inputContainers.$buttons = $('<div>', {
        'class': 'pa-buttons'
    })
      .append(this.$addButton)
      .append(this.$removeButton);
    inputContainers.$settings = $('<div>', {
        'class': 'pa-settings'
    })
      .append(this.inputs.$name)
      .append(this.inputs.$color)
      .append(this.inputs.$parent);
    transforms.$hue = $('<fieldset>', {
        'class': 'pa-hue'
    })
      .append($('<legend>', { text: 'Hue' }))
      .append(this.inputs.$hueShift)
      .append(this.inputs.$hueBlend);
    transforms.$saturation = $('<fieldset>', {
        'class': 'pa-sat'
    })
      .append($('<legend>', { text: 'Saturation' }))
      .append(this.inputs.$satAdjust)
      .append(this.inputs.$satBlend);
    transforms.$luminance = $('<fieldset>', {
        'class': 'pa-lum'
    })
      .append($('<legend>', { text: 'Luminance' }))
      .append(this.inputs.$lumAdjust)
      .append(this.inputs.$lumContrast);

    inputContainers.$transforms = $('<div>', {
        'class': 'pa-transforms'
    })
      .append(transforms.$hue)
      .append(transforms.$saturation)
      .append(transforms.$luminance);

    // add labels to the inputs
    $.each(this.inputs, function(idx, $input) {
      $input.wrap($('<div>', { 'class': 'pa-input' }));
      $input.before($('<label>', {
        text: $input.data('label'),
        'for': $input.attr('id')
      }));
    });

    // add colorpicker
    this.inputs.$color.before(this.$colorpicker);

    // add options to the select box
    this.inputs.$parent.append($('<option>', {
      text: 'None',
      value: ''
    }));
    this.tints.forEach(function(tint) {
      _this.inputs.$parent.append(_this._getParentOption(tint));
    });

    this.$editor
      .append(inputContainers.$buttons)
      .append(inputContainers.$settings)
      .append(inputContainers.$transforms);

    this.$container.append(this.$swatches, this.$editor);

    // init the colorpicker
    this.$colorpicker.spectrum({ 
      theme: 'sp-mint',
      showInput: false,
      showButtons: false,
      showInitial: true,
      move: function (color) {
        _this.currentTint.setAttr('rawColor', color.toRgb());
        _this.inputs.$color.val(color.toHexString());
      }
    });
  },

  // generate a simple analogous palette for init
  random: function () {
    var bg = new Palette.Tint(tc.random(), {
      swatchName: 'background'
    });
    var h1 = new Palette.Tint(null, {
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
      hueShift: 60
    });
    this.tints = [bg, h1, h2, p, detail];
  },

  // add a new palette color
  addTint: function (color) {
    var newColor = (color ? tc(color) : tc.random());
    var tint = new Palette.Tint(newColor, {
      swatchName: 'Swatch' + Palette.swatchesCreated
    });
    this.tints.push(tint);
    tint.$swatch.appendTo(this.$swatches);
    this.inputs.$parent.append(this._getParentOption(tint));
    this.setCurrentTint(tint);
    Palette.swatchesCreated++;
  },

  // remove a palette color
  removeTint: function (tint) {
    var index = this.tints.indexOf(tint);
    if (index > -1) {
      this.tints.splice(index, 1);
    }
    this._updateParentOptions(tint.swatchName, null)
    tint.destroy();
    this.setCurrentTint();
  },

  // set the current tint attribute to the user's selection and
  // update the editor controls to the current tint selection
  setCurrentTint: function (tint) {
    if (tint) {
      this.currentTint = tint;
    } else if (this.tints.length > 0) {
      this.currentTint = this.tints[0];
    } else {
      this.currentTint = null;
      this._deactivateControls();
      return;
    }

    this._activateControls();
    this._disableParentOptions(this.currentTint);
    this.$swatches.find('.active').removeClass('active');
    this.currentTint.$swatch.addClass('active');
    this.inputs.$name.removeClass('invalid');

    // set input values
    var _this = this;
    $.each(this.inputs, function(index, $input) {
      $input.val(_this.currentTint[$input.data('method')]);
    });

    // set the parent select
    if (this.currentTint.parent) {
      this.inputs.$parent.val(this.currentTint.parent.getName());
    }

    this._updateColorpicker(this.currentTint.rawColor);
    this._toggleInputs();
  },

  _getParentOption: function (paletteTint) {
    var optionName = paletteTint.swatchName || paletteTint.toStr();
    return $('<option>', {
      value: optionName,
      text: optionName
    });
  },

  _updateParentOptions: function (oldOpt, newOpt) {
    var $option = this.inputs.$parent.find('option[value="' + oldOpt + '"]');
    // update the option value and text
    if (newOpt) {
      $option.val(newOpt).text(newOpt);
    // of if newOpt is null, delete the option
    } else {
      $option.remove();
    }
  },

  // disable any parent choices that would create an infinite loop
  _disableParentOptions: function (paletteTint) {
    var dependents = this._allDependents(paletteTint);
    var $options = this.inputs.$parent.find('option');
    $options.each(function() {
      var $opt = $(this);
      var disable = false;
      dependents.forEach(function(dep) {
        if (dep.swatchName === $opt.val()) {
          disable = true;
        }
      });
      disable ? $opt.attr('disabled', 'disabled') : $(this).removeAttr('disabled');
    });
  },

  // automatically disable and enable editor controls that can be used
  // with the tint's current state
  _toggleInputs: function () {
    if (this.currentTint.parent) {
      this.inputs.$hueBlend.prop('disabled', false);
      this.inputs.$satBlend.prop('disabled', false);
      this.inputs.$lumContrast.prop('disabled', false);
      this.inputs.$lumAdjust.prop('disabled', true);
    } else {
      this.inputs.$hueBlend.prop('disabled', true);
      this.inputs.$satBlend.prop('disabled', true);
      this.inputs.$lumContrast.prop('disabled', true);
      this.inputs.$lumAdjust.prop('disabled', false);
    }
  },

  // recursively generate a list of all invalid parent choices this paletteTint
  _allDependents: function (paletteTint, dependents) {
    dependents = dependents || [];
    dependents.push(paletteTint);
    var _this = this;
    paletteTint.children.forEach(function(childTint) {
      dependents = _this._allDependents(childTint, dependents);
    });
    return dependents;
  },

  _updateColorpicker: function (newColor) {
    this.$colorpicker.spectrum('set', newColor);
  },

  // returns a validation object members 'valid' being true or false and
  // any error messages in the 'errors' array
  _validName: function (name) {
    var out = {errors: []};
    // check for null
    if (name === '') {
      out.errors.push('Please enter a name')
    }
    // check for duplicates
    this.tints.forEach(function(tint) {
      if (name === tint.swatchName) {
        out.errors.push('That name has already been used');
      }
    });
    out.valid = (out.errors.length ? false : true);
    return out;
  },

  _activateControls: function () {
    if (!this.active) {
      this._bindHandlers();
      $.each(this.inputs, function(key, $input) {
        $input.prop('disabled', false);
      });
      this.$colorpicker.spectrum('enable');
      this.active = true;
    }
  },

  _deactivateControls: function () {
    this._unbindHandlers();
    $.each(this.inputs, function(key, $input) {
      $input.prop('disabled', true);
    });
    this.$colorpicker.spectrum('disable');
    this.active = false;
  },

  _bindHandlers: function () {
    // palette swatch selection
    this.$swatches.off();
    this.$swatches.on('click', '.pa-swatch', $.proxy(this.events.selectSwatch, this));

    // editor controls
    this.$editor.on('change input', 'input[type=range]', $.proxy(this.events.updateSwatch, this));
    this.$editor.on('change', 'input[type=text]', $.proxy(this.events.updateSwatch, this));
    this.inputs.$parent.on('change', $.proxy(this.events.changeSwatchParent, this));
    this.$removeButton.on('click', $.proxy(this.events.removePaletteTint, this));
    this.$addButton.off();
    this.$addButton.on('click', $.proxy(this.events.addPaletteTint, this));
  },

  _unbindHandlers: function () {
    this.$editor.off();
    this.inputs.$parent.off();
    this.$removeButton.off();
  },

  // event handlers
  // --------------
  events: {
    updateSwatch: function (event) {
      var $elem = $(event.target);
      var method = $elem.data('method');
      // todo - sanitize inputs for good measure
      var value = $elem.val();
      console.log('updateSwatch on:', method, 'Value:', value);

      if (method === 'swatchName') {
        var validation = this._validName(value);
        if (validation.valid) {
          this.inputs.$name.removeClass('invalid');
          var oldName = this.currentTint.swatchName;
          this.currentTint.swatchName = value;
          this._updateParentOptions(oldName, value);
        } else {
          this.inputs.$name.addClass('invalid');
        }
      } else if (method === 'rawColor') {
        this.currentTint.setAttr(method, value);
        this._updateColorpicker(value);
      // input was from a range (slider)
      } else {
        this.currentTint.setAttr(method, parseFloat(value));
      }
    },

    selectSwatch: function (event) {
      var $clickedSwatch = $(event.target);
      if (!$clickedSwatch.hasClass('active')) {
        var result = $.grep(this.tints, function(tint) {
          return $clickedSwatch.is(tint.$swatch);
        });
        if (result.length === 0) {
          // todo throw an error
          console.log('Element Not Found')
        } else {
          this.setCurrentTint(result[0]);
        }
      }
    },

    changeSwatchParent: function (event) {
      var parentName = this.inputs.$parent.val();
      var selectedTint;
      this.tints.forEach(function(tint) {
        if (tint.getName() === parentName) {
          selectedTint = tint;
        }
      });
      this.currentTint.setParent(selectedTint);
      this.currentTint.update();
      this._toggleInputs();
    },

    addPaletteTint: function (event) {
      this.addTint();
    },

    removePaletteTint: function (event) {
      this.removeTint(this.currentTint);
    }
  },

  // collection of jquery editor controls
  inputs: {
    $name: $('<input>', {
      id: 'pa-name',
      type: 'text',
      data: {
        method: 'swatchName',
        label: 'Name'
      }
    }),
    $color: $('<input>', {
      id: 'pa-color',
      type: 'text',
      data: {
        method: 'rawColor',
        label: 'Base Color'
      }
    }),
    $parent: $('<select>', {
      id: 'pa-parent',
      data: {
        method: 'parent',
        label: 'Inherit From'
      }
    }),
    $hueShift: $('<input>', {
      id: 'pa-hue-shift',
      type: 'range',
      max: 180,
      min: -180,
      data: {
        method: 'hueShift',
        label: 'Adjust'
      }
    }),
    $hueBlend: $('<input>', {
      id: 'pa-hue-blend',
      type: 'range',
      data: {
        method: 'hueBlend',
        label: 'Blend'
      }
    }),
    $satAdjust: $('<input>', {
      id: 'pa-sat-adjust',
      type: 'range',
      min: -1,
      max: 1,
      step: 0.01,
      data: {
        method: 'satAdjust',
        label: 'Adjust'
      }
    }),
    $satBlend: $('<input>', {
      id: 'pa-sat-blend',
      type: 'range',
      data: {
        method: 'satBlend',
        label: 'Blend'
      }
    }),
    $lumAdjust: $('<input>', {
      id: 'pa-lum-adjust',
      type: 'range',
      min: -1,
      max: 1,
      step: 0.01,
      data: {
        method: 'lumAdjust',
        label: 'Adjust'
      }
    }),
    $lumContrast: $('<input>', {
      id: 'pa-lum-contrast',
      type: 'range',
      min: 1,
      max: 21,
      step: 0.1,
      data: {
        method: 'lumContrast',
        label: 'Contrast'
      }
    })
  }
};

// a running count of created swatches
Palette.swatchesCreated = 0;

// the palette tint class inherits from tint
// and adds logic for color dependencies
Palette.Tint = function(color, opts) {
  opts = opts || {};

  // call parent constructor
  Tint.call(this, color);

  // color prior to any processing
  this.rawColor = tc(color).toHexString();
  this.swatchName = opts.swatchName || '';
  this.$swatch = $('<div></div>', {
    'class': 'pa-swatch'
  }).append('<p>' + this.swatchName + '</p>');

  // note: references to other tints for color editing purposes
  //       not related to the class's inheritance structure
  if (opts.parent) {
    this.setParent(opts.parent);
  }
  this.children = [];

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
Palette.Tint.prototype.setAttr = function(attr, value) {
  if (attr === 'parent') {
    this.setParent(value);
  } else if (attr === 'rawColor') {
    this.setRawColor(value);
  } else {
    this[attr] = value;
  }
  this.update();
};

Palette.Tint.prototype.setParent = function(newParent) {
  if (this.parent) {
    this.parent._removeChild(this);
  }
  if (newParent) {
    newParent._addChild(this);
  }
  this.parent = newParent;
};

Palette.Tint.prototype.setRawColor = function(newColor) {
  this.rawColor = tc(newColor).toHexString();
};

Palette.Tint.prototype.getName = function() {
  // todo - enforce a unique non-null name instead
  if (this.swatchName) {
    return this.swatchName;
  } else {
    return this.toStr();
  }
};

Palette.Tint.prototype._addChild = function(child) {
  if (this.children.indexOf(child) === -1) {
    this.children.push(child);
  }
};

Palette.Tint.prototype._removeChild = function(child) {
  var index = this.children.indexOf(child);
  if (index > -1) {
    this.children.splice(index, 1);
  }
};

// update the color after changing one of its attributes
Palette.Tint.prototype.update = function() {
  var output, hue, sat, lum;

  if (this.parent) {
    output = new Tint(this.parent);
    hue = output.h;
    sat = output.s;
    lum = output.wl;
    // blend parent with base color
    if (this.hueBlend !== 0) {
      hue = output.blend({h: this.h}, this.hueBlend).h;
    }
    if (this.satBlend !== 0) {
      sat = output.blend({s: this.s}, this.satBlend).s;
    }
    // contrast parent color
    if (this.lumContrast > 1) {
      lum = output.calcLuminance(this.lumContrast).best;
    }
  // the tint is not inheriting another color
  } else {
    output = new Tint(this.rawColor);
    hue = output.h;
    sat = output.s;
    lum = Tint.adjustAttr(output.wl, this.lumAdjust)
  }

  if (this.hueShift !== 0) {
    hue = output.setHSWL({h: hue}).shift({h: this.hueShift}).h;
  }
  sat = Tint.adjustAttr(sat, this.satAdjust);

  this.setHSWL({h: hue, s: sat, wl: lum});
  this._render();
  this._updateDependents();
};

// safely delete this element and remove dependencies
Palette.Tint.prototype.destroy = function() {
  // remove this tint as a dependency from all children
  this.setParent(null);
  this.children.forEach(function(child) {
    child.setParent(null);
  });
  this.$swatch.remove();
};

// update palette swatch markup
Palette.Tint.prototype._render = function() {
  this.$swatch
    .text(this.toStr())
    .css({
      backgroundColor: this.toStr(),
      color: this.contrastColor().toStr()
    });
};

// update all dependent tints
Palette.Tint.prototype._updateDependents = function() {
  this.children.forEach(function(child) {
    child.update();
  });
};

module.exports = Palette;
