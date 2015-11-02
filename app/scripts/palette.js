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

    // todo -  this is pretty awful
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

  // remove the specified tint from the palette
  removeTint: function (tint) {
    var index = this.tints.indexOf(tint);
    if (index > -1) {
      this.tints.splice(index, 1);
    }
    this._updateParentOptions(tint.swatchName, null)
    tint.destroy();
    this.setCurrentTint(this.tints[this.tints.length - 1]);
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

    this._toggleInputs();
  },

  // set a Palette.Tint attribute on the current swatch
  setSwatchAttr: function(attr, val) {
    if (attr === 'swatchName') {
      this.setSwatchName(val);
    } else if (attr === 'rawColor') {
      this.setSwatchBaseColor(val);
    } else { // input was from a range (slider)
      this.currentTint.setAttr(attr, parseFloat(val));
    }
  },

  // set the name for the current swatch if the new name passes validations
  // sets the 'invalid' class for the input if the new name fails validations
  setSwatchName: function(newName) {
    // todo - display the error messages too
    var validation = this._validName(newName);
    if (validation.valid) {
      this.inputs.$name.removeClass('invalid');
      var oldName = this.currentTint.swatchName;
      this.currentTint.setAttr('swatchName', newName);
      this._updateParentOptions(oldName, newName);
    } else {
      this.inputs.$name.addClass('invalid');
    }
  },

  // set the base color for the current swatch
  setSwatchBaseColor: function(color) {
    this.currentTint.setAttr('rawColor', color);
  },

  // set the parent Swatch for the current swatch
  setSwatchParent: function(tint) {
    this.currentTint.setParent(tint);
    this.currentTint.update();
    this._toggleInputs();
  },

  // event handlers
  // --------------
  handlers: {
    editorInput: function (event) {
      var $elem = $(event.currentTarget);
      var attribute = $elem.data('method');
      // todo - sanitize inputs for good measure
      var value = $elem.val();
      this.setSwatchAttr(attribute, value);
    },

    clickSwatch: function (event) {
      var $clickedSwatch = $(event.currentTarget);
      if (!$clickedSwatch.hasClass('active')) {
        var result = $.grep(this.tints, function(tint) {
          return $clickedSwatch.is(tint.$swatch);
        });
        if (result.length === 0) {
          throw new Error('Could not find the clicked swatch');
        } else {
          this.setCurrentTint(result[0]);
        }
      }
    },

    parentInput: function (event) {
      var parentName = this.inputs.$parent.val();
      var selectedTint;
      this.tints.forEach(function(tint) {
        if (tint.getName() === parentName) {
          selectedTint = tint;
        }
      });
      this.setSwatchParent(selectedTint)
    },

    addButton: function (event) {
      this.addTint();
    },

    removeButton: function (event) {
      this.removeTint(this.currentTint);
    }
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
      this.active = true;
    }
  },

  _deactivateControls: function () {
    this._unbindHandlers();
    $.each(this.inputs, function(key, $input) {
      $input.prop('disabled', true);
    });
    this.active = false;
  },

  _bindHandlers: function () {
    // palette swatch selection
    this.$swatches.off('click.pa').on('click.pa', '.pa-swatch', $.proxy(this.handlers.clickSwatch, this));

    // editor controls
    this.$editor.on('change.pa input.pa', 'input[type=range]', $.proxy(this.handlers.editorInput, this));
    this.$editor.on('change.pa', 'input[type=text]', $.proxy(this.handlers.editorInput, this));
    this.inputs.$parent.on('change.pa', $.proxy(this.handlers.parentInput, this));
    this.$removeButton.on('click.pa', $.proxy(this.handlers.removeButton, this));
    this.$addButton.off('click.pa').on('click.pa', $.proxy(this.handlers.addButton, this));
  },

  _unbindHandlers: function () {
    this.$editor.off('change.pa input.pa');
    this.inputs.$parent.off('change.pa');
    this.$removeButton.off('click.pa');
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
      min: -180,
      max: 180,
      data: {
        method: 'hueShift',
        label: 'Adjust'
      }
    }),
    $hueBlend: $('<input>', {
      id: 'pa-hue-blend',
      type: 'range',
      min: 0,
      max: 100,
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
      min: 0,
      max: 100,
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

  // dom
  this.$swatch = $('<div>', { 'class': 'pa-swatch' });
  this.$colorLabel = $('<h3>', { 'class': 'pa-swatch-color' });
  this.$nameLabel = $('<span>', { 'class': 'pa-swatch-name' });
  this.$swatch.append(this.$colorLabel, this.$nameLabel, this.$parentLabel);

  // note: these are references to other tints for color editing purposes
  //       and are not related to the class's inheritance structure
  this.children = [];
  if (opts.parent) {
    this.setParent(opts.parent);
  }

  this.rawColor = tc(color).toHexString();
  this.setName(opts.swatchName || '');

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
  } else if (attr === 'swatchName') {
    this.setName(value);
  } else {
    this[attr] = value;
  }
  this.update();
  return this;
};

Palette.Tint.prototype.setParent = function(newParent) {
  if (this.parent) {
    this.parent._removeChild(this);
  }
  if (newParent) {
    newParent._addChild(this);
  }
  this.parent = newParent;
  this.setNameLabel();
  return this;
};

Palette.Tint.prototype.setRawColor = function(newColor) {
  this.rawColor = tc(newColor).toHexString();
};

Palette.Tint.prototype.getName = function() {
  if (this.swatchName) {
    return this.swatchName;
  } else {
    return this.toStr();
  }
};

Palette.Tint.prototype.setName = function(name) {
  this.swatchName = name;
  this.setNameLabel();
  return this;
}

Palette.Tint.prototype.setNameLabel = function() {
  var label = this.getName();
  if (this.parent) {
    label += ' < ' + this.parent.getName();
  }
  this.children.forEach(function(child) { child.setNameLabel(); });
  this.$nameLabel.text(label);
}

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

  // the tint is inheriting color from a parent
  if (this.parent) {
    var base = new Tint(this.rawColor);
    output = new Tint(this.parent);
    hue = output.h;
    sat = output.s;
    lum = output.wl;
    // blend parent with base color
    if (this.hueBlend !== 0) {
      hue = output.blend({h: base.h}, this.hueBlend).h;
    }
    if (this.satBlend !== 0) {
      sat = output.blend({s: base.s}, this.satBlend).s;
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

  // only use a color space conversion if an HSWL transform occured
  if (hue !== output.h || sat !== output.s || lum !== output.wl) {
    this.setHSWL({h: hue, s: sat, wl: lum});
  } else {
    this.setTinycolor(output.tiny);
  }

  this._updateColor();
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

Palette.Tint.prototype._updateColor = function() {
  this.$colorLabel.text(this.toStr());
  this.$swatch
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
