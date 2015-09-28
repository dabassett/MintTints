'use strict';

var tc = require('tinycolor');

// the primary color model
var Tint = function (color) {
  this.tiny = tc(color);
  var hswl = this.tiny.toHswl();
  this.h = hswl.h;
  this.s = hswl.s;
  this.wl = hswl.wl;
};

Tint.prototype = {
  // the maximum contrast [1, 21] that this color can achieve
  maxContrast: function () {
    return Math.max(tc.readability(this.tiny, 'black'),
      tc.readability(this.tiny, 'white'));
  },

  // return a new Tint that attempts to meet the
  // WCAG contrast requirement
  contrastColor: function (contrast, opts) {
    // default to always return a color unless explicitly set to false
    opts = opts || {};
    if (typeof opts.returnBestFit === 'undefined') {
      opts.returnBestFit = true;
    }
    opts.contrastRatio = contrast;
    return new Tint(tc.getReadable(this.tiny, opts));
  },

  // return true when this color meets or exceeds
  // the specified contrast ratio, false otherwise
  hasContrast: function (otherTint, contrast) {
    // compensate for rounding and other minor deviations
    var fudge = 0.1;
    if (tc.readability(this.tiny, otherTint.tiny) + fudge >= contrast) {
      return true;
    }
    return false;
  },

  // return a string with the highest WCAG contrast level that
  // otherTint achieves with the current color
  wcagContrast: function (otherTint) {
    // compensate for rounding and other minor deviations
    var fudge = 0.1;
    var contrast = tc.readability(this.tiny, otherTint.tiny) + fudge;
    if (contrast < 3) {
      return 'None';
    }
    else if (contrast >= 3 && contrast < 4.5) {
      return 'AA Large';
    }
    else if (contrast >= 4.5 && contrast < 7) {
      return 'AAA Large / AA Small';
    }
    else {
      return 'AAA Small';
    }
  },

  // a mutator for the hswl attributes
  setHSWL: function (attrs) {
    attrs = attrs || {};
    var hswl = Tint.normalize({
      h: Tint.validateAttr(attrs.h, this.h),
      s: Tint.validateAttr(attrs.s, this.s),
      wl: Tint.validateAttr(attrs.wl, this.wl)
    });
    this.h = hswl.h;
    this.s = hswl.s;
    this.wl = hswl.wl;
    // note: at the moment tinycolor mutates the input so placing
    // this before the individual attributes would cause issues
    this.tiny = tc(hswl);
    return this;
  },

  // return a new Tint that has had one or more attributes set to
  // the provided values. Setting all three values essentially
  // produces a new color
  set: function (attrs) {
    attrs = attrs || {};
    return new Tint(Tint.normalize({
      h: Tint.validateAttr(attrs.h, this.h),
      s: Tint.validateAttr(attrs.s, this.s),
      wl: Tint.validateAttr(attrs.wl, this.wl)
    }));
  },

  // return a new Tint that has been color shifted in
  // one or more of the hswl dimensions
  shift: function (attrs) {
    attrs = attrs || {};
    return new Tint(Tint.normalize({
      h: Tint.validateAttr(attrs.h, 0) + this.h,
      s: Tint.validateAttr(attrs.s, 0) + this.s,
      wl: Tint.validateAttr(attrs.wl, 0) + this.wl
    }));
  },

  // return a new Tint that mixes the colors of the current Tint and
  // either a second Tint object or itself with altered attributes.
  // Use amount [0, 100] to control the percentage strength of the blend
  // color
  blend: function (tintOrSetOpts, amount) {
    var blendTint;
    if (typeof amount === 'undefined') {
      amount = 50;
    }
    if (tintOrSetOpts instanceof Tint) {
      blendTint = tintOrSetOpts;
    } else {
      blendTint = this.set(tintOrSetOpts);
    }
    return new Tint(tc.mix(this.tiny, blendTint.tiny, amount));
  },

  // create a 2d slice of the color solid with this color at the origin
  // and varying two other attributes
  colorslice: function (n) {
    var slice = new Array(n);
    var satChange, lumChange;
    for (var i = 0; i < n; i++) {
      slice[i] = new Array(n);
      lumChange = 0.8 * Tint.indexToPercentage(i, n);
      for (var j = 0; j < n; j++) {
        satChange = 0.9 * Tint.indexToPercentage(j, n);
        slice[i][j] = new Tint({
          h: this.h,
          s: Tint.adjustAttr(this.s, satChange),
          wl: Tint.adjustAttr(this.wl, lumChange)
        });
      }
    }
    return slice;
  },

  toStr: function () {
    return this.tiny.toHexString();
  }
};

// adjust an attribute by a set percentage on the color solid
// Tint.adjustAttr(0.5, 0.5) => 0.75
// Tint.adjustAttr(0.3, 0.1) => 0.33
// Tint.adjustAttr(0.5, -0.5) => 0.25
// Tint.adjustAttr(0.4, 1) => 1
// Tint.adjustAttr(0.4, -1 => 0
Tint.adjustAttr = function(attr, percent) {
  if (percent < 0) {
    return attr * (1 + percent);
  } else {
    return attr + percent * (1 - attr);
  }
};

// replace undefined values with the fallback
Tint.validateAttr = function(attr, fallback) {
  return typeof attr === 'undefined' ? fallback : attr;
};

// clamp the hswl attributes to valid values
Tint.normalize = function(hswl) {
  hswl = hswl || {};
  return {
    h: Tint.normalizeHue(hswl.h),
    s: Tint.normalize01(hswl.s),
    wl: Tint.normalize01(hswl.wl)
  };
};

// cyclically map any hue input (negative too!) to [0, 360]
//   120 => 120
//   375 => 15
//   -42 => 318
Tint.normalizeHue = function(hue) {
  return (((hue || 0) % -360) + 360) % 360;
};

// clamp saturation or luminance to valid range [0, 1]
Tint.normalize01 = function(attr) {
  return Math.max(0, Math.min((attr || 0), 1));
};

// convert an array index to a percentage of total
//   returns [-1,1], with 0 representing the origin
Tint.indexToPercentage = function(idx, total) {
  return ((idx * 2.0) / (total - 1)) - 1;
};

module.exports = Tint;
